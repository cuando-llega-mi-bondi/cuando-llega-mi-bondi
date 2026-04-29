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
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-5">
            <button
                type="button"
                onClick={onClose}
                className="absolute inset-0 bg-background/85 backdrop-blur-sm"
                aria-label="Cerrar modal"
            />
            <div
                className={cn(
                    "relative z-[1] w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-lg",
                    className,
                )}
            >
                {children}
            </div>
        </div>
    );
}
