"use client";

import useSWR from "swr";

type OgImagePayload = { image: string | null };

async function fetchOgImage(url: string): Promise<OgImagePayload> {
  const res = await fetch(url);
  if (!res.ok) return { image: null };
  return res.json() as Promise<OgImagePayload>;
}

export function useOgImage(href: string | null | undefined) {
  const key = href ? `/api/ads/og-image?href=${encodeURIComponent(href)}` : null;
  const { data } = useSWR(key, fetchOgImage, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 60_000,
  });
  // `data === undefined` en vez del `isLoading` de SWR: ese flag recién se
  // pone en true dentro de un efecto (no en el primer render), así que
  // alcanzaba a pintar un frame con `isLoading: false` antes de arrancar el
  // fetch — suficiente para que el favicon parpadeara antes del og:image.
  return { ogImageUrl: data?.image ?? null, isLoading: key !== null && data === undefined };
}
