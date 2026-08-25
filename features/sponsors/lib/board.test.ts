import { describe, expect, it } from "vitest";
import { compareAdBids, groupAdContributions, minToEnterArs, minToLeadArs, type AdContribution } from "./board";

const FLOOR = 1_000;
const STEP = 100;

describe("minToEnterArs", () => {
  it("cobra el piso mientras quede un puesto libre", () => {
    expect(minToEnterArs([], FLOOR, STEP)).toBe(FLOOR);
    expect(minToEnterArs([2_750], FLOOR, STEP)).toBe(FLOOR);
  });

  it("con el podio lleno hay que superar al último", () => {
    expect(minToEnterArs([2_750, 2_200], FLOOR, STEP)).toBe(2_300);
  });

  it("nunca baja del piso aunque el último haya pagado menos", () => {
    expect(minToEnterArs([900, 500], FLOOR, STEP)).toBe(FLOOR);
  });
});

describe("minToLeadArs", () => {
  it("es el piso si no hay nadie", () => {
    expect(minToLeadArs([], FLOOR, STEP)).toBe(FLOOR);
  });

  it("supera al primero, no al último", () => {
    expect(minToLeadArs([2_750, 2_200], FLOOR, STEP)).toBe(2_850);
  });
});

describe("compareAdBids", () => {
  it("ordena por monto de mayor a menor", () => {
    const bids = [
      { amountArs: 1_500, since: "2026-08-23T00:30:08Z" },
      { amountArs: 2_750, since: "2026-08-24T13:29:19Z" },
      { amountArs: 2_200, since: "2026-08-22T10:00:00Z" },
    ];
    expect([...bids].sort(compareAdBids).map((b) => b.amountArs)).toEqual([2_750, 2_200, 1_500]);
  });

  it("a igual monto gana el que pagó primero", () => {
    const early = { amountArs: 2_300, since: "2026-08-24T10:00:00Z" };
    const late = { amountArs: 2_300, since: "2026-08-24T10:00:01Z" };
    expect([late, early].sort(compareAdBids)).toEqual([early, late]);
  });
});

function contribution(overrides: Partial<AdContribution> & { id: string }): AdContribution {
  return {
    boostedFromId: null,
    title: "Aviso",
    href: "https://ejemplo.com",
    tagline: null,
    amountArs: 1_000,
    since: "2026-08-20T00:00:00Z",
    ...overrides,
  };
}

describe("groupAdContributions", () => {
  it("un aviso sin boosts es su propio grupo", () => {
    const rows = [contribution({ id: "a", amountArs: 1_000 })];
    expect(groupAdContributions(rows)).toEqual([
      { id: "a", title: "Aviso", href: "https://ejemplo.com", tagline: null, amountArs: 1_000, since: "2026-08-20T00:00:00Z" },
    ]);
  });

  it("suma los boosts al total de la raíz", () => {
    const rows = [
      contribution({ id: "root", amountArs: 2_000, since: "2026-08-20T00:00:00Z" }),
      contribution({ id: "boost-1", boostedFromId: "root", amountArs: 500 }),
      contribution({ id: "boost-2", boostedFromId: "root", amountArs: 300 }),
    ];
    const groups = groupAdContributions(rows);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ id: "root", amountArs: 2_800, since: "2026-08-20T00:00:00Z" });
  });

  it("un boost huérfano (raíz no aprobada) queda como su propio grupo", () => {
    const rows = [contribution({ id: "boost-huerfano", boostedFromId: "no-existe", amountArs: 500 })];
    expect(groupAdContributions(rows)).toEqual([
      { id: "boost-huerfano", title: "Aviso", href: "https://ejemplo.com", tagline: null, amountArs: 500, since: "2026-08-20T00:00:00Z" },
    ]);
  });

  it("no mezcla grupos distintos", () => {
    const rows = [
      contribution({ id: "a", amountArs: 1_000 }),
      contribution({ id: "b", amountArs: 5_000 }),
      contribution({ id: "boost-a", boostedFromId: "a", amountArs: 200 }),
    ];
    const groups = groupAdContributions(rows).sort(compareAdBids);
    expect(groups.map((g) => ({ id: g.id, amountArs: g.amountArs }))).toEqual([
      { id: "b", amountArs: 5_000 },
      { id: "a", amountArs: 1_200 },
    ]);
  });
});
