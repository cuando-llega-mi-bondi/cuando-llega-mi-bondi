-- Stub baseline so `supabase db reset` works locally. The real bus_locations
-- table was created via Supabase Studio in production; once `supabase db pull`
-- is run against the remote project this stub gets superseded by the
-- authoritative schema.
create table public.bus_locations (
    session_id  text primary key,
    linea       text not null,
    lat         numeric not null,
    lng         numeric not null,
    updated_at  timestamptz not null default now()
);
create index on public.bus_locations (linea, updated_at desc);

-- Permissive RLS to mirror current prod behavior (anon webhook + public realtime).
alter table public.bus_locations enable row level security;
create policy "bus_locations anon all"
    on public.bus_locations
    for all
    using (true)
    with check (true);
