-- pg_cron schedules that drive send-arrival (every minute) and send-daily (every 5 min).
-- The cron job calls our Edge Functions via pg_net.http_post, using a one-row settings
-- table for URL + service_role so we don't hardcode environment-specific values in this
-- migration. Update the row after deploying to production.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net  with schema extensions;

create schema if not exists private;

create table if not exists private.cron_settings (
    id           int  primary key default 1 check (id = 1),
    base_url     text not null,
    service_role text not null,
    enabled      boolean not null default true
);

-- The settings row is created with placeholder values and disabled. Populate it
-- after the local supabase stack is up (or after deploying to production):
--   update private.cron_settings set
--       base_url     = 'http://kong:8000'                       -- or 'https://<project-ref>.supabase.co'
--       , service_role = '<service_role_key from `supabase status -o env`>'
--       , enabled    = true;
-- A `supabase/seed.sql` populates it for local dev so the cron pipeline is
-- testable end-to-end without manual setup.
insert into private.cron_settings (id, base_url, service_role, enabled)
values (1, '', '', false)
on conflict (id) do nothing;

create or replace function private.invoke_function(name text)
returns bigint
language plpgsql
security definer
as $$
declare
    s record;
begin
    select * into s from private.cron_settings where id = 1;
    if not s.enabled then return null; end if;
    return net.http_post(
        url := s.base_url || '/functions/v1/' || name,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || s.service_role
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 30000
    );
end;
$$;

-- Idempotent unschedule (in case migration re-runs)
do $$
begin
    perform cron.unschedule('send-arrival') where exists (select 1 from cron.job where jobname = 'send-arrival');
    perform cron.unschedule('send-daily')   where exists (select 1 from cron.job where jobname = 'send-daily');
exception when others then null;
end $$;

select cron.schedule('send-arrival', '* * * * *',
    $$ select private.invoke_function('send-arrival') $$);

select cron.schedule('send-daily', '*/5 * * * *',
    $$ select private.invoke_function('send-daily') $$);
