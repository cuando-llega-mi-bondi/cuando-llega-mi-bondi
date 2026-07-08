import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Página no encontrada",
    description:
        "La página que buscás no existe. Volvé al inicio de Bondi MDP para consultar colectivos en Mar del Plata.",
};

const links = [
    {
        href: "/consultar",
        label: "Consultar colectivo",
        desc: "Cuándo llega tu bondi en tiempo real",
    },
    {
        href: "/recorrido",
        label: "Ver recorridos",
        desc: "Mapas y paradas de todas las líneas",
    },
    {
        href: "/como-llego",
        label: "Cómo llego",
        desc: "Planificá tu viaje en colectivo",
    },
    {
        href: "/paradas-cerca",
        label: "Paradas cerca mío",
        desc: "Encontrá la parada más cercana",
    },
];

export default function NotFound() {
    return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 py-16 text-center">
            {/* Big 404 */}
            <div className="mb-2 font-display text-[120px] font-black leading-none tracking-[-0.06em] text-accent/20 select-none sm:text-[160px]">
                404
            </div>

            <h1 className="mb-2 font-display text-2xl font-bold tracking-[-0.03em] text-text sm:text-3xl">
                Página no encontrada
            </h1>
            <p className="mb-10 max-w-md text-[15px] leading-relaxed text-text-dim">
                La dirección que buscás no existe o fue movida.
                Probá alguna de estas secciones:
            </p>

            {/* Navigation links */}
            <div className="grid w-full max-w-md gap-3 sm:grid-cols-2">
                {links.map(({ href, label, desc }) => (
                    <Link
                        key={href}
                        href={href}
                        className="group flex flex-col items-start rounded-2xl border border-border bg-card/80 px-5 py-4 text-left no-underline transition-all hover:border-accent/40 hover:bg-card"
                    >
                        <span className="mb-0.5 font-sans text-[15px] font-semibold tracking-[-0.01em] text-text group-hover:text-accent transition-colors">
                            {label}
                        </span>
                        <span className="font-sans text-[13px] text-text-dim">
                            {desc}
                        </span>
                    </Link>
                ))}
            </div>

            {/* Home link */}
            <Link
                href="/"
                className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-5 py-2.5 font-sans text-[13px] font-medium text-text-dim no-underline transition hover:border-accent/40 hover:text-text"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M19 12H5" />
                    <path d="M12 19l-7-7 7-7" />
                </svg>
                Volver al inicio
            </Link>

            {/* JSON-LD breadcrumb for this page */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        itemListElement: [
                            {
                                "@type": "ListItem",
                                position: 1,
                                name: "Inicio",
                                item: "https://bondimdp.com.ar",
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}
