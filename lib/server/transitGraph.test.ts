import { describe, expect, it } from "vitest";

import {
    buildPolylineGeometry,
    buildTransitModels,
    orderStopsAlongPolyline,
    projectStopOntoPolyline,
    stopsOfRamal,
} from "@/lib/server/transitGraph";
import type { LineRow } from "@/lib/server/transitGraph";
import type { ParadaMapa, PuntoRecorrido, RamalData } from "@features/route/types";
import type { Linea } from "@shared/types";

/** Metros por grado de longitud en la aproximación plana del grafo (lat -38). */
const M_PER_DEG_LNG = Math.cos((38 * Math.PI) / 180) * 111_320;

function punto(lat: number, lng: number): PuntoRecorrido {
    return {
        Descripcion: "",
        AbreviaturaBanderaSMP: "",
        AbreviaturaLineaSMP: "",
        IsPuntoPaso: true,
        Latitud: lat,
        Longitud: lng,
    };
}

function parada(
    id: string,
    lat: number,
    lng: number,
    ramales: string[] = [""],
): ParadaMapa {
    return { id, codigo: id, label: id, lat, lng, ramales };
}

/** Ramal recto oeste→este sobre lat -38, un punto cada 0,001° (~88 m). */
function ramalRecto(key: string, vertices: number): RamalData {
    return {
        key,
        label: key,
        puntos: Array.from({ length: vertices }, (_, i) =>
            punto(-38.0, -57.55 + i * 0.001),
        ),
    };
}

describe("buildPolylineGeometry", () => {
    it("acumula la longitud de arco segmento a segmento", () => {
        const segs = buildPolylineGeometry(ramalRecto("r", 3).puntos);
        const segMeters = 0.001 * M_PER_DEG_LNG;
        expect(segs).toHaveLength(2);
        expect(segs[0]!.cumArc).toBe(0);
        expect(segs[0]!.len).toBeCloseTo(segMeters, 0);
        expect(segs[1]!.cumArc).toBeCloseTo(segMeters, 0);
    });

    it("con menos de dos puntos no hay segmentos", () => {
        expect(buildPolylineGeometry([punto(-38, -57.55)])).toEqual([]);
    });
});

describe("projectStopOntoPolyline", () => {
    const segs = buildPolylineGeometry(ramalRecto("r", 3).puntos);
    const total = 0.002 * M_PER_DEG_LNG;

    it("una parada sobre la traza proyecta con perpendicular ~0", () => {
        const proj = projectStopOntoPolyline(-38.0, -57.549, segs)!;
        expect(proj.perpMeters).toBeCloseTo(0, 0);
        expect(proj.arcMeters).toBeCloseTo(total / 2, 0);
    });

    it("una parada desplazada conserva el arco y mide la perpendicular", () => {
        // 50 m al norte del medio del primer segmento.
        const proj = projectStopOntoPolyline(
            -38.0 + 50 / 111_320,
            -57.5495,
            segs,
        )!;
        expect(proj.perpMeters).toBeCloseTo(50, 0);
        expect(proj.arcMeters).toBeCloseTo(total / 4, 0);
    });

    it("más allá del final, el arco satura en el largo total", () => {
        const proj = projectStopOntoPolyline(-38.0, -57.547, segs)!;
        expect(proj.arcMeters).toBeCloseTo(total, 0);
        expect(proj.perpMeters).toBeCloseTo(0.001 * M_PER_DEG_LNG, 0);
    });

    it("sin segmentos devuelve null", () => {
        expect(projectStopOntoPolyline(-38.0, -57.55, [])).toBeNull();
    });
});

describe("orderStopsAlongPolyline", () => {
    const ramal = ramalRecto("ida", 6); // -57.55 → -57.545, ~439 m

    it("ordena por longitud de arco aunque lleguen mezcladas", () => {
        const paradas = [
            parada("S3", -38.0, -57.546),
            parada("S1", -38.0, -57.5499),
            parada("S2", -38.0, -57.5475),
        ];
        expect(orderStopsAlongPolyline(paradas, ramal)).toEqual(["S1", "S2", "S3"]);
    });

    it("descarta paradas a más del umbral perpendicular (son de otra variante)", () => {
        const lejana = parada("LEJOS", -38.0 + 200 / 111_320, -57.548);
        const cercana = parada("CERCA", -38.0, -57.5495);
        expect(orderStopsAlongPolyline([lejana, cercana], ramal)).toEqual(["CERCA"]);
        // Con un umbral más laxo la misma parada entra.
        expect(orderStopsAlongPolyline([lejana, cercana], ramal, 300)).toEqual([
            "CERCA",
            "LEJOS",
        ]);
    });

    it("descarta paradas en (0,0) y deduplica ids", () => {
        const paradas = [
            parada("CERO", 0, 0),
            parada("DUP", -38.0, -57.5495),
            parada("DUP", -38.0, -57.54951),
        ];
        expect(orderStopsAlongPolyline(paradas, ramal)).toEqual(["DUP"]);
    });

    it("un ramal sin polilínea no ordena nada", () => {
        const sinPuntos: RamalData = { key: "x", label: "x", puntos: [] };
        expect(orderStopsAlongPolyline([parada("S1", -38, -57.55)], sinPuntos)).toEqual(
            [],
        );
    });
});

describe("stopsOfRamal", () => {
    const ramal: RamalData = { key: "R1", label: "Ida", puntos: [] };

    it("matchea por label, por key o por ramal vacío", () => {
        const paradas = [
            parada("porLabel", -38, -57.55, ["Ida"]),
            parada("porKey", -38, -57.55, ["R1"]),
            parada("comodin", -38, -57.55, [""]),
            parada("otra", -38, -57.55, ["Vuelta"]),
        ];
        expect(stopsOfRamal(paradas, ramal).map((p) => p.id)).toEqual([
            "porLabel",
            "porKey",
            "comodin",
        ]);
    });
});

describe("buildTransitModels", () => {
    function lineRow(
        cod: string,
        desc: string,
        ramal: RamalData,
        paradas: ParadaMapa[],
    ): LineRow {
        const linea: Linea = {
            CodigoLineaParada: cod,
            Descripcion: desc,
            CodigoEntidad: "10",
            CodigoEmpresa: 1,
        };
        return {
            linea,
            row: {
                meta: linea,
                calles: [],
                interseccionesByCalle: {},
                paradasByCalleInterseccion: {},
                recorrido: { ramales: [ramal], paradas },
            },
        };
    }

    // Línea 1 oeste→este por lat -38; línea 2 comparte la parada J.
    const ramal1 = ramalRecto("ida-1", 6);
    const paradas1 = [
        parada("P1", -38.0, -57.5499),
        parada("J", -38.0, -57.5475),
        parada("P3", -38.0, -57.546),
        parada("FANTASMA", 0, 0),
    ];
    const ramal2: RamalData = {
        key: "ida-2",
        label: "ida-2",
        puntos: [punto(-38.004, -57.5475), punto(-38.0, -57.5475)],
    };
    const paradas2 = [
        parada("Q1", -38.003, -57.5475),
        parada("J", -38.0, -57.5475),
    ];

    const { graph, paradas } = buildTransitModels([
        lineRow("L1", "Línea 1", ramal1, paradas1),
        lineRow("L2", "Línea 2", ramal2, paradas2),
    ]);

    it("ignora filas sin dump y paradas en (0,0)", () => {
        expect(paradas.some((p) => p.identificador === "FANTASMA")).toBe(false);
        const { graph: vacio } = buildTransitModels([
            { linea: { CodigoLineaParada: "X", Descripcion: "X", CodigoEntidad: "1", CodigoEmpresa: 1 }, row: null },
        ]);
        expect(vacio.sequences).toEqual([]);
    });

    it("arma una secuencia ordenada por ramal", () => {
        expect(graph.sequences).toHaveLength(2);
        const seq1 = graph.sequences.find((s) => s.codLinea === "L1")!;
        expect(seq1.paradaIds).toEqual(["P1", "J", "P3"]);
        const seq2 = graph.sequences.find((s) => s.codLinea === "L2")!;
        expect(seq2.paradaIds).toEqual(["Q1", "J"]);
    });

    it("deduplica la parada compartida y agrega ambas líneas", () => {
        const j = graph.paradas.get("J")!;
        expect(j.lineas.map((l) => l.codigoLineaParada).sort()).toEqual(["L1", "L2"]);
    });

    it("indexa secuencias por parada con su posición", () => {
        const refs = graph.sequencesByParada.get("J")!;
        expect(refs).toHaveLength(2);
        const seq1Idx = graph.sequences.findIndex((s) => s.codLinea === "L1");
        const refL1 = refs.find((r) => r.sequenceIdx === seq1Idx)!;
        expect(refL1.positionInSequence).toBe(1);
    });

    it("conecta a pie las paradas a menos de 300 m", () => {
        // P1 → J: ~210 m, vecinas; P1 → P3: ~342 m, no.
        const vecinasDeP1 = graph.walkNeighbors.get("P1")!.map((n) => n.toParadaId);
        expect(vecinasDeP1).toContain("J");
        expect(vecinasDeP1).not.toContain("P3");
    });

    it("conecta pares este-oeste de ~280 m aunque crucen dos bordes de celda", () => {
        // Regresión de GRID_CELL_DEG: con celdas de 0.003° (~263 m de ancho en
        // longitud a lat -38) estos ids caían a dos celdas de distancia y el
        // vecino se perdía pese a estar dentro del radio de 300 m.
        const { graph: g } = buildTransitModels([
            lineRow("LW", "Línea W", ramalRecto("ida-w", 6), [
                parada("W1", -38.0, -57.54901),
                parada("W2", -38.0, -57.545818),
            ]),
        ]);
        expect(g.walkNeighbors.get("W1")?.map((n) => n.toParadaId)).toContain("W2");
    });
});
