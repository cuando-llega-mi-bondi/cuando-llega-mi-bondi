"use client";

import { useState } from "react";
import { AdIcon } from "./AdIcon";
import { IconExternalLink } from "@shared/icons/IconExternalLink";
import { useOgImage } from "@features/sponsors/hooks/useOgImage";
import { cn } from "@shared/utils";

// Muchos sitios no tienen una og:image "banner" real (1200x630) y devuelven
// su logo/favicon cuadrado como fallback. Forzarlo en la franja ancha tipo
// banner (recortado, contenido, o con blur de fondo) siempre queda mal — un
// logo redondo no es una banner. Se mide el aspect ratio recién cargada la
// imagen: si es apaisada se usa la franja con degradado; si es cuadrada se
// muestra como ícono chico, igual que el favicon de fallback.
const BANNER_MIN_ASPECT = 1.4;

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
  const ogImageUrl = useOgImage(href);
  const [imageFailed, setImageFailed] = useState(false);
  const [isBanner, setIsBanner] = useState<boolean | null>(null);

  const hasImage = Boolean(ogImageUrl) && !imageFailed;
  const showBanner = hasImage && isBanner === true;
  const showLogo = hasImage && isBanner === false;

  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setIsBanner(naturalHeight > 0 && naturalWidth / naturalHeight >= BANNER_MIN_ASPECT);
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      aria-label={`Conocer: ${title}`}
      className={cn(
        "relative flex min-h-12 items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card px-3.5 py-4 transition-colors hover:border-secondary/40",
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
          onError={() => setImageFailed(true)}
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
      <span className={cn("relative flex min-w-0 flex-1 items-center gap-3", showBanner && "pl-[36%]")}>
        {!showBanner && !showLogo ? <AdIcon href={href} title={title} /> : null}
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
