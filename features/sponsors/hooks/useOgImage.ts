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
  return data?.image ?? null;
}
