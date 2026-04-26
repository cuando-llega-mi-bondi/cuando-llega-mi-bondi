/** Server-rendered intro for crawlers and accessibility (single page h1). */
export function HomeIntro() {
    return (
        <section className="home-seo-intro" aria-labelledby="home-seo-title">
            <h1 id="home-seo-title" className="home-seo-intro__title">
                Colectivos en Mar del Plata: cuándo llega tu bondi
            </h1>
            <p className="home-seo-intro__text route-info">
                Consultá arribos en tiempo real, recorridos y paradas de todas las líneas
                municipales (511, 522, 541 y más). Datos oficiales de MGP en una interfaz
                rápida para celular, instalable como PWA.
            </p>
        </section>
    );
}
