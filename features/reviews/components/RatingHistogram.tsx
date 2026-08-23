import { ratingDistribution } from "../reviewStats";
import type { LineaReview } from "../types";

interface RatingHistogramProps {
    reviews: LineaReview[];
}

/** Sin reseñas no hay nada que distribuir — el "0 reseñas" de al lado ya lo dice. */
export function RatingHistogram({ reviews }: RatingHistogramProps) {
    const distribution = ratingDistribution(reviews);
    const total = reviews.length;

    if (total === 0) {
        return (
            <p className="font-sans text-[12px] text-muted-foreground">
                Todavía nadie calificó esta línea.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-1.5">
            {/* 5 estrellas primero: es como la gente espera leer un desglose de calificaciones */}
            {[4, 3, 2, 1, 0].map((i) => {
                const stars = i + 1;
                const count = distribution[i];
                const pct = (count / total) * 100;
                return (
                    <div key={stars} className="flex items-center gap-2">
                        <span className="w-3 shrink-0 font-mono text-[10px] text-muted-foreground">
                            {stars}
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-4 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                            {count}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
