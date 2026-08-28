"use client";

import type { RefObject } from "react";
import { AdIcon } from "./AdIcon";
import { IconExternalLink } from "@shared/icons/IconExternalLink";
import { useAdMedia } from "@features/sponsors/hooks/useAdMedia";
import { cn } from "@shared/utils";

/**
 * Misma pinta EXACTA que AdCreativeCard, pero título y texto son inputs
 * editables en el lugar exacto donde se van a mostrar. El subrayado marca
 * el estado: punteado mientras está vacío, sólido y turquesa mientras se
 * edita (`focus-within`, sin JS), sólido tenue una vez que ya tiene texto.
 */
export function AdCreativeCardEditable({
  title,
  setTitle,
  tagline,
  setTagline,
  href,
  titleMaxLength,
  taglineMaxLength,
  titleInputRef,
  onEditingChange,
  className,
}: {
  title: string;
  setTitle: (value: string) => void;
  tagline: string;
  setTagline: (value: string) => void;
  href: string;
  titleMaxLength: number;
  taglineMaxLength: number;
  titleInputRef: RefObject<HTMLInputElement | null>;
  onEditingChange: (editing: boolean) => void;
  className?: string;
}) {
  const { ogImageUrl, hasImage, showBanner, showLogo, isResolvingImage, handleLoad, handleError } =
    useAdMedia(href);

  return (
    <div
      className={cn(
        "relative flex min-h-12 items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card px-3.5 py-4 transition-colors focus-within:border-secondary",
        className,
      )}
    >
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- og:image externa, no next/image
        <img
          src={ogImageUrl ?? undefined}
          alt=""
          aria-hidden
          onLoad={handleLoad}
          onError={handleError}
          className={
            showBanner
              ? "absolute inset-y-0 left-0 h-full w-[48%] object-cover"
              : showLogo
              ? "h-12 w-12 shrink-0 rounded-full border border-border/50 bg-muted object-cover"
              : "absolute h-0 w-0 opacity-0" // midiendo aspect ratio todavía, no se muestra
          }
        />
      ) : null}
      {showBanner ? (
        <>
          <div aria-hidden className="absolute inset-y-0 left-0 w-[48%] bg-black/20" />
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 w-[48%] bg-gradient-to-r from-transparent via-card/80 to-card"
          />
        </>
      ) : null}
      {isResolvingImage ? (
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 h-full w-[48%] animate-skeleton-shimmer bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0.05)_100%)] bg-[length:220%_100%]"
        />
      ) : null}
      <span
        className={cn(
          "relative flex min-w-0 flex-1 items-center gap-3",
          (showBanner || isResolvingImage) && "pl-[36%]",
        )}
      >
        {!showBanner && !showLogo && !isResolvingImage ? (
          <AdIcon href={href} title={title || "Tu aviso"} />
        ) : null}
        <span className="min-w-0 flex-1 space-y-1">
          <label
            className={cn(
              "block border-b pb-0.5 transition-colors focus-within:border-solid focus-within:border-secondary",
              title.trim() ? "border-solid border-border" : "border-dashed border-secondary/50",
            )}
          >
            <span className="sr-only">Título del aviso</span>
            <input
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => onEditingChange(true)}
              onBlur={() => onEditingChange(false)}
              maxLength={titleMaxLength}
              placeholder="Tu comercio o proyecto"
              className="w-full min-w-0 bg-transparent font-sans text-[16px] font-bold leading-snug text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground/70"
            />
          </label>
          <label
            className={cn(
              "block border-b pb-0.5 transition-colors focus-within:border-solid focus-within:border-secondary",
              tagline.trim() ? "border-solid border-border" : "border-dashed border-border",
            )}
          >
            <span className="sr-only">Texto opcional del aviso</span>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              onFocus={() => onEditingChange(true)}
              onBlur={() => onEditingChange(false)}
              maxLength={taglineMaxLength}
              placeholder="Una línea para que entiendan qué sos"
              className="w-full min-w-0 bg-transparent font-sans text-[16px] leading-snug text-muted-foreground outline-none placeholder:text-muted-foreground/50"
            />
          </label>
        </span>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[12px] font-bold text-secondary hover:text-foreground"
        >
          Conocer
          <IconExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </span>
    </div>
  );
}
