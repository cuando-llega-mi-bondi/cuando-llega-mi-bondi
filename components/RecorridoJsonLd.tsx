const BASE = "https://cuandollega-tawny.vercel.app";

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

export function RecorridoJsonLd() {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }}
        />
    );
}
