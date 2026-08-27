/**
 * Contenido Markdown servido vía negociación `Accept: text/markdown`
 * (acceptmarkdown.com). Mismo contenido real que las páginas HTML
 * correspondientes, resumido a mano — no es contenido distinto para
 * agentes (eso sería cloaking), es la misma información sin el chrome de
 * la UI. Si el copy de una página cambia, actualizar acá también.
 */

const BASE = "https://bondimdp.com.ar";

/** Rutas HTML con contraparte Markdown. La key es el slug bajo /md/. */
export const MARKDOWN_ROUTES: Record<string, string> = {
    "/": "home",
    "/acerca": "acerca",
    "/privacidad": "privacidad",
    "/contacto": "contacto",
    "/un-mes-en-numeros": "un-mes-en-numeros",
    "/blog": "blog",
    "/blog/bondi-mdp-vs-cuando-llega": "blog-bondi-mdp-vs-cuando-llega",
    "/blog/como-saber-cuando-llega-el-colectivo-en-mar-del-plata": "blog-como-saber-cuando-llega",
};

const PAGES: Record<string, string> = {
    home: `# Bondi MDP — App de colectivos en Mar del Plata

> App gratuita para saber cuándo llega tu bondi en Mar del Plata. Horarios,
> recorridos y paradas en tiempo real de todas las líneas (511, 522, 541 y
> más) con datos oficiales de la Municipalidad de General Pueyrredón (MGP).

## Qué podés hacer
- [Consultar colectivo](${BASE}/consultar) — arribos en tiempo real de cualquier línea.
- [Ver recorridos](${BASE}/recorrido) — mapa interactivo con recorridos y paradas de todas las líneas.
- [Cómo llego](${BASE}/como-llego) — planificá tu viaje ingresando origen y destino.
- [Paradas cerca mío](${BASE}/paradas-cerca) — encontrá la parada de colectivo más cercana a tu ubicación.

## Por qué usarla
- Sin cuenta, sin descarga de tienda: funciona 100% en el navegador y es instalable como PWA.
- Datos oficiales de MGP, en una interfaz más rápida y liviana que la oficial.
- Incluye líneas que no están en la app oficial (por ejemplo, la 221).

## Quiénes la hicieron
Proyecto independiente y de código abierto, sin afiliación con la Municipalidad de General Pueyrredón. Más en [/acerca](${BASE}/acerca).

## Más
- [Sobre Bondi MDP](${BASE}/acerca)
- [Contacto](${BASE}/contacto)
- [Política de privacidad](${BASE}/privacidad)
- [Mapa del sitio](${BASE}/sitemap.xml)
- [llms.txt](${BASE}/llms.txt)
`,

    acerca: `# Acerca de Bondi MDP

Información de colectivos en tiempo real para Mar del Plata. Rápida, clara y sin vueltas.

## Sobre la app
- **Tiempo real**: consultá líneas, paradas y próximos arribos al instante.
- **Rápida**: sin registro ni pasos innecesarios.
- **Independiente**: alternativa simple y directa para consultar el transporte.

## Hecho por
- **Nicolás Jiménez** — Frontend Developer · Multimedia Designer · [dotfn.dev](https://dotfn.dev) · [GitHub](https://github.com/dotfn)
- **Matias Celiz Ramos** — Técnico en Informática · [celizin.dev](https://celizin.dev) · [GitHub](https://github.com/Celiz)

## Código abierto
- [Repositorio en GitHub](https://github.com/cuando-llega-mi-bondi/cuando-llega-mi-bondi)
- [Reportar bugs o proponer mejoras](https://github.com/cuando-llega-mi-bondi/cuando-llega-mi-bondi/issues)

## Preguntas frecuentes
- **¿Es gratis?** Sí. 100% gratuita. Se sostiene con publicidad no intrusiva.
- **¿Funciona sin internet?** Necesitás conexión para obtener los datos en tiempo real.
- **¿Qué líneas incluye?** Todas las líneas de colectivos de Mar del Plata.

## Más
- [Inicio](${BASE}/)
- [Contacto](${BASE}/contacto)
- [Política de privacidad](${BASE}/privacidad)
`,

    privacidad: `# Política de privacidad — Bondi MDP

Bondi MDP es una app gratuita para consultar el transporte público de Mar del Plata. No pedimos registro ni creamos cuentas de usuario, y no vendemos tus datos personales.

## Responsable
Proyecto independiente y de código abierto. Consultas: [issues en GitHub](https://github.com/cuando-llega-mi-bondi/cuando-llega-mi-bondi/issues) o [contacto](${BASE}/contacto).

## Qué información tratamos
- **Datos que vos nos das**: ninguno por registro, no hay login. Si usás geolocalización (paradas cerca, cómo llego), se usa solo para calcular resultados cercanos; no guardamos un historial de ubicaciones asociado a tu identidad.
- **Datos automáticos**: IP, dispositivo, navegador y páginas visitadas, vía los servicios de terceros de abajo.
- **Datos en tu dispositivo**: favoritos y tema (claro/oscuro) se guardan localmente en el navegador, no se envían a nuestros servidores.

## Publicidad y analítica (terceros)
Google AdSense, Google Analytics, Microsoft Clarity y Vercel Analytics. Detalle completo y última fecha de actualización en [/privacidad](${BASE}/privacidad).

## Tus derechos
Según la Ley N.º 25.326 de Protección de Datos Personales de Argentina, tenés derecho a acceder, rectificar, actualizar y suprimir tus datos personales. Contactanos en [/contacto](${BASE}/contacto).

*Este es un resumen. La página [/privacidad](${BASE}/privacidad) es la fuente de verdad.*
`,

    contacto: `# Contacto — Bondi MDP

Bondi MDP es un proyecto independiente y de código abierto hecho en Mar del Plata, Argentina. No es una app oficial de la Municipalidad de General Pueyrredón.

## Reportar un problema o error en los horarios
Abrí un [issue en GitHub](https://github.com/cuando-llega-mi-bondi/cuando-llega-mi-bondi/issues).

## Consultas por publicidad
Ver [/anunciate](${BASE}/anunciate) y los [Términos del lugar](${BASE}/terminos).

## Datos personales y privacidad
Escribinos a maticelizramos@gmail.com para ejercer tus derechos sobre datos personales (Ley N.º 25.326) o por cualquier otra consulta. Más en [/privacidad](${BASE}/privacidad).

## Quiénes somos
[Nicolás Jiménez](https://dotfn.dev) y [Matias Celiz Ramos](https://celizin.dev). Código en [GitHub](https://github.com/cuando-llega-mi-bondi/cuando-llega-mi-bondi). Más en [/acerca](${BASE}/acerca).
`,
    "un-mes-en-numeros": `# Bondi MDP: estadísticas del primer mes

> Publicado el 28 de mayo de 2026. Datos estáticos de un período cerrado (29 de abril al 27 de mayo de 2026); no reflejan el uso actual del servicio.

En su primer mes, Bondi MDP registró 19.267 usuarios activos únicos, 87.784 sesiones totales y aproximadamente 300.000 vistas de página. El 91% del tráfico proviene del Partido de General Pueyrredón. Cerca de 2 de cada 3 usuarios volvieron a usar la app, con un promedio de 4,5 visitas por usuario recurrente.

## Por qué existe Bondi MDP
Mar del Plata dependía de "Cuándo Llega", la app oficial de la Municipalidad. Durante un tiempo dejó de estar disponible en las tiendas de aplicaciones, y la comunidad tech local respondió con Bondi MDP: un proyecto sin fines de lucro, de código abierto, sin registro y sin necesidad de instalación (PWA).

## Cobertura de prensa
Diario La Capital de Mar del Plata y Mi8 cubrieron el lanzamiento, describiendo a Bondi MDP como "la alternativa a la aplicación Cuándo Llega".

## Más
- [Inicio](${BASE}/)
- [Sobre Bondi MDP](${BASE}/acerca)
- [Repositorio en GitHub](https://github.com/cuando-llega-mi-bondi/cuando-llega-mi-bondi)
`,
    blog: `# Blog — Bondi MDP

Comparativas y guías sobre transporte público en Mar del Plata.

## Artículos
- [Bondi MDP vs. Cuándo Llega](${BASE}/blog/bondi-mdp-vs-cuando-llega) — comparativa entre la app oficial de la Municipalidad de General Pueyrredón y Bondi MDP.
- [Cómo saber cuándo llega el colectivo en Mar del Plata](${BASE}/blog/como-saber-cuando-llega-el-colectivo-en-mar-del-plata) — guía con todas las formas de consultar horarios en tiempo real.

## Más
- [Inicio](${BASE}/)
- [Sobre Bondi MDP](${BASE}/acerca)
`,

    "blog-bondi-mdp-vs-cuando-llega": `# Bondi MDP vs. Cuándo Llega: comparativa de apps de colectivos en Mar del Plata

Comparativa neutral, hecha por el equipo de Bondi MDP, entre la app oficial "Cuándo Llega" de la Municipalidad de General Pueyrredón (MGP) y Bondi MDP.

## En qué se parecen
Ambas son gratuitas y usan los mismos datos oficiales en tiempo real de la MGP.

## Diferencias
- **Instalación**: "Cuándo Llega" requiere descarga desde Google Play o App Store. Bondi MDP es una PWA instalable directo desde el navegador, sin tienda de apps.
- **Registro**: Bondi MDP no pide cuenta.
- **Cobertura**: Bondi MDP suma la línea 221 (Costa Azul) vía trazado manual, no incluida en la API oficial.
- **Código**: Bondi MDP es [código abierto](https://github.com/cuando-llega-mi-bondi/cuando-llega-mi-bondi).

## Quién hizo Bondi MDP
Nicolás Jiménez y Matias Celiz Ramos, dos desarrolladores marplatenses. Cobertura de prensa en Diario La Capital de Mar del Plata y Mi8.

## Más
- [Blog](${BASE}/blog)
- [Inicio](${BASE}/)
`,

    "blog-como-saber-cuando-llega": `# Cómo saber cuándo llega el colectivo en Mar del Plata

Guía de las formas disponibles para consultar el arribo de colectivos en tiempo real en Mar del Plata.

## Opciones
- App oficial "Cuándo Llega" de la Municipalidad de General Pueyrredón.
- [Bondi MDP](${BASE}/) — alternativa PWA, sin registro, con la misma data oficial.
- Consultá directo en [/consultar](${BASE}/consultar), mirá el [recorrido de tu línea](${BASE}/recorrido), planificá con [cómo llego](${BASE}/como-llego) o encontrá la [parada más cercana](${BASE}/paradas-cerca).

## Más
- [Comparativa Bondi MDP vs. Cuándo Llega](${BASE}/blog/bondi-mdp-vs-cuando-llega)
- [Blog](${BASE}/blog)
`,
};

export function getMarkdownPage(slug: string): string | null {
    return PAGES[slug] ?? null;
}

/** Cuerpo Markdown para rutas que no existen (404), con salida hacia adelante. */
export const NOT_FOUND_MARKDOWN = `# 404 — Página no encontrada

La ruta pedida no existe en Bondi MDP.

## Dónde mirar
- [Inicio](${BASE}/)
- [Consultar colectivo](${BASE}/consultar)
- [Ver recorridos](${BASE}/recorrido)
- [Cómo llego](${BASE}/como-llego)
- [Paradas cerca mío](${BASE}/paradas-cerca)
- [Mapa del sitio](${BASE}/sitemap.xml)
- [llms.txt](${BASE}/llms.txt)
`;
