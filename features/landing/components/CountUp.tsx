"use client";
"use no memo";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

interface CountUpProps {
  to: number;
  /** Use es-AR thousands separators (e.g. 19267 → "19.267"). */
  sep?: boolean;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

function format(n: number, sep?: boolean) {
  const rounded = Math.round(n);
  return sep ? rounded.toLocaleString("es-AR") : String(rounded);
}

/** Counts from 0 to `to` the first time it scrolls into view. */
export function CountUp({
  to,
  sep,
  prefix = "",
  suffix = "",
  duration = 1.6,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduceMotion) {
      el.textContent = prefix + format(to, sep) + suffix;
      return;
    }
    if (!inView) {
      // Reset while still below the fold so the count-up is seen in full.
      el.textContent = prefix + format(0, sep) + suffix;
      return;
    }

    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = prefix + format(v, sep) + suffix;
      },
    });
    return () => controls.stop();
  }, [inView, to, sep, prefix, suffix, duration, reduceMotion]);

  // SSR / no-JS fallback shows the final value (good for SEO).
  return <span ref={ref}>{prefix + format(to, sep) + suffix}</span>;
}
