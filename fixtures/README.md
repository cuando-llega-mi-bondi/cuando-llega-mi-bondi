# Fixtures

Respuestas grabadas de la API de la muni para desarrollo local sin pegar al proxy real.

## Estructura

```
fixtures/
  RecuperarLineaPorCuandoLlega/
    {sha256(body)[:16]}.json
  RecuperarCallesPrincipalPorLinea/
    {sha256(body)[:16]}.json
  ...
```

Cada archivo tiene `_meta` (acción, params, timestamp de grabación) y `data` (la respuesta cruda del proxy).

## Uso

### Grabar fixtures (modo `record`)

Necesita la API real funcionando (proxy Termux/Oracle accesible).

```bash
MGP_USE_FIXTURES=record pnpm dev
```

Cada request al `/api/cuando` que llegue al proxy real va a quedar grabada en disco. Navegá la app por los flows que querés cubrir (ej: elegir línea 541, calle Av. Juan H. Jara, intersección Río Negro) y los responses se persisten.

### Replay sin tocar el proxy (modo `replay`)

```bash
MGP_USE_FIXTURES=replay pnpm dev
```

El handler lee del disco. Si una request no tiene fixture grabada, devuelve 404 con un hint claro.

### Sin variable de entorno

Funcionamiento normal: el handler pega al proxy real.

## ¿Cuándo usar fixtures vs `/api/cuando-mock`?

- **Fixtures (este directorio)**: datos reales para flows realistas (UI con datos plausibles, performance testing).
- **Mock endpoint (`app/api/cuando-mock`)**: escenarios sintéticos para edge cases (`error`, `cf-block`, `session-expired`, `empty`, `slow`). Activarlo con `NEXT_PUBLIC_CUANDO_API_URL=http://localhost:3000/api/cuando-mock`.
