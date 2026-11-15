"use client";

import {
  motion,
  useMotionValue,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { Fragment, useEffect, useRef } from "react";

// Opacidad de las letras todavía no leídas (medida en bemaconsultora.com)
const GHOST_OPACITY = 0.12;

// Letras que se encienden a la vez, para que el barrido sea continuo y no letra por letra
const FADE_SPAN = 3;

// Tramo del barrido, en fracción del alto de pantalla donde está el borde superior del título
const REVEAL_FROM = 0.9;
const REVEAL_TO = 0.45;

function RevealLetter({
  char,
  index,
  total,
  progress,
}: {
  char: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const opacity = useTransform(
    progress,
    [index / (total + FADE_SPAN), (index + FADE_SPAN) / (total + FADE_SPAN)],
    [GHOST_OPACITY, 1],
  );

  // Con movimiento reducido el texto queda completo desde el inicio
  return (
    <motion.span style={{ opacity }} className="motion-reduce:opacity-100!">
      {char}
    </motion.span>
  );
}

type Segment = { text: string; className?: string };

/**
 * Título que se va encendiendo letra por letra a medida que entra en pantalla.
 * El barrido depende del scroll, no del tiempo: si el usuario retrocede, se apaga.
 */
export function ScrollRevealText({
  text,
  highlight,
  highlightClassName = "text-secondary",
}: {
  text: string;
  highlight?: string;
  highlightClassName?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const { scrollY } = useScroll();
  const progress = useMotionValue(0);

  // El barrido va de "título al 90% del alto" a "título al 45%", pero nunca más allá
  // del scroll disponible: un título cerca del final de la página (el CTA) no llega
  // al 45% y, sin este tope, quedaba apagado para siempre.
  // La posición se lee en cada cuadro y no una sola vez: dentro de un contenedor sticky
  // (el título de LandingFeatures) el título queda quieto en pantalla mientras su
  // posición en el documento avanza, y una medición tomada con el contenedor fijo
  // (al redimensionar la ventana) corría el barrido hasta la tercera tarjeta.
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = () => {
      const viewport = window.innerHeight;
      const top = element.getBoundingClientRect().top + window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - viewport;
      const start = Math.min(top - viewport * REVEAL_FROM, maxScroll - 1);
      const end = Math.max(
        start + 1,
        Math.min(top - viewport * REVEAL_TO, maxScroll),
      );
      const value = (window.scrollY - start) / (end - start);
      progress.set(Math.min(1, Math.max(0, value)));
    };

    update();
    // La página crece mientras cargan imágenes y secciones: se vuelve a calcular
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(document.documentElement);
    const unsubscribe = scrollY.on("change", update);
    return () => {
      resizeObserver.disconnect();
      unsubscribe();
    };
  }, [progress, scrollY]);

  const segments: Segment[] = highlight
    ? [{ text }, { text: highlight, className: highlightClassName }]
    : [{ text }];
  const total = segments.reduce(
    (sum, segment) => sum + segment.text.replaceAll(" ", "").length,
    0,
  );

  let letterIndex = 0;

  // Las palabras van en inline-block para que el título nunca corte a mitad de palabra
  return (
    <span ref={ref} aria-hidden>
      {segments.map((segment, segmentIndex) => (
        <span key={segmentIndex} className={segment.className}>
          {segmentIndex > 0 && " "}
          {segment.text.split(" ").map((word, wordIndex) => (
            <Fragment key={wordIndex}>
              {wordIndex > 0 && " "}
              <span className="inline-block whitespace-nowrap">
                {Array.from(word).map((char) => {
                  const index = letterIndex++;
                  return (
                    <RevealLetter
                      key={index}
                      char={char}
                      index={index}
                      total={total}
                      progress={progress}
                    />
                  );
                })}
              </span>
            </Fragment>
          ))}
        </span>
      ))}
    </span>
  );
}
