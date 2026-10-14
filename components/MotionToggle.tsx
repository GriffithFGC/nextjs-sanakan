"use client";

import { useSyncExternalStore } from "react";
import { motion } from "./motion";

export function MotionToggle({ label }: { label: string }) {
  const paused = useSyncExternalStore(motion.subscribe, motion.isPaused, () => false);

  return (
    <button type="button" className="motion" aria-pressed={paused} aria-label={label} title={label} onClick={() => motion.setPaused(!paused)}>
      <span aria-hidden="true">{paused ? "▶" : "❚❚"}</span>
    </button>
  );
}
