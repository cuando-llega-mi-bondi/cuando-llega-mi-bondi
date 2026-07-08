import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingSection } from "./LandingSection";
import { CountUp } from "./CountUp";

interface Stat {
  count?: { to: number; sep?: boolean; prefix?: string; suffix?: string };
  value?: string;
  label: string;
}

const STATS: Stat[] = [
  { count: { to: 19267, sep: true }, label: "usuarios activos" },
  { count: { to: 300, prefix: "+", suffix: " mil" }, label: "vistas de página" },
  { count: { to: 87784, sep: true }, label: "sesiones" },
  { value: "2:1", label: "ratio de fidelidad" },
];

export function LandingStats() {
  return (
    <LandingSection
      eyebrow="En números"
      title="El primer mes"
      highlight="en números"
    >
      {/* Texto previo — le da contexto y narrativa a los números */}
      <p className="mx-auto mb-12 max-w-2xl text-center text-[17px] leading-relaxed text-muted-foreground">
        Lanzamos Bondi MDP{" "}
        <span className="font-semibold text-foreground">
          sin un peso en publicidad
        </span>
        . En apenas 30 días, miles de marplatenses la sumaron a su viaje diario —
        y los números lo dicen todo.
      </p>

      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-card p-6 text-center transition-colors hover:border-[#2bb3a8]/40"
          >
            <div className="whitespace-nowrap text-3xl font-black text-amarillo lg:text-4xl">
              {stat.count ? <CountUp {...stat.count} /> : stat.value}
            </div>
            <div className="mt-1 text-[13px] text-muted-foreground">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          href="/un-mes-en-numeros"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-[14px] font-bold text-foreground transition-colors hover:border-[#2bb3a8]/50"
        >
          Ver el informe completo
          <ArrowRight className="h-4 w-4 text-amarillo" />
        </Link>
      </div>
    </LandingSection>
  );
}
