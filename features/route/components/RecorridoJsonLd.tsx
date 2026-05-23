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

export function RecorridoJsonLd() {
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
        </>
    );
}
