"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";

/**
 * Honours `prefers-reduced-motion` at animation time: transforms snap to their
 * final value while opacity still animates, so revealed content always becomes
 * visible.
 *
 * IMPORTANT: reduced motion must NOT be handled by branching the rendered tree
 * on `useReducedMotion()`. The prerendered HTML is generated without knowing
 * the visitor's preference (it SSRs the animated variant, e.g.
 * `style="opacity:0"`), and in production React does not repair attribute
 * mismatches during hydration — a different client branch leaves the SSR
 * `opacity:0` stuck forever and the landing renders invisible.
 */
export function LandingMotionConfig({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
