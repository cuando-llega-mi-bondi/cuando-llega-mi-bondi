import type { Arribo } from "@features/arrivals/types";
import type { Linea, Parada } from "@shared/types";
import type { LiveSharePoint } from "@features/live-sharing/hooks/useLiveBuses";
import type { MgpErrorPresentation } from "@shared/api/errors";

export type ArrivalsPanelView = "loading" | "empty" | "list" | "hidden";

export function resolveArrivalsPanelView({
    loadingArribos,
    hasArribos,
    hasLiveSharings,
    isConsulting,
    hasErrored,
}: {
    loadingArribos: boolean;
    hasArribos: boolean;
    hasLiveSharings: boolean;
    isConsulting: boolean;
    /**
     * Ya hubo al menos un error para la consulta actual. Una vez que aparece
     * la tarjeta de error, los reintentos automáticos en background vuelven a
     * poner `loadingArribos` en true por un instante — sin este flag el panel
     * parpadeaba entre el skeleton grande de "loading" y la tarjeta de error
     * en cada ciclo de retry. Con el flag, se queda en "empty" (la tarjeta ya
     * tiene su propio spinner en el botón "Reintentar").
     */
    hasErrored: boolean;
}): ArrivalsPanelView {
    if (!isConsulting && !hasArribos && !hasLiveSharings && !loadingArribos) {
        return "hidden";
    }
    if (!hasArribos && !hasLiveSharings) {
        if (hasErrored) return "empty";
        return loadingArribos ? "loading" : "empty";
    }
    return "list";
}

export type ArrivalsConsultSession = {
    codLinea: string;
    paradaId: string;
    selectedRamal: string;
    setSelectedRamal: (value: string) => void;
    isConsulting: boolean;
    lineaLabel?: string;
    calleLabel?: string;
    interseccionLabel?: string;
    selectedParada?: Parada;
    paradaBanderaAbrevs: string[];
    error: string;
    setError: (value: string) => void;
};

export type ArrivalsDataSession = {
    displayArribos: Arribo[];
    loadingArribos: boolean;
    lastUpdate: Date | null;
    fetchArribos: () => void;
    calleLabel?: string;
    interseccionLabel?: string;
    otrasLineas: Linea[];
    loadingOtras: boolean;
    onSelectOtraLinea?: (linea: Linea) => void;
    liveSharings: LiveSharePoint[];
    /** Presentación del último error de arribos, o `null` si la última consulta fue ok. */
    errorInfo: MgpErrorPresentation | null;
    /** `Date.now()` estimado del próximo retry automático (ver `useArribos`), o `null`. */
    retryAt: number | null;
    /** `true` cuando el proxy marcó la última respuesta como `X-Cache: STALE`. */
    isStale: boolean;
};

export type ArrivalsOverlaySession = {
    consult: ArrivalsConsultSession;
    arrivals: ArrivalsDataSession;
    telegramUsername: string;
};
