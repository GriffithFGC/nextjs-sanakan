// The repository as the page sees it: a flat list of paths from the gateway, plus the
// lookups Obsidian-style notes need (folder listings, [[wikilink]] resolution, search).

export type Entry = { path: string; type: "dir" | "file"; size?: number };
export type Kind = "markdown" | "excalidraw" | "image" | "video" | "audio" | "pdf" | "text" | "other";

const KINDS: Record<string, Kind> = {
  md: "markdown", markdown: "markdown",
  png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image", avif: "image", svg: "image", bmp: "image",
  mp4: "video", m4v: "video", webm: "video", mov: "video", mkv: "video", ogv: "video",
  mp3: "audio", m4a: "audio", ogg: "audio", opus: "audio", wav: "audio", flac: "audio",
  pdf: "pdf",
  txt: "text", csv: "text", json: "text", yml: "text", yaml: "text", toml: "text", log: "text", canvas: "text",
};

export const KIND_LABEL: Record<Kind, string> = {
  markdown: "Note", excalidraw: "Dessin", image: "Image", video: "Vidéo", audio: "Audio", pdf: "PDF", text: "Texte", other: "Fichier",
};

export const basename = (path: string) => path.slice(path.lastIndexOf("/") + 1);
export const dirname = (path: string) => (path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "");
export const extension = (path: string) => {
  const name = basename(path);
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
};

export function kindOf(path: string): Kind {
  const lower = path.toLowerCase();
  if (lower.endsWith(".excalidraw.md") || lower.endsWith(".excalidraw")) return "excalidraw";
  return KINDS[extension(path)] ?? "other";
}

/** Display name: notes and drawings lose their extension, like in Obsidian. */
export function title(path: string): string {
  const name = basename(path);
  if (/\.excalidraw(\.md)?$/i.test(name)) return name.replace(/\.excalidraw(\.md)?$/i, "");
  return /\.(md|markdown)$/i.test(name) ? name.replace(/\.(md|markdown)$/i, "") : name;
}

export function formatSize(bytes = 0): string {
  if (bytes < 1024) return `${bytes} o`;
  const units = ["Ko", "Mo", "Go"];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toLocaleString("fr-FR", { maximumFractionDigits: v < 10 ? 1 : 0 })} ${units[i]}`;
}

const fold = (s: string) => s.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
const collator = new Intl.Collator("fr", { numeric: true, sensitivity: "base" });

/** Resolves `a/./b/../c` against nothing above the root; null if it climbs out. */
export function normalize(path: string): string | null {
  const out: string[] = [];
  for (const seg of path.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") {
      if (!out.length) return null;
      out.pop();
    } else out.push(seg);
  }
  return out.join("/");
}

export class Vault {
  readonly files = new Map<string, Entry>();
  readonly dirs = new Set<string>([""]);
  private readonly kids = new Map<string, Entry[]>();
  private readonly byName = new Map<string, string[]>();

  constructor(entries: Entry[]) {
    for (const e of entries) {
      if (e.type === "dir") this.dirs.add(e.path);
      else this.files.set(e.path, e);
      // the gateway lists folders, but be robust to a listing that only has files
      let dir = dirname(e.path);
      while (dir && !this.dirs.has(dir)) {
        this.dirs.add(dir);
        dir = dirname(dir);
      }
    }
    for (const d of this.dirs) if (d) this.child(dirname(d), { path: d, type: "dir" });
    for (const f of this.files.values()) {
      this.child(dirname(f.path), f);
      for (const name of [basename(f.path), title(f.path)]) {
        const key = fold(name);
        const list = this.byName.get(key) ?? [];
        if (!list.includes(f.path)) list.push(f.path);
        this.byName.set(key, list);
      }
    }
    for (const list of this.kids.values()) list.sort((a, b) => (a.type === b.type ? collator.compare(basename(a.path), basename(b.path)) : a.type === "dir" ? -1 : 1));
  }

  private child(dir: string, e: Entry) {
    const list = this.kids.get(dir) ?? [];
    list.push(e);
    this.kids.set(dir, list);
  }

  /** A folder's content, minus the images Excalidraw exports next to its drawings (shown inside them). */
  children(dir: string): Entry[] {
    return (this.kids.get(dir) ?? []).filter((e) => {
      const m = /^(.*\.excalidraw)(?:\.md)?\.(svg|png)$/i.exec(e.path);
      return !(m && e.type === "file" && (this.files.has(`${m[1]}.md`) || this.files.has(m[1])));
    });
  }

  has(path: string) {
    return this.files.has(path);
  }

  /** The note that introduces a folder: README, index, or Obsidian's folder note. */
  folderNote(dir: string): string | null {
    const base = dir ? `${dir}/` : "";
    const candidates = ["README.md", "readme.md", "Readme.md", "index.md", "Index.md", dir ? `${basename(dir)}.md` : "Accueil.md"];
    return candidates.map((c) => base + c).find((p) => this.files.has(p)) ?? null;
  }

  /**
   * Obsidian's link resolution: exact path, then relative to the note, then the file with
   * that name closest to the note. `.md` may be omitted.
   */
  resolve(target: string, from: string): string | null {
    const clean = target.trim().replace(/^\/+/, "");
    if (!clean) return null;
    const tries = (p: string | null) => (p === null ? [] : [p, `${p}.md`]);
    const fromDir = dirname(from);
    for (const p of [...tries(normalize(clean)), ...tries(normalize(fromDir ? `${fromDir}/${clean}` : clean))]) {
      if (p && this.files.has(p)) return p;
    }
    const name = basename(clean);
    const matches = this.byName.get(fold(name)) ?? this.byName.get(fold(name.replace(/\.md$/i, ""))) ?? [];
    const wanted = clean.includes("/") ? fold(clean) : null;
    const pool = wanted ? matches.filter((m) => fold(m).endsWith(wanted) || fold(m).endsWith(`${wanted}.md`)) : matches;
    if (!pool.length) return null;
    // closest folder wins: longest shared prefix with the current note
    const score = (p: string) => {
      const a = dirname(p).split("/");
      const b = fromDir.split("/");
      let n = 0;
      while (n < a.length && n < b.length && a[n] === b[n]) n++;
      return n * 100 - a.length;
    };
    return [...pool].sort((x, y) => score(y) - score(x))[0];
  }

  /** Plain Markdown links are relative to the note; fall back to Obsidian's lookup. */
  resolveRelative(href: string, from: string): string | null {
    let decoded = href;
    try {
      decoded = decodeURIComponent(href);
    } catch {}
    const dir = dirname(from);
    const rel = decoded.startsWith("/") ? normalize(decoded) : normalize(dir ? `${dir}/${decoded}` : decoded);
    if (rel && this.files.has(rel)) return rel;
    return this.resolve(decoded, from);
  }

  /** The image the Excalidraw plugin exports next to a drawing, when auto-export is on. */
  drawingPreview(path: string): string | null {
    const stem = path.replace(/\.md$/i, "");
    return [`${stem}.svg`, `${stem}.png`, `${path}.svg`, `${path}.png`].find((p) => this.files.has(p)) ?? null;
  }

  search(query: string, limit = 60): Entry[] {
    const words = fold(query).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const hits: Entry[] = [];
    for (const f of this.files.values()) {
      const hay = fold(f.path);
      if (words.every((w) => hay.includes(w))) hits.push(f);
    }
    return hits.sort((a, b) => collator.compare(title(a.path), title(b.path))).slice(0, limit);
  }
}

// ---- routing: the page lives in the URL fragment (#/Viper/Combos.md#heading), so a static
// host can serve every deep link and nothing about the repository reaches a server log.

export const encodePath = (path: string) => path.split("/").map(encodeURIComponent).join("/");

export function routeHref(path: string, anchor?: string): string {
  return `#/${encodePath(path)}${anchor ? `#${encodeURIComponent(anchor)}` : ""}`;
}

export function parseRoute(hash: string): { path: string; anchor: string | null } {
  const raw = hash.replace(/^#\/?/, "");
  const cut = raw.indexOf("#");
  const pathPart = cut === -1 ? raw : raw.slice(0, cut);
  const anchorPart = cut === -1 ? null : raw.slice(cut + 1);
  const dec = (s: string) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };
  return { path: pathPart.split("/").map(dec).filter(Boolean).join("/"), anchor: anchorPart ? dec(anchorPart) : null };
}

export function slugify(text: string): string {
  return (
    text
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}
