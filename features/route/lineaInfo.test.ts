import { describe, expect, it } from "vitest";
import type { Linea, Parada } from "@shared/types";
import type { StaticLineDump } from "@/lib/server/staticDumpTypes";
import { buildLineaInfo, formatearNombreMgp, nombreLineaVisible } from "@features/route/lineaInfo";

function linea(codigo: string, descripcion: string): Linea {
    return { CodigoLineaParada: codigo, Descripcion: descripcion, CodigoEntidad: "10", CodigoEmpresa: 13 };
}

function dump(meta: Linea, partial: Partial<StaticLineDump> = {}): StaticLineDump {
    return {
        meta,
        calles: [],
        interseccionesByCalle: {},
        paradasByCalleInterseccion: {},
        recorrido: { ramales: [], paradas: [] },
        ...partial,
    };
}

const parada: Parada = {
    Codigo: "1",
    Identificador: "P1",
    AbreviaturaBandera: "AL BOSQUE",
    LatitudParada: null,
    LongitudParada: null,
};

function paradaMapa(id: string, ramales: string[]) {
    return { id, codigo: id, label: id, lat: -38, lng: -57.5, ramales };
}

describe("formatearNombreMgp", () => {
    it("saca el sufijo de ciudad y pasa a formato título", () => {
        expect(formatearNombreMgp("AVENIDA JUAN B. JUSTO - MAR DEL PLATA")).toBe("Avenida Juan B. Justo");
        expect(formatearNombreMgp("25 DE MAYO - MAR DEL PLATA")).toBe("25 de Mayo");
    });

    it("deja en minúscula los conectores salvo al inicio", () => {
        expect(formatearNombreMgp("A BERUTI Y 228")).toBe("A Beruti y 228");
        expect(formatearNombreMgp("AL FARO X B")).toBe("Al Faro x B");
        expect(formatearNombreMgp("A AERO-AQUASOL")).toBe("A Aero-Aquasol");
    });
});

describe("nombreLineaVisible", () => {
    it("respeta números y sufijos de letra", () => {
        expect(nombreLineaVisible(linea("100", "521"))).toBe("521");
        expect(nombreLineaVisible(linea("126", "593C"))).toBe("593C");
        expect(nombreLineaVisible(linea("344", "BATAN"))).toBe("Batan");
        expect(nombreLineaVisible(linea("X", "221 COSTA AZUL"))).toBe("221 Costa Azul");
    });
});

describe("buildLineaInfo", () => {
    const l521 = linea("100", "521");
    const l522 = linea("101", "522");
    const l541 = linea("107", "541");
    const batan = linea("344", "BATAN");

    const dump521 = dump(l521, {
        calles: [
            { value: "1", label: "25 DE MAYO - MAR DEL PLATA" },
            { value: "2", label: "AVENIDA INDEPENDENCIA - MAR DEL PLATA" },
        ],
        interseccionesByCalle: {
            "1": [{ Codigo: "2", Descripcion: "AVENIDA INDEPENDENCIA - MAR DEL PLATA" }],
            "2": [
                { Codigo: "1", Descripcion: "25 DE MAYO - MAR DEL PLATA" },
                { Codigo: "3", Descripcion: "AVENIDA PEDRO LURO - MAR DEL PLATA" },
                { Codigo: "4", Descripcion: "SIN PARADA - MAR DEL PLATA" },
            ],
        },
        paradasByCalleInterseccion: {
            "1\t2": [parada],
            "2\t1": [parada],
            "2\t3": [parada],
        },
        recorrido: {
            ramales: [
                { key: "39", label: "AL BOSQUE", puntos: [] },
                { key: "40", label: "A BERUTI Y 228", puntos: [] },
                { key: "41", label: "AL BOSQUE", puntos: [] },
            ],
            paradas: [paradaMapa("a", ["AL BOSQUE"]), paradaMapa("b", ["al bosque ", "A BERUTI Y 228"])],
        },
    });

    const catalogo = [
        { linea: l521, dump: dump521 },
        { linea: l522, dump: dump(l522, { calles: [{ value: "2", label: "AVENIDA INDEPENDENCIA - MAR DEL PLATA" }] }) },
        { linea: l541, dump: dump(l541, { calles: [{ value: "9", label: "OTRA - MAR DEL PLATA" }] }) },
        { linea: batan, dump: null },
    ];

    it("arma carteles sin duplicados y cuenta paradas por cartel", () => {
        const info = buildLineaInfo(l521, dump521, catalogo);
        expect(info?.totalParadas).toBe(2);
        expect(info?.carteles).toEqual([
            { nombre: "Al Bosque", paradas: 2 },
            { nombre: "A Beruti y 228", paradas: 1 },
        ]);
    });

    it("lista calles con sus esquinas de parada, las más paradas primero", () => {
        const info = buildLineaInfo(l521, dump521, catalogo);
        expect(info?.calles).toEqual([
            { codigo: "2", nombre: "Avenida Independencia", esquinas: ["25 de Mayo", "Avenida Pedro Luro"] },
            { codigo: "1", nombre: "25 de Mayo", esquinas: ["Avenida Independencia"] },
        ]);
    });

    it("combina solo con líneas que comparten calles", () => {
        const info = buildLineaInfo(l521, dump521, catalogo);
        expect(info?.combinaciones).toEqual([{ linea: l522, callesEnComun: ["Avenida Independencia"] }]);
    });

    it("devuelve null sin datos útiles", () => {
        expect(buildLineaInfo(l521, dump(l521), catalogo)).toBeNull();
        expect(buildLineaInfo(l521, { ...dump521, error: "timeout" }, catalogo)).toBeNull();
    });
});
