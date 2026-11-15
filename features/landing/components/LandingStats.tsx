import Link from "next/link";
import type { ReactNode } from "react";
import { LandingSection } from "./LandingSection";

interface Highlight {
  tag: string;
  value: ReactNode;
  caption: string;
}

// Los tres datos del informe /primer-trimestre-en-numeros (26 may – 23 ago 2026).
// Actualizar ahí primero y traer los mismos números acá cuando cierre otro trimestre.
const LEAD: Highlight = {
  tag: "Usuarios activos · 90 días",
  value: "22.893",
  caption: "personas, sin un peso invertido en publicidad",
};

const SUPPORTING: readonly Highlight[] = [
  {
    tag: "Consultas de arribos",
    value: (
      <>
        +763<span className="text-[0.5em] tracking-[-0.02em]"> mil</span>
      </>
    ),
    caption: "unas 8.500 por día",
  },
  {
    tag: "Retención de uso",
    value: "85%",
    caption: "de los usuarios vuelve: ya es parte de su rutina",
  },
];

function Tag({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
      {children}
    </p>
  );
}

export function LandingStats() {
  return (
    <LandingSection
      eyebrow="Informe público · 26 may – 23 ago 2026"
      title="El primer trimestre"
      highlight="en la calle."
    >
      {/* Sin paneles: la cifra principal manda por tamaño y las otras dos la siguen */}
      <div className="@container">
        <Tag>{LEAD.tag}</Tag>
        <p className="mt-4 font-mono text-[clamp(4rem,19cqi,10.5rem)] font-black leading-[0.85] tracking-[-0.05em] text-foreground">
          {LEAD.value}
        </p>
        <p className="mt-5 max-w-[26ch] text-balance text-lg leading-snug text-muted-foreground xl:text-xl">
          {LEAD.caption}
        </p>

        <ul role="list" className="mt-16 grid gap-12 @2xl:grid-cols-2 @2xl:gap-10">
          {SUPPORTING.map(({ tag, value, caption }) => (
            <li key={tag} className="border-t border-border pt-6">
              <Tag>{tag}</Tag>
              <p className="mt-4 font-mono text-[clamp(3rem,10cqi,5.5rem)] font-black leading-[0.9] tracking-[-0.045em] text-foreground">
                {value}
              </p>
              <p className="mt-4 max-w-[26ch] text-balance text-base leading-snug text-muted-foreground xl:text-lg">
                {caption}
              </p>
            </li>
          ))}
        </ul>

        <Link
          href="/primer-trimestre-en-numeros"
          className="mt-12 inline-flex min-h-11 items-center gap-2 text-base font-bold text-foreground underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-current"
        >
          Leer el informe completo del trimestre
          <span aria-hidden>→</span>
        </Link>
      </div>
    </LandingSection>
  );
}
