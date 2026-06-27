import { ImageResponse } from "next/og";

export const alt = "Bondi MDP — Colectivos en tiempo real en Mar del Plata";
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
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 20,
                        padding: "0 48px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            fontSize: 100,
                            fontWeight: 900,
                            fontStyle: "italic",
                            letterSpacing: -5,
                            textTransform: "uppercase",
                            fontFamily: '"Inter"',
                            color: "#f0f4f8",
                            lineHeight: 1,
                        }}
                    >
                        <span style={{ color: "#f0f4f8" }}>BONDI</span>
                        <span style={{ color: "#f9cd4a"}}>MDP</span>
                    </div>
                    <span
                        style={{
                            fontSize: 32,
                            color: "#289b95",
                            fontFamily: "ui-sans-serif, system-ui, sans-serif",
                            fontWeight: 600,
                        }}
                    >
                        Colectivos en tiempo real · Mar del Plata
                    </span>
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
