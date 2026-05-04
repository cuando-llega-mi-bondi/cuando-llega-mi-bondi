create extension if not exists "pgcrypto";

create table subscriptions (
  id            uuid primary key default gen_random_uuid(),
  endpoint      text unique not null,
  p256dh        text not null,
  auth          text not null,
  user_agent    text,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  disabled_at   timestamptz
);

create table arrival_watches (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions(id) on delete cascade,
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
create index on arrival_watches (subscription_id);
create index on arrival_watches (parada_id, linea_id);

create table service_alert_subs (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  linea_id        text not null,
  unique (subscription_id, linea_id)
);
create index on service_alert_subs (linea_id);

create table service_alerts (
  id        uuid primary key default gen_random_uuid(),
  linea_id  text,
  title     text not null,
  body      text not null,
  url       text,
  sent_at   timestamptz not null default now(),
  sent_by   text
);

create table daily_reminders (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  fire_at         time not null,
  tz              text not null default 'America/Argentina/Buenos_Aires',
  paradas         jsonb not null,
  active_dows     int[],
  last_fired_on   date
);
create index on daily_reminders (subscription_id);
