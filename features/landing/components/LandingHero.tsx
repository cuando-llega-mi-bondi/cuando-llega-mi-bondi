"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { SummerHoverText } from "./SummerHoverText";

const HERO_VIDEO_HD =
  "https://videos.pexels.com/video-files/38118754/16184132_1920_1080_24fps.mp4";
const HERO_VIDEO_SD =
  "https://videos.pexels.com/video-files/38118754/16184131_1280_720_24fps.mp4";

export function LandingHero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Parallax expositivo controlado por scroll (arranca en 0%/1 para coincidir 100% entre SSR e hidratación)
  const videoY = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["0%", "16%"],
  );
  const videoScale = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [1, 1] : [1, 1.1],
  );
  const contentY = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [0, -24],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reduceMotion) {
      video.pause();
    } else {
      video.play().catch(() => {
        // Autoplay silenciado puede ser bloqueado por políticas de ahorro de batería
      });
    }
  }, [reduceMotion]);

  return (
    <section
      ref={sectionRef}
      aria-label="Presentación de Bondi MDP"
      className="relative"
    >
      {/* Hero y video a pantalla completa (100% del alto visible junto al teléfono fijo) */}
      <div className="relative h-[calc(100dvh-2.5rem)] min-h-[640px] w-full overflow-hidden rounded-[28px] border border-border bg-[#0f2d4a]">
        {/* Capa de video a pantalla completa con parallax suave en el scroll */}
        <motion.div
          style={{ y: videoY, scale: videoScale }}
          className="absolute inset-0 h-full w-full"
        >
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-label="Postal costera soleada junto al mar"
            className="h-full w-full object-cover object-center"
          >
            <source src={HERO_VIDEO_HD} type="video/mp4" />
            <source src={HERO_VIDEO_SD} type="video/mp4" />
          </video>
        </motion.div>

        {/* Capa de contenido superpuesto sobre el video en toda la pantalla */}
        <div className="relative z-10 flex h-full flex-col justify-between bg-gradient-to-t from-[#0f2d4a]/95 via-[#0f2d4a]/45 to-[#0f2d4a]/55 p-6 sm:p-8 xl:p-10">
          {/* Barra superior integrada sobre el video */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-[#0f2d4a]/80 px-3.5 py-1.5 backdrop-blur-md">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-wider text-[#f0f4f8] uppercase">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#289b95]" />
                GPS EN VIVO
              </span>
              <span aria-hidden className="text-white/25">
                ·
              </span>
              <span className="font-mono text-xs font-medium text-[#d7e3ee]">
                MAR DEL PLATA · 38°00′S 57°33′O
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/blog"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-[#0f2d4a]/80 px-4 py-2 text-xs font-semibold text-[#f0f4f8] backdrop-blur-md transition-colors hover:border-white/40 hover:bg-[#0f2d4a]"
              >
                Blog
              </Link>
              <Link
                href="/anunciate"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 bg-[#0f2d4a]/85 px-5 py-2 text-xs font-bold text-[#f0f4f8] backdrop-blur-md transition-colors hover:border-white/50 hover:bg-[#0f2d4a]"
              >
                Anunciate
              </Link>
            </div>
          </div>

          {/* Bloque inferior sobre el video: título y bajada */}
          <motion.div
            style={{ y: contentY }}
            className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12"
          >
            <div className="lg:col-span-7">
              <h1 className="text-balance text-4xl font-black leading-[0.94] tracking-[-0.04em] text-[#f0f4f8] sm:text-5xl xl:text-[4rem]">
                Movéte mejor{" "}
                <span className="block text-[#289b95]">
                  por{" "}
                  <span className="text-amarillo">
                    <SummerHoverText text="Mar del Plata" />.
                  </span>
                </span>
              </h1>
            </div>

            <div className="lg:col-span-5 lg:pb-1">
              <p className="text-base leading-relaxed text-[#e2ecf5]">
                Seguimiento en tiempo real del transporte público marplatense.
                Pensado para saber exactamente cuándo salir a la esquina, con
                datos oficiales de MGP y acceso inmediato en el panel
                izquierdo.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
