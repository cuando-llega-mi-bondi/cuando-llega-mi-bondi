"use client";

import { useState } from "react";
import { detectAdPlatform, googleFaviconUrl } from "@features/sponsors/lib/destination";
import { IconIg } from "@shared/icons/IconIg";
import { IconXBrand } from "@shared/icons/IconXBrand";
import { IconYoutube } from "@shared/icons/IconYoutube";
import { cn } from "@shared/utils";

export function AdIcon({
  href,
  title,
  size = "md",
}: {
  href: string;
  title?: string;
  size?: "sm" | "md";
}) {
  const [failed, setFailed] = useState(false);
  const letter = (title?.trim()?.[0] || "?").toUpperCase();
  const platform = detectAdPlatform(href);
  const box = size === "sm" ? "h-8 w-8 rounded-lg" : "h-12 w-12 rounded-xl";
  const wrap = cn("flex shrink-0 items-center justify-center bg-foreground text-background", box);

  if (platform === "instagram") {
    return (
      <span className={wrap}>
        <IconIg size={size === "sm" ? 16 : 22} />
      </span>
    );
  }
  if (platform === "x") {
    return (
      <span className={wrap}>
        <IconXBrand size={size === "sm" ? 13 : 18} />
      </span>
    );
  }
  if (platform === "youtube") {
    return (
      <span className={cn(wrap, "bg-[#ff0033] text-white")}>
        <IconYoutube size={size === "sm" ? 16 : 22} />
      </span>
    );
  }

  const src = googleFaviconUrl(href);
  if (!src || failed) {
    return (
      <span className={cn("flex shrink-0 items-center justify-center bg-muted text-foreground font-black", box, size === "sm" ? "text-[12px]" : "text-[16px]")}>
        {letter}
      </span>
    );
  }

  return (
    <span className={cn("flex shrink-0 items-center justify-center overflow-hidden bg-muted", box)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- favicon de CDN, no next/image */}
      <img
        src={src}
        alt=""
        width={size === "sm" ? 20 : 32}
        height={size === "sm" ? 20 : 32}
        className={size === "sm" ? "h-5 w-5" : "h-8 w-8"}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
