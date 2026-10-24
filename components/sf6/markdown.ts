// A small Markdown renderer for Obsidian notes.
//
// Built for this page rather than pulled in as a dependency: it only ever emits the tags
// it writes itself and escapes every piece of text it receives, so a note pushed by a
// collaborator cannot inject markup. It covers what Obsidian notes actually use:
// headings, emphasis, ==highlights==, lists and tasks, tables, fenced code, quotes and
// > [!callouts], [[wikilinks]], ![[embeds]] (images, video, audio, drawings, notes),
// #tags, front matter and %%comments%%.

import { KIND_LABEL, type Vault, kindOf, routeHref, slugify, title } from "./files";

export type RenderContext = {
  /** Path of the note being rendered, for relative links. */
  from: string;
  vault: Vault;
  /** Signed URL of a repository file, for <img>, <video> and <audio>. */
  media: (path: string) => string;
  /** Title shown above the note: a leading `# title` that repeats it is dropped. */
  title?: string;
};

export type Heading = { level: number; text: string; id: string };
export type Rendered = { html: string; headings: Heading[]; tags: string[] };

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

const CALLOUT_TITLES: Record<string, string> = {
  note: "Note", info: "Info", tip: "Astuce", hint: "Astuce", important: "Important", success: "Réussi", check: "Réussi", done: "Fait",
  question: "Question", help: "Question", faq: "Question", warning: "Attention", caution: "Attention", attention: "Attention",
  failure: "Échec", fail: "Échec", missing: "Manquant", danger: "Danger", error: "Erreur", bug: "Bug", example: "Exemple",
  quote: "Citation", cite: "Citation", abstract: "Résumé", summary: "Résumé", tldr: "Résumé", todo: "À faire",
};
const CALLOUT_TONES: Record<string, string> = {
  tip: "good", hint: "good", success: "good", check: "good", done: "good", info: "cool", note: "cool", todo: "cool", abstract: "cool", summary: "cool", tldr: "cool",
  warning: "warm", caution: "warm", attention: "warm", question: "warm", help: "warm", faq: "warm", important: "warm",
  failure: "hot", fail: "hot", missing: "hot", danger: "hot", error: "hot", bug: "hot",
};

const FENCE = /^ {0,3}(`{3,}|~{3,})[ \t]*([^`\s]*)/;
const HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/;
const HR = /^ {0,3}(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/;
const QUOTE = /^ {0,3}>/;
const LIST = /^( *)([-*+]|\d{1,9}[.)])(?:[ \t]+|$)/;
const DELIM = /^ *\|? *:?-+:? *(?:\| *:?-+:? *)*\|? *$/;
const URL_RE = /https?:\/\/[^\s<>"]+[^\s<>".,:;'!?)\]]/g;
const TAG_RE = /(^|[\s(])#([\p{L}_][\p{L}\p{N}_\-/]*)/gu;

const indentOf = (line: string) => line.length - line.trimStart().length;
const isBlockStart = (line: string) => FENCE.test(line) || HEADING.test(line) || HR.test(line) || QUOTE.test(line) || LIST.test(line);

function dedent(line: string, n: number) {
  let i = 0;
  while (i < n && line[i] === " ") i++;
  return line.slice(i);
}

/** Splits a table row on `|`, but not inside `code` or [[link|alias]], and not on `\|`. */
function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|") && !s.endsWith("\\|")) s = s.slice(0, -1);
  const cells: string[] = [];
  let cur = "";
  let code = false;
  let wiki = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "\\" && s[i + 1] === "|") {
      cur += "|";
      i++;
    } else if (c === "`") {
      code = !code;
      cur += c;
    } else if (!code && s.startsWith("[[", i)) {
      wiki++;
      cur += "[[";
      i++;
    } else if (!code && wiki && s.startsWith("]]", i)) {
      wiki--;
      cur += "]]";
      i++;
    } else if (c === "|" && !code && !wiki) {
      cells.push(cur.trim());
      cur = "";
    } else cur += c;
  }
  cells.push(cur.trim());
  return cells;
}

function frontMatterTags(yaml: string): string[] {
  const tags: string[] = [];
  const lines = yaml.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = /^(tags?|tag)\s*:\s*(.*)$/i.exec(lines[i]);
    if (!m) continue;
    const inline = m[2].trim().replace(/^\[|\]$/g, "");
    if (inline) tags.push(...inline.split(/[,\s]+/));
    else for (let j = i + 1; j < lines.length && /^\s*-\s+/.test(lines[j]); j++) tags.push(lines[j].replace(/^\s*-\s+/, ""));
  }
  return tags.map((t) => t.replace(/^["'#]+|["']+$/g, "").trim()).filter(Boolean);
}

class Renderer {
  private ids = new Map<string, number>();
  headings: Heading[] = [];
  tags = new Set<string>();

  constructor(private ctx: RenderContext) {}

  private id(text: string) {
    const base = slugify(text);
    const n = this.ids.get(base) ?? 0;
    this.ids.set(base, n + 1);
    return n ? `${base}-${n}` : base;
  }

  // ---------------------------------------------------------------- blocks

  blocks(lines: string[]): string {
    let out = "";
    let i = 0;
    const n = lines.length;
    while (i < n) {
      const line = lines[i];
      if (!line.trim()) {
        i++;
        continue;
      }
      let m: RegExpExecArray | null;

      if ((m = FENCE.exec(line))) {
        const fence = m[1];
        const close = new RegExp(`^ {0,3}${fence[0] === "`" ? "`" : "~"}{${fence.length},}[ \\t]*$`);
        const body: string[] = [];
        i++;
        while (i < n && !close.test(lines[i])) body.push(lines[i++]);
        i++;
        const lang = m[2] ? ` data-lang="${esc(m[2])}"` : "";
        out += `<pre${lang}><code>${esc(body.join("\n"))}</code></pre>`;
        continue;
      }

      if ((m = HEADING.exec(line))) {
        const raw = m[2] ?? "";
        const level = Math.min(6, m[1].length + 1); // the page title is the h1
        const plain = raw.replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (_, a, b) => b || a).replace(/[*_=~`]/g, "").trim();
        const id = this.id(plain);
        this.headings.push({ level, text: plain, id });
        out += `<h${level} id="${esc(id)}">${this.inline(raw)}</h${level}>`;
        i++;
        continue;
      }

      if (HR.test(line)) {
        out += "<hr>";
        i++;
        continue;
      }

      if (QUOTE.test(line)) {
        const inner: string[] = [];
        while (i < n && QUOTE.test(lines[i])) inner.push(lines[i++].replace(/^ {0,3}> ?/, ""));
        out += this.quote(inner);
        continue;
      }

      if (line.includes("|") && i + 1 < n && DELIM.test(lines[i + 1]) && lines[i + 1].includes("-")) {
        const head = splitRow(line);
        const aligns = splitRow(lines[i + 1]).map((c) => (c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : c.startsWith(":") ? "left" : ""));
        i += 2;
        const rows: string[][] = [];
        while (i < n && lines[i].trim() && lines[i].includes("|")) rows.push(splitRow(lines[i++]));
        const cell = (tag: string, text: string, k: number) => `<${tag}${aligns[k] ? ` style="text-align:${aligns[k]}"` : ""}>${this.inline(text)}</${tag}>`;
        out += `<div class="table-wrap"><table><thead><tr>${head.map((h, k) => cell("th", h, k)).join("")}</tr></thead><tbody>`;
        out += rows.map((r) => `<tr>${head.map((_, k) => cell("td", r[k] ?? "", k)).join("")}</tr>`).join("");
        out += "</tbody></table></div>";
        continue;
      }

      if (LIST.test(line)) {
        const [html, next] = this.list(lines, i);
        out += html;
        i = next;
        continue;
      }

      const para = [line.trim()];
      i++;
      while (i < n && lines[i].trim() && !isBlockStart(lines[i]) && !(lines[i].includes("|") && i + 1 < n && DELIM.test(lines[i + 1]))) para.push(lines[i++].trim());
      out += `<p>${this.inline(para.join("\n"))}</p>`;
    }
    return out;
  }

  private quote(inner: string[]): string {
    const m = /^\[!([\w-]+)\]([+-]?)[ \t]*(.*)$/.exec(inner[0] ?? "");
    if (!m) return `<blockquote>${this.blocks(inner)}</blockquote>`;
    const type = m[1].toLowerCase();
    const heading = m[3] ? this.inline(m[3]) : esc(CALLOUT_TITLES[type] ?? type.charAt(0).toUpperCase() + type.slice(1));
    const body = this.blocks(inner.slice(1));
    const attrs = `class="callout" data-callout="${esc(type)}" data-tone="${CALLOUT_TONES[type] ?? "warm"}"`;
    if (m[2]) return `<details ${attrs}${m[2] === "+" ? " open" : ""}><summary class="callout-title">${heading}</summary>${body}</details>`;
    return `<aside ${attrs}><p class="callout-title">${heading}</p>${body}</aside>`;
  }

  private list(lines: string[], start: number): [string, number] {
    const n = lines.length;
    const first = LIST.exec(lines[start])!;
    const base = first[1].length;
    const ordered = /\d/.test(first[2]);
    const items: string[][] = [];
    let loose = false;
    let i = start;

    while (i < n) {
      const m = LIST.exec(lines[i]);
      if (!m || m[1].length > base + 1 || m[1].length < base || /\d/.test(m[2]) !== ordered) break;
      const offset = m[0].length;
      const body = [lines[i].slice(offset)];
      i++;
      while (i < n) {
        const l = lines[i];
        if (!l.trim()) {
          let j = i;
          while (j < n && !lines[j].trim()) j++;
          if (j < n && indentOf(lines[j]) > base) {
            if (!LIST.test(lines[j])) loose = true;
            while (i < j) body.push(lines[i++].trim());
            continue;
          }
          break;
        }
        if (indentOf(l) > base) body.push(dedent(l, offset));
        else if (!isBlockStart(l)) body.push(l.trim()); // lazy continuation of the item's text
        else break;
        i++;
      }
      items.push(body);
      let j = i;
      while (j < n && !lines[j].trim()) j++;
      const sib = j > i && j < n ? LIST.exec(lines[j]) : null;
      if (sib && sib[1].length <= base + 1 && sib[1].length >= base && /\d/.test(sib[2]) === ordered) {
        loose = true;
        i = j;
      }
    }

    const tag = ordered ? "ol" : "ul";
    const startAttr = ordered && parseInt(first[2], 10) !== 1 ? ` start="${parseInt(first[2], 10)}"` : "";
    let hasTask = false;
    const lis = items.map((body) => {
      const task = /^\[([ xX/-])\][ \t]+/.exec(body[0]);
      if (task) body[0] = body[0].slice(task[0].length);
      let html = this.blocks(body);
      if (!loose) html = html.replace(/^<p>([\s\S]*?)<\/p>/, "$1");
      if (!task) return `<li>${html}</li>`;
      hasTask = true;
      const done = task[1] !== " ";
      return `<li class="task${done ? " done" : ""}"><input type="checkbox" disabled${done ? " checked" : ""} aria-label="${done ? "Fait" : "À faire"}"> ${html}</li>`;
    });
    return [`<${tag}${startAttr}${hasTask ? ' class="tasks"' : ""}>${lis.join("")}</${tag}>`, i];
  }

  // ---------------------------------------------------------------- inline

  inline(text: string): string {
    let out = "";
    let plain = "";
    let i = 0;
    const flush = () => {
      if (plain) out += this.text(plain);
      plain = "";
    };
    const at = (re: RegExp) => {
      re.lastIndex = i;
      return re.exec(text);
    };
    while (i < text.length) {
      const c = text[i];
      let m: RegExpExecArray | null = null;
      let html: string | null = null;

      if (c === "\\" && /[!-/:-@[-`{-~]/.test(text[i + 1] ?? "")) {
        plain += text[i + 1];
        i += 2;
        continue;
      }
      if (c === "`" && (m = at(/(`+)([\s\S]*?[^`])\1(?!`)/y))) html = `<code>${esc(m[2].replace(/^ (.+) $/, "$1"))}</code>`;
      else if (c === "!" && text[i + 1] === "[" && text[i + 2] === "[" && (m = at(/!\[\[([^\]\n]+?)\]\]/y))) html = this.embed(m[1]);
      else if (c === "[" && text[i + 1] === "[" && (m = at(/\[\[([^\]\n]+?)\]\]/y))) html = this.wikilink(m[1]);
      else if (c === "!" && text[i + 1] === "[" && (m = at(/!\[([^\]\n]*)\]\(\s*(?:<([^>\n]+)>|([^\s)]+))(?:\s+"([^"]*)")?\s*\)/y))) html = this.image(m[1], m[2] ?? m[3], m[4]);
      else if (c === "[" && (m = at(/\[((?:[^[\]\n]|\[[^\]\n]*\])*)\]\(\s*(?:<([^>\n]+)>|([^\s)]+))(?:\s+"([^"]*)")?\s*\)/y))) html = this.link(m[1], m[2] ?? m[3]);
      else if (c === "<" && (m = at(/<(https?:\/\/[^\s>]+)>/y))) html = this.external(m[1], esc(m[1]));
      else if (c === "*" && text[i + 1] === "*" && (m = at(/\*\*(?=\S)([\s\S]*?\S)\*\*/y))) html = `<strong>${this.inline(m[1])}</strong>`;
      else if (c === "_" && text[i + 1] === "_" && !/[\p{L}\p{N}]/u.test(text[i - 1] ?? "") && (m = at(/__(?=\S)([\s\S]*?\S)__(?![\p{L}\p{N}])/uy))) html = `<strong>${this.inline(m[1])}</strong>`;
      else if (c === "~" && text[i + 1] === "~" && (m = at(/~~(?=\S)([\s\S]*?\S)~~/y))) html = `<del>${this.inline(m[1])}</del>`;
      else if (c === "=" && text[i + 1] === "=" && (m = at(/==(?=\S)([\s\S]*?\S)==/y))) html = `<mark>${this.inline(m[1])}</mark>`;
      else if (c === "*" && (m = at(/\*(?=[^\s*])([\s\S]*?[^\s*])\*(?!\*)/y))) html = `<em>${this.inline(m[1])}</em>`;
      else if (c === "_" && !/[\p{L}\p{N}]/u.test(text[i - 1] ?? "") && (m = at(/_(?=[^\s_])([\s\S]*?[^\s_])_(?![\p{L}\p{N}])/uy))) html = `<em>${this.inline(m[1])}</em>`;

      if (m && html !== null) {
        flush();
        out += html;
        i += m[0].length;
      } else {
        plain += c;
        i++;
      }
    }
    flush();
    return out;
  }

  /** Plain text: escaped, line breaks kept (Obsidian's default), bare URLs and #tags lifted. */
  private text(s: string): string {
    let out = "";
    let last = 0;
    for (const m of s.matchAll(URL_RE)) {
      out += this.tagged(s.slice(last, m.index));
      out += this.external(m[0], esc(m[0]));
      last = m.index! + m[0].length;
    }
    out += this.tagged(s.slice(last));
    return out.replace(/\n/g, "<br>");
  }

  private tagged(s: string): string {
    return esc(s).replace(TAG_RE, (_, pre, tag) => {
      if (/^\d+$/.test(tag)) return `${pre}#${tag}`;
      this.tags.add(tag);
      return `${pre}<span class="tag">#${tag}</span>`;
    });
  }

  private external(href: string, label: string) {
    return `<a class="ext-link" href="${esc(href)}" rel="noopener noreferrer" target="_blank">${label}<span class="sr-only"> (nouvel onglet)</span></a>`;
  }

  private missing(label: string) {
    return `<span class="missing" title="Introuvable dans le dépôt">${label}</span>`;
  }

  private wikilink(raw: string) {
    const bar = raw.indexOf("|");
    const target = (bar === -1 ? raw : raw.slice(0, bar)).trim();
    const alias = bar === -1 ? null : raw.slice(bar + 1).trim();
    const [file, ...rest] = target.split("#");
    const anchor = rest.join("#").replace(/^\^/, "") || undefined;
    const path = file ? this.ctx.vault.resolve(file, this.ctx.from) : this.ctx.from;
    const label = esc(alias || (file ? title(file) : "") + (anchor ? `${file ? " › " : ""}${anchor}` : ""));
    if (!path) return this.missing(label);
    return `<a class="wikilink" href="${routeHref(path, anchor ? slugify(anchor) : undefined)}">${label}</a>`;
  }

  private embed(raw: string) {
    const bar = raw.indexOf("|");
    const target = (bar === -1 ? raw : raw.slice(0, bar)).trim();
    const opt = bar === -1 ? "" : raw.slice(bar + 1).trim();
    const [file, ...rest] = target.split("#");
    const anchor = rest.join("#") || undefined;
    const path = this.ctx.vault.resolve(file, this.ctx.from);
    if (!path) return this.missing(`⧉ ${esc(title(file))}`);
    const kind = kindOf(path);
    const src = esc(this.ctx.media(path));
    const size = /^(\d+)(?:x(\d+))?$/.exec(opt);
    const dims = size ? ` width="${size[1]}"${size[2] ? ` height="${size[2]}"` : ""}` : "";
    const alt = esc(size || !opt ? title(path) : opt);
    switch (kind) {
      case "image":
        return `<span class="embed embed-image"><img src="${src}" alt="${alt}" loading="lazy" decoding="async"${dims}></span>`;
      case "video":
        return `<span class="embed embed-video"><video src="${src}" controls preload="metadata" playsinline${dims}></video></span>`;
      case "audio":
        return `<span class="embed embed-audio"><audio src="${src}" controls preload="metadata"></audio></span>`;
      case "excalidraw": {
        const preview = this.ctx.vault.drawingPreview(path);
        if (preview) return `<a class="embed embed-image embed-drawing" href="${routeHref(path)}"><img src="${esc(this.ctx.media(preview))}" alt="${alt}" loading="lazy" decoding="async"${dims}></a>`;
        return this.card(path, anchor);
      }
      default:
        return this.card(path, anchor);
    }
  }

  private card(path: string, anchor?: string) {
    return `<a class="embed-card" href="${routeHref(path, anchor ? slugify(anchor) : undefined)}"><span>${KIND_LABEL[kindOf(path)]}</span>${esc(title(path))}${anchor ? ` › ${esc(anchor)}` : ""}</a>`;
  }

  private image(alt: string, href: string, imgTitle?: string) {
    const t = imgTitle ? ` title="${esc(imgTitle)}"` : "";
    if (/^https:\/\//i.test(href)) return `<span class="embed embed-image"><img src="${esc(href)}" alt="${esc(alt)}"${t} loading="lazy" referrerpolicy="no-referrer"></span>`;
    const path = this.ctx.vault.resolveRelative(href, this.ctx.from);
    if (!path) return this.missing(`⧉ ${esc(alt || href)}`);
    // Obsidian puts the size in the alt text: ![caption|300](img.png)
    const [caption, width] = alt.split("|");
    const w = width && /^\d+$/.test(width.trim()) ? ` width="${width.trim()}"` : "";
    if (kindOf(path) === "video") return `<span class="embed embed-video"><video src="${esc(this.ctx.media(path))}" controls preload="metadata" playsinline></video></span>`;
    return `<span class="embed embed-image"><img src="${esc(this.ctx.media(path))}" alt="${esc(caption)}"${t}${w} loading="lazy" decoding="async"></span>`;
  }

  private link(label: string, href: string) {
    const inner = this.inline(label);
    if (/^(https?:|mailto:)/i.test(href)) return this.external(href, inner);
    if (href.startsWith("#")) return `<a href="${routeHref(this.ctx.from, slugify(decodeURIComponent(href.slice(1))))}">${inner}</a>`;
    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return inner; // obsidian://, javascript: and friends: text only
    const [file, anchor] = href.split("#");
    const path = this.ctx.vault.resolveRelative(file, this.ctx.from);
    if (!path) return this.missing(inner);
    return `<a class="wikilink" href="${routeHref(path, anchor ? slugify(decodeURIComponent(anchor)) : undefined)}">${inner}</a>`;
  }
}

export function renderMarkdown(source: string, ctx: RenderContext): Rendered {
  let src = source.replace(/\r\n?/g, "\n").replace(/\t/g, "    ");
  const tags: string[] = [];
  const fm = /^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/.exec(src);
  if (fm) {
    tags.push(...frontMatterTags(fm[1]));
    src = src.slice(fm[0].length);
  }
  src = src.replace(/%%[\s\S]*?%%/g, "");
  // Most notes open with `# <file name>`; the page already shows it as its title.
  if (ctx.title) {
    const h1 = /^\s*# +(.+?)[ \t]*#*[ \t]*(?:\n|$)/.exec(src);
    const fold = (s: string) => s.normalize("NFKC").trim().toLowerCase();
    if (h1 && fold(h1[1]) === fold(ctx.title)) src = src.slice(h1[0].length);
  }
  const r = new Renderer(ctx);
  const html = r.blocks(src.split("\n"));
  return { html, headings: r.headings, tags: [...new Set([...tags, ...r.tags])] };
}
