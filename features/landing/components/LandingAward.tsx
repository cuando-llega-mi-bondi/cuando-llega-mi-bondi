import { ArrowUpRight } from "lucide-react";

import { AwardTrophy } from "./AwardTrophy";
import { ScrollRevealText } from "./ScrollRevealText";

const NOTA =
  "https://www.aticma.org.ar/novedades/aticma-awards-2026-ganadores/";

/**
 * Reconocimiento: el premio que ganó Bondi MDP en los ATICMA Awards 2026.
 * Va justo después del hero porque es la primera prueba de que el proyecto es real.
 */
export function LandingAward() {
  return (
    <section aria-labelledby="premio-titulo" className="py-20 xl:py-24">
      <div className="grid items-center gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,360px)] xl:gap-12">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-secondary dark:text-amarillo">
            Premio · ATICMA Awards 2026
          </p>

          <h2
            id="premio-titulo"
            aria-label="Proyecto Destacado Mar del Dev."
            className="mt-4 text-balance font-display text-3xl font-black leading-[1.05] tracking-tight text-foreground sm:text-4xl lg:text-[42px] xl:text-[46px]"
          >
            <ScrollRevealText
              text="Proyecto Destacado"
              highlight="Mar del Dev."
              highlightClassName="text-secondary dark:text-amarillo"
            />
          </h2>

          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            La app Bondi MDP ganó el premio a Proyecto Destacado Mar del Dev, la
            categoría que distingue al mejor proyecto surgido de las hackatones
            de la comunidad Mar del Plata Dev.
          </p>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Fue en la tercera edición, el viernes 13 de noviembre en Bendu: 32
            finalistas en siete categorías, más de 500 personas y el cierre de la
            Mar del Plata Tech Week, en el año en que ATICMA cumplió 20.
          </p>

          <p className="mt-6 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            13 · 11 · 2026 — Bendu, Mar del Plata
          </p>

          <a
            href={NOTA}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-foreground transition-colors duration-150 hover:text-secondary dark:hover:text-amarillo"
          >
            Cómo fue la noche
            <ArrowUpRight aria-hidden className="h-4 w-4" />
          </a>
        </div>

        <AwardTrophy />
      </div>
    </section>
  );
}
