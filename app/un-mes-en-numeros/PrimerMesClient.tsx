"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";




// ─── SVG Charts ──────────────────────────────────────────────────────────────

function AdoptionChart() {
    const [hoveredBar, setHoveredBar] = useState<"new" | "rec" | null>(null);

    // Data values
    const valNew = 29394;
    const valRec = 58303;
    const maxVal = 70000;

    const barWidth = 60;
    const chartHeight = 200;
    const yOffset = 20;

    const heightNew = (valNew / maxVal) * chartHeight;
    const heightRec = (valRec / maxVal) * chartHeight;

    const yNew = chartHeight - heightNew + yOffset;
    const yRec = chartHeight - heightRec + yOffset;

    // y-grid lines at 0, 10k, 20k, 30k, 40k, 50k, 60k, 70k
    const gridLines = [0, 10000, 20000, 30000, 40000, 50000, 60000, 70000];

    return (
        <div className="relative">
            <svg viewBox="0 0 500 260" className="w-full h-auto select-none overflow-visible">
                {/* Horizontal Grid Lines & Y Axis Labels */}
                {gridLines.map((val) => {
                    const y = chartHeight - (val / maxVal) * chartHeight + yOffset;
                    return (
                        <g key={val} className="opacity-40">
                            <line
                                x1="55"
                                y1={y}
                                x2="480"
                                y2={y}
                                stroke="var(--color-border)"
                                strokeWidth="1"
                            />
                            <text
                                x="45"
                                y={y + 4}
                                fill="var(--color-muted-foreground)"
                                className="font-sans text-[11px]"
                                textAnchor="end"
                            >
                                {val >= 1000 ? `${val / 1000}k` : val}
                            </text>
                        </g>
                    );
                })}

                {/* Bars */}
                {/* New Users Bar */}
                <g
                    onMouseEnter={() => setHoveredBar("new")}
                    onMouseLeave={() => setHoveredBar(null)}
                    className="cursor-pointer"
                >
                    <rect
                        x="145"
                        y={yNew}
                        width={barWidth}
                        height={heightNew}
                        fill="color-mix(in srgb, var(--color-primary) 35%, transparent)"
                        className="transition-all duration-200 hover:fill-primary/50"
                        rx="8"
                    />
                </g>

                {/* Recurrent Users Bar */}
                <g
                    onMouseEnter={() => setHoveredBar("rec")}
                    onMouseLeave={() => setHoveredBar(null)}
                    className="cursor-pointer"
                >
                    <rect
                        x="295"
                        y={yRec}
                        width={barWidth}
                        height={heightRec}
                        fill="var(--color-primary)"
                        className="transition-all duration-200 hover:fill-[#FFD85E]"
                        rx="8"
                    />
                </g>

                {/* Bottom X Labels */}
                <g>
                    <line x1="55" y1="220" x2="480" y2="220" stroke="var(--color-border)" strokeWidth="1" />
                    <text
                        x="175"
                        y="242"
                        fill="var(--color-foreground)"
                        className="font-sans text-[13px] font-semibold"
                        textAnchor="middle"
                    >
                        Usuarios Nuevos
                    </text>
                    <text
                        x="325"
                        y="242"
                        fill="var(--color-foreground)"
                        className="font-sans text-[13px] font-semibold"
                        textAnchor="middle"
                    >
                        Usuarios Recurrentes
                    </text>
                </g>
            </svg>

            {/* Custom React Tooltip */}
            {hoveredBar && (
                <div
                    style={{
                        left: hoveredBar === "new" ? "35%" : "65%",
                        bottom: hoveredBar === "new" ? `${(heightNew / 200) * 100 + 15}%` : `${(heightRec / 200) * 100 + 15}%`,
                    }}
                    className="absolute z-10 -translate-x-1/2 rounded bg-card border border-border p-3 text-xs shadow-2xl transition-all pointer-events-none duration-150"
                >
                    <div className="font-bold text-foreground mb-0.5">
                        {hoveredBar === "new" ? "Usuarios Nuevos" : "Usuarios Recurrentes"}
                    </div>
                    <div className="text-muted-foreground">
                        {hoveredBar === "new" ? `${valNew.toLocaleString("es-AR")} sesiones` : `${valRec.toLocaleString("es-AR")} sesiones`}
                    </div>
                </div>
            )}
        </div>
    );
}

function CohortChart() {
    const [hoveredPoint, setHoveredPoint] = useState<{ index: number; type: "new" | "rec" } | null>(null);

    const labels = ["Día 4", "Día 5", "Día 6", "Día 7", "Día 8", "Día 9", "Día 10", "Día 11"];
    const dataNew = [3044, 4704, 2148, 1434, 1107, 681, 284, 202];
    const dataRec = [502, 2396, 2423, 2271, 2067, 1452, 510, 342];

    const maxVal = 5000;
    const chartHeight = 180;
    const chartWidth = 500;
    const paddingLeft = 50;
    const paddingBottom = 40;
    const paddingTop = 20;

    // Grid values
    const gridLines = [0, 1000, 2000, 3000, 4000, 5000];

    const getCoordinates = (data: number[]) => {
        return data.map((val, i) => {
            const x = paddingLeft + i * (chartWidth / (data.length - 1));
            const y = (chartHeight - paddingBottom) - (val / maxVal) * (chartHeight - paddingTop - paddingBottom);
            return { x, y, val };
        });
    };

    const pointsNew = getCoordinates(dataNew);
    const pointsRec = getCoordinates(dataRec);

    // Compute bezier curved path
    const getCurvePath = (points: { x: number; y: number }[]) => {
        let path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const cpX1 = p0.x + (p1.x - p0.x) / 3;
            const cpY1 = p0.y;
            const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
            const cpY2 = p1.y;
            path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
        }
        return path;
    };

    const pathNew = getCurvePath(pointsNew);
    const pathRec = getCurvePath(pointsRec);

    const bottomY = chartHeight - paddingBottom;
    const fillNew = `${pathNew} L ${pointsNew[pointsNew.length - 1].x} ${bottomY} L ${pointsNew[0].x} ${bottomY} Z`;
    const fillRec = `${pathRec} L ${pointsRec[pointsRec.length - 1].x} ${bottomY} L ${pointsRec[0].x} ${bottomY} Z`;

    return (
        <div className="relative">
            <svg viewBox="0 0 570 200" className="w-full h-auto select-none overflow-visible">
                {/* Y-Axis Grid Lines */}
                {gridLines.map((val) => {
                    const y = (chartHeight - paddingBottom) - (val / maxVal) * (chartHeight - paddingTop - paddingBottom);
                    return (
                        <g key={val} className="opacity-40">
                            <line
                                x1={paddingLeft}
                                y1={y}
                                x2={paddingLeft + chartWidth}
                                y2={y}
                                stroke="var(--color-border)"
                                strokeWidth="1"
                            />
                            <text
                                x={paddingLeft - 10}
                                y={y + 4}
                                fill="var(--color-muted-foreground)"
                                className="font-sans text-[11px]"
                                textAnchor="end"
                            >
                                {val >= 1000 ? `${val / 1000}k` : val}
                            </text>
                        </g>
                    );
                })}

                {/* Filled Area Paths */}
                <path d={fillNew} fill="color-mix(in srgb, var(--color-primary) 7%, transparent)" />
                <path d={fillRec} fill="color-mix(in srgb, var(--color-primary) 12%, transparent)" />

                {/* Curved Line Paths */}
                <path d={pathNew} fill="none" stroke="color-mix(in srgb, var(--color-primary) 50%, transparent)" strokeWidth="2.5" />
                <path d={pathRec} fill="none" stroke="var(--color-primary)" strokeWidth="3" />

                {/* X-Axis labels */}
                {labels.map((lbl, idx) => {
                    const x = paddingLeft + idx * (chartWidth / (labels.length - 1));
                    return (
                        <g key={lbl}>
                            <text
                                x={x}
                                y={chartHeight - 12}
                                fill="var(--color-muted-foreground)"
                                className="font-sans text-[11px]"
                                textAnchor="middle"
                            >
                                {lbl}
                            </text>
                            <line
                                x1={x}
                                y1={chartHeight - paddingBottom}
                                x2={x}
                                y2={chartHeight - paddingBottom + 4}
                                stroke="var(--color-border)"
                                strokeWidth="1"
                            />
                        </g>
                    );
                })}

                {/* Interactive circles and hover targets */}
                {pointsNew.map((pt, idx) => (
                    <g key={`new-pt-${idx}`}>
                        <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={5}
                            fill="color-mix(in srgb, var(--color-primary) 50%, transparent)"
                            stroke="var(--color-card)"
                            strokeWidth="1.5"
                        />
                        {/* Hover trigger circle */}
                        <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={12}
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredPoint({ index: idx, type: "new" })}
                            onMouseLeave={() => setHoveredPoint(null)}
                        />
                    </g>
                ))}

                {pointsRec.map((pt, idx) => (
                    <g key={`rec-pt-${idx}`}>
                        <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={5}
                            fill="var(--color-primary)"
                            stroke="var(--color-card)"
                            strokeWidth="1.5"
                        />
                        {/* Hover trigger circle */}
                        <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={12}
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredPoint({ index: idx, type: "rec" })}
                            onMouseLeave={() => setHoveredPoint(null)}
                        />
                    </g>
                ))}
            </svg>

            {/* Custom Tooltip */}
            {hoveredPoint && (
                <div
                    style={{
                        left: `${((paddingLeft + hoveredPoint.index * (chartWidth / (labels.length - 1))) / 570) * 100
                            }%`,
                        bottom: `${(((chartHeight - paddingBottom) - (
                            (hoveredPoint.type === "new" ? dataNew : dataRec)[hoveredPoint.index] / maxVal
                        ) * (chartHeight - paddingTop - paddingBottom)) / 200) * 100 + 15
                            }%`,
                    }}
                    className="absolute z-10 -translate-x-1/2 rounded bg-card border border-border p-3 text-xs shadow-2xl pointer-events-none duration-150"
                >
                    <div className="font-bold text-foreground mb-0.5">{labels[hoveredPoint.index]}</div>
                    <div className="text-primary font-semibold mb-0.5">
                        {hoveredPoint.type === "new" ? "Usuarios Nuevos" : "Usuarios Recurrentes"}
                    </div>
                    <div className="text-muted-foreground">
                        {(hoveredPoint.type === "new" ? dataNew : dataRec)[hoveredPoint.index].toLocaleString("es-AR")} usuarios
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Client Component ───────────────────────────────────────────────────

export default function PrimerMesClient() {
    // Reading progress state
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const docH = document.documentElement.scrollHeight - window.innerHeight;
            if (docH > 0) {
                setProgress(Math.round((window.scrollY / docH) * 100));
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="bg-background text-foreground font-sans antialiased min-h-screen">
            {/* Reading progress bar */}
            <div
                style={{ width: `${progress}%` }}
                className="fixed top-0 left-0 h-[3px] bg-primary z-[9999] transition-all duration-100 ease-out"
                aria-hidden="true"
            />

            {/* Skip Link */}
            <a
                href="#main-content"
                className="absolute left-4 top-[-100px] focus:top-4 bg-primary text-[#08131E] px-4 py-2 rounded font-bold z-[10000] transition-all"
            >
                Saltar al contenido
            </a>

            {/* ══════════════════════════════════════════════════════
             NAV
            ══════════════════════════════════════════════════════ */}
            <nav className="sticky top-0 z-[100] bg-background/88 backdrop-blur-md border-b border-border px-6">
                <div className="max-w-[880px] mx-auto h-[58px] flex items-center justify-between">
                    <Link href="/" className="font-bold italic text-lg tracking-tight select-none">
                        <span className="text-foreground">BONDI</span>
                        <span className="text-primary">MDP</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/notas" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Notas
                        </Link>
                        <Link
                            href="/"
                            className="bg-success text-foreground px-4 py-1.5 rounded-md font-semibold text-xs transition-opacity hover:opacity-85"
                        >
                            Abrir app →
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ══════════════════════════════════════════════════════
             HERO
            ══════════════════════════════════════════════════════ */}
            <header className="hero py-16 px-6 bg-[linear-gradient(180deg,rgba(0,63,125,0.12)_0%,transparent_100%)] border-b border-border">
                <div className="max-w-[880px] mx-auto">
                    <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6" aria-label="Migas de pan">
                        <Link href="/" className="hover:text-primary transition-colors">
                            Inicio
                        </Link>
                        <span aria-hidden="true" className="opacity-40">
                            ›
                        </span>
                        <Link href="/notas" className="hover:text-primary transition-colors">
                            Notas
                        </Link>
                        <span aria-hidden="true" className="opacity-40">
                            ›
                        </span>
                        <span aria-current="page" className="text-primary">
                            Un mes en números
                        </span>
                    </nav>
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground mb-4">
                        <span className="bg-primary/12 text-primary border border-primary/25 px-2.5 py-0.5 rounded-full font-semibold tracking-wider text-[10px] uppercase">
                            Estadísticas
                        </span>
                        <span className="opacity-20" aria-hidden="true">
                            ·
                        </span>
                        <time dateTime="2026-05-28">28 de mayo, 2026</time>
                        <span className="opacity-20" aria-hidden="true">
                            ·
                        </span>
                        <span>5 min de lectura</span>
                    </div>
                    <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-foreground leading-[1.08] tracking-tight mb-5 max-w-2xl">
                        Bondi MDP: un mes en números —
                        <br />
                        <span className="text-primary">cómo creció la app de colectivos</span>
                    </h1>
                    <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                        <strong className="font-semibold">
                            Bondi MDP es una aplicación web progresiva (PWA) gratuita que permite a los vecinos de Mar
                            del Plata, Argentina, consultar en tiempo real cuándo llega el próximo colectivo.
                        </strong>{" "}
                        Fue lanzada el 29 de abril de 2026. Treinta días después, los datos hablan por sí solos:
                        adopción, fidelidad, alcance geográfico y desempeño técnico, sin filtro.
                    </p>
                </div>
            </header>

            {/* ══════════════════════════════════════════════════════
             STAT RIBBON
            ══════════════════════════════════════════════════════ */}
            <div className="bg-card border-b border-border py-8 px-6" aria-label="Resumen de métricas clave">
                <div className="max-w-[880px] mx-auto grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-0">

                    <div className="text-center md:text-left md:border-r md:border-border md:pr-4">
                        <span className="block font-num text-3xl sm:text-4xl font-bold text-foreground leading-none mb-1">
                            19.267
                        </span>
                        <span className="block text-xs text-muted-foreground leading-tight">Usuarios activos únicos</span>
                    </div>


                    <div className="text-center md:border-r md:border-border md:px-4">
                        <span className="block font-num text-3xl sm:text-4xl font-bold text-foreground leading-none mb-1">
                            87.784
                        </span>
                        <span className="block text-xs text-muted-foreground leading-tight">Sesiones en 30 días</span>
                    </div>


                    <div className="text-center md:border-r md:border-border md:px-4">
                        <span className="block font-num text-3xl sm:text-4xl font-bold text-foreground leading-none mb-1">
                            300k
                        </span>
                        <span className="block text-xs text-muted-foreground leading-tight">Vistas totales</span>
                    </div>


                    <div className="text-center md:border-r md:border-border md:px-4">
                        <span className="block font-num text-3xl sm:text-4xl font-bold text-primary leading-none mb-1">
                            2:1
                        </span>
                        <span className="block text-xs text-muted-foreground leading-tight">Ratio de fidelidad</span>
                    </div>


                    <div className="text-center md:pl-4">
                        <span className="block font-num text-3xl sm:text-4xl font-bold text-primary leading-none mb-1">
                            425
                        </span>
                        <span className="block text-xs text-muted-foreground leading-tight">
                            Ubicaciones compartidas voluntariamente
                        </span>
                    </div>

                </div>
            </div>

            {/* ══════════════════════════════════════════════════════
             PRESS COVERAGE
            ══════════════════════════════════════════════════════ */}
            <section className="bg-muted border-b border-border py-8 px-6" aria-label="Cobertura periodística">
                <div className="max-w-[880px] mx-auto">
                    <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase text-center mb-5">
                        Hablan de Bondi MDP
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div className="bg-card border border-border rounded-xl p-5 md:p-6">
                            <div className="inline-block text-[11px] font-bold tracking-wider text-primary bg-primary/12 border border-primary/25 rounded px-2 py-0.5 mb-3">
                                Diario La Capital · 30 abr 2026
                            </div>
                            <p className="text-sm font-medium text-foreground mb-3 italic">&ldquo;Lanzaron &apos;Bondi MDP&apos;, la alternativa a la aplicación &apos;Cuándo Llega&apos; para usuarios de colectivos&rdquo;</p>
                            <p className="text-xs text-muted-foreground mb-4"><strong className="text-foreground font-semibold">3.955</strong> visitantes únicos generados &nbsp;·&nbsp; <strong className="text-foreground font-semibold">6.355</strong> sesiones totales</p>
                            <a
                                href="https://www.lacapitalmdp.com/lanzaron-bondi-mdp-la-alternativa-a-la-aplicacion-cuando-llega-para-usuarios-de-colectivos/"
                                rel="noopener noreferrer"
                                target="_blank"
                                className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
                                aria-label="Leer nota completa en Diario La Capital"
                            >
                                Leer nota completa →
                            </a>
                        </div>



                        <div className="bg-card border border-border rounded-xl p-5 md:p-6">
                            <div className="inline-block text-[11px] font-bold tracking-wider text-primary bg-primary/12 border border-primary/25 rounded px-2 py-0.5 mb-3">
                                Noticias de Bariloche · 30 abr 2026
                            </div>
                            <p className="text-sm font-medium text-foreground mb-3 italic">&ldquo;Lanzaron &apos;Bondi MDP&apos;, la alternativa a la aplicación &apos;Cuándo Llega&apos; para usuarios de colectivos · Diario La Capital de Mar del Plata&rdquo;</p>
                            <p className="text-xs text-muted-foreground mb-4">Replicado en medios digitales de alcance nacional</p>
                            <a
                                href="https://www.noticiasdebariloche.com.ar"
                                rel="noopener noreferrer"
                                target="_blank"
                                className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
                                aria-label="Leer nota en Noticias de Bariloche"
                            >
                                Leer nota completa →
                            </a>
                        </div>

                    </div>
                    <p className="text-xs text-muted-foreground italic text-center mt-5 max-w-2xl mx-auto">
                        La cobertura editorial generó la primera ola de usuarios. El ratio de retención 2:1 confirma que
                        la app los retuvo más allá de la curiosidad periodística.
                    </p>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════
             MAIN CONTENT
            ══════════════════════════════════════════════════════ */}
            <main id="main-content">
                {/* ─── 00 ORIGEN ─── */}
                <section id="origen" className="py-16 px-6 bg-muted border-b border-border" aria-labelledby="origen-h2">
                    <div className="max-w-[880px] mx-auto">

                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/12 border border-primary/25 px-2.5 py-0.5 rounded-full">
                                Contexto
                            </span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">
                                Por qué existe Bondi MDP
                            </span>
                        </div>



                        <h2 id="origen-h2" className="font-display font-bold text-2xl sm:text-3xl text-foreground mb-6 leading-tight">
                            Mar del Plata tenía un problema.
                            <br />
                            <span className="text-primary">La comunidad lo resolvió.</span>
                        </h2>


                        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mt-6">
                            <div className="md:col-span-3 text-sm sm:text-base text-muted-foreground space-y-4 leading-relaxed">

                                <p>
                                    Durante años, los usuarios del transporte público de Mar del Plata dependieron
                                    de <strong className="text-foreground font-semibold">&ldquo;Cuándo Llega&rdquo;</strong>,
                                    la aplicación de referencia para consultar tiempos de arribo de colectivos.
                                    Cuando esa app fue discontinuada y removida del ecosistema de distribución de
                                    Google, la ciudad quedó sin herramientas digitales confiables para planificar
                                    viajes en transporte público.
                                </p>


                                <p>
                                    La respuesta llegó desde la propia comunidad tech local.{" "}
                                    <strong className="text-foreground font-semibold">
                                        Bondi MDP nació como un proyecto de código abierto
                                    </strong>
                                    : sin modelo de negocio, sin publicidad, sin rastreadores de terceros. Una PWA
                                    accesible desde cualquier navegador, sin necesidad de instalación, construida por
                                    desarrolladores de Mar del Plata para marplatenses.
                                </p>


                                <p>
                                    El proyecto es{" "}
                                    <strong className="text-foreground font-semibold">open source</strong>. El código
                                    fuente está disponible públicamente en{" "}
                                    <a
                                        href="https://github.com"
                                        rel="noopener noreferrer"
                                        target="_blank"
                                        className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
                                    >
                                        GitHub
                                    </a>
                                    , auditable y contribuible por cualquier desarrollador. Una apuesta por la
                                    transparencia técnica en infraestructura pública digital.
                                </p>

                            </div>

                            <div className="md:col-span-2 space-y-3">

                                <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
                                    <span className="mt-1 flex-shrink-0">
                                        <svg
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="var(--color-primary)"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                    </span>
                                    <div>
                                        <p className="text-xs font-semibold text-foreground mb-0.5">El vacío</p>
                                        <p className="text-xs text-muted-foreground leading-normal">
                                            &ldquo;Cuándo Llega&rdquo; fue discontinuada. Mar del Plata quedó sin app
                                            de colectivos en tiempo real.
                                        </p>
                                    </div>
                                </div>



                                <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
                                    <span className="mt-1 flex-shrink-0">
                                        <svg
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="var(--color-primary)"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                    </span>
                                    <div>
                                        <p className="text-xs font-semibold text-foreground mb-0.5">La respuesta</p>
                                        <p className="text-xs text-muted-foreground leading-normal">
                                            Desarrolladores locales construyeron una alternativa. Código abierto, sin
                                            publicidad, sin registro.
                                        </p>
                                    </div>
                                </div>



                                <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
                                    <span className="mt-1 flex-shrink-0">
                                        <svg
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="var(--color-primary)"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="16 18 22 12 16 6" />
                                            <polyline points="8 6 2 12 8 18" />
                                        </svg>
                                    </span>
                                    <div>
                                        <p className="text-xs font-semibold text-foreground mb-0.5">PWA: sin fricciones</p>
                                        <p className="text-xs text-muted-foreground leading-normal">
                                            Disponible en bondimdp.com.ar desde cualquier navegador. Sin instalación.
                                            Gratis.
                                        </p>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── 01 ADOPCIÓN ─── */}
                <section id="adopcion" className="py-16 px-6 border-b border-border" aria-labelledby="adopcion-h2">
                    <div className="max-w-[880px] mx-auto">

                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/12 border border-primary/25 px-2.5 py-0.5 rounded-full">
                                01
                            </span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">Adopción</span>
                        </div>



                        <h2 id="adopcion-h2" className="font-display font-bold text-2xl sm:text-3xl text-foreground mb-6 leading-tight">
                            19.267 marplatenses eligieron
                            <br />
                            Bondi MDP en su <span className="text-primary">primer mes</span>
                        </h2>


                        <div className="text-sm sm:text-base text-muted-foreground space-y-4 leading-relaxed max-w-[660px] mb-8">

                            <p>
                                En su primer mes de operación (29 de abril al 27 de mayo de 2026), Bondi MDP registró
                                <strong className="text-foreground font-semibold"> 19.267 usuarios activos únicos</strong>{" "}
                                en la ciudad de Mar del Plata. No es un número de descargas: es la cantidad de personas
                                que abrieron la app al menos una vez para saber cuándo llegaba su colectivo.
                            </p>


                            <p>
                                El crecimiento se dio sin campañas pagas, sin influencers ni presupuesto de marketing.
                                El canal principal fue la búsqueda orgánica en Google y el tráfico directo — señal de
                                que la gente buscaba exactamente esta solución o la recomendó de boca en boca.{" "}
                                <strong className="text-foreground font-semibold">
                                    Según datos de Google Analytics 4 y Microsoft Clarity
                                </strong>
                                , el 91% del tráfico provino del Partido de General Pueyrredón.
                            </p>

                        </div>

                        {/* Chart 1 */}

                        <div className="bg-card border border-border rounded-xl p-5 md:p-6 mb-5">
                            <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
                                <span className="text-[13px] font-semibold text-foreground">
                                    Sesiones: usuarios nuevos vs. recurrentes
                                </span>
                                <span className="text-xs text-muted-foreground">29 abr – 27 may 2026</span>
                            </div>
                            <div className="relative min-h-[220px]">
                                <AdoptionChart />
                            </div>
                            <div className="flex gap-6 mt-4 text-[12px] text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-primary/40 inline-block"></span>
                                    Usuarios nuevos — 29.394
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block"></span>
                                    Usuarios recurrentes — 58.303
                                </span>
                            </div>
                        </div>


                        {/* Chart 2 */}

                        <div className="bg-card border border-border rounded-xl p-5 md:p-6 mb-8">
                            <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
                                <span className="text-[13px] font-semibold text-foreground">
                                    Nuevos vs. recurrentes por día desde el lanzamiento
                                </span>
                                <span className="text-xs text-muted-foreground">Días 4–11 · Primer mes</span>
                            </div>
                            <div className="relative min-h-[180px]">
                                <CohortChart />
                            </div>
                            <div className="flex gap-6 mt-4 text-[12px] text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-primary/40 inline-block"></span>
                                    Usuarios nuevos
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block"></span>
                                    Usuarios recurrentes
                                </span>
                            </div>
                            <div className="mt-4 p-3.5 bg-primary/12 border-l-[3px] border-[#F7C325] rounded-r-md text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                                <strong className="text-primary font-semibold">
                                    ↑ El pico de nuevos usuarios (día 5) coincide con la cobertura mediática.
                                </strong>{" "}
                                Lo relevante es lo que pasó después: los recurrentes superaron a los nuevos a partir del
                                día 6 y se mantuvieron altos durante semanas, demostrando que la adopción no fue un
                                evento puntual sino una incorporación a la rutina.
                            </div>
                        </div>


                        {/* Traffic sources breakdown */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">

                            <div className="bg-card border border-border rounded-xl p-4.5">
                                <span className="font-num text-3xl font-bold text-foreground block leading-none mb-1">
                                    56%
                                </span>
                                <span className="text-xs font-semibold text-foreground block mb-1">Tráfico directo</span>
                                <span className="text-[11px] text-muted-foreground leading-normal block">
                                    10.667 usuarios · Acceso directo o bookmark
                                </span>
                            </div>


                            <div className="bg-card border border-border rounded-xl p-4.5">
                                <span className="font-num text-3xl font-bold text-foreground block leading-none mb-1">
                                    32%
                                </span>
                                <span className="text-xs font-semibold text-foreground block mb-1">Google orgánico</span>
                                <span className="text-[11px] text-muted-foreground leading-normal block">
                                    6.117 usuarios · Búsquedas sin inversión publicitaria
                                </span>
                            </div>


                            <div className="bg-primary/12 border border-primary/25 rounded-xl p-4.5">
                                <span className="font-num text-3xl font-bold text-primary block leading-none mb-1">
                                    10%
                                </span>
                                <span className="text-xs font-semibold text-primary block mb-1">
                                    Medios de comunicación
                                </span>
                                <span className="text-[11px] text-muted-foreground leading-normal block">
                                    ~1.909 usuarios · Earned media, sin pauta
                                </span>
                            </div>


                            <div className="bg-[#1A9EDE]/10 border border-[#1A9EDE]/25 rounded-xl p-4.5">
                                <span className="font-num text-3xl font-bold text-[#1A9EDE] block leading-none mb-1">
                                    +116
                                </span>
                                <span className="text-xs font-semibold text-foreground block mb-1">Desde ChatGPT</span>
                                <span className="text-[11px] text-muted-foreground leading-normal block">
                                    Usuarios llegados desde la IA en el primer mes
                                </span>
                            </div>

                        </div>
                    </div>
                </section>

                {/* ─── 02 FIDELIDAD ─── */}
                <section id="fidelidad" className="py-16 px-6 bg-muted border-b border-border" aria-labelledby="fidelidad-h2">
                    <div className="max-w-[880px] mx-auto">

                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/12 border border-primary/25 px-2.5 py-0.5 rounded-full">
                                02
                            </span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">Fidelidad</span>
                        </div>



                        <h2 id="fidelidad-h2" className="font-display font-bold text-2xl sm:text-3xl text-foreground mb-6 leading-tight">
                            Por cada persona que entra por primera vez,
                            <br />
                            <span className="text-primary">dos vuelven.</span>
                        </h2>


                        <div className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-[660px] mb-6">

                            <p>
                                El ratio de fidelidad es la métrica que más le importa a cualquier producto digital. No
                                dice cuánta gente descubrió la app; dice cuánta la volvió a usar. Y el resultado es
                                inequívoco:{" "}
                                <strong className="text-foreground font-semibold">
                                    2 de cada 3 sesiones corresponden a alguien que ya estaba
                                </strong>
                                .
                            </p>

                        </div>

                        {/* Ratio Bar Visual */}

                        <div className="mt-8 max-w-xl">
                            <div
                                className="flex h-[72px] rounded-lg overflow-hidden border border-white/12 shadow-inner"
                                role="img"
                                aria-label="Barra proporcional: 1 parte nuevos, 2 partes recurrentes"
                            >
                                <div className="bg-white/5 flex flex-col items-center justify-center p-2 text-center flex-[1]">
                                    <span className="font-num font-bold text-base sm:text-lg text-muted-foreground">
                                        29.394
                                    </span>
                                    <span className="text-[10px] font-semibold tracking-wider text-[#3D5568] uppercase">
                                        Nuevos
                                    </span>
                                </div>
                                <div className="bg-primary flex flex-col items-center justify-center p-2 text-center flex-[2]">
                                    <span className="font-num font-bold text-base sm:text-lg text-[#0B1926]">
                                        58.303
                                    </span>
                                    <span className="text-[10px] font-semibold tracking-wider text-[#0B1926]/70 uppercase">
                                        Recurrentes
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-3 mt-5">
                                <span className="font-num text-5xl sm:text-6xl font-extrabold text-primary leading-none">
                                    2:1
                                </span>
                                <span className="text-sm sm:text-base text-muted-foreground leading-tight">
                                    sesiones recurrentes
                                    <br />
                                    por cada sesión nueva
                                </span>
                            </div>
                        </div>


                        <div className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-[660px] mt-6">

                            <p>
                                Para un producto de un mes de vida, este número no es bueno. Es excepcional. Indica que{" "}
                                <strong className="text-foreground font-semibold">
                                    la app resuelve un problema real y repetitivo
                                </strong>
                                : el de saber cuándo llega el colectivo, todos los días, a la misma parada.
                            </p>

                        </div>
                    </div>
                </section>

                {/* ─── 03 COMUNIDAD ─── */}
                <section id="comunidad" className="py-16 px-6 bg-card border-b border-border" aria-labelledby="comunidad-h2">
                    <div className="max-w-[880px] mx-auto">

                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/12 border border-primary/25 px-2.5 py-0.5 rounded-full">
                                03
                            </span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">
                                El dato que nadie esperaba
                            </span>
                        </div>



                        <h2 id="comunidad-h2" className="font-display font-bold text-2xl sm:text-3xl text-foreground mb-6 leading-tight">
                            425 vecinos compartieron
                            <br />
                            su ubicación.{" "}
                            <span className="text-primary">
                                Sin que nadie
                                <br />
                                les pidiera.
                            </span>
                        </h2>


                        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start mt-6">
                            <div className="md:col-span-3 text-sm sm:text-base text-muted-foreground space-y-4 leading-relaxed">

                                <p>
                                    Bondi MDP tiene una función para que los pasajeros compartan la ubicación de su
                                    colectivo en tiempo real. Cuando alguien activa esa función, su posición se usa
                                    para que otros usuarios vean dónde está realmente el micro, no solo dónde debería
                                    estar según el sistema.
                                </p>


                                <p>
                                    Es completamente voluntario. No hay recompensas. No hay notificaciones que te lo
                                    recuerden. No hay puntos, badges ni gamification de ningún tipo. Es solo un botón
                                    que dice &ldquo;compartir ubicación del bondi&rdquo;.
                                </p>


                                <p>
                                    <strong className="text-foreground font-semibold">425 personas lo presionaron</strong>.
                                    Por su propia voluntad. Porque quisieron contribuir al dato para que a otro le
                                    llegue el colectivo a tiempo.
                                </p>


                                <p>
                                    Para una app de un mes de vida, sin marketing, eso habla de algo que los números
                                    grandes no siempre capturan:{" "}
                                    <strong className="text-foreground font-semibold">
                                        sentido de comunidad y voluntad de construir algo colectivo
                                    </strong>
                                    . No es mucho todavía, pero es un arranque muy honesto.
                                </p>

                            </div>

                            <div className="md:col-span-2 bg-background border border-primary/25 rounded-2xl p-6 text-center md:sticky md:top-20">

                                <span className="font-num text-6xl sm:text-7xl font-extrabold text-primary block leading-none mb-2">
                                    425
                                </span>
                                <p className="text-[13px] text-muted-foreground leading-normal mb-5">
                                    vecinos compartieron la
                                    <br />
                                    ubicación de su colectivo
                                </p>
                                <div className="flex flex-col gap-2 text-left text-xs">
                                    <div className="flex items-center gap-2.5 bg-success/12 border border-[#19BC6F]/20 rounded-md py-2 px-3 text-[#19BC6F] font-semibold">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true" className="flex-shrink-0">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Sin incentivos económicos
                                    </div>
                                    <div className="flex items-center gap-2.5 bg-success/12 border border-[#19BC6F]/20 rounded-md py-2 px-3 text-[#19BC6F] font-semibold">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true" className="flex-shrink-0">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Por elección propia
                                    </div>
                                    <div className="flex items-center gap-2.5 bg-success/12 border border-[#19BC6F]/20 rounded-md py-2 px-3 text-[#19BC6F] font-semibold">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true" className="flex-shrink-0">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Para mejorar el dato de otros
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── 04 COBERTURA ─── */}
                <section id="cobertura" className="py-16 px-6 border-b border-border animate-fade-in" aria-labelledby="cobertura-h2">
                    <div className="max-w-[880px] mx-auto">

                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/12 border border-primary/25 px-2.5 py-0.5 rounded-full">
                                04
                            </span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">
                                Cobertura geográfica
                            </span>
                        </div>



                        <h2 id="cobertura-h2" className="font-display font-bold text-2xl sm:text-3xl text-foreground mb-6 leading-tight">
                            Mar del Plata,
                            <br />
                            <span className="text-primary">de Camet a La Perla.</span>
                        </h2>


                        <div className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-[660px]">

                            <p>
                                La adopción no está concentrada en un solo barrio ni en el microcentro. El mapa de calor
                                muestra actividad en los principales corredores de tránsito: Av. Colón, Juan B. Justo,
                                Luro, Independencia, y los accesos norte y sur de la ciudad.
                            </p>

                        </div>

                        {/* Heatmap container */}

                        <div className="w-full h-[300px] sm:h-[380px] md:h-[480px] bg-card border border-border rounded-xl my-8 overflow-hidden relative shadow-2xl">
                            <img
                                src="/mapa/mapa-calor.png"
                                alt="Mapa de calor de adopción en Mar del Plata"
                                className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-300"
                                loading="lazy"
                            />
                        </div>

                    </div>

                    <div className="max-w-[880px] mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">

                            <div className="text-center md:text-left">
                                <div className="font-num text-6xl md:text-7xl font-extrabold text-primary leading-none mb-1">
                                    91%
                                </div>
                                <p className="text-[13px] text-muted-foreground leading-normal">
                                    del tráfico originado en el
                                    <br />
                                    <strong className="text-foreground font-semibold">Partido de General Pueyrredón</strong>
                                </p>
                            </div>


                            <div className="md:col-span-2 divide-y divide-white/5 text-sm">

                                <div className="flex justify-between items-center py-2.5 text-muted-foreground">
                                    <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-primary" />
                                        <strong className="text-foreground font-semibold">Mar del Plata</strong>
                                    </span>
                                    <span className="font-num font-semibold text-foreground">~17.500</span>
                                </div>


                                <div className="flex justify-between items-center py-2.5 text-muted-foreground">
                                    <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-[#4A7BA8]" />
                                        Buenos Aires
                                    </span>
                                    <span className="font-num font-semibold text-foreground">~1.100</span>
                                </div>


                                <div className="flex justify-between items-center py-2.5 text-muted-foreground">
                                    <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-[#2B4F6A]" />
                                        Otras ciudades AR
                                    </span>
                                    <span className="font-num font-semibold text-foreground">~500</span>
                                </div>


                                <div className="flex justify-between items-center py-2.5 text-muted-foreground">
                                    <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-[#3D5568]" />
                                        Internacional
                                    </span>
                                    <span className="font-num font-semibold text-foreground">~167</span>
                                </div>

                            </div>
                        </div>
                        <p className="text-[10.5px] text-[#3D5568] italic mt-4 text-center md:text-left">
                            * Estimación basada en análisis de fuentes de tráfico · Google Analytics 4
                        </p>

                        {/* Engagement stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">

                            <div className="bg-card border border-border rounded-xl p-4.5 flex gap-3.5 items-start">
                                <span className="text-primary mt-1 flex-shrink-0">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                </span>
                                <div>
                                    <span className="font-num text-xl font-bold text-primary block leading-none mb-1">
                                        8.806
                                    </span>
                                    <span className="text-xs font-semibold text-foreground block mb-1">
                                        usuarios usaron /consultar
                                    </span>
                                    <span className="text-[11px] text-muted-foreground leading-normal block">
                                        27.306 vistas · La función core: consultar cuándo llega el colectivo
                                    </span>
                                </div>
                            </div>



                            <div className="bg-card border border-border rounded-xl p-4.5 flex gap-3.5 items-start">
                                <span className="text-primary mt-1 flex-shrink-0">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                    </svg>
                                </span>
                                <div>
                                    <span className="font-num text-xl font-bold text-primary block leading-none mb-1">
                                        8.469
                                    </span>
                                    <span className="text-xs font-semibold text-foreground block mb-1">
                                        usuarios exploraron recorridos
                                    </span>
                                    <span className="text-[11px] text-muted-foreground leading-normal block">
                                        29.146 vistas · Los mapas de líneas, la función con más vistas por sesión
                                    </span>
                                </div>
                            </div>



                            <div className="bg-card border border-border rounded-xl p-4.5 flex gap-3.5 items-start">
                                <span className="text-primary mt-1 flex-shrink-0">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                        <polyline points="9 22 9 12 15 12 15 22" />
                                    </svg>
                                </span>
                                <div>
                                    <span className="font-num text-xl font-bold text-primary block leading-none mb-1">
                                        8.519
                                    </span>
                                    <span className="text-xs font-semibold text-foreground block mb-1">
                                        visitaron /acerca del proyecto
                                    </span>
                                    <span className="text-[11px] text-muted-foreground leading-normal block">
                                        25.154 vistas · La sección &ldquo;sobre nosotros&rdquo; con más tráfico que cualquier
                                        feature secundaria
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* ─── 05 TÉCNICO ─── */}
                <section id="tecnico" className="py-16 px-6 bg-muted border-b border-border" aria-labelledby="tecnico-h2">
                    <div className="max-w-[880px] mx-auto">

                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/12 border border-primary/25 px-2.5 py-0.5 rounded-full">
                                05
                            </span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">
                                Desempeño técnico
                            </span>
                        </div>



                        <h2 id="tecnico-h2" className="font-display font-bold text-2xl sm:text-3xl text-foreground mb-6 leading-tight">
                            Rápido cuando
                            <br />
                            <span className="text-primary">más importa.</span>
                        </h2>


                        <div className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-[660px] mb-8">

                            <p>
                                Cuando alguien está esperando el 111 con frío en Güemes y Mitre, no hay tiempo para una
                                app lenta. Las métricas de Core Web Vitals certifican que la plataforma responde con
                                excelencia bajo carga real.
                            </p>

                        </div>

                        {/* Core Web Vitals Scorecards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                            <div className="bg-card border-t-4 border-[#1A9EDE] border-x border-b border-border rounded-xl p-6 text-center flex flex-col items-center">
                                <div className="w-11 h-11 rounded-lg bg-[#1A9EDE]/12 text-[#1A9EDE] flex items-center justify-center mb-4">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                </div>
                                <span className="font-num text-4xl sm:text-5xl font-extrabold text-foreground block leading-none mb-1">
                                    1.94<span className="text-2xl font-bold">s</span>
                                </span>
                                <span className="text-xs font-semibold text-foreground mb-1">LCP</span>
                                <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
                                    Velocidad de respuesta real para el usuario
                                </p>
                                <span className="text-[9.5px] font-semibold uppercase tracking-wider text-[#19BC6F] bg-success/12 border border-[#19BC6F]/20 px-3 py-1 rounded-full">
                                    ✓ Excelente · umbral &lt; 2.5s
                                </span>
                            </div>



                            <div className="bg-primary/5 border-t-4 border-[#F7C325] border-x border-b border-border rounded-xl p-6 text-center flex flex-col items-center">
                                <div className="w-11 h-11 rounded-lg bg-primary/12 text-primary flex items-center justify-center mb-4">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </div>
                                <span className="font-num text-4xl sm:text-5xl font-extrabold text-primary block leading-none mb-1">
                                    300<span className="text-2xl font-bold">k</span>
                                </span>
                                <span className="text-xs font-semibold text-foreground mb-1">Vistas / mes</span>
                                <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
                                    Escala soportada sin interrupciones en 30 días
                                </p>
                                <span className="text-[9.5px] font-semibold uppercase tracking-wider text-primary bg-primary/12 border border-[#F7C325]/20 px-3 py-1 rounded-full">
                                    ≈ 10.000 por día
                                </span>
                            </div>



                            <div className="bg-card border-t-4 border-[#19BC6F] border-x border-b border-border rounded-xl p-6 text-center flex flex-col items-center">
                                <div className="w-11 h-11 rounded-lg bg-success/12 text-[#19BC6F] flex items-center justify-center mb-4">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <rect x="3" y="3" width="7" height="7" rx="1" />
                                        <rect x="14" y="3" width="7" height="7" rx="1" />
                                        <rect x="14" y="14" width="7" height="7" rx="1" />
                                        <rect x="3" y="14" width="7" height="7" rx="1" />
                                    </svg>
                                </div>
                                <span className="font-num text-4xl sm:text-5xl font-extrabold text-foreground block leading-none mb-1">
                                    0.001
                                </span>
                                <span className="text-xs font-semibold text-foreground mb-1">CLS</span>
                                <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
                                    Estabilidad visual de la interfaz en uso real
                                </p>
                                <span className="text-[9.5px] font-semibold uppercase tracking-wider text-[#19BC6F] bg-success/12 border border-[#19BC6F]/20 px-3 py-1 rounded-full">
                                    ✓ Excelente · umbral &lt; 0.1
                                </span>
                            </div>

                        </div>


                        <div className="flex gap-3 bg-success/10 border border-[#19BC6F]/15 rounded-xl p-4.5 mt-6 items-start text-sm">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#19BC6F" strokeWidth="2" aria-hidden="true" className="flex-shrink-0 mt-0.5">
                                <circle cx="12" cy="8" r="6" />
                                <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                            </svg>
                            <p className="text-muted-foreground leading-relaxed">
                                <strong className="text-foreground font-semibold">Core Web Vitals certificados por Google.</strong>{" "}
                                LCP y CLS superan los umbrales de excelencia que Google usa para evaluar la experiencia
                                de usuario. Cero interrupciones de servicio durante el primer mes completo de
                                operación.
                            </p>
                        </div>

                    </div>
                </section>

                {/* ─── FAQ ─── */}
                <section id="preguntas-frecuentes" className="py-16 px-6 border-b border-border" aria-labelledby="faq-h2">
                    <div className="max-w-[880px] mx-auto">

                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/12 border border-primary/25 px-2.5 py-0.5 rounded-full">
                                FAQ
                            </span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">
                                Preguntas frecuentes
                            </span>
                        </div>



                        <h2 id="faq-h2" className="font-display font-bold text-2xl sm:text-3xl text-foreground mb-6 leading-tight">
                            Lo que la gente pregunta sobre
                            <br />
                            <span className="text-primary">Bondi MDP</span>
                        </h2>


                        <div className="divide-y divide-white/10 border-y border-border mt-6" itemScope itemType="https://schema.org/FAQPage">

                            <details className="group py-4.5 cursor-pointer" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                                <summary className="flex justify-between items-center text-sm sm:text-base font-semibold text-foreground list-none outline-none group-open:text-primary transition-colors" itemProp="name">
                                    ¿Qué es Bondi MDP?
                                    <span className="text-lg text-primary font-light transition-transform duration-200 group-open:rotate-45 flex-shrink-0 ml-4">
                                        +
                                    </span>
                                </summary>
                                <div className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[720px]" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                                    <p itemProp="text">
                                        Bondi MDP es una aplicación web progresiva (PWA) gratuita para Mar del Plata,
                                        Argentina, que permite consultar en tiempo real cuándo llega el próximo
                                        colectivo a cualquier parada de la ciudad. No requiere descarga ni registro, y
                                        está disponible en bondimdp.com.ar desde cualquier navegador.
                                    </p>
                                </div>
                            </details>



                            <details className="group py-4.5 cursor-pointer" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                                <summary className="flex justify-between items-center text-sm sm:text-base font-semibold text-foreground list-none outline-none group-open:text-primary transition-colors" itemProp="name">
                                    ¿Cuántos usuarios tiene Bondi MDP?
                                    <span className="text-lg text-primary font-light transition-transform duration-200 group-open:rotate-45 flex-shrink-0 ml-4">
                                        +
                                    </span>
                                </summary>
                                <div className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[720px]" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                                    <p itemProp="text">
                                        En su primer mes de operación (29 de abril al 27 de mayo de 2026), Bondi MDP
                                        registró 19.267 usuarios activos únicos, 87.784 sesiones totales y aproximadamente
                                        300.000 vistas de página. El 91% del tráfico proviene del Partido de General
                                        Pueyrredón (Mar del Plata y alrededores).
                                    </p>
                                </div>
                            </details>



                            <details className="group py-4.5 cursor-pointer" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                                <summary className="flex justify-between items-center text-sm sm:text-base font-semibold text-foreground list-none outline-none group-open:text-primary transition-colors" itemProp="name">
                                    ¿Es gratuita Bondi MDP?
                                    <span className="text-lg text-primary font-light transition-transform duration-200 group-open:rotate-45 flex-shrink-0 ml-4">
                                        +
                                    </span>
                                </summary>
                                <div className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[720px]" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                                    <p itemProp="text">
                                        Sí. Bondi MDP es completamente gratuita, sin publicidad, sin registro y sin
                                        suscripción de ningún tipo. El servicio se accede directamente desde el navegador en
                                        bondimdp.com.ar.
                                    </p>
                                </div>
                            </details>



                            <details className="group py-4.5 cursor-pointer" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                                <summary className="flex justify-between items-center text-sm sm:text-base font-semibold text-foreground list-none outline-none group-open:text-primary transition-colors" itemProp="name">
                                    ¿Cómo funciona el tiempo real en Bondi MDP?
                                    <span className="text-lg text-primary font-light transition-transform duration-200 group-open:rotate-45 flex-shrink-0 ml-4">
                                        +
                                    </span>
                                </summary>
                                <div className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[720px]" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                                    <p itemProp="text">
                                        Bondi MDP combina datos oficiales del sistema de transporte con información
                                        aportada voluntariamente por los pasajeros. En su primer mes, 425 usuarios
                                        compartieron la ubicación GPS de su colectivo de forma voluntaria y sin incentivos,
                                        contribuyendo a mejorar la precisión de los tiempos de arribo para toda la comunidad.
                                    </p>
                                </div>
                            </details>



                            <details className="group py-4.5 cursor-pointer" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                                <summary className="flex justify-between items-center text-sm sm:text-base font-semibold text-foreground list-none outline-none group-open:text-primary transition-colors" itemProp="name">
                                    ¿Qué métricas de rendimiento tiene la app?
                                    <span className="text-lg text-primary font-light transition-transform duration-200 group-open:rotate-45 flex-shrink-0 ml-4">
                                        +
                                    </span>
                                </summary>
                                <div className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[720px]" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                                    <p itemProp="text">
                                        Bondi MDP tiene un LCP de 1.94 segundos y un CLS de 0.001, ambos calificados como
                                        &ldquo;Excelente&rdquo; por los Core Web Vitals de Google (umbrales: LCP &lt; 2.5s,
                                        CLS &lt; 0.1). La app operó sin interrupciones durante su primer mes completo de
                                        producción, soportando un promedio de 10.000 vistas por día.
                                    </p>
                                </div>
                            </details>



                            <details className="group py-4.5 cursor-pointer" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                                <summary className="flex justify-between items-center text-sm sm:text-base font-semibold text-foreground list-none outline-none group-open:text-primary transition-colors" itemProp="name">
                                    ¿Cuándo se lanzó Bondi MDP?
                                    <span className="text-lg text-primary font-light transition-transform duration-200 group-open:rotate-45 flex-shrink-0 ml-4">
                                        +
                                    </span>
                                </summary>
                                <div className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[720px]" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                                    <p itemProp="text">
                                        Bondi MDP fue lanzado el 29 de abril de 2026 para el público general de Mar del
                                        Plata. Su lanzamiento fue cubierto por el Diario La Capital, el medio gráfico de
                                        mayor circulación de la ciudad.
                                    </p>
                                </div>
                            </details>

                        </div>
                    </div>
                </section>

                {/* ─── CLOSING ─── */}
                <section className="py-16 px-6 bg-[linear-gradient(180deg,transparent_0%,rgba(0,63,125,0.1)_100%)] border-b border-border text-center" aria-labelledby="closing-h2">
                    <div className="max-w-[580px] mx-auto">

                        <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">
                            Lo que viene
                        </span>
                        <h2 id="closing-h2" className="font-display font-bold text-2xl sm:text-3xl text-foreground mb-4 leading-tight">
                            Un mes fue solo el arranque.
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-8">
                            Bondi MDP va a seguir creciendo mientras más marplatenses puedan consultar sus colectivos en
                            tiempo real. Próximos pasos: mejorar la precisión del mapa, sumar alertas personalizadas
                            de parada, y seguir construyendo junto a la comunidad que lo hace posible.
                        </p>
                        <Link
                            href="/"
                            className="bg-success text-foreground px-8 py-3.5 rounded-lg font-bold text-[15px] transition-all hover:opacity-88 hover:-translate-y-0.5 active:translate-y-0 shadow-lg inline-flex items-center gap-2"
                        >
                            Consultar colectivos →
                        </Link>

                    </div>
                </section>
            </main>

            {/* ══════════════════════════════════════════════════════
             FOOTER
            ══════════════════════════════════════════════════════ */}
            <footer className="bg-muted py-10 px-6">
                <div className="max-w-[880px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <Link href="/" className="font-bold italic text-lg tracking-tight select-none">
                        <span className="text-foreground">BONDI</span>
                        <span className="text-primary">MDP</span>
                    </Link>
                    <p className="text-xs text-muted-foreground">App gratuita de colectivos para Mar del Plata.</p>
                    <p className="text-[10px] text-[#3D5568] text-center md:text-right">
                        Datos: Microsoft Clarity · Google Analytics 4 · Vercel · Mayo 2026
                    </p>
                </div>
            </footer>
        </div>
    );
}
