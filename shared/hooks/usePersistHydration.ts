"use client";

import { useSyncExternalStore } from "react";

type PersistCapableStore = {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (fn: () => void) => () => void;
  };
};

/** Wait until a zustand persist store has rehydrated from localStorage. */
export function usePersistHydration(store: PersistCapableStore): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (store.persist.hasHydrated()) {
        return () => {};
      }
      return store.persist.onFinishHydration(onStoreChange);
    },
    () => store.persist.hasHydrated(),
    () => false,
  );
}
