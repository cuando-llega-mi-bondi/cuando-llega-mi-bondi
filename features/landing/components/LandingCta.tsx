"use client";

import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { motion } from "motion/react";

export function LandingCta() {
  return (
    <section className="relative py-24">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amarillo/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-3xl px-8 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -80px 0px" }}
          transition={{ duration: 0.5 }}
          className="text-balance text-4xl font-black uppercase tracking-tighter lg:text-6xl"
        >
          Dejá de esperar
          <span className="block text-amarillo">el bondi.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -80px 0px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground"
        >
          Consultá en tiempo real cuándo llega tu colectivo en Mar del Plata.
          Gratis, sin registro y en dos toques.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -80px 0px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-9 flex flex-col items-center justify-center gap-5 sm:flex-row"
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/consultar"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-amarillo px-8 py-4 text-[15px] font-bold text-primary-foreground shadow-[0_0_32px_rgba(249,205,74,0.35)] transition hover:opacity-90"
            >
              Consultá gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/consultar?tab=favoritos"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-8 py-4 text-[15px] font-bold text-foreground transition-colors hover:border-secondary/50"
            >
              <Star className="h-4 w-4 text-amarillo" />
              Ver favoritos
            </Link>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "0px 0px -80px 0px" }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 text-[14px] font-medium text-muted-foreground"
        >
          Nos vemos en la parada.
        </motion.p>
      </div>
    </section>
  );
}
