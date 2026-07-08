"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

interface RevealProps {
  children: ReactNode;
  className?: string;
}

/**
 * Fades + lifts its children into view once, the first time they're scrolled to.
 *
 * Reduced motion is handled by `LandingMotionConfig` (MotionConfig
 * reducedMotion="user"), NOT by branching the tree on `useReducedMotion()`:
 * the SSR HTML carries `style="opacity:0"`, and production hydration never
 * repairs attributes, so rendering a plain div on the client leaves the
 * content permanently invisible.
 */
export function Reveal({ children, className }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
