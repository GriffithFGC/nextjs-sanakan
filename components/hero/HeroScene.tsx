"use client";

import { useEffect, useRef } from "react";
import { motion } from "../motion";
import { mountScene } from "./scene";

export function HeroScene() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvas.current) return;
    const scene = mountScene(canvas.current);
    scene.setPaused(motion.isPaused());
    const unsubscribe = motion.subscribe(scene.setPaused);
    return () => {
      unsubscribe();
      scene.destroy();
    };
  }, []);

  return <canvas ref={canvas} className="hero-canvas" aria-hidden="true" />;
}
