"use client";

import { useEffect, useRef } from "react";
import { mountBand } from "./bands";

export function DescentBand({ scene, depth, name }: { scene: "clouds" | "forest"; depth: string; name: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvas.current) return;
    return mountBand(canvas.current, scene);
  }, [scene]);

  return (
    <div className="band" role="presentation">
      <canvas ref={canvas} aria-hidden="true" />
      <p className="depth">
        <b className="num">{depth}</b>
        <span>{name}</span>
      </p>
    </div>
  );
}
