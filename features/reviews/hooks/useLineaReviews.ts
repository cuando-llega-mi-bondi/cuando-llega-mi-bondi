"use client";

import { useCallback, useEffect, useState } from "react";
import { listByLinea } from "../api/reviews";
import type { LineaReview } from "../types";

export function useLineaReviews(lineaCodigo: string | undefined) {
    const [reviews, setReviews] = useState<LineaReview[]>([]);
    const [loading, setLoading] = useState(true);

    const refetch = useCallback(() => {
        if (!lineaCodigo) return;
        listByLinea(lineaCodigo)
            .then(setReviews)
            .catch(() => setReviews([]))
            .finally(() => setLoading(false));
    }, [lineaCodigo]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { reviews, loading, refetch };
}
