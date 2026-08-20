import { describe, expect, it } from "vitest";
import { averageRating, ratingDistribution } from "./reviewStats";
import type { LineaReview } from "./types";

function review(rating: number): LineaReview {
    return {
        id: crypto.randomUUID(),
        userId: "u",
        lineaCodigo: "203",
        rating,
        comment: null,
        displayName: "test",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
    };
}

describe("averageRating", () => {
    it("da 0 sin reseñas", () => {
        expect(averageRating([])).toBe(0);
    });

    it("promedia las estrellas", () => {
        expect(averageRating([review(5), review(3), review(4)])).toBeCloseTo(4, 5);
    });
});

describe("ratingDistribution", () => {
    it("da todo en cero sin reseñas", () => {
        expect(ratingDistribution([])).toEqual([0, 0, 0, 0, 0]);
    });

    it("cuenta cada puntaje en su casillero", () => {
        expect(ratingDistribution([review(5), review(5), review(1), review(3)])).toEqual([
            1, 0, 1, 0, 2,
        ]);
    });
});
