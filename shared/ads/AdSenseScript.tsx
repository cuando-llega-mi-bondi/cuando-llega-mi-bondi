import Script from "next/script";

export const ADSENSE_CLIENT = "ca-pub-5101944874293370";

/**
 * Script de AdSense. Solo lo carga AdSenseUnit junto a cada bloque manual: los
 * anuncios automáticos están apagados en el panel, así que una página sin
 * bloque no necesita el script.
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
