import { accessibility } from "./accessibility.js";
import { createWorkspace } from "./workspace.js";
import { catalog, profiles } from "./catalog.js";

const byId = (id) => document.getElementById(id);
const panel = byId("panel");
const body = byId("panel-body");
const saved = new Set();
const plans = { pro: new Set(), pac: new Set() };
const symbols = {
  Guías: "▤",
  Sociedades: "◎",
  Congresos: "▦",
  Bienestar: "✳",
  Ensayos: "⌬",
  Consulta: "▤",
  Apoyo: "◎",
};
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
function announce(text) {
  byId("announce").textContent = text;
}
function show(title) {
  const wasOpen = panel.open;
  if (!wasOpen) opener = document.activeElement;
  byId("panel-title").textContent = title;
  body.replaceChildren();
  if (!wasOpen) panel.showModal();
  byId("close").focus();
}
function toggleSaved(item) {
  if (saved.has(item.id)) saved.delete(item.id);
  else saved.add(item.id);
  byId("saved-count").textContent = saved.size;
  announce(
    saved.has(item.id)
      ? "Recurso añadido a mi selección."
      : "Recurso retirado de mi selección.",
  );
}
function detail(item, fromSelection = false) {
  show(item.title);
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
  show("Mi selección");
  if (!saved.size) {
    body.append(
      el(
        "p",
        "Tu selección está vacía. Abre la ficha de un recurso y elige «Añadir a mi selección».",
      ),
    );
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
function renderCards() {
  const normalize = (text) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es");
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
  for (const item of matches) {
    const card = el("article", undefined, "card");
    const meta = el("div", undefined, "meta");
    const icon = el("span", symbols[item.category], "icon");
    icon.setAttribute("aria-hidden", "true");
    meta.append(icon, el("span", item.category, "eyebrow"));
    const heading = el("h3");
    const open = action(item.title, () => detail(item), "card-link");
    heading.append(open);
    const tail = el("div", undefined, "tail");
    const arrow = el("span", "↗");
    arrow.setAttribute("aria-hidden", "true");
    tail.append(el("span", item.source), arrow);
    card.append(meta, heading, el("p", item.summary), tail);
    grid.append(card);
  }
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
    b.setAttribute("aria-pressed", b.textContent === category);
  renderCards();
}
function readRole() {
  return new URL(location.href).searchParams.get("vista") === "pacientes"
    ? "pac"
    : "pro";
}
function renderProfile() {
  role = readRole();
  const profile = profiles[role];
  for (const key of Object.keys(profiles))
    byId(key).setAttribute("aria-pressed", key === role);
  byId("heading").replaceChildren(
    profile.title + " ",
    el("em", profile.emphasis),
  );
  byId("intro-text").textContent = profile.intro;
  byId("library-title").textContent = profile.heading;
  byId("prep-title").textContent = profile.planner;
  byId("prep-text").textContent = profile.description;
  byId("search").value = "";
  const categories = [
    "Todos",
    ...new Set(catalog.filter((r) => r.role === role).map((r) => r.category)),
  ];
  byId("filters").replaceChildren(
    ...categories.map((c) => action(c, () => setFilter(c))),
  );
  setFilter("Todos");
  workspace.setRole(role);
  byId("tools-title").textContent =
    role === "pro" ? "Mesa de consulta" : "Mi espacio de cuidado";
}
function plan() {
  const p = profiles[role],
    selected = plans[role];
  show(p.planner);
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
for (const key of Object.keys(profiles))
  byId(key).addEventListener("click", () => {
    if (role === key) return;
    const url = new URL(location.href);
    if (key === "pac") url.searchParams.set("vista", "pacientes");
    else url.searchParams.delete("vista");
    history.pushState(null, "", url);
    renderProfile();
  });
window.addEventListener("popstate", () => {
  if (panel.open) panel.close();
  if (readRole() !== role) renderProfile();
});
byId("open-saved").addEventListener("click", selection);
byId("open-plan").addEventListener("click", plan);
function privacy() {
  show("Privacidad y alcance");
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
  show("Células humanas en mitosis");
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
accessibility({ el, action, show, body });
const workspace = createWorkspace({
  el,
  action,
  show,
  body,
  detail: (id) => detail(catalog.find((r) => r.id === id)),
  plan,
  privacy,
});
byId("search").addEventListener("input", renderCards);
byId("close").addEventListener("click", () => panel.close());
panel.addEventListener("close", () => {
  if (opener?.isConnected) opener.focus();
});
renderProfile();

// Files for offline use are public assets; plan and case state stays in memory.
if ("serviceWorker" in navigator && window.isSecureContext) {
  navigator.serviceWorker
    .register("./sw.js", { updateViaCache: "none" })
    .catch(() => {
      // Online use remains available when browser or host policy disables workers.
    });
}
