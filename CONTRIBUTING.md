# Contribuir a Bondi MDP

¡Gracias por tu interés en contribuir a este proyecto open-source! Para asegurarnos de que el proceso sea lo más transparente y sencillo posible, por favor lee las siguientes pautas.

## Proceso de Desarrollo (Setup)

1. **Haz un Fork** del repositorio a tu propia cuenta de GitHub.
2. **Clona tu Fork** a tu máquina local:
   ```bash
   git clone https://github.com/TU_USUARIO/cuandollega.git
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

Para que te orientes rápidamente, aquí te explicamos cómo organizamos el código:

- `/app`: Rutas del [App Router](https://nextjs.org/docs/app) de Next.js (layout, rutas base de front).
  - `/app/api/cuando/route.ts`: El **proxy** que se comunica con la API de la municipalidad.
- `/components`: Todos los componentes de React (`HomeClient`, `SearchFlow`, `Map`, iconos, modales).
- `/lib`: Lógica no visual (servicios API, tipos, utilidades, localStorage/caché).
  - `cuandoLlega.ts`: Wrapper para toda la lógica de fetch.
  - `localCache.ts`: Encargado de la caché persistente (24hs).
- `/public`: Assets estáticos (iconos PWA, Service Worker `sw.js`).
- `/public/*.geojson`: Archivos de rutas para líneas manuales.

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
3. **Validación:** Una vez agregado, la línea aparecerá automáticamente en el buscador principal y el mapa cargará el recorrido desde el archivo local sin consultar el proxy.

## Convenciones de Código

- **Tipado Fuerte:** Trata de evitar `any` tanto como sea posible. Si agregas o modificas una llamada a la API, tipa sus resultados en `lib/cuandoLlega.types.ts`.
- **CSS Vanilla (Módulos Flexibles):** El styling primario se maneja a través de variables en `globals.css` y `style={{}}` inline para rapidez, aunque migraciones graduales a CSS Modules o Tailwind son bienvenidas en discusiones si escalan demasiado.
- **Componentes Modulares:** Un componente debe hacer una sola cosa. Si tu componente excede las ~200 líneas, probablemente puedas extraer la lógica o UI hija en otro archivo pequeño.

## Enviar tus Cambios (Pull Request)

1. Revisa tus cambios localmente y asegúrate de que **no rompen el build**:
   ```bash
   npm run build
   ```
2. Realiza tus commits con **mensajes descriptivos y atómicos** (si usas [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), aún mejor).
3. Push de tu rama a GitHub:
   ```bash
   git push origin feature/mi-nueva-funcionalidad
   ```
4. Abre un **Pull Request (PR)** en el repositorio original.
5. En la descripción del PR, explica brevemente:
   - ¿Qué problema resuelve este código?
   - ¿Por qué decidiste esta implementación concreta?
   - Agrega screenshots (si hubo cambios visuales).

## Reportar Bugs e Issues

Abre una issue en GitHub si encuentras un bug. Incluye, si es posible:
- Pasos para reproducirlo.
- En qué navegador / dispositivo sucede.
- Comportamiento esperado.

¡Agradecemos mucho cualquier tipo de ayuda para mantener la aplicación rápida, moderna y sin errores!
