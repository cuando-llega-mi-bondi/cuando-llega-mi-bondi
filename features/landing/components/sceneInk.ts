// Las escenas viven sobre el panel navy en ambos temas, como el hero: misma paleta fija.
// Teal claro y no el #1d7570 de la marca, que cae a ~2:1 sobre navy.
export const INK = "#f0f4f8";
export const LINE = "#8ba4bb";
export const TEAL = "#289b95";
export const YELLOW = "#f9cd4a";
export const NAVY = "#0f2d4a";

// Corchetes de enfoque alrededor de un punto: [ ]
export function bracketPath(cx: number, cy: number, half: number) {
  const arm = Math.min(9, half * 0.45);
  const l = cx - half;
  const r = cx + half;
  const t = cy - half;
  const b = cy + half;
  return [
    `M${l} ${t + arm} V${t} H${l + arm}`,
    `M${r - arm} ${t} H${r} V${t + arm}`,
    `M${r} ${b - arm} V${b} H${r - arm}`,
    `M${l + arm} ${b} H${l} V${b - arm}`,
  ].join(" ");
}
