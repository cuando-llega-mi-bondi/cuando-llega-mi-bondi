import { PLAY_STORE_URL } from "@shared/play/playStore";

// Tarjeta con acento cartográfico, como el CTA final
export function LandingDownload() {
  return (
    <section aria-labelledby="descarga-heading" className="py-20 xl:py-24">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 sm:p-10 xl:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-y-8 right-0 w-3/5 bg-cover bg-right opacity-20 dark:opacity-25"
          style={{
            backgroundImage: "url(/mar-del-plata-mapa-bg.svg)",
            maskImage: "linear-gradient(to left, black 35%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to left, black 35%, transparent 100%)",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div className="max-w-lg space-y-2.5">
            <h2
              id="descarga-heading"
              className="text-balance text-2xl font-black tracking-tight text-foreground sm:text-3xl"
            >
              Sin registro ni fricción
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Abrís la app, elegís línea o esquina en el panel izquierdo y
              consultás el arribo en segundos.
            </p>
          </div>

          {/* Badges oficiales sin alterar, a la misma altura (Google Play nunca más chico que el resto) */}
          <ul className="flex shrink-0 flex-wrap items-start gap-4 xl:justify-end">
            <li className="space-y-2">
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-[10px]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- el proyecto no usa next/image (sin config de images); badge estático */}
                <img
                  src="/badges/google-play.png"
                  alt="Descargar Bondi MDP en Google Play"
                  width={161}
                  height={48}
                  className="h-12 w-auto"
                />
              </a>
              <p className="text-xs text-muted-foreground">
                Gratis para Android
              </p>
            </li>
            {/* Sin link hasta que la app esté publicada en el App Store */}
            <li className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- el proyecto no usa next/image (sin config de images); badge estático */}
              <img
                src="/badges/app-store.svg"
                alt="App Store"
                width={144}
                height={48}
                className="h-12 w-auto"
              />
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  Próximamente
                </span>{" "}
                para iPhone
              </p>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
