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

function SlotCard({ slot }: { slot: AdSlotView }) {
  const href = `/anunciate?slot=${slot.id}` as const;
  if (slot.occupied && slot.href && slot.title) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[11px] font-bold text-muted-foreground">{slot.label}</p>
          <Link href={href} className="text-[11px] font-medium text-secondary hover:text-foreground">
            Reemplazalo desde {formatArs(slot.minNextArs)}
          </Link>
        </div>
        <AdCreativeCard title={slot.title} tagline={slot.tagline} href={slot.href} />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-bold text-muted-foreground">{slot.label}</p>
      <Link
        href={href}
        className="flex min-h-11 flex-col justify-center rounded-2xl border border-dashed border-border bg-card/60 px-3 py-3 transition-colors hover:border-secondary/40"
      >
        <span className="text-[14px] font-bold text-foreground">Este lugar está libre</span>
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
    <aside aria-label="Publicidad" className={cn("mt-6 space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] tracking-[1.4px] text-muted-foreground">
          PUBLICIDAD
        </p>
        <Link href="/anunciate" className="text-[11px] font-medium text-secondary hover:text-foreground">
          Anunciate
        </Link>
      </div>
      {slots.map((slot) => (
        <SlotCard key={slot.id as AdSlotId} slot={slot} />
      ))}
    </aside>
  );
}
