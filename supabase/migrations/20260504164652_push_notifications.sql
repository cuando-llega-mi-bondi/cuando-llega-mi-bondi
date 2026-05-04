-- Push notifications schema (web-push subscriptions, watches, alerts, reminders).
-- All tables RLS-enabled with no anon policies — only service_role can access.
-- Browser-facing operations go through Edge Functions which use the service_role key.

create extension if not exists "pgcrypto" with schema extensions;

create table public.subscriptions (
    id            uuid primary key default extensions.gen_random_uuid(),
    endpoint      text unique not null,
    p256dh        text not null,
    auth          text not null,
    user_agent    text,
    created_at    timestamptz not null default now(),
    last_seen_at  timestamptz not null default now(),
    disabled_at   timestamptz
);

create table public.arrival_watches (
    id              uuid primary key default extensions.gen_random_uuid(),
    subscription_id uuid not null references public.subscriptions(id) on delete cascade,
    parada_id       text not null,
    linea_id        text not null,
    threshold_min   int  not null default 5,
    active_from     time,
    active_to       time,
    active_dows     int[],
    cooldown_min    int  not null default 30,
    last_fired_at   timestamptz,
    created_at      timestamptz not null default now()
);
create index on public.arrival_watches (subscription_id);
create index on public.arrival_watches (parada_id, linea_id);

create table public.service_alert_subs (
    id              uuid primary key default extensions.gen_random_uuid(),
    subscription_id uuid not null references public.subscriptions(id) on delete cascade,
    linea_id        text not null,
    unique (subscription_id, linea_id)
);
create index on public.service_alert_subs (linea_id);

create table public.service_alerts (
    id        uuid primary key default extensions.gen_random_uuid(),
    linea_id  text,
    title     text not null,
    body      text not null,
    url       text,
    sent_at   timestamptz not null default now(),
    sent_by   text
);

create table public.daily_reminders (
    id              uuid primary key default extensions.gen_random_uuid(),
    subscription_id uuid not null references public.subscriptions(id) on delete cascade,
    fire_at         time not null,
    tz              text not null default 'America/Argentina/Buenos_Aires',
    paradas         jsonb not null,
    active_dows     int[],
    last_fired_on   date
);
create index on public.daily_reminders (subscription_id);

alter table public.subscriptions      enable row level security;
alter table public.arrival_watches    enable row level security;
alter table public.service_alert_subs enable row level security;
alter table public.service_alerts     enable row level security;
alter table public.daily_reminders    enable row level security;
