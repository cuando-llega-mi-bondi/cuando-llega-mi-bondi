"use client";

import Link from "next/link";
import { Megaphone } from "lucide-react";
import { motion } from "motion/react";
import { SPONSORS, type Sponsor } from "@features/sponsors/data/sponsors";
import { LandingSection } from "./LandingSection";
import { SpotlightCard } from "./SpotlightCard";

function SponsorCard({ sponsor, index }: { sponsor: Sponsor; index: number }) {
  return (
    <SpotlightCard index={index} tint="rgba(249,205,74,0.14)" className="px-10 py-6">
      <a
        href={sponsor.href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        aria-label={sponsor.name}
        className="relative flex items-center justify-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- el proyecto no usa next/image (sin config de images); logo estático liviano */}
        <img
          src={sponsor.logo}
          alt={sponsor.name}
          loading="lazy"
          decoding="async"
          className="h-14 w-auto md:h-16"
        />
      </a>
    </SpotlightCard>
  );
}

/**
 * Con pocos sponsors, la sección de "empresas que nos apoyan" se ve vacía —
 * este slot invita a sumarse en vez de dejar el espacio muerto. Mismo
 * lenguaje de "casillero libre con borde punteado" que ya usa SponsorSlot en
 * /consultar, no la tarjeta sólida de SpotlightCard (acá señala "vacío,
 * disponible", no contenido real).
 */
function BecomeSponsorCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.55, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] },
      }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
    >
      <Link
        href="/anunciate"
        className="flex min-w-[220px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-secondary/40 bg-card/60 px-10 py-6 text-center transition-colors hover:border-secondary"
      >
        <Megaphone className="h-6 w-6 text-secondary" strokeWidth={2} />
        <span className="text-[14px] font-bold text-foreground">¿Tu marca acá?</span>
        <span className="text-[12px] font-medium text-secondary">Anunciate →</span>
      </Link>
    </motion.div>
  );
}

export function LandingSponsors() {
  return (
    <LandingSection
      eyebrow="Sponsors"
      title="Nos"
      highlight="acompañan"
      description="Empresas que apoyan el proyecto y ayudan a que siga siendo gratuito y de código abierto."
    >
      <div className="flex flex-wrap items-stretch justify-center gap-6">
        {SPONSORS.map((sponsor, i) => (
          <SponsorCard key={sponsor.name} sponsor={sponsor} index={i} />
        ))}
        <BecomeSponsorCard index={SPONSORS.length} />
      </div>
    </LandingSection>
  );
}
