import { ImageResponse } from "next/og";

export const alt = "Blog — Bondi MDP";
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
                        fontSize: 44,
                        fontWeight: 700,
                        color: "#f0f4f8",
                        fontFamily: "ui-sans-serif, system-ui, sans-serif",
                        letterSpacing: -0.5,
                        marginBottom: 20,
                    }}
                >
                    Blog
                </span>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        fontSize: 64,
                        fontWeight: 900,
                        fontStyle: "italic",
                        letterSpacing: -2,
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
