-- Schema bondi.* sobre pg-aeterna.
-- Asume que public.auth_credentials ya existe (es el user store de aeterna).
-- Todas las FKs hacen on delete cascade: si se borra el credential, se limpian las
-- rutinas/favoritos/subs del user en bondi.

create extension if not exists "pgcrypto";

create schema if not exists bondi;

-- Suscripciones web-push (una por device/browser)
create table if not exists bondi.subscriptions (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references public.auth_credentials(id) on delete cascade,
    endpoint        text unique not null,
    p256dh          text not null,
    auth            text not null,
    user_agent      text,
    created_at      timestamptz not null default now(),
    last_seen_at    timestamptz not null default now(),
    disabled_at     timestamptz
);
create index if not exists subscriptions_user_idx on bondi.subscriptions (user_id);

-- Favoritos: paradas con apodo
create table if not exists bondi.favoritos (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references public.auth_credentials(id) on delete cascade,
    parada_id   text not null,
    apodo       text not null,
    emoji       text,
    -- Sort manual del user (drag-to-reorder en el futuro)
    posicion    int not null default 0,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    unique (user_id, parada_id)
);
create index if not exists favoritos_user_idx on bondi.favoritos (user_id, posicion);

-- Rutinas: notificaciones programadas
-- kind define el comportamiento:
--   'arrival_watch': avisa cuando un bondi está a <= threshold_min de la parada
--   'daily_reminder': avisa una vez al día a fire_at
create type bondi.rutina_kind as enum ('arrival_watch', 'daily_reminder');

create table if not exists bondi.rutinas (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references public.auth_credentials(id) on delete cascade,
    kind            bondi.rutina_kind not null,
    nombre          text not null,
    -- Días de la semana (1=Lun..7=Dom, ISO). null = todos los días.
    active_dows     int[],
    -- Origen y destino (para rutinas tipo 'ida al trabajo'). Pueden ser null
    -- si la rutina no requiere routing.
    origen_lat      double precision,
    origen_lng      double precision,
    destino_lat     double precision,
    destino_lng     double precision,
    destino_label   text,
    -- arrival_watch: fields
    parada_id       text,
    linea_id        text,
    threshold_min   int,
    cooldown_min    int default 30,
    last_fired_at   timestamptz,
    -- daily_reminder: fields
    fire_at         time,
    tz              text default 'America/Argentina/Buenos_Aires',
    last_fired_on   date,
    -- Común
    enabled         boolean not null default true,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    -- Validación: cada kind requiere sus campos
    constraint rutina_arrival_required check (
        kind <> 'arrival_watch' or (parada_id is not null and linea_id is not null and threshold_min is not null)
    ),
    constraint rutina_daily_required check (
        kind <> 'daily_reminder' or fire_at is not null
    )
);
create index if not exists rutinas_user_idx on bondi.rutinas (user_id);
create index if not exists rutinas_enabled_kind_idx on bondi.rutinas (enabled, kind);

-- Trigger updated_at
create or replace function bondi.touch_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end $$;

create trigger favoritos_touch_updated_at before update on bondi.favoritos
    for each row execute function bondi.touch_updated_at();
create trigger rutinas_touch_updated_at before update on bondi.rutinas
    for each row execute function bondi.touch_updated_at();
