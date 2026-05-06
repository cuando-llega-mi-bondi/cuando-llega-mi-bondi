import stopsData from "./stops.json";

export type Stop = {
    id: string;
    nombre: string;
    lat: number;
    lng: number;
    lineas: string[];
    banderas: string[];
};

export const STOPS: Stop[] = stopsData as Stop[];
