"use client";

import { Sheet } from "react-modal-sheet";
import type { Itinerary } from "@features/trip-planner/types";
import { TripResultsHeader, TripResultsList } from "./TripResultsList";

/*
 * Bottom-sheet de resultados — SOLO mobile. En desktop, ComoLlegoClient
 * renderiza TripResultsList en un panel docked (columna izquierda).
 */

type TripResultsSheetProps = {
    itineraries: Itinerary[];
    selectedIdx: number;
    onSelect: (idx: number) => void;
    onNewTrip: () => void;
    originLabel?: string;
    destLabel?: string;
};

export function TripResultsSheet({
    itineraries,
    selectedIdx,
    onSelect,
    onNewTrip,
    originLabel,
    destLabel,
}: TripResultsSheetProps) {
    return (
        <Sheet
            isOpen={itineraries.length > 0}
            onClose={() => undefined}
            snapPoints={[0, 0.22, 0.5, 1]}
            initialSnap={1}
            disableDismiss
            disableScrollLocking
        >
            <Sheet.Container className="px-4 pb-safe-area-bottom">
                <Sheet.Header className="text-foreground">
                    <div className="flex h-9 w-full items-center justify-center pb-2 pt-1">
                        <Sheet.DragIndicator />
                    </div>
                    <TripResultsHeader count={itineraries.length} onNewTrip={onNewTrip} />
                </Sheet.Header>
                <Sheet.Content
                    disableDrag={(state) => state.scrollPosition !== "top"}
                    disableScroll={(state) => state.currentSnap !== 3}
                >
                    <TripResultsList
                        itineraries={itineraries}
                        selectedIdx={selectedIdx}
                        onSelect={onSelect}
                        originLabel={originLabel}
                        destLabel={destLabel}
                    />
                </Sheet.Content>
            </Sheet.Container>
            <Sheet.Backdrop />
        </Sheet>
    );
}
