export function JsonLd() {
    const webApp = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "¿Cuándo Llega? MDP",
        "description": "Aplicación para consultar el tiempo de arribo de colectivos en Mar del Plata en tiempo real.",
        "applicationCategory": "TravelApplication",
        "operatingSystem": "All",
        "url": "https://cuandollega-tawny.vercel.app",
        "author": {
            "@type": "Organization",
            "name": "Cuándo Llega MDP Team"
        },
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "ARS"
        },
        "screenshot": "https://cuandollega-tawny.vercel.app/icon-512.png",
        "featureList": [
            "Tiempo real de arribos",
            "Recorridos completos",
            "Paradas favoritas",
            "Historial de búsquedas"
        ]
    };

    const organization = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Cuándo Llega MDP",
        "url": "https://cuandollega-tawny.vercel.app",
        "logo": "https://cuandollega-tawny.vercel.app/icon-512.png"
    };

    const webSite = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "¿Cuándo Llega? MDP",
        "url": "https://cuandollega-tawny.vercel.app"
    };

    const speakable = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "¿Cuándo Llega? MDP",
        "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": [".arrival-times", ".route-info"]
        },
        "url": "https://cuandollega-tawny.vercel.app"
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webApp) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webSite) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(speakable) }}
            />
        </>
    );
}
