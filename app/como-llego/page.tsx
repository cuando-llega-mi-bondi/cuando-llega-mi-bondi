import type { Metadata } from "next";
import { Suspense } from "react";
import { ComoLlegoClient } from "./ComoLlegoClient";

export const metadata: Metadata = {
    title: "¿Cómo llego? — Bondi MDP",
    description:
        "Planificá un viaje en colectivo en Mar del Plata: origen, destino y opciones de líneas según el mapa estático MGP.",
};

export default function ComoLlegoPage() {
    return (
        <Suspense fallback={null}>
            <ComoLlegoClient />
        </Suspense>
    );
}
