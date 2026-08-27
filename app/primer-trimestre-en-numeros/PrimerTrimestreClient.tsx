"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ─── Weekly trend chart ──────────────────────────────────────────────────────
// Datos reales: suma diaria de usuarios nuevos + recurrentes (reporte GA4,
// 26 may – 23 ago 2026), agrupada en 13 semanas de 7 días (la última, 6).

const WEEKLY_TOTALS = [9556, 7963, 7097, 7309, 8381, 6593, 6169, 5083, 7147, 7001, 7956, 9949, 11004];

function WeeklyTrendChart() {
    const [hovered, setHovered] = useState<number | null>(null);

    const maxVal = 12000;
    const chartHeight = 180;
    const chartWidth = 500;
    const paddingLeft = 50;
    const paddingBottom = 40;
    const paddingTop = 20;
    const gridLines = [0, 3000, 6000, 9000, 12000];

    const points = WEEKLY_TOTALS.map((val, i) => {
        const x = paddingLeft + i * (chartWidth / (WEEKLY_TOTALS.length - 1));
        const y = chartHeight - paddingBottom - (val / maxVal) * (chartHeight - paddingTop - paddingBottom);
        return { x, y, val };
    });

    const getCurvePath = (pts: { x: number; y: number }[]) => {
        let path = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i];
            const p1 = pts[i + 1];
            const cpX1 = p0.x + (p1.x - p0.x) / 3;
            const cpX2 = p0.x + (2 * (p1.x - p0.x)) / 3;
            path += ` C ${cpX1} ${p0.y}, ${cpX2} ${p1.y}, ${p1.x} ${p1.y}`;
        }
        return path;
    };

    const path = getCurvePath(points);
    const bottomY = chartHeight - paddingBottom;
    const fill = `${path} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;

    return (
        <div className="relative">
            <svg viewBox="0 0 550 200" className="w-full h-auto select-none overflow-visible">
                {gridLines.map((val) => {
                    const y = chartHeight - paddingBottom - (val / maxVal) * (chartHeight - paddingTop - paddingBottom);
                    return (
                        <g key={val} className="opacity-40">
                            <line x1={paddingLeft} y1={y} x2={paddingLeft + chartWidth} y2={y} stroke="var(--color-border)" strokeWidth="1" />
                            <text x={paddingLeft - 10} y={y + 4} fill="var(--color-muted-foreground)" className="font-sans text-[11px]" textAnchor="end">
                                {val >= 1000 ? `${val / 1000}k` : val}
                            </text>
                        </g>
                    );
                })}

                <path d={fill} fill="color-mix(in srgb, var(--color-primary) 10%, transparent)" />
                <path d={path} fill="none" stroke="var(--color-primary)" strokeWidth="3" />

                {points.map((pt, idx) => (
                    <g key={idx}>
                        {(idx === 0 || idx === 6 || idx === 12) && (
                            <text x={pt.x} y={chartHeight - 12} fill="var(--color-muted-foreground)" className="font-sans text-[11px]" textAnchor="middle">
                                Sem {idx + 1}
                            </text>
                        )}
                        <circle cx={pt.x} cy={pt.y} r={4} fill="var(--color-primary)" stroke="var(--color-card)" strokeWidth="1.5" />
                        <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={12}
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHovered(idx)}
                            onMouseLeave={() => setHovered(null)}
                        />
                    </g>
                ))}
            </svg>

            {hovered !== null && (
                <div
                    style={{
                        left: `${(points[hovered].x / 550) * 100}%`,
                        bottom: `${((chartHeight - points[hovered].y) / 200) * 100 + 8}%`,
                    }}
                    className="absolute z-10 -translate-x-1/2 rounded bg-card border border-border p-3 text-xs shadow-2xl pointer-events-none duration-150"
                >
                    <div className="font-bold text-foreground mb-0.5">Semana {hovered + 1}</div>
                    <div className="text-muted-foreground">{WEEKLY_TOTALS[hovered].toLocaleString("es-AR")} días-usuario activos</div>
                </div>
            )}
        </div>
    );
}

// ─── Main client component ───────────────────────────────────────────────────

export default function PrimerTrimestreClient() {
    // Reading progress escrito directo al DOM: con useState cada tick de
    // scroll re-renderizaría el artículo completo solo para mover la barra.
    const progressRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            const docH = document.documentElement.scrollHeight - window.innerHeight;
            if (docH > 0 && progressRef.current) {
                progressRef.current.style.width = `${Math.round((window.scrollY / docH) * 100)}%`;
            }
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="bg-background text-foreground font-sans antialiased min-h-screen">
            <div
                ref={progressRef}
                style={{ width: "0%" }}
                className="fixed top-0 left-0 h-[3px] bg-primary z-[9999] transition-all duration-100 ease-out"
                aria-hidden="true"
            />

            <a
                href="#main-content"
                className="absolute left-4 top-[-100px] focus:top-4 bg-primary text-[#08131E] px-4 py-2 rounded font-bold z-[10000] transition-all"
            >
                Saltar al contenido
            </a>

            <nav className="sticky top-0 z-[100] bg-background/88 backdrop-blur-md border-b border-border px-6">
                <div className="max-w-[880px] mx-auto h-[58px] flex items-center justify-between">
                    <Link href="/" className="font-bold italic text-lg tracking-tight select-none">
                        <span className="text-foreground">BONDI</span>
                        <span className="text-primary">MDP</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Blog
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

            <header className="hero py-16 px-6 bg-[linear-gradient(180deg,rgba(0,63,125,0.12)_0%,transparent_100%)] border-b border-border">
                <div className="max-w-[880px] mx-auto">
                    <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6" aria-label="Migas de pan">
                        <Link href="/" className="hover:text-primary transition-colors">
                            Inicio
                        </Link>
                        <span aria-hidden="true" className="opacity-40">›</span>
                        <Link href="/blog" className="hover:text-primary transition-colors">
                            Blog
                        </Link>
                        <span aria-hidden="true" className="opacity-40">›</span>
                        <span aria-current="page" className="text-primary">
                            Primer trimestre en números
                        </span>
                    </nav>
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground mb-4">
                        <span className="bg-primary/12 text-primary border border-primary/25 px-2.5 py-0.5 rounded-full font-semibold tracking-wider text-[10px] uppercase">
                            Estadísticas
                        </span>
                        <span className="opacity-20" aria-hidden="true">·</span>
                        <time dateTime="2026-08-27">27 de agosto, 2026</time>
                        <span className="opacity-20" aria-hidden="true">·</span>
                        <span>7 min de lectura</span>
                    </div>
                    <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-foreground leading-[1.08] tracking-tight mb-5 max-w-2xl">
                        Bondi MDP: el primer trimestre en números —
                        <br />
                        <span className="text-primary">de un mes de arranque a un hábito diario</span>
                    </h1>
                    <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                        <strong className="font-semibold">
                            Del 26 de mayo al 23 de agosto de 2026, Bondi MDP acumuló su primer trimestre completo de
                            datos.
                        </strong>{" "}
                        Van tres meses desde el{" "}
                        <Link href="/un-mes-en-numeros" className="text-primary underline underline-offset-4">
                            primer informe
                        </Link>
                        . Estos son los números tal cual salen del reporte, sin curar.
                    </p>
                </div>
            </header>

            {/* STAT RIBBON */}
            <div className="bg-card border-b border-border py-8 px-6" aria-label="Resumen de métricas clave">
                <div className="max-w-[880px] mx-auto grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-0">
                    <div className="text-center md:text-left md:border-r md:border-border md:pr-4">
                        <span className="block font-num text-3xl sm:text-4xl font-bold text-foreground leading-none mb-1">22.893</span>
                        <span className="block text-xs text-muted-foreground leading-tight">Usuarios activos (90 días)</span>
                    </div>
                    <div className="text-center md:border-r md:border-border md:px-4">
                        <span className="block font-num text-3xl sm:text-4xl font-bold text-foreground leading-none mb-1">133.694</span>
                        <span className="block text-xs text-muted-foreground leading-tight">Sesiones totales</span>
                    </div>
                    <div className="text-center md:border-r md:border-border md:px-4">
                        <span className="block font-num text-3xl sm:text-4xl font-bold text-foreground leading-none mb-1">763k</span>
                        <span className="block text-xs text-muted-foreground leading-tight">Vistas de página</span>
                    </div>
                    <div className="text-center md:border-r md:border-border md:px-4">
                        <span className="block font-num text-3xl sm:text-4xl font-bold text-primary leading-none mb-1">4,2:1</span>
                        <span className="block text-xs text-muted-foreground leading-tight">Recurrentes por nuevo (últimos 30 días)</span>
                    </div>
                    <div className="text-center md:pl-4">
                        <span className="block font-num text-3xl sm:text-4xl font-bold text-primary leading-none mb-1">585</span>
                        <span className="block text-xs text-muted-foreground leading-tight">Sesiones referidas desde IA (ChatGPT)</span>
                    </div>
                </div>
            </div>

            <main id="main-content">
                {/* 00 CONTEXTO */}
                <section className="py-16 px-6 bg-muted border-b border-border">
                    <div className="max-w-[880px] mx-auto">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/12 border border-primary/25 px-2.5 py-0.5 rounded-full">
                                Contexto
                            </span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">Tres meses después</span>
                        </div>
                        <h2 className="font-display font-bold text-2xl sm:text-3xl text-foreground mb-6 leading-tight">
                            Mismo equipo, misma data oficial,
                            <br />
                            <span className="text-primary">tres meses más de uso real.</span>
                        </h2>
                        <div className="text-sm sm:text-base text-muted-foreground space-y-4 leading-relaxed max-w-[660px]">
                            <p>
                                Bondi MDP la siguen haciendo Nicolás Jiménez y Matias Celiz Ramos, sin inversión externa
                                ni pauta paga, consumiendo la misma API en tiempo real de la Municipalidad de General
                                Pueyrredón que usa la app oficial &ldquo;Cuándo Llega&rdquo;. Este informe cubre el
                                período 26 de mayo – 23 de agosto de 2026: el primer trimestre completo con datos de
                                Google Analytics 4.
                            </p>
                            <p>
                                Lo publicamos con los mismos criterios y las mismas fuentes que el{" "}
                                <Link href="/un-mes-en-numeros">informe del primer mes</Link>, para que se pueda
                                comparar un período contra el otro.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 01 CRECIMIENTO */}
                <section className="py-16 px-6 border-b border-border">
                    <div className="max-w-[880px] mx-auto">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/12 border border-primary/25 px-2.5 py-0.5 rounded-full">01</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">Crecimiento</span>
                        </div>
                        <h2 className="font-display font-bold text-2xl sm:text-3xl text-foreground mb-6 leading-tight">
                            La curva no se aplanó:
                            <br />
                            <span className="text-primary">se aceleró en el último mes.</span>
                        </h2>
                        <div className="text-sm sm:text-base text-muted-foreground space-y-4 leading-relaxed max-w-[660px] mb-8">
                            <p>
                                De los <strong className="text-foreground font-semibold">22.893 usuarios activos</strong>{" "}
                                del trimestre, <strong className="text-foreground font-semibold">13.181 (58%)</strong>{" "}
                                llegaron en los últimos 30 días del período. Con usuarios nuevos pasa lo mismo: 8.269 de
                                los 16.224 del trimestre —más de la mitad— se sumaron en ese último mes. El tramo más
                                reciente concentra más actividad que los dos meses anteriores juntos.
                            </p>
                        </div>

                        <div className="bg-card border border-border rounded-xl p-5 md:p-6 mb-8">
                            <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
                                <span className="text-[13px] font-semibold text-foreground">Días-usuario activos por semana</span>
                                <span className="text-xs text-muted-foreground">26 may – 23 ago 2026</span>
                            </div>
                            <div className="relative min-h-[180px]">
                                <WeeklyTrendChart />
                            </div>
                            <div className="mt-4 p-3.5 bg-primary/12 border-l-[3px] border-[#F7C325] rounded-r-md text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                                <strong className="text-primary font-semibold">↓ Julio fue el valle del trimestre.</strong>{" "}
                                Las semanas 6 a 8 (fines de junio–julio) marcan el punto más bajo de actividad. Desde ahí,
                                cada semana creció sobre la anterior: la semana 13 —la última, de solo 6 días— ya es la de
                                mayor actividad de todo el trimestre.
                            </div>
                        </div>

                        <h3 className="font-display font-bold text-lg text-foreground mb-4">Cómo nos encuentran: sin pauta</h3>
                        <div className="text-sm sm:text-base text-muted-foreground space-y-4 leading-relaxed max-w-[660px] mb-6">
                            <p>
                                De las 133.694 sesiones del trimestre, el <strong className="text-foreground font-semibold">59% son directas</strong> (alguien
                                que ya tiene el link o la PWA instalada) y el{" "}
                                <strong className="text-foreground font-semibold">36% llegan por Google orgánico</strong>. No hay una sola
                                campaña paga detrás: el resto se reparte entre prensa (Diario La Capital, Mi8), redes y buscadores
                                con IA.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-card border border-border rounded-xl p-4.5">
                                <span className="font-num text-3xl font-bold text-foreground block leading-none mb-1">59%</span>
                                <span className="text-xs font-semibold text-foreground block mb-1">Tráfico directo</span>
                                <span className="text-[11px] text-muted-foreground leading-normal block">79.427 sesiones · link o PWA instalada</span>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-4.5">
                                <span className="font-num text-3xl font-bold text-foreground block leading-none mb-1">36%</span>
                                <span className="text-xs font-semibold text-foreground block mb-1">Google orgánico</span>
                                <span className="text-[11px] text-muted-foreground leading-normal block">47.805 sesiones · sin inversión publicitaria</span>
                            </div>
                            <div className="bg-primary/12 border border-primary/25 rounded-xl p-4.5">
                                <span className="font-num text-3xl font-bold text-primary block leading-none mb-1">~5%</span>
                                <span className="text-xs font-semibold text-primary block mb-1">Prensa, redes y otros</span>
                                <span className="text-[11px] text-muted-foreground leading-normal block">La Capital, Mi8 y referidos varios</span>
                            </div>
                            <div className="bg-[#1A9EDE]/10 border border-[#1A9EDE]/25 rounded-xl p-4.5">
                                <span className="font-num text-3xl font-bold text-[#1A9EDE] block leading-none mb-1">585</span>
                                <span className="text-xs font-semibold text-foreground block mb-1">Desde IA (ChatGPT)</span>
                                <span className="text-[11px] text-muted-foreground leading-normal block">265 de esas, solo en el último mes</span>
                            </div>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[660px] mt-4">
                            El canal más nuevo es también el que más crece: casi la mitad de las sesiones referidas desde
                            ChatGPT en todo el trimestre pasaron en el último mes. Los buscadores con IA ya citan a Bondi
                            MDP como fuente para &ldquo;cuándo llega el colectivo en Mar del Plata&rdquo;.
                        </p>
                    </div>
                </section>

                {/* 02 RETENCIÓN */}
                <section className="py-16 px-6 bg-muted border-b border-border">
                    <div className="max-w-[880px] mx-auto">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/12 border border-primary/25 px-2.5 py-0.5 rounded-full">02</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">Retención</span>
                        </div>
                        <h2 className="font-display font-bold text-2xl sm:text-3xl text-foreground mb-6 leading-tight">
                            En el mes de lanzamiento la relación fue 2 a 1.
                            <br />
                            <span className="text-primary">Ahora es más de 4 a 1.</span>
                        </h2>
                        <div className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-[660px] mb-6">
                            <p>
                                Analytics reporta actividad diaria de usuarios nuevos y recurrentes. En los últimos 30
                                días del trimestre, <strong className="text-foreground font-semibold">31.880 días-usuario fueron de gente que ya
                                    había usado la app antes</strong>, contra 7.631 de gente nueva: más del doble de la
                                proporción 2:1 del mes de lanzamiento, medida en la misma ventana de 30 días. Sumando los
                                90 días completos del trimestre, la relación sube a 5,6 recurrentes por cada nuevo.
                            </p>
                        </div>

                        <div className="mt-8 max-w-xl">
                            <div
                                className="flex h-[72px] rounded-lg overflow-hidden border border-white/12 shadow-inner"
                                role="img"
                                aria-label="Barra proporcional: 1 parte nuevos, 4 partes recurrentes, últimos 30 días"
                            >
                                <div className="bg-white/5 flex flex-col items-center justify-center p-2 text-center flex-[1]">
                                    <span className="font-num font-bold text-base sm:text-lg text-muted-foreground">7.631</span>
                                    <span className="text-[10px] font-semibold tracking-wider text-[#3D5568] uppercase">Nuevos</span>
                                </div>
                                <div className="bg-primary flex flex-col items-center justify-center p-2 text-center flex-[4]">
                                    <span className="font-num font-bold text-base sm:text-lg text-[#0B1926]">31.880</span>
                                    <span className="text-[10px] font-semibold tracking-wider text-[#0B1926]/70 uppercase">Recurrentes</span>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-3 mt-5">
                                <span className="font-num text-5xl sm:text-6xl font-extrabold text-primary leading-none">4,2:1</span>
                                <span className="text-sm sm:text-base text-muted-foreground leading-tight">
                                    días-usuario recurrentes
                                    <br />
                                    por cada nuevo (últimos 30 días)
                                </span>
                            </div>
                        </div>

                        <div className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-[660px] mt-6">
                            <p>
                                La gente vuelve a usarla. La proporción mejora con el tiempo en lugar de diluirse, algo
                                esperable cuando el problema que resuelve (saber cuándo llega el colectivo) se repite
                                todos los días, a la misma parada.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 03 QUÉ USAN + COBERTURA DE RED */}
                <section className="py-16 px-6 bg-card border-b border-border">
                    <div className="max-w-[880px] mx-auto">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/12 border border-primary/25 px-2.5 py-0.5 rounded-full">03</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">Uso del producto</span>
                        </div>
                        <h2 className="font-display font-bold text-2xl sm:text-3xl text-foreground mb-6 leading-tight">
                            No es una sola línea popular:
                            <br />
                            <span className="text-primary">es toda la red de la ciudad.</span>
                        </h2>
                        <div className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-[660px] mb-8">
                            <p>
                                En los últimos 30 días se registraron{" "}
                                <strong className="text-foreground font-semibold">284.576 consultas de horario</strong>{" "}
                                repartidas en <strong className="text-foreground font-semibold">50 líneas</strong> de
                                colectivo distintas y más de{" "}
                                <strong className="text-foreground font-semibold">500 paradas</strong>. Las líneas 552,
                                523, 571, 551 y 553 lideran el volumen, pero el uso está distribuido en toda la red, no
                                concentrado en una o dos líneas. La parada más consultada fue Deán Funes y Alberti, con
                                6.223 consultas en el mes.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-background border border-border rounded-xl p-4.5 flex gap-3.5 items-start">
                                <div>
                                    <span className="font-num text-xl font-bold text-primary block leading-none mb-1">488.284</span>
                                    <span className="text-xs font-semibold text-foreground block mb-1">vistas en /consultar</span>
                                    <span className="text-[11px] text-muted-foreground leading-normal block">
                                        18.566 usuarios · 11% de rebote: la gente entra a buscar un horario y se queda
                                    </span>
                                </div>
                            </div>
                            <div className="bg-background border border-border rounded-xl p-4.5 flex gap-3.5 items-start">
                                <div>
                                    <span className="font-num text-xl font-bold text-primary block leading-none mb-1">197.180</span>
                                    <span className="text-xs font-semibold text-foreground block mb-1">vistas en la home</span>
                                    <span className="text-[11px] text-muted-foreground leading-normal block">
                                        14.173 usuarios · 3% de rebote, la más baja de toda la app
                                    </span>
                                </div>
                            </div>
                            <div className="bg-background border border-border rounded-xl p-4.5 flex gap-3.5 items-start">
                                <div>
                                    <span className="font-num text-xl font-bold text-primary block leading-none mb-1">2.106</span>
                                    <span className="text-xs font-semibold text-foreground block mb-1">usuarios con favoritos</span>
                                    <span className="text-[11px] text-muted-foreground leading-normal block">
                                        34.456 vistas · un promedio de 16 consultas cada uno en el trimestre
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 04 ALCANCE GEOGRÁFICO */}
                <section className="py-16 px-6 border-b border-border">
                    <div className="max-w-[880px] mx-auto">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/12 border border-primary/25 px-2.5 py-0.5 rounded-full">04</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">Alcance geográfico</span>
                        </div>
                        <h2 className="font-display font-bold text-2xl sm:text-3xl text-foreground mb-6 leading-tight">
                            Local en el uso diario,
                            <br />
                            <span className="text-primary">nacional en quién se interesa.</span>
                        </h2>
                        <div className="text-sm sm:text-base text-muted-foreground space-y-4 leading-relaxed max-w-[660px]">
                            <p>
                                Mar del Plata concentra <strong className="text-foreground font-semibold">16.943 usuarios activos</strong> (74%
                                del total), como es esperable para una app de transporte local. Lo que no era tan
                                esperable: Buenos Aires aparece como la segunda ciudad, con{" "}
                                <strong className="text-foreground font-semibold">13.290 usuarios activos</strong>, muy por delante de
                                cualquier otra localidad del país. Coincide con el patrón de quien busca cómo moverse en
                                Mar del Plata antes de viajar —turismo de fin de semana o de temporada, sin poder
                                confirmarlo con certeza desde estos datos.
                            </p>
                            <p>
                                Córdoba, Santa Fe, Neuquén, Tucumán, Salta, Corrientes, Rosario y La Plata también
                                registran usuarios activos, junto con localidades balnearias vecinas como Santa Clara del
                                Mar y Miramar. El interés no depende de un único público cautivo.
                            </p>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="py-16 px-6 border-b border-border" aria-labelledby="faq-h2">
                    <div className="max-w-[880px] mx-auto">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/12 border border-primary/25 px-2.5 py-0.5 rounded-full">FAQ</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">Preguntas frecuentes</span>
                        </div>
                        <h2 id="faq-h2" className="font-display font-bold text-2xl sm:text-3xl text-foreground mb-6 leading-tight">
                            Lo que la gente pregunta sobre
                            <br />
                            <span className="text-primary">el primer trimestre de Bondi MDP</span>
                        </h2>

                        <div className="divide-y divide-white/10 border-y border-border mt-6" itemScope itemType="https://schema.org/FAQPage">
                            <details className="group py-4.5 cursor-pointer" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                                <summary className="flex justify-between items-center text-sm sm:text-base font-semibold text-foreground list-none outline-none group-open:text-primary transition-colors" itemProp="name">
                                    ¿Cuántos usuarios tiene Bondi MDP en su primer trimestre?
                                    <span className="text-lg text-primary font-light transition-transform duration-200 group-open:rotate-45 flex-shrink-0 ml-4">+</span>
                                </summary>
                                <div className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[720px]" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                                    <p itemProp="text">
                                        Entre el 26 de mayo y el 23 de agosto de 2026, Bondi MDP registró 22.893 usuarios
                                        activos, 133.694 sesiones y 762.918 vistas de página, según Google Analytics 4.
                                        El 58% de esos usuarios llegó en el último mes del período.
                                    </p>
                                </div>
                            </details>

                            <details className="group py-4.5 cursor-pointer" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                                <summary className="flex justify-between items-center text-sm sm:text-base font-semibold text-foreground list-none outline-none group-open:text-primary transition-colors" itemProp="name">
                                    ¿Cómo consigue usuarios Bondi MDP?
                                    <span className="text-lg text-primary font-light transition-transform duration-200 group-open:rotate-45 flex-shrink-0 ml-4">+</span>
                                </summary>
                                <div className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[720px]" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                                    <p itemProp="text">
                                        Sin pauta paga. El 59% de las sesiones del trimestre son directas y el 36%
                                        llegan por Google orgánico. El resto se reparte entre prensa, redes y buscadores
                                        con IA: 585 sesiones llegaron referidas desde ChatGPT en el período.
                                    </p>
                                </div>
                            </details>

                            <details className="group py-4.5 cursor-pointer" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                                <summary className="flex justify-between items-center text-sm sm:text-base font-semibold text-foreground list-none outline-none group-open:text-primary transition-colors" itemProp="name">
                                    ¿La gente vuelve a usar Bondi MDP o la prueba una sola vez?
                                    <span className="text-lg text-primary font-light transition-transform duration-200 group-open:rotate-45 flex-shrink-0 ml-4">+</span>
                                </summary>
                                <div className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[720px]" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                                    <p itemProp="text">
                                        Vuelve. En los últimos 30 días del trimestre, por cada día-usuario nuevo hubo 4,2
                                        días-usuario de gente recurrente, más del doble de la proporción 2:1 del mes de
                                        lanzamiento.
                                    </p>
                                </div>
                            </details>

                            <details className="group py-4.5 cursor-pointer" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                                <summary className="flex justify-between items-center text-sm sm:text-base font-semibold text-foreground list-none outline-none group-open:text-primary transition-colors" itemProp="name">
                                    ¿Bondi MDP solo se usa en Mar del Plata?
                                    <span className="text-lg text-primary font-light transition-transform duration-200 group-open:rotate-45 flex-shrink-0 ml-4">+</span>
                                </summary>
                                <div className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[720px]" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                                    <p itemProp="text">
                                        El uso diario es local: 74% de los usuarios activos están en Mar del Plata.
                                        Pero Buenos Aires es la segunda ciudad con más usuarios activos (13.290), muy
                                        por delante de cualquier otra localidad del país, y hay actividad registrada en
                                        casi todas las provincias argentinas.
                                    </p>
                                </div>
                            </details>
                        </div>
                    </div>
                </section>

                {/* CLOSING */}
                <section className="py-16 px-6 bg-[linear-gradient(180deg,transparent_0%,rgba(0,63,125,0.1)_100%)] border-b border-border text-center">
                    <div className="max-w-[580px] mx-auto">
                        <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Lo que viene</span>
                        <h2 className="font-display font-bold text-2xl sm:text-3xl text-foreground mb-4 leading-tight">
                            El próximo informe, en el segundo trimestre.
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-8">
                            Vamos a seguir publicando estos números cada trimestre, con la misma metodología, para que se
                            pueda seguir la evolución real del proyecto. Mientras tanto, seguimos construyendo: mejor
                            precisión de arribos, más cobertura de líneas, y todo a la vista en{" "}
                            <a
                                href="https://github.com/cuando-llega-mi-bondi/cuando-llega-mi-bondi"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline underline-offset-4"
                            >
                                el repositorio open source
                            </a>
                            .
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

            <footer className="bg-muted py-10 px-6">
                <div className="max-w-[880px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <Link href="/" className="font-bold italic text-lg tracking-tight select-none">
                        <span className="text-foreground">BONDI</span>
                        <span className="text-primary">MDP</span>
                    </Link>
                    <p className="text-xs text-muted-foreground">App gratuita de colectivos para Mar del Plata.</p>
                    <p className="text-[10px] text-[#3D5568] text-center md:text-right">
                        Datos: Google Analytics 4 · Vercel · Agosto 2026
                    </p>
                </div>
            </footer>
        </div>
    );
}
