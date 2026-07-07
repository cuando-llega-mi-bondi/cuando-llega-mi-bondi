"use client";

import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

export function LandingCta() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amarillo/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-3xl px-8 text-center">
        <h2 className="text-balance text-4xl font-black uppercase tracking-tighter lg:text-6xl">
          Dejá de esperar
          <span className="block text-amarillo">el bondi.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Consultá en tiempo real cuándo llega tu colectivo en Mar del Plata.
          Gratis, sin registro y en dos toques.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-5 sm:flex-row">
          <Link
            href="/consultar"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-amarillo px-8 py-4 text-[15px] font-bold text-[#0c243c] transition hover:opacity-90 active:scale-[0.98]"
          >
            Consultá gratis
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/consultar?tab=favoritos"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-8 py-4 text-[15px] font-bold text-foreground transition-colors hover:border-[#2bb3a8]/50"
          >
            <Star className="h-4 w-4 text-amarillo" />
            Ver favoritos
          </Link>
        </div>

        <p className="mt-6 text-[14px] font-medium text-muted-foreground">
          bondimdp.com.ar
        </p>
      </div>
    </section>
  );
}
