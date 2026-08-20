import { IconStar } from "@shared/icons/IconStar";
import { cn } from "@shared/utils";

interface RatingStarsProps {
    value: number;
    onChange?: (value: number) => void;
    size?: number;
}

export function RatingStars({ value, onChange, size = 20 }: RatingStarsProps) {
    const interactive = Boolean(onChange);

    return (
        <div className="flex items-center gap-0.5" role={interactive ? "radiogroup" : undefined} aria-label="Calificación">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={!interactive}
                    onClick={() => onChange?.(star)}
                    aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
                    aria-pressed={interactive ? star <= value : undefined}
                    className={cn(
                        "text-primary transition-transform",
                        interactive && "cursor-pointer hover:scale-110 active:scale-95",
                        !interactive && "cursor-default",
                    )}
                >
                    <IconStar
                        filled={star <= value}
                        width={size}
                        height={size}
                        className={star <= value ? "text-primary" : "text-muted-foreground/40"}
                    />
                </button>
            ))}
        </div>
    );
}
