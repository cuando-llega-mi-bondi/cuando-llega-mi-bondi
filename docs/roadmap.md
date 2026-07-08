# Roadmap — junio 2026 a junio 2027

Plan anual de Bondi MDP, organizado alrededor del evento que cambia las reglas
del juego: **la Cámara de Transporte está por proveernos los datos
directamente**, sin pasar por la API de la Municipalidad.

## Por qué esto reordena todo

Hoy la arquitectura completa está moldeada por una restricción externa: la API
municipal bloquea las IPs de Vercel ([docs/architecture.md](architecture.md)).
De ahí derivan:

- el **backend self-hosted** obligatorio para arribos en vivo,
- el **dump estático** (`data/mgp-static-dump.json` → `data/static/`)
  regenerado a mano por un operador,
- las **líneas manuales** en GeoJSON para lo que la API oficial no cubre,
- y un planner que es **puramente estático** porque no puede asumir datos en
  vivo desde Vercel.

Si el feed de la cámara es accesible directamente, cada una de esas piezas se
puede simplificar o potenciar. El roadmap secuencia esa transición sin romper
lo que funciona: **el dump estático sigue siendo la fuente de verdad del
catálogo hasta que el feed nuevo demuestre ser mejor**.

---

## Fase 0 — Acuerdo técnico con la cámara (jun–jul 2026)

Nada del resto se puede diseñar en serio sin estas respuestas:

| Pregunta | Por qué importa |
| -------- | --------------- |
| ¿Formato? (GTFS / GTFS-RT, API propia, GPS crudo) | GTFS abre tooling estándar; GPS crudo implica construir motor de predicción propio en Fase 3 |
| ¿Arribos calculados o solo posiciones? | Define si seguimos mostrando ETA de terceros o calculamos el nuestro |
| ¿Accesible desde Vercel? (sin bloqueo de IP) | Decide si el backend self-hosted se retira o se mantiene |
| ¿Incluye catálogo? (líneas, paradas, recorridos) | Decide el futuro del dump estático y su regeneración |
| ¿Cubre todas las líneas, incl. 221 Costa Azul? | Decide si las líneas manuales en GeoJSON se retiran |
| ¿IDs de líneas/paradas compatibles con los MGP actuales? | Favoritos e historial guardan IDs en LocalStorage: un cambio de codificación exige tabla de mapeo y migración |
| ¿SLA, rate limits, autenticación, licencia? | Dimensiona caché, fallbacks y qué podemos republicar como datos abiertos |

**Entregable:** documento de decisión técnica en `docs/` con el contrato del
feed y las respuestas a esta tabla.

## Fase 1 — Capa de proveedor conmutable (Q3 2026)

Hoy `shared/api/client.ts` habla «acciones MGP» en PascalCase contra el
backend. Antes de tocar nada del feed nuevo:

1. **Abstraer el origen de datos en vivo** detrás de una interfaz de provider:
   adaptador MGP (el actual) y adaptador Cámara (nuevo), conmutables por
   variable de entorno. Las features (`arrivals`, `route`, mapa) no deberían
   saber de dónde vienen los datos.
2. **Shadow mode:** correr ambos proveedores en paralelo un período acotado y
   comparar arribos (precisión, latencia, cobertura por línea). El corte se
   decide con datos, no por fe.
3. **Criterio de corte explícito:** p. ej. el feed de la cámara iguala o mejora
   la precisión del MGP en el 95 % de las consultas durante 2+ semanas.

El catálogo no se toca en esta fase: `data/static/` sigue siendo fuente de
verdad y fallback.

**Riesgo cubierto:** si el feed de la cámara se demora, la capa de provider
vale igual — es deuda que ya tenemos (el cliente está acoplado al dialecto
MGP) y no bloquea el resto del año.

## Fase 2 — Corte y simplificación de infraestructura (Q4 2026)

Con el shadow mode aprobado:

1. **Promover el feed de la cámara a proveedor primario** de arribos en vivo,
   con MGP como fallback mientras siga disponible.
2. **Retirar el backend self-hosted** (y su rol en docker-compose/cloudflared)
   si el feed es accesible desde Vercel. Es la mayor simplificación operativa
   del año: hoy es un punto único de falla mantenido a pulmón.
3. **Automatizar el catálogo:** si el feed incluye catálogo, regeneración
   programada (cron/CI) con validación antes de publicar — diff contra la
   versión anterior, `scripts/audit-stop-order.ts`, smoke del planner
   (`scripts/smoke-plan.ts`). `lib/server/refreshDump.ts` ya permite invalidar
   el caché sin redeploy.
4. **Migración de IDs si hace falta:** tabla de mapeo MGP ↔ cámara y migración
   transparente de favoritos/historial en LocalStorage.
5. **Líneas manuales:** retirar el GeoJSON de las que entren al feed oficial;
   conservar el mecanismo para las que no.
6. **Estado del servicio** apuntando al feed nuevo.

## Fase 3 — Tiempo real en el planner + histórico (Q1 2027)

Lo que la restricción de Vercel hacía imposible:

1. **Histórico de arribos/posiciones** persistido (Supabase ya está en el
   stack): headways reales por línea y franja horaria.
2. **Alimentar el modelo de costos del planner** con esos headways en lugar de
   estimaciones fijas (`features/trip-planner/lib/costModel.ts`).
3. **Itinerarios con datos en vivo:** «salí ahora y llegás 14:32», usando
   arribos reales para la primera pierna del viaje.
4. **(Condicional a Fase 0)** Si el feed es GPS crudo: motor de predicción de
   arribos propio, validado contra el histórico.

## Fase 4 — Producto sobre la nueva base (Q2 2027)

Features que recién tienen sentido con un feed confiable y barato de consultar:

1. **Notificaciones push** («tu bondi llega en 5 min») sobre la PWA.
2. **Alertas de desvíos/cortes** si la cámara las publica.
3. **Datos abiertos:** export GTFS público si la licencia del convenio lo
   permite — posicionaría al proyecto como referencia de datos de transporte
   de MDP.
4. **Métricas públicas de calidad del servicio** (ya existe
   `app/un-mes-en-numeros` como base).

## Transversal todo el año

- **Tests:** extender la base vitest (planner, cost-model, transit-graph ya
  cubiertos) a la capa de provider y a la validación de catálogo.
- **Monitoreo de precisión:** comparar ETA mostrada vs. arribo real, de forma
  continua — es el indicador de salud del feed.
- **PWA/perf/accesibilidad:** mantener WCAG AA ([DESIGN.md](../DESIGN.md)) y
  presupuestos de bundle por feature.

## Riesgos principales

| Riesgo | Mitigación |
| ------ | ---------- |
| El feed de la cámara se demora o se cae el acuerdo | Fases 1 y transversales no dependen de él; MGP sigue como proveedor |
| Calidad de datos peor que la actual | Shadow mode con criterio de corte explícito; fallback MGP |
| Formato no estándar / mal documentado | Presupuestar el adaptador en Fase 1; pedir muestras reales en Fase 0 |
| Cambio de IDs rompe favoritos/historial | Tabla de mapeo + migración LocalStorage (Fase 2.4) |
| Dependencia de un único proveedor nuevo | Mantener dump estático como fallback de catálogo todo el año |
