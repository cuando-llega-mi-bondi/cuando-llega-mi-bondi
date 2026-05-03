"use client";

import Link from "next/link";

import { ArrowRight, Star, MessageCircle } from "lucide-react";

// Notas de prensa con imágenes de portada

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
];

const socialTestimonials = [
  {
    avatar: "./assets/01.jpg",

    user: "Luigi",

    handle: "@luigicanoro",

    platform: "Star",

    quote: "Cracks totales! Orgullo de la comunidad @mardelplata.dev.ar",

    Icon: Star,
  },

  {
    avatar: "./assets/02.jpg",

    user: "Jonatan Leonardo",

    handle: "@jonimdp",

    platform: "Star",

    quote:
      "Ohh está joyaaa le vas haciendo el seguimiento en el mapita búsquenla en Google por bondimdp.com.ar",

    Icon: Star,
  },

  {
    avatar: "./assets/03.jpg",

    user: "Mónica Castellini",

    handle: "@beacastel2015",

    platform: "Star",

    quote:
      "La función de guardar las paradas favoritas es todo lo que está bien en esta vida. Entro y en 2 segundos ya sé si tengo que correr o no 🚌💨",

    Icon: Star,
  },
];

export function LandingTestimonials() {
  return (
    <section className="py-24 bg-muted/30 border-y border-border/50 relative overflow-hidden">
      {/* Fondo decorativo opcional para seguir la estética del Hero */}

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[300px] bg-gradient-to-b from-turquesa/5 to-transparent blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-full mb-6 shadow-sm">
            <MessageCircle className="w-4 h-4 text-turquesa" />

            <span className="text-[13px] font-bold tracking-wide text-foreground uppercase">
              Prensa y Comunidad
            </span>
          </div>

          <h2 className="text-4xl lg:text-[48px] text-balance font-black uppercase tracking-tighter mb-4">
            Hablan de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-turquesa to-amarillo">
              nosotros
            </span>
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            El impacto de bondiMDP en los medios locales y lo que opinan los
            usuarios que la usan todos los días.
          </p>
        </div>

        {/* --- SECCIÓN NOTAS DE PRENSA --- */}

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {pressMentions.map((item, index) => (
            <Link key={index} href={item.link} className="group block h-full">
              <div className="bg-background border border-border rounded-[2rem] overflow-hidden hover:border-turquesa/40 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                {/* Imagen de portada */}

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

                {/* Contenido de la nota */}

                <div className="p-8 flex-1 flex flex-col justify-between">
                  <h3 className="text-2xl font-bold text-foreground leading-tight mb-6 group-hover:text-turquesa transition-colors">
                    "{item.title}"
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

        {/* --- SECCIÓN COMUNIDAD (MÁS PEQUEÑAS) --- */}

        <div className="grid md:grid-cols-3 gap-6">
          {socialTestimonials.map((item, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-[1.5rem] p-6 hover:shadow-md transition-shadow relative"
            >
              {/* Icono de red social flotante */}

              <div className="absolute top-6 right-6 text-muted-foreground/30">
                <item.Icon className="w-6 h-6" />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <img
                  src={item.avatar}
                  alt={item.user}
                  className="w-12 h-12 rounded-full object-cover border-2 border-background shadow-sm"
                />

                <div>
                  <div className="font-bold text-foreground text-[15px]">
                    {item.user}
                  </div>

                  <div className="text-[13px] text-muted-foreground font-medium">
                    {item.handle}
                  </div>
                </div>
              </div>

              <p className="text-[15px] leading-relaxed text-muted-foreground">
                "{item.quote}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
