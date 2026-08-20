export interface LineaReview {
    id: string;
    /** null = cuenta eliminada — la reseña quedó pública pero anonimizada. */
    userId: string | null;
    lineaCodigo: string;
    rating: number;
    comment: string | null;
    displayName: string;
    createdAt: string;
    updatedAt: string;
}
