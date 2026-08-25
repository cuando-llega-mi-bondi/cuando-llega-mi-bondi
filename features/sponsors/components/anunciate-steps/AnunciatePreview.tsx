"use client";

import { AdCreativeCard } from "../AdCreativeCard";

/**
 * Preview del aviso, visible en los 4 pasos mientras haya un link válido —
 * así se ve cómo va quedando sin tener que volver a un paso anterior. Vive
 * en el flujo normal (no `fixed`): un preview flotante peleaba con el
 * viewport cuando aparece el teclado en mobile.
 */
export function AnunciatePreview({
  title,
  tagline,
  href,
}: {
  title: string;
  tagline: string | null;
  href: string | null;
}) {
  if (!href) return null;

  return (
    <div className="space-y-2.5">
      <p className="font-mono text-[10px] tracking-[1.4px] text-muted-foreground">
        ASÍ SE VE EN CONSULTAR
      </p>
      <AdCreativeCard title={title} tagline={tagline} href={href} />
    </div>
  );
}
