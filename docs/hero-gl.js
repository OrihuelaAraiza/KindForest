// Generative "living tissue" for the hero, drawn with OGL (WebGL).
// It is an illustration, not a clinical image; the HUD says so.
import { Mesh, Program, Renderer, Triangle } from "./vendor/ogl.mjs";

const vertex = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragment = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uLens;
uniform vec3 uMembrane;
uniform vec3 uNucleus;
uniform vec3 uAccent;
varying vec2 vUv;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

void main() {
  float aspect = uRes.x / uRes.y;
  float scale = 4.6;
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * scale;
  vec2 m = (uMouse - 0.5) * vec2(aspect, 1.0) * scale;

  // Loupe: magnify the tissue under the pointer.
  float lensR = 1.05;
  float dm = length(p - m);
  float inLens = smoothstep(lensR, lensR * 0.82, dm) * uLens;
  p = m + (p - m) * mix(1.0, 0.5, inLens);

  // Gentle organic warp.
  p += 0.12 * vec2(sin(p.y * 1.6 + uTime * 0.21), cos(p.x * 1.3 - uTime * 0.17));

  vec2 n = floor(p);
  vec2 f = fract(p);
  float d1 = 8.0;
  float d2 = 8.0;
  vec2 toCenter = vec2(0.0);
  float id = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 h = hash2(n + g);
      vec2 o = 0.5 + 0.36 * sin(uTime * 0.33 + 6.2831 * h);
      vec2 r = g + o - f;
      float d = dot(r, r);
      if (d < d1) {
        d2 = d1;
        d1 = d;
        toCenter = r;
        id = h.x;
      } else if (d < d2) {
        d2 = d;
      }
    }
  }
  d1 = sqrt(d1);
  d2 = sqrt(d2);
  float edge = d2 - d1;

  vec3 col = vec3(0.012, 0.016, 0.02);
  // Cytoplasm: a faint fill, warmer in a few cells.
  vec3 cyto = mix(uMembrane, uAccent, step(0.84, id));
  col += cyto * 0.07 * smoothstep(1.1, 0.0, d1);
  // Membranes: a crisp line and a soft glow.
  col += uMembrane * (1.0 - smoothstep(0.0, 0.05, edge)) * 0.85;
  col += uMembrane * exp(-edge * 14.0) * 0.22;

  // Nuclei; one cell in fourteen is dividing into two.
  vec2 v = -toCenter;
  float r = 0.17 + 0.07 * id;
  float nucleus;
  if (id > 0.93) {
    float split = 0.1 + 0.08 * sin(uTime * 0.7 + id * 40.0);
    vec2 axis = normalize(vec2(cos(id * 31.0), sin(id * 31.0)));
    float a = length(v - axis * split);
    float b = length(v + axis * split);
    nucleus = max(smoothstep(r * 0.8, r * 0.55, a), smoothstep(r * 0.8, r * 0.55, b));
    col += uAccent * 0.55 * exp(-min(a, b) * 7.0);
  } else {
    float d = length(v);
    nucleus = smoothstep(r, r * 0.72, d);
    col += uNucleus * 0.3 * exp(-d * 6.5);
  }
  float grain = hash2(gl_FragCoord.xy + uTime).x;
  col += uNucleus * nucleus * (0.7 + 0.3 * grain);

  // Loupe ring and brightness.
  col *= 1.0 + inLens * 0.35;
  col += uAccent * smoothstep(0.022, 0.0, abs(dm - lensR)) * uLens * 0.9;

  // Vignette and fine noise.
  vec2 q = vUv - 0.5;
  col *= 1.0 - dot(q, q) * 0.9;
  col += (hash2(gl_FragCoord.xy * 0.73).y - 0.5) * 0.035;
  gl_FragColor = vec4(col, 1.0);
}`;

const palettes = {
  pro: { membrane: [0.24, 0.94, 0.63], nucleus: [0.36, 0.49, 1.0], accent: [1.0, 0.31, 0.55] },
  pac: { membrane: [1.0, 0.66, 0.36], nucleus: [1.0, 0.42, 0.66], accent: [0.79, 0.95, 0.42] },
};

export function startHero(canvas, { role = "pro", still = false, onMove } = {}) {
  const renderer = new Renderer({
    canvas,
    dpr: Math.min(window.devicePixelRatio || 1, 1.5) * 0.7,
    antialias: false,
    alpha: false,
    powerPreference: "low-power",
  });
  const gl = renderer.gl;
  if (!gl) throw new Error("WebGL no disponible");
  const target = structuredClone(palettes[role]);
  const current = structuredClone(palettes[role]);
  const uniforms = {
    uTime: { value: 12 },
    uRes: { value: [1, 1] },
    uMouse: { value: [0.62, 0.5] },
    uLens: { value: 0 },
    uMembrane: { value: current.membrane },
    uNucleus: { value: current.nucleus },
    uAccent: { value: current.accent },
  };
  const program = new Program(gl, { vertex, fragment, uniforms });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
  const host = canvas.parentElement;
  const mouse = { x: 0.62, y: 0.5, lens: 0 };
  let frame = 0,
    visible = true,
    last = performance.now();

  function resize() {
    const box = host.getBoundingClientRect();
    renderer.setSize(Math.max(1, box.width), Math.max(1, box.height));
    uniforms.uRes.value = [box.width, box.height];
    if (still) draw();
  }
  function draw() {
    renderer.render({ scene: mesh });
  }
  function ease(a, b, k) {
    for (let i = 0; i < 3; i++) a[i] += (b[i] - a[i]) * k;
  }
  function tick(now) {
    frame = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    uniforms.uTime.value += dt;
    const [mx, my] = uniforms.uMouse.value;
    uniforms.uMouse.value = [mx + (mouse.x - mx) * 0.08, my + (mouse.y - my) * 0.08];
    uniforms.uLens.value += (mouse.lens - uniforms.uLens.value) * 0.08;
    for (const key of ["membrane", "nucleus", "accent"]) ease(current[key], target[key], 0.05);
    draw();
    schedule();
  }
  function schedule() {
    if (!still && visible && !document.hidden && !frame) frame = requestAnimationFrame(tick);
  }
  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  const section = canvas.closest("section");
  section.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    const box = host.getBoundingClientRect();
    mouse.x = (event.clientX - box.left) / box.width;
    mouse.y = 1 - (event.clientY - box.top) / box.height;
    mouse.lens = still ? 0 : 1;
    onMove?.(mouse.x, 1 - mouse.y);
  });
  section.addEventListener("pointerleave", () => {
    mouse.lens = 0;
  });
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) {
      last = performance.now();
      schedule();
    } else stop();
  }).observe(host);
  document.addEventListener("visibilitychange", () => {
    last = performance.now();
    if (document.hidden) stop();
    else schedule();
  });
  resize();
  draw();
  schedule();

  return {
    setRole(next) {
      Object.assign(target, structuredClone(palettes[next]));
      if (still) {
        Object.assign(current, structuredClone(palettes[next]));
        uniforms.uMembrane.value = current.membrane;
        uniforms.uNucleus.value = current.nucleus;
        uniforms.uAccent.value = current.accent;
        draw();
      }
    },
    setStill(value) {
      still = value;
      if (still) {
        stop();
        mouse.lens = 0;
        uniforms.uLens.value = 0;
        draw();
      } else {
        last = performance.now();
        schedule();
      }
    },
  };
}
