import type { Linea } from "./types";

/** Un sentido del recorrido manual (un GeoJSON por archivo). */
export interface ManualRamalConfig {
  key: string;
  label: string;
  geoJsonPath: string;
}

export interface ManualRouteConfig {
  line: Linea;
  /** Varias idas/vueltas: uno por GeoJSON. Si no hay, se usa `geoJsonPath`. */
  ramales?: ManualRamalConfig[];
  /** Un solo GeoJSON (compatibilidad). Ignorado si `ramales` tiene elementos. */
  geoJsonPath?: string;
}

export const MANUAL_ROUTES: ManualRouteConfig[] = [
  {
    line: {
      CodigoLineaParada: "221",
      Descripcion: "COSTA AZUL",
      CodigoEntidad: "MANUAL",
      CodigoEmpresa: 0,
      isManual: true,
    },
    ramales: [
      {
        key: "serena_mch",
        label: "Serena → Mar Chiquita",
        geoJsonPath: "/serena-marChiquita.geojson",
      },
      {
        key: "mch_serena",
        label: "Mar Chiquita → Serena",
        geoJsonPath: "/marChiquita-Serena.geojson",
      },
    ],
  },
];

export const MANUAL_LINES: Linea[] = MANUAL_ROUTES.map(r => r.line);
