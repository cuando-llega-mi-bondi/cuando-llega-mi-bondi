import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    className?: string;
}

export function Modal({ open, onClose, children, className }: ModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-5">
            <button
                type="button"
                onClick={onClose}
                className="absolute inset-0 bg-black/85 backdrop-blur-sm"
                aria-label="Cerrar modal"
            />
            <div
                className={cn(
                    "relative z-[1] w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-[0_20px_40px_rgba(0,0,0,0.4)]",
                    className,
                )}
            >
                {children}
            </div>
        </div>
    );
}
