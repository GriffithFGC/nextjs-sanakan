// The visitor's "pause animations" choice (WCAG 2.2.2), shared by the toggle and every canvas scene.
// It lasts for the visit; prefers-reduced-motion already covers a lasting preference.
let paused = false;
const listeners = new Set<(paused: boolean) => void>();

export const motion = {
  isPaused: () => paused,
  setPaused(value: boolean) {
    paused = value;
    listeners.forEach((l) => l(value));
  },
  subscribe(listener: (paused: boolean) => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
