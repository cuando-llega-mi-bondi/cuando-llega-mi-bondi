import type { SVGProps } from "react";
import type { Author, AuthorPlatform } from "@features/authors/data/authors";
import { IconGithub } from "@shared/icons/IconGithub";
import { IconLinkedin } from "@shared/icons/IconLinkedin";
import { IconExternalLink } from "@shared/icons/IconExternalLink";
import { IconXBrand } from "@shared/icons/IconXBrand";
import { IconIg } from "@shared/icons/IconIg";
import { cn } from "@shared/utils";

const ICONS: Record<AuthorPlatform, (props: SVGProps<SVGSVGElement>) => React.ReactNode> = {
  github: IconGithub,
  linkedin: IconLinkedin,
  portfolio: IconExternalLink,
  x: IconXBrand,
  instagram: IconIg,
};

/** Perfil abierto, sin tarjeta. `compact` para el teléfono ("Acerca de"). */
export function AuthorProfile({
  author,
  compact = false,
}: {
  author: Author;
  compact?: boolean;
}) {
  const avatarSize = compact ? 48 : 64;

  return (
    <div className="@container">
      <div className={cn("flex items-center", compact ? "gap-4" : "gap-5")}>
        {author.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- el proyecto no usa next/image (sin config de images); foto estática
          <img
            src={author.avatar}
            alt=""
            width={avatarSize}
            height={avatarSize}
            className={cn(
              "shrink-0 rounded-full border border-border object-cover",
              compact ? "h-12 w-12" : "h-16 w-16",
            )}
          />
        ) : (
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full border border-border bg-muted font-black text-foreground",
              compact ? "h-12 w-12 text-base" : "h-16 w-16 text-lg",
            )}
          >
            {author.initials}
          </div>
        )}
        <div className="min-w-0">
          <h3
            className={cn(
              "text-balance text-foreground",
              compact
                ? "text-base font-semibold"
                : "text-xl font-bold tracking-tight",
            )}
          >
            {author.name}
          </h3>
          <p
            className={cn(
              "mt-0.5 text-muted-foreground",
              compact ? "text-[13px]" : "text-sm sm:text-base",
            )}
          >
            {author.role}
          </p>
        </div>
      </div>

      {/* Links como texto con ícono, sin una caja por link: son secundarios a la persona.
          Una sola fila: el nombre aparece cuando la columna llega a 25rem (los cinco
          con nombre ocupan ~397px); más angosta quedan solo los íconos (con aria-label
          y title) antes que partir la fila en dos. */}
      <ul
        className={cn(
          "flex items-center gap-4 @min-[25rem]:gap-3",
          compact ? "mt-2" : "mt-4",
        )}
      >
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
