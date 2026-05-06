# Bondi DB

Migraciones SQL del schema `bondi.*` sobre la instancia Postgres de
**pg-aeterna**. No usamos un ORM por ahora; `pg` directo desde el server.

## Requisitos previos

`public.auth_credentials` debe existir (lo provee aeterna). Las tablas
`bondi.*` referencian `auth_credentials.id` con `on delete cascade`.

## Aplicar migraciones

```bash
psql "$DATABASE_URL" -f db/migrations/001_bondi_init.sql
```

`DATABASE_URL` apunta al pg-aeterna (ej.
`postgres://USER:PWD@localhost:5432/aeterna`).

Las migraciones son idempotentes (`if not exists`); aplicarlas dos veces no
rompe nada.
