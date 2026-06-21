import { MetadataRoute } from "next";
import { getLineas } from "@/lib/server/loadStaticDump";
import { lineaToSlug } from "@/lib/server/lineaSlug";

export const revalidate = 3600; // Cachear por 1 hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = "https://bondimdp.com.ar";
    const now = new Date();

    const staticRoutes: MetadataRoute.Sitemap = [
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
            url: `${baseUrl}/como-llego`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.7,
        },
        {
            url: `${baseUrl}/paradas-cerca`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.7,
        },
        {
            url: `${baseUrl}/acerca`,
            lastModified: now,
            changeFrequency: "monthly",
            priority: 0.5,
        },
        {
            url: `${baseUrl}/llms.txt`,
            lastModified: now,
            changeFrequency: "monthly",
            priority: 0.6,
        },
    ];

    // Dynamic routes: one page per bus line
    const lineas = await getLineas();
    const lineaRoutes: MetadataRoute.Sitemap = (lineas ?? []).map((linea) => ({
        url: `${baseUrl}/recorrido/${lineaToSlug(linea.Descripcion)}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    return [...staticRoutes, ...lineaRoutes];
}
