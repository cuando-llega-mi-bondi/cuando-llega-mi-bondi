# Design System MDP — Adaptado desde Framer

## 1. Visual Theme & Atmosphere

MDP es una plataforma de movilidad urbana accesible, precisa y orientada a la acción. El canvas principal en **light mode** es un blanco cálido apagado (`#f7f7f4`) — no un blanco clínico, sino una superficie suave que reduce la fatiga visual y da protagonismo al contenido. En **dark mode** el fondo profundiza a un azul petróleo oscuro (`#0f2d4a`), creando una experiencia nocturna coherente sin caer en el negro absoluto.

El color amarillo MDP (`#f9cd4a`) actúa como acento principal de CTA — enérgico, visible, de alta accesibilidad cuando se combina con texto oscuro (`#0f2d4a`). El turquesa (`#1d7570`) define los elementos interactivos: focus rings, íconos activos, bordes de inputs. El rosa (`#c93679`) se reserva para acciones destructivas o de alerta de alto impacto.

La tipografía conserva la filosofía de compresión de Framer: GT Walsheim en display con tracking negativo agresivo, Inter en cuerpo con OpenType maximalist. La diferencia es el tono: donde Framer es nightclub, MDP es servicio público de primer nivel — confiable, claro, accesible, sin sacrificar personalidad.

**Key Characteristics:**
- Blanco cálido (`#f7f7f4`) en light / Azul petróleo (`#0f2d4a`) en dark — nunca grises neutros genéricos
- Amarillo MDP (`#f9cd4a`) como único CTA primario — siempre con texto oscuro
- Turquesa (`#1d7570`) como color interactivo / de sistema
- Rosa (`#c93679`) reservado para alertas y acciones críticas
- Botones pill (border-radius 1rem+) — ningún botón con esquinas vivas
- WCAG AA mínimo en todos los pares de color — accesibilidad no negociable
- Mínimo 44px de área táctil en todos los controles interactivos

---

## 2. Color Palette & Roles

### Brand Tokens (invariantes modo claro/oscuro)

| Token | Valor | Rol |
|---|---|---|
| `--mdp-rosa` | `#c93679` | Alertas, destructivos, acciones críticas. Solo con texto `#ffffff`. Ratio ~5.0:1 ✓ AA |
| `--mdp-amarillo` | `#f9cd4a` | CTA principal, acentos visuales. **Siempre** con texto `#0f2d4a`. Ratio 8.2:1 ✓ AAA |
| `--mdp-turquesa` | `#1d7570` | Interactivos, focus rings, íconos activos. Con texto `#ffffff`. Ratio ~4.85:1 ✓ AA |
| `--mdp-turquesa-light` | `#289b95` | Fondos decorativos, hover sobre turquesa |
| `--mdp-error` | `#b83030` | Estados de error. Ratio ~5.4:1 ✓ AA |
| `--mdp-success` | `#1e7a52` | Estados de éxito. Ratio ~5.1:1 ✓ AA |

### Light Mode

| Token CSS | Valor | Rol |
|---|---|---|
| `--background` | `#f7f7f4` | Fondo principal de página |
| `--foreground` | `#0f2d4a` | Texto principal — máximo contraste |
| `--card` | `#ffffff` | Superficie de tarjetas |
| `--muted` | `#ededea` | Fondos secundarios, inputs |
| `--muted-foreground` | `#4a6070` | Texto secundario / descriptivo. Ratio 5.2:1 ✓ |
| `--border` | `#d4d4d0` | Bordes generales |
| `--input` | `#ededea` | Fondo de campos de formulario |
| `--ring` | `#1d7570` | Focus ring de teclado (turquesa) |
| `--primary` | `#f9cd4a` | Botón primario / CTA |
| `--primary-foreground` | `#0f2d4a` | Texto sobre primario |
| `--secondary` | `#1d7570` | Botón secundario |
| `--secondary-foreground` | `#ffffff` | Texto sobre secundario |
| `--destructive` | `#c93679` | Acciones destructivas |
| `--destructive-foreground` | `#ffffff` | Texto sobre destructivo |

### Dark Mode

| Token CSS | Valor | Rol |
|---|---|---|
| `--background` | `#0f2d4a` | Fondo principal |
| `--foreground` | `#f0f4f8` | Texto principal suavizado |
| `--card` | `#122843` | Superficie de tarjetas |
| `--muted` | `#0a2038` | Fondos secundarios |
| `--muted-foreground` | `#8ba4bb` | Texto secundario. Ratio 4.6:1 ✓ |
| `--border` | `#1e3f5c` | Bordes |
| `--input` | `#0a2038` | Fondo de campos |
| `--ring` | `#f9cd4a` | Focus ring en dark (amarillo visible) |
| `--secondary` | `#24908a` | Turquesa más brillante en dark |
| `--destructive` | `#e05588` | Rosa más brillante en dark |

### Superficie Glassmorphism
- **Tarjeta flotante light:** `rgba(255, 255, 255, 0.92)` + `backdrop-filter: blur(16px) saturate(1.6)`
- **Tarjeta flotante dark:** `rgba(10, 32, 56, 0.88)` + `backdrop-filter: blur(16px) saturate(1.6)`
- **Botón selector light:** `rgba(255, 255, 255, 0.95)` + `backdrop-filter: blur(16px)`
- **Botón selector dark:** `rgba(10, 32, 56, 0.92)` + `backdrop-filter: blur(16px)`

### Sistema de Elevación (Sombras)

| Nivel | Tratamiento | Uso |
|---|---|---|
| Level 0 (Flat) | Sin sombra | Fondo base |
| Level 1 (Ring) | `box-shadow: 0 0 0 1px var(--border)` | Tarjetas base, contenedores |
| Level 2 (Turquesa Ring) | `box-shadow: 0 0 0 3px rgba(29,117,112,0.25)` | Focus ring en inputs activos |
| Level 3 (Floating) | `0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)` | Tarjetas flotantes, dropdowns |
| Level 4 (Selector) | `0 8px 32px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.1)` | Botones flotantes sobre mapa |

---

## 3. Typography Rules

### Font Family
- **Global**: `Inter Variable` — Única familia tipográfica utilizada en todo el proyecto. Se aprovechan sus variables de peso y OpenType features extensivos para cubrir todas las necesidades de jerarquía (Display, Body, Mono/Code, UI).

### Jerarquía

| Rol | Font | Size | Weight | Line Height | Letter Spacing | Notas |
|---|---|---|---|---|---|---|
| Display Hero | Inter Variable | 96px | 700 | 0.95 | -3px | Compresión y peso para alto impacto |
| Section Display | Inter Variable | 72px | 700 | 1.00 | -2px | |
| Section Heading | Inter Variable | 56px | 600 | 1.05 | -1.5px | |
| Feature Heading | Inter Variable | 32px | 600 | 1.13 | -1px | |
| Card Title | Inter Variable | 24px | 500 | 1.30 | -0.01px | cv01, cv05, cv09, cv11, ss03, ss07 |
| Feature Title | Inter Variable | 22px | 700 | 1.20 | -0.8px | cv05 |
| Sub-heading | Inter Variable | 20px | 600 | 1.20 | -0.8px | cv01, cv09 |
| Body Large | Inter Variable | 18px | 400 | 1.30 | -0.01px | cv01, cv05, cv09, cv11, ss03, ss07 |
| Body | Inter Variable | 15px | 400 | 1.30 | -0.01px | cv11 |
| Nav/UI | Inter Variable | 15px | 500 | 1.00 | -0.15px | cv06, cv11, dlig, ss03 |
| Body Readable | Inter Variable | 14px | 400 | 1.60 | normal | Cuerpo largo |
| Caption | Inter Variable | 14px | 400 | 1.40 | normal | cv01, cv06, cv09, cv11, ss03, ss07 |
| Label | Inter Variable | 13px | 500 | 1.60 | normal | cv06, cv11, ss03 |
| Small Caption | Inter Variable | 12px | 400 | 1.40 | normal | |
| Micro Code | Inter Variable | 11px | 400 | 1.60 | normal | tabular nums / mono-like |
| Badge | Inter Variable | 10px | 600 | 1.11 | normal | cv01, cv09, uppercase |

### Principios
- **Unificación tipográfica**: Inter es la única tipografía para mantener coherencia extrema y optimizar la carga.
- **OpenType maximalism**: Inter con múltiples features simultáneos para adaptar la lectura.
- **Display con tracking negativo**: Para mantener el impacto visual sin necesidad de fuentes condensadas adicionales.

---

## 4. Component Stylings

### Buttons

| Variante | Background | Texto | Border Radius | Min Height | Notas |
|---|---|---|---|---|---|
| **Amarillo (Primary CTA)** | `#f9cd4a` | `#0f2d4a` | `1rem` | 44px | Hover: opacity 0.88 |
| **Turquesa (Secondary)** | `#1d7570` | `#ffffff` | `1rem` | 44px | Hover: opacity 0.88 |
| **Rosa (Destructive)** | `#c93679` | `#ffffff` | `1rem` | 44px | Solo acciones críticas |
| **Ghost** | `transparent` | `var(--foreground)` | `1rem` | 44px | Borde `1px solid var(--border)` |
| **Glassmorphism Selector** | `rgba(255,255,255,0.95)` | `var(--foreground)` | `1rem` | 44px | Para controles sobre mapa |

Todos los botones:
- `font-weight: 700`
- `transition: opacity 0.15s ease, transform 0.1s ease`
- `:active { transform: scale(0.98) }`
- `:disabled { opacity: 0.45; cursor: not-allowed }`

### Cards & Containers

```css
/* Tarjeta base */
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg); /* 1rem */
}

/* Tarjeta flotante glassmorphism */
.card-floating {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px) saturate(1.6);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .card-floating {
    background: rgba(10, 32, 56, 0.88);
    border-color: rgba(255, 255, 255, 0.12);
  }
}

/* Arrival card */
.arrival-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.arrival-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.1);
}
```

### Inputs & Forms

```css
.input {
  border: 1.5px solid var(--border);        /* reposo */
  background: var(--input);
  border-radius: calc(var(--radius) - 2px); /* radius-md */
  min-height: 44px;
  padding: 0.75rem 0.875rem;
  color: var(--foreground);
  font-size: 0.875rem;
}
.input:hover  { border-color: var(--mdp-turquesa); }
.input:focus  {
  border-color: var(--mdp-turquesa);
  box-shadow: 0 0 0 3px rgba(29,117,112,0.25);
  outline: none;
}
.input--error {
  border-color: var(--mdp-error);
  box-shadow: 0 0 0 3px rgba(184,48,48,0.2);
}
.input--success {
  border-color: var(--mdp-success);
  box-shadow: 0 0 0 3px rgba(30,122,82,0.2);
}
```

Helper text: `font-size: 0.8125rem; margin-top: 0.375rem`
- Error: `color: var(--mdp-error)`
- Éxito: `color: var(--mdp-success)`

### Navigation
- Fondo: `var(--background)` con `backdrop-filter: blur(12px)` en sticky
- Texto links: Inter 15px, peso 400, `var(--foreground)`
- CTA nav: Pill amarillo (`#f9cd4a`) o ghost turquesa
- Focus ring: `outline: 2.5px solid var(--ring); outline-offset: 3px`
- Mobile: hamburger, mantiene paleta y pilotaje por color

### Íconos Circulares

```css
.icon-wrap {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: var(--mdp-turquesa);
  color: #ffffff;
}
.icon-wrap--amarillo {
  background: var(--mdp-amarillo);
  color: #0f2d4a; /* 8.2:1 ✓ AAA */
}
```

### Bottom Sheet (react-modal-sheet)
- `border-radius: 24px 24px 0 0`
- Header sticky: `background: rgba(255,255,255,0.98); backdrop-filter: blur(12px)`
- Dark header: `background: rgba(10,32,56,0.98)`
- Drag indicator: `background: rgba(0,0,0,0.18)` → activo: `var(--mdp-turquesa)`
- Scrollbar thumb: `rgba(0,0,0,0.18)`, dark: `rgba(255,255,255,0.2)`

---

## 5. Layout Principles

### Spacing System
- **Base unit**: 8px
- **Escala**: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 120px
- **Padding de sección**: 80px–120px vertical
- **Padding de tarjeta**: 16px–24px interno
- **Gap entre elementos**: 8px–20px

### Border Radius Scale

| Nombre token | Valor | Uso |
|---|---|---|
| `--radius-sm` | `calc(var(--radius) - 4px)` ≈ 12px | Badges, chips pequeños |
| `--radius-md` | `calc(var(--radius) - 2px)` ≈ 14px | Inputs, campos |
| `--radius-lg` | `var(--radius)` = 16px | Tarjetas estándar |
| `--radius-xl` | `calc(var(--radius) + 4px)` ≈ 20px | Tarjetas destacadas |
| `--radius-2xl` | `calc(var(--radius) + 8px)` ≈ 24px | Modales, sheets |
| Pill | `9999px` o `100px` | Botones, tags, pills de filtro |

### Grid & Container
- **Max width**: ~1200px centrado
- **Columnas**: Full-width hero, 2-col features, single-col showcases de producto
- **Asimetría**: Texto 40% + componente/mapa 60%

### Filosofía de espacio
- **Respiración generosa entre secciones** — el bg cálido necesita aire para lucir
- **Densidad controlada dentro de componentes** — tarjetas compactas pero no ahogadas
- **Mapa como hero art** — las vistas de recorridos son el showcase de producto

---

## 6. Accessibility Rules

| Regla | Detalle |
|---|---|
| Touch target mínimo | 44px × 44px (`--touch-min: 44px`) |
| Focus visible global | `outline: 2.5px solid var(--ring); outline-offset: 3px` |
| Tap highlight | `-webkit-tap-highlight-color: transparent` + estados activos propios |
| Contraste mínimo | WCAG AA (4.5:1 texto normal, 3:1 texto grande) en todos los pares |
| Reduced motion | Todas las animaciones respetan `prefers-reduced-motion: reduce` |
| Amarillo con texto | **Siempre** `#0f2d4a` (8.2:1 AAA) — nunca amarillo con texto claro |
| Safe area iOS | `padding-bottom: max(1rem, env(safe-area-inset-bottom))` |

---

## 7. Animations & Motion

```css
/* Entrada principal */
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Skeleton loading */
@keyframes skeleton-loading {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Spinner */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Pulse turquesa — highlight de parada activa */
@keyframes pulse-highlight {
  0%, 100% { box-shadow: 0 0 0px rgba(29,117,112,0); }
  50%       { box-shadow: 0 0 12px rgba(29,117,112,0.6); }
}
```

**Durations:**
- Micro (hover/active): 100–150ms `ease`
- Estándar (reveal, open): 250–300ms `cubic-bezier(0.34,1.56,0.64,1)` (spring)
- Sheet (modal): 300ms `cubic-bezier(0.4,0,0.2,1)`
- Skeleton: 1.4s `ease-in-out infinite`

---

## 8. Responsive Behavior

| Breakpoint | Ancho | Cambios clave |
|---|---|---|
| Mobile | < 640px | Single column, hero text ~40px, hamburger nav, CTAs full-width |
| Tablet | 640–1199px | 2-col features, nav parcial, componentes escalan |
| Desktop | ≥ 1200px | Layout completo, 110px hero, nav full, side-by-side |

**Estrategia de colapso:**
- Navegación: horizontal → hamburger en mobile
- Hero text: 110px → 85px → 62px → ~40px (tracking negativo proporcional)
- Secciones feature: lado a lado → apilado vertical
- Bottom sheets: solo aparecen en mobile (≤ 640px)

---

## 9. Do's and Don'ts

### ✅ Do
- Usar `#f7f7f4` como fondo light — no blanco puro ni grises genéricos
- Usar `#0f2d4a` como fondo dark — no negro absoluto
- Amarillo `#f9cd4a` **exclusivamente** con texto `#0f2d4a` — nunca con texto claro
- Turquesa `#1d7570` para **todos** los estados interactivos: hover, focus, active
- Rosa `#c93679` **solo** para acciones destructivas o alertas críticas
- Todos los botones pill — `border-radius: 1rem` mínimo
- Usar **únicamente** la fuente Inter en todos sus pesos y variables
- Focus ring visible en **todos** los elementos interactivos de teclado
- 44px touch target mínimo en **todos** los controles

### ❌ Don't
- Usar amarillo como fondo de texto pequeño sobre blanco
- Usar rosa como color decorativo o de énfasis general
- Botones con esquinas vivas (`border-radius < 8px`) — nunca
- Introducir tipografías adicionales a Inter — rompe la identidad de marca unificada
- Ignorar `prefers-reduced-motion` — todas las animaciones deben respetarla
- Texto `--muted-foreground` sobre fondos que no sean `--background` o `--card` sin verificar contraste
- Glassmorphism sin fallback para navegadores sin soporte a `backdrop-filter`
- Más de un color de acento en la misma vista — el sistema es tri-color (amarillo/turquesa/rosa) con roles exclusivos

---

## 10. Agent Prompt Guide

### Quick Color Reference

```
Background light:    #f7f7f4
Background dark:     #0f2d4a
Foreground light:    #0f2d4a
Foreground dark:     #f0f4f8
CTA primario:        #f9cd4a  (texto: #0f2d4a — AAA)
Interactivo:         #1d7570  (texto: #ffffff — AA)
Alerta/Destructivo:  #c93679  (texto: #ffffff — AA)
Error:               #b83030
Éxito:               #1e7a52
Borde light:         #d4d4d0
Borde dark:          #1e3f5c
Texto secundario L:  #4a6070
Texto secundario D:  #8ba4bb
```

### Example Component Prompts

- *"Botón CTA principal: `background: #f9cd4a`, `color: #0f2d4a`, `font-weight: 700`, `border-radius: 1rem`, `min-height: 44px`. Hover: `opacity: 0.88`. Active: `transform: scale(0.98)`"*

- *"Tarjeta estándar: `background: var(--card)`, `border: 1px solid #d4d4d0`, `border-radius: 1rem`. Dark: `background: #122843`, `border-color: #1e3f5c`"*

- *"Input activo: `border: 1.5px solid #1d7570`, `box-shadow: 0 0 0 3px rgba(29,117,112,0.25)`, `outline: none`"*

- *"Badge de éxito: `background: rgba(30,122,82,0.12)`, `color: #1e7a52`, `border: 1px solid #1e7a52`, `border-radius: 9999px`, `font-size: 12px`, `font-weight: 600`"*

- *"Tarjeta flotante sobre mapa: `background: rgba(255,255,255,0.92)`, `backdrop-filter: blur(16px) saturate(1.6)`, `border: 1px solid rgba(255,255,255,0.6)`, `box-shadow: 0 4px 24px rgba(0,0,0,0.12)`"*

- *"Ícono circular turquesa: `width/height: 40px`, `border-radius: 50%`, `background: #1d7570`, `color: #ffffff`. Variante amarillo: `background: #f9cd4a`, `color: #0f2d4a`"*

- *"Hero section: fondo `#f7f7f4` (light) / `#0f2d4a` (dark), heading Inter 96px peso 700 `letter-spacing: -3px` `line-height: 0.95`, CTA pill amarillo `border-radius: 100px`"*

### Iteration Guide
1. Verificar siempre el par de contraste antes de usar amarillo — **nunca** sin texto `#0f2d4a`
2. Turquesa va en interactivos; rosa va en destructivos — no intercambiarlos
3. Inter es la única fuente permitida — ajustar peso y tracking para lograr jerarquía en vez de cambiar de tipografía
4. Focus ring debe ser visible en modo teclado — `outline: 2.5px solid var(--ring)` es obligatorio
5. Glassmorphism requiere `backdrop-filter` + fallback sólido para Safari antiguo
