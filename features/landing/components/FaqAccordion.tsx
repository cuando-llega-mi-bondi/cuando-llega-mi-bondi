"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@shared/utils";

interface FaqItem {
  q: string;
  a: string;
}

export function FaqAccordion({ items }: { items: readonly FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  return (
    // Sin caja: solo una línea entre preguntas, como una lista
    <div className="divide-y divide-border border-y border-border">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${i}`}
              className="group flex min-h-12 w-full cursor-pointer items-center justify-between gap-6 py-5 text-left"
            >
              <span className="text-base font-semibold text-foreground sm:text-[17px]">
                {item.q}
              </span>
              <motion.span
                aria-hidden
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
                className={cn(
                  "shrink-0 transition-colors duration-150 group-hover:text-foreground",
                  isOpen ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.span>
            </button>

            <motion.div
              id={`faq-panel-${i}`}
              role="region"
              initial={false}
              animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
              // Cerrar es más rápido que abrir: la salida no debe demorar la próxima lectura
              transition={{
                duration: reduceMotion ? 0 : isOpen ? 0.22 : 0.16,
                ease: isOpen ? "easeOut" : "easeIn",
              }}
              className="overflow-hidden"
            >
              <p className="max-w-prose pb-6 pr-10 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {item.a}
              </p>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
