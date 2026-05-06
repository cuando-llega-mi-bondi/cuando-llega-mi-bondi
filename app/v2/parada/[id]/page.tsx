import Link from "next/link";
import { notFound } from "next/navigation";
import { STOPS } from "@/lib/static/stops";
import { StopRouting } from "./_components/StopRouting";

export default async function ParadaPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const stop = STOPS.find((s) => s.id === decodeURIComponent(id));
    if (!stop) notFound();

    return (
        <div className="space-y-5">
            <header className="px-5 pt-2">
                <Link
                    href="/v2/buscar"
                    className="font-mono text-[10.5px] uppercase tracking-wider text-[#6B7080] hover:text-[#0099FF]"
                >
                    ← Volver
                </Link>
                <div className="mt-3 flex items-start gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#0099FF] text-white">
                        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                            <path
                                d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"
                                fill="currentColor"
                            />
                        </svg>
                    </span>
                    <div className="min-w-0">
                        <p className="font-mono text-[10.5px] uppercase tracking-wider text-[#6B7080]">
                            Parada
                        </p>
                        <h1 className="mt-0.5 font-display text-[20px] font-semibold leading-tight text-[#0F1115]">
                            {stop.nombre}
                        </h1>
                    </div>
                </div>
            </header>

            <StopRouting stopLat={stop.lat} stopLng={stop.lng} />

            <div className="px-5">
                <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#6B7080]">
                    Líneas que pasan ({stop.lineas.length})
                </p>
                <div className="grid grid-cols-3 gap-2">
                    {stop.lineas.map((linea) => (
                        <Link
                            key={linea}
                            href={`/v2/linea/${linea}`}
                            className="grid place-items-center rounded-xl border border-[#E8E2D2] bg-[#FFD60A] py-3 font-display text-[16px] font-bold text-[#0F1115] transition hover:bg-[#0F1115] hover:text-[#FFD60A]"
                        >
                            {linea}
                        </Link>
                    ))}
                </div>
            </div>

            {stop.banderas.length > 0 ? (
                <div className="px-5">
                    <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#6B7080]">
                        Destinos posibles
                    </p>
                    <div className="rounded-2xl border border-[#E8E2D2] bg-white p-4">
                        <ul className="space-y-1.5 font-mono text-[12px] text-[#0F1115]">
                            {stop.banderas.map((b) => (
                                <li key={b} className="flex items-center gap-2">
                                    <span className="text-[#0099FF]">→</span>
                                    {b}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : null}

            <div className="px-5">
                <div className="rounded-2xl border border-dashed border-[#E8E2D2] bg-white/50 p-4 text-center">
                    <p className="font-mono text-[10.5px] uppercase tracking-wider text-[#6B7080]">
                        Próximos arribos
                    </p>
                    <p className="mt-2 font-display text-[14px] text-[#6B7080]">
                        Próximamente — requiere conexión al MGP en vivo.
                    </p>
                </div>
            </div>
        </div>
    );
}
