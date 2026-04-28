import { Button } from "@/components/ui";

interface MapErrorOverlayProps {
    message: string;
    onRetry: () => void;
}

export function MapErrorOverlay({ message, onRetry }: MapErrorOverlayProps) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg px-6">
            <div className="text-text-dim">
                <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                </svg>
            </div>
            <div className="max-w-[280px] text-center font-sans text-sm leading-relaxed text-text-dim">
                {message}
            </div>
            <Button
                onClick={onRetry}
                variant="primary"
                size="md"
                className="px-6"
            >
                Reintentar
            </Button>
        </div>
    );
}
