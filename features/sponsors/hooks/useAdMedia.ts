"use client";

import { useState } from "react";
import { useOgImage } from "@features/sponsors/hooks/useOgImage";

// Muchos sitios no tienen una og:image "banner" real (1200x630) y devuelven
// su logo/favicon cuadrado como fallback. Forzarlo en la franja ancha tipo
// banner (recortado, contenido, o con blur de fondo) siempre queda mal — un
// logo redondo no es una banner. Se mide el aspect ratio recién cargada la
// imagen: si es apaisada se usa la franja con degradado; si es cuadrada se
// muestra como ícono chico, igual que el favicon de fallback.
const BANNER_MIN_ASPECT = 1.4;

/** Detección de banner/logo compartida entre AdCreativeCard y su versión editable. */
export function useAdMedia(href: string) {
  const { ogImageUrl, isLoading: isLoadingOgImage } = useOgImage(href);
  const [imageFailed, setImageFailed] = useState(false);
  const [isBanner, setIsBanner] = useState<boolean | null>(null);

  const hasImage = Boolean(ogImageUrl) && !imageFailed;
  const showBanner = hasImage && isBanner === true;
  const showLogo = hasImage && isBanner === false;
  // Todavía no sabemos si hay og:image (fetch en curso) o la tenemos pero
  // falta medir el aspect ratio: en los dos casos conviene esperar en vez de
  // mostrar el favicon y después reemplazarlo por la imagen real.
  const isResolvingImage = isLoadingOgImage || (hasImage && isBanner === null);

  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setIsBanner(naturalHeight > 0 && naturalWidth / naturalHeight >= BANNER_MIN_ASPECT);
  }

  function handleError() {
    setImageFailed(true);
  }

  return { ogImageUrl, hasImage, showBanner, showLogo, isResolvingImage, handleLoad, handleError };
}
