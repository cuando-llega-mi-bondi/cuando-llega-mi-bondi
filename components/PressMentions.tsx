// components/PressMentions.tsx
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const pressMentions = [
  {
    image: "./notas/la-capital.jpg", // Foto de colectivo / calle

    source: "Diario La Capital",

    title:
      "Lanzaron “Bondi Mdp”, la alternativa a la aplicación “Cuándo Llega” para usuarios de colectivos",

    link: "https://www.lacapitalmdp.com/lanzaron-bondi-mdp-la-alternativa-a-la-aplicacion-cuando-llega-para-usuarios-de-colectivos/",

    badgeColor: "bg-amarillo",

    textColor: "text-black",
  },
  {
    image: "./notas/noticias-de-bariloche.jpg", // Foto de colectivo / calle

    source: "Noticias de Bariloche",

    title:
      "Lanzaron “Bondi Mdp”, la alternativa a la aplicación “Cuándo Llega” para usuarios de colectivos « Diario La Capital de Mar del Plata",

    link: "https://www.noticiasdebariloche.com.ar/lanzaron-bondi-mdp-la-alternativa-a-la-aplicacion-cuando-llega-para-usuarios-de-colectivos-diario-la-capital-de-mar-del-plata/",

    badgeColor: "bg-amarillo",

    textColor: "text-black",
  },
];

export function PressMentions() {
  return (
    <div className="grid md:grid-cols-2 gap-8 mb-16">
      {pressMentions.map((item, index) => (
        <Link key={index} href={item.link} className="group block h-full">
          <div className="bg-background border border-border rounded-[2rem] overflow-hidden hover:border-turquesa/40 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
            <div className="relative h-56 md:h-64 overflow-hidden bg-muted">
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10" />
              <img
                src={item.image}
                alt={item.source}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute top-5 left-5 z-20">
                <span
                  className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider ${item.badgeColor} ${item.textColor} shadow-lg`}
                >
                  {item.source}
                </span>
              </div>
            </div>

            <div className="p-8 flex-1 flex flex-col justify-between">
              <h3 className="text-2xl font-bold text-foreground leading-tight mb-6 group-hover:text-turquesa transition-colors">
                &quot;{item.title}&quot;
              </h3>
              <div className="inline-flex items-center text-[15px] font-bold text-muted-foreground group-hover:text-foreground transition-colors mt-auto">
                Leer nota completa
                <ArrowRight className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
