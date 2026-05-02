"use client";

import { useCallback } from "react";
import { IconBus } from "./icons/IconBus";
import { IconGithub } from "./icons/IconGithub";
import { IconLinkedin } from "./icons/IconLinkedin";
import { IconExternalLink } from "./icons/IconExternalLink";
import { IconShare } from "./icons/IconShare";
import { IconWhatsApp } from "./icons/IconWhatsApp";
import { IconZap } from "./icons/IconZap";
import { IconCode } from "./icons/IconCode";
import { IconMessage } from "./icons/IconMessage";
import { IconSearch } from "./icons/IconSearch";
import { BottomNav } from "./BottomNav";
import { PageShell } from "./layout";
import { BrandLogo } from "./ui/BrandLogo";
import { Footer } from "./Footer";

// ── Data ────────────────────────────────────────────────────────────────────

const FAQ = [
    { q: "¿Es gratis?", a: "Sí. 100% gratuita y sin anuncios." },
    { q: "¿Funciona sin internet?", a: "Necesitás conexión para obtener los datos en tiempo real." },
    { q: "¿Qué líneas incluye?", a: "Todas las líneas de colectivos de Mar del Plata." },
] as const;

interface Developer {
    name: string;
    role: string;
    education: { label: string; href: string };
    institution: { label: string; href: string };
    links: { icon: React.ReactNode; label: string; href: string }[];
}

const DEVELOPERS: Developer[] = [
    {
        name: "Nicolás Jiménez",
        role: "Frontend Developer · Multimedia Designer",
        education: { label: "TUP", href: "https://mdp.utn.edu.ar/tecnicatura/tecnico_universitario_en_programacion/" },
        institution: { label: "UTN FRMDP", href: "https://mdp.utn.edu.ar/" },
        links: [
            { icon: <IconGithub className="h-4 w-4" />, label: "GitHub", href: "https://github.com/dotfn" },
            { icon: <IconLinkedin className="h-4 w-4" />, label: "LinkedIn", href: "https://linkedin.com/in/dotfn" },
            { icon: <IconExternalLink className="h-4 w-4" />, label: "Portfolio", href: "https://dotfn.github.io/dotfn/" },
        ],
    },
    {
        name: "Matias Celiz Ramos",
        role: "Técnico en Informática",
        education: { label: "Tecnicatura en Ciencia de Datos", href: "#" },
        institution: { label: "UNMDP", href: "#" },
        links: [
            { icon: <IconGithub className="h-4 w-4" />, label: "GitHub", href: "https://github.com/Celiz" },
            { icon: <IconLinkedin className="h-4 w-4" />, label: "LinkedIn", href: "https://www.linkedin.com/in/celizm/" },
            { icon: <IconExternalLink className="h-4 w-4" />, label: "Portfolio", href: "https://celizin.dev" },
        ],
    },
];

const APP_FEATURES = [
    {
        icon: <IconSearch className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />,
        title: "Tiempo real",
        description: "Consultá líneas, paradas y próximos arribos al instante.",
    },
    {
        icon: <IconZap className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />,
        title: "Rápida",
        description: "Sin registro, sin publicidad y sin pasos innecesarios.",
    },
    {
        icon: <IconCode className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />,
        title: "Independiente",
        description: "Alternativa simple y directa para consultar el transporte.",
    },
] as const;

// ── Sub-components ───────────────────────────────────────────────────────────

function DevCard({ dev }: { dev: Developer }) {
    return (
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
            <div className="min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[15px] font-semibold">{dev.name}</h3>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-success bg-success/10 px-2.5 py-1 text-[12px] font-semibold text-success">
                        <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-current" />
                        Conectemos
                    </span>
                </div>
                <p className="text-[13px] text-muted-foreground">{dev.role}</p>
                <p className="text-[12px] text-muted-foreground opacity-80">
                    Alumno de la{" "}
                    <a
                        href={dev.education.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
                    >
                        {dev.education.label}
                    </a>
                    {" · "}
                    <a
                        href={dev.institution.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
                    >
                        {dev.institution.label}
                    </a>
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {dev.links.map(({ icon, label, href }) => (
                    <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:border-secondary hover:text-foreground"
                    >
                        {icon}
                        {label}
                    </a>
                ))}
            </div>
        </div>
    );
}

// ── Main component ───────────────────────────────────────────────────────────

export function AcercaClient() {
    const handleShareWhatsApp = useCallback(() => {
        const text = encodeURIComponent(
            "Mirá esta app para ver cuándo llega el bondi en Mar del Plata 🚌 https://www.bondimdp.com.ar",
        );
        window.open(`https://wa.me/?text=${text}`, "_blank", "noopener");
    }, []);

    const handleShareNative = useCallback(async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Bondi MDP",
                    text: "Consultá cuándo llega tu colectivo en Mar del Plata",
                    url: "https://www.bondimdp.com.ar",
                });
            } catch {
                /* user cancelled */
            }
        } else {
            handleShareWhatsApp();
        }
    }, [handleShareWhatsApp]);

    return (
        <div className="flex min-h-pwa-shell flex-col">
            <PageShell className="space-y-10 pt-4">
                {/* ── HERO ──────────────────────────────────────────── */}
                <section className="flex flex-col items-center gap-5 text-center">
                    <div className="flex items-center justify-center text-secondary">
                        <IconBus size={64} />
                    </div>
                    <div>
                        <h1 className="sr-only">BONDI MDP</h1>
                        <BrandLogo className="text-4xl lg:text-[40px]" />
                        <p className="mt-1 text-[10.4px] uppercase tracking-wider text-muted-foreground">
                            MAR DEL PLATA
                        </p>
                    </div>
                    <p className="max-w-sm text-[14px] leading-relaxed text-muted-foreground">
                        Información de colectivos en tiempo real para Mar del Plata.
                        Rápida, clara y sin vueltas.
                    </p>
                </section>

                {/* ── HECHO POR ─────────────────────────────────────── */}
                <section className="space-y-3">
                    <h2 className="text-[10.4px] font-normal uppercase tracking-wider text-muted-foreground">
                        Hecho por
                    </h2>
                    <div className="space-y-3">
                        {DEVELOPERS.map((dev) => (
                            <DevCard key={dev.name} dev={dev} />
                        ))}
                    </div>
                </section>

                {/* ── COMPARTIR ─────────────────────────────────────── */}
                <section className="space-y-3">
                    <h2 className="text-[10.4px] font-normal uppercase tracking-wider text-muted-foreground">
                        Compartir
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleShareWhatsApp}
                            className="btn-pill btn-secondary w-full gap-2 text-[13px]"
                        >
                            <IconWhatsApp className="h-5 w-5" />
                            WhatsApp
                        </button>
                        <button
                            onClick={handleShareNative}
                            className="btn-pill btn-primary w-full gap-2 text-[13px]"
                        >
                            <IconShare className="h-5 w-5" />
                            Compartir
                        </button>
                    </div>
                </section>

                {/* ── SOBRE LA APP ──────────────────────────────────── */}
                <section className="space-y-3">
                    <h2 className="text-[10.4px] font-normal uppercase tracking-wider text-muted-foreground">
                        Sobre la app
                    </h2>
                    <div className="space-y-3">
                        {APP_FEATURES.map(({ icon, title, description }) => (
                            <div
                                key={title}
                                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                            >
                                {icon}
                                <div>
                                    <p className="text-[14px] font-semibold">{title}</p>
                                    <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── CÓDIGO ABIERTO ────────────────────────────────── */}
                <section className="space-y-3">
                    <h2 className="text-[10.4px] font-normal uppercase tracking-wider text-muted-foreground">
                        Código abierto
                    </h2>
                    <div className="space-y-3">
                        {[
                            {
                                href: "https://github.com/cuando-llega-mi-bondi/cuando-llega-mi-bondi",
                                icon: <IconGithub className="h-5 w-5 text-secondary" />,
                                title: "Repositorio en GitHub",
                                subtitle: "Código fuente y decisiones técnicas",
                            },
                            {
                                href: "https://github.com/cuando-llega-mi-bondi/cuando-llega-mi-bondi/issues",
                                icon: <IconMessage className="h-5 w-5 text-secondary" />,
                                title: "Reportar bugs o proponer mejoras",
                                subtitle: "El proyecto crece con la comunidad",
                            },
                        ].map(({ href, icon, title, subtitle }) => (
                            <a
                                key={href}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-secondary"
                            >
                                <div className="flex items-center gap-3">
                                    {icon}
                                    <div>
                                        <p className="text-[14px] font-semibold">{title}</p>
                                        <p className="text-[12px] text-muted-foreground opacity-80">{subtitle}</p>
                                    </div>
                                </div>
                                <IconExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-80" />
                            </a>
                        ))}
                    </div>
                </section>

                {/* ── FAQ ───────────────────────────────────────────── */}
                <section className="space-y-3">
                    <h2 className="text-[10.4px] font-normal uppercase tracking-wider text-muted-foreground">
                        Preguntas frecuentes
                    </h2>
                    <div className="space-y-3">
                        {FAQ.map(({ q, a }) => (
                            <div key={q} className="rounded-xl border border-border bg-card p-4">
                                <p className="text-[14px] font-semibold">{q}</p>
                                <p className="mt-1 text-[13px] text-muted-foreground">{a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── FOOTER ────────────────────────────────────────── */}
                <Footer />
            </PageShell>

            <BottomNav tab="buscar" setTab={() => {}} favCount={0} />
        </div>
    );
}
