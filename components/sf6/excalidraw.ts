// Obsidian Excalidraw drawings, read without the Excalidraw library. The plugin stores a
// scene in the note itself (often LZ-String compressed); the page draws its shapes as SVG
// and puts real players where the drawing embeds videos, which an SVG export cannot do.

export type Point = [number, number];

export type ExElement = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number;
  strokeColor?: string;
  backgroundColor?: string;
  fillStyle?: string;
  strokeWidth?: number;
  strokeStyle?: string;
  opacity?: number;
  roundness?: { type: number; value?: number } | null;
  link?: string | null;
  isDeleted?: boolean;
  // text
  text?: string;
  originalText?: string;
  rawText?: string;
  fontSize?: number;
  textAlign?: string;
  lineHeight?: number;
  // lines, arrows, freedraw
  points?: Point[];
  startArrowhead?: string | null;
  endArrowhead?: string | null;
  // images
  fileId?: string | null;
};

export type Scene = {
  elements: ExElement[];
  dark: boolean;
  background: string;
  /** fileId → vault link, from the note's "## Embedded Files" section (images). */
  files: Map<string, string>;
  bounds: { x: number; y: number; width: number; height: number };
};

/** An Excalidraw file: `*.excalidraw`, or a note whose front matter names the plugin. */
export function isDrawing(path: string, text: string): boolean {
  if (/\.excalidraw$/i.test(path)) return true;
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  return !!fm && /^excalidraw-plugin:/m.test(fm[1]);
}

export function parseDrawing(text: string): Scene | null {
  let json: string | null = null;
  if (text.trimStart().startsWith("{")) json = text;
  else {
    const block = /```(compressed-json|json)\r?\n([\s\S]*?)```/.exec(text.slice(text.lastIndexOf("## Drawing")));
    if (block) json = block[1] === "json" ? block[2] : decompressFromBase64(block[2].replace(/\s+/g, ""));
  }
  if (!json) return null;
  let raw: { elements?: unknown; appState?: { theme?: string; viewBackgroundColor?: string } };
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!Array.isArray(raw.elements)) return null;
  const elements = (raw.elements as ExElement[]).filter((e) => e && typeof e === "object" && !e.isDeleted && Number.isFinite(e.x) && Number.isFinite(e.y));
  if (!elements.length) return null;

  const files = new Map<string, string>();
  const embedded = /## Embedded Files\r?\n([\s\S]*?)(?:\n%%|\n## |$)/.exec(text);
  if (embedded) for (const m of embedded[1].matchAll(/^([\w-]+):\s*(\[\[.+?\]\]|https?:\S+)/gm)) files.set(m[1], m[2]);

  const pad = 40;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const e of elements) {
    const b = box(e);
    x0 = Math.min(x0, b.x);
    y0 = Math.min(y0, b.y);
    x1 = Math.max(x1, b.x + b.width);
    y1 = Math.max(y1, b.y + b.height);
  }
  return {
    elements,
    dark: raw.appState?.theme === "dark",
    background: raw.appState?.viewBackgroundColor || "#ffffff",
    files,
    bounds: { x: x0 - pad, y: y0 - pad, width: x1 - x0 + 2 * pad, height: y1 - y0 + 2 * pad },
  };
}

/** Where an element sits; lines and arrows are measured from their points, like Excalidraw does. */
export function box(e: ExElement): { x: number; y: number; width: number; height: number } {
  if (e.points?.length) {
    const xs = e.points.map((p) => p[0]);
    const ys = e.points.map((p) => p[1]);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    return { x: e.x + minX, y: e.y + minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
  }
  return { x: e.x, y: e.y, width: Math.abs(e.width), height: Math.abs(e.height) };
}

/** `[[target|alias]]`, `[[target#heading]]` or a web address, as stored in a link or a text. */
export function linkOf(e: ExElement): { target: string } | { url: string } | null {
  for (const s of [e.link, e.rawText, e.originalText]) {
    if (!s) continue;
    const wiki = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/.exec(s);
    if (wiki) return { target: wiki[1].trim() };
    if (s === e.link && /^https?:\/\//i.test(s)) return { url: s };
  }
  return null;
}

// ---- LZ-String's decompressFromBase64 (MIT, pieroxy), the format the plugin writes

const KEY = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

function decompressFromBase64(input: string): string | null {
  const rev: Record<string, number> = {};
  for (let i = 0; i < KEY.length; i++) rev[KEY[i]] = i;
  const data: number[] = [];
  for (const c of input) if (c in rev) data.push(rev[c]);
  if (!data.length) return null;

  let index = 0, position = 32, val = data[0];
  const bits = (n: number) => {
    let r = 0;
    for (let p = 1; p < 1 << n; p <<= 1) {
      const bit = val & position;
      position >>= 1;
      if (position === 0) {
        position = 32;
        val = data[++index] ?? 0;
      }
      if (bit) r |= p;
    }
    return r;
  };

  const dict: string[] = ["", "", ""];
  let enlarge = 4, size = 4, numBits = 3;
  const first = bits(2);
  if (first === 2) return "";
  let w = String.fromCharCode(bits(first === 0 ? 8 : 16));
  dict[3] = w;
  const out = [w];
  for (;;) {
    if (index > data.length) return null;
    let c = bits(numBits);
    if (c === 0 || c === 1) {
      dict[size++] = String.fromCharCode(bits(c === 0 ? 8 : 16));
      c = size - 1;
      enlarge--;
    } else if (c === 2) return out.join("");
    if (enlarge === 0) {
      enlarge = 1 << numBits;
      numBits++;
    }
    let entry: string;
    if (dict[c] !== undefined) entry = dict[c];
    else if (c === size) entry = w + w[0];
    else return null;
    out.push(entry);
    dict[size++] = w + entry[0];
    enlarge--;
    w = entry;
    if (enlarge === 0) {
      enlarge = 1 << numBits;
      numBits++;
    }
  }
}
