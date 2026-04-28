import type { Linea } from "./types";

export interface ManualRouteConfig {
  line: Linea;
  geoJsonPath: string;
}

export const MANUAL_ROUTES: ManualRouteConfig[] = [
  {
    line: {
      CodigoLineaParada: "221",
      Descripcion: "COSTA AZUL (Serena - Mar Chiquita)",
      CodigoEntidad: "MANUAL",
      CodigoEmpresa: 0,
      isManual: true,
    },
    geoJsonPath: "/serena-marChiquita.geojson",
  },
];

export const MANUAL_LINES: Linea[] = MANUAL_ROUTES.map(r => r.line);
