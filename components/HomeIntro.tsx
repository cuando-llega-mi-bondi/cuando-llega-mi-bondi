/** Server-rendered intro for crawlers and accessibility (single page h1). */
export function HomeIntro() {
    return (
        <section
            className="sr-only route-info mb-4 border-b border-border pb-1"
            aria-labelledby="home-seo-title"
        >
            <h1
                id="home-seo-title"
                className="mb-2 font-display text-[40px] md:text-[62px] font-medium leading-[0.95] tracking-[-2px] md:tracking-[-3.1px] text-foreground"
            >
                Colectivos en Mar del Plata con Bondi MDP: cuándo llega tu bondi
            </h1>
            <p className="m-0 font-sans text-[15px] leading-[1.3] text-muted-foreground mt-3">
                Consultá arribos en tiempo real, recorridos y paradas de todas las líneas
                municipales (511, 522, 541 y más). Datos oficiales de MGP en una interfaz
                rápida para celular, instalable como PWA.
            </p>
        </section>
    );
}
