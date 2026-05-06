-- bondi.bus_locations: último estado por sesión Telegram (chat_id).
-- bondi.bus_locations_history: append-only para reconstruir velocidad media
-- y detectar desvíos en el futuro.
--
-- session_id = chat_id de Telegram (no asociamos con auth_credentials porque
-- el user puede compartir sin estar logueado en bondi).

create table if not exists bondi.bus_locations (
    session_id          text primary key,
    linea               text not null,
    ramal               text,
    lat                 double precision not null,
    lng                 double precision not null,
    velocity_kmh        double precision,
    avg_velocity_kmh    double precision,
    started_at          timestamptz not null default now(),
    last_seen_at        timestamptz not null default now()
);
create index if not exists bus_locations_linea_seen_idx
    on bondi.bus_locations (linea, last_seen_at desc);

create table if not exists bondi.bus_locations_history (
    id              bigserial primary key,
    session_id      text not null,
    linea           text not null,
    ramal           text,
    lat             double precision not null,
    lng             double precision not null,
    velocity_kmh    double precision,
    captured_at     timestamptz not null default now()
);
create index if not exists bus_locations_history_session_idx
    on bondi.bus_locations_history (session_id, captured_at desc);
create index if not exists bus_locations_history_linea_idx
    on bondi.bus_locations_history (linea, captured_at desc);
