import type { Arribo } from "@features/arrivals/types";
import type { Linea, Parada } from "@shared/types";
import type { LiveSharePoint } from "@features/live-sharing/hooks/useLiveBuses";

export type ArrivalsPanelView = "loading" | "empty" | "list" | "hidden";

export function resolveArrivalsPanelView({
    loadingArribos,
    hasArribos,
    hasLiveSharings,
    isConsulting,
}: {
    loadingArribos: boolean;
    hasArribos: boolean;
    hasLiveSharings: boolean;
    isConsulting: boolean;
}): ArrivalsPanelView {
    if (!isConsulting && !hasArribos && !hasLiveSharings && !loadingArribos) {
        return "hidden";
    }
    if (loadingArribos && !hasArribos && !hasLiveSharings) {
        return "loading";
    }
    if (!hasArribos && !hasLiveSharings) {
        return "empty";
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
    handleFavFromArribos: (arribo: Arribo) => void;
};

export type ArrivalsOverlaySession = {
    consult: ArrivalsConsultSession;
    arrivals: ArrivalsDataSession;
    telegramUsername: string;
};
