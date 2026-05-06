import linesData from "./lines.json";

export type Bandera = {
    nombre: string;
    paradaIds: string[];
};

export type Line = {
    codigo: string;
    descripcion: string;
    paradas: number;
    banderas: Bandera[];
};

export const LINES: Line[] = linesData as Line[];
