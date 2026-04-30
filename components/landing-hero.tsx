"use client";

import Link from "next/link";
import { ArrowRight, Bus, Clock, Star } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-b from-amarillo/5 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-full mb-6">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-[13px] font-medium tracking-normal text-foreground">
                Mar del Plata
              </span>
            </div>

            <h1 className="mb-6">
              <BrandLogo className="text-5xl lg:text-7xl" />
            </h1>

            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0">
              Consultá cuándo llega tu colectivo en tiempo real.<br />Rápido, claro y sin vueltas.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/consultar"
                className="inline-flex items-center justify-center gap-2 btn-mdp-turquesa btn-pill px-8 py-4 text-lg font-bold"
              >
                Consultar colectivo
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/consultar?tab=favoritos"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-lg font-bold bg-muted hover:bg-muted/80 text-foreground transition-colors"
              >
                <Star className="w-5 h-5" />
                Ver favoritos
              </Link>
            </div>

            <div className="mt-12 flex flex-row items-center justify-center lg:justify-start gap-8 text-[14px] text-muted-foreground font-medium">
              <div className="flex items-center gap-2">
                <Bus className="w-5 h-5 text-amarillo" />
                <span>Todas las líneas</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amarillo" />
                <span>Tiempo real</span>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative w-full max-w-[400px] mx-auto">
              <div className="absolute -inset-4 bg-gradient-to-r from-turquesa/20 to-amarillo/20 rounded-[3rem] blur-3xl" />
              <div className="relative bg-background border border-border rounded-[2.5rem] p-4 shadow-2xl">
                <div className="bg-background rounded-[2rem] overflow-hidden">
                  <div className="bg-background border-b border-border p-4 text-center">
                    <BrandLogo size="md" />
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="bg-muted/50 rounded-xl p-4">
                      <div className="text-xs font-bold uppercase text-muted-foreground mb-2">
                        Línea
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        111
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4">
                      <div className="text-xs font-bold uppercase text-muted-foreground mb-2">
                        Parada
                      </div>
                      <div className="text-lg font-bold text-foreground truncate">
                        Güemes y Mitre
                      </div>
                    </div>
                    <div className="bg-amarillo/20 rounded-xl p-4 border border-amarillo/30">
                      <div className="text-xs font-bold uppercase text-muted-foreground mb-1">
                        Próximo arribo
                      </div>
                      <div className="flex items-end gap-2">
                        <span className="text-5xl font-bold tracking-tight text-turquesa">
                          3
                        </span>
                        <span className="text-lg font-bold text-muted-foreground mb-1">
                          min
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
