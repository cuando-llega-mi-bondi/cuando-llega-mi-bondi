"use client";

import React, { useEffect } from "react";
import { useToastStore } from "./store/useToastStore";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export type ToastVariant = "default" | "success" | "error" | "warning";

export interface ToastMessage {
    id: string;
    title?: string;
    description: string;
    variant?: ToastVariant;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function useToast() {
    const { addToast, removeToast } = useToastStore();
    return { toast: addToast, removeToast };
}

const ICONS = {
    default: <Info className="w-5 h-5 text-turquesa" />,
    success: <CheckCircle className="w-5 h-5 text-success" />,
    error: <AlertCircle className="w-5 h-5 text-error" />,
    warning: <AlertTriangle className="w-5 h-5 text-amarillo" />,
};

export function Toaster() {
    const { toasts, removeToast } = useToastStore();

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 w-full max-w-md px-4 pointer-events-none pb-[env(safe-area-inset-bottom)]">
            <AnimatePresence mode="popLayout">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
                ))}
            </AnimatePresence>
        </div>
    );
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
    useEffect(() => {
        const duration = toast.duration || 4000;
        const timer = setTimeout(() => {
            onRemove();
        }, duration);
        return () => clearTimeout(timer);
    }, [toast.duration, onRemove]);

    const variant = toast.variant || "default";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className="pointer-events-auto flex items-start gap-3 p-4 card-floating rounded-[var(--radius-xl)] w-full"
            role={variant === "error" ? "alert" : "status"}
            aria-live={variant === "error" ? "assertive" : "polite"}
            aria-atomic="true"
        >
            <div className="flex-shrink-0 mt-0.5">{ICONS[variant]}</div>
            <div className="flex-1 min-w-0">
                {toast.title && <h4 className="text-[14px] font-semibold text-foreground mb-0.5">{toast.title}</h4>}
                <p className="text-[14px] leading-snug text-muted-foreground">{toast.description}</p>
            </div>
            {toast.action && (
                <button
                    onClick={() => {
                        toast.action?.onClick();
                        onRemove();
                    }}
                    className="flex-shrink-0 text-[14px] font-bold text-turquesa hover:opacity-80 active:scale-95 transition-all px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                    {toast.action.label}
                </button>
            )}
            <button
                onClick={onRemove}
                className="flex-shrink-0 p-1 -mr-1 -mt-1 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Cerrar notificación"
            >
                <X className="w-[18px] h-[18px]" />
            </button>
        </motion.div>
    );
}
