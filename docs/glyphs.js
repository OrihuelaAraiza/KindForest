// Interface icons (Phosphor Icons 2.1.1, MIT). Inline SVG inherits the text
// color; tool icons are SVG files painted through a CSS mask in the area color.
import { glyphData } from "./glyph-data.js";

const NS = "http://www.w3.org/2000/svg";

export function glyph(name, size = 18, className = "i") {
  const svg = document.createElementNS(NS, "svg");
  for (const [key, value] of Object.entries({
    class: className,
    width: size,
    height: size,
    viewBox: "0 0 256 256",
    fill: "currentColor",
    "aria-hidden": "true",
    focusable: "false",
  }))
    svg.setAttribute(key, value);
  for (const [d, opacity] of glyphData[name]) {
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", d);
    if (opacity !== 1) path.setAttribute("opacity", opacity);
    svg.append(path);
  }
  return svg;
}

// A duotone icon file tinted with the current color through a mask.
export function iconMask(name, size = 22) {
  const span = document.createElement("span");
  span.className = "ico";
  span.dataset.icon = name;
  span.setAttribute("aria-hidden", "true");
  span.style.setProperty(
    "--src",
    'url("' + new URL("icons/" + name + ".svg", document.baseURI) + '")',
  );
  span.style.setProperty("--size", size + "px");
  return span;
}

// Each area of work is named after a histological stain and keeps its color.
export const groupTones = {
  Consulta: "green",
  "Mi cuidado": "rose",
  Gestión: "amber",
  Aprendizaje: "violet",
  "Red e investigación": "blue",
};
export const categoryTones = {
  Guías: "green",
  Sociedades: "blue",
  Congresos: "violet",
  Bienestar: "amber",
  Ensayos: "blue",
  Consulta: "green",
  Apoyo: "rose",
  "Apoyos en México": "amber",
};
export const categoryIcons = {
  Guías: "book-open",
  Sociedades: "users",
  Congresos: "calendar-days",
  Bienestar: "leaf",
  Ensayos: "flask-conical",
  Consulta: "stethoscope",
  Apoyo: "hand-heart",
  "Apoyos en México": "building-2",
};
