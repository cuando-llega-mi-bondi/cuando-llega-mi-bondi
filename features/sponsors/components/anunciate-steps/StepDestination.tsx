"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { IconIg } from "@shared/icons/IconIg";
import { IconXBrand } from "@shared/icons/IconXBrand";
import { IconExternalLink } from "@shared/icons/IconExternalLink";
import { IconYoutube } from "@shared/icons/IconYoutube";
import { type AdPlatform } from "@features/sponsors/lib/destination";
import { cn } from "@shared/utils";

const FIELD =
  "min-h-11 w-full rounded-xl border border-border bg-input px-3 py-2 font-sans text-[16px] leading-normal text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-secondary";

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

export function StepDestination({
  heading,
  platform,
  setPlatform,
  destination,
  setDestination,
  composedHref,
  onNext,
}: {
  heading: string;
  platform: AdPlatform;
  setPlatform: (platform: AdPlatform) => void;
  destination: string;
  setDestination: (value: string) => void;
  composedHref: string | null;
  onNext: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);

  const prefix = prefixFor(platform);

  return (
    <section className="space-y-4">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-[19px] font-semibold text-foreground outline-none"
      >
        {heading}
      </h2>
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
      <button
        type="button"
        onClick={onNext}
        disabled={!composedHref}
        className="btn-pill btn-primary inline-flex w-full min-h-12 items-center justify-center px-4 text-[15px] font-bold"
      >
        Continuar
      </button>
    </section>
  );
}
