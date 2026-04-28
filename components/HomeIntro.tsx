/** Server-rendered intro for crawlers and accessibility (single page h1). */
export function HomeIntro() {
    return (
        <section
            className="route-info mb-4 border-b border-border pb-1"
            aria-labelledby="home-seo-title"
        >
            <h1
                id="home-seo-title"
                className="mb-2 font-display text-[1.15rem] font-semibold tracking-[-0.03em] text-text"
            >
                Colectivos en Mar del Plata: cuándo llega tu bondi
            </h1>
            <p className="m-0 font-sans text-sm leading-[1.45] text-text-dim">
                Consultá arribos en tiempo real, recorridos y paradas de todas las líneas
                municipales (511, 522, 541 y más). Datos oficiales de MGP en una interfaz
                rápida para celular, instalable como PWA.
            </p>
        </section>
    );
}
