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
  avatar?: string;
  links: { platform: Platform; label: string; href: string }[];
}

const AUTHORS: Author[] = [
  {
    name: "Nicolás Jiménez",
    initials: "NJ",
    role: "Fullstack Engineer · Multimedia Designer",
    avatar: "/authors/nicolas-jimenez.png",
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
    role: "AI Engineer · Técnico en Informática",
    avatar: "/authors/matias-celiz.png",
    links: [
      { platform: "github", label: "GitHub", href: "https://github.com/Celiz" },
      { platform: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/celizm/" },
      { platform: "portfolio", label: "Portfolio", href: "https://celizin.dev" },
      { platform: "x", label: "X", href: "https://twitter.com/celizin" },
      { platform: "instagram", label: "Instagram", href: "https://instagram.com/celizin_" },
    ],
  },
];

function AuthorProfile({ author }: { author: Author }) {
  return (
    <div className="@container">
      <div className="flex items-center gap-5">
        {author.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- el proyecto no usa next/image (sin config de images); foto estática
          <img
            src={author.avatar}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-lg font-black text-foreground">
            {author.initials}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-balance text-xl font-bold tracking-tight text-foreground">
            {author.name}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground sm:text-base">
            {author.role}
          </p>
        </div>
      </div>

      {/* Links como texto con ícono, sin una caja por link: son secundarios a la persona.
          Una sola fila: el nombre aparece cuando la columna llega a 25rem (los cinco
          con nombre ocupan ~397px); más angosta quedan solo los íconos (con aria-label
          y title) antes que partir la fila en dos. */}
      <ul className="mt-4 flex items-center gap-4 @min-[25rem]:gap-3">
        {author.links.map(({ platform, label, href }) => {
          const Icon = ICONS[platform];
          return (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${author.name} en ${label}`}
                title={label}
                className="inline-flex min-h-11 min-w-6 items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden @min-[25rem]:inline">{label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function LandingAuthors() {
  return (
    <LandingSection title="Hecho por" highlight="marplatenses.">
      {/* Sin tarjetas: la foto y el nombre alcanzan para separar a cada persona */}
      <ul role="list" className="grid gap-12 md:grid-cols-2 md:gap-10">
        {AUTHORS.map((author) => (
          <li key={author.name}>
            <AuthorProfile author={author} />
          </li>
        ))}
      </ul>
    </LandingSection>
  );
}
