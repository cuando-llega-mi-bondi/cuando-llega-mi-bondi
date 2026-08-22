"use client";

import { useCallback, useRef, useState } from "react";

export function useAdCheckout() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const guard = useRef(false);

  const submitCheckout = useCallback(
    async (payload: {
      slotId: string;
      title: string;
      href: string;
      tagline?: string;
      amountArs: number;
      acceptedTerms: true;
    }) => {
      if (guard.current) return;
      setError(null);
      guard.current = true;
      setIsSubmitting(true);
      try {
        const res = await fetch("/api/ads/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as { error?: string; initPoint?: string };
        if (!res.ok) throw new Error(data.error || "No se pudo iniciar el pago");
        if (data.initPoint) {
          window.location.href = data.initPoint;
          return;
        }
        throw new Error("No payment link returned");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsSubmitting(false);
        guard.current = false;
      }
    },
    [],
  );

  return { submitCheckout, isSubmitting, error };
}
