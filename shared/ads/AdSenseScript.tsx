import Script from "next/script";

export const ADSENSE_CLIENT = "ca-pub-5101944874293370";

/**
 * Carga AdSense solo en páginas con contenido propio (home, blog, fichas de
 * línea, informes). Las pantallas de herramienta (consultar, mapas, cómo llego,
 * favoritos, cuenta, pagos) no lo incluyen: la política de AdSense no permite
 * anuncios en pantallas sin contenido del editor.
 */
export function AdSenseScript() {
    return (
        <Script
            id="adsense"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
        />
    );
}
