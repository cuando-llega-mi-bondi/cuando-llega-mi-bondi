// ServiceDownModal.tsx
import Link from "next/dist/client/link";
import { useEffect, useRef } from "react";

interface ServiceDownModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ServiceDownModal({ isOpen, onClose }: ServiceDownModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-down-title"
        aria-describedby="service-down-description"
        className="w-full max-w-sm animate-slide-up overflow-hidden rounded-2xl bg-background"
      >
        <div className="p-6">
          {/* Header */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/40 bg-surface">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-foreground/50"
                aria-hidden="true"
              >
                <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div>
              <p
                id="service-down-title"
                className="font-sans text-sm font-semibold tracking-tight text-foreground"
              >
                Un mensaje del equipo
              </p>
              <p className="font-sans text-xs text-foreground/45">Bondi MDP</p>
            </div>
          </div>

          {/* Body */}
          <p
            id="service-down-description"
            className="font-sans text-sm leading-relaxed text-foreground"
          >
            Hola gente 👋 Por el momento no estamos pudiendo acceder a la
            información necesaria para mostrar los datos de las líneas de
            colectivo.
          </p>
          <p className="mt-3 font-sans text-sm leading-relaxed text-foreground/60">
            Estamos trabajando para resolverlo y esperamos poder restablecer el
            servicio lo antes posible. Bondi MDP es un proyecto independiente —
            somos estudiantes que buscamos mejorar el acceso a la información
            para todos los marplatenses.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-border/30  px-6 flex py-4">
          <Link
            href="/acerca"
            className="block w-full rounded-xl border border-border/40 bg-amarillo px-4 py-3 text-center font-sans text-sm font-medium text-black transition-colors hover:bg-amarillo/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amarillo"
          >
            Entendido <span aria-hidden="true">🤝</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
