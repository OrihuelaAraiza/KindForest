// Inline interface icons from Lucide Static 0.468.0 (ISC). Inline SVG inherits
// the text color, so these follow the active theme without extra requests.
const NS = "http://www.w3.org/2000/svg";
const shapes = {
  bookmark: [["path", { d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" }]],
  bookmarkCheck: [
    ["path", { d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" }],
    ["path", { d: "m9 10 2 2 4-4" }],
  ],
  arrowRight: [["path", { d: "M5 12h14M12 5l7 7-7 7" }]],
  search: [
    ["circle", { cx: 11, cy: 11, r: 8 }],
    ["path", { d: "m21 21-4.3-4.3" }],
  ],
  sun: [
    ["circle", { cx: 12, cy: 12, r: 4 }],
    ["path", { d: "M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" }],
  ],
  moon: [["path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" }]],
  sparkles: [
    ["path", { d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" }],
    ["path", { d: "M20 3v4M22 5h-4M4 17v2M5 18H3" }],
  ],
  users: [
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
    ["circle", { cx: 9, cy: 7, r: 4 }],
    ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" }],
  ],
  listChecks: [["path", { d: "m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8" }]],
  textSize: [["path", { d: "M4 7V4h16v3M9 20h6M12 4v16" }]],
  siren: [
    ["path", { d: "M7 18v-6a5 5 0 1 1 10 0v6" }],
    ["path", { d: "M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z" }],
    ["path", { d: "M21 12h1M18.5 4.5 18 5M2 12h1M12 2v1m-7.071 1.929.707.707M12 12v6" }],
  ],
};

export function glyph(name, size = 18, className = "i") {
  const svg = document.createElementNS(NS, "svg");
  for (const [key, value] of Object.entries({
    class: className,
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": 2,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
    focusable: "false",
  }))
    svg.setAttribute(key, value);
  for (const [tag, attrs] of shapes[name]) {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs))
      node.setAttribute(key, value);
    svg.append(node);
  }
  return svg;
}

// One color per area of work and per library category.
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

export function iconImage(name, size = 20) {
  const img = document.createElement("img");
  img.src = "icons/" + name + ".svg";
  img.alt = "";
  img.width = size;
  img.height = size;
  return img;
}
