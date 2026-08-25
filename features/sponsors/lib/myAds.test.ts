import { beforeEach, describe, expect, it } from "vitest";
import { getRememberedAdPurchaseIds, rememberAdPurchaseId } from "./myAds";

// No hay jsdom en este proyecto (tests corren en Node puro): alcanza con un
// stub mínimo de localStorage respaldado por un Map, no hace falta la lib.
function fakeLocalStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
    removeItem: (key) => void store.delete(key),
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

beforeEach(() => {
  (globalThis as { window?: { localStorage: Storage } }).window = {
    localStorage: fakeLocalStorage(),
  };
});

describe("rememberAdPurchaseId / getRememberedAdPurchaseIds", () => {
  it("arranca vacío", () => {
    expect(getRememberedAdPurchaseIds()).toEqual([]);
  });

  it("recuerda y trae de más nuevo a más viejo", () => {
    rememberAdPurchaseId("a");
    rememberAdPurchaseId("b");
    expect(getRememberedAdPurchaseIds()).toEqual(["b", "a"]);
  });

  it("no duplica: repetir un id lo manda al frente", () => {
    rememberAdPurchaseId("a");
    rememberAdPurchaseId("b");
    rememberAdPurchaseId("a");
    expect(getRememberedAdPurchaseIds()).toEqual(["a", "b"]);
  });

  it("trunca a los últimos 20", () => {
    for (let i = 0; i < 25; i++) rememberAdPurchaseId(`id-${i}`);
    const ids = getRememberedAdPurchaseIds();
    expect(ids).toHaveLength(20);
    expect(ids[0]).toBe("id-24");
  });

  it("ante JSON corrupto devuelve vacío en vez de romper", () => {
    window.localStorage.setItem("bondi:mis-avisos", "{not json");
    expect(getRememberedAdPurchaseIds()).toEqual([]);
  });
});
