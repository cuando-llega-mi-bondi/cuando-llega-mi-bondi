"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

const MAP_MASK =
  "radial-gradient(120% 85% at 50% 42%, black 28%, transparent 80%)";

/** Static glow layer, shared between the reduced-motion and animated variants. */
function Glows() {
  return (
    <>
      <div className="absolute left-[6%] top-[34%] h-[440px] w-[440px] rounded-full bg-[#2bb3a8]/[0.06] blur-[130px]" />
      <div className="absolute right-[4%] top-[60%] h-[480px] w-[480px] rounded-full bg-[#f9cd4a]/[0.05] blur-[140px]" />
    </>
  );
}

/**
 * Fixed decorative backdrop (Mar del Plata map + ambient glows) that drifts at
 * different speeds as the page scrolls, creating a subtle parallax depth.
 */
export function ParallaxDecor() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();

  // Map drifts down slowly; glows drift up — opposite motion reads as depth.
  // With reduced motion the same tree renders with the drift pinned to 0:
  // branching into different markup here breaks hydration of the SSR'd
  // variant (see LandingMotionConfig).
  const mapY = useTransform(scrollYProgress, [0, 1], [-40, 140]);
  const glowY = useTransform(scrollYProgress, [0, 1], [60, -140]);

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed -inset-[15%] z-0 bg-cover bg-center"
        style={{
          y: reduceMotion ? 0 : mapY,
          backgroundImage: "url(/mar-del-plata-mapa-bg.svg)",
          opacity: 0.14,
          maskImage: MAP_MASK,
          WebkitMaskImage: MAP_MASK,
          // Promote to its own GPU layer so scrolling only composites (no repaint
          // of the 1MB map raster each frame).
          willChange: "transform",
          backfaceVisibility: "hidden",
          contain: "layout paint",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          y: reduceMotion ? 0 : glowY,
          willChange: "transform",
          backfaceVisibility: "hidden",
          contain: "layout paint",
        }}
      >
        <Glows />
      </motion.div>
    </>
  );
}
