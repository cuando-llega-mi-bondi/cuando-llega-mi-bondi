# Documentación Diátaxis 📐

Este proyecto utiliza el marco de trabajo **Diátaxis** para organizar la documentación técnica. Diátaxis propone dividir el contenido en cuatro cuadrantes según el propósito y el contexto del usuario.

## 1. Tutoriales (orientado al aprendizaje)

Ayudan al principiante a dar sus primeros pasos. En este proyecto, la sección **«Empezar»** del [README](../README.md) es el tutorial base.

- *Meta:* Correr la app localmente en pocos minutos (clonar, `npm install`, `npm run dev`).

## 2. Guías «cómo hacer» (orientado a la tarea)

Instrucciones paso a paso para resolver un problema concreto.

- **Agregar líneas manuales (GeoJSON):** [CONTRIBUTING.md](../CONTRIBUTING.md) («Cómo agregar una línea manual»).
- **Contribuir con código y PRs:** [CONTRIBUTING.md](../CONTRIBUTING.md) (setup, estructura, convenciones).
- **Variables opcionales (Telegram / Supabase):** tabla en el [README](../README.md) («Variables de entorno (opcional)»).

## 3. Referencia (orientado a la información)

Descripciones técnicas precisas del funcionamiento.

- **Proxy municipal:** `POST /api/cuando`, acciones y body — [README](../README.md) («API Reference»); implementación en `app/api/cuando/route.ts`; cliente en `lib/api/client.ts`.
- **Tipos TypeScript:** `lib/types.ts`.
- **Webhook Telegram (opcional):** `app/api/telegram-webhook/route.ts`.

## 4. Explicación (orientado a la comprensión)

Conceptos de alto nivel, arquitectura y decisiones de diseño.

- **Flujo de datos:** diagrama Mermaid en el [README](../README.md).
- **Estructura del repo y stack:** tablas y listas en el [README](../README.md) y árbol en [CONTRIBUTING.md](../CONTRIBUTING.md).

---

> [!TIP]
> Al escribir nueva documentación, preguntate: *¿El usuario quiere aprender, completar una tarea, buscar un dato técnico o entender el porqué de algo?* Elegí el cuadrante correspondiente para mantener la claridad.
