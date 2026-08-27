import Link from "next/link";

export function BondiVsCuandoLlegaArticle() {
    return (
        <>
            <p>
                Si buscaste &ldquo;cuándo llega el colectivo en Mar del Plata&rdquo;, seguramente te
                cruzaste con dos nombres: la app oficial <strong>&ldquo;Cuándo Llega&rdquo;</strong> de
                la Municipalidad y <strong>Bondi MDP</strong>. Las dos muestran el arribo en tiempo real
                de las líneas de colectivo de la ciudad, pero no son lo mismo. Esta es una comparación
                directa, sin vueltas, hecha por el equipo que desarrolla Bondi MDP.
            </p>

            <h2>Qué es &ldquo;Cuándo Llega&rdquo;</h2>
            <p>
                Es la aplicación oficial de la Municipalidad de General Pueyrredón (MGP) para consultar
                el transporte urbano de pasajeros. Está disponible en Google Play y App Store, y usa la
                misma fuente de datos GPS que alimenta al resto de las herramientas de la ciudad.
            </p>

            <h2>Qué es Bondi MDP</h2>
            <p>
                Es una Progressive Web App (PWA) gratuita e independiente, sin afiliación con la
                Municipalidad, hecha por dos desarrolladores marplatenses. Nació como respuesta de la
                comunidad tech local y hoy la usan miles de vecinos para consultar arribos, recorridos y
                paradas cercanas.
            </p>

            <h2>En qué se parecen</h2>
            <p>
                Ambas son <strong>gratuitas</strong> y usan los <strong>mismos datos oficiales en tiempo
                real de la MGP</strong>: si el colectivo está atrasado, las dos lo van a mostrar atrasado.
                Ninguna inventa horarios propios.
            </p>

            <h2>Diferencias, punto por punto</h2>

            <h3>Instalación</h3>
            <p>
                &ldquo;Cuándo Llega&rdquo; requiere descargarla desde Google Play o App Store. Bondi MDP
                es una PWA: se instala directo desde el navegador (o se usa sin instalar nada), sin pasar
                por ninguna tienda de aplicaciones.
            </p>

            <h3>Registro</h3>
            <p>
                Bondi MDP no pide cuenta ni registro para usarse. Abrís el sitio y consultás.
            </p>

            <h3>Cobertura de líneas</h3>
            <p>
                Bondi MDP suma la línea 221 (Costa Azul) mediante un trazado manual propio, ya que esa
                línea no forma parte de la API oficial de la MGP.
            </p>

            <h3>Código</h3>
            <p>
                Bondi MDP es{" "}
                <a
                    href="https://github.com/cuando-llega-mi-bondi/cuando-llega-mi-bondi"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    código abierto
                </a>
                : cualquiera puede revisar cómo funciona o proponer una mejora.
            </p>

            <h2>Quién hizo Bondi MDP</h2>
            <p>
                Nicolás Jiménez y Matias Celiz Ramos, dos desarrolladores de Mar del Plata. El lanzamiento
                fue cubierto por Diario La Capital de Mar del Plata y Mi8, que la describieron como
                &ldquo;la alternativa a la aplicación Cuándo Llega&rdquo;. Más sobre el equipo y los datos
                de uso en <Link href="/acerca">/acerca</Link>.
            </p>

            <h2>Cuál conviene usar</h2>
            <p>
                Las dos hacen el trabajo con los mismos datos oficiales. Si ya tenés &ldquo;Cuándo
                Llega&rdquo; instalada y te sirve, no hay ningún motivo para cambiar. Si preferís no
                instalar una app de tienda, no querés crear cuenta, o tomás la línea 221, Bondi MDP te
                puede resultar más cómoda. Probá las dos y quedate con la que mejor te funcione.
            </p>

            <p>
                <Link href="/consultar">Consultá tu colectivo ahora en Bondi MDP →</Link>
            </p>
        </>
    );
}
