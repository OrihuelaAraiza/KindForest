// Command palette: one keyboard-first search over tools, library resources,
// reference directories and page actions. Everything runs locally.
import Fuse from "./vendor/fuse.mjs";
import { glyph, iconMask } from "./glyphs.js";

const limits = { tool: 6, resource: 5, directory: 6, action: 4 };
const fold = (text) =>
  [...text.normalize("NFC")].map((ch) =>
    ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(),
  );

const plain = (text) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

// Fuzzy matching tolerates typos; literal matches still rank first so that
// "citas" finds the agenda before a title that merely looks similar.
function rank(found, query) {
  const q = plain(query.trim()),
    words = q.split(/\s+/).filter(Boolean);
  const scored = found.map(({ item, score }) => {
    const title = plain(item.title),
      all = title + " " + plain(item.sub + " " + (item.keywords ?? ""));
    let boost = 0;
    if (title.startsWith(q)) boost = 1.3;
    else if (title.includes(q)) boost = 1.1;
    else if (words.every((w) => title.includes(w))) boost = 0.9;
    else if (words.every((w) => all.includes(w))) boost = 0.5;
    return { item, score: score - boost, literal: boost > 0 };
  });
  const literal = scored.some((r) => r.literal);
  return scored
    .filter((r) => !literal || r.literal)
    .sort((a, b) => a.score - b.score);
}

// Wrap the first accent-insensitive match of the query (or of its first word) in <mark>.
function highlight(title, query) {
  const chars = [...title.normalize("NFC")];
  const hay = fold(title).join("");
  const words = [query.trim(), ...query.trim().split(/\s+/)].filter(
    (w) => w.length > 1,
  );
  for (const word of words) {
    const needle = fold(word).join("");
    const at = hay.indexOf(needle);
    if (at < 0) continue;
    const mark = document.createElement("mark");
    mark.textContent = chars.slice(at, at + needle.length).join("");
    return [
      chars.slice(0, at).join(""),
      mark,
      chars.slice(at + needle.length).join(""),
    ];
  }
  return [title];
}

export function createPalette({ items, suggestions, announce }) {
  const dialog = document.getElementById("palette");
  const field = document.getElementById("palette-input");
  const list = document.getElementById("palette-list");
  const status = document.getElementById("palette-status");
  let options = [],
    active = 0,
    index = null,
    pool = [];

  function setActive(next, scroll = true) {
    if (!options.length) {
      field.removeAttribute("aria-activedescendant");
      return;
    }
    active = (next + options.length) % options.length;
    options.forEach(({ node }, i) =>
      node.setAttribute("aria-selected", String(i === active)),
    );
    const node = options[active].node;
    field.setAttribute("aria-activedescendant", node.id);
    if (scroll) node.scrollIntoView({ block: "nearest" });
  }

  function option(item, query) {
    const node = document.createElement("div");
    node.className = "palette-option";
    node.id = "pal-" + options.length;
    node.setAttribute("role", "option");
    node.setAttribute("aria-selected", "false");
    if (item.tone) node.dataset.tone = item.tone;
    const icon = document.createElement("span");
    icon.className = "opt-icon";
    icon.append(item.icon ? iconMask(item.icon, 20) : glyph(item.glyph, 20));
    const text = document.createElement("span");
    text.className = "opt-text";
    const title = document.createElement("span");
    title.className = "opt-title";
    title.append(...(query ? highlight(item.title, query) : [item.title]));
    const sub = document.createElement("span");
    sub.className = "opt-sub";
    sub.textContent = item.sub;
    text.append(title, sub);
    const hint = document.createElement("span");
    hint.className = "opt-hint";
    hint.setAttribute("aria-hidden", "true");
    hint.textContent = item.hint || "Abrir ↵";
    node.append(icon, text, hint);
    const position = options.length;
    node.addEventListener("pointermove", () => {
      if (active !== position) setActive(position, false);
    });
    node.addEventListener("click", () => choose(item));
    options.push({ node, item });
    return node;
  }

  function render() {
    const query = field.value.trim();
    list.replaceChildren();
    options = [];
    let sections;
    if (!query) sections = suggestions();
    else {
      // Group by kind, then order the groups by their best match.
      const found = new Map();
      for (const { item, score } of rank(index.search(query), query)) {
        if (!found.has(item.section))
          found.set(item.section, { best: score, items: [] });
        const group = found.get(item.section);
        if (group.items.length < limits[item.kind]) group.items.push(item);
      }
      sections = [...found.entries()]
        .sort((a, b) => a[1].best - b[1].best)
        .map(([label, { items }]) => ({ label, items }));
    }
    for (const { label, items } of sections) {
      if (!items.length) continue;
      const group = document.createElement("div");
      group.setAttribute("role", "group");
      const heading = document.createElement("div");
      heading.className = "palette-group";
      heading.id = "pal-group-" + list.children.length;
      heading.textContent = label;
      heading.setAttribute("role", "presentation");
      group.setAttribute("aria-labelledby", heading.id);
      group.append(heading, ...items.map((item) => option(item, query)));
      list.append(group);
    }
    if (!options.length) {
      const empty = document.createElement("p");
      empty.className = "palette-empty";
      empty.textContent =
        "Sin coincidencias para «" + query + "». Prueba «cita», «ensayo» o «apoyo».";
      list.append(empty);
    }
    status.textContent = query
      ? options.length === 1
        ? "1 resultado"
        : options.length + " resultados"
      : "";
    setActive(0);
  }

  function choose(item) {
    dialog.close();
    item.run();
  }

  field.addEventListener("input", render);
  field.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActive(active + (event.key === "ArrowDown" ? 1 : -1));
    } else if (event.key === "Enter" && options[active]) {
      event.preventDefault();
      choose(options[active].item);
    }
  });
  // Clicking the backdrop (outside the dialog box) closes the palette.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  function open(query = "") {
    pool = items();
    index = new Fuse(pool, {
      keys: [
        { name: "title", weight: 3 },
        { name: "sub", weight: 1 },
        { name: "keywords", weight: 1 },
      ],
      includeScore: true,
      threshold: 0.3,
      minMatchCharLength: 2,
      ignoreLocation: true,
      ignoreDiacritics: true,
    });
    const panel = document.getElementById("panel");
    if (panel.open) panel.close();
    field.value = query;
    render();
    if (!dialog.open) dialog.showModal();
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
    announce?.(
      "Búsqueda abierta. Usa las flechas para recorrer los resultados.",
    );
  }

  document.addEventListener("keydown", (event) => {
    const typing = event.target.closest?.(
      "input, textarea, select, [contenteditable='true']",
    );
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (dialog.open) dialog.close();
      else open();
    } else if (
      event.key === "/" &&
      !typing &&
      !dialog.open &&
      !document.getElementById("panel").open
    ) {
      event.preventDefault();
      open();
    }
  });

  return { open, close: () => dialog.close() };
}
