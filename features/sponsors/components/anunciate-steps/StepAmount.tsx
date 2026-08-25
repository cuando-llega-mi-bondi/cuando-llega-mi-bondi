"use client";

import { useEffect, useRef, useState } from "react";
import { Crown, Minus, Plus, TrendingUp } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { formatArs } from "@features/sponsors/lib/pricing";
import { AnunciatePreview } from "./AnunciatePreview";
import { cn } from "@shared/utils";

const MAX_AMOUNT_ARS = 2_000_000;

function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function StepAmount({
  heading,
  previewTitle,
  previewTagline,
  previewHref,
  liveAmount,
  amountDraft,
  amountFocused,
  amountValid,
  draftNumber,
  min,
  lead,
  stepArs,
  projectedRank,
  setAmount,
  setAmountDraft,
  setAmountFocused,
  commitAmount,
  bumpAmount,
  pickAmount,
  onNext,
}: {
  heading: string;
  previewTitle: string;
  previewTagline: string | null;
  previewHref: string | null;
  liveAmount: number;
  amountDraft: string;
  amountFocused: boolean;
  amountValid: boolean;
  draftNumber: number;
  min: number;
  lead: number;
  stepArs: number;
  projectedRank: number;
  setAmount: (value: number | null) => void;
  setAmountDraft: (value: string) => void;
  setAmountFocused: (value: boolean) => void;
  commitAmount: (raw: string) => number;
  bumpAmount: (delta: number) => void;
  pickAmount: (raw: number) => void;
  onNext: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  const [infoOpen, setInfoOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-2">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-[19px] font-semibold text-foreground outline-none"
        >
          {heading}
        </h2>
        <button
          type="button"
          onClick={() => setInfoOpen((v) => !v)}
          aria-expanded={infoOpen}
          aria-controls="amount-ranking-info"
          aria-label="Cómo funciona el ranking"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[11px] font-black text-muted-foreground transition-colors hover:bg-secondary/15 hover:text-secondary"
        >
          ?
        </button>
      </div>
      <motion.div
        id="amount-ranking-info"
        role="region"
        initial={false}
        animate={{ height: infoOpen ? "auto" : 0, opacity: infoOpen ? 1 : 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Abajo de «elegí la línea» hay dos recuadros, y no se eligen: es un
          solo ranking por plata. El que más puso va primero, el segundo
          abajo, y del tercero para atrás no se ve. Te pueden pasar en
          cualquier momento: si dos ponen más que vos, salís del aire.
        </p>
      </motion.div>

      <AnunciatePreview title={previewTitle} tagline={previewTagline} href={previewHref} />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => pickAmount(min)}
          className={cn(
            "flex min-h-12 flex-col items-start rounded-2xl border px-4 py-2.5 text-left transition-colors",
            liveAmount < lead
              ? "border-secondary bg-secondary/15"
              : "border-border bg-card hover:border-secondary/40",
          )}
        >
          <span className="flex items-center gap-1.5 text-[12px] font-bold text-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-secondary" strokeWidth={2.5} aria-hidden />
            Entrar al ranking
          </span>
          <span className="mt-0.5 text-[13px] font-black tabular-nums text-secondary">
            {formatArs(min)}
          </span>
        </button>
        <button
          type="button"
          onClick={() => pickAmount(lead)}
          className={cn(
            "flex min-h-12 flex-col items-start rounded-2xl border px-4 py-2.5 text-left transition-colors",
            liveAmount >= lead
              ? "border-amarillo bg-amarillo/10"
              : "border-border bg-card hover:border-secondary/40",
          )}
        >
          <span className="flex items-center gap-1.5 text-[12px] font-bold text-foreground">
            <Crown className="h-3.5 w-3.5 text-amarillo" strokeWidth={2.5} aria-hidden />
            Quedar primero
          </span>
          <span className="mt-0.5 text-[13px] font-black tabular-nums text-amarillo">
            {formatArs(lead)}
          </span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Bajar monto"
          disabled={liveAmount <= min}
          onClick={() => bumpAmount(-stepArs)}
          className="btn-pill btn-ghost inline-flex h-11 w-11 shrink-0 items-center justify-center"
        >
          <Minus className="h-4 w-4" strokeWidth={3} />
        </button>
        <label className="min-w-0 flex-1">
          <span className="sr-only">Monto en pesos</span>
          <input
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="done"
            value={
              amountFocused
                ? amountDraft
                  ? formatArs(Number(amountDraft))
                  : "$"
                : formatArs(liveAmount)
            }
            onFocus={() => {
              setAmountFocused(true);
              setAmountDraft(String(liveAmount));
            }}
            onChange={(e) => {
              const next = digitsOnly(e.target.value);
              setAmountDraft(next);
              if (!next) {
                setAmount(null);
                return;
              }
              const parsed = Number(next);
              if (Number.isFinite(parsed)) {
                setAmount(Math.min(MAX_AMOUNT_ARS, Math.trunc(parsed)));
              }
            }}
            onBlur={() => {
              setAmountFocused(false);
              commitAmount(amountDraft);
            }}
            className="min-h-11 w-full rounded-xl border border-border bg-input px-3 py-2 text-center font-sans text-[22px] font-black tabular-nums tracking-tight text-amarillo outline-none focus:border-secondary"
          />
        </label>
        <button
          type="button"
          aria-label="Subir monto"
          disabled={liveAmount >= MAX_AMOUNT_ARS}
          onClick={() => bumpAmount(stepArs)}
          className="btn-pill btn-ghost inline-flex h-11 w-11 shrink-0 items-center justify-center"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
        </button>
      </div>
      <p className="text-center text-[12px] text-muted-foreground">
        {amountValid
          ? `Con esto quedás en el puesto ${projectedRank}. Mínimo ${formatArs(min)}.`
          : `Mínimo ${formatArs(min)}. Escribí el número si querés poner más.`}
      </p>
      {amountFocused && amountDraft && draftNumber > 0 && draftNumber < min ? (
        <p className="text-center text-[12px] text-error" role="status">
          Tiene que ser al menos {formatArs(min)}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onNext}
        disabled={!amountValid}
        className="btn-pill btn-primary inline-flex w-full min-h-12 items-center justify-center px-4 text-[15px] font-bold"
      >
        Continuar
      </button>
    </section>
  );
}
