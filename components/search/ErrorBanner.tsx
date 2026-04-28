import { IconX } from "@/components/icons/IconX";

interface ErrorBannerProps {
    message: string;
    onClose: () => void;
}

export function ErrorBanner({ message, onClose }: ErrorBannerProps) {
    if (!message) return null;

    return (
        <div className="flex animate-slide-up items-start gap-3 rounded-[10px] border border-danger/35 bg-danger/10 px-4 py-3.5">
            <span className="mt-0.5 shrink-0 text-danger">
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                </svg>
            </span>
            <div className="flex-1">
                <div className="mb-1 font-display text-[13px] font-bold text-danger">
                    El servidor no responde
                </div>
                <div className="font-mono text-xs leading-relaxed text-danger/90">
                    {message}
                </div>
            </div>
            <button
                type="button"
                onClick={onClose}
                className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center bg-transparent p-0 text-danger/70 transition-colors hover:text-danger"
                aria-label="Cerrar error"
            >
                <IconX />
            </button>
        </div>
    );
}
