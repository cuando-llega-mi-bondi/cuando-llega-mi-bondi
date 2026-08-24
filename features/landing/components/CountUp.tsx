"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

interface CountUpProps {
  to: number;
  /** Use es-AR thousands separators (e.g. 19267 → "19.267"). */
  sep?: boolean;
  prefix?: string;
  suffix?: string;
  duration?: number;
  /** Decimales a mostrar (ej. 1 para un rating "4.2"). Default 0 (entero). */
  decimals?: number;
}

function format(n: number, sep?: boolean, decimals = 0) {
  const rounded = Number(n.toFixed(decimals));
  return sep ? rounded.toLocaleString("es-AR", { minimumFractionDigits: decimals }) : rounded.toFixed(decimals);
}

/**
 * Counts from 0 to `to` the first time it scrolls into view. Starts blurred
 * and sharpens as it counts, then flashes a brief light pulse on landing —
 * reads as "materializing", not just a linear tick-up.
 */
export function CountUp({
  to,
  sep,
  prefix = "",
  suffix = "",
  duration = 2.2,
  decimals = 0,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduceMotion) {
      el.textContent = prefix + format(to, sep, decimals) + suffix;
      return;
    }
    if (!inView) {
      // Reset while still below the fold so the count-up is seen in full.
      el.textContent = prefix + format(0, sep, decimals) + suffix;
      el.style.filter = "blur(6px)";
      return;
    }

    const controls = animate(0, to, {
      duration,
      ease: [0.19, 1, 0.22, 1],
      onUpdate: (v) => {
        el.textContent = prefix + format(v, sep, decimals) + suffix;
        const progress = to !== 0 ? Math.min(1, v / to) : 1;
        el.style.filter = `blur(${(1 - progress) * 6}px)`;
      },
      onComplete: () => {
        el.style.filter = "blur(0px)";
        el.animate(
          [
            { transform: "scale(1)", filter: "brightness(1)" },
            { transform: "scale(1.06)", filter: "brightness(1.5)" },
            { transform: "scale(1)", filter: "brightness(1)" },
          ],
          { duration: 450, easing: "ease-out" },
        );
      },
    });
    return () => controls.stop();
  }, [inView, to, sep, prefix, suffix, duration, decimals, reduceMotion]);

  // SSR / no-JS fallback shows the final value (good for SEO).
  return <span ref={ref} className="inline-block">{prefix + format(to, sep, decimals) + suffix}</span>;
}
