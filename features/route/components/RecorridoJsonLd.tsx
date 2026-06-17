import { getLineas } from "@/lib/server/loadStaticDump";
import { lineaToSlug } from "@/lib/server/lineaSlug";

const BASE = "https://www.bondimdp.com.ar";

const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: BASE,
        },
        {
            "@type": "ListItem",
            position: 2,
            name: "Recorridos",
            item: `${BASE}/recorrido`,
        },
    ],
};

const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Recorridos de colectivos en Mar del Plata",
    description:
        "Mapa interactivo con recorridos y paradas de todas las líneas de bondi en Mar del Plata.",
    url: `${BASE}/recorrido`,
    isPartOf: {
        "@type": "WebSite",
        name: "Bondi MDP",
        url: BASE,
    },
    about: {
        "@type": "BusStop",
        name: "Paradas de colectivo en Mar del Plata",
        address: {
            "@type": "PostalAddress",
            addressLocality: "Mar del Plata",
            addressRegion: "Buenos Aires",
            addressCountry: "AR",
        },
    },
};

export async function RecorridoJsonLd() {
    const lineas = await getLineas();

    const itemList = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Líneas de colectivo en Mar del Plata",
        description:
            "Todas las líneas de colectivo disponibles en Mar del Plata con recorridos y paradas.",
        numberOfItems: lineas?.length ?? 0,
        itemListElement: (lineas ?? []).map((linea, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: `Línea ${linea.Descripcion}`,
            url: `${BASE}/recorrido/${lineaToSlug(linea.Descripcion)}`,
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webPage) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
            />
        </>
    );
}
