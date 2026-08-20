"use client";

import { useMemo, useState } from "react";
import { Button } from "@shared/ui/Button";
import { Skeleton } from "@shared/ui/Skeleton";
import { toast } from "@shared/ui/store/useToastStore";
import { useLineaReviews } from "../hooks/useLineaReviews";
import { useReviewsUser } from "../hooks/useReviewsUser";
import { deleteOwn, upsertOwn } from "../api/reviews";
import { averageRating } from "../reviewStats";
import { RatingHistogram } from "./RatingHistogram";
import { RatingStars } from "./RatingStars";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { SignInModal } from "./SignInModal";

interface ReviewsPanelProps {
    lineaCodigo: string;
    lineaNombre: string;
}

/** Reseñas de una línea: propia (crear/editar/borrar) + de otros usuarios. */
export function ReviewsPanel({ lineaCodigo, lineaNombre }: ReviewsPanelProps) {
    const { user } = useReviewsUser();
    const { reviews, loading, refetch } = useLineaReviews(lineaCodigo);
    const [signInOpen, setSignInOpen] = useState(false);
    const [editing, setEditing] = useState(false);

    const ownReview = useMemo(() => reviews.find((r) => r.userId === user?.id), [reviews, user?.id]);
    const otherReviews = useMemo(() => reviews.filter((r) => r.userId !== user?.id), [reviews, user?.id]);
    const average = useMemo(() => averageRating(reviews), [reviews]);

    async function handleSubmit(input: { rating: number; comment: string; displayName: string }) {
        if (!user) return;
        try {
            await upsertOwn({
                userId: user.id,
                lineaCodigo,
                rating: input.rating,
                comment: input.comment || null,
                displayName: input.displayName,
            });
            setEditing(false);
            refetch();
            toast({ description: "¡Gracias por tu reseña!", variant: "success" });
        } catch (err) {
            toast({ title: "No pudimos guardar tu reseña", description: (err as Error).message, variant: "error" });
        }
    }

    async function handleDelete() {
        if (!ownReview) return;
        try {
            await deleteOwn(ownReview.id);
            refetch();
        } catch (err) {
            toast({ title: "No pudimos borrar tu reseña", description: (err as Error).message, variant: "error" });
        }
    }

    return (
        <div className="space-y-3">
            <div className="card flex items-center gap-4 p-4">
                <div className="text-center">
                    <p className="font-display text-3xl font-semibold tracking-[-0.03em] text-foreground">
                        {average > 0 ? average.toFixed(1) : "—"}
                    </p>
                    <RatingStars value={Math.round(average)} size={12} />
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                        {reviews.length} reseña{reviews.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <div className="h-14 w-px bg-border" />
                <div className="flex-1">
                    <RatingHistogram reviews={reviews} />
                </div>
            </div>

            {!user && (
                <div className="card flex items-center justify-between gap-3 p-4">
                    <p className="font-sans text-[13px] text-muted-foreground">
                        Iniciá sesión para dejar tu reseña.
                    </p>
                    <Button variant="primary" size="sm" onClick={() => setSignInOpen(true)}>
                        Iniciar sesión
                    </Button>
                </div>
            )}

            {user && !loading && (ownReview === undefined || editing) && (
                <ReviewForm
                    lineaNombre={lineaNombre}
                    initial={ownReview}
                    defaultDisplayName={user.email?.split("@")[0] ?? ""}
                    onSubmit={handleSubmit}
                    onCancel={editing ? () => setEditing(false) : undefined}
                />
            )}

            {user && !loading && ownReview && !editing && (
                <ReviewCard review={ownReview} isOwn onEdit={() => setEditing(true)} onDelete={handleDelete} />
            )}

            {loading ? (
                <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            ) : otherReviews.length === 0 && !ownReview ? (
                <p className="py-8 text-center font-sans text-[13px] text-muted-foreground">
                    Todavía no hay reseñas de esta línea. ¡Sé el primero!
                </p>
            ) : (
                otherReviews.map((review) => <ReviewCard key={review.id} review={review} />)
            )}

            <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
        </div>
    );
}
