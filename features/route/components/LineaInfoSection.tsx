import Link from "next/link";
import type { Linea } from "@shared/types";
import { nombreLineaVisible, type LineaInfo } from "@features/route/lineaInfo";
import { lineaToSlug } from "@/lib/server/lineaSlug";

const MAX_CALLES_EN_COMUN = 4;

function contar(n: number, singular: string, plural: string): string {
    return `${n.toLocaleString("es-AR")} ${n === 1 ? singular : plural}`;
}

const h2 = "mt-10 font-display text-lg font-semibold tracking-[-0.02em] text-foreground";
const link = "text-secondary underline-offset-2 hover:underline";

interface LineaInfoSectionProps {
    linea: Linea;
    info: LineaInfo | null;
    otrasLineas: Linea[];
}

/**
 * Ficha de texto visible debajo de RecorridoClient en `/recorrido/[linea]`.
 * Server component: llega en el HTML inicial (el cliente arranca dentro de un
 * Suspense por useSearchParams). Con el mapa abierto se oculta (globals.css).
 */
export function LineaInfoSection({ linea, info, otrasLineas }: LineaInfoSectionProps) {
    const nombre = nombreLineaVisible(linea);

    return (
        <section
            data-linea-info
            aria-labelledby="linea-info-title"
            className="border-t border-border bg-background pb-nav lg:pl-60 lg:pb-16"
        >
            <div className="mx-auto max-w-3xl px-4 pt-10 lg:px-8">
                <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Ficha de la línea
                </p>
                <h1
                    id="linea-info-title"
                    className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl"
                >
                    Línea {nombre} de colectivo en Mar del Plata: recorrido, calles y paradas
                </h1>

                {info && (
                    <>
                        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                            La línea {nombre} tiene{" "}
                            {contar(info.totalParadas, "parada registrada", "paradas registradas")} y pasa
                            por {contar(info.calles.length, "calle", "calles")} de Mar del Plata.{" "}
                            {info.carteles.length > 1
                                ? `Circula con ${info.carteles.length} carteles distintos según el ramal y el sentido del viaje.`
                                : info.carteles.length === 1
                                  ? `Circula con el cartel «${info.carteles[0].nombre}».`
                                  : null}
                        </p>

                        <dl className="mt-6 grid grid-cols-3 gap-2.5">
                            {[
                                ["Paradas", info.totalParadas],
                                ["Calles", info.calles.length],
                                ["Carteles", info.carteles.length],
                            ].map(([label, valor]) => (
                                <div key={label} className="rounded-2xl border border-border bg-card px-3.5 py-3">
                                    <dt className="text-[11px] text-muted-foreground">{label}</dt>
                                    <dd className="font-display text-xl font-semibold text-foreground">
                                        {valor.toLocaleString("es-AR")}
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        {info.carteles.length > 0 && (
                            <>
                                <h2 className={h2}>Carteles y ramales de la línea {nombre}</h2>
                                <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                                    El cartel del frente del colectivo indica hacia dónde va. Estos son los que
                                    usa la {nombre}, con la cantidad de paradas de cada uno:
                                </p>
                                <ul className="mt-3 flex flex-wrap gap-2">
                                    {info.carteles.map((cartel) => (
                                        <li
                                            key={cartel.nombre}
                                            className="rounded-full border border-border bg-muted px-3 py-1 text-[13px] text-foreground"
                                        >
                                            {cartel.nombre}
                                            {cartel.paradas > 0 && (
                                                <span className="text-muted-foreground">
                                                    {" "}
                                                    · {contar(cartel.paradas, "parada", "paradas")}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}

                        <h2 className={h2}>Calles por las que pasa la línea {nombre}</h2>
                        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                            Ordenadas por cantidad de esquinas con parada. Son las mismas calles y esquinas que
                            vas a elegir en <Link href="/consultar" className={link}>Consultar</Link> para ver
                            cuándo llega el colectivo.
                        </p>
                        <ul className="mt-2 divide-y divide-border">
                            {info.calles.map((calle) => (
                                <li key={calle.codigo} className="py-3">
                                    <h3 className="text-[15px] font-semibold text-foreground">{calle.nombre}</h3>
                                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                                        {calle.esquinas.length > 0
                                            ? contar(calle.esquinas.length, "esquina con parada", "esquinas con parada")
                                            : "Pasa sin paradas registradas"}
                                    </p>
                                    {calle.esquinas.length > 0 && (
                                        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                                            {calle.esquinas.join(" · ")}
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>

                        {info.combinaciones.length > 0 && (
                            <>
                                <h2 className={h2}>Líneas que comparten recorrido con la {nombre}</h2>
                                <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                                    Las líneas con más calles en común. Sirven para combinar o como alternativa si
                                    la {nombre} tarda.
                                </p>
                                <ul className="mt-3 space-y-2.5">
                                    {info.combinaciones.map(({ linea: otra, callesEnComun }) => (
                                        <li key={otra.CodigoLineaParada} className="text-[14px] leading-relaxed">
                                            <Link
                                                href={`/recorrido/${lineaToSlug(otra.Descripcion)}`}
                                                className={`${link} font-semibold`}
                                            >
                                                Línea {nombreLineaVisible(otra)}
                                            </Link>
                                            <span className="text-muted-foreground">
                                                {" "}
                                                — {contar(callesEnComun.length, "calle en común", "calles en común")}:{" "}
                                                {callesEnComun.slice(0, MAX_CALLES_EN_COMUN).join(", ")}
                                                {callesEnComun.length > MAX_CALLES_EN_COMUN ? " y más" : ""}.
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </>
                )}

                <h2 className={h2}>Cómo saber cuándo llega la línea {nombre}</h2>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[14px] leading-relaxed text-muted-foreground">
                    <li>
                        Entrá a <Link href="/consultar" className={link}>Consultar</Link> y elegí la línea {nombre}.
                    </li>
                    <li>Elegí la calle y la esquina de tu parada.</li>
                    <li>Vas a ver cuánto falta para los próximos colectivos, en tiempo real.</li>
                </ol>
                <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                    Si no sabés qué línea te sirve, probá <Link href="/como-llego" className={link}>Cómo llego</Link>{" "}
                    o buscá las <Link href="/paradas-cerca" className={link}>paradas cerca tuyo</Link>.
                </p>

                {otrasLineas.length > 0 && (
                    <nav aria-labelledby="otras-lineas-title">
                        <h2 id="otras-lineas-title" className={h2}>
                            Otras líneas de colectivo en Mar del Plata
                        </h2>
                        <ul className="mt-3 flex flex-wrap gap-2">
                            {otrasLineas.map((otra) => (
                                <li key={otra.CodigoLineaParada}>
                                    <Link
                                        href={`/recorrido/${lineaToSlug(otra.Descripcion)}`}
                                        className="inline-flex rounded-full border border-border bg-muted px-3 py-1 text-[13px] text-foreground transition hover:border-secondary"
                                    >
                                        Línea {nombreLineaVisible(otra)}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                )}

                <p className="mt-10 text-[12px] leading-relaxed text-muted-foreground/80">
                    Fuente: datos oficiales de paradas y recorridos de la Municipalidad de General Pueyrredon
                    (MGP). Los recorridos pueden cambiar por obras o desvíos temporales.
                </p>
            </div>
        </section>
    );
}
