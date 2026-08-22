import { AdIcon } from "./AdIcon";
import { IconExternalLink } from "@shared/icons/IconExternalLink";
import { cn } from "@shared/utils";

export function AdCreativeCard({
  title,
  tagline,
  href,
  className,
}: {
  title: string;
  tagline?: string | null;
  href: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      aria-label={`Conocer: ${title}`}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3 transition-colors hover:border-secondary/40",
        className,
      )}
    >
      <AdIcon href={href} title={title} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-bold text-foreground">{title}</span>
        {tagline ? (
          <span className="mt-0.5 block truncate text-[12px] leading-snug text-muted-foreground">
            {tagline}
          </span>
        ) : null}
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[12px] font-bold text-secondary">
        Conocer
        <IconExternalLink className="h-3.5 w-3.5" aria-hidden />
      </span>
    </a>
  );
}
