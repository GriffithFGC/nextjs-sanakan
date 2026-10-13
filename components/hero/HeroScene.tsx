"use client";

import { useEffect, useRef } from "react";
import { mountScene } from "./scene";

export function HeroScene() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvas.current) return;
    return mountScene(canvas.current);
  }, []);

  return <canvas ref={canvas} className="hero-canvas" aria-hidden="true" />;
}
