import { ImageResponse } from "next/og";
import { ARTICLES, getArticle } from "@features/blog/data/articles";

export const alt = "Blog — Bondi MDP";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
    return ARTICLES.map((a) => ({ slug: a.slug }));
}

export default async function OpenGraphImage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const article = getArticle(slug);
    const title = article?.title ?? "Blog — Bondi MDP";
    const section = article?.section ?? "Blog";

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
                    justifyContent: "space-between",
                    padding: 72,
                    background: "#0f2d4a",
                    backgroundImage:
                        "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(29, 117, 112, 0.4), transparent 55%)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        alignSelf: "flex-start",
                        background: "#1d7570",
                        borderRadius: 999,
                        padding: "12px 28px",
                    }}
                >
                    <span
                        style={{
                            fontSize: 28,
                            fontWeight: 700,
                            color: "#ffffff",
                            fontFamily: "ui-sans-serif, system-ui, sans-serif",
                            letterSpacing: -0.5,
                        }}
                    >
                        {section}
                    </span>
                </div>

                <span
                    style={{
                        fontSize: 56,
                        fontWeight: 900,
                        color: "#f0f4f8",
                        fontFamily: "ui-sans-serif, system-ui, sans-serif",
                        letterSpacing: -2,
                        lineHeight: 1.15,
                    }}
                >
                    {title}
                </span>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        fontSize: 40,
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
