import Link from "next/link";
import { notFound } from "next/navigation";
import { LINES } from "@/lib/static/lines";
import { STOPS, type Stop } from "@/lib/static/stops";
import { ParadaList } from "./_components/ParadaList";

export default async function LineaPage({
    params,
    searchParams,
}: {
    params: Promise<{ codigo: string }>;
    searchParams: Promise<{ b?: string }>;
}) {
    const { codigo } = await params;
    const { b } = await searchParams;
    const line = LINES.find((l) => l.descripcion === codigo);
    if (!line) notFound();

    const banderaActiva =
        line.banderas.find((bb) => bb.nombre === b) ?? line.banderas[0] ?? null;

    const stopsById = new Map<string, Stop>(STOPS.map((s) => [s.id, s]));
    const paradasBandera = banderaActiva
        ? banderaActiva.paradaIds
              .map((id) => stopsById.get(id))
              .filter((s): s is Stop => Boolean(s))
        : [];

    return (
        <div className="space-y-5">
            <header className="px-5 pt-2">
                <Link
                    href="/v2/buscar"
                    className="font-mono text-[10.5px] uppercase tracking-wider text-[#6B7080] hover:text-[#0099FF]"
                >
                    ← Volver a buscar
                </Link>
                <div className="mt-3 flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFD60A] font-display text-[15px] font-bold text-[#0F1115]">
                        {line.descripcion}
                    </span>
                    <div className="min-w-0">
                        <h1 className="font-display text-[24px] font-semibold leading-tight text-[#0F1115]">
                            Línea {line.descripcion}
                        </h1>
                        <p className="font-mono text-[11px] text-[#6B7080]">
                            {line.paradas.toLocaleString("es-AR")} paradas ·{" "}
                            {line.banderas.length}{" "}
                            {line.banderas.length === 1 ? "destino" : "destinos"}
                        </p>
                    </div>
                </div>
            </header>

            {line.banderas.length > 0 ? (
                <div className="px-5">
                    <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#6B7080]">
                        Sentido
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {line.banderas.map((bandera) => {
                            const isActive = banderaActiva?.nombre === bandera.nombre;
                            return (
                                <Link
                                    key={bandera.nombre}
                                    href={`/v2/linea/${line.descripcion}?b=${encodeURIComponent(bandera.nombre)}`}
                                    scroll={false}
                                    className={`flex shrink-0 flex-col items-start rounded-xl border px-3 py-2 transition ${
                                        isActive
                                            ? "border-[#0F1115] bg-[#0F1115] text-white"
                                            : "border-[#E8E2D2] bg-white text-[#0F1115] hover:border-[#0099FF]"
                                    }`}
                                >
                                    <span className="font-mono text-[9.5px] uppercase tracking-wider opacity-60">
                                        →
                                    </span>
                                    <span className="font-display text-[13px] font-semibold leading-tight">
                                        {bandera.nombre}
                                    </span>
                                    <span className="font-mono text-[10px] opacity-70">
                                        {bandera.paradaIds.length} paradas
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ) : null}

            {banderaActiva ? (
                <div className="px-5">
                    <ParadaList
                        paradas={paradasBandera}
                        label={`Paradas de ${banderaActiva.nombre}`}
                    />
                </div>
            ) : null}
        </div>
    );
}
