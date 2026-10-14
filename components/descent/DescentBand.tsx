"use client";

import { useEffect, useRef } from "react";
import { motion } from "../motion";
import { mountBand } from "./bands";

export function DescentBand({ scene, depth, name }: { scene: "clouds" | "forest"; depth: string; name: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvas.current) return;
    const band = mountBand(canvas.current, scene);
    band.setPaused(motion.isPaused());
    const unsubscribe = motion.subscribe(band.setPaused);
    return () => {
      unsubscribe();
      band.destroy();
    };
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
