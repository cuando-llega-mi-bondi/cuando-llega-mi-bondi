import type { LineaReview } from "./types";

/**
 * Reseñas fake en memoria para probar visualmente la UI sin depender de
 * Supabase (ni de loguearte de verdad). Solo se activa fuera de producción
 * y con el flag explícito — nunca pisa datos reales.
 *
 * Activar: `NEXT_PUBLIC_MOCK_REVIEWS=true` en `.env.local`, `bun dev`.
 */
export const MOCK_REVIEWS_ENABLED =
    process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_MOCK_REVIEWS === "true";

export const MOCK_USER_ID = "mock-vos";

export const MOCK_USER = {
    id: MOCK_USER_ID,
    email: "vos@ejemplo.com",
} as const;

const NOMBRES = [
    "Rocío", "Facundo", "Milagros", "Nahuel", "Sol", "Bruno", "Ayelén", "Tomás",
    "Camila", "Ignacio", "Julieta", "Santino", "Valentina", "Lucas", "Martina",
];

const COMENTARIOS = [
    "Puntual la mayoría de las veces, el chofer maneja tranquilo.",
    "Pasa lleno en horario pico, pero llega rápido a la costa.",
    "Buen recorrido, para cerca de casa y no tuve quejas.",
    "A veces se atrasa bastante los fines de semana.",
    "El aire acondicionado nunca anda pero por lo demás bien.",
    "Excelente, el chofer para bien en las paradas y avisa las calles.",
    "Regular, tarda mucho en la zona del centro con el tránsito.",
    "Me deja justo en la puerta del laburo, no me puedo quejar.",
    "",
    "Anduvo mal esta semana, pasó dos veces vacío sin frenar.",
    "Cómodo y limpio, mejoró un montón últimamente.",
];

function seededRandom(seed: number) {
    let value = seed;
    return () => {
        value = (value * 1103515245 + 12345) & 0x7fffffff;
        return value / 0x7fffffff;
    };
}

function hashCodigo(codigo: string): number {
    let h = 0;
    for (let i = 0; i < codigo.length; i++) h = (h * 31 + codigo.charCodeAt(i)) & 0x7fffffff;
    return h || 1;
}

/** Reseñas generadas por línea (determinístico por código), cacheadas en memoria durante la sesión de dev. */
const store = new Map<string, LineaReview[]>();

function seedForLinea(lineaCodigo: string): LineaReview[] {
    const rand = seededRandom(hashCodigo(lineaCodigo));
    const count = 4 + Math.floor(rand() * 6); // 4 a 9 reseñas
    const now = Date.now();

    const reviews: LineaReview[] = Array.from({ length: count }, (_, i) => {
        const rating = 1 + Math.floor(rand() * rand() * 5); // sesgado hacia puntajes altos
        const daysAgo = Math.floor(rand() * 60);
        return {
            id: `mock-${lineaCodigo}-${i}`,
            userId: `mock-otro-${i}`,
            lineaCodigo,
            rating: Math.min(5, Math.max(1, rating)),
            comment: COMENTARIOS[Math.floor(rand() * COMENTARIOS.length)] || null,
            displayName: NOMBRES[Math.floor(rand() * NOMBRES.length)],
            createdAt: new Date(now - daysAgo * 86_400_000).toISOString(),
            updatedAt: new Date(now - daysAgo * 86_400_000).toISOString(),
        };
    });

    // Tu propia reseña, para poder probar los estados de editar/borrar.
    reviews.unshift({
        id: `mock-${lineaCodigo}-own`,
        userId: MOCK_USER_ID,
        lineaCodigo,
        rating: 4,
        comment: "La uso todos los días para ir a laburar, cumple.",
        displayName: "Vos",
        createdAt: new Date(now - 3 * 86_400_000).toISOString(),
        updatedAt: new Date(now - 3 * 86_400_000).toISOString(),
    });

    return reviews;
}

export function mockListByLinea(lineaCodigo: string): LineaReview[] {
    if (!store.has(lineaCodigo)) store.set(lineaCodigo, seedForLinea(lineaCodigo));
    return [...(store.get(lineaCodigo) ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function mockUpsertOwn(review: {
    userId: string;
    lineaCodigo: string;
    rating: number;
    comment: string | null;
    displayName: string;
}): LineaReview {
    const list = mockListByLinea(review.lineaCodigo);
    const now = new Date().toISOString();
    const existing = list.find((r) => r.userId === review.userId);

    const saved: LineaReview = existing
        ? { ...existing, rating: review.rating, comment: review.comment, displayName: review.displayName, updatedAt: now }
        : {
            id: `mock-${review.lineaCodigo}-${review.userId}-${now}`,
            userId: review.userId,
            lineaCodigo: review.lineaCodigo,
            rating: review.rating,
            comment: review.comment,
            displayName: review.displayName,
            createdAt: now,
            updatedAt: now,
        };

    const next = existing ? list.map((r) => (r.id === existing.id ? saved : r)) : [saved, ...list];
    store.set(review.lineaCodigo, next);
    return saved;
}

export function mockDeleteOwn(id: string): void {
    for (const [lineaCodigo, list] of store) {
        if (list.some((r) => r.id === id)) {
            store.set(lineaCodigo, list.filter((r) => r.id !== id));
            return;
        }
    }
}

/** Espeja lo que hace `/api/account/delete`: anonimiza, no borra. */
export function mockDeleteAccount(): void {
    for (const [lineaCodigo, list] of store) {
        store.set(
            lineaCodigo,
            list.map((r) =>
                r.userId === MOCK_USER_ID ? { ...r, userId: null, displayName: "Usuario eliminado" } : r,
            ),
        );
    }
}
