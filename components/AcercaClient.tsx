"use client";

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
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { PageShell } from "./layout";

const FAQ = [
    { q: "¿Es gratis?", a: "Sí. 100% gratuita y sin anuncios." },
    {
        q: "¿Funciona sin internet?",
        a: "Necesitás conexión para obtener los datos en tiempo real.",
    },
    {
        q: "¿Qué líneas incluye?",
        a: "Todas las líneas de colectivos de Mar del Plata.",
    },
];

export function AcercaClient() {
    const handleShareWhatsApp = () => {
        const text = encodeURIComponent(
            "Mirá esta app para ver cuándo llega el bondi en Mar del Plata 🚌 https://www.bondimdp.com.ar",
        );
        window.open(`https://wa.me/?text=${text}`, "_blank");
    };

    const handleShareNative = async () => {
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
    };

    return (
        <div className="flex min-h-dvh flex-col pb-24">
            <Header />

            <PageShell className="space-y-10 pt-8">
                {/* ── HERO ─────────────────────────────────── */}
                <section className="flex flex-col items-center gap-5 text-center">
                    <div className="flex  items-center justify-center text-secondary">
                        <IconBus />
                    </div>

                    <div>
                        <h1 className="text-[32px] font-medium uppercase leading-tight tracking-[-1px]">
                            BONDI{" "}
                            <span className="text-secondary">MDP</span>
                        </h1>
                        <p className="mt-1 text-[10.4px] uppercase tracking-wider text-muted-foreground">
                            MAR DEL PLATA
                        </p>
                    </div>

                    <p className="max-w-sm text-[14px] leading-relaxed text-muted-foreground">
                        Información de colectivos en tiempo real para Mar del Plata.
                        Rápida, clara y sin vueltas.
                    </p>
                </section>

                {/* ── HECHO POR ────────────────────────────── */}
                <section className="space-y-3">
                    <h2 className="text-[10.4px] font-normal uppercase tracking-wider text-muted-foreground">
                        Hecho por
                    </h2>

                    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[15px] font-semibold">
                                        Nicolás Jiménez
                                    </h3>
                                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-success bg-success/10 px-2.5 py-1 text-[12px] font-semibold text-success">
                                        <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-current" />
                                        Conectemos
                                    </span>
                                </div>
                                <p className="text-[13px] text-muted-foreground">
                                    Frontend Developer · Multimedia Designer
                                </p>
                                <p className="text-[12px] text-muted-foreground opacity-80">
                                    Alumno de la{" "}
                                    <a
                                        href="https://mdp.utn.edu.ar/tecnicatura/tecnico_universitario_en_programacion/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
                                    >
                                        TUP
                                    </a>
                                    {" · "}
                                    <a
                                        href="https://mdp.utn.edu.ar/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
                                    >
                                        UTN FRMDP
                                    </a>
                                </p>
                            </div>
                        </div>


                        {/* Links */}
                        <div className="flex flex-wrap gap-2">
                            <a
                                href="https://github.com/dotfn"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:border-secondary hover:text-foreground"
                            >
                                <IconGithub className="h-4 w-4" />
                                GitHub
                            </a>

                            <a
                                href="https://linkedin.com/in/dotfn"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:border-secondary hover:text-foreground"
                            >
                                <IconLinkedin className="h-4 w-4" />
                                LinkedIn
                            </a>

                            <a
                                href="https://dotfn.github.io/dotfn/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:border-secondary hover:text-foreground"
                            >
                                <IconExternalLink className="h-4 w-4" />
                                Portfolio
                            </a>
                        </div>
                    </div>
                    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[15px] font-semibold">
                                        Matias Celiz Ramos
                                    </h3>
                                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-success bg-success/10 px-2.5 py-1 text-[12px] font-semibold text-success">
                                        <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-current" />
                                        Conectemos
                                    </span>
                                </div>
                                <p className="text-[13px] text-muted-foreground">
                                    Tecnico en informatica
                                </p>
                                <p className="text-[12px] text-muted-foreground opacity-80">
                                    Alumno de la{" "}
                                    <a
                                        href="#"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
                                    >


                                        Tecnicatura, Ciencia de DatosP
                                    </a>
                                    {" · "}
                                    <a
                                        href="#"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
                                    >
                                        UNMDP
                                    </a>
                                </p>
                            </div>
                        </div>


                        {/* Links */}
                        <div className="flex flex-wrap gap-2">
                            <a
                                href="https://github.com/Celiz"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:border-secondary hover:text-foreground"
                            >
                                <IconGithub className="h-4 w-4" />
                                GitHub
                            </a>

                            <a
                                href="https://www.linkedin.com/in/celizm/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:border-secondary hover:text-foreground"
                            >
                                <IconLinkedin className="h-4 w-4" />
                                LinkedIn
                            </a>

                            <a
                                href="https://celizin.dev"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:border-secondary hover:text-foreground"
                            >
                                <IconExternalLink className="h-4 w-4" />
                                Portfolio
                            </a>
                        </div>
                    </div>
                </section>


                {/* ── COMPARTIR ────────────────────────────── */}
                <section className="space-y-3">
                    <h2 className="text-[10.4px] font-normal uppercase tracking-wider text-muted-foreground">
                        Compartir
                    </h2>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            id="share-whatsapp-btn"
                            onClick={handleShareWhatsApp}
                            className="btn-pill btn-secondary w-full gap-2 text-[13px]"
                        >
                            <IconWhatsApp className="h-5 w-5" />
                            WhatsApp
                        </button>

                        <button
                            id="share-native-btn"
                            onClick={handleShareNative}
                            className="btn-pill btn-primary w-full gap-2 text-[13px]"
                        >
                            <IconShare className="h-5 w-5" />
                            Compartir
                        </button>
                    </div>
                </section>

                {/* ── SOBRE LA APP ─────────────────────────── */}
                <section className="space-y-3">
                    <h2 className="text-[10.4px] font-normal uppercase tracking-wider text-muted-foreground">
                        Sobre la app
                    </h2>

                    <div className="space-y-3">
                        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                            <IconSearch className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                            <div>
                                <p className="text-[14px] font-semibold">
                                    Tiempo real
                                </p>
                                <p className="mt-1 text-[13px] text-muted-foreground">
                                    Consultá líneas, paradas y próximos arribos al
                                    instante.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                            <IconZap className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                            <div>
                                <p className="text-[14px] font-semibold">Rápida</p>
                                <p className="mt-1 text-[13px] text-muted-foreground">
                                    Sin registro, sin publicidad y sin pasos
                                    innecesarios.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                            <IconCode className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                            <div>
                                <p className="text-[14px] font-semibold">
                                    Independiente
                                </p>
                                <p className="mt-1 text-[13px] text-muted-foreground">
                                    Alternativa simple y directa para consultar el
                                    transporte.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── CÓDIGO ABIERTO ──────────────────────── */}
                <section className="space-y-3">
                    <h2 className="text-[10.4px] font-normal uppercase tracking-wider text-muted-foreground">
                        Código abierto
                    </h2>

                    <div className="space-y-3">
                        <a
                            href="https://github.com/dotfn/cuando-llega-mi-bondi"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-secondary"
                        >
                            <div className="flex items-center gap-3">
                                <IconGithub className="h-5 w-5 text-secondary" />
                                <div>
                                    <p className="text-[14px] font-semibold">
                                        Repositorio en GitHub
                                    </p>
                                    <p className="text-[12px] text-muted-foreground opacity-80">
                                        Código fuente y decisiones técnicas
                                    </p>
                                </div>
                            </div>
                            <IconExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-80" />
                        </a>

                        <a
                            href="https://github.com/dotfn/cuando-llega-mi-bondi/issues"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-secondary"
                        >
                            <div className="flex items-center gap-3">
                                <IconMessage className="h-5 w-5 text-secondary" />
                                <div>
                                    <p className="text-[14px] font-semibold">
                                        Reportar bugs o proponer mejoras
                                    </p>
                                    <p className="text-[12px] text-muted-foreground opacity-80">
                                        El proyecto crece con la comunidad
                                    </p>
                                </div>
                            </div>
                            <IconExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-80" />
                        </a>
                    </div>
                </section>

                {/* ── FAQ ─────────────────────────────────── */}
                <section className="space-y-3">
                    <h2 className="text-[10.4px] font-normal uppercase tracking-wider text-muted-foreground">
                        Preguntas frecuentes
                    </h2>

                    <div className="space-y-3">
                        {FAQ.map((item) => (
                            <div
                                key={item.q}
                                className="rounded-xl border border-border bg-card p-4"
                            >
                                <p className="text-[14px] font-semibold">
                                    {item.q}
                                </p>
                                <p className="mt-1 text-[13px] text-muted-foreground">
                                    {item.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── FOOTER ─────────────────────────────── */}
                <footer className="space-y-1 pb-2 pt-4 text-center">
                    <p className="text-[10.4px] uppercase tracking-wider text-muted-foreground opacity-80">
                        © 2026 Bondi MDP · Mar del Plata
                    </p>
                    <p className="text-[12px] text-muted-foreground opacity-80">
                        Hecha con ❤️ para marplatenses 🌊
                    </p>
                </footer>
            </PageShell>

            <BottomNav tab="buscar" setTab={() => { }} favCount={0} />
        </div>
    );
}
