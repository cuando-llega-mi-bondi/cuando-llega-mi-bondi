"use client";

import { useCallback, type ReactNode } from "react";
import Link from "next/link";
import { useReviewsUser } from "@features/reviews/hooks/useReviewsUser";
import { AUTHORS } from "@features/authors/data/authors";
import { AuthorProfile } from "@features/authors/components/AuthorProfile";
import { IconBus } from "@shared/icons/IconBus";
import { IconGithub } from "@shared/icons/IconGithub";
import { IconExternalLink } from "@shared/icons/IconExternalLink";
import { IconShare } from "@shared/icons/IconShare";
import { IconWhatsApp } from "@shared/icons/IconWhatsApp";
import { IconZap } from "@shared/icons/IconZap";
import { IconCode } from "@shared/icons/IconCode";
import { IconMessage } from "@shared/icons/IconMessage";
import { IconSearch } from "@shared/icons/IconSearch";
import { PageHeader } from "@shared/layout/PageHeader";
import { BrandLogo } from "@shared/ui/BrandLogo";
// ── Data ────────────────────────────────────────────────────────────────────

const FAQ = [
    {
        q: "¿Es gratis?",
        a: "Sí. 100% gratuita. Se sostiene con publicidad no intrusiva.",
    },
    {
        q: "¿Funciona sin internet?",
        a: "Necesitás conexión para obtener los datos en tiempo real.",
    },
    {
        q: "¿Qué líneas incluye?",
        a: "Todas las líneas de colectivos de Mar del Plata.",
    },
] as const;

const APP_FEATURES = [
    {
        icon: <IconSearch className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />,
        title: "Tiempo real",
        description: "Consultá líneas, paradas y próximos arribos al instante.",
    },
    {
        icon: <IconZap className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />,
        title: "Rápida",
        description: "Sin registro ni pasos innecesarios.",
    },
    {
        icon: <IconCode className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />,
        title: "Independiente",
        description: "Alternativa simple y directa para consultar el transporte.",
    },
] as const;

const OPEN_SOURCE_LINKS = [
    {
        href: "https://github.com/cuando-llega-mi-bondi/cuando-llega-mi-bondi",
        icon: <IconGithub className="h-5 w-5 shrink-0 text-secondary dark:text-amarillo" />,
        title: "Repositorio en GitHub",
        subtitle: "Código fuente y decisiones técnicas",
    },
    {
        href: "https://github.com/cuando-llega-mi-bondi/cuando-llega-mi-bondi/issues",
        icon: <IconMessage className="h-5 w-5 shrink-0 text-secondary dark:text-amarillo" />,
        title: "Reportar bugs o proponer mejoras",
        subtitle: "El proyecto crece con la comunidad",
    },
] as const;

// ── Sub-components ───────────────────────────────────────────────────────────

// Sin tarjetas dentro del teléfono: cada sección es un rótulo y su contenido sobre el
// fondo, y las listas se separan con una línea, como las secciones abiertas de la landing
function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="space-y-3">
            <h2 className="text-balance text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {title}
            </h2>
            {children}
        </section>
    );
}

const LIST = "divide-y divide-border border-y border-border";
const ROW = "group flex min-h-11 items-center gap-3 py-3.5 no-underline";

function IconChevronRight() {
    return (
        <svg
            aria-hidden
            className="shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}

function RowBody({
    icon,
    title,
    subtitle,
    trailing,
}: {
    icon?: ReactNode;
    title: string;
    subtitle: string;
    trailing: ReactNode;
}) {
    return (
        <>
            {icon}
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground underline-offset-4 group-hover:underline">
                    {title}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                    {subtitle}
                </span>
            </span>
            {trailing}
        </>
    );
}

// ── Main component ───────────────────────────────────────────────────────────

export function AcercaClient() {
    const { user } = useReviewsUser();

    const handleShareWhatsApp = useCallback(() => {
        const text = encodeURIComponent(
            "Mirá esta app para ver cuándo llega el bondi en Mar del Plata 🚌 https://bondimdp.com.ar",
        );
        window.open(`https://wa.me/?text=${text}`, "_blank", "noopener");
    }, []);

    const handleShareNative = useCallback(async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Bondi MDP",
                    text: "Consultá cuándo llega tu colectivo en Mar del Plata",
                    url: "https://bondimdp.com.ar",
                });
            } catch {
                /* user cancelled */
            }
        } else {
            handleShareWhatsApp();
        }
    }, [handleShareWhatsApp]);

    return (
        <div className="flex flex-col space-y-8">
            <PageHeader
                title="Acerca de"
                highlight="Bondi MDP"
                subtitle="El proyecto y el equipo"
            />

            <div className="space-y-10">
                {/* ── HERO ──────────────────────────────────── */}
                <section className="flex flex-col items-center gap-4 px-5 text-center">
                    <div className="flex items-center justify-center text-secondary dark:text-amarillo">
                        <IconBus size={56} />
                    </div>
                    <div>
                        <BrandLogo className="text-3xl" />
                        <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                            MAR DEL PLATA
                        </p>
                    </div>
                    <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                        Información de colectivos en tiempo real para Mar del Plata.
                        Rápida, clara y sin vueltas.
                    </p>
                </section>

                {/* ── SOBRE LA APP ──────────────────────────── */}
                <Section title="Sobre la app">
                    <ul className="space-y-4">
                        {APP_FEATURES.map(({ icon, title, description }) => (
                            <li key={title} className="flex items-start gap-3">
                                {icon}
                                <div>
                                    <p className="text-sm font-semibold">{title}</p>
                                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                                        {description}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Section>

                {/* ── COMPARTIR ─────────────────────────────── */}
                <Section title="Compartir">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={handleShareWhatsApp}
                            className="btn-pill btn-secondary w-full gap-2 text-[13px]"
                        >
                            <IconWhatsApp className="h-5 w-5" />
                            WhatsApp
                        </button>
                        <button
                            type="button"
                            onClick={handleShareNative}
                            className="btn-pill btn-primary w-full gap-2 text-[13px]"
                        >
                            <IconShare className="h-5 w-5" />
                            Compartir
                        </button>
                    </div>
                </Section>

                {/* ── TU CUENTA ─────────────────────────────── */}
                {user && (
                    <Section title="Tu cuenta">
                        <div className={LIST}>
                            <Link href="/perfil" className={ROW}>
                                <RowBody
                                    title={user.email ?? ""}
                                    subtitle="Cerrar sesión o eliminar tu cuenta"
                                    trailing={<IconChevronRight />}
                                />
                            </Link>
                        </div>
                    </Section>
                )}

                {/* ── HECHO POR ─────────────────────────────── */}
                <Section title="Hecho por">
                    <ul role="list" className="space-y-6">
                        {AUTHORS.map((author) => (
                            <li key={author.name}>
                                <AuthorProfile author={author} compact />
                            </li>
                        ))}
                    </ul>
                </Section>

                {/* ── CÓDIGO ABIERTO ────────────────────────── */}
                <Section title="Código abierto">
                    <ul role="list" className={LIST}>
                        {OPEN_SOURCE_LINKS.map(({ href, icon, title, subtitle }) => (
                            <li key={href}>
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={ROW}
                                >
                                    <RowBody
                                        icon={icon}
                                        title={title}
                                        subtitle={subtitle}
                                        trailing={
                                            <IconExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                                        }
                                    />
                                </a>
                            </li>
                        ))}
                    </ul>
                </Section>

                {/* ── BLOG ──────────────────────────────────────────── */}
                <Section title="Blog">
                    <div className={LIST}>
                        <Link href="/blog" className={ROW}>
                            <RowBody
                                title="Comparativas y guías"
                                subtitle="Bondi MDP vs. la app oficial, y cómo saber cuándo llega el colectivo"
                                trailing={<IconChevronRight />}
                            />
                        </Link>
                    </div>
                </Section>

                {/* ── FAQ ───────────────────────────────────────────── */}
                <Section title="Preguntas frecuentes">
                    <dl className={LIST}>
                        {FAQ.map(({ q, a }) => (
                            <div key={q} className="py-3.5">
                                <dt className="text-sm font-semibold">{q}</dt>
                                <dd className="mt-1 text-[13px] text-muted-foreground">{a}</dd>
                            </div>
                        ))}
                    </dl>
                </Section>
            </div>
        </div>
    );
}
