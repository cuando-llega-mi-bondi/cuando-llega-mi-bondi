export type AuthUser = {
    id: string;
    email: string;
    nombre: string | null;
};

export type Favorito = {
    id: string;
    parada_id: string;
    apodo: string;
    emoji: string | null;
    posicion: number;
    created_at: string;
    updated_at: string;
};

export type RutinaKind = "arrival_watch" | "daily_reminder";

export type Rutina = {
    id: string;
    kind: RutinaKind;
    nombre: string;
    active_dows: number[] | null;
    origen_lat: number | null;
    origen_lng: number | null;
    destino_lat: number | null;
    destino_lng: number | null;
    destino_label: string | null;
    parada_id: string | null;
    linea_id: string | null;
    threshold_min: number | null;
    cooldown_min: number | null;
    fire_at: string | null;
    tz: string | null;
    enabled: boolean;
    last_fired_at: string | null;
    last_fired_on: string | null;
    created_at: string;
    updated_at: string;
};

export type CreateArrivalWatch = {
    kind: "arrival_watch";
    nombre: string;
    parada_id: string;
    linea_id: string;
    threshold_min: number;
    cooldown_min?: number;
    active_dows?: number[] | null;
    enabled?: boolean;
};

export type CreateDailyReminder = {
    kind: "daily_reminder";
    nombre: string;
    fire_at: string;
    tz?: string;
    active_dows?: number[] | null;
    origen_lat?: number | null;
    origen_lng?: number | null;
    destino_lat?: number | null;
    destino_lng?: number | null;
    destino_label?: string | null;
    enabled?: boolean;
};

export type CreateRutinaInput = CreateArrivalWatch | CreateDailyReminder;
