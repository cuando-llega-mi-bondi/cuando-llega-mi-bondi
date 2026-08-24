"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@shared/utils";

interface FaqItem {
  q: string;
  a: string;
}

/**
 * Lista plana en una sola columna (no grilla de 2), envuelta en un único
 * contenedor con divisores — evita el problema de la grilla 2 col donde una
 * pregunta abierta "infla" a su vecina por el stretch de la fila.
 */
export function FaqAccordion({ items }: { items: readonly FaqItem[] }) {
  // Single-open accordion: opening one collapses the rest.
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0 : 0.3;

  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <motion.div
            key={item.q}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{
              opacity: 1,
              y: 0,
              transition: { duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] },
            }}
            viewport={{ once: true, margin: "0px 0px -80px 0px" }}
            className={cn("transition-colors", isOpen && "bg-secondary/[0.04]")}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${i}`}
              className="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left outline-none"
            >
              <HelpCircle className="h-4 w-4 shrink-0 text-secondary" strokeWidth={2.5} />
              <span className="flex-1 text-[15px] font-semibold text-foreground">{item.q}</span>
              <motion.span
                aria-hidden
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
                className="shrink-0 text-muted-foreground"
              >
                <ChevronDown className="h-4 w-4" />
              </motion.span>
            </button>

            <motion.div
              id={`faq-panel-${i}`}
              role="region"
              initial={false}
              animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
              transition={{ duration, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <p className="px-5 pb-4 pl-12 text-[14px] leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
