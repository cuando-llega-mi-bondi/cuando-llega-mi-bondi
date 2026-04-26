import { MetadataRoute } from "next";
export const revalidate = 3600; // Cachear por 1 hora

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://cuandollega-tawny.vercel.app";
    const now = new Date();

    return [
        {
            url: baseUrl,
            lastModified: now,
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: `${baseUrl}/recorrido`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/llms.txt`,
            lastModified: now,
            changeFrequency: "monthly",
            priority: 0.6,
        },
    ];
}
