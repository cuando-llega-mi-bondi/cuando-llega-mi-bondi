// ServiceDownModal.tsx
import { useEffect, useRef } from "react";

interface ServiceDownModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ServiceDownModal({ isOpen, onClose }: ServiceDownModalProps) {
  const closeButtonRef = useRef<HTMLAnchorElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        e.shiftKey
          ? document.activeElement === first
          : document.activeElement === last
      ) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-down-title"
        aria-describedby="service-down-description"
        className="w-full max-w-sm animate-slide-up overflow-hidden rounded-3xl bg-background shadow-2xl"
      >
        <div className="p-6">
          {/* Header */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amarillo/10">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amarillo"
                aria-hidden="true"
              >
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="m12.8 2.8 8.1 12.6c.7 1.1.1 2.6-1.2 2.6H4.3c-1.3 0-1.9-1.5-1.2-2.6l8.1-12.6c.3-.5 1-.5 1.3 0Z" />
              </svg>
            </div>
            <div>
              <p
                id="service-down-title"
                className="font-sans text-base font-bold tracking-tight text-foreground"
              >
                Actualización necesaria
              </p>
              <p className="font-sans text-xs font-medium text-foreground/50">Aviso para usuarios de iPhone</p>
            </div>
          </div>

          {/* Body */}
          <div id="service-down-description" className="space-y-4">
            <p className="font-sans text-sm leading-relaxed text-foreground">
              Para que los datos de los colectivos vuelvan a cargar correctamente en tu iPhone, <strong>es necesario actualizar la App.</strong>
            </p>

            <div className="rounded-2xl bg-surface p-4 border border-border/50">
              <p className="font-sans text-xs font-semibold uppercase tracking-wider text-foreground/40 mb-3">
                ¿Cómo lo soluciono?
              </p>
              <ol className="space-y-3 font-sans text-sm text-foreground/80">
                <li className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amarillo text-[10px] font-bold text-black">1</span>
                  <span>Eliminá la App de <strong>Bondi MDP</strong> de tu pantalla de inicio.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amarillo text-[10px] font-bold text-black">2</span>
                  <span>Abrí <strong>bondimdp.com.ar</strong> en Safari.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amarillo text-[10px] font-bold text-black">3</span>
                  <span>Tocá <span className="inline-block px-1 bg-foreground/5 rounded border border-border">Compartir</span> y luego <span className="font-medium text-foreground italic">"Agregar a inicio"</span>.</span>
                </li>
              </ol>
            </div>

            <p className="font-sans text-[13px] leading-relaxed text-foreground/50 italic text-center">
              Perdonen las molestias, estamos trabajando para que esto no vuelva a ocurrir. 🤝
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/30 bg-surface/30 px-6 py-4">
          <button
            ref={closeButtonRef as any}
            onClick={onClose}
            className="block w-full rounded-xl bg-amarillo px-4 py-3 text-center font-sans text-sm font-bold text-black transition-transform active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-amarillo"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}