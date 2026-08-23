"use client";

import type { AdSlotView } from "@features/sponsors/lib/purchases";
import { AD_SLOTS, type AdSlotId } from "@features/sponsors/lib/slots";
import { formatArs } from "@features/sponsors/lib/pricing";
import { AdCreativeCard } from "./AdCreativeCard";
import { cn } from "@shared/utils";
import Link from "next/link";
import useSWR from "swr";

type SlotsPayload = { slots: AdSlotView[] };

function emptySlots(): AdSlotView[] {
  return AD_SLOTS.map((slot) => ({
    id: slot.id,
    label: slot.label,
    blurb: slot.blurb,
    occupied: false,
    title: null,
    href: null,
    tagline: null,
    amountArs: 0,
    minNextArs: 1_000,
    stepArs: 1_000,
    floorArs: 1_000,
  }));
}

async function fetchSlots(url: string): Promise<SlotsPayload> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("slot");
  return res.json() as Promise<SlotsPayload>;
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

function SlotCard({ slot, rank }: { slot: AdSlotView; rank: 1 | 2 }) {
  const href = `/anunciate?slot=${slot.id}` as const;
  const top = rank === 1;

  const eyebrow = (
    <span className="flex items-center gap-2">
      <RankBadge top={top} />
      <p className={cn("text-[11px] font-bold", top ? "text-foreground" : "text-muted-foreground")}>
        Puesto {rank}
      </p>
    </span>
  );

  if (slot.occupied && slot.href && slot.title) {
    return (
      <div className={cn("space-y-2", top && "rounded-2xl bg-gradient-to-br from-amarillo/15 to-transparent p-2.5 shadow-[0_0_20px_-6px_rgba(249,205,74,0.45)] ring-1 ring-amarillo/30")}>
        <div className="flex items-center justify-between gap-2">
          {eyebrow}
          <Link href={href} className="text-[11px] font-medium text-secondary hover:text-foreground">
            Reemplazalo desde {formatArs(slot.minNextArs)}
          </Link>
        </div>
        <AdCreativeCard title={slot.title} tagline={slot.tagline} href={slot.href} />
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", top && "rounded-2xl bg-gradient-to-br from-amarillo/15 to-transparent p-2.5 shadow-[0_0_20px_-6px_rgba(249,205,74,0.45)] ring-1 ring-amarillo/30")}>
      {eyebrow}
      <Link
        href={href}
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
          Poné tu link desde {formatArs(slot.minNextArs)}
        </span>
      </Link>
    </div>
  );
}

export function SponsorSlot({ className }: { className?: string }) {
  const { data, error } = useSWR("/api/ads/slot", fetchSlots, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });
  const slots = data?.slots ?? (error ? emptySlots() : null);
  if (!slots) {
    return <aside aria-hidden className={cn("mt-6 h-[180px]", className)} />;
  }

  return (
    <aside aria-label="Publicidad" className={cn("mt-6 space-y-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] tracking-[1.4px] text-muted-foreground">
          PUBLICIDAD
        </p>
        <Link href="/anunciate" className="text-[11px] font-medium text-secondary hover:text-foreground">
          Anunciate
        </Link>
      </div>
      {[...slots]
        .sort((a, b) => Number(b.occupied) - Number(a.occupied) || b.amountArs - a.amountArs)
        .map((slot, index) => (
          <SlotCard key={slot.id as AdSlotId} slot={slot} rank={index === 0 ? 1 : 2} />
        ))}
    </aside>
  );
}
