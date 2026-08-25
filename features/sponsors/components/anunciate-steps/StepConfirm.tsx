"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { formatArs } from "@features/sponsors/lib/pricing";
import { AdCreativeCard } from "../AdCreativeCard";
import { cn } from "@shared/utils";

export function StepConfirm({
  heading,
  title,
  tagline,
  composedHref,
  liveAmount,
  projectedRank,
  acceptedTerms,
  setAcceptedTerms,
  isSubmitting,
  error,
  onSubmit,
}: {
  heading: string;
  title: string;
  tagline: string;
  composedHref: string;
  liveAmount: number;
  projectedRank: number;
  acceptedTerms: boolean;
  setAcceptedTerms: (value: boolean) => void;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  const [legalOpen, setLegalOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-[19px] font-semibold text-foreground outline-none"
      >
        {heading}
      </h2>

      <div
        className={cn(
          "space-y-2.5 rounded-2xl border-2 p-3",
          projectedRank === 1
            ? "border-amarillo/50 bg-gradient-to-br from-amarillo/15 to-transparent"
            : "border-secondary/50 bg-gradient-to-br from-secondary/10 to-transparent",
        )}
      >
        <div className="flex items-center justify-between gap-2 px-0.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black",
              projectedRank === 1 ? "bg-amarillo text-background" : "bg-secondary text-white",
            )}
          >
            Puesto {projectedRank}
          </span>
          <span className="text-[16px] font-black tabular-nums text-foreground">
            {formatArs(liveAmount)}
          </span>
        </div>
        <AdCreativeCard title={title} tagline={tagline || null} href={composedHref} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <button
          type="button"
          onClick={() => setLegalOpen((v) => !v)}
          aria-expanded={legalOpen}
          aria-controls="anunciate-legal"
          className="flex w-full items-center justify-between gap-2 text-left text-[14px] font-bold text-foreground"
        >
          No prometemos resultados
          <span aria-hidden className="text-muted-foreground">
            {legalOpen ? "−" : "+"}
          </span>
        </button>
        <motion.div
          id="anunciate-legal"
          role="region"
          initial={false}
          animate={{ height: legalOpen ? "auto" : 0, opacity: legalOpen ? 1 : 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Pagás para que se publique tu link, rotulado como publicidad. No
            hay visitas mínimas, clics, clientes ni ventas aseguradas. El
            lugar es tuyo mientras sigas entre los dos que más pusieron.
            Bondi MDP no revisa ni recomienda lo que aparezca.
          </p>
        </motion.div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-3">
        <input
          type="checkbox"
          required
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 accent-secondary"
        />
        <span className="text-[13px] leading-snug text-muted-foreground">
          Leí y acepto los{" "}
          <Link href="/terminos" className="font-semibold text-foreground underline underline-offset-2">
            Términos del lugar
          </Link>
          . Entiendo que no hay garantía de resultados y que me pueden sacar
          pagando más.
        </span>
      </label>

      {error ? (
        <p className="text-[13px] text-error" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || !acceptedTerms}
        className="btn-pill btn-primary inline-flex w-full min-h-12 items-center justify-center px-4 text-[15px] font-bold"
      >
        {isSubmitting
          ? "Llevándote a MercadoPago…"
          : `Quedate el puesto ${projectedRank} por ${formatArs(liveAmount)}`}
      </button>
      <p className="text-center text-[12px] leading-relaxed text-muted-foreground">
        Pago seguro a través de MercadoPago. Al pagar también aceptás la{" "}
        <Link href="/privacidad" className="underline underline-offset-2">
          Privacidad
        </Link>
        .
      </p>
    </form>
  );
}
