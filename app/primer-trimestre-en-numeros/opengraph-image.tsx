import { ImageResponse } from "next/og";

export const alt = "Bondi MDP: el primer trimestre en números. 22.893 usuarios activos. 763.000 vistas.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
    const interBlackItalicData = await fetch(
        "https://fonts.gstatic.com/s/inter/v20/UcCM3FwrK3iLTcvneQg7Ca725JhhKnNqk4j1ebLhAm8SrXTccNxhjZ-Ck-8.ttf"
    ).then((res) => res.arrayBuffer());

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
                <span
                    style={{
                        fontSize: 32,
                        fontWeight: 600,
                        color: "#289b95",
                        fontFamily: "ui-sans-serif, system-ui, sans-serif",
                        marginBottom: 8,
                    }}
                >
                    El primer trimestre en números
                </span>
                <span
                    style={{
                        fontSize: 128,
                        fontWeight: 900,
                        color: "#f9cd4a",
                        fontFamily: "ui-sans-serif, system-ui, sans-serif",
                        letterSpacing: -3,
                        lineHeight: 1,
                    }}
                >
                    22.893
                </span>
                <span
                    style={{
                        fontSize: 36,
                        fontWeight: 600,
                        color: "#f0f4f8",
                        fontFamily: "ui-sans-serif, system-ui, sans-serif",
                        marginBottom: 36,
                    }}
                >
                    usuarios activos en Mar del Plata
                </span>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        fontSize: 48,
                        fontWeight: 900,
                        fontStyle: "italic",
                        letterSpacing: -1.5,
                        textTransform: "uppercase",
                        fontFamily: '"Inter"',
                        lineHeight: 1,
                    }}
                >
                    <span style={{ color: "#f0f4f8" }}>BONDI</span>
                    <span style={{ color: "#f9cd4a" }}>MDP</span>
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
