import { ImageResponse } from "next/og";

export const alt = "Bondi MDP — Colectivos en tiempo real en Mar del Plata";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
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
                    background: "#000000",
                    backgroundImage:
                        "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(0, 153, 255, 0.2), transparent 55%)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 20,
                        padding: "0 48px",
                    }}
                >
                    <div
                        style={{
                            background: "#0099ff",
                            borderRadius: 14,
                            padding: "14px 20px",
                            color: "#ffffff",
                            fontSize: 36,
                            fontWeight: 800,
                            fontFamily: "ui-sans-serif, system-ui, sans-serif",
                        }}
                    >
                        MDP
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <span
                            style={{
                                fontSize: 52,
                                fontWeight: 900,
                                color: "#ffffff",
                                letterSpacing: -1,
                                fontFamily: "ui-sans-serif, system-ui, sans-serif",
                                lineHeight: 1.05,
                            }}
                        >
                            Bondi MDP
                        </span>
                        <span
                            style={{
                                fontSize: 26,
                                color: "#0099ff",
                                fontFamily: "ui-sans-serif, system-ui, sans-serif",
                                fontWeight: 600,
                            }}
                        >
                            Colectivos en tiempo real · Mar del Plata
                        </span>
                    </div>
                </div>
            </div>
        ),
        { ...size }
    );
}
