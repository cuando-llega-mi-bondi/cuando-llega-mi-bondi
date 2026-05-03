import { useEffect, useRef } from "react";
import { IconX } from "@/components/icons/IconX";

interface ErrorBannerProps {
    message?: string;
    onClose: () => void;
}

export function ErrorBanner({ message, onClose }: ErrorBannerProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    // Cerrar con la tecla Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                className="w-full max-w-sm animate-slide-up overflow-hidden rounded-3xl bg-background shadow-2xl border border-border/20"
            >
                <div className="p-6">
                    {/* Header estilo Bondi MDP */}
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/40 bg-surface text-foreground/50">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="font-sans text-[15px] font-bold tracking-tight text-foreground">
                                Un mensaje del equipo
                            </p>
                            <p className="font-sans text-xs text-foreground/45">
                                Bondi MDP
                            </p>
                        </div>
                    </div>

                    {/* Cuerpo del Mensaje */}
                    <div className="space-y-4">
                        <p className="font-sans text-[14px] leading-relaxed text-foreground">
                            Hola gente 👋 Lamentablemente, nos bloquearon el acceso
                            a la información, por lo que por ahora no podemos obtener los datos
                            de las líneas de colectivo.
                        </p>
                        <p className="font-sans text-[14px] leading-relaxed text-foreground/60">
                            Estamos a la espera de una respuesta y ojalá lo restablezcan
                            pronto. Bondi MDP es un proyecto independiente — somos estudiantes
                            que buscamos mejorar el acceso a la información para todos los
                            marplatenses.
                        </p>
                    </div>
                </div>

                {/* Footer / Botón de Acción */}
                <div className="border-t border-border/30 bg-surface/20 px-6 py-4">
                    {/* <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-2xl border border-border/40 bg-surface px-4 py-3.5 font-sans text-sm font-semibold text-foreground/80 transition-all active:scale-[0.98] hover:bg-surface/80"
                    >
                        Entendido 🤝
                    </button> */}
                    <a className="w-full flex justify-center items-center rounded-2xl  border border-border/40 bg-surface px-4 py-3.5 font-sans text-sm font-semibold text-foreground/80 transition-all active:scale-[0.98] hover:bg-surface/80"
                        href="/acerca">Entendido 🤝</a>
                </div>
            </div>
        </div>
    );
}