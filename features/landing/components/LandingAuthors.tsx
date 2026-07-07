import type { SVGProps } from "react";
import { LandingSection } from "./LandingSection";
import { IconGithub } from "@shared/icons/IconGithub";
import { IconLinkedin } from "@shared/icons/IconLinkedin";
import { IconExternalLink } from "@shared/icons/IconExternalLink";
import { IconXBrand } from "@shared/icons/IconXBrand";
import { IconIg } from "@shared/icons/IconIg";

type Platform = "github" | "linkedin" | "portfolio" | "x" | "instagram";

const ICONS: Record<Platform, (props: SVGProps<SVGSVGElement>) => React.ReactNode> = {
  github: IconGithub,
  linkedin: IconLinkedin,
  portfolio: IconExternalLink,
  x: IconXBrand,
  instagram: IconIg,
};

interface Author {
  name: string;
  initials: string;
  role: string;
  education: { label: string; href: string };
  institution: { label: string; href: string };
  links: { platform: Platform; label: string; href: string }[];
}

const AUTHORS: Author[] = [
  {
    name: "Nicolás Jiménez",
    initials: "NJ",
    role: "Frontend Developer · Multimedia Designer",
    education: {
      label: "TUP",
      href: "https://mdp.utn.edu.ar/tecnicatura/tecnico_universitario_en_programacion/",
    },
    institution: { label: "UTN FRMDP", href: "https://mdp.utn.edu.ar/" },
    links: [
      { platform: "github", label: "GitHub", href: "https://github.com/dotfn" },
      { platform: "linkedin", label: "LinkedIn", href: "https://linkedin.com/in/dotfn" },
      { platform: "portfolio", label: "Portfolio", href: "https://dotfn.dev" },
      { platform: "x", label: "X", href: "https://twitter.com/dotfn_" },
      { platform: "instagram", label: "Instagram", href: "https://instagram.com/dotfndev" },
    ],
  },
  {
    name: "Matias Celiz Ramos",
    initials: "MC",
    role: "Técnico en Informática",
    education: {
      label: "Tec. en Ciencia de Datos",
      href: "https://exactas.mdp.edu.ar/estudiantes/tecnicatura-universitaria-en-ciencia-de-datos/",
    },
    institution: { label: "UNMDP", href: "https://www.mdp.edu.ar/" },
    links: [
      { platform: "github", label: "GitHub", href: "https://github.com/Celiz" },
      { platform: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/celizm/" },
      { platform: "portfolio", label: "Portfolio", href: "https://celizin.dev" },
      { platform: "x", label: "X", href: "https://twitter.com/celizin" },
      { platform: "instagram", label: "Instagram", href: "https://instagram.com/celizin_" },
    ],
  },
];

function AuthorCard({ author }: { author: Author }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-[#2bb3a8]/40">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-amarillo/30 bg-amarillo/10 text-[15px] font-black text-amarillo">
          {author.initials}
        </div>
        <div className="min-w-0">
          <h3 className="text-[16px] font-bold text-foreground">{author.name}</h3>
          <p className="text-[13px] text-muted-foreground">{author.role}</p>
        </div>
      </div>

      <p className="mt-4 text-[12px] text-muted-foreground opacity-80">
        <a
          href={author.education.href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
        >
          {author.education.label}
        </a>
        {" · "}
        <a
          href={author.institution.href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
        >
          {author.institution.label}
        </a>
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {author.links.map(({ platform, label, href }) => {
          const Icon = ICONS[platform];
          return (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${author.name} en ${label}`}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:border-[#2bb3a8]/50 hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

export function LandingAuthors() {
  return (
    <LandingSection
      eyebrow="El equipo"
      title="Hecho por"
      highlight="marplatenses"
      description="Un proyecto independiente y de código abierto, creado por dos estudiantes de Mar del Plata."
    >
      <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
        {AUTHORS.map((author) => (
          <AuthorCard key={author.name} author={author} />
        ))}
      </div>
    </LandingSection>
  );
}
