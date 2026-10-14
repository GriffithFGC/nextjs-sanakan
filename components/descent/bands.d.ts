export function mountBand(canvas: HTMLCanvasElement, scene: "clouds" | "forest"): { destroy: () => void; setPaused: (paused: boolean) => void };
