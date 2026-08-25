"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { IconIg } from "@shared/icons/IconIg";
import { IconXBrand } from "@shared/icons/IconXBrand";
import { IconExternalLink } from "@shared/icons/IconExternalLink";
import { IconYoutube } from "@shared/icons/IconYoutube";
import type { AdBoardView } from "@features/sponsors/lib/purchases";
import { formatArs } from "@features/sponsors/lib/pricing";
import { AD_PODIUM_SIZE } from "@features/sponsors/lib/board";
import {
  type AdPlatform,
  detectAdPlatform,
  tryComposeAdHref,
} from "@features/sponsors/lib/destination";
import { getRememberedAdPurchaseIds } from "@features/sponsors/lib/myAds";
import { useAdCheckout } from "@features/sponsors/hooks/useAdCheckout";
import { AdCreativeCard } from "./AdCreativeCard";
import { AdHistory } from "./AdHistory";
import { AdIcon } from "./AdIcon";
import { Footer } from "@shared/layout/Footer";
import { Header } from "@shared/layout/Header";
import { BottomNav } from "@shared/layout/BottomNav";
import { PageShell } from "@shared/layout/PageShell";
import { PageHeader } from "@shared/layout/PageHeader";
import { cn } from "@shared/utils";

const FIELD =
  "min-h-11 w-full rounded-xl border border-border bg-input px-3 py-2 font-sans text-[16px] leading-normal text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-secondary";

const MAX_AMOUNT_ARS = 2_000_000;

function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

function clampAmount(value: number, min: number): number {
  return Math.min(MAX_AMOUNT_ARS, Math.max(min, Math.trunc(value)));
}

const PLATFORMS: { id: AdPlatform; label: string; icon: ReactNode }[] = [
  { id: "instagram", label: "Instagram", icon: <IconIg size={18} /> },
  { id: "x", label: "X", icon: <IconXBrand size={16} /> },
  { id: "youtube", label: "YouTube", icon: <IconYoutube size={18} /> },
  { id: "web", label: "Link externo", icon: <IconExternalLink className="h-5 w-5" /> },
];

function prefixFor(platform: AdPlatform): string | null {
  if (platform === "instagram") return "instagram.com/";
  if (platform === "x") return "x.com/";
  if (platform === "youtube") return "youtube.com/@";
  return null;
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

  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [platform, setPlatform] = useState<AdPlatform>("instagram");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [amountDraft, setAmountDraft] = useState("");
  const [amountFocused, setAmountFocused] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [rememberedIds] = useState(() => getRememberedAdPurchaseIds());

  const podium = useMemo(() => board?.podium ?? [], [board]);
  const min = board?.minToEnterArs ?? 1_000;
  const lead = board?.minToLeadArs ?? 1_000;
  const step = board?.stepArs ?? 1_000;

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
  const prefix = prefixFor(platform);

  return (
    <div className="flex min-h-pwa-shell flex-col lg:pl-60">
      <Header />
      <PageShell className="space-y-6">
        <PageHeader
          title="Comprá"
          highlight="un lugar"
          subtitle="Dos lugares en Consultar. Los ganan los dos que más pagaron."
        />

        <section className="rounded-2xl border border-border bg-card p-4">
          <p className="font-mono text-[10px] tracking-[1.4px] text-muted-foreground">
            DÓNDE SE VE
          </p>
          <p className="mt-2 text-[16px] font-bold">En Consultar, en el celular</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Abajo de «elegí la línea» hay dos recuadros, y no se eligen: es un solo
            ranking por plata. El que más puso va primero, el segundo abajo, y del
            tercero para atrás no se ve. Que esté publicado no quiere decir que lo
            vayan a tocar.
          </p>
        </section>

        <section className="space-y-2">
          <p className="font-mono text-[10px] tracking-[1.4px] text-muted-foreground">
            CÓMO ESTÁ AHORA
          </p>
          <ol className="space-y-2">
            {Array.from({ length: AD_PODIUM_SIZE }, (_, index) => {
              const entry = podium[index];
              const rank = index + 1;
              return (
                <li
                  key={entry?.id ?? `libre-${rank}`}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[12px] font-black",
                      rank === 1 ? "bg-amarillo text-background" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {rank}
                  </span>
                  {entry ? (
                    <>
                      <AdIcon href={entry.href} title={entry.title} size="sm" />
                      <span className="line-clamp-1 min-w-0 flex-1 text-[14px] font-bold text-foreground">
                        {entry.title}
                      </span>
                      <span className="shrink-0 text-[13px] font-black tabular-nums text-amarillo">
                        {formatArs(entry.amountArs)}
                      </span>
                    </>
                  ) : (
                    <span className="flex-1 text-[14px] text-muted-foreground">
                      Libre — sale {formatArs(board?.floorArs ?? 1_000)}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => pickAmount(min)}
              className={cn(
                "flex min-h-12 flex-col items-start rounded-2xl border px-3 py-2.5 text-left transition-colors",
                liveAmount < lead
                  ? "border-secondary bg-secondary/15"
                  : "border-border bg-card hover:border-secondary/40",
              )}
            >
              <span className="text-[12px] font-bold text-foreground">Entrar al ranking</span>
              <span className="mt-0.5 text-[13px] font-black tabular-nums text-secondary">
                {formatArs(min)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => pickAmount(lead)}
              className={cn(
                "flex min-h-12 flex-col items-start rounded-2xl border px-3 py-2.5 text-left transition-colors",
                liveAmount >= lead
                  ? "border-amarillo bg-amarillo/10"
                  : "border-border bg-card hover:border-secondary/40",
              )}
            >
              <span className="text-[12px] font-bold text-foreground">Quedar primero</span>
              <span className="mt-0.5 text-[13px] font-black tabular-nums text-amarillo">
                {formatArs(lead)}
              </span>
            </button>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Te pueden pasar en cualquier momento: si dos ponen más que vos, salís
            del aire.
          </p>
        </section>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
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
        >
          <div className="space-y-2">
            <p className="font-mono text-[10px] tracking-[1.4px] text-muted-foreground">
              ¿A DÓNDE LOS MANDÁS?
            </p>
            <p className="text-[13px] text-muted-foreground">
              El que toque tu aviso cae acá. Si tu link tiene imagen para
              compartir (og:image) la mostramos de fondo; si no, usamos el
              ícono de la red o el favicon.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((item) => {
                const active = platform === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPlatform(item.id)}
                    className={cn(
                      "flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-[13px] font-bold transition-colors",
                      active
                        ? "border-secondary bg-secondary/15 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-secondary/40",
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </div>
            <label className="block">
              {prefix ? (
                <span className="flex min-h-11 items-center overflow-hidden rounded-xl border border-border bg-input focus-within:border-secondary">
                  <span className="shrink-0 pl-3 text-[14px] text-muted-foreground">{prefix}</span>
                  <input
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="tu.cuenta"
                    className="min-h-11 min-w-0 flex-1 bg-transparent px-1 py-2 pr-3 font-sans text-[16px] text-foreground outline-none"
                  />
                </span>
              ) : (
                <input
                  required
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  maxLength={2048}
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="https://tu-sitio.com"
                  className={FIELD}
                />
              )}
            </label>
            {composedHref ? (
              <p className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <AdIcon href={composedHref} title={title || destination} size="sm" />
                {detectAdPlatform(composedHref) === "web"
                  ? "Si tu sitio no tiene og:image, mostramos el favicon o, si no tiene, la inicial."
                  : "Este iconito va a aparecer si tu link no tiene imagen para compartir."}
              </p>
            ) : null}
          </div>

          <label className="block space-y-1.5">
            <span className="font-mono text-[10px] tracking-[1.4px] text-muted-foreground">
              TÍTULO
            </span>
            <input
              required
              maxLength={80}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tu comercio o proyecto"
              className={FIELD}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="font-mono text-[10px] tracking-[1.4px] text-muted-foreground">
              TEXTO (OPCIONAL)
            </span>
            <input
              maxLength={140}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Una línea para que entiendan qué sos"
              className={FIELD}
            />
          </label>

          {title.trim() && composedHref ? (
            <div className="rounded-2xl border border-border bg-muted/40 p-3">
              <p className="mb-2 font-mono text-[10px] tracking-[1.4px] text-muted-foreground">
                ASÍ SE VE EN CONSULTAR
              </p>
              <AdCreativeCard
                title={title.trim()}
                tagline={tagline.trim() || null}
                href={composedHref}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="font-mono text-[10px] tracking-[1.4px] text-muted-foreground">
              CUÁNTO PONÉS
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Bajar monto"
                disabled={liveAmount <= min}
                onClick={() => bumpAmount(-step)}
                className="btn-pill btn-ghost inline-flex h-11 w-11 shrink-0 items-center justify-center text-lg font-bold"
              >
                −
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
                onClick={() => bumpAmount(step)}
                className="btn-pill btn-ghost inline-flex h-11 w-11 shrink-0 items-center justify-center text-lg font-bold"
              >
                +
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
          </div>

          {error ? (
            <p className="text-[13px] text-error" role="alert">
              {error}
            </p>
          ) : null}

          <section className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[14px] font-bold text-foreground">
              No prometemos resultados
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              Pagás para que se publique tu link, rotulado como publicidad. No
              hay visitas mínimas, clics, clientes ni ventas aseguradas. El lugar
              es tuyo mientras sigas entre los dos que más pusieron. Bondi MDP no
              revisa ni recomienda lo que aparezca.
            </p>
          </section>

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

          <button
            type="submit"
            disabled={
              isSubmitting || !title.trim() || !composedHref || !acceptedTerms || !amountValid || !board
            }
            className={cn(
              "btn-pill btn-primary inline-flex w-full min-h-12 items-center justify-center px-4 text-[15px] font-bold",
            )}
          >
            {isSubmitting
              ? "Llevándote a MercadoPago…"
              : `Quedate el puesto ${projectedRank} por ${formatArs(liveAmount)}`}
          </button>
          <p className="text-center text-[12px] text-muted-foreground">
            Pago seguro a través de MercadoPago.
          </p>
        </form>

        <AdHistory liveIds={podium.map((entry) => entry.id)} mineIds={rememberedIds} />

        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Al pagar aceptás los{" "}
          <Link href="/terminos" className="underline underline-offset-2">
            Términos del lugar
          </Link>{" "}
          y la{" "}
          <Link href="/privacidad" className="underline underline-offset-2">
            Privacidad
          </Link>
          .
        </p>

        <Footer />
      </PageShell>
      <BottomNav />
    </div>
  );
}
