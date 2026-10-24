"use client";

import { useEffect, useSyncExternalStore } from "react";
import { desktopTheme, fetchPalette, lastPalette, paint } from "./theme";

// "43PR": dress the page in my desktop's colours, followed live while the tab is open.
export function ThemeToggle() {
  const on = useSyncExternalStore(desktopTheme.subscribe, desktopTheme.isOn, () => false);

  useEffect(() => {
    if (!on) return;
    let live = true;
    paint(lastPalette());
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      fetchPalette().then((palette) => {
        if (live && palette) paint(palette);
      });
    };
    refresh();
    // A wallpaper change re-themes the desktop: pick it up within a minute, or on coming back.
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      live = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      paint(null);
    };
  }, [on]);

  const label = on ? "Revenir aux couleurs du site" : "Thème 43PR : les couleurs de mon bureau, en direct";
  return (
    <button type="button" className="sf6-theme" aria-pressed={on} aria-label={label} title={label} onClick={() => desktopTheme.set(!on)}>
      43PR
    </button>
  );
}
