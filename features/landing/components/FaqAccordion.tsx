"use client";
"use no memo";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@shared/utils";

interface FaqItem {
  q: string;
  a: string;
}

export function FaqAccordion({ items }: { items: readonly FaqItem[] }) {
  // Single-open accordion: opening one collapses the rest.
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0 : 0.3;

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={item.q}
            className={cn(
              "rounded-2xl border bg-card px-5 transition-colors",
              isOpen
                ? "border-[#2bb3a8]/40"
                : "border-border hover:border-[#2bb3a8]/40",
            )}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${i}`}
              className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left text-[15px] font-semibold text-foreground outline-none"
            >
              {item.q}
              <motion.span
                aria-hidden
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
                className="shrink-0 text-xl font-light text-amarillo"
              >
                +
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
              <p className="pb-4 text-[14px] leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
