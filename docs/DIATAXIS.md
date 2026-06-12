# Documentación Diátaxis

Este proyecto organiza la documentación con el marco [Diátaxis](https://diataxis.fr/): cuatro tipos según lo que el lector necesita hacer.

## 1. Tutoriales (aprendizaje)

Guían a alguien sin contexto previo hacia un primer resultado.

| Documento | Contenido |
| --------- | --------- |
| [README — Empezar](../README.md#-empezar-getting-started) | Clonar, `.env.local`, `npm run dev` |
| [README — Regenerar catálogo](../README.md#regenerar-catálogo-estático) | `dump-static` + `split-static` |

**Meta:** tener la PWA corriendo en local y entender qué variable es imprescindible.

## 2. Guías «cómo hacer» (tareas)

Recetas para un problema concreto.

| Documento | Tarea |
| --------- | ----- |
| [CONTRIBUTING — Línea manual](../CONTRIBUTING.md#cómo-agregar-una-línea-manual-geojson) | Agregar GeoJSON y entrada en `manualRoutes.ts` |
| [CONTRIBUTING — Setup y PR](../CONTRIBUTING.md) | Fork, ramas, convenciones, checklist de PR |
| [CONTRIBUTING — Scripts estáticos](../CONTRIBUTING.md#scripts-de-datos-estáticos) | Actualizar `data/static/` desde la API |
| [CONTRIBUTING — Diagnóstico del planner](../CONTRIBUTING.md#scripts-de-diagnóstico-del-planner) | Correr `smoke-plan` y `audit-stop-order` |
| [README — Docker](../README.md#-docker-opcional) | Compose + cloudflared |

## 3. Referencia (información técnica)

Descripciones precisas del «maquinaria».

| Documento | Tema |
| --------- | ---- |
| [docs/env-reference.md](env-reference.md) | Variables de entorno |
| [README — API breve](../README.md#-api-referencia-breve) | Acciones MGP y rutas `/api/*` |
| [shared/api/client.ts](../shared/api/client.ts) | `post()`, `swrFetcher`, fallback estático |
| [shared/api/staticReferenceAcciones.ts](../shared/api/staticReferenceAcciones.ts) | Acciones servidas por `/api/reference` |
| [shared/types.ts](../shared/types.ts) | Tipos de dominio compartidos |
| [app/api/telegram-webhook/route.ts](../app/api/telegram-webhook/route.ts) | Webhook del bot (opcional) |
| [DESIGN.md](../DESIGN.md) | Tokens, tipografía, componentes |

## 4. Explicación (comprensión)

Contexto, arquitectura y decisiones.

| Documento | Tema |
| --------- | ---- |
| [docs/architecture.md](architecture.md) | Flujo de datos, Screaming Architecture, capas, backend externo |
| [docs/trip-planner.md](trip-planner.md) | Planner «Cómo llego»: grafo de transit, modelo de costos, RAPTOR, poda |
| [README — Arquitectura](../README.md#-arquitectura-y-stack) | Stack y diagrama Mermaid |
| [DESIGN.md](../DESIGN.md) | Sistema visual MDP y accesibilidad |

---

> [!TIP]
> Al escribir documentación nueva, preguntate: ¿el lector quiere **aprender**, **hacer una tarea**, **consultar un dato** o **entender el porqué**? Ubicá el texto en el cuadrante correcto y enlazalo desde esta página.
