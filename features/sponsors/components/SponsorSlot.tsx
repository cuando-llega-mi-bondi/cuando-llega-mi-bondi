"use client";

import type { AdBoardEntry, AdBoardView } from "@features/sponsors/lib/purchases";
import { AD_PODIUM_SIZE } from "@features/sponsors/lib/board";
import { formatArs } from "@features/sponsors/lib/pricing";
import { AdCreativeCard } from "./AdCreativeCard";
import { cn } from "@shared/utils";
import { Skeleton } from "@shared/ui/Skeleton";
import Link from "next/link";
import useSWR from "swr";

const POSITIONS = Array.from({ length: AD_PODIUM_SIZE }, (_, i) => i + 1);

function emptyBoard(): AdBoardView {
  return {
    podium: [],
    podiumSize: AD_PODIUM_SIZE,
    minToEnterArs: 1_000,
    minToLeadArs: 1_000,
    stepArs: 1_000,
    floorArs: 1_000,
  };
}

async function fetchBoard(url: string): Promise<AdBoardView> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("board");
  return res.json() as Promise<AdBoardView>;
}

function RankBadge({ top }: { top: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full leading-none",
        top
          ? "bg-amarillo text-[13px]"
          : "bg-muted font-mono text-[11px] font-black text-muted-foreground",
      )}
    >
      {top ? "👑" : 2}
    </span>
  );
}

function PositionCard({
  entry,
  rank,
  priceArs,
}: {
  entry: AdBoardEntry | null;
  rank: number;
  priceArs: number;
}) {
  const top = rank === 1;

  const eyebrow = (
    <span className="flex items-center gap-2">
      <RankBadge top={top} />
      <p className={cn("text-[11px] font-bold", top ? "text-foreground" : "text-muted-foreground")}>
        Puesto {rank}
      </p>
    </span>
  );

  const frame = cn(
    "space-y-2",
    top &&
      "rounded-2xl bg-gradient-to-br from-amarillo/15 to-transparent p-2.5 shadow-[0_0_20px_-6px_rgba(249,205,74,0.45)] ring-1 ring-amarillo/30",
  );

  if (entry) {
    return (
      <div className={frame}>
        <div className="flex items-center justify-between gap-2">
          {eyebrow}
          <Link
            href={top ? "/anunciate?puesto=1" : "/anunciate"}
            className="text-[11px] font-medium text-secondary hover:text-foreground"
          >
            {top ? "Pasalo" : "Reemplazalo"} desde {formatArs(priceArs)}
          </Link>
        </div>
        <AdCreativeCard title={entry.title} tagline={entry.tagline} href={entry.href} />
      </div>
    );
  }

  return (
    <div className={frame}>
      {eyebrow}
      <Link
        href="/anunciate"
        className={cn(
          "flex flex-col justify-center rounded-2xl border border-dashed px-3 transition-colors",
          top
            ? "min-h-12 border-amarillo/50 bg-amarillo/10 py-3.5 hover:border-amarillo"
            : "min-h-11 border-border bg-card/60 py-3 hover:border-secondary/40",
        )}
      >
        <span className={cn("font-bold text-foreground", top ? "text-[15px]" : "text-[14px]")}>
          Este lugar está libre
        </span>
        <span className="mt-0.5 text-[12px] text-muted-foreground">
          Poné tu link desde {formatArs(priceArs)}
        </span>
      </Link>
    </div>
  );
}

// Mismo alto aproximado que un PositionCard real (icono + título + tagline +
// "Conocer") para que el swap a data real no empuje el contenido de abajo.
function SponsorSlotSkeleton({ className }: { className?: string }) {
  return (
    <aside aria-hidden className={cn("mt-10 space-y-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
      {POSITIONS.map((rank) => (
        <div key={rank} className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Sin <Skeleton>: su rounded-xl de base pisa el rounded-full de
                  acá porque cn() no hace merge de Tailwind (ver nota abajo). */}
              <div
                aria-hidden
                className="h-5 w-5 shrink-0 animate-skeleton-shimmer rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0.05)_100%)] bg-[length:220%_100%]"
              />
              <Skeleton className="h-3 w-14" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
          {/* Mismo layout banner que AdCreativeCard con og:image real (el caso
              más común): imagen ancha a la izquierda + texto corrido, en vez
              de un ícono chico que ya sugiere "sin imagen". */}
          <div className="relative flex min-h-12 items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card px-3.5 py-4">
            {/* Corte recto real: cn() no hace merge de Tailwind, así que un
                rounded-none acá no ganaría contra el rounded-xl de <Skeleton>
                (gana el que Tailwind generó después en el CSS, no el último
                del className) — se arma el shimmer a mano, sin ese conflicto. */}
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 h-full w-[48%] animate-skeleton-shimmer bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0.05)_100%)] bg-[length:220%_100%]"
            />
            {/* Título y tagline reales van hasta 2 líneas (line-clamp-2): se
                reservan las 2 en el peor caso, si no el alto queda corto y
                el swap a data real empuja todo lo de abajo igual. */}
            <div className="relative min-w-0 flex-1 space-y-1.5 pl-[36%]">
              <div className="space-y-1">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-2/3" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        </div>
      ))}
      <Skeleton className="mx-auto h-3 w-32" />
    </aside>
  );
}

export function SponsorSlot({ className }: { className?: string }) {
  const { data, error } = useSWR("/api/ads/board", fetchBoard, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });
  const board = data ?? (error ? emptyBoard() : null);
  if (!board) {
    return <SponsorSlotSkeleton className={className} />;
  }

  return (
    <aside aria-label="Publicidad" className={cn("mt-10 space-y-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] tracking-[1.4px] text-muted-foreground">
          PUBLICIDAD
        </p>
        <Link href="/anunciate" className="text-[11px] font-medium text-secondary hover:text-foreground">
          Anunciate
        </Link>
      </div>
      {POSITIONS.map((rank) => {
        const entry = board.podium[rank - 1] ?? null;
        // Para el puesto 1 hay que pasar al primero; para el resto alcanza con
        // superar al último que está al aire (o pagar el piso si sobra lugar).
        const priceArs = rank === 1 && entry ? board.minToLeadArs : board.minToEnterArs;
        return (
          <PositionCard
            key={entry?.id ?? `libre-${rank}`}
            entry={entry}
            rank={rank}
            priceArs={priceArs}
          />
        );
      })}
      <Link
        href="/anunciantes"
        className="block text-center text-[11px] font-medium text-secondary hover:text-foreground"
      >
        Ver más anunciantes
      </Link>
    </aside>
  );
}
