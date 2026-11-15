import Script from "next/script";

/**
 * Loader de Clever Advertising. Es el snippet tal cual lo entrega el panel:
 * inyecta su script principal, que decide solo dónde y qué anuncios mostrar,
 * así que va una vez en el layout raíz y no necesita bloques manuales.
 */
export function CleverCoreScript() {
    return (
        <Script
            id="clever-core"
            strategy="afterInteractive"
            data-cfasync="false"
            dangerouslySetInnerHTML={{
                __html: `
(function (document, window) {
var a, c = document.createElement("script"), f = window.frameElement;
c.id = "CleverCoreLoader108505";
c.src = "https://scripts.cleverwebserver.com/a2cf63ca4d6599be06b852dd252d5bef.js";
c.async = !0;
c.type = "text/javascript";
c.setAttribute("data-target", window.name || (f && f.getAttribute("id")));
c.setAttribute("data-callback", "put-your-callback-function-here");
c.setAttribute("data-callback-url-click", "put-your-click-macro-here");
c.setAttribute("data-callback-url-view", "put-your-view-macro-here");
try {
a = parent.document.getElementsByTagName("script")[0] ||
document.getElementsByTagName("script")[0];
} catch (e) {
a = !1;
}
a || (a = document.getElementsByTagName("head")[0] ||
document.getElementsByTagName("body")[0]);
a.parentNode.insertBefore(c, a);
})(document, window);
                `.trim(),
            }}
        />
    );
}
