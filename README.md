<div align="center">
  <img src="public/icon-192.png" alt="Cuándo Llega MDP Logo" width="120" />

  <h1>¿Cuándo Llega? MDP</h1>

  <p>
    <strong>Tiempos de arribo de colectivos en tiempo real para Mar del Plata.</strong>
  </p>

  <p>
    <a href="https://cuandollega-tawny.vercel.app/">Demo en Vivo</a> •
    <a href="#-empezar-getting-started">Empezar</a> •
    <a href="CONTRIBUTING.md">Contribuir</a> •
    <a href="#-arquitectura--stack-tecnológico">Arquitectura</a>
  </p>
</div>

---

> [!NOTE]
> Una Progressive Web App (PWA) rápida, moderna y responsiva. Consultá cuándo llega el colectivo a tu parada sin publicidades, sin descargar apps nativas y con posibilidad de funcionar sin conexión (caché).

<div align="center">
  <img src="public/screenshots/results.png" alt="Screenshot de la aplicación" width="400" style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);" />
</div>

## ✨ Funcionalidades

- **Tiempo real (GPS):** Consulta de arribos en tiempo real obteniendo datos del proxy de la Municipalidad de Gral. Pueyrredón.
- **Rutas Manuales (GeoJSON):** Soporte para líneas que no están en la API oficial (ej. Mar Chiquita 221) mediante archivos GeoJSON.
- **Favoritos:** Guardá tus paradas de uso diario con nombres personalizados (ej. "Casa", "Trabajo").
- **Historial inteligente:** Historial automático de las últimas paradas consultadas.
- **Mapa Interactivo Avanzado:** 
    - Visualización de colectivos acercándose en tiempo real.
    - Marcado de paradas con **navegación rápida** (vía Google Maps).
    - Trazado de recorridos completos sobre el mapa.
- **Modo PWA & Caché:** Instalación nativa en móviles e información estática (calles, recorridos) persistida localmente por 24hs.
- **WhatsApp Share:** Generación de mensajes rápidos con tiempos de arribo y ubicación exacta.
- **Status de API:** Detección y alerta visual si el servidor de la Municipalidad está fuera de servicio.

## 🛠 Arquitectura & Stack Tecnológico

La aplicación está diseñada pensando en la performance y la facilidad de extensión.

| Tecnología        | Propósito                                                            |
|-------------------|----------------------------------------------------------------------|
| **Next.js 16 (App Router)** | Framework base, optimización de bundles, y Proxy API. |
| **React 19**      | UI responsiva y gestión de estado mediante Hooks.                   |
| **SWR**           | Fetching de datos con revalidación automática y caché en memoria.   |
| **Leaflet**       | Motor de mapas liviano para visualización de GPS y GeoJSON.          |
| **LocalStorage**  | Persistencia de favoritos, historial y caché de calles (24hs TTL).    |

### Flujo de Datos

```mermaid
graph TD
  UI[UI Components] --> SWR[SWR Hooks]
  SWR --> Storage[(LocalStorage / Cache 24h)]
  SWR --> Proxy[Route Handler /api/cuando]
  Proxy --> MGP[API Municipalidad]
  UI --> Manual[lib/manualRoutes.ts]
  Manual --> GeoJSON[public/*.geojson]
```


## 🚀 Empezar (Getting Started)

Estas instrucciones te permitirán obtener una copia del proyecto y ejecutarlo en tu máquina local para desarrollo y pruebas.

### Prerrequisitos

- **Node.js** (v18.x o superior)
- **NPM** (usualmente viene con Node.js)

### Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Celiz/cuandollega.git
   cd cuandollega
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Ejecutar en entorno de desarrollo:**
   ```bash
   npm run dev
   ```

   La aplicación estará corriendo en [http://localhost:3000](http://localhost:3000).

## 📡 API Reference

Toda la comunicación con la MGP pasa a través del un único proxy en nuestro backend para evadir restricciones de CORS y ocultar orígenes.

**Endpoint:** `POST /api/cuando`

El body asume codificación `application/x-www-form-urlencoded`.

### Acciones Comunes

- `RecuperarLineaPorCuandoLlega`: Obtiene lista de líneas.
- `RecuperarCallesPrincipalPorLinea`: Recibe `codLinea`. Retorna calles que recorre.
- `RecuperarInterseccionPorLineaYCalle`: Recibe `codLinea`, `codCalle`. Retorna intersecciones de esa calle en su recorrido.
- `RecuperarParadasConBanderaPorLineaCalleEInterseccion`: Retorna las banderas y el identificador de la parada.
- `RecuperarProximosArribosW`: Recibe `identificadorParada` y `codigoLineaParada`. Retorna la información de tiempo real GPS de arribos.

*(La implementación completa se encuentra en `lib/cuandoLlega.ts` usando la función `post()` base).*

## 🤝 Contribuir

¡Las contribuciones (pull requests, reporte de bugs, sugerencias) son bienvenidas!

Revisá nuestro archivo [CONTRIBUTING.md](CONTRIBUTING.md) para más detalles sobre cómo estructurar el código, hacer un Pull Request o agregar nuevas integraciones.

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consultá el archivo [LICENSE](LICENSE) para más detalles.

---

> [!TIP]
> Si la app te es útil, apreciamos una estrella ⭐ en el [repositorio de GitHub](https://github.com/Celiz/cuandollega).
