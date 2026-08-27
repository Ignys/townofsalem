"use client";

import { motion, useReducedMotion } from "framer-motion";

interface TimerProgressBarProps {
  progress: number;
  critical: boolean;
  expired: boolean;
}

const TICK_TRANSITION_SECONDS = 0.25;

export function TimerProgressBar({
  progress,
  critical,
  expired,
}: TimerProgressBarProps) {
  const shouldReduceMotion = useReducedMotion();
  const progressPercentage = Math.round(progress * 100);
  const alert = critical || expired;
  const duration = shouldReduceMotion ? 0 : TICK_TRANSITION_SECONDS;

  return (
    <div
      role="progressbar"
      aria-label="Tempo restante"
      aria-valuenow={progressPercentage}
      aria-valuemin={0}
      aria-valuemax={100}
      className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/10"
    >
      <motion.div
        initial={false}
        animate={{ scaleX: progress }}
        transition={{ type: "tween", duration, ease: "linear" }}
        className="relative h-full w-full origin-left rounded-full bg-gradient-to-r from-[#d3b88c] to-[#f0d9b5] will-change-transform"
      >
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{ opacity: alert ? 1 : 0 }}
          transition={{
            type: "tween",
            duration: shouldReduceMotion ? 0 : 0.3,
            ease: "easeOut",
          }}
          className="absolute inset-0 rounded-full bg-[#a33843]"
        />
      </motion.div>
    </div>
  );
}
