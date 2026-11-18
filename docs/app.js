import { accessibility } from "./accessibility.js";
import { createWorkspace } from "./workspace.js";
import { catalog, profiles } from "./catalog.js";
import { directories } from "./directories.js";
import { createPalette } from "./palette.js";
import {
  categoryIcons,
  categoryTones,
  glyph,
  groupTones,
  iconImage,
} from "./glyphs.js";

const byId = (id) => document.getElementById(id);
const root = document.documentElement;
const panel = byId("panel");
const body = byId("panel-body");
const saved = new Set();
const plans = { pro: new Set(), pac: new Set() };
const motion = () =>
  !root.classList.contains("calm") &&
  matchMedia("(prefers-reduced-motion: no-preference)").matches;
let role;
let category;
let opener;

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function action(text, handler, className) {
  const button = el("button", text, className);
  button.type = "button";
  button.addEventListener("click", handler);
  return button;
}

// Screen readers hear #announce; the toast repeats it visually above any dialog.
const toast = byId("toast");
let toastTimer;
function announce(text, visible = true) {
  byId("announce").textContent = text;
  if (!visible || typeof toast.showPopover !== "function") return;
  byId("toast-text").textContent = text;
  clearTimeout(toastTimer);
  if (toast.matches(":popover-open")) toast.hidePopover();
  toast.showPopover();
  toastTimer = setTimeout(() => {
    if (toast.matches(":popover-open")) toast.hidePopover();
  }, 2600);
}

function show(title, { eyebrow, icon, tone } = {}) {
  const wasOpen = panel.open;
  if (!wasOpen) opener = document.activeElement;
  byId("panel-title").textContent = title;
  const label = byId("panel-eyebrow"),
    badge = byId("panel-icon");
  label.hidden = !eyebrow;
  label.textContent = eyebrow ?? "";
  badge.hidden = !icon;
  badge.replaceChildren(...(icon ? [iconImage(icon, 22)] : []));
  if (tone) panel.dataset.tone = tone;
  else delete panel.dataset.tone;
  body.replaceChildren();
  if (!wasOpen) panel.showModal();
  byId("close").focus();
}

/* Selection ------------------------------------------------------------- */
function syncSaved() {
  const count = byId("saved-count");
  count.textContent = saved.size;
  byId("open-saved").classList.toggle("has-items", saved.size > 0);
  count.classList.remove("bump");
  if (motion()) {
    void count.offsetWidth;
    count.classList.add("bump");
  }
  for (const card of byId("resources").querySelectorAll(".card")) {
    const on = saved.has(card.dataset.id);
    card.classList.toggle("is-saved", on);
    card.querySelector(".bookmark")?.setAttribute("aria-pressed", on);
  }
}
function toggleSaved(item) {
  if (saved.has(item.id)) saved.delete(item.id);
  else saved.add(item.id);
  syncSaved();
  announce(
    saved.has(item.id)
      ? "Recurso añadido a mi selección."
      : "Recurso retirado de mi selección.",
  );
}
function detail(item, fromSelection = false) {
  show(item.title, {
    eyebrow: item.category,
    icon: categoryIcons[item.category],
    tone: categoryTones[item.category],
  });
  const source = el("p", item.source + " / " + item.category, "eyebrow");
  const link = el("a", "Consultar fuente ↗", "primary");
  link.href = item.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  const label = () =>
    saved.has(item.id) ? "Quitar de mi selección" : "Añadir a mi selección";
  const save = action(
    label(),
    () => {
      toggleSaved(item);
      save.textContent = label();
      save.setAttribute("aria-pressed", saved.has(item.id));
    },
    "secondary",
  );
  save.setAttribute("aria-pressed", saved.has(item.id));
  body.append(
    source,
    el("p", item.summary, "lead"),
    el("p", item.detail),
    el("p", "Fuente externa · " + new URL(item.url).hostname, "note"),
    link,
    save,
  );
  if (item.id === "trials") trialSearch(link);
  if (fromSelection)
    body.append(action("← Mi selección", selection, "text-button"));
}
function trialSearch(link) {
  const fields = el("fieldset", undefined, "trial-fields");
  fields.append(el("legend", "Preparar búsqueda en el registro"));
  const label = el("label", "Ubicación del estudio");
  const country = el("select");
  for (const [name, value] of [
    ["Cualquier país", ""],
    ["Argentina", "Argentina"],
    ["Brasil", "Brazil"],
    ["Chile", "Chile"],
    ["Colombia", "Colombia"],
    ["México", "Mexico"],
    ["Perú", "Peru"],
  ]) {
    const option = el("option", name);
    option.value = value;
    country.append(option);
  }
  label.append(country);
  const recruiting = el("input");
  recruiting.type = "checkbox";
  const status = el("label", undefined, "check-row");
  status.append(recruiting, el("span", "Solo estudios en reclutamiento"));
  fields.append(
    label,
    status,
    el(
      "p",
      "Al abrir el registro se enviarán el tema «cáncer» y los filtros elegidos. Confirma la disponibilidad en la ficha del estudio.",
      "note",
    ),
  );
  body.insertBefore(fields, link);
  const update = () => {
    const target = new URL("/search", "https://clinicaltrials.gov");
    target.searchParams.set("cond", "Cancer");
    if (country.value) target.searchParams.set("country", country.value);
    if (recruiting.checked) target.searchParams.set("aggFilters", "status:rec");
    link.href = target.href;
    link.textContent = "Ver estudios en el registro ↗";
  };
  fields.addEventListener("change", update);
  update();
}
function selection() {
  show("Mi selección", { eyebrow: "Recursos guardados" });
  if (!saved.size) {
    const empty = el("div", undefined, "empty-state");
    empty.append(
      glyph("bookmark", 28),
      el(
        "p",
        "Tu selección está vacía. Pulsa el marcador de una ficha o elige «Añadir a mi selección» al abrirla.",
      ),
    );
    body.append(empty);
    return;
  }
  body.append(
    el(
      "p",
      "Recursos de ambos recorridos. Esta selección se borra al recargar o cerrar esta página.",
    ),
  );
  for (const id of saved) {
    const item = catalog.find((r) => r.id === id);
    const row = el("div", undefined, "saved-row");
    const remove = action(
      "Quitar",
      () => {
        toggleSaved(item);
        selection();
      },
      "text-button",
    );
    remove.setAttribute("aria-label", "Quitar " + item.title);
    row.append(
      action(item.title, () => detail(item, true), "item-link"),
      remove,
    );
    body.append(row);
  }
}

/* Library ---------------------------------------------------------------- */
const normalize = (text) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
function renderCards() {
  const query = normalize(byId("search").value.trim());
  const matches = catalog.filter(
    (r) =>
      r.role === role &&
      (category === "Todos" || r.category === category) &&
      normalize([r.title, r.category, r.source, r.summary].join(" ")).includes(
        query,
      ),
  );
  const grid = byId("resources");
  grid.replaceChildren();
  matches.forEach((item, i) => {
    const card = el("article", undefined, "card");
    card.dataset.id = item.id;
    card.dataset.tone = categoryTones[item.category] ?? "green";
    card.style.setProperty("--i", i);
    const meta = el("div", undefined, "meta");
    const icon = el("span", undefined, "icon");
    icon.setAttribute("aria-hidden", "true");
    icon.append(iconImage(categoryIcons[item.category] ?? "book-open"));
    const heading = el("h3");
    const open = action(item.title, () => detail(item), "card-link");
    open.id = "card-" + item.id;
    heading.append(open);
    // Saving from the card keeps the visitor in the list.
    const mark = action("", () => toggleSaved(item), "bookmark");
    mark.setAttribute("aria-label", "Guardar");
    mark.setAttribute("aria-describedby", open.id);
    mark.setAttribute("aria-pressed", saved.has(item.id));
    mark.append(
      glyph("bookmark", 18, "i off"),
      glyph("bookmarkCheck", 18, "i on"),
    );
    meta.append(icon, el("span", item.category, "eyebrow"), mark);
    const tail = el("div", undefined, "tail");
    const arrow = el("span", "↗");
    arrow.setAttribute("aria-hidden", "true");
    tail.append(el("span", item.source), arrow);
    card.classList.toggle("is-saved", saved.has(item.id));
    card.append(meta, heading, el("p", item.summary), tail);
    grid.append(card);
  });
  byId("results-info").textContent =
    matches.length === 1 ? "1 recurso" : matches.length + " recursos";
  if (!matches.length) {
    const empty = el("div", undefined, "empty");
    empty.append(
      el("h3", "Sin coincidencias"),
      el("p", "Prueba otra palabra o consulta todas las categorías."),
      action(
        "Ver todos los recursos",
        () => {
          byId("search").value = "";
          setFilter("Todos");
          byId("search").focus();
        },
        "secondary",
      ),
    );
    grid.append(empty);
  }
}
function setFilter(value) {
  category = value;
  for (const b of byId("filters").children)
    b.setAttribute("aria-pressed", b.dataset.category === category);
  renderCards();
}

/* Audience and hero ------------------------------------------------------ */
const suggestions = {
  pro: ["citas", "interconsulta", "ESMO", "congresos", "honorarios"],
  pac: ["diario", "ensayos", "medicinas", "apoyo económico", "nutrición"],
};
function readRole() {
  return new URL(location.href).searchParams.get("vista") === "pacientes"
    ? "pac"
    : "pro";
}
function placeThumb() {
  const group = document.querySelector(".audiences");
  const current = byId(role);
  if (!current) return;
  group.style.setProperty("--thumb-x", current.offsetLeft + "px");
  group.style.setProperty("--thumb-w", current.offsetWidth + "px");
  // The first placement is instant; later role changes slide.
  if (!group.classList.contains("measured"))
    requestAnimationFrame(() => group.classList.add("measured"));
}
const directoryTotal = Object.values(directories).reduce(
  (sum, list) => sum + list.length,
  0,
);
function countTo(node, target) {
  const from = Number(node.textContent) || 0;
  if (!motion() || from === target) {
    node.textContent = target;
    return;
  }
  const start = performance.now(),
    span = 900;
  const step = (now) => {
    const t = Math.min(1, (now - start) / span);
    node.textContent = Math.round(from + (target - from) * (1 - (1 - t) ** 3));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function renderStats() {
  const values = {
    tools: workspace.tools().length,
    references:
      directoryTotal + catalog.filter((r) => r.role === role).length,
    congresses: directories.congresos.length,
  };
  for (const node of document.querySelectorAll("[data-stat]"))
    countTo(node, values[node.dataset.stat]);
}
function renderProfile() {
  role = readRole();
  document.body.dataset.role = role;
  const profile = profiles[role];
  for (const key of Object.keys(profiles))
    byId(key).setAttribute("aria-pressed", key === role);
  placeThumb();
  byId("heading").replaceChildren(
    profile.title + " ",
    el("em", profile.emphasis),
  );
  byId("intro-text").textContent = profile.intro;
  byId("library-title").textContent = profile.heading;
  byId("prep-title").textContent = profile.planner;
  byId("prep-text").textContent = profile.description;
  byId("search").value = "";
  const mine = catalog.filter((r) => r.role === role);
  const categories = ["Todos", ...new Set(mine.map((r) => r.category))];
  byId("filters").replaceChildren(
    ...categories.map((c) => {
      const b = action(c, () => setFilter(c));
      b.dataset.category = c;
      if (categoryTones[c]) b.dataset.tone = categoryTones[c];
      const n = el(
        "span",
        String(
          c === "Todos" ? mine.length : mine.filter((r) => r.category === c).length,
        ),
        "n",
      );
      n.setAttribute("aria-hidden", "true");
      b.append(n);
      return b;
    }),
  );
  setFilter("Todos");
  workspace.setRole(role);
  byId("tools-title").textContent =
    role === "pro" ? "Mesa de consulta" : "Mi espacio de cuidado";
  byId("hero-suggest").replaceChildren(
    el("span", "Prueba", "suggest-label"),
    ...suggestions[role].map((term) =>
      action(term, () => palette.open(term)),
    ),
  );
  renderStats();
}
function plan() {
  const p = profiles[role],
    selected = plans[role];
  show(p.planner, { eyebrow: "Preparación de consulta", icon: "list-checks", tone: "green" });
  body.append(
    el(
      "p",
      "Selecciona los puntos que quieres llevar. Puedes imprimir tu lista o guardarla como PDF desde el diálogo de impresión.",
    ),
  );
  const list = el("fieldset");
  list.append(el("legend", "Puntos para conversar"));
  const printButton = action(
    "Imprimir selección",
    () => window.print(),
    "primary",
  );
  printButton.disabled = !selected.size;
  p.items.forEach((question, index) => {
    const line = el("label", undefined, "check-row");
    const box = el("input");
    box.type = "checkbox";
    box.checked = selected.has(index);
    line.classList.toggle("checked", box.checked);
    box.addEventListener("change", () => {
      if (box.checked) selected.add(index);
      else selected.delete(index);
      printButton.disabled = !selected.size;
      line.classList.toggle("checked", box.checked);
    });
    line.append(box, el("span", question));
    list.append(line);
  });
  body.append(list, printButton);
}
function switchRole(key) {
  if (role === key) return;
  const url = new URL(location.href);
  if (key === "pac") url.searchParams.set("vista", "pacientes");
  else url.searchParams.delete("vista");
  history.pushState(null, "", url);
  renderProfile();
}
for (const key of Object.keys(profiles))
  byId(key).addEventListener("click", () => switchRole(key));
window.addEventListener("popstate", () => {
  if (panel.open) panel.close();
  if (readRole() !== role) renderProfile();
});
byId("open-saved").addEventListener("click", selection);
byId("open-plan").addEventListener("click", plan);
function privacy() {
  show("Privacidad y alcance", { eyebrow: "KindForest", icon: "shield-check", tone: "green" });
  body.append(
    el(
      "p",
      "KindForest es una adaptación educativa independiente inspirada en los recorridos públicos de ROMI Clinical Intelligence.",
    ),
    el(
      "p",
      "Los casos ficticios, notas, búsquedas y listas permanecen en la memoria de la pestaña hasta que se recarga. La función sin conexión guarda únicamente archivos públicos del sitio. Las fuentes externas se abren en otra pestaña y aplican su propia política de privacidad.",
    ),
    el(
      "p",
      "El alojamiento recibe los datos técnicos de las solicitudes, como la dirección IP. Una copia impresa o un PDF queda bajo tu control.",
    ),
    el(
      "p",
      "Para decisiones sobre diagnóstico, tratamiento o síntomas, consulta a tu equipo de atención. En una emergencia contacta a los servicios de urgencias locales.",
    ),
  );
}
byId("privacy").addEventListener("click", privacy);
byId("open-plate").addEventListener("click", () => {
  show("Células humanas en mitosis", { eyebrow: "Microscopía", icon: "microscope", tone: "green" });
  const photo = el("img", undefined, "full-plate");
  photo.src = "media/mitosis.webp";
  photo.alt =
    "Campo microscópico con células brillantes en distintas fases de división sobre fondo oscuro.";
  photo.width = 512;
  photo.height = 512;
  const link = el(
    "a",
    "Consultar la procedencia de la imagen ↗",
    "source-link",
  );
  link.href =
    "https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.human_mitosis";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  body.append(
    photo,
    el(
      "p",
      "Micrografía de David Root, distribuida bajo CC0. La portada muestra un recorte con tratamiento de color; aquí puedes ver el campo completo.",
      "note",
    ),
    link,
  );
});

/* Theme: follows the system until the visitor chooses; nothing is stored. */
const systemDark = matchMedia("(prefers-color-scheme: dark)");
let themeChoice = null;
function applyTheme() {
  const dark = (themeChoice ?? (systemDark.matches ? "dark" : "light")) === "dark";
  root.dataset.theme = dark ? "dark" : "light";
  const toggle = byId("theme-toggle");
  toggle.setAttribute("aria-pressed", dark);
  for (const meta of document.querySelectorAll('meta[name="theme-color"]'))
    meta.content = dark ? "#0a1917" : "#f6f7f2";
}
const theme = {
  get: () => root.dataset.theme,
  choice: () => themeChoice ?? "system",
  set(value) {
    themeChoice = value === "system" ? null : value;
    applyTheme();
    if (panel.open && byId("panel-title").textContent === "Actividad del consultorio")
      workspace.open("estadistica");
  },
  toggle() {
    theme.set(root.dataset.theme === "dark" ? "light" : "dark");
    announce(
      root.dataset.theme === "dark" ? "Tema oscuro activado." : "Tema claro activado.",
    );
  },
};
systemDark.addEventListener("change", applyTheme);
applyTheme();
byId("theme-toggle").addEventListener("click", theme.toggle);

accessibility({ el, action, show, body, theme, announce });
const workspace = createWorkspace({
  el,
  action,
  show,
  body,
  detail: (id) => detail(catalog.find((r) => r.id === id)),
  plan,
  privacy,
});

/* Command palette -------------------------------------------------------- */
const directoryModules = {
  guias: "Guía",
  red: "Sociedad",
  instituciones: "Apoyo o establecimiento",
  congresos: "Congreso",
};
const palette = createPalette({
  announce: (text) => announce(text, false),
  items() {
    const allowed = new Set(workspace.tools().map((m) => m.id));
    const tools = workspace.tools().map((m) => ({
      kind: "tool",
      section: "Herramientas",
      title: m.name,
      sub: m.group + " · " + m.summary,
      keywords: m.id,
      icon: m.icon,
      tone: groupTones[m.group],
      run: () => workspace.open(m.id),
    }));
    const resources = catalog.map((r) => ({
      kind: "resource",
      section: "Biblioteca",
      title: r.title,
      sub:
        r.source +
        " · " +
        r.category +
        (r.role === role ? "" : r.role === "pac" ? " · pacientes" : " · profesionales"),
      keywords: r.summary,
      icon: categoryIcons[r.category] ?? "book-open",
      tone: categoryTones[r.category],
      run: () => detail(r),
    }));
    const references = Object.entries(directories)
      .filter(([id]) => allowed.has(id))
      .flatMap(([id, list]) =>
        list.map((e) => ({
          kind: "directory",
          section: "Directorio",
          title: e.title,
          sub: directoryModules[id] + " · " + e.source + " · " + e.region,
          keywords: [...e.tags, e.description ?? ""].join(" "),
          icon:
            { guias: "book-open", red: "network", instituciones: "building-2", congresos: "calendar-days" }[id],
          tone: { guias: "green", red: "blue", instituciones: "rose", congresos: "violet" }[id],
          run: () => workspace.open(id, { query: e.title }),
        })),
      );
    return [...tools, ...resources, ...references, ...quickActions()];
  },
  suggestions: () => [
    {
      label: "Acciones rápidas",
      items: quickActions().slice(0, 5),
    },
    {
      label: role === "pro" ? "Destacados de la mesa" : "Destacados para tu cuidado",
      items: workspace.highlights().map((m) => ({
        kind: "tool",
        title: m.name,
        sub: m.group + " · " + m.summary,
        icon: m.icon,
        tone: groupTones[m.group],
        run: () => workspace.open(m.id),
      })),
    },
  ],
});
function quickActions() {
  const other = role === "pro" ? "pac" : "pro";
  return [
    {
      kind: "action",
      section: "Acciones",
      title:
        other === "pac"
          ? "Cambiar a la vista de pacientes"
          : "Cambiar a la vista profesional",
      sub: "Recorrido y biblioteca del otro público",
      keywords: "vista recorrido publico pacientes profesionales cuidadores",
      glyph: "users",
      hint: "Ir ↵",
      run: () => {
        switchRole(other);
        announce(other === "pac" ? "Vista de pacientes." : "Vista profesional.");
      },
    },
    {
      kind: "action",
      section: "Acciones",
      title: "Abrir mi selección",
      sub: saved.size === 1 ? "1 recurso guardado" : saved.size + " recursos guardados",
      keywords: "guardados favoritos marcadores",
      glyph: "bookmark",
      run: selection,
    },
    {
      kind: "action",
      section: "Acciones",
      title: profiles[role].planner,
      sub: "Lista imprimible de puntos para conversar",
      keywords: "lista preparar imprimir pdf preguntas",
      glyph: "listChecks",
      run: plan,
    },
    {
      kind: "action",
      section: "Acciones",
      title: root.dataset.theme === "dark" ? "Usar tema claro" : "Usar tema oscuro",
      sub: "Apariencia de esta sesión",
      keywords: "tema oscuro claro noche apariencia modo",
      glyph: root.dataset.theme === "dark" ? "sun" : "moon",
      hint: "Cambiar ↵",
      run: theme.toggle,
    },
    {
      kind: "action",
      section: "Acciones",
      title: "Lectura y acceso",
      sub: "Texto grande, lectura en voz alta, movimiento",
      keywords: "accesibilidad texto grande voz movimiento",
      glyph: "textSize",
      run: () => byId("display-options").click(),
    },
    {
      kind: "action",
      section: "Acciones",
      title: "Llamar a emergencias",
      sub: "Orientación para pedir ayuda inmediata",
      keywords: "urgencia emergencia 911 ayuda",
      glyph: "siren",
      tone: "rose",
      run: () => byId("quick-help").click(),
    },
  ];
}
for (const id of ["open-palette", "hero-search", "foot-search"])
  byId(id).addEventListener("click", () => palette.open());
// Show the platform's own shortcut.
if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent))
  for (const kbd of document.querySelectorAll(".shortcut")) kbd.textContent = "⌘ K";

byId("search").addEventListener("input", renderCards);
byId("close").addEventListener("click", () => panel.close());
panel.addEventListener("close", () => {
  if (opener?.isConnected) opener.focus();
});
renderProfile();

/* Page effects ----------------------------------------------------------- */
const header = byId("site-header"),
  progress = byId("scroll-progress");
let ticking = false;
function onScroll() {
  ticking = false;
  const max = root.scrollHeight - innerHeight;
  header.classList.toggle("scrolled", scrollY > 8);
  progress.style.setProperty("--progress", max > 0 ? scrollY / max : 0);
}
addEventListener(
  "scroll",
  () => {
    if (!ticking) requestAnimationFrame(onScroll);
    ticking = true;
  },
  { passive: true },
);
addEventListener("resize", placeThumb);
document.fonts?.ready.then(placeThumb);
onScroll();

// The micrograph leans gently toward the pointer.
const scope = document.querySelector(".scope");
scope.addEventListener("pointermove", (event) => {
  if (event.pointerType !== "mouse" || !motion()) return;
  const box = scope.getBoundingClientRect();
  scope.style.setProperty("--px", ((event.clientX - box.left) / box.width - 0.5).toFixed(3));
  scope.style.setProperty("--py", ((event.clientY - box.top) / box.height - 0.5).toFixed(3));
});
scope.addEventListener("pointerleave", () => {
  scope.style.setProperty("--px", 0);
  scope.style.setProperty("--py", 0);
});

// Sections fade in once; without IntersectionObserver everything stays visible.
if ("IntersectionObserver" in window) {
  const seen = new IntersectionObserver(
    (records) => {
      for (const record of records)
        if (record.isIntersecting) {
          record.target.classList.add("is-visible");
          seen.unobserve(record.target);
        }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  for (const node of document.querySelectorAll("[data-reveal]")) seen.observe(node);
  root.classList.add("reveal-ready");
}

/* Live proofs for the commitments section. */
function storedItems() {
  try {
    return localStorage.length + sessionStorage.length;
  } catch {
    return 0;
  }
}
const privacyProof = byId("proof-privacy");
privacyProof.textContent =
  "Ahora mismo: " +
  storedItems() +
  " datos en el almacenamiento del navegador · " +
  (document.cookie ? "con" : "0") +
  " cookies";
privacyProof.classList.add("ok");
byId("proof-sources").textContent =
  directoryTotal + catalog.length + " fichas con enlace a su fuente";
byId("proof-sources").classList.add("ok");
byId("proof-a11y").addEventListener("click", () => byId("display-options").click());
const offlineProof = byId("proof-offline");

// Files for offline use are public assets; plan and case state stays in memory.
if ("serviceWorker" in navigator && window.isSecureContext) {
  offlineProof.textContent = "Preparando la copia sin conexión…";
  navigator.serviceWorker
    .register("./sw.js", { updateViaCache: "none" })
    .then(() => navigator.serviceWorker.ready)
    .then(() => {
      offlineProof.textContent = "Copia sin conexión lista en este navegador";
      offlineProof.classList.add("ok");
    })
    .catch(() => {
      // Online use remains available when browser or host policy disables workers.
      offlineProof.textContent = "Este navegador no permite la copia sin conexión";
    });
} else
  offlineProof.textContent = "Disponible al abrir el atlas por HTTPS o en local";
