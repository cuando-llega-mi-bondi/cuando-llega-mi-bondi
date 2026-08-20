import { ratingDistribution } from "../reviewStats";
import type { LineaReview } from "../types";

interface RatingHistogramProps {
    reviews: LineaReview[];
}

export function RatingHistogram({ reviews }: RatingHistogramProps) {
    const distribution = ratingDistribution(reviews);
    const max = Math.max(1, ...distribution);

    return (
        <div className="flex flex-col gap-1.5">
            {distribution.map((count, i) => {
                const stars = i + 1;
                return (
                    <div key={stars} className="flex items-center gap-2">
                        <span className="w-3 shrink-0 font-mono text-[10px] text-muted-foreground">
                            {stars}
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${(count / max) * 100}%` }}
                            />
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
