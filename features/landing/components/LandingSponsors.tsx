"use client";

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
      </div>
    </LandingSection>
  );
}
