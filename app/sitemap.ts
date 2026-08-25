import { MetadataRoute } from "next";
import { cacheLife } from "next/cache";
import { getLineas } from "@/lib/server/loadStaticDump";
import { lineaToSlug } from "@/lib/server/lineaSlug";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    "use cache";
    cacheLife("hours");

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
            url: `${baseUrl}/un-mes-en-numeros`,
            lastModified: now,
            changeFrequency: "monthly",
            priority: 0.5,
        },
        {
            url: `${baseUrl}/perfil`,
            lastModified: now,
            changeFrequency: "monthly",
            priority: 0.4,
        },
        {
            url: `${baseUrl}/anunciate`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.6,
        },
        {
            url: `${baseUrl}/privacidad`,
            lastModified: now,
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: `${baseUrl}/contacto`,
            lastModified: now,
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: `${baseUrl}/terminos`,
            lastModified: now,
            changeFrequency: "yearly",
            priority: 0.3,
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
