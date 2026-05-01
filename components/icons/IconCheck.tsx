import { cn } from "@/lib/utils";

export function IconCheck({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("lucide lucide-check", className)}
        >
            <path d="M20 6L9 17l-5-5" />
        </svg>
    );
}
