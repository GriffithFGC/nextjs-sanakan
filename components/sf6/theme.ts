// The "43PR" look: the page wears my desktop's colours, as 43pr last generated them from the
// wallpaper or a preset. sf6-gateway serves that palette without a key at /v1/theme.

import { GATEWAY_URL } from "./api";

const KEYS = ["bg", "bg_card", "border", "fg", "fg_dim", "fg_muted", "accent", "highlight", "danger", "selection_bg", "selection_fg"] as const;
export type Palette = Record<(typeof KEYS)[number], string>;

// What the desktop wore when this was written: shown until the gateway answers, or if sanakan is off.
const SNAPSHOT: Palette = {
  bg: "#100d0d",
  bg_card: "#1e1b1a",
  border: "#4a4645",
  fg: "#e9e1df",
  fg_dim: "#ccc5c4",
  fg_muted: "#968f8e",
  accent: "#dfbfbb",
  highlight: "#d8c2bf",
  danger: "#ffb4ab",
  selection_bg: "#58413f",
  selection_fg: "#fddbd7",
};

// Page token (see :root in globals.css) ← palette key. Brass stays the personal accent.
const TOKENS: Record<string, keyof Palette> = {
  "--bg": "bg",
  "--slab": "bg_card",
  "--line": "border",
  "--ink": "fg",
  "--soft": "fg_dim",
  "--dim": "fg_muted",
  "--brass": "accent",
  "--verdigris": "highlight",
  "--danger": "danger",
  "--selection-bg": "selection_bg",
  "--selection-fg": "selection_fg",
};

const CHOICE = "sf6-learn:theme";
const LAST = "sf6-learn:palette";
const HEX = /^#[0-9a-f]{6}$/i;

/** Valid colours from `raw` laid over `base`: whatever the network sends, only #rrggbb lands in CSS. */
function merge(raw: unknown, base: Palette): Palette {
  const out = { ...base };
  if (raw && typeof raw === "object") {
    for (const k of KEYS) {
      const v = (raw as Record<string, unknown>)[k];
      if (typeof v === "string" && HEX.test(v)) out[k] = v.toLowerCase();
    }
  }
  return out;
}

function isLight(hex: string): boolean {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.5;
}

// ---- the visitor's choice, remembered on this device

let on: boolean | null = null;
const listeners = new Set<() => void>();

export const desktopTheme = {
  isOn(): boolean {
    if (on === null) {
      try {
        on = localStorage.getItem(CHOICE) === "43pr";
      } catch {
        on = false;
      }
    }
    return on;
  },
  set(value: boolean) {
    on = value;
    try {
      if (value) localStorage.setItem(CHOICE, "43pr");
      else localStorage.removeItem(CHOICE);
    } catch {}
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

// ---- palette

/** The palette last received, so a reload paints right away instead of waiting for the gateway. */
export function lastPalette(): Palette {
  try {
    return merge(JSON.parse(localStorage.getItem(LAST) ?? "null"), SNAPSHOT);
  } catch {
    return SNAPSHOT;
  }
}

/** The desktop's current palette, or null when the gateway is off or publishes none. */
export async function fetchPalette(): Promise<Palette | null> {
  try {
    const res = await fetch(`${GATEWAY_URL}/v1/theme`, { cache: "no-store", referrerPolicy: "no-referrer" });
    if (!res.ok) return null;
    const palette = merge(((await res.json()) as { colors?: unknown }).colors, SNAPSHOT);
    try {
      localStorage.setItem(LAST, JSON.stringify(palette));
    } catch {}
    return palette;
  } catch {
    return null;
  }
}

/** Puts a palette on the page, or gives the page its own colours back (null). */
export function paint(palette: Palette | null) {
  const root = document.documentElement;
  for (const [token, key] of Object.entries(TOKENS)) {
    if (palette) root.style.setProperty(token, palette[key]);
    else root.style.removeProperty(token);
  }
  if (palette) {
    root.dataset.sf6Theme = "43pr";
    root.dataset.sf6Appearance = isLight(palette.bg) ? "light" : "dark";
  } else {
    delete root.dataset.sf6Theme;
    delete root.dataset.sf6Appearance;
  }
}
