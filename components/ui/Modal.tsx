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
                className="absolute inset-0 bg-black/85"
                aria-label="Cerrar modal"
            />
            <div
                className={cn(
                    "relative z-[1] w-full max-w-md rounded-2xl bg-surface p-6 shadow-[rgba(0,153,255,0.15)_0px_0px_0px_1px,0_24px_44px_rgba(0,0,0,0.72)]",
                    className,
                )}
            >
                {children}
            </div>
        </div>
    );
}
