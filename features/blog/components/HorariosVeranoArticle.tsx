import Link from "next/link";

export function HorariosVeranoArticle() {
    return (
        <>
            <p>
                En enero y febrero, Mar del Plata multiplica su población con turistas, y eso se nota
                directo en el colectivo: unidades más cargadas, más paradas por cuadra y tiempos de viaje
                que varían mucho más que en temporada baja. El horario de cartel sigue siendo una
                referencia, pero en temporada alta conviene mirar el arribo en tiempo real antes de salir
                de tu alojamiento.
            </p>

            <h2>Por qué el horario fijo no alcanza en verano</h2>
            <p>
                Un colectivo circula según su recorrido real en la calle, no según una tabla impresa: si
                hay más tránsito por la mayor cantidad de autos y gente en la ciudad, o si va más cargado
                de lo habitual y tarda más en cada parada, el horario teórico deja de coincidir con el
                arribo real. Cuanto más lejos esté tu parada del origen del recorrido, más se nota esa
                diferencia acumulada.
            </p>

            <h2>Cómo consultar el próximo colectivo en tiempo real</h2>
            <p>
                En <Link href="/consultar">Consultar</Link> elegís tu línea y tu parada, y ves el arribo
                estimado en minutos, calculado con la posición GPS real de la unidad, no con un horario
                fijo. Funciona igual un martes de enero que un jueves de agosto.
            </p>

            <h2>Cómo llegar a la playa sin saber qué línea tomar</h2>
            <p>
                Si estás de visita y no conocés las líneas de la ciudad, <Link href="/como-llego">Cómo
                llego</Link> arma el viaje ingresando de dónde salís y a dónde vas, y te dice qué colectivo
                tomar.
            </p>

            <h2>Cómo encontrar la parada más cercana a tu alojamiento</h2>
            <p>
                Con la ubicación activada, <Link href="/paradas-cerca">Paradas cerca mío</Link> muestra en
                el mapa las paradas más próximas y qué líneas pasan por cada una, útil si estás en un
                alojamiento temporario y todavía no ubicás la parada de siempre.
            </p>

            <h2>Ver el recorrido completo antes de salir</h2>
            <p>
                Si querés confirmar que una línea pasa cerca de la playa o el barrio al que vas antes de
                subirte, <Link href="/recorrido">Recorridos</Link> tiene el mapa interactivo con el
                trazado completo de cada línea de Mar del Plata.
            </p>

            <h2>Algunos tips para temporada alta</h2>
            <p>
                Salí con un poco más de margen del habitual, sobre todo cerca del mediodía y a la tarde,
                que son las franjas con más movimiento hacia y desde la costa. Si el colectivo que
                consultaste está demorado, volvé a mirar en unos minutos: la estimación se actualiza con
                la posición real de la unidad, no queda fija.
            </p>

            <h2>Preguntas frecuentes</h2>

            <h3>¿La Municipalidad cambia los horarios en verano?</h3>
            <p>
                Lo que cambia sobre todo es la demanda, no un cronograma especial publicado para la
                temporada. Por eso el arribo en tiempo real es más confiable que cualquier horario de
                referencia en esta época del año.
            </p>

            <h3>¿Hace falta descargar algo para consultarlo?</h3>
            <p>
                No. Bondi MDP es una PWA gratuita que se usa directo desde el navegador, sin pasar por
                Google Play ni App Store. Se puede instalar en la pantalla de inicio si querés acceso más
                rápido, pero no es obligatorio.
            </p>

            <h3>¿Sirve para turistas que no conocen las líneas?</h3>
            <p>
                Sí, para eso está pensado <Link href="/como-llego">Cómo llego</Link>: no necesitás saber
                de antemano qué línea tomar, solo el origen y el destino del viaje.
            </p>

            <p>
                ¿Ya sabés qué línea tomar?{" "}
                <Link href="/consultar">Consultá el próximo arribo en Bondi MDP →</Link>
            </p>
        </>
    );
}
