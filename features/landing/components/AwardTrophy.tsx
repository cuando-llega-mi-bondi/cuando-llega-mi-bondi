"use client";

import { Rotate3D } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@shared/utils";

const CATEGORIA = "Proyecto Destacado Mar del Dev";

/**
 * Estatuilla de los ATICMA Awards 2026 en 3D.
 *
 * El modelo se arma en vivo con three.js (ver `award/estatuilla.ts`), igual que en
 * el sitio oficial de los premios. El módulo se importa recién cuando la figura
 * entra en el viewport para no cargar WebGL en quien nunca llega a esta sección.
 */
export function AwardTrophy() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [estado, setEstado] = useState<"cargando" | "lista" | "sin-3d">(
    "cargando",
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelado = false;
    let destruir: (() => void) | undefined;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada?.isIntersecting) return;
        observador.disconnect();

        void (async () => {
          try {
            const { crearEstatuilla } = await import("./award/estatuilla");
            if (cancelado) return;
            const pieza = await crearEstatuilla(host, {
              categoria: CATEGORIA,
              quieto: window.matchMedia("(prefers-reduced-motion: reduce)")
                .matches,
            });
            // El efecto se limpió mientras cargaba el módulo: liberar igual.
            if (cancelado) {
              pieza.destroy();
              return;
            }
            destruir = pieza.destroy;
            setEstado("lista");
          } catch (error) {
            console.warn(
              "La estatuilla 3D no se pudo cargar; la sección queda sin el modelo.",
              error,
            );
            if (!cancelado) setEstado("sin-3d");
          }
        })();
      },
      { rootMargin: "600px 0px" },
    );
    observador.observe(host);

    return () => {
      cancelado = true;
      observador.disconnect();
      destruir?.();
    };
  }, []);

  return (
    <figure className="m-0">
      <div className="relative mx-auto aspect-[5/6.3] w-full max-w-[340px] xl:max-w-[360px]">
        {/* En claro la pieza se apoya con una sombra suave; en oscuro, una luz tenue
            detrás hace de escenario para el acrílico. */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute bottom-[7%] left-1/2 h-6 w-[58%] -translate-x-1/2 rounded-[50%] bg-[#0f2d4a]/30 blur-xl dark:hidden",
            estado === "sin-3d" && "hidden",
          )}
        />
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-[8%_-4%_12%] hidden rounded-full blur-[18px]",
            estado !== "sin-3d" && "dark:block",
          )}
          style={{
            background:
              "radial-gradient(closest-side, rgba(40,155,149,0.34), rgba(249,205,74,0.12) 55%, transparent 72%)",
          }}
        />

        <div
          ref={hostRef}
          role="img"
          tabIndex={0}
          aria-label="Estatuilla de los ATICMA Awards 2026 en 3D. Arrastrala o usá las flechas del teclado para girarla."
          className="absolute inset-0 cursor-grab touch-pan-y select-none rounded-xl outline-offset-4 active:cursor-grabbing"
        />
      </div>

      <figcaption className="mt-1 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Rotate3D aria-hidden className="h-4 w-4 shrink-0" />
        {estado === "sin-3d"
          ? "Estatuilla de los ATICMA Awards 2026"
          : "Arrastrala o usá ← → para girarla"}
      </figcaption>
    </figure>
  );
}
