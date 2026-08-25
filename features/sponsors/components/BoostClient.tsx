"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import type { AdHistoryView } from "@features/sponsors/lib/purchases";
import { compareAdBids } from "@features/sponsors/lib/board";
import { formatArs } from "@features/sponsors/lib/pricing";
import { useAdCheckout } from "@features/sponsors/hooks/useAdCheckout";
import { AdCreativeCard } from "./AdCreativeCard";
import { Header } from "@shared/layout/Header";
import { BottomNav } from "@shared/layout/BottomNav";
import { PageShell } from "@shared/layout/PageShell";
import { cn } from "@shared/utils";

const MAX_AMOUNT_ARS = 2_000_000;
const PRESET_PCTS = [0.1, 0.5, 1] as const;

const DATE_FORMAT = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

async function fetchHistory(url: string): Promise<AdHistoryView> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar el historial");
  return res.json() as Promise<AdHistoryView>;
}

function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

function clampAmount(value: number): number {
  return Math.min(MAX_AMOUNT_ARS, Math.max(1, Math.trunc(value)));
}

function BackLink() {
  return (
    <Link
      href="/anunciate"
      className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground no-underline transition hover:border-secondary hover:text-foreground"
      title="Volver"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
    </Link>
  );
}

function RankChip({ rank }: { rank: number }) {
  const live = rank <= 2;
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2 font-mono text-[11px] font-black",
        live ? "bg-amarillo text-background" : "bg-muted text-muted-foreground",
      )}
    >
      #{rank}
    </span>
  );
}

export function BoostClient({ purchaseId }: { purchaseId: string }) {
  const { data: history } = useSWR("/api/ads/history", fetchHistory, { revalidateOnFocus: false });
  const { submitCheckout, isSubmitting, error } = useAdCheckout();

  const [amount, setAmount] = useState<number | null>(null);
  const [amountDraft, setAmountDraft] = useState("");
  const [amountFocused, setAmountFocused] = useState(false);

  if (!history) {
    return (
      <div className="flex min-h-pwa-shell flex-col lg:pl-60">
        <Header />
        <PageShell>
          <p className="py-10 text-center text-[13px] text-muted-foreground">Cargando…</p>
        </PageShell>
        <BottomNav />
      </div>
    );
  }

  const entries = history.entries;
  const target = entries.find((entry) => entry.id === purchaseId);

  if (!target) {
    return (
      <div className="flex min-h-pwa-shell flex-col lg:pl-60">
        <Header />
        <PageShell>
          <BackLink />
          <p className="text-[14px] text-muted-foreground">
            No encontramos este aviso. Puede que ya no esté aprobado.{" "}
            <Link href="/anunciate" className="font-semibold text-secondary underline underline-offset-2">
              Volver
            </Link>
            .
          </p>
        </PageShell>
        <BottomNav />
      </div>
    );
  }

  const sorted = [...entries].sort(compareAdBids);
  const currentRank = sorted.findIndex((entry) => entry.id === target.id) + 1;
  const presets = PRESET_PCTS.map((pct) => clampAmount(Math.round(target.amountArs * pct)));

  const liveAmount = amount ?? presets[0];
  const draftNumber = Number(digitsOnly(amountDraft));
  const amountValid =
    liveAmount > 0 &&
    liveAmount <= MAX_AMOUNT_ARS &&
    !(amountFocused && (!amountDraft || !Number.isFinite(draftNumber) || draftNumber <= 0));

  const projectedAmount = target.amountArs + liveAmount;
  const projectedRank =
    sorted.filter((entry) => entry.id !== target.id && entry.amountArs >= projectedAmount).length + 1;

  function commitAmount(raw: string): number {
    const parsed = Number(digitsOnly(raw));
    const next = clampAmount(Number.isFinite(parsed) && parsed > 0 ? parsed : presets[0]);
    setAmount(next);
    setAmountDraft(String(next));
    return next;
  }

  function pickPreset(value: number) {
    setAmount(value);
    setAmountDraft(String(value));
  }

  return (
    <div className="flex min-h-pwa-shell flex-col lg:pl-60">
      <Header />
      <PageShell className="space-y-6">
        <BackLink />

        <div>
          <h1 className="font-display text-[24px] font-semibold tracking-[-0.04em] text-foreground">
            Empujá este aviso
          </h1>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Tu plata se suma a lo que este aviso ya pagó y lo empuja más arriba en
            el ranking. El aviso sigue siendo de quien lo publicó.
          </p>
        </div>

        <div className="space-y-2 rounded-2xl border border-border bg-card p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <RankChip rank={currentRank} />
              <span className="text-[12px] text-muted-foreground">
                {DATE_FORMAT.format(new Date(target.since))}
              </span>
            </div>
            <span className="text-[13px] font-black tabular-nums text-amarillo">
              {formatArs(target.amountArs)}
            </span>
          </div>
          <AdCreativeCard title={target.title} tagline={target.tagline} href={target.href} />
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!amountValid) return;
            const amountArs = commitAmount(amountFocused ? amountDraft : String(liveAmount));
            void submitCheckout({ boostedFromId: target.id, amountArs, acceptedTerms: true });
          }}
        >
          <div className="grid grid-cols-3 gap-2">
            {presets.map((value, index) => {
              const active = !amountFocused && liveAmount === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => pickPreset(value)}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center rounded-2xl border px-2 py-2 text-center transition-colors",
                    active
                      ? "border-secondary bg-secondary/15"
                      : "border-border bg-card hover:border-secondary/40",
                  )}
                >
                  <span className="text-[13px] font-black tabular-nums text-foreground">
                    {formatArs(value)}
                  </span>
                  <span className="mt-0.5 text-[11px] text-muted-foreground">
                    {Math.round(PRESET_PCTS[index] * 100)}%
                  </span>
                </button>
              );
            })}
          </div>

          <label className="block">
            <span className="sr-only">Monto a aportar</span>
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
                if (Number.isFinite(parsed)) setAmount(Math.min(MAX_AMOUNT_ARS, Math.trunc(parsed)));
              }}
              onBlur={() => {
                setAmountFocused(false);
                commitAmount(amountDraft);
              }}
              className="min-h-11 w-full rounded-xl border border-border bg-input px-3 py-2 text-center font-sans text-[22px] font-black tabular-nums tracking-tight text-amarillo outline-none focus:border-secondary"
            />
          </label>

          <div className="space-y-2 rounded-2xl border border-border bg-muted/40 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] tracking-[1.4px] text-muted-foreground">HOY TIENE</p>
                <p className="text-[15px] font-black tabular-nums text-muted-foreground">
                  {formatArs(target.amountArs)}
                </p>
              </div>
              <span className="text-muted-foreground">→</span>
              <div className="flex-1">
                <p className="font-mono text-[10px] tracking-[1.4px] text-muted-foreground">CON TU APOYO</p>
                <p className="text-[15px] font-black tabular-nums text-amarillo">
                  {formatArs(projectedAmount)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <RankChip rank={currentRank} />
                <span className="text-muted-foreground">→</span>
                <RankChip rank={projectedRank} />
              </div>
            </div>
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              {projectedRank < currentRank
                ? `Sube del #${currentRank} al #${projectedRank}.`
                : `Se queda en el #${projectedRank}: hace falta más para subir de puesto.`}
            </p>
          </div>

          {error ? (
            <p className="text-[13px] text-error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || !amountValid}
            className="btn-pill btn-primary inline-flex w-full min-h-12 items-center justify-center px-4 text-[15px] font-bold"
          >
            {isSubmitting ? "Llevándote a MercadoPago…" : `Apoyar con ${formatArs(liveAmount)}`}
          </button>
          <p className="text-center text-[12px] text-muted-foreground">
            Pago seguro a través de MercadoPago.
          </p>
        </form>
      </PageShell>
      <BottomNav />
    </div>
  );
}
