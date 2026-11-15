import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingSection } from "./LandingSection";
import { FaqAccordion } from "./FaqAccordion";

// Single source of truth: drives both the rendered accordion and the JSON-LD.
const FAQ_ITEMS = [
  {
    q: "¿Cómo sé cuándo llega mi colectivo en Mar del Plata?",
    a: "Entrás a Bondi MDP, elegís tu línea y tu parada en /consultar, y ves los minutos que faltan para que llegue, calculados con la posición GPS real de la unidad. Es gratis, no pide cuenta y no hace falta instalar nada.",
  },
  {
    q: "¿Es gratis?",
    a: "Sí, es 100% gratuita. Se sostiene con publicidad no intrusiva, sin costos ocultos.",
  },
  {
    q: "¿Necesito registrarme?",
    a: "No. No hay cuentas ni registro: entrás, consultás tu línea y listo.",
  },
  {
    q: "¿Qué líneas incluye?",
    a: "Todas las líneas municipales de colectivos de Mar del Plata.",
  },
  {
    q: "¿Los datos son oficiales?",
    a: "Sí. La información proviene de los datos de la Municipalidad de General Pueyrredón (MGP).",
  },
  {
    q: "¿Funciona sin internet?",
    a: "Necesitás conexión para obtener los arribos y recorridos en tiempo real.",
  },
  {
    q: "¿Cómo la instalo?",
    a: "En Android está en Google Play (bondimdp.com.ar/android). También podés usarla en el navegador o instalarla como PWA en Android e iPhone, sin cuenta.",
  },
] as const;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export function LandingFaq() {
  return (
    <>
      {/* JSON-LD kept in the server tree (outside the Reveal client boundary) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <LandingSection
        layout="split"
        title="Preguntas"
        highlight="frecuentes."
        headerExtra={
          <div className="mt-8 max-w-sm">
            <h3 className="text-balance text-base font-bold text-foreground">
              ¿Encontraste algún recorrido desactualizado?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Te respondemos directo, sin tickets ni bots. Si falta una parada o
              un ramal cambió de calle, escribinos para actualizarlo.
            </p>
            <Link
              href="/acerca"
              className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-foreground transition-colors duration-150 hover:text-secondary dark:hover:text-amarillo"
            >
              Contacto y soporte
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>
        }
      >
        <FaqAccordion items={FAQ_ITEMS} />
      </LandingSection>
    </>
  );
}
