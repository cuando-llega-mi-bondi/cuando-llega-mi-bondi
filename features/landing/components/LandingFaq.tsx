import Link from "next/link";
import { LandingSection } from "./LandingSection";
import { Reveal } from "./Reveal";
import { FaqAccordion } from "./FaqAccordion";

// Single source of truth: drives both the rendered accordion and the JSON-LD.
const FAQ_ITEMS = [
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
    a: "Es una PWA: podés instalarla desde el navegador en Android e iPhone, sin pasar por ninguna tienda de apps.",
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
      <Reveal>
        <LandingSection
          eyebrow="Preguntas frecuentes"
          title="Preguntas"
          highlight="frecuentes"
          description="Todo lo que querés saber antes de usar Bondi MDP."
        >
          {/* Sidebar + lista en vez de header centrado sobre acordeón: usa
              todo el ancho de la sección (como el resto de la página) sin
              volver a la grilla de 2 columnas que "inflaba" a la vecina. */}
          <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-10">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                ¿Tenés dudas?
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                Te respondemos directo, sin tickets ni bots. Si encontraste un
                error, falta una línea o los horarios no coinciden con la
                realidad, contanos: la app mejora con lo que reporta la gente
                que la usa todos los días.
              </p>
              <Link
                href="/acerca"
                className="mt-4 inline-flex items-center justify-center rounded-full bg-amarillo px-5 py-2.5 text-[13px] font-bold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]"
              >
                Escribinos
              </Link>
            </div>
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </LandingSection>
      </Reveal>
    </>
  );
}
