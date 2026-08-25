"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import type { AdBoardView } from "@features/sponsors/lib/purchases";
import { type AdPlatform, tryComposeAdHref } from "@features/sponsors/lib/destination";
import { getRememberedAdPurchaseIds } from "@features/sponsors/lib/myAds";
import { useAdCheckout } from "@features/sponsors/hooks/useAdCheckout";
import { useOgMeta } from "@features/sponsors/hooks/useOgMeta";
import { withViewTransition } from "@shared/pwa/viewTransition";
import { StepDestination } from "./anunciate-steps/StepDestination";
import { StepDetails } from "./anunciate-steps/StepDetails";
import { StepAmount } from "./anunciate-steps/StepAmount";
import { StepConfirm } from "./anunciate-steps/StepConfirm";
import { AdHistory } from "./AdHistory";
import { Footer } from "@shared/layout/Footer";
import { Header } from "@shared/layout/Header";
import { BottomNav } from "@shared/layout/BottomNav";
import { PageShell } from "@shared/layout/PageShell";
import { PageHeader } from "@shared/layout/PageHeader";
import { cn } from "@shared/utils";

const MAX_AMOUNT_ARS = 2_000_000;

const STEP_HEADINGS = [
  "¿A dónde lo mandás?",
  "Contá qué es",
  "Cuánto ponés",
  "Confirmá y pagá",
] as const;
const TOTAL_STEPS = STEP_HEADINGS.length;

function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

function clampAmount(value: number, min: number): number {
  return Math.min(MAX_AMOUNT_ARS, Math.max(min, Math.trunc(value)));
}

async function fetchBoard(url: string): Promise<AdBoardView> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar el ranking");
  return res.json() as Promise<AdBoardView>;
}

export function AnunciateClient() {
  const params = useSearchParams();
  const wantsFirst = params.get("puesto") === "1";
  const { data: board } = useSWR("/api/ads/board", fetchBoard, {
    revalidateOnFocus: true,
  });
  const { submitCheckout, isSubmitting, error } = useAdCheckout();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [platform, setPlatform] = useState<AdPlatform>("instagram");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [amountDraft, setAmountDraft] = useState("");
  const [amountFocused, setAmountFocused] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [rememberedIds] = useState(() => getRememberedAdPurchaseIds());

  function goToStep(next: number) {
    withViewTransition(() => setStep(next));
  }

  const podium = useMemo(() => board?.podium ?? [], [board]);
  const min = board?.minToEnterArs ?? 1_000;
  const lead = board?.minToLeadArs ?? 1_000;
  const stepArs = board?.stepArs ?? 1_000;

  // El monto arranca en el mínimo (o en lo que sale quedar primero si vino de
  // ese link) y se recalcula solo si el ranking se mueve mientras completás:
  // derivarlo evita tener que pisar el estado desde un efecto.
  const liveAmount = Math.max(amount ?? (wantsFirst ? lead : min), min);
  const draftNumber = Number(digitsOnly(amountDraft));
  const amountValid =
    liveAmount >= min &&
    liveAmount <= MAX_AMOUNT_ARS &&
    !(amountFocused && (!amountDraft || !Number.isFinite(draftNumber) || draftNumber < min));

  // Empatar no alcanza: a igual monto gana el que pagó primero, igual que en el
  // ranking real.
  const projectedRank = podium.filter((entry) => entry.amountArs >= liveAmount).length + 1;

  function commitAmount(raw: string): number {
    const parsed = Number(digitsOnly(raw));
    const next = clampAmount(Number.isFinite(parsed) && parsed > 0 ? parsed : min, min);
    setAmount(next);
    setAmountDraft(String(next));
    return next;
  }

  function bumpAmount(delta: number) {
    const next = clampAmount(liveAmount + delta, min);
    setAmount(next);
    setAmountDraft(String(next));
  }

  function pickAmount(raw: number) {
    const next = clampAmount(raw, min);
    setAmount(next);
    setAmountDraft(String(next));
  }

  const composedHref = useMemo(
    () => tryComposeAdHref(platform, destination),
    [platform, destination],
  );
  // Se pide desde el paso 1 (no recién en el paso 2) para que ya esté listo
  // cuando el usuario llega a cargar título/texto.
  const ogMeta = useOgMeta(composedHref);

  return (
    <div className="flex min-h-pwa-shell flex-col lg:pl-60">
      <Header />
      <PageShell className="flex flex-col">
        <div className="flex-1 space-y-6">
          <PageHeader
            title="Comprá"
            highlight="un lugar"
            subtitle="Dos lugares en Consultar. Los ganan los dos que más pagaron."
          />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => goToStep(step - 1)}
                  aria-label="Volver"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground transition hover:border-secondary hover:text-foreground"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 12H5" />
                    <path d="M12 19l-7-7 7-7" />
                  </svg>
                </button>
              ) : null}
              <p role="status" aria-live="polite" className="flex-1 text-[12px] font-medium text-muted-foreground">
                Paso {step} de {TOTAL_STEPS}
              </p>
            </div>
            <div className="flex gap-1">
              {STEP_HEADINGS.map((label, index) => {
                const n = index + 1;
                const done = n < step;
                const current = n === step;
                return (
                  <button
                    key={label}
                    type="button"
                    disabled={n > step || current}
                    onClick={() => goToStep(n)}
                    aria-label={`Ir al paso ${n}: ${label}`}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      done || current ? "bg-secondary" : "bg-muted",
                      done ? "cursor-pointer" : "cursor-default",
                    )}
                  />
                );
              })}
            </div>
          </div>

          {step === 1 ? (
            <StepDestination
              heading={STEP_HEADINGS[0]}
              platform={platform}
              setPlatform={setPlatform}
              destination={destination}
              setDestination={setDestination}
              composedHref={composedHref}
              onNext={() => goToStep(2)}
            />
          ) : null}

          {step === 2 ? (
            <StepDetails
              heading={STEP_HEADINGS[1]}
              title={title}
              setTitle={setTitle}
              tagline={tagline}
              setTagline={setTagline}
              composedHref={composedHref ?? ""}
              suggestedTitle={ogMeta.title}
              suggestedTagline={ogMeta.description}
              onNext={() => goToStep(3)}
            />
          ) : null}

          {step === 3 ? (
            <StepAmount
              heading={STEP_HEADINGS[2]}
              previewTitle={title.trim() || destination.trim() || "Tu aviso"}
              previewTagline={tagline.trim() || null}
              previewHref={composedHref}
              liveAmount={liveAmount}
              amountDraft={amountDraft}
              amountFocused={amountFocused}
              amountValid={amountValid}
              draftNumber={draftNumber}
              min={min}
              lead={lead}
              stepArs={stepArs}
              projectedRank={projectedRank}
              setAmount={setAmount}
              setAmountDraft={setAmountDraft}
              setAmountFocused={setAmountFocused}
              commitAmount={commitAmount}
              bumpAmount={bumpAmount}
              pickAmount={pickAmount}
              onNext={() => goToStep(4)}
            />
          ) : null}

          {step === 4 ? (
            <StepConfirm
              heading={STEP_HEADINGS[3]}
              title={title.trim()}
              tagline={tagline.trim()}
              composedHref={composedHref ?? ""}
              liveAmount={liveAmount}
              projectedRank={projectedRank}
              acceptedTerms={acceptedTerms}
              setAcceptedTerms={setAcceptedTerms}
              isSubmitting={isSubmitting}
              error={error}
              onSubmit={() => {
                if (!acceptedTerms || !composedHref || !board) return;
                const amountArs = commitAmount(amountFocused ? amountDraft : String(liveAmount));
                void submitCheckout({
                  title: title.trim(),
                  href: composedHref,
                  tagline: tagline.trim() || undefined,
                  amountArs,
                  acceptedTerms: true,
                });
              }}
            />
          ) : null}

          {step === 1 ? (
            <AdHistory liveIds={podium.map((entry) => entry.id)} mineIds={rememberedIds} />
          ) : null}
        </div>

        <Footer />
      </PageShell>
      <BottomNav />
    </div>
  );
}
