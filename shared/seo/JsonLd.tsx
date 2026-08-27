export function JsonLd() {
    const appBase = {
        name: "Bondi MDP",
        description:
            "App gratuita para consultar el tiempo de arribo de colectivos en Mar del Plata en tiempo real.",
        applicationCategory: "TravelApplication",
        url: "https://bondimdp.com.ar",
        author: {
            "@type": "Organization",
            name: "Bondi MDP Team",
        },
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "ARS",
        },
        screenshot: "https://bondimdp.com.ar/screenshots/results.jpg",
        featureList: [
            "Tiempo real de arribos",
            "Recorridos completos",
            "Paradas favoritas",
            "Planificador de viajes",
        ],
    };

    const webApp = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        ...appBase,
        operatingSystem: "All",
        areaServed: {
            "@type": "City",
            name: "Mar del Plata",
        },
    };

    const organization = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Bondi MDP",
        "url": "https://bondimdp.com.ar",
        "logo": "https://bondimdp.com.ar/icon-512x512.png",
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer support",
            "email": "maticelizramos@gmail.com",
            "url": "https://bondimdp.com.ar/contacto",
            "availableLanguage": ["Spanish", "English"],
        },
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "Mar del Plata",
            "addressRegion": "Buenos Aires",
            "addressCountry": "AR",
        },
        "areaServed": {
            "@type": "City",
            "name": "Mar del Plata",
        },
        "sameAs": [
            "https://github.com/cuando-llega-mi-bondi/cuando-llega-mi-bondi",
        ],
    };

    const webSite = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Bondi MDP",
        "url": "https://bondimdp.com.ar",
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://bondimdp.com.ar/recorrido/{search_term_string}"
            },
            "query-input": "required name=search_term_string"
        }
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
        </>
    );
}
