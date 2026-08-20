import type { LineaReview } from "./types";

export function averageRating(reviews: LineaReview[]): number {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

/** Cantidad de reseñas por puntaje, índice 0 = 1 estrella … índice 4 = 5 estrellas. */
export function ratingDistribution(reviews: LineaReview[]): number[] {
    const counts = [0, 0, 0, 0, 0];
    for (const r of reviews) {
        const idx = Math.min(5, Math.max(1, Math.round(r.rating))) - 1;
        counts[idx]++;
    }
    return counts;
}
