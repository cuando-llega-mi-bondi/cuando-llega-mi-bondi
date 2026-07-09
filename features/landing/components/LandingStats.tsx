import Link from "next/link";
import { ArrowRight, Users, Eye, Activity, Repeat } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LandingSection } from "./LandingSection";
import { CountUp } from "./CountUp";

interface Stat {
  count?: { to: number; sep?: boolean; prefix?: string; suffix?: string };
  value?: string;
  label: string;
  /** Línea de contexto que traduce la métrica a algo que le hable al usuario. */
  detail: string;
  icon: LucideIcon;
}

const STATS: Stat[] = [
  {
    count: { to: 19267, sep: true },
    label: "marplatenses la usan",
    detail: "sin una sola campaña de publicidad",
    icon: Users,
  },
  {
    count: { to: 300, prefix: "+", suffix: " mil" },
    label: "consultas de arribos",
    detail: "unas 10.000 por día",
    icon: Eye,
  },
  {
    count: { to: 87784, sep: true },
    label: "visitas en 30 días",
    detail: "cada persona volvió 4,5 veces",
    icon: Activity,
  },
  {
    value: "2 de 3",
    label: "usuarios vuelven",
    detail: "la mayoría ya la usa de rutina",
    icon: Repeat,
  },
];

export function LandingStats() {
  return (
    <LandingSection
      eyebrow="En números"
      title="El primer mes"
      highlight="en la calle"
    >
      {/* Texto previo — le da contexto y narrativa a los números */}
      <p className="mx-auto mb-12 max-w-2xl text-center text-[17px] leading-relaxed text-muted-foreground">
        Lanzamos Bondi MDP{" "}
        <span className="font-semibold text-foreground">
          sin un peso en publicidad
        </span>
        : creció de boca en boca, de parada en parada. Esto pasó en los primeros
        30 días.
      </p>

      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map(({ count, value, label, detail, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-card p-6 text-center transition-colors hover:border-[#2bb3a8]/40"
          >
            <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-[#2bb3a8]/30 bg-[#2bb3a8]/10">
              <Icon className="h-4 w-4 text-[#2bb3a8]" />
            </span>
            <div className="mt-4 whitespace-nowrap text-3xl font-black tracking-tight text-amarillo lg:text-4xl">
              {count ? <CountUp {...count} /> : value}
            </div>
            <div className="mt-1.5 text-[14px] font-bold text-foreground">
              {label}
            </div>
            <div className="mt-1 text-[12px] leading-snug text-muted-foreground">
              {detail}
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
