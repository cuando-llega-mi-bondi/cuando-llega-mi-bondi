import { cn } from "@/lib/utils";

interface SpinnerProps {
    className?: string;
}

export function Spinner({ className }: SpinnerProps) {
    return (
        <span
            className={cn(
                "inline-flex h-5 w-5 animate-spin-slow rounded-full border-2 border-border border-t-primary",
                className,
            )}
            aria-hidden
        />
    );
}
