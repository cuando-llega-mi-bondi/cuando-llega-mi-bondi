import Link from "next/link";

export function ComoSaberCuandoLlegaArticle() {
    return (
        <>
            <p>
                Estás en la parada, hace frío o está lloviendo, y no sabés si el colectivo pasa en dos
                minutos o en veinte. Esta guía junta todas las formas reales de saber cuándo llega el
                colectivo en Mar del Plata, con datos en tiempo real y no horarios teóricos de cartel.
            </p>

            <h2>Opción 1: la app oficial &ldquo;Cuándo Llega&rdquo;</h2>
            <p>
                Es la aplicación de la Municipalidad de General Pueyrredón, disponible en Google Play y
                App Store. Usa la posición GPS real de las unidades para estimar el arribo a cada parada.
            </p>

            <h2>Opción 2: Bondi MDP</h2>
            <p>
                Es una PWA gratuita, sin registro, hecha por dos desarrolladores marplatenses, que
                consume la misma data oficial en tiempo real de la MGP y suma la línea 221 (Costa Azul)
                por fuera de la API municipal. Se abre directo en el navegador, sin pasar por ninguna
                tienda de aplicaciones. Ver la{" "}
                <Link href="/blog/bondi-mdp-vs-cuando-llega">comparativa completa con la app oficial</Link>
                .
            </p>

            <h2>Otras alternativas</h2>
            <p>
                También existen otras iniciativas independientes de terceros para consultar el transporte
                público en la ciudad, con distinto alcance y frecuencia de actualización según el caso.
            </p>

            <h2>Cómo consultar una línea específica</h2>
            <p>
                Elegí tu línea y tu parada en{" "}
                <Link href="/consultar">Consultar</Link> y vas a ver el próximo arribo estimado en
                minutos, actualizado en tiempo real.
            </p>

            <h2>Cómo ver el recorrido completo de una línea</h2>
            <p>
                Si necesitás saber por dónde pasa una línea entera —todas sus calles y paradas—, la
                sección <Link href="/recorrido">Recorridos</Link> tiene el mapa interactivo de cada línea
                de Mar del Plata.
            </p>

            <h2>Cómo planificar un viaje (origen → destino)</h2>
            <p>
                Si todavía no sabés qué línea tomar, <Link href="/como-llego">Cómo llego</Link> arma el
                viaje a pie + colectivo ingresando de dónde salís y a dónde vas.
            </p>

            <h2>Cómo encontrar la parada más cercana</h2>
            <p>
                Con la ubicación activada, <Link href="/paradas-cerca">Paradas cerca mío</Link> muestra en
                el mapa las paradas de colectivo más cercanas y qué líneas pasan por cada una.
            </p>

            <h2>Preguntas frecuentes</h2>

            <h3>¿Es gratis saber cuándo llega el colectivo?</h3>
            <p>Sí, tanto la app oficial como Bondi MDP son gratuitas.</p>

            <h3>¿Necesito crear una cuenta?</h3>
            <p>
                No. Ni la app oficial ni Bondi MDP piden registro para consultar arribos en tiempo real.
            </p>

            <h3>¿Los horarios son en tiempo real o teóricos?</h3>
            <p>
                Son en tiempo real: se calculan a partir de la posición GPS de la unidad, no de una tabla
                de horarios fija. Un colectivo atrasado se va a ver atrasado.
            </p>

            <p>
                ¿Querés compararlas antes de decidir? Mirá la{" "}
                <Link href="/blog/bondi-mdp-vs-cuando-llega">
                    comparativa entre Bondi MDP y la app oficial
                </Link>
                .
            </p>
        </>
    );
}
