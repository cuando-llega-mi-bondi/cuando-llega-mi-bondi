# Contribuir a Bondi MDP

¡Gracias por tu interés en contribuir a este proyecto open-source! Para asegurarnos de que el proceso sea lo más transparente y sencillo posible, por favor lee las siguientes pautas.

## Proceso de Desarrollo (Setup)

1. **Haz un Fork** del repositorio a tu propia cuenta de GitHub.
2. **Clona tu Fork** a tu máquina local:
   ```bash
   git clone https://github.com/TU_USUARIO/cuando-llega-mi-bondi.git
   ```
3. **Crea una nueva rama (branch)** para tu funcionalidad o corrección:
   ```bash
   git checkout -b feature/mi-nueva-funcionalidad
   ```
   *(Usa prefijos como `feature/`, `bugfix/`, `docs/`, `refactor/` para una mejor organización).*
4. Instala las dependencias y corre el modo desarrollo:
   ```bash
   npm install
   npm run dev
   ```

## Estructura del Proyecto

Para orientarte rápido, así está organizado el código hoy:

- **`/app`**: rutas del [App Router](https://nextjs.org/docs/app) de Next.js.
  - `layout.tsx`, `page.tsx`: shell y página principal.
  - `/consultar`, `/recorrido`, `/acerca`: flujos de consulta, mapa de recorrido y página institucional.
  - `/app/api/reference/route.ts`: sirve catálogo (líneas, calles, paradas) desde el dump estático en `data/mgp-static-dump.json`. Único path de datos MGP que vive en Vercel.
  - `/app/api/telegram-webhook/route.ts`: webhook opcional del bot de Telegram (Supabase + token del bot).
- **`/components`**: UI en React (`HomeClient`, `SearchFlow`, `RouteMap`, `Combobox`, carpeta `search/`, iconos, etc.).
- **`/lib/api`**: cliente del proxy (`client.ts` con `post` / `swrFetcher`) y módulos por dominio (`lineas.ts`, `arribos.ts`, `recorrido.ts`, …).
- **`/lib/hooks`**: hooks con SWR (`useLineas`, `useArribos`, `useCalles`, …).
- **`/lib/storage`**: favoritos, historial y caché persistente (`localCache.ts`, TTL 24 h donde aplica).
- **`/lib/types.ts`**: tipos compartidos (líneas, paradas, arribos, historial).
- **`/lib/manualRoutes.ts`** y **`/public/*.geojson`**: líneas no expuestas por la API oficial.
- **`/lib/liveSharePayload.ts`**: codificación del parámetro `start=` para deep links de Telegram.
- **`/lib/supabaseClient.ts`**: cliente Supabase (solo necesario si probás ubicación en vivo / webhook).
- **`/public`**: assets estáticos, PWA e **`sw.js`** (service worker).

La guía Diátaxis del repo está en [`docs/DIATAXIS.md`](docs/DIATAXIS.md).

## 🚌 Cómo agregar una línea manual (GeoJSON)

Si una línea no está disponible en la API oficial de la Municipalidad, podés integrarla manualmente:

1. **Obtené el GeoJSON:** El archivo debe contener un `LineString` con las coordenadas del recorrido. Guardalo en `/public/nombre-linea.geojson`.
2. **Configurá la ruta:** Editá `lib/manualRoutes.ts` y agregá un objeto al array `MANUAL_ROUTES`:
   ```typescript
   {
     line: {
       CodigoLineaParada: "ID_UNICO",
       Descripcion: "NOMBRE DE LA LINEA",
       CodigoEntidad: "MANUAL",
       CodigoEmpresa: 0,
       isManual: true,
     },
     geoJsonPath: "/nombre-linea.geojson",
   }
   ```
3. **Validación:** Una vez agregado, la línea aparecerá automáticamente en el buscador principal y el mapa cargará el recorrido desde el archivo local sin consultar el backend.

## Variables de entorno (desarrollo avanzado)

Para acciones en vivo (arribos, banderas) tenés que definir **`NEXT_PUBLIC_CUANDO_API_URL`** apuntando al backend self-hosted (`server/`). No hay proxy interno en este front: la muni bloquea las IPs de Vercel, así que el cliente pega directo a esa URL. Sin la env var, `post()` tira un error explícito en el primer uso. El detalle de cada variable está en el README.

Para **Telegram** y **ubicación en vivo** (mapa + webhook), además necesitás `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`, `TELEGRAM_BOT_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Convenciones de Código

- **Tipado fuerte:** Evitá `any`. Tipos de dominio en `lib/types.ts`; si extendés respuestas de la API, mantené los contratos alineados con los módulos en `lib/api/`.
- **Estilos:** **Tailwind CSS 4** para utilidades; tokens y variables globales en `app/globals.css` (`@import "tailwindcss"`, bloque `@theme inline`). Mantené coherencia con lo existente antes de introducir patrones nuevos.
- **Componentes modulares:** Un componente debe hacer una sola cosa. Si supera ~200 líneas, valorá extraer UI o lógica a archivos más chicos.

## Enviar tus Cambios (Pull Request)

1. Revisá tus cambios localmente y asegurate de que **no rompen el build**:
   ```bash
   npm run build
   npm run lint
   ```
2. Realizá tus commits con **mensajes descriptivos y atómicos** (si usás [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), aún mejor).
3. Push de tu rama a GitHub:
   ```bash
   git push origin feature/mi-nueva-funcionalidad
   ```
4. Abrí un **Pull Request (PR)** en el repositorio original.
5. En la descripción del PR, explicá brevemente:
   - ¿Qué problema resuelve este código?
   - ¿Por qué esta implementación concreta?
   - Screenshots si hubo cambios visuales.

## Reportar Bugs e Issues

Abrí una issue en GitHub si encontrás un bug. Incluí, si es posible:

- Pasos para reproducirlo.
- Navegador / dispositivo.
- Comportamiento esperado.

¡Agradecemos cualquier ayuda para mantener la aplicación rápida, moderna y sin errores!
