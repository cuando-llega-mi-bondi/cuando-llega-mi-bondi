import { LandingSection } from "./LandingSection";

interface Sponsor {
  name: string;
  logo: string;
  href?: string;
}

const SPONSORS: Sponsor[] = [
  { name: "Nexovet", logo: "/sponsors/nexovet.png", href: "https://nexovet.aeterna.red/" },
];

function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  const logo = (
    // eslint-disable-next-line @next/next/no-img-element -- el proyecto no usa next/image (sin config de images); logo estático liviano
    <img
      src={sponsor.logo}
      alt={sponsor.name}
      loading="lazy"
      decoding="async"
      className="h-14 w-auto md:h-16"
    />
  );

  const cardClass =
    "flex items-center justify-center rounded-2xl border border-border bg-card px-10 py-6 transition-colors hover:border-[#2bb3a8]/40";

  if (!sponsor.href) {
    return <div className={cardClass}>{logo}</div>;
  }

  return (
    <a
      href={sponsor.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={sponsor.name}
      className={cardClass}
    >
      {logo}
    </a>
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
      <div className="flex flex-wrap items-center justify-center gap-6">
        {SPONSORS.map((sponsor) => (
          <SponsorCard key={sponsor.name} sponsor={sponsor} />
        ))}
      </div>
    </LandingSection>
  );
}
