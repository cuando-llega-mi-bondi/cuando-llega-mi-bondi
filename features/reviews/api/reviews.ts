import { supabase } from "@shared/infra/supabase";
import type { LineaReview } from "../types";
import { MOCK_REVIEWS_ENABLED, mockDeleteOwn, mockListByLinea, mockUpsertOwn } from "../mockReviews";

type ReviewRow = {
    id: string;
    user_id: string | null;
    linea_codigo: string;
    rating: number;
    comment: string | null;
    display_name: string;
    created_at: string;
    updated_at: string;
};

function toLineaReview(row: ReviewRow): LineaReview {
    return {
        id: row.id,
        userId: row.user_id,
        lineaCodigo: row.linea_codigo,
        rating: row.rating,
        comment: row.comment,
        displayName: row.display_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export async function listByLinea(lineaCodigo: string): Promise<LineaReview[]> {
    if (MOCK_REVIEWS_ENABLED) return mockListByLinea(lineaCodigo);

    const { data, error } = await supabase
        .from("bus_line_reviews")
        .select("*")
        .eq("linea_codigo", lineaCodigo)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as ReviewRow[]).map(toLineaReview);
}

export async function upsertOwn(review: {
    userId: string;
    lineaCodigo: string;
    rating: number;
    comment: string | null;
    displayName: string;
}): Promise<LineaReview> {
    if (MOCK_REVIEWS_ENABLED) return mockUpsertOwn(review);

    const { data, error } = await supabase
        .from("bus_line_reviews")
        .upsert(
            {
                user_id: review.userId,
                linea_codigo: review.lineaCodigo,
                rating: review.rating,
                comment: review.comment,
                display_name: review.displayName,
            },
            { onConflict: "user_id,linea_codigo" },
        )
        .select("*")
        .single();

    if (error) throw error;
    return toLineaReview(data as ReviewRow);
}

export async function deleteOwn(id: string): Promise<void> {
    if (MOCK_REVIEWS_ENABLED) return mockDeleteOwn(id);

    const { error } = await supabase.from("bus_line_reviews").delete().eq("id", id);
    if (error) throw error;
}
