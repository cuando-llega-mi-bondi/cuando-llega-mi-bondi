"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ServiceDownModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ServiceDownModal({ isOpen, onClose }: ServiceDownModalProps) {
    const [mounted, setMounted] = useState(false);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        closeButtonRef.current?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key !== "Tab" || !dialogRef.current) return;

            const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
                'button, [href], [tabindex]:not([tabindex="-1"])'
            );
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
                e.preventDefault();
                (e.shiftKey ? last : first).focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            aria-hidden="true"
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="service-down-title"
                aria-describedby="service-down-description"
                className="w-full max-w-sm animate-slide-up overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            >
                <div className="p-6">
                    {/* Header centered for mobile */}
                    <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row sm:text-left text-center">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border/40 bg-muted">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-muted-foreground"
                                aria-hidden="true"
                            >
                                <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                            </svg>
                        </div>
                        <div className="text-center sm:text-left">
                            <p
                                id="service-down-title"
                                className="font-sans text-sm font-semibold tracking-tight text-foreground"
                            >
                                Un mensaje del equipo
                            </p>
                            <p className="font-sans text-xs text-muted-foreground">
                                Bondi MDP
                            </p>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="space-y-4">
                        <p
                            id="service-down-description"
                            className="font-sans text-sm leading-relaxed text-foreground/90 text-center sm:text-left"
                        >
                            ¡Hola gente! Estamos teniendo inconvenientes para acceder a la
                            información de las líneas de colectivo, por lo que el servicio no
                            está disponible por el momento. Lamentamos las molestias.
                        </p>
                        <p className="font-sans text-[13px] leading-relaxed text-muted-foreground text-center sm:text-left">
                            Estamos trabajando para resolverlo y buscando establecer una
                            comunicación oficial con la Municipalidad. Somos estudiantes,
                            independientes y sin afiliación a ninguna entidad.
                        </p>
                        <p className="text-[11px] font-medium text-muted-foreground opacity-80 text-center sm:text-left">
                            Hecha con ❤️ por marplatenses para marplatenses
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-border/30 bg-muted/30 px-6 py-4">
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-xl border border-border/40 bg-card px-4 py-3 font-sans text-sm font-semibold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
                    >
                        Entendido 🤝
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}