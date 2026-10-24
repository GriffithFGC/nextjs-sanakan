#!/usr/bin/env python3
"""sf6-gateway: a read-only, key-protected window onto one Forgejo repository.

The portfolio (leoazzopardi.org/sf6-learn) is a static site, so it cannot hold a Forgejo
token or reach a forge that only listens on the tailnet. This service sits next to
Forgejo and does three things for the page:

  * checks access keys (``sf6_…``), stored hashed and revocable, like GitHub tokens;
  * lists the repository and serves its files, LFS media included, through a Forgejo
    token that only needs ``read:repository``;
  * streams media with HTTP Range support, so videos seek, and signs short-lived media
    URLs because <img> and <video> cannot send an Authorization header.

Standard library only (Python 3.11+): copy the file, set a few variables, run it.

    python3 sf6_gateway.py check                 # can we read the repository?
    python3 sf6_gateway.py keys add --label Alex # prints the key once
    python3 sf6_gateway.py keys list
    python3 sf6_gateway.py keys revoke 1a2b3c4d
    python3 sf6_gateway.py serve

Configuration (environment):
  SF6_FORGEJO_URL      Forgejo base URL as seen from here, e.g. http://127.0.0.1:3000
  SF6_FORGEJO_TOKEN    Forgejo access token, scope read:repository
  SF6_REPO             owner/name of the repository, e.g. femto/sf6-learn
  SF6_REF              branch to publish (default: the repository's default branch)
  SF6_ALLOWED_ORIGINS  comma-separated origins allowed to call the API
                       (default: https://leoazzopardi.org)
  SF6_LISTEN           host:port to bind (default: 127.0.0.1:8787)
  SF6_DATA_DIR         where keys.json and the signing secret live (default: ./data)
  SF6_EXCLUDE          extra comma-separated names to hide (dot-files are always hidden)
  SF6_MEDIA_TTL        lifetime of signed media URLs, in seconds (default: 21600)
  SF6_TRUSTED_PROXIES  peers whose X-Forwarded-For is believed (default: 127.0.0.1,::1)
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import hmac
import json
import mimetypes
import os
import secrets
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import deque
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

VERSION = "1.0.0"
KEY_PREFIX = "sf6_"
CHUNK = 64 * 1024

# Types the standard table misses or gets wrong for a notes-and-media repository.
EXTRA_TYPES = {
    ".md": "text/markdown; charset=utf-8",
    ".markdown": "text/markdown; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".csv": "text/csv; charset=utf-8",
    ".json": "application/json",
    ".canvas": "application/json",
    ".excalidraw": "application/json",
    ".webm": "video/webm",
    ".mp4": "video/mp4",
    ".m4v": "video/mp4",
    ".mov": "video/quicktime",
    ".mkv": "video/x-matroska",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".svg": "image/svg+xml",
    ".m4a": "audio/mp4",
    ".opus": "audio/ogg",
    ".ogg": "audio/ogg",
    ".flac": "audio/flac",
    ".pdf": "application/pdf",
}
# Never hand a browser something it would execute in the gateway's origin.
ACTIVE_TYPES = ("text/html", "application/xhtml+xml", "text/javascript", "application/javascript", "application/xml", "text/xml")
# Media responses may be opened directly: give them nothing to run with.
MEDIA_CSP = "default-src 'none'; img-src data:; style-src 'unsafe-inline'; media-src 'self'; sandbox"


def content_type(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    ctype = EXTRA_TYPES.get(ext) or mimetypes.guess_type(path)[0] or "application/octet-stream"
    if ctype.split(";")[0] in ACTIVE_TYPES:
        return "text/plain; charset=utf-8"
    return ctype


def now() -> float:
    return time.time()


def iso(ts: float) -> str:
    return datetime.fromtimestamp(ts, timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


# --------------------------------------------------------------------------- config


@dataclass
class Config:
    forgejo_url: str
    forgejo_token: str
    repo: str
    ref: str | None
    origins: frozenset[str]
    host: str
    port: int
    data_dir: str
    exclude: frozenset[str]
    media_ttl: int
    trusted_proxies: frozenset[str]

    @property
    def keys_file(self) -> str:
        return os.path.join(self.data_dir, "keys.json")

    @property
    def secret_file(self) -> str:
        return os.path.join(self.data_dir, "secret")

    @classmethod
    def from_env(cls, need_forgejo: bool = True) -> "Config":
        env = os.environ
        missing = [n for n in ("SF6_FORGEJO_URL", "SF6_FORGEJO_TOKEN", "SF6_REPO") if need_forgejo and not env.get(n)]
        if missing:
            raise SystemExit(f"missing configuration: {', '.join(missing)} (see the top of {os.path.basename(__file__)})")
        repo = env.get("SF6_REPO", "")
        if need_forgejo and repo.count("/") != 1:
            raise SystemExit("SF6_REPO must look like owner/name")
        listen = env.get("SF6_LISTEN", "127.0.0.1:8787")
        host, _, port = listen.rpartition(":")
        split = lambda v: frozenset(x.strip() for x in v.split(",") if x.strip())  # noqa: E731
        return cls(
            forgejo_url=env.get("SF6_FORGEJO_URL", "").rstrip("/"),
            forgejo_token=env.get("SF6_FORGEJO_TOKEN", ""),
            repo=repo,
            ref=env.get("SF6_REF") or None,
            origins=split(env.get("SF6_ALLOWED_ORIGINS", "https://leoazzopardi.org")),
            host=host.strip("[]") or "127.0.0.1",
            port=int(port or 8787),
            data_dir=env.get("SF6_DATA_DIR", "data"),
            exclude=split(env.get("SF6_EXCLUDE", "")),
            media_ttl=int(env.get("SF6_MEDIA_TTL", "21600")),
            trusted_proxies=split(env.get("SF6_TRUSTED_PROXIES", "127.0.0.1,::1")),
        )


def write_private(path: str, data: bytes) -> None:
    """Atomic write, readable by the owner only."""
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    tmp = f"{path}.{os.getpid()}.tmp"
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "wb") as f:
        f.write(data)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)


def load_secret(path: str) -> bytes:
    if env := os.environ.get("SF6_SECRET"):
        return env.encode()
    try:
        with open(path, "rb") as f:
            secret = f.read().strip()
        if len(secret) >= 32:
            return secret
    except FileNotFoundError:
        pass
    secret = b64url(secrets.token_bytes(32)).encode()
    write_private(path, secret + b"\n")
    return secret


# --------------------------------------------------------------------------- keys


class KeyStore:
    """Access keys: shown once, stored as a SHA-256 digest, revocable without a restart.

    A key reads ``sf6_<id>_<secret>``; the id finds the record, the digest proves it.
    The file is re-read whenever it changes on disk, so `keys revoke` takes effect at once.
    """

    def __init__(self, path: str):
        self.path = path
        self._lock = threading.Lock()
        self._stamp: int | None = None
        self._keys: dict[str, dict] = {}

    def _load(self) -> None:
        try:
            stamp = os.stat(self.path).st_mtime_ns
        except FileNotFoundError:
            self._keys, self._stamp = {}, None
            return
        if stamp == self._stamp:
            return
        with open(self.path, encoding="utf-8") as f:
            data = json.load(f)
        self._keys = {k["id"]: k for k in data.get("keys", [])}
        self._stamp = stamp

    def _save(self) -> None:
        body = json.dumps({"keys": list(self._keys.values())}, indent=2, ensure_ascii=False) + "\n"
        write_private(self.path, body.encode("utf-8"))
        self._stamp = None

    @staticmethod
    def digest(presented: str) -> str:
        return "sha256:" + hashlib.sha256(presented.encode("utf-8")).hexdigest()

    @staticmethod
    def usable(rec: dict) -> bool:
        if rec.get("revoked"):
            return False
        exp = rec.get("expires")
        return not exp or date.fromisoformat(exp) >= datetime.now(timezone.utc).date()

    def verify(self, presented: str) -> dict | None:
        parts = presented.split("_")
        if len(parts) != 3 or f"{parts[0]}_" != KEY_PREFIX or len(parts[1]) != 8:
            return None
        with self._lock:
            self._load()
            rec = self._keys.get(parts[1])
        if not rec or not hmac.compare_digest(rec["hash"], self.digest(presented)):
            return None
        return rec if self.usable(rec) else None

    def active(self, key_id: str) -> dict | None:
        with self._lock:
            self._load()
            rec = self._keys.get(key_id)
        return rec if rec and self.usable(rec) else None

    def add(self, label: str, expires: str | None) -> tuple[str, dict]:
        if expires:
            date.fromisoformat(expires)  # fail early on a bad date
        with self._lock:
            self._load()
            key_id = secrets.token_hex(4)
            while key_id in self._keys:
                key_id = secrets.token_hex(4)
            presented = f"{KEY_PREFIX}{key_id}_{b64url(secrets.token_bytes(30)).replace('_', 'x')}"
            rec = {"id": key_id, "label": label, "hash": self.digest(presented), "created": iso(now()), "expires": expires, "revoked": False}
            self._keys[key_id] = rec
            self._save()
        return presented, rec

    def revoke(self, key_id: str) -> bool:
        with self._lock:
            self._load()
            if key_id not in self._keys:
                return False
            self._keys[key_id]["revoked"] = True
            self._save()
        return True

    def all(self) -> list[dict]:
        with self._lock:
            self._load()
            return list(self._keys.values())


class MediaSigner:
    """Short-lived tokens for media URLs, tied to a key so revoking the key revokes them."""

    def __init__(self, secret: bytes, ttl: int):
        self.secret, self.ttl = secret, ttl

    def _sig(self, payload: str) -> str:
        return b64url(hmac.new(self.secret, payload.encode(), hashlib.sha256).digest())

    def issue(self, key_id: str) -> tuple[str, int]:
        exp = int(now()) + self.ttl
        payload = f"{key_id}.{exp}"
        return f"{payload}.{self._sig(payload)}", exp

    def check(self, token: str) -> str | None:
        parts = token.split(".")
        if len(parts) != 3 or not parts[1].isdigit():
            return None
        payload = f"{parts[0]}.{parts[1]}"
        if not hmac.compare_digest(parts[2], self._sig(payload)) or int(parts[1]) < now():
            return None
        return parts[0]


# --------------------------------------------------------------------------- forgejo


class UpstreamError(Exception):
    def __init__(self, status: int, message: str = ""):
        super().__init__(message or f"forgejo answered {status}")
        self.status = status


@dataclass
class Snapshot:
    commit: str
    updated: str | None
    entries: list[dict]
    files: dict[str, int] = field(default_factory=dict)


class Forgejo:
    """The few Forgejo API calls the gateway needs, cached by commit."""

    def __init__(self, cfg: Config, ttl: float = 30.0):
        self.cfg = cfg
        self.owner, self.name = cfg.repo.split("/")
        self.ttl = ttl
        # Forgejo is reached directly (tailnet or localhost), never through an HTTP proxy.
        self.opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        self._lock = threading.Lock()
        self._info: tuple[float, dict] | None = None
        self._head: tuple[float, tuple[str, str | None]] | None = None
        self._snapshots: dict[str, Snapshot] = {}

    def _open(self, path: str, query: dict | None = None, headers: dict | None = None, timeout: float = 20):
        url = f"{self.cfg.forgejo_url}/api/v1/repos/{self.owner}/{self.name}{path}"
        if query:
            url += "?" + urllib.parse.urlencode(query)
        req = urllib.request.Request(url, headers={"Authorization": f"token {self.cfg.forgejo_token}", "Accept": "application/json", **(headers or {})})
        try:
            return self.opener.open(req, timeout=timeout)
        except urllib.error.HTTPError as e:
            raise UpstreamError(e.code, e.read(512).decode("utf-8", "replace")) from None
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            raise UpstreamError(503, f"forgejo unreachable: {e}") from None

    def _json(self, path: str, query: dict | None = None):
        with self._open(path, query) as resp:
            return json.load(resp)

    def info(self) -> dict:
        with self._lock:
            if self._info and now() - self._info[0] < self.ttl:
                return self._info[1]
        info = self._json("")
        with self._lock:
            self._info = (now(), info)
        return info

    def head(self) -> tuple[str, str | None]:
        """(commit sha, commit date) of the published branch."""
        with self._lock:
            if self._head and now() - self._head[0] < self.ttl:
                return self._head[1]
        branch = self.cfg.ref or self.info().get("default_branch") or "main"
        data = self._json(f"/branches/{urllib.parse.quote(branch, safe='')}")
        commit = data.get("commit") or {}
        head = (commit["id"], commit.get("timestamp"))
        with self._lock:
            self._head = (now(), head)
        return head

    def hidden(self, path: str) -> bool:
        return any(seg.startswith(".") or seg in self.cfg.exclude for seg in path.split("/"))

    def snapshot(self) -> Snapshot:
        commit, updated = self.head()
        with self._lock:
            if commit in self._snapshots:
                return self._snapshots[commit]
        raw: list[dict] = []
        page = 1
        while page <= 100:
            data = self._json(f"/git/trees/{commit}", {"recursive": "true", "per_page": 1000, "page": page})
            items = data.get("tree") or []
            raw.extend(items)
            total = data.get("total_count")
            if not items or (total is not None and len(raw) >= total) or (total is None and not data.get("truncated")):
                break
            page += 1
        entries, files = [], {}
        for item in raw:
            path, kind, mode = item.get("path", ""), item.get("type"), str(item.get("mode", ""))
            if not path or self.hidden(path) or mode == "120000":  # skip hidden paths and symlinks
                continue
            if kind == "tree":
                entries.append({"path": path, "type": "dir"})
            elif kind == "blob":
                size = int(item.get("size") or 0)
                entries.append({"path": path, "type": "file", "size": size})
                files[path] = size
        entries.sort(key=lambda e: e["path"].lower())
        snap = Snapshot(commit, updated, entries, files)
        with self._lock:
            if len(self._snapshots) >= 4:
                self._snapshots.pop(next(iter(self._snapshots)))
            self._snapshots[commit] = snap
        return snap

    def blob(self, commit: str, path: str, range_header: str | None):
        # /media serves Git LFS objects as well as plain blobs.
        quoted = urllib.parse.quote(path, safe="/")
        headers = {"Accept": "*/*"}
        if range_header:
            headers["Range"] = range_header
        return self._open(f"/media/{quoted}", {"ref": commit}, headers, timeout=60)


# --------------------------------------------------------------------------- http


class FailureLimiter:
    """Slows down key guessing: too many bad keys from one address earns a pause."""

    def __init__(self, limit: int = 10, window: float = 600.0):
        self.limit, self.window = limit, window
        self._hits: dict[str, deque] = {}
        self._lock = threading.Lock()

    def _trim(self, ip: str) -> deque:
        q = self._hits.setdefault(ip, deque())
        while q and now() - q[0] > self.window:
            q.popleft()
        return q

    def blocked(self, ip: str) -> int:
        with self._lock:
            q = self._trim(ip)
            return int(self.window - (now() - q[0])) + 1 if len(q) >= self.limit else 0

    def fail(self, ip: str) -> None:
        with self._lock:
            self._trim(ip).append(now())
            if len(self._hits) > 10_000:  # forget the oldest addresses rather than grow forever
                for k in list(self._hits)[:5_000]:
                    del self._hits[k]


class App:
    def __init__(self, cfg: Config, forgejo: Forgejo | None = None):
        self.cfg = cfg
        self.keys = KeyStore(cfg.keys_file)
        self.signer = MediaSigner(load_secret(cfg.secret_file), cfg.media_ttl)
        self.forgejo = forgejo or Forgejo(cfg)
        self.limiter = FailureLimiter()


class Handler(BaseHTTPRequestHandler):
    server_version = f"sf6-gateway/{VERSION}"
    sys_version = ""
    protocol_version = "HTTP/1.1"
    app: App  # set by make_server

    # ---- plumbing

    def log_message(self, fmt, *args):  # silence the default access log
        pass

    def _log(self, status: int, key_id: str | None = None):
        path = urllib.parse.urlsplit(self.path).path  # never log query strings: they carry tokens
        sys.stderr.write(f"{iso(now())} {self.client_ip()} {self.command} {path} {status} {key_id or '-'} {int((time.monotonic() - self._t0) * 1000)}ms\n")

    def client_ip(self) -> str:
        peer = self.client_address[0]
        fwd = self.headers.get("X-Forwarded-For")
        if fwd and peer in self.app.cfg.trusted_proxies:
            return fwd.split(",")[0].strip()
        return peer

    def _cors(self) -> None:
        origin = self.headers.get("Origin")
        if origin and origin in self.app.cfg.origins:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Expose-Headers", "Content-Length, Content-Range, ETag")
        self.send_header("Vary", "Origin")

    def _common(self) -> None:
        self._cors()
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Cross-Origin-Resource-Policy", "cross-origin")

    def send_json(self, status: int, body: dict, key_id: str | None = None, headers: dict | None = None) -> None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self._common()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(data)
        self._log(status, key_id)

    def error(self, status: int, code: str, message: str, key_id: str | None = None, headers: dict | None = None) -> None:
        self.send_json(status, {"error": code, "message": message}, key_id, headers)

    # ---- auth

    def bearer(self) -> dict | None:
        """The key record behind `Authorization: Bearer sf6_…`, or None after answering."""
        ip = self.client_ip()
        if wait := self.app.limiter.blocked(ip):
            self.error(429, "too_many_attempts", "Trop de clés refusées, réessaie plus tard.", headers={"Retry-After": str(wait)})
            return None
        auth = self.headers.get("Authorization", "")
        scheme, _, presented = auth.partition(" ")
        rec = self.app.keys.verify(presented.strip()) if scheme.lower() in ("bearer", "token") else None
        if not rec:
            if auth:
                self.app.limiter.fail(ip)
            self.error(401, "unauthorized", "Clé d'accès absente, invalide, expirée ou révoquée.", headers={"WWW-Authenticate": 'Bearer realm="sf6-learn"'})
            return None
        return rec

    # ---- verbs

    def do_OPTIONS(self):
        self._t0 = time.monotonic()
        self.send_response(204)
        self._cors()
        if self.headers.get("Origin") in self.app.cfg.origins:
            self.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Authorization, Range")
            self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Content-Length", "0")
        self.end_headers()
        self._log(204)

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        self._t0 = time.monotonic()
        url = urllib.parse.urlsplit(self.path)
        try:
            if url.path == "/v1/health":
                return self.send_json(200, {"ok": True, "version": VERSION})
            if url.path == "/v1/session":
                return self.session()
            if url.path == "/v1/index":
                return self.index()
            if url.path.startswith("/v1/files/"):
                return self.files(url)
            self.error(404, "not_found", "Route inconnue.")
        except UpstreamError as e:
            sys.stderr.write(f"upstream: {e}\n")
            if e.status == 404:
                self.error(404, "not_found", "Introuvable dans le dépôt.")
            elif e.status in (401, 403):
                self.error(502, "upstream_auth", "La passerelle n'a pas accès au dépôt (jeton Forgejo).")
            else:
                self.error(502, "upstream", "Forgejo ne répond pas.")
        except (BrokenPipeError, ConnectionResetError):
            self.close_connection = True

    def session(self):
        rec = self.bearer()
        if not rec:
            return
        info = self.app.forgejo.info()
        commit, updated = self.app.forgejo.head()
        token, exp = self.app.signer.issue(rec["id"])
        self.send_json(
            200,
            {
                "key": {"id": rec["id"], "label": rec.get("label"), "expires": rec.get("expires")},
                "repo": {
                    "name": info.get("name"),
                    "fullName": info.get("full_name"),
                    "description": info.get("description") or "",
                    "ref": self.app.cfg.ref or info.get("default_branch"),
                    "commit": commit,
                    "updated": updated,
                },
                "media": {"token": token, "expires": exp},
            },
            rec["id"],
        )

    def index(self):
        rec = self.bearer()
        if not rec:
            return
        snap = self.app.forgejo.snapshot()
        self.send_json(200, {"commit": snap.commit, "updated": snap.updated, "entries": snap.entries}, rec["id"], {"ETag": f'"{snap.commit}"'})

    def files(self, url: urllib.parse.SplitResult):
        # Either the Authorization header (fetch) or a signed ?t= (img, video, audio, iframe).
        token = urllib.parse.parse_qs(url.query).get("t", [None])[0]
        if token:
            key_id = self.app.signer.check(token)
            if not key_id or not self.app.keys.active(key_id):
                return self.error(401, "expired_link", "Lien média expiré ou révoqué, recharge la page.")
        else:
            rec = self.bearer()
            if not rec:
                return
            key_id = rec["id"]

        path = urllib.parse.unquote(url.path[len("/v1/files/"):])
        segs = path.split("/")
        if not path or "\x00" in path or any(s in ("", ".", "..") for s in segs):
            return self.error(400, "bad_path", "Chemin invalide.", key_id)
        snap = self.app.forgejo.snapshot()
        if path not in snap.files:  # hidden, excluded or absent: all look the same from outside
            return self.error(404, "not_found", "Introuvable dans le dépôt.", key_id)

        try:
            upstream = self.app.forgejo.blob(snap.commit, path, self.headers.get("Range"))
        except UpstreamError as e:
            if e.status == 416:
                return self.error(416, "bad_range", "Plage demandée invalide.", key_id, {"Content-Range": f"bytes */{snap.files[path]}"})
            raise
        with upstream:
            status = upstream.status
            length = upstream.headers.get("Content-Length")
            self.send_response(status)
            self._common()
            self.send_header("Content-Type", content_type(path))
            if length is not None:
                self.send_header("Content-Length", length)
            else:
                self.close_connection = True
            if cr := upstream.headers.get("Content-Range"):
                self.send_header("Content-Range", cr)
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("ETag", f'"{snap.commit[:16]}-{hashlib.sha1(path.encode()).hexdigest()[:12]}"')
            self.send_header("Cache-Control", "private, max-age=300")
            name = urllib.parse.quote(segs[-1])
            self.send_header("Content-Disposition", f"inline; filename*=UTF-8''{name}")
            if not path.lower().endswith(".pdf"):  # Chrome refuses to show a PDF under `sandbox`
                self.send_header("Content-Security-Policy", MEDIA_CSP)
            self.end_headers()
            if self.command != "HEAD":
                while chunk := upstream.read(CHUNK):
                    self.wfile.write(chunk)
        self._log(status, key_id)


def make_server(app: App) -> ThreadingHTTPServer:
    handler = type("BoundHandler", (Handler,), {"app": app})
    server = ThreadingHTTPServer((app.cfg.host, app.cfg.port), handler)
    server.daemon_threads = True
    return server


# --------------------------------------------------------------------------- cli


def cmd_serve(_args) -> int:
    cfg = Config.from_env()
    server = make_server(App(cfg))
    sys.stderr.write(f"sf6-gateway {VERSION} on http://{cfg.host}:{cfg.port} → {cfg.forgejo_url} ({cfg.repo}); origins: {', '.join(sorted(cfg.origins))}\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


def cmd_check(_args) -> int:
    cfg = Config.from_env()
    fj = Forgejo(cfg)
    try:
        info = fj.info()
        commit, updated = fj.head()
        snap = fj.snapshot()
    except UpstreamError as e:
        print(f"✗ {e} (HTTP {e.status})")
        return 1
    size = sum(snap.files.values())
    print(f"✓ {info.get('full_name')} · branche {cfg.ref or info.get('default_branch')} · commit {commit[:10]} ({updated})")
    print(f"✓ {len(snap.files)} fichiers publiés, {size / 1e6:.1f} Mo (fichiers cachés exclus)")
    print(f"✓ {len(KeyStore(cfg.keys_file).all())} clé(s) dans {cfg.keys_file}")
    return 0


def cmd_keys(args) -> int:
    cfg = Config.from_env(need_forgejo=False)
    store = KeyStore(cfg.keys_file)
    if args.action == "add":
        presented, rec = store.add(args.label, args.expires)
        print(f"Clé créée pour « {rec['label']} » (id {rec['id']}{', expire le ' + rec['expires'] if rec['expires'] else ''}).")
        print("Elle ne sera plus jamais affichée :\n")
        print(f"    {presented}\n")
        return 0
    if args.action == "revoke":
        if store.revoke(args.id):
            print(f"Clé {args.id} révoquée.")
            return 0
        print(f"Aucune clé {args.id}.")
        return 1
    rows = store.all()
    if not rows:
        print("Aucune clé.")
    for r in rows:
        state = "révoquée" if r.get("revoked") else ("expirée" if not KeyStore.usable(r) else "active")
        print(f"{r['id']}  {state:<9} {r.get('created', '')[:10]}  exp. {r.get('expires') or '—':<10}  {r.get('label', '')}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="sf6_gateway", description="Read-only, key-protected gateway to one Forgejo repository.")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("serve", help="run the HTTP gateway").set_defaults(fn=cmd_serve)
    sub.add_parser("check", help="test the Forgejo connection and token").set_defaults(fn=cmd_check)
    keys = sub.add_parser("keys", help="manage access keys")
    ksub = keys.add_subparsers(dest="action", required=True)
    add = ksub.add_parser("add", help="create a key (printed once)")
    add.add_argument("--label", required=True, help="who the key is for")
    add.add_argument("--expires", help="last valid day, YYYY-MM-DD")
    ksub.add_parser("list", help="list keys")
    rev = ksub.add_parser("revoke", help="revoke a key by id")
    rev.add_argument("id")
    keys.set_defaults(fn=cmd_keys)
    args = parser.parse_args(argv)
    return args.fn(args)


if __name__ == "__main__":
    sys.exit(main())
