import { create } from "zustand";
import type { Favorito } from "@features/favorites/types";

export type NamingState =
    | { open: false }
    | { open: true; mode: "add"; fav: Favorito }
    | { open: true; mode: "edit"; fav: Favorito };

export const NAMING_CLOSED: NamingState = { open: false };

interface UIState {
    sheetOpen: boolean;
    setSheetOpen: (open: boolean) => void;

    namingModal: NamingState;
    setNamingModal: (state: NamingState) => void;
}

export const useUIStore = create<UIState>((set) => ({
    sheetOpen: false,
    setSheetOpen: (open) => set({ sheetOpen: open }),

    namingModal: NAMING_CLOSED,
    setNamingModal: (state) => set({ namingModal: state }),
}));
