"use client";

import useSWR from "swr";

type OgMetaPayload = { image: string | null; title: string | null; description: string | null };

async function fetchOgMeta(url: string): Promise<OgMetaPayload> {
  const res = await fetch(url);
  if (!res.ok) return { image: null, title: null, description: null };
  return res.json() as Promise<OgMetaPayload>;
}

/**
 * Mismo endpoint y misma key que `useOgImage` (`/api/ads/og-image`): SWR
 * comparte el fetch entre los dos hooks, no hay pedido duplicado por tener
 * ambos montados a la vez.
 */
export function useOgMeta(href: string | null | undefined) {
  const key = href ? `/api/ads/og-image?href=${encodeURIComponent(href)}` : null;
  const { data } = useSWR(key, fetchOgMeta, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 60_000,
  });
  return {
    image: data?.image ?? null,
    title: data?.title ?? null,
    description: data?.description ?? null,
  };
}
