/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

// La primera va como nota principal: la más reciente y la de la foto más fuerte
const pressMentions = [
  {
    image: "/notas/aticma-awards-2026.webp",
    source: "ATICMA",
    title:
      "Más de 500 personas celebraron en los ATICMA Awards 2026, lo mejor de la industria tecnológica de Mar del Plata",
    link: "https://www.aticma.org.ar/novedades/aticma-awards-2026-ganadores/",
  },
  {
    image: "/notas/la-capital.jpg",
    source: "Diario La Capital",
    title:
      "Lanzaron “Bondi Mdp”, la alternativa a la aplicación “Cuándo Llega” para usuarios de colectivos",
    link: "https://www.lacapitalmdp.com/lanzaron-bondi-mdp-la-alternativa-a-la-aplicacion-cuando-llega-para-usuarios-de-colectivos/",
  },
  {
    image: "/notas/canal-8.webp",
    source: "Mi 8 · Canal 8",
    title:
      "Bondi MDP, la app que se desarrolla como una alternativa a Cuándo Llega: “Mostramos los datos de una forma mucho más accesible”",
    link: "https://mi8.com.ar/bondi-mdp-la-app-que-se-desarrolla-como-una-alternativa-a-cuando-llega-mostramos-los-datos-de-una-forma-mucho-mas-accesible/",
  },
  {
    image: "/notas/noticias-de-bariloche.jpg",
    source: "Noticias de Bariloche",
    title:
      "Lanzaron “Bondi Mdp”, la alternativa a la aplicación “Cuándo Llega” para usuarios de colectivos en General Pueyrredón",
    link: "https://www.noticiasdebariloche.com.ar/lanzaron-bondi-mdp-la-alternativa-a-la-aplicacion-cuando-llega-para-usuarios-de-colectivos-diario-la-capital-de-mar-del-plata/",
  },
] as const;

type Mention = (typeof pressMentions)[number];

// Sin tarjetas: la foto y el titular son el contenido. Las fotos son decorativas
// (alt vacío) porque el medio y el titular ya nombran el enlace.
function LeadMention({ item }: { item: Mention }) {
  return (
    <Link
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
        <img
          src={item.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <p className="mt-6 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {item.source}
      </p>
      <h3 className="mt-3 text-balance text-2xl font-black leading-tight tracking-[-0.02em] text-foreground decoration-2 underline-offset-4 group-hover:underline xl:text-[28px]">
        {item.title}
      </h3>
      <span className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-foreground">
        Leer nota
        <ArrowUpRight aria-hidden className="h-4 w-4" />
      </span>
    </Link>
  );
}

function MentionRow({ item }: { item: Mention }) {
  return (
    <Link
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-5"
    >
      <div className="aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-xl bg-muted xl:w-36">
        <img
          src={item.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {item.source}
        </p>
        <h3 className="mt-2 line-clamp-4 text-balance text-base font-bold leading-snug text-foreground underline-offset-4 group-hover:underline">
          {item.title}
        </h3>
      </div>
    </Link>
  );
}

export function PressMentions() {
  const [lead, ...rest] = pressMentions;

  return (
    <div className="grid gap-12 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] xl:gap-12">
      <LeadMention item={lead} />
      <ul role="list" className="grid content-start gap-10">
        {rest.map((item) => (
          <li key={item.link}>
            <MentionRow item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}
