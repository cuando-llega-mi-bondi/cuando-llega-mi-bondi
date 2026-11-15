"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { INK, LINE, NAVY, TEAL, YELLOW, bracketPath } from "./sceneInk";

export type SceneKind = "arrivals" | "trip" | "network";

// Lienzo común, anclado a la derecha del panel. La esquina superior izquierda es de la
// etiqueta y la inferior izquierda de la cifra grande: ningún trazo entra ahí.
const VIEWBOX_WIDTH = 400;
const VIEWBOX_HEIGHT = 320;

type Point = readonly [number, number];

// Recorrido en tramos rectos (el damero) y, para mover algo por encima, en qué fracción
// del largo total cae cada vértice.
function polyline(points: readonly Point[]) {
  const d = points.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  const lengths = points
    .slice(1)
    .map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let travelled = 0;
  const at = [0, ...lengths.map((length) => (travelled += length) / total)];
  return {
    d,
    at,
    xs: points.map(([x]) => x),
    ys: points.map(([, y]) => y),
  };
}

/**
 * Reloj de una escena: recorre 0 → 1 en bucle solo mientras la tarjeta está al frente
 * y en pantalla. En el HTML prerenderado y con movimiento reducido queda quieto en
 * `restAt`, un cuadro elegido para que la escena se entienda sin animación; el árbol
 * renderizado es el mismo en ambos casos (ver LandingMotionConfig).
 */
function useSceneClock(playing: boolean, duration: number, restAt: number) {
  const t = useMotionValue(restAt);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!playing || reduceMotion) return;
    const controls = animate(t, [0, 1], {
      duration,
      ease: "linear",
      repeat: Infinity,
    });
    return () => controls.stop();
  }, [playing, reduceMotion, duration, t]);

  return t;
}

function SceneCanvas({ children }: { children: ReactNode }) {
  const gridId = `grid-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      preserveAspectRatio="xMaxYMid meet"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="absolute inset-0 h-full w-full"
    >
      {/* Grilla de puntos del panel, como la referencia: textura que no compite con la escena */}
      <defs>
        <pattern
          id={gridId}
          width={22}
          height={22}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={1.3} cy={1.3} r={1.3} fill={LINE} fillOpacity={0.16} />
        </pattern>
      </defs>
      <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill={`url(#${gridId})`} />
      {children}
    </svg>
  );
}

// Costa de Mar del Plata a la derecha, con dos líneas de olas
const COAST = polyline([
  [374, 0],
  [366, 36],
  [380, 64],
  [362, 100],
  [372, 132],
  [354, 166],
  [364, 198],
  [342, 232],
  [350, 264],
  [328, 296],
  [322, 320],
]);

function Coast() {
  return (
    <g stroke={LINE} strokeWidth={1.5}>
      <path d={COAST.d} strokeOpacity={0.6} />
      <path d="M392 50 Q380 120 392 190" strokeOpacity={0.3} />
      <path d="M399 120 Q387 190 399 260" strokeOpacity={0.2} />
    </g>
  );
}

// Calles de contexto, apenas visibles
function Streets({ d }: { d: string }) {
  return <path d={d} stroke={LINE} strokeOpacity={0.22} strokeWidth={1.5} />;
}

function Node({
  cx,
  cy,
  opacity,
}: {
  cx: number;
  cy: number;
  opacity?: MotionValue<number>;
}) {
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={4.5}
      fill={INK}
      stroke={NAVY}
      strokeWidth={2.5}
      style={{ opacity }}
    />
  );
}

// Pulso que se expande y se apaga: reporte GPS o "estás acá"
function Pulse({
  cx,
  cy,
  phase,
  from,
  to,
  color,
}: {
  cx: number | MotionValue<number>;
  cy: number | MotionValue<number>;
  phase: MotionValue<number>;
  from: number;
  to: number;
  color: string;
}) {
  const r = useTransform(phase, [0, 1], [from, to]);
  const opacity = useTransform(phase, [0, 1], [0.6, 0]);
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={r}
      stroke={color}
      strokeWidth={1.5}
      style={{ opacity }}
    />
  );
}

function Brackets({
  cx,
  cy,
  half,
  opacity,
  color,
}: {
  cx: number;
  cy: number;
  half: MotionValue<number>;
  opacity: MotionValue<number>;
  color: string;
}) {
  const d = useTransform(half, (h) => bracketPath(cx, cy, h));
  return (
    <motion.path d={d} stroke={color} strokeWidth={2} style={{ opacity }} />
  );
}

/* ── 01 · Arribos en vivo: el colectivo se acerca y la parada queda en foco ── */

const BUS_ROUTE = polyline([
  [40, 214],
  [140, 214],
  [140, 150],
  [250, 150],
  [250, 84],
  [300, 84],
]);
const ARRIVAL_AT = 0.78;
const MINUTES_AWAY = 4;

function ArrivalsScene({ playing }: { playing: boolean }) {
  const t = useSceneClock(playing, 9, 0.5);
  const travel = useTransform(t, [0.04, ARRIVAL_AT], [0, 1]);
  const busX = useTransform(travel, BUS_ROUTE.at, BUS_ROUTE.xs);
  const busY = useTransform(travel, BUS_ROUTE.at, BUS_ROUTE.ys);
  const visible = useTransform(t, [0, 0.04, 0.94, 1], [0, 1, 1, 0]);
  // Seis reportes de posición por vuelta
  const gps = useTransform(t, (v) => (v * 6) % 1);
  // Los corchetes se cierran sobre la parada a medida que el colectivo se acerca
  const focus = useTransform(t, [0.04, ARRIVAL_AT], [40, 15]);
  const focusOpacity = useTransform(t, [0, 0.04, ARRIVAL_AT, 0.94, 1], [0, 0.35, 1, 1, 0]);
  const arrived = useTransform(t, (v) => (v >= ARRIVAL_AT && v < 0.94 ? 1 : 0));
  const arrivalPulse = useTransform(t, [ARRIVAL_AT, 0.94], [0, 1]);
  const eta = useTransform(t, (v) => {
    if (v >= ARRIVAL_AT) return "541 · ahora";
    const left = 1 - Math.max(0, (v - 0.04) / (ARRIVAL_AT - 0.04));
    return `541 · ${Math.max(1, Math.ceil(left * MINUTES_AWAY))} min`;
  });

  return (
    <>
      <SceneCanvas>
        <Coast />
        <Streets d="M20 150 H140 M250 150 H332 M140 96 V150 M196 150 V250 M250 84 V40 M300 84 V128" />

        <path d={BUS_ROUTE.d} stroke={LINE} strokeOpacity={0.55} strokeWidth={2} />
        <motion.path
          d={BUS_ROUTE.d}
          stroke={YELLOW}
          strokeWidth={3}
          style={{ pathLength: travel, opacity: visible }}
        />
        <Node cx={140} cy={214} />
        <Node cx={250} cy={150} />

        {/* Tu parada */}
        <Brackets cx={300} cy={84} half={focus} opacity={focusOpacity} color={YELLOW} />
        <motion.g style={{ opacity: arrived }}>
          <Pulse cx={300} cy={84} phase={arrivalPulse} from={6} to={30} color={YELLOW} />
        </motion.g>
        <circle cx={300} cy={84} r={6} fill={INK} stroke={NAVY} strokeWidth={2.5} />

        <motion.g style={{ opacity: visible }}>
          <Pulse cx={busX} cy={busY} phase={gps} from={7} to={26} color={YELLOW} />
          <motion.circle
            cx={busX}
            cy={busY}
            r={7}
            fill={YELLOW}
            stroke={NAVY}
            strokeWidth={2.5}
          />
        </motion.g>
      </SceneCanvas>

      <span className="absolute left-3 top-12 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[#0f2d4a]/85 px-3 py-1.5 font-mono text-xs font-semibold text-[#f0f4f8] backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-[#289b95] motion-safe:animate-pulse" />
        <motion.span>{eta}</motion.span>
      </span>
    </>
  );
}

/* ── 02 · Cómo llego: caminás, subís, bajás y llegás ───────────────────────── */

const ORIGIN: Point = [60, 110];
const DESTINATION: Point = [352, 236];
const WALK_TO_STOP = polyline([ORIGIN, [130, 110]]);
const BUS_LEG = polyline([
  [130, 110],
  [230, 110],
  [230, 180],
  [320, 180],
]);
const WALK_TO_DESTINATION = polyline([[320, 180], [320, 236], DESTINATION]);

// Tramo a pie punteado, revelado con una máscara: pathLength usa el mismo
// stroke-dasharray que el punteado y no pueden convivir en un solo trazo.
function WalkLeg({ d, progress }: { d: string; progress: MotionValue<number> }) {
  const maskId = `walk-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <>
      <mask
        id={maskId}
        maskUnits="userSpaceOnUse"
        x={0}
        y={0}
        width={VIEWBOX_WIDTH}
        height={VIEWBOX_HEIGHT}
      >
        <motion.path
          d={d}
          stroke="white"
          strokeWidth={12}
          strokeLinecap="butt"
          style={{ pathLength: progress }}
        />
      </mask>
      <path
        d={d}
        stroke={INK}
        strokeWidth={3}
        strokeDasharray="0.1 8"
        mask={`url(#${maskId})`}
      />
    </>
  );
}

function TripScene({ playing }: { playing: boolean }) {
  const t = useSceneClock(playing, 8, 0.86);
  // Primero se elige el origen…
  const pickOrigin = useTransform(t, [0.02, 0.12], [30, 15]);
  const pickOriginOpacity = useTransform(t, [0.02, 0.06, 0.16, 0.22], [0, 1, 1, 0]);
  // …después el viaje se dibuja tramo a tramo
  const walkToStop = useTransform(t, [0.12, 0.22], [0, 1]);
  const firstStop = useTransform(t, [0.21, 0.23], [0, 1]);
  const ride = useTransform(t, [0.24, 0.56], [0, 1]);
  const rideOpacity = useTransform(t, [0.24, 0.25], [0, 1]);
  const busX = useTransform(ride, BUS_LEG.at, BUS_LEG.xs);
  const busY = useTransform(ride, BUS_LEG.at, BUS_LEG.ys);
  const busOpacity = useTransform(t, [0.23, 0.25, 0.55, 0.57], [0, 1, 1, 0]);
  const secondStop = useTransform(t, [0.55, 0.57], [0, 1]);
  const walkToDestination = useTransform(t, [0.58, 0.7], [0, 1]);
  // …y el destino queda en foco con un check
  const lockDestination = useTransform(t, [0.66, 0.74], [34, 20]);
  const lockOpacity = useTransform(t, [0.66, 0.7], [0, 1]);
  const checkR = useTransform(t, [0.72, 0.76, 0.78], [0, 14, 12]);
  const checkDrawn = useTransform(t, [0.77, 0.83], [0, 1]);
  const here = useTransform(t, (v) => (v * 5) % 1);
  const fade = useTransform(t, [0.92, 1], [1, 0]);

  return (
    <SceneCanvas>
      <Streets d="M20 110 H60 M130 60 V110 M230 50 V110 M230 180 V260 M160 180 H230 M320 140 V180 M320 236 H290" />

      <motion.g style={{ opacity: fade }}>
        <WalkLeg d={WALK_TO_STOP.d} progress={walkToStop} />
        <motion.path
          d={BUS_LEG.d}
          stroke={YELLOW}
          strokeWidth={3}
          style={{ pathLength: ride, opacity: rideOpacity }}
        />
        <WalkLeg d={WALK_TO_DESTINATION.d} progress={walkToDestination} />

        <Node cx={130} cy={110} opacity={firstStop} />
        <Node cx={320} cy={180} opacity={secondStop} />

        <motion.circle
          cx={busX}
          cy={busY}
          r={6.5}
          fill={YELLOW}
          stroke={NAVY}
          strokeWidth={2.5}
          style={{ opacity: busOpacity }}
        />

        <Brackets
          cx={DESTINATION[0]}
          cy={DESTINATION[1]}
          half={lockDestination}
          opacity={lockOpacity}
          color={TEAL}
        />
        <motion.circle
          cx={DESTINATION[0]}
          cy={DESTINATION[1]}
          r={checkR}
          fill={TEAL}
          stroke={NAVY}
          strokeWidth={2.5}
        />
        <motion.path
          d={`M${DESTINATION[0] - 5} ${DESTINATION[1]} l3.5 3.5 l6.5 -7`}
          stroke={INK}
          strokeWidth={2.5}
          style={{ pathLength: checkDrawn, opacity: checkDrawn }}
        />
      </motion.g>

      {/* Origen: "estás acá", siempre visible */}
      <Brackets
        cx={ORIGIN[0]}
        cy={ORIGIN[1]}
        half={pickOrigin}
        opacity={pickOriginOpacity}
        color={YELLOW}
      />
      <Pulse cx={ORIGIN[0]} cy={ORIGIN[1]} phase={here} from={7} to={22} color={TEAL} />
      <circle cx={ORIGIN[0]} cy={ORIGIN[1]} r={7} fill={TEAL} stroke={NAVY} strokeWidth={2.5} />
    </SceneCanvas>
  );
}

/* ── 03 · Toda la red: las líneas urbanas y el corredor costero 221 ────────── */

const URBAN_LINES = [
  "M40 70 H150 V140 H270",
  "M60 232 V165 H190 V60 H300",
  "M110 48 V110 H316",
  "M30 190 H120 V215 H250",
  "M200 236 V185 H300 V100",
  "M250 48 V150 H316",
  "M150 200 H230 V125",
];
const LINE_STAGGER = 0.05;
const LINE_DRAW = 0.2;
// Santa Clara del Mar (norte) a Playa Serena (sur), pegado a la costa
const CORRIDOR_221 = polyline([
  [352, 14],
  [346, 52],
  [358, 82],
  [340, 118],
  [348, 150],
  [332, 186],
  [338, 216],
  [318, 252],
  [322, 280],
  [302, 310],
]);

function lastPoint(d: string): Point {
  const numbers = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
  // Los recorridos alternan H y V: el último número es la coordenada que cambió
  const commands = d.match(/[MHV]/g)!;
  let x = numbers[0];
  let y = numbers[1];
  commands.slice(1).forEach((command, i) => {
    if (command === "H") x = numbers[i + 2];
    else y = numbers[i + 2];
  });
  return [x, y];
}

function UrbanLine({
  d,
  index,
  t,
}: {
  d: string;
  index: number;
  t: MotionValue<number>;
}) {
  const start = 0.03 + index * LINE_STAGGER;
  const drawn = useTransform(t, [start, start + LINE_DRAW], [0, 1]);
  const opacity = useTransform(t, [start, start + 0.01], [0, 1]);
  const end = useTransform(t, [start + LINE_DRAW - 0.01, start + LINE_DRAW], [0, 1]);
  const [x, y] = lastPoint(d);
  return (
    <>
      <motion.path
        d={d}
        stroke={LINE}
        strokeOpacity={0.7}
        strokeWidth={2}
        style={{ pathLength: drawn, opacity }}
      />
      <Node cx={x} cy={y} opacity={end} />
    </>
  );
}

function NetworkScene({ playing }: { playing: boolean }) {
  const t = useSceneClock(playing, 9, 0.86);
  const corridor = useTransform(t, [0.44, 0.7], [0, 1]);
  const corridorOpacity = useTransform(t, [0.44, 0.45], [0, 1]);
  const north = useTransform(t, [0.43, 0.45], [0, 1]);
  const south = useTransform(t, [0.69, 0.71], [0, 1]);
  // Un destello recorre el corredor ya trazado
  const sweep = useTransform(t, [0.72, 0.9], [0, 1]);
  const sweepX = useTransform(sweep, CORRIDOR_221.at, CORRIDOR_221.xs);
  const sweepY = useTransform(sweep, CORRIDOR_221.at, CORRIDOR_221.ys);
  const sweepOpacity = useTransform(t, [0.72, 0.74, 0.88, 0.9], [0, 1, 1, 0]);
  const fade = useTransform(t, [0.93, 1], [1, 0]);

  return (
    <SceneCanvas>
      <Coast />
      <motion.g style={{ opacity: fade }}>
        {URBAN_LINES.map((d, index) => (
          <UrbanLine key={d} d={d} index={index} t={t} />
        ))}

        <motion.path
          d={CORRIDOR_221.d}
          stroke={YELLOW}
          strokeWidth={3}
          style={{ pathLength: corridor, opacity: corridorOpacity }}
        />
        <motion.g style={{ opacity: sweepOpacity }}>
          <motion.circle cx={sweepX} cy={sweepY} r={11} fill={YELLOW} fillOpacity={0.25} />
          <motion.circle cx={sweepX} cy={sweepY} r={4.5} fill={YELLOW} />
        </motion.g>
        <motion.circle
          cx={352}
          cy={14}
          r={5}
          fill={YELLOW}
          stroke={NAVY}
          strokeWidth={2.5}
          style={{ opacity: north }}
        />
        <motion.circle
          cx={302}
          cy={310}
          r={5}
          fill={YELLOW}
          stroke={NAVY}
          strokeWidth={2.5}
          style={{ opacity: south }}
        />
      </motion.g>
    </SceneCanvas>
  );
}

/** Animación del panel de cada capítulo de LandingFeatures. */
export function ChapterScene({
  scene,
  active,
}: {
  scene: SceneKind;
  active: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const playing = active && inView;

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0">
      {scene === "arrivals" ? <ArrivalsScene playing={playing} /> : null}
      {scene === "trip" ? <TripScene playing={playing} /> : null}
      {scene === "network" ? <NetworkScene playing={playing} /> : null}
    </div>
  );
}
