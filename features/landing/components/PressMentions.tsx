// components/PressMentions.tsx
/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SpotlightCard } from "./SpotlightCard";

const pressMentions = [
    {
        image: "/notas/la-capital.jpg",
        source: "Diario La Capital",
        logo: { src: "/press-logos/la-capital.jpg", width: 401, height: 62 },
        title:
            "Lanzaron “Bondi Mdp”, la alternativa a la aplicación “Cuándo Llega” para usuarios de colectivos",
        link: "https://www.lacapitalmdp.com/lanzaron-bondi-mdp-la-alternativa-a-la-aplicacion-cuando-llega-para-usuarios-de-colectivos/",
    },
    {
        image: "/notas/noticias-de-bariloche.jpg",
        source: "Noticias de Bariloche",
        logo: { src: "/press-logos/noticias-de-bariloche.png", width: 600, height: 90 },
        title:
            "Lanzaron “Bondi Mdp”, la alternativa a la aplicación “Cuándo Llega” para usuarios de colectivos « Diario La Capital de Mar del Plata",
        link: "https://www.noticiasdebariloche.com.ar/lanzaron-bondi-mdp-la-alternativa-a-la-aplicacion-cuando-llega-para-usuarios-de-colectivos-diario-la-capital-de-mar-del-plata/",
    },
    {
        image: "/notas/canal-8.webp",
        source: "Mi 8",
        logo: { src: "/press-logos/mi8.png", width: 95, height: 64 },
        title:
            "Bondi MDP, la app que se desarrolla como una alternativa a Cuándo Llega: “Mostramos los datos de una forma mucho más accesible”",
        link: "https://mi8.com.ar/bondi-mdp-la-app-que-se-desarrolla-como-una-alternativa-a-cuando-llega-mostramos-los-datos-de-una-forma-mucho-mas-accesible/",
    },
];

export function PressMentions() {
    return (
        <div className="grid gap-8 md:grid-cols-3">
            {pressMentions.map((item, index) => (
                <SpotlightCard
                    key={item.link}
                    index={index}
                    tint="rgba(36,144,138,0.16)"
                    className="p-0"
                >
                    <Link
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative z-20 flex h-full flex-col"
                    >
                        <div className="relative h-56 overflow-hidden bg-muted md:h-64">
                            <div className="absolute inset-0 z-10 bg-black/10 transition-colors group-hover:bg-transparent" />
                            <img
                                src={item.image}
                                alt={item.source}
                                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            />
                            <div className="absolute left-5 top-5 z-20">
                                <span className="inline-flex items-center rounded-full bg-white px-3.5 py-2 shadow-lg">
                                    <img
                                        src={item.logo.src}
                                        alt={item.source}
                                        width={item.logo.width}
                                        height={item.logo.height}
                                        className="h-4 w-auto"
                                    />
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-1 flex-col justify-between p-8">
                            <h3 className="mb-6 line-clamp-4 text-xl font-bold leading-snug text-foreground transition-colors group-hover:text-amarillo">
                                {item.title}
                            </h3>
                            <div className="mt-auto inline-flex items-center text-[15px] font-bold text-secondary transition-colors group-hover:text-amarillo">
                                Leer nota completa
                                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </div>
                        </div>
                    </Link>
                </SpotlightCard>
            ))}
        </div>
    );
}
