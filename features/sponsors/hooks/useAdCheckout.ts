"use client";

import { useCallback, useRef, useState } from "react";
import { rememberAdPurchaseId } from "@features/sponsors/lib/myAds";

export function useAdCheckout() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const guard = useRef(false);

  const submitCheckout = useCallback(
    async (payload: {
      title?: string;
      href?: string;
      tagline?: string;
      amountArs: number;
      acceptedTerms: true;
      boostedFromId?: string;
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
        const data = (await res.json()) as {
          error?: string;
          initPoint?: string;
          purchaseId?: string;
        };
        if (!res.ok) throw new Error(data.error || "No se pudo iniciar el pago");
        if (data.initPoint) {
          if (data.purchaseId) rememberAdPurchaseId(data.purchaseId);
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
