import stopsData from "./stops.json";

export type Stop = {
    id: string;
    nombre: string;
    lat: number;
    lng: number;
    lineas: string[];
    banderas: string[];
};

const API_STOPS: Stop[] = stopsData as Stop[];

// eslint-disable-next-line import/first
import { MANUAL_STOPS } from "./manual";

export const STOPS: Stop[] = [...API_STOPS, ...MANUAL_STOPS];
