"use client";

import { useState } from "react";
import { Button } from "@shared/ui/Button";
import { RatingStars } from "./RatingStars";
import type { LineaReview } from "../types";
import {
    COMMENT_MAX_LENGTH,
    DISPLAY_NAME_MAX_LENGTH,
    validateComment,
    validateDisplayName,
} from "../validation";

interface ReviewFormProps {
    lineaNombre: string;
    initial?: LineaReview;
    defaultDisplayName: string;
    onSubmit: (input: { rating: number; comment: string; displayName: string }) => Promise<void>;
    onCancel?: () => void;
}

export function ReviewForm({ lineaNombre, initial, defaultDisplayName, onSubmit, onCancel }: ReviewFormProps) {
    const [rating, setRating] = useState(initial?.rating ?? 0);
    const [comment, setComment] = useState(initial?.comment ?? "");
    const [displayName, setDisplayName] = useState(initial?.displayName ?? defaultDisplayName);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canSubmit = rating > 0 && displayName.trim().length > 0 && !submitting;

    async function handleSubmit() {
        if (!canSubmit) return;

        const trimmedComment = comment.trim();
        const trimmedName = displayName.trim();
        const validationError = validateDisplayName(trimmedName) || validateComment(trimmedComment);
        if (validationError) {
            setError(validationError);
            return;
        }
        setError(null);

        setSubmitting(true);
        try {
            await onSubmit({ rating, comment: trimmedComment, displayName: trimmedName });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="card space-y-3 p-4">
            <p className="font-sans text-[13px] font-medium text-muted-foreground">
                {initial ? `Tu reseña de la línea ${lineaNombre}` : `¿Qué te pareció la línea ${lineaNombre}?`}
            </p>
            <RatingStars value={rating} onChange={setRating} size={26} />
            <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu nombre"
                maxLength={DISPLAY_NAME_MAX_LENGTH}
                className="input w-full"
            />
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Contá tu experiencia (opcional)"
                maxLength={COMMENT_MAX_LENGTH}
                rows={3}
                className="input w-full resize-none"
            />
            {error && <p className="font-sans text-[12px] text-destructive">{error}</p>}
            <div className="flex items-center justify-end gap-2">
                {onCancel && (
                    <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
                        Cancelar
                    </Button>
                )}
                <Button type="button" variant="primary" size="sm" onClick={handleSubmit} disabled={!canSubmit}>
                    {submitting ? "Guardando…" : "Publicar reseña"}
                </Button>
            </div>
        </div>
    );
}
