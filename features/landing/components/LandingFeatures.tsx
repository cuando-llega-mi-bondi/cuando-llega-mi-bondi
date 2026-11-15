"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { PLAY_STORE_URL } from "@shared/play/playStore";
import { cn } from "@shared/utils";
import { ChapterScene } from "./ChapterScene";
import { ScrollRevealText } from "./ScrollRevealText";

const EXPOSITIVE_CHAPTERS = [
  {
    step: "01",
    label: "Arribos en vivo",
    tag: "TELEMETRÍA GPS · MGP",
    metric: "En vivo",
    scene: "arrivals",
    title: "Sabés cuántos minutos faltan antes de salir a la vereda.",
    description:
      "Cada colectivo reporta su posición GPS a medida que avanza por el recorrido. En lugar de depender de horarios teóricos en papel, ves la distancia y el tiempo estimado real hasta tu esquina.",
    detail: "Actualización continua por parada y ramal",
  },
  {
    step: "02",
    label: "Cómo llego",
    tag: "ORIGEN Y DESTINO · GEOLOCALIZACIÓN",
    metric: "Esquina a esquina",
    scene: "trip",
    title: "Resolvé qué línea tomarte aunque no conozcas el barrio.",
    description:
      "Indicando dónde estás y hacia dónde vas, el buscador cruza los trazados oficiales de toda la ciudad para mostrarte qué ramal te acerca más, dónde subir y cuántas cuadras caminás.",
    detail: "Detección automática de paradas cercanas por GPS",
  },
  {
    step: "03",
    label: "Toda la red",
    tag: "COBERTURA COMPLETA · COSTA Y BARRIOS",
    metric: "29 + 221",
    scene: "network",
    title: "Todas las líneas municipales más el corredor costero 221.",
    description:
      "Integramos en un mismo mapa las 29 líneas urbanas de General Pueyrredon junto con el recorrido interurbano de la línea 221 desde Santa Clara del Mar hasta Playa Serena.",
    detail: "Trazados de ida y vuelta verificados sobre el damero local",
  },
] as const;

type Chapter = (typeof EXPOSITIVE_CHAPTERS)[number];

// Pila medida en bemaconsultora.com (#servicios): la tarjeta entrante sube desde
// abajo de la pantalla y, pasado el primer cuarto del tramo, la anterior retrocede
// hacia arriba achicándose y desenfocándose. Todo lineal y atado al scroll.
const ENTER_FROM_VH = 110;
const EXIT_DELAY = 0.25;
const EXIT_SHIFT_PCT = -10.5;
const EXIT_SCALE = 0.94;
const EXIT_OPACITY = 0.74;
const EXIT_BLUR_PX = 10.5;

const SEGMENT = 1 / (EXPOSITIVE_CHAPTERS.length - 1);

function StackCard({
  chapter,
  index,
  active,
  progress,
}: {
  chapter: Chapter;
  index: number;
  active: boolean;
  progress: MotionValue<number>;
}) {
  const enter = useTransform(
    progress,
    [(index - 1) * SEGMENT, index * SEGMENT],
    [ENTER_FROM_VH, 0],
  );
  const exit = useTransform(
    progress,
    [(index + EXIT_DELAY) * SEGMENT, (index + 1) * SEGMENT],
    [0, 1],
  );
  const shift = useTransform(exit, [0, 1], [0, EXIT_SHIFT_PCT]);
  const scale = useTransform(exit, [0, 1], [1, EXIT_SCALE]);
  const opacity = useTransform(exit, [0, 1], [1, EXIT_OPACITY]);
  const blur = useTransform(exit, [0, 1], [0, EXIT_BLUR_PX]);

  const transform = useMotionTemplate`translateY(calc(${shift}% + ${enter}vh)) scale(${scale})`;
  const filter = useMotionTemplate`blur(${blur}px)`;

  return (
    <motion.li
      style={{ transform, opacity, filter, zIndex: index }}
      className="origin-top will-change-transform motion-safe:[grid-area:1/1] motion-reduce:transform-none! motion-reduce:opacity-100! motion-reduce:filter-none!"
    >
      <article className="grid gap-2 rounded-xl border border-border bg-card p-2 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:gap-8">
        {/* Panel navy con la escena de cada capítulo: el mapa de fondo competía con la animación */}
        <div className="relative flex min-h-52 flex-col justify-end overflow-hidden rounded-sm bg-[#0f2d4a] p-6 pt-16 xl:min-h-80">
          {/* Escena animada de lo que cuenta el capítulo; corre solo con la tarjeta al frente */}
          <ChapterScene scene={chapter.scene} active={active} />
          <span className="absolute left-0 top-0 rounded-br-sm border-b border-r border-white/15 bg-[#0f2d4a]/85 px-3 py-2 font-mono text-xs font-semibold tracking-wider text-[#f0f4f8] backdrop-blur-md">
            {chapter.tag}
          </span>
          <p className="relative font-mono text-4xl font-black tracking-tight text-[#f0f4f8] xl:text-5xl">
            {chapter.metric}
          </p>
        </div>

        <div className="flex flex-col justify-center gap-3 px-4 pb-5 pt-3 xl:py-8 xl:pl-0 xl:pr-8">
          <h3 className="text-balance text-2xl font-black leading-tight tracking-[-0.02em] text-foreground xl:text-[28px]">
            {chapter.title}
          </h3>
          <p className="text-base leading-relaxed text-muted-foreground">
            {chapter.description}
          </p>
          <p className="mt-2 border-t border-border pt-4 font-mono text-xs font-medium text-foreground">
            {chapter.detail}
          </p>
        </div>
      </article>
    </motion.li>
  );
}

// La barra de cada paso se llena mientras su tarjeta entra: llena = tarjeta al frente
function StepTab({
  chapter,
  index,
  active,
  progress,
}: {
  chapter: Chapter;
  index: number;
  active: boolean;
  progress: MotionValue<number>;
}) {
  const fill = useTransform(
    progress,
    [(index - 1) * SEGMENT, index * SEGMENT],
    [0, 1],
  );

  return (
    <li aria-current={active ? "step" : undefined} className="space-y-3">
      <span className="block h-0.5 overflow-hidden rounded-full bg-border">
        <motion.span
          style={{ scaleX: fill }}
          className="block h-full origin-left bg-secondary"
        />
      </span>
      <span
        className={cn(
          "flex items-baseline gap-2 text-sm font-semibold transition-colors duration-150",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <span className="font-mono text-xs">{chapter.step}</span>
        {chapter.label}
      </span>
    </li>
  );
}

export function LandingFeatures() {
  const runwayRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const stackRef = useRef<HTMLUListElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [exitSlack, setExitSlack] = useState(0);

  const { scrollYProgress } = useScroll({
    target: runwayRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    setActiveIndex(Math.round(progress / SEGMENT));
  });

  // El escenario mide una pantalla para que las tarjetas suban desde el borde inferior;
  // lo que sobra debajo de la pila se descuenta al final de la pista para que el cierre
  // no quede a media pantalla. Con movimiento reducido el escenario mide lo justo y da 0.
  useEffect(() => {
    const stage = stageRef.current;
    const stack = stackRef.current;
    if (!stage || !stack) return;
    const measure = () => {
      setExitSlack(
        Math.max(0, stage.clientHeight - (stack.offsetTop + stack.offsetHeight)),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    observer.observe(stack);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="como-funciona"
      aria-labelledby="como-funciona-heading"
      className="motion-reduce:pt-20 xl:motion-reduce:pt-24"
    >
      {/* Pista de scroll: cada tarjeta ocupa un tramo; con movimiento reducido es una lista común.
          El título viaja dentro del escenario fijo para no perderse mientras pasan las tarjetas,
          y el bloque se centra en la pantalla un poco por encima del medio (pb > pt). my-auto y
          no justify-center: en pantallas bajas los márgenes se anulan en vez de cortar el título. */}
      <div
        ref={runwayRef}
        style={{ marginBottom: -exitSlack }}
        className="relative motion-safe:h-[300vh]"
      >
        <div
          ref={stageRef}
          className="flex flex-col pt-10 motion-safe:sticky motion-safe:top-0 motion-safe:h-dvh motion-safe:overflow-clip motion-safe:pb-10 xl:pt-12 xl:motion-safe:pb-20"
        >
          <div className="my-auto">
            <h2
              id="como-funciona-heading"
              aria-label="Pensado para la calle, no para perder tiempo."
              className="mb-10 text-balance font-display text-3xl font-black leading-[1.05] tracking-tight text-foreground sm:text-4xl lg:text-[42px] xl:mb-12 xl:text-[46px]"
            >
              <ScrollRevealText
                text="Pensado para la calle,"
                highlight="no para perder tiempo."
              />
            </h2>

            {/* mb-12: la tarjeta que retrocede sube ~10% de su alto y no debe pisar los pasos */}
            <ol
              aria-label="Capítulos"
              className="mb-12 grid grid-cols-3 gap-4 motion-reduce:hidden"
            >
              {EXPOSITIVE_CHAPTERS.map((chapter, index) => (
                <StepTab
                  key={chapter.step}
                  chapter={chapter}
                  index={index}
                  active={index === activeIndex}
                  progress={scrollYProgress}
                />
              ))}
            </ol>

            <ul ref={stackRef} className="grid gap-5 motion-safe:gap-0">
              {EXPOSITIVE_CHAPTERS.map((chapter, index) => (
                <StackCard
                  key={chapter.step}
                  chapter={chapter}
                  index={index}
                  active={index === activeIndex}
                  progress={scrollYProgress}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Cierre fuera de la pila: tarjeta con acento cartográfico, como el CTA final */}
      <div className="mt-10 pb-20 xl:mt-12 xl:pb-24">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 sm:p-10 xl:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-y-8 right-0 w-3/5 bg-cover bg-right opacity-20 dark:opacity-25"
            style={{
              backgroundImage: "url(/mar-del-plata-mapa-bg.svg)",
              maskImage: "linear-gradient(to left, black 35%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to left, black 35%, transparent 100%)",
            }}
          />

          <div className="relative z-10 flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
            <div className="max-w-lg space-y-2.5">
              <h3 className="text-balance text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                Sin registro ni fricción
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                Abrís la app, elegís línea o esquina en el panel izquierdo y
                consultás el arribo en segundos.
              </p>
            </div>

            {/* Badges oficiales sin alterar, a la misma altura (Google Play nunca más chico que el resto) */}
            <ul className="flex shrink-0 flex-wrap items-start gap-4 xl:justify-end">
              <li className="space-y-2">
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-[10px]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- el proyecto no usa next/image (sin config de images); badge estático */}
                  <img
                    src="/badges/google-play.png"
                    alt="Descargar Bondi MDP en Google Play"
                    width={161}
                    height={48}
                    className="h-12 w-auto"
                  />
                </a>
                <p className="text-xs text-muted-foreground">
                  Gratis para Android
                </p>
              </li>
              {/* Sin link hasta que la app esté publicada en el App Store */}
              <li className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- el proyecto no usa next/image (sin config de images); badge estático */}
                <img
                  src="/badges/app-store.svg"
                  alt="App Store"
                  width={144}
                  height={48}
                  className="h-12 w-auto"
                />
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Próximamente
                  </span>{" "}
                  para iPhone
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
