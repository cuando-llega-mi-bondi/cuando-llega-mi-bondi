import { IconEdit } from "@shared/icons/IconEdit";
import { IconTrash } from "@shared/icons/IconTrash";
import { RatingStars } from "./RatingStars";
import type { LineaReview } from "../types";

function formatFecha(iso: string): string {
    return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

interface ReviewCardProps {
    review: LineaReview;
    isOwn?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
}

export function ReviewCard({ review, isOwn, onEdit, onDelete }: ReviewCardProps) {
    return (
        <div className="card p-3.5">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="truncate font-sans text-[13px] font-semibold tracking-[-0.01em] text-foreground">
                        {review.displayName}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                        <RatingStars value={review.rating} size={14} />
                        <span className="font-mono text-[11px] text-muted-foreground">
                            {formatFecha(review.createdAt)}
                        </span>
                    </div>
                </div>
                {isOwn && (
                    <div className="flex shrink-0 items-center gap-1.5">
                        <button
                            type="button"
                            onClick={onEdit}
                            aria-label="Editar reseña"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                            <IconEdit size={15} />
                        </button>
                        <button
                            type="button"
                            onClick={onDelete}
                            aria-label="Borrar reseña"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        >
                            <IconTrash size={15} />
                        </button>
                    </div>
                )}
            </div>
            {review.comment && (
                <p className="mt-2.5 whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-foreground/85">
                    {review.comment}
                </p>
            )}
        </div>
    );
}
