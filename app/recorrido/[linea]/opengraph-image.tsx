import { ImageResponse } from "next/og";
import { getLineas } from "@/lib/server/loadStaticDump";
import { lineaToSlug } from "@/lib/server/lineaSlug";

export const alt = "Recorrido de colectivo en Mar del Plata — Bondi MDP";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
    const lineas = await getLineas();
    if (!lineas) return [{ linea: "__placeholder__" }];
    return lineas.map((l) => ({
        linea: lineaToSlug(l.Descripcion),
    }));
}

export default async function OpenGraphImage({
    params,
}: {
    params: Promise<{ linea: string }>;
}) {
    const { linea: slug } = await params;

    const interBlackItalicData = await fetch(
        "https://fonts.gstatic.com/s/inter/v20/UcCM3FwrK3iLTcvneQg7Ca725JhhKnNqk4j1ebLhAm8SrXTccNxhjZ-Ck-8.ttf"
    ).then((res) => res.arrayBuffer());

    // Resolve slug to line name
    const lineas = await getLineas();
    const lineaInfo = lineas?.find(
        (l) => lineaToSlug(l.Descripcion) === slug
    );
    const nombre = lineaInfo?.Descripcion ?? slug.toUpperCase();

    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#0f2d4a",
                    backgroundImage:
                        "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(29, 117, 112, 0.4), transparent 55%)",
                }}
            >
                {/* Line number badge */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#1d7570",
                        borderRadius: 20,
                        padding: "24px 56px",
                        marginBottom: 32,
                    }}
                >
                    <span
                        style={{
                            fontSize: 96,
                            fontWeight: 900,
                            color: "#ffffff",
                            fontFamily: "ui-sans-serif, system-ui, sans-serif",
                            letterSpacing: -2,
                            lineHeight: 1,
                        }}
                    >
                        {nombre}
                    </span>
                </div>

                {/* Title */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 12,
                    }}
                >
                    <span
                        style={{
                            fontSize: 36,
                            fontWeight: 700,
                            color: "#f0f4f8",
                            fontFamily: "ui-sans-serif, system-ui, sans-serif",
                            letterSpacing: -0.5,
                        }}
                    >
                        Recorrido en Mar del Plata
                    </span>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            fontSize: 48,
                            fontWeight: 900,
                            fontStyle: "italic",
                            letterSpacing: -2,
                            textTransform: "uppercase",
                            fontFamily: '"Inter"',
                            color: "#f0f4f8",
                            lineHeight: 1,
                        }}
                    >
                        <span style={{ color: "#f0f4f8" }}>BONDI</span>
                        <span style={{ color: "#f9cd4a"}}>MDP</span>
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
            fonts: [
                {
                    name: "Inter",
                    data: interBlackItalicData,
                    style: "italic",
                    weight: 900,
                },
            ],
        }
    );
}

