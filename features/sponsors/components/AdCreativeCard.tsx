"use client";

import { AdIcon } from "./AdIcon";
import { IconExternalLink } from "@shared/icons/IconExternalLink";
import { useAdMedia } from "@features/sponsors/hooks/useAdMedia";
import { cn } from "@shared/utils";

export function AdCreativeCard({
  title,
  tagline,
  href,
  className,
}: {
  title: string;
  tagline?: string | null;
  href: string;
  className?: string;
}) {
  const { ogImageUrl, hasImage, showBanner, showLogo, isResolvingImage, handleLoad, handleError } =
    useAdMedia(href);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      aria-label={`Conocer: ${title}`}
      className={cn(
        "relative flex min-h-12 items-center gap-3 overflow-hidden rounded-2xl bg-card px-3.5 py-4 transition-colors",
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
          {/* atenúa capturas claras para que integren con el tema oscuro antes del degradado */}
          <div aria-hidden className="absolute inset-y-0 left-0 w-[48%] bg-black/20" />
          {/* mismo ancho que la imagen: llega a opacidad total justo en su borde recto,
              así el recorte real nunca queda expuesto */}
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 w-[48%] bg-gradient-to-r from-transparent via-card/80 to-card"
          />
        </>
      ) : null}
      {isResolvingImage ? (
        // Todavía no sabemos si va a terminar en banner, logo o favicon —
        // se asume banner (el caso más común con og:image real) en vez de un
        // ícono chico, que ya sugiere visualmente "sin imagen". No se usa
        // <Skeleton>: su `rounded-xl` de base y el `rounded-none` de acá
        // quedan los dos en el className (cn() no hace merge de Tailwind) y
        // gana el que Tailwind generó después en el CSS, no el último en el
        // string — corte recto real solo sale aplicando el shimmer a mano.
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
        {!showBanner && !showLogo && !isResolvingImage ? <AdIcon href={href} title={title} /> : null}
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-[14px] font-bold leading-snug text-foreground">{title}</span>
          {tagline ? (
            <span className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-muted-foreground">
              {tagline}
            </span>
          ) : null}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[12px] font-bold text-secondary">
          Conocer
          <IconExternalLink className="h-3.5 w-3.5" aria-hidden />
        </span>
      </span>
    </a>
  );
}
