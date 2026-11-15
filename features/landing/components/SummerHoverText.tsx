"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

// Postal de verano marplatense: patito, ola, mar, anteojos y compañía
const SUMMER_EMOJIS = [
  "🦆",
  "🌊",
  "🕶️",
  "🐚",
  "☀️",
  "🏖️",
  "⛱️",
  "🩴",
  "🦀",
  "🍦",
  "🏄",
  "🐠",
];

// Emojis visibles a la vez: si aparece un cuarto, el más viejo se desvanece
const MAX_EMOJIS = 3;

// Cuánto se queda el emoji después de que el cursor deja la letra (estela)
const LINGER_MS = 350;

type HoverEmoji = { id: number; index: number; emoji: string };

function pickEmoji(exclude: string[]) {
  const pool = SUMMER_EMOJIS.filter((emoji) => !exclude.includes(emoji));
  return pool[Math.floor(Math.random() * pool.length)];
}

function SummerLetter({
  char,
  hoverEmoji,
  reduceMotion,
  onPointerEnter,
  onPointerLeave,
}: {
  char: string;
  hoverEmoji: HoverEmoji | undefined;
  reduceMotion: boolean;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}) {
  return (
    <span
      className="relative"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {/* La letra conserva su ancho y se funde con el emoji sin mover el titular */}
      <motion.span
        animate={{ opacity: hoverEmoji ? 0 : 1 }}
        transition={{ duration: hoverEmoji ? 0.12 : 0.22 }}
      >
        {char}
      </motion.span>
      <AnimatePresence>
        {hoverEmoji && (
          <motion.span
            key={hoverEmoji.id}
            aria-hidden
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{
              opacity: 0,
              scale: reduceMotion ? 1 : 0.85,
              transition: { duration: 0.2, ease: "easeOut" },
            }}
            transition={{
              opacity: { duration: 0.12 },
              // Resorte flojo: el emoji se infla con un leve rebote
              scale: { type: "spring", stiffness: 320, damping: 14, mass: 0.7 },
            }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-[0.95em] tracking-normal drop-shadow-[0_0.1em_0.12em_rgba(0,0,0,0.35)]"
          >
            {hoverEmoji.emoji}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

/** Texto cuyas letras se convierten en emojis de verano al pasar el cursor, dejando una estela corta. */
export function SummerHoverText({ text }: { text: string }) {
  const reduceMotion = useReducedMotion() ?? false;
  const [hoverEmojis, setHoverEmojis] = useState<HoverEmoji[]>([]);
  const nextIdRef = useRef(0);
  const timeoutsRef = useRef(new Map<number, number>());

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => timeouts.forEach((timeout) => window.clearTimeout(timeout));
  }, []);

  const show = (index: number) => {
    // Cancela la salida pendiente: volver a una letra que todavía muestra su emoji lo mantiene
    const timeouts = timeoutsRef.current;
    window.clearTimeout(timeouts.get(index));
    timeouts.delete(index);
    if (hoverEmojis.some((item) => item.index === index)) return;

    const id = nextIdRef.current++;
    const emoji = pickEmoji(hoverEmojis.map((item) => item.emoji));
    setHoverEmojis((current) =>
      [...current, { id, index, emoji }].slice(-MAX_EMOJIS),
    );
  };

  const hide = (index: number) => {
    const timeouts = timeoutsRef.current;
    window.clearTimeout(timeouts.get(index));
    timeouts.set(
      index,
      window.setTimeout(() => {
        timeouts.delete(index);
        setHoverEmojis((current) =>
          current.filter((item) => item.index !== index),
        );
      }, LINGER_MS),
    );
  };

  // Los espacios quedan como texto plano para conservar los cortes de línea originales
  return (
    <>
      {Array.from(text).map((char, index) =>
        char === " " ? (
          " "
        ) : (
          <SummerLetter
            key={index}
            char={char}
            hoverEmoji={hoverEmojis.find((item) => item.index === index)}
            reduceMotion={reduceMotion}
            onPointerEnter={() => show(index)}
            onPointerLeave={() => hide(index)}
          />
        ),
      )}
    </>
  );
}
