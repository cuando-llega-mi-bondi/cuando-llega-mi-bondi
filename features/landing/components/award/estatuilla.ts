// Estatuilla 3D de los ATICMA Awards 2026, portada del sitio oficial
// (awards.aticma.org.ar/assets/js/estatuilla.js). Se arma en vivo con las medidas y
// el isotipo del dibujo original (estatuillaDatos.ts); la unidad es el radio del disco.
//
// Cambios respecto del original:
// - Es un módulo del cliente (se importa dinámicamente cuando la figura se acerca al viewport).
// - No rota la placa entre categorías: muestra la categoría que se le pasa una sola vez.
// - La tipografía de la placa es la del sitio (Inter Variable), no Orbitron/Barlow.
// - Sin el dorso con el logo de los 20 años: sólo la pieza, sin copiar logos de ATICMA.
// - En reposo se mece sobre el frente en vez de dar la vuelta completa: sin el dorso,
//   la espalda queda vacía y de canto el acrílico se lava sobre fondo claro. El
//   arrastre y las flechas siguen girándola entera.
// - Expone `destroy()` para liberar el contexto WebGL cuando la landing se desmonta.

import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

import { ISOTIPO, MEDIDAS } from "./estatuillaDatos";

const GROSOR_DISCO = 0.17;
const RELIEVE = 0.11; // espesor del isotipo dentro del disco
const FONDO_BASE = 0.66; // profundidad de la base
const GIRO_INICIAL = -0.55;
const INCLINACION = 0.07;
// Vaivén en reposo: amplitud (rad) y ritmo (rad/s) del mecido sobre el frente.
const MECEDURA_GIRO = 0.62;
const RITMO_MECEDURA = 0.35;

// De arriba hacia abajo, como en el render de referencia del diseño.
const COLORES_ISOTIPO: Array<[number, string]> = [
  [0, "#a8e600"],
  [0.4, "#22cf6b"],
  [0.72, "#00b4dc"],
  [1, "#0f6ff5"],
];

const acotar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function colorEn(t: number) {
  for (let i = 1; i < COLORES_ISOTIPO.length; i++) {
    const [t0, c0] = COLORES_ISOTIPO[i - 1];
    const [t1, c1] = COLORES_ISOTIPO[i];
    if (t <= t1) {
      return new THREE.Color(c0).lerp(
        new THREE.Color(c1),
        (t - t0) / (t1 - t0),
      );
    }
  }
  return new THREE.Color(COLORES_ISOTIPO.at(-1)![1]);
}

function isotipo() {
  // El dibujo viene con el eje Y hacia abajo; se invierte acá para que la extrusión
  // salga con las caras hacia afuera.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><g transform="scale(1,-1)"><path fill-rule="evenodd" d="${ISOTIPO}"/></g></svg>`;
  const formas = new SVGLoader()
    .parse(svg)
    .paths.flatMap((p) => p.toShapes());
  const bisel = 0.012;
  const geo = new THREE.ExtrudeGeometry(formas, {
    depth: RELIEVE - 2 * bisel,
    bevelEnabled: true,
    bevelThickness: bisel,
    bevelSize: bisel,
    bevelOffset: -bisel,
    bevelSegments: 3,
    curveSegments: 28,
  });
  geo.translate(0, 0, -(RELIEVE - 2 * bisel) / 2);
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox!;
  const pos = geo.attributes.position;
  const colores = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const c = colorEn(1 - (pos.getY(i) - min.y) / (max.y - min.y));
    colores.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colores, 3));

  const material = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    metalness: 0.15,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    envMapIntensity: 0.75,
  });
  // Un poco de luz propia con el mismo degradé: es lo que lo hace ver encendido
  // dentro del acrílico.
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      "#include <emissivemap_fragment>\n\ttotalEmissiveRadiance += vColor.rgb * 0.22;",
    );
  };
  return new THREE.Mesh(geo, material);
}

function disco() {
  const grupo = new THREE.Group();
  const bisel = 0.036;
  const circulo = new THREE.Shape();
  circulo.absarc(0, 0, 1, 0, Math.PI * 2, false);
  const geo = new THREE.ExtrudeGeometry(circulo, {
    depth: GROSOR_DISCO - 2 * bisel,
    bevelEnabled: true,
    bevelThickness: bisel,
    bevelSize: bisel,
    bevelOffset: -bisel,
    bevelSegments: 5,
    curveSegments: 120,
  });
  geo.translate(0, 0, -(GROSOR_DISCO - 2 * bisel) / 2);

  // Acrílico: sólo suma reflejos sobre lo que haya detrás, así funciona con el
  // fondo (degradado azul) de la landing.
  const acrilico = new THREE.Mesh(
    geo,
    new THREE.MeshPhysicalMaterial({
      color: 0x000000,
      metalness: 0,
      roughness: 0.02,
      ior: 1.5,
      envMapIntensity: 1.7,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  acrilico.renderOrder = 3;

  // Lámina esmerilada del medio, la que recibe el color del isotipo.
  const lienzo = document.createElement("canvas");
  lienzo.width = lienzo.height = 256;
  const x = lienzo.getContext("2d")!;
  const tinte = x.createLinearGradient(0, 0, 0, 256);
  tinte.addColorStop(0, "rgba(190,240,110,1)");
  tinte.addColorStop(0.5, "rgba(190,245,230,1)");
  tinte.addColorStop(1, "rgba(110,190,255,1)");
  x.fillStyle = tinte;
  x.fillRect(0, 0, 256, 256);
  const borde = x.createRadialGradient(128, 128, 60, 128, 128, 128);
  borde.addColorStop(0, "rgba(255,255,255,.5)");
  borde.addColorStop(0.8, "rgba(255,255,255,0)");
  borde.addColorStop(1, "rgba(90,170,255,.6)");
  x.fillStyle = borde;
  x.fillRect(0, 0, 256, 256);
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  const lamina = new THREE.Mesh(
    new THREE.CircleGeometry(0.935, 120),
    new THREE.MeshBasicMaterial({
      map: textura,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  lamina.renderOrder = 1;

  // Canto pulido: en el acrílico real es lo que más brilla, y la reflexión de la
  // cara sola no lo da.
  const m = GROSOR_DISCO / 2;
  const perfil = [
    [0.9, m],
    [0.965, m],
    [0.992, m - 0.012],
    [1, m - 0.04],
    [1, -(m - 0.04)],
    [0.992, -(m - 0.012)],
    [0.965, -m],
    [0.9, -m],
  ].map(([r, z]) => new THREE.Vector2(r, z));
  const canto = new THREE.Mesh(
    new THREE.LatheGeometry(perfil, 160),
    new THREE.MeshPhysicalMaterial({
      color: 0xb9dcff,
      metalness: 1,
      roughness: 0.16,
      envMapIntensity: 0.95,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  canto.rotation.x = Math.PI / 2;
  canto.renderOrder = 2;

  grupo.add(lamina, isotipo(), canto, acrilico);
  return grupo;
}

function ajustarTexto(
  x: CanvasRenderingContext2D,
  texto: string,
  peso: number,
  familia: string,
  tamano: number,
  anchoMaximo: number,
) {
  let t = tamano;
  do {
    x.font = `${peso} ${t}px ${familia}`;
    t -= 2;
  } while (x.measureText(texto).width > anchoMaximo && t > 12);
}

function placa(renderer: THREE.WebGLRenderer, familia: string, titulo: string) {
  const lienzo = document.createElement("canvas");
  lienzo.width = 1024;
  lienzo.height = Math.round((1024 * MEDIDAS.placa.alto) / MEDIDAS.placa.ancho);
  const x = lienzo.getContext("2d")!;
  const { width: W, height: H } = lienzo;

  // Metal cepillado, dibujado una sola vez.
  const metal = document.createElement("canvas");
  metal.width = W;
  metal.height = H;
  const m = metal.getContext("2d")!;
  const base = m.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, "#f1f3f6");
  base.addColorStop(0.5, "#c4c9d1");
  base.addColorStop(1, "#e6e9ed");
  m.fillStyle = base;
  m.fillRect(0, 0, W, H);
  for (let i = 0; i < 1400; i++) {
    m.globalAlpha = Math.random() * 0.09;
    m.fillStyle = Math.random() > 0.5 ? "#fff" : "#4f5765";
    m.fillRect(Math.random() * W - 100, Math.random() * H, 80 + Math.random() * 320, 1);
  }

  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const dibujar = (nombre: string, opacidad = 1) => {
    x.globalAlpha = 1;
    x.drawImage(metal, 0, 0);
    x.fillStyle = "#0a0c11";
    x.textAlign = "center";
    x.textBaseline = "middle";
    ajustarTexto(x, titulo, 800, familia, 86, W * 0.88);
    x.fillText(titulo, W / 2, H * 0.37);
    x.globalAlpha = opacidad;
    ajustarTexto(x, nombre, 500, familia, 58, W * 0.88);
    x.fillText(nombre, W / 2, H * 0.72);
    textura.needsUpdate = true;
  };

  const malla = new THREE.Mesh(
    new THREE.PlaneGeometry(MEDIDAS.placa.ancho, MEDIDAS.placa.alto),
    new THREE.MeshStandardMaterial({
      map: textura,
      metalness: 0.78,
      roughness: 0.42,
      envMapIntensity: 1.15,
    }),
  );
  return { malla, dibujar };
}

export interface EstatuillaOpciones {
  categoria?: string;
  quieto?: boolean;
  giroInicial?: number;
  inclinaInicial?: number;
}

export interface EstatuillaHandle {
  destroy: () => void;
  ponerCategoria: (nombre: string) => void;
}

/**
 * Monta la estatuilla dentro de `host`. El host tiene que tener tamaño propio
 * (la pieza se encuadra sola con la cámara según el contenedor) y `position: relative`.
 */
export async function crearEstatuilla(
  host: HTMLElement,
  {
    categoria = "",
    quieto = false,
    giroInicial = GIRO_INICIAL,
    inclinaInicial = INCLINACION,
  }: EstatuillaOpciones = {},
): Promise<EstatuillaHandle> {
  const prueba = document.createElement("canvas");
  if (!prueba.getContext("webgl2") && !prueba.getContext("webgl")) {
    throw new Error("El navegador no tiene WebGL");
  }

  // La placa se dibuja en un canvas: necesita la familia real que resolvió
  // next/font en este arbol, y que la fuente ya este cargada para medir bien.
  const familia = getComputedStyle(host).fontFamily || "sans-serif";
  await document.fonts.ready;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  host.append(renderer.domElement);

  const escena = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  pmrem.dispose();

  const camara = new THREE.PerspectiveCamera(26, 1, 0.1, 60);

  const principal = new THREE.DirectionalLight(0xffffff, 2.3);
  principal.position.set(2.6, 3.6, 4.2);
  const contraAzul = new THREE.DirectionalLight(0x2f6bff, 3);
  contraAzul.position.set(-4, 1.2, -3.4);
  const contraLima = new THREE.PointLight(0xc5f21c, 14, 14);
  contraLima.position.set(3.2, -0.4, -2.6);
  escena.add(principal, contraAzul, contraLima, new THREE.AmbientLight(0xffffff, 0.3));

  // --- armado, centrado en el medio de la pieza ---
  const { base, hundido } = MEDIDAS;
  const yBase = -(1 - hundido) - base.alto / 2;
  const centro = (1 + (yBase - base.alto / 2)) / 2;
  const trofeo = new THREE.Group();
  const cuerpo = new THREE.Group();
  cuerpo.position.y = -centro;
  trofeo.add(cuerpo);
  escena.add(trofeo);

  cuerpo.add(disco());

  const pedestal = new THREE.Mesh(
    new RoundedBoxGeometry(base.ancho, base.alto, FONDO_BASE, 5, 0.035),
    new THREE.MeshPhysicalMaterial({
      color: 0x050507,
      roughness: 0.2,
      metalness: 0.25,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.4,
    }),
  );
  pedestal.position.y = yBase;
  cuerpo.add(pedestal);

  const frente = placa(renderer, familia, "ATICMA AWARDS 2026");
  frente.malla.position.set(0, yBase + MEDIDAS.placa.centroY, FONDO_BASE / 2 + 0.004);
  cuerpo.add(frente.malla);

  // --- placa ---
  let nombreActual = categoria;
  let cambio = 0;
  frente.dibujar(nombreActual);

  function ponerCategoria(nombre: string) {
    if (!nombre || nombre === nombreActual) return;
    const turno = ++cambio;
    const inicio = performance.now();
    const anterior = nombreActual;
    nombreActual = nombre;
    const paso = (ahora: number) => {
      if (turno !== cambio) return;
      const t = acotar((ahora - inicio) / 520, 0, 1);
      if (t < 0.5) frente.dibujar(anterior, 1 - t * 2);
      else frente.dibujar(nombre, (t - 0.5) * 2);
      pedir();
      if (t < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }

  // --- encuadre ---
  // Al girar, las esquinas de la base se acercan a la cámara y se ven más grandes, y
  // además la pieza flota. En vez de estimarlo, se proyecta el contorno en todas las
  // posiciones posibles (cualquier giro, las inclinaciones extremas y el vaivén) y se
  // busca la distancia más corta en la que siempre entra entero.
  const VAIVEN = 0.022;
  const INCLINA_MIN = -0.22;
  const INCLINA_MAX = 0.32;
  const contorno: THREE.Vector3[] = [];
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    for (const z of [-GROSOR_DISCO / 2, GROSOR_DISCO / 2]) {
      contorno.push(new THREE.Vector3(Math.cos(a), Math.sin(a), z));
    }
  }
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      for (const z of [-1, 1]) {
        contorno.push(
          new THREE.Vector3(
            (x * base.ancho) / 2,
            yBase + (y * base.alto) / 2,
            (z * FONDO_BASE) / 2,
          ),
        );
      }
    }
  }
  const punto = new THREE.Vector3();
  function entra(distancia: number) {
    camara.position.set(0, 0.35, distancia);
    camara.lookAt(0, 0, 0);
    camara.updateProjectionMatrix();
    camara.updateMatrixWorld();
    for (const inclina of [INCLINA_MIN, INCLINACION, INCLINA_MAX]) {
      for (let k = 0; k < 24; k++) {
        for (const sube of [-VAIVEN * 1.5, VAIVEN * 1.5]) {
          trofeo.rotation.set(inclina, (k / 24) * Math.PI * 2, 0);
          trofeo.position.y = sube;
          trofeo.updateMatrixWorld(true);
          for (const p of contorno) {
            punto.copy(p).applyMatrix4(cuerpo.matrixWorld).project(camara);
            if (Math.abs(punto.x) > 0.95 || Math.abs(punto.y) > 0.95) return false;
          }
        }
      }
    }
    return true;
  }
  function encuadrar() {
    if (destruida) return;
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    let cerca = 3;
    let lejos = 30;
    for (let i = 0; i < 14; i++) {
      const medio = (cerca + lejos) / 2;
      if (entra(medio)) lejos = medio;
      else cerca = medio;
    }
    entra(lejos);
    trofeo.position.y = 0;
    // cambiar el tamaño borra el lienzo: se vuelve a pintar ya mismo, esté o no
    // corriendo la animación
    pintar();
    pedir();
  }

  // --- giro ---
  let giro = giroInicial;
  let inclinacion = inclinaInicial;
  let impulso = 0;
  let arrastrando = false;
  let ultimoX = 0;
  let ultimoY = 0;
  let ultimoToque = -1e9;
  let visible = false;
  let enCurso = false;
  let destruida = false;
  let cuadroPedido = 0;
  let anterior = performance.now();

  const alBajar = (e: PointerEvent) => {
    arrastrando = true;
    impulso = 0;
    ultimoX = e.clientX;
    ultimoY = e.clientY;
    host.setPointerCapture(e.pointerId);
    pedir();
  };
  const alMover = (e: PointerEvent) => {
    if (!arrastrando) return;
    const dx = e.clientX - ultimoX;
    const dy = e.clientY - ultimoY;
    ultimoX = e.clientX;
    ultimoY = e.clientY;
    giro += dx * 0.011;
    impulso = dx * 0.011;
    inclinacion = acotar(inclinacion + dy * 0.006, INCLINA_MIN, INCLINA_MAX);
  };
  const alSoltar = () => {
    if (!arrastrando) return;
    arrastrando = false;
    ultimoToque = performance.now();
  };
  const alTeclear = (e: KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    impulso = e.key === "ArrowLeft" ? -0.06 : 0.06;
    ultimoToque = performance.now();
    pedir();
  };
  const alCambiarVisibilidad = () => {
    anterior = performance.now();
  };

  host.addEventListener("pointerdown", alBajar);
  host.addEventListener("pointermove", alMover);
  host.addEventListener("pointerup", alSoltar);
  host.addEventListener("pointercancel", alSoltar);
  host.addEventListener("keydown", alTeclear);
  document.addEventListener("visibilitychange", alCambiarVisibilidad);

  function cuadro(ahora: number) {
    enCurso = false;
    if (destruida) return;
    const dt = Math.min((ahora - anterior) / 1000, 0.05);
    anterior = ahora;
    const enReposo = !arrastrando && ahora - ultimoToque > 1600;
    if (!arrastrando) {
      giro += impulso;
      impulso *= 0.94;
      if (enReposo) {
        if (!quieto) {
          const objetivo =
            Math.sin((ahora / 1000) * RITMO_MECEDURA) * MECEDURA_GIRO;
          giro += (objetivo - giro) * Math.min(1, dt * 3);
        }
        inclinacion += (INCLINACION - inclinacion) * 0.04;
      }
    }
    trofeo.position.y = quieto
      ? 0
      : Math.sin((ahora / 1000) * 0.9) * VAIVEN;
    pintar();
    if (
      visible &&
      (!quieto || arrastrando || Math.abs(impulso) > 0.0004 || !enReposo)
    ) {
      pedir();
    }
  }
  function pintar() {
    trofeo.rotation.set(inclinacion, giro, 0);
    renderer.render(escena, camara);
  }
  function pedir() {
    if (enCurso || !visible || destruida) return;
    enCurso = true;
    cuadroPedido = requestAnimationFrame(cuadro);
  }

  const observadorTamano = new ResizeObserver(() => {
    requestAnimationFrame(() => {
      if (!destruida) encuadrar();
    });
  });
  observadorTamano.observe(host);
  const observadorVista = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    anterior = performance.now();
    pedir();
  });
  observadorVista.observe(host);

  encuadrar();

  return {
    ponerCategoria,
    destroy() {
      destruida = true;
      cancelAnimationFrame(cuadroPedido);
      observadorTamano.disconnect();
      observadorVista.disconnect();
      host.removeEventListener("pointerdown", alBajar);
      host.removeEventListener("pointermove", alMover);
      host.removeEventListener("pointerup", alSoltar);
      host.removeEventListener("pointercancel", alSoltar);
      host.removeEventListener("keydown", alTeclear);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      escena.traverse((objeto) => {
        const malla = objeto as THREE.Mesh;
        malla.geometry?.dispose();
        const materiales = Array.isArray(malla.material)
          ? malla.material
          : malla.material
            ? [malla.material]
            : [];
        for (const material of materiales) {
          for (const valor of Object.values(material)) {
            if (valor instanceof THREE.Texture) valor.dispose();
          }
          material.dispose();
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
