"""Tests for sf6_gateway against a fake Forgejo. Run: python3 -m unittest -v test_sf6_gateway"""

from __future__ import annotations

import json
import os
import re
import shutil
import tempfile
import threading
import time
import unittest
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import sf6_gateway as gw

SHA = "c0ffee" * 6 + "abcd"
VIDEO = bytes(range(256)) * 400  # 102 400 bytes
FILES = {
    "README.md": b"# sf6-learn\n\nBienvenue.\n",
    "Viper/Combos.md": b"## BnB\n\n![[seism.webm]]\n",
    "Viper/media/seism.webm": VIDEO,
    "Viper/media/frame.png": b"\x89PNG fake",
    "Viper/evil.html": b"<script>alert(1)</script>",
    ".obsidian/workspace.json": b"{}",
    "private/secret.md": b"nope",
}
TOKEN = "forgejo-read-token"


def tree_items():
    dirs, items = set(), []
    for path, data in FILES.items():
        parts = path.split("/")
        for i in range(1, len(parts)):
            dirs.add("/".join(parts[:i]))
        items.append({"path": path, "type": "blob", "mode": "100644", "size": len(data)})
    items += [{"path": d, "type": "tree", "mode": "040000"} for d in dirs]
    items.append({"path": "link.md", "type": "blob", "mode": "120000", "size": 9})
    return sorted(items, key=lambda x: x["path"])


class FakeForgejo(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    calls: list[str] = []

    def log_message(self, *a):
        pass

    def reply(self, status, body: bytes, ctype="application/json", headers=None):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        url = urllib.parse.urlsplit(self.path)
        q = urllib.parse.parse_qs(url.query)
        type(self).calls.append(url.path)
        if self.headers.get("Authorization") != f"token {TOKEN}":
            return self.reply(401, b'{"message":"token"}')
        base = "/api/v1/repos/femto/sf6-learn"
        if url.path == base:
            return self.reply(200, json.dumps({"name": "sf6-learn", "full_name": "femto/sf6-learn", "description": "Notes SF6", "default_branch": "main"}).encode())
        if url.path == f"{base}/branches/main":
            return self.reply(200, json.dumps({"name": "main", "commit": {"id": SHA, "timestamp": "2026-10-20T10:00:00Z"}}).encode())
        if url.path == f"{base}/git/trees/{SHA}":
            items = tree_items()
            per, page = 4, int(q["page"][0])  # small pages to exercise pagination
            chunk = items[(page - 1) * per : page * per]
            return self.reply(200, json.dumps({"sha": SHA, "tree": chunk, "truncated": page * per < len(items), "page": page, "total_count": len(items)}).encode())
        if url.path.startswith(f"{base}/media/"):
            assert q.get("ref") == [SHA]
            path = urllib.parse.unquote(url.path[len(f"{base}/media/") :])
            data = FILES.get(path)
            if data is None:
                return self.reply(404, b'{"message":"not found"}')
            rng = self.headers.get("Range")
            if rng:
                m = re.fullmatch(r"bytes=(\d+)-(\d*)", rng)
                start, end = int(m[1]), int(m[2] or len(data) - 1)
                if start >= len(data):
                    return self.reply(416, b"", headers={"Content-Range": f"bytes */{len(data)}"})
                return self.reply(206, data[start : end + 1], "application/octet-stream", {"Content-Range": f"bytes {start}-{end}/{len(data)}", "Accept-Ranges": "bytes"})
            return self.reply(200, data, "application/octet-stream")
        self.reply(404, b"{}")


def serve(handler):
    srv = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


class GatewayTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fj = serve(FakeForgejo)
        cls.tmp = tempfile.mkdtemp()
        os.environ.pop("SF6_SECRET", None)
        cls.cfg = gw.Config(
            forgejo_url=f"http://127.0.0.1:{cls.fj.server_port}",
            forgejo_token=TOKEN,
            repo="femto/sf6-learn",
            ref=None,
            origins=frozenset({"https://leoazzopardi.org"}),
            host="127.0.0.1",
            port=0,
            data_dir=cls.tmp,
            exclude=frozenset({"private"}),
            media_ttl=3600,
            trusted_proxies=frozenset({"127.0.0.1"}),
            theme_file=os.path.join(cls.tmp, "web-theme.json"),
        )
        cls.app = gw.App(cls.cfg)
        cls.srv = gw.make_server(cls.app)
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        cls.base = f"http://127.0.0.1:{cls.srv.server_port}"
        cls.key, cls.rec = cls.app.keys.add("Alex", None)

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()
        cls.fj.shutdown()
        shutil.rmtree(cls.tmp)

    def setUp(self):
        self.app.limiter = gw.FailureLimiter()

    def get(self, path, key=None, headers=None, method="GET"):
        h = dict(headers or {})
        if key:
            h["Authorization"] = f"Bearer {key}"
        req = urllib.request.Request(self.base + path, headers=h, method=method)
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        try:
            with opener.open(req, timeout=10) as r:
                return r.status, dict(r.headers), r.read()
        except urllib.error.HTTPError as e:
            return e.code, dict(e.headers), e.read()

    def session(self):
        status, _, body = self.get("/v1/session", self.key)
        self.assertEqual(status, 200, body)
        return json.loads(body)

    # ---- keys

    def test_key_is_stored_hashed_and_private(self):
        raw = open(self.cfg.keys_file).read()
        self.assertNotIn(self.key, raw)
        self.assertIn(gw.KeyStore.digest(self.key), raw)
        self.assertEqual(os.stat(self.cfg.keys_file).st_mode & 0o777, 0o600)
        self.assertRegex(self.key, r"^sf6_[0-9a-f]{8}_[A-Za-z0-9-]{40}$")

    def test_missing_wrong_and_malformed_keys(self):
        for key in (None, "sf6_00000000_nope", self.key[:-1] + "Q", "garbage", f"{self.key}_x"):
            status, headers, _ = self.get("/v1/session", key)
            self.assertEqual(status, 401, key)
            self.assertIn("Bearer", headers.get("WWW-Authenticate", ""))

    def test_revoked_and_expired_keys(self):
        k2, r2 = self.app.keys.add("Temp", None)
        self.assertEqual(self.get("/v1/session", k2)[0], 200)
        time.sleep(0.01)
        self.app.keys.revoke(r2["id"])
        self.assertEqual(self.get("/v1/session", k2)[0], 401)
        k3, _ = self.app.keys.add("Old", "2020-01-01")
        self.assertEqual(self.get("/v1/session", k3)[0], 401)

    def test_bruteforce_is_throttled(self):
        for _ in range(10):
            self.get("/v1/session", "sf6_00000000_bad")
        status, headers, _ = self.get("/v1/session", self.key)
        self.assertEqual(status, 429)
        self.assertIn("Retry-After", headers)

    # ---- api

    def test_session(self):
        s = self.session()
        self.assertEqual(s["key"]["label"], "Alex")
        self.assertEqual(s["repo"]["commit"], SHA)
        self.assertEqual(s["repo"]["ref"], "main")
        self.assertTrue(s["media"]["token"].startswith(self.rec["id"] + "."))

    def test_index_paginates_and_hides(self):
        status, headers, body = self.get("/v1/index", self.key)
        self.assertEqual(status, 200)
        paths = {e["path"] for e in json.loads(body)["entries"]}
        self.assertIn("Viper/media/seism.webm", paths)
        self.assertIn("Viper", paths)
        for hidden in (".obsidian", ".obsidian/workspace.json", "private", "private/secret.md", "link.md"):
            self.assertNotIn(hidden, paths)
        self.assertEqual(headers["ETag"], f'"{SHA}"')

    def test_file_with_bearer(self):
        status, headers, body = self.get("/v1/files/README.md", self.key)
        self.assertEqual(status, 200)
        self.assertEqual(body, FILES["README.md"])
        self.assertTrue(headers["Content-Type"].startswith("text/markdown"))
        self.assertIn("sandbox", headers["Content-Security-Policy"])

    def test_media_with_signed_token_and_range(self):
        t = self.session()["media"]["token"]
        status, headers, body = self.get(f"/v1/files/Viper/media/seism.webm?t={t}", headers={"Range": "bytes=100-199"})
        self.assertEqual(status, 206)
        self.assertEqual(body, VIDEO[100:200])
        self.assertEqual(headers["Content-Range"], f"bytes 100-199/{len(VIDEO)}")
        self.assertEqual(headers["Content-Type"], "video/webm")
        status, _, body = self.get(f"/v1/files/Viper/media/seism.webm?t={t}")
        self.assertEqual((status, len(body)), (200, len(VIDEO)))
        status, headers, _ = self.get(f"/v1/files/Viper/media/seism.webm?t={t}", headers={"Range": "bytes=999999-"})
        self.assertEqual(status, 416)

    def test_bad_tokens(self):
        t = self.session()["media"]["token"]
        kid, exp, sig = t.split(".")
        for bad in (f"{kid}.{int(exp) + 1}.{sig}", f"{kid}.{exp}.{sig[:-2]}AA", "x.y.z", f"{kid}.1.{sig}"):
            self.assertEqual(self.get(f"/v1/files/README.md?t={bad}")[0], 401, bad)
        expired, _ = gw.MediaSigner(self.app.signer.secret, -10).issue(kid)
        self.assertEqual(self.get(f"/v1/files/README.md?t={expired}")[0], 401)

    def test_revoking_key_kills_its_media_links(self):
        k, r = self.app.keys.add("Media", None)
        t = json.loads(self.get("/v1/session", k)[2])["media"]["token"]
        self.assertEqual(self.get(f"/v1/files/README.md?t={t}")[0], 200)
        time.sleep(0.01)
        self.app.keys.revoke(r["id"])
        self.assertEqual(self.get(f"/v1/files/README.md?t={t}")[0], 401)

    def test_paths_outside_the_published_set(self):
        for p in ("../etc/passwd", "Viper/../README.md", ".obsidian/workspace.json", "private/secret.md", "nope.md", "Viper//Combos.md", "%2e%2e/x"):
            status = self.get(f"/v1/files/{p}", self.key)[0]
            self.assertIn(status, (400, 404), p)

    def test_active_content_is_defused(self):
        status, headers, _ = self.get("/v1/files/Viper/evil.html", self.key)
        self.assertEqual(status, 200)
        self.assertTrue(headers["Content-Type"].startswith("text/plain"))

    def test_cors(self):
        status, headers, _ = self.get("/v1/session", headers={"Origin": "https://leoazzopardi.org", "Access-Control-Request-Method": "GET"}, method="OPTIONS")
        self.assertEqual(status, 204)
        self.assertEqual(headers["Access-Control-Allow-Origin"], "https://leoazzopardi.org")
        self.assertIn("Authorization", headers["Access-Control-Allow-Headers"])
        _, headers, _ = self.get("/v1/health", headers={"Origin": "https://evil.example"})
        self.assertNotIn("Access-Control-Allow-Origin", headers)

    def test_theme_is_public_and_filtered(self):
        with open(self.cfg.theme_file, "w") as f:
            json.dump({"bg": "#100D0D", "accent": "#dfbfbb", "fg": "red", "evil": "#000000", "danger": "#fff; x"}, f)
        status, headers, body = self.get("/v1/theme", headers={"Origin": "https://leoazzopardi.org"})
        self.assertEqual(status, 200, body)
        self.assertEqual(json.loads(body)["colors"], {"bg": "#100d0d", "accent": "#dfbfbb"})
        self.assertEqual(headers["Access-Control-Allow-Origin"], "https://leoazzopardi.org")
        with open(self.cfg.theme_file, "w") as f:
            f.write("not json")
        self.assertEqual(self.get("/v1/theme")[0], 404)
        os.remove(self.cfg.theme_file)
        self.assertEqual(self.get("/v1/theme")[0], 404)

    def test_snapshot_is_cached(self):
        self.get("/v1/index", self.key)
        FakeForgejo.calls.clear()
        for _ in range(3):
            self.get("/v1/index", self.key)
        self.assertEqual(sum("/git/trees/" in c for c in FakeForgejo.calls), 0)

    def test_bad_forgejo_token(self):
        cfg = gw.Config(**{**self.cfg.__dict__, "forgejo_token": "wrong"})
        app = gw.App(cfg)
        app.keys = self.app.keys
        srv = gw.make_server(app)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        try:
            req = urllib.request.Request(f"http://127.0.0.1:{srv.server_port}/v1/session", headers={"Authorization": f"Bearer {self.key}"})
            with self.assertRaises(urllib.error.HTTPError) as cm:
                urllib.request.build_opener(urllib.request.ProxyHandler({})).open(req, timeout=10)
            self.assertEqual(cm.exception.code, 502)
            self.assertEqual(json.loads(cm.exception.read())["error"], "upstream_auth")
        finally:
            srv.shutdown()


if __name__ == "__main__":
    unittest.main()
