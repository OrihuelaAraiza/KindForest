import { directories } from "./directories.js";
import Fuse from "./vendor/fuse.mjs";

export function referenceBrowser({
  id,
  el,
  action,
  field,
  select,
  external,
  body,
  favorites,
  initialQuery = "",
}) {
  const entries = directories[id];
  const search = el("input");
  search.type = "search";
  search.placeholder = "Nombre o tema";
  search.value = initialQuery;
  const regions = [
    ...new Set(entries.flatMap((e) => e.region.split(" · "))),
  ].sort((a, b) => a.localeCompare(b, "es"));
  const region = select(["Todas las zonas", ...regions]);
  const subject = select([
    "Todos los temas",
    ...[...new Set(entries.flatMap((e) => e.tags))].sort((a, b) =>
      a.localeCompare(b, "es"),
    ),
  ]);
  const saved = el("input");
  saved.type = "checkbox";
  const filters = el("div", undefined, "desk-form"),
    tools = el("label", undefined, "check-row");
  tools.append(saved, el("span", "Solo mis guardados"));
  filters.append(
    field("Filtrar por nombre", search),
    field("Zona", region),
    field("Tema", subject),
    tools,
  );
  const result = el("div"),
    count = el("p", undefined, "note");
  count.setAttribute("role", "status");
  const index = new Fuse(entries, {
    keys: ["title", "source", "tags", "description", "lang"],
    threshold: 0.37,
    ignoreLocation: true,
  });
  const format = (dt) =>
    new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dt + "T12:00:00"));
  function render(focusKey = null) {
    const query = search.value.trim();
    const data = (
      query ? index.search(query).map((r) => r.item) : entries
    ).filter((e) => {
      const zones = e.region.split(" · ");
      return (
        (region.selectedIndex === 0 ||
          zones.includes(region.value) ||
          (id === "instituciones" && zones.includes("Nacional"))) &&
        (subject.selectedIndex === 0 || e.tags.includes(subject.value)) &&
        (!saved.checked || favorites.has(e.title))
      );
    });
    count.textContent = data.length + " resultados";
    result.replaceChildren();
    if (!data.length)
      result.append(el("p", "No hay resultados con esos filtros."));
    for (const e of data) {
      const entry = el("article", undefined, "reference-entry");
      entry.append(
        el("p", e.region + (e.lang ? " · " + e.lang : ""), "eyebrow"),
        el("h3", e.title, "desk-heading"),
        el("p", e.source + " · " + e.tags.join(", "), "note"),
      );
      if (e.start)
        entry.append(
          el(
            "p",
            format(e.start) +
              (e.end ? " — " + format(e.end) : "") +
              (e.deadline
                ? " · Cierre de resúmenes: " + format(e.deadline)
                : ""),
            "event-dates",
          ),
        );
      const star = action(
        favorites.has(e.title) ? "Quitar de guardados" : "Guardar ficha",
        () => {
          if (favorites.has(e.title)) favorites.delete(e.title);
          else favorites.add(e.title);
          render(e.title);
        },
        "small-button",
      );
      star.setAttribute("aria-pressed", favorites.has(e.title));
      entry.append(
        external(
          e.search ? "Buscar institución o evento ↗" : "Consultar fuente ↗",
          e.url,
        ),
        star,
      );
      result.append(entry);
      if (focusKey === e.title) star.focus({ preventScroll: true });
    }
    if (focusKey && saved.checked && !favorites.has(focusKey))
      saved.focus({ preventScroll: true });
  }
  filters.oninput = () => render();
  body.append(
    el(
      "p",
      "Referencia pública consultada el 18 nov 2026. Confirma vigencia, requisitos y fechas con la organización.",
      "note",
    ),
    filters,
    count,
    result,
  );
  render();
}
