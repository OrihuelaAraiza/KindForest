const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});
export function downloadText(name, text, mime = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function advancedTools({
  el,
  body,
  action,
  field,
  select,
  input,
  section,
  row,
  note,
  external,
  context,
  current,
  refresh,
  log,
  cases,
  reports,
  notes,
  appointments,
  entries,
}) {
  const beds = [null, null, null, null],
    draft = {},
    roster = new Map(),
    budgets = {},
    time = {},
    bmi = {};
  const pairs = [
    "calendar-days",
    "microscope",
    "leaf",
    "heart-pulse",
    "compass",
    "book-open",
  ];
  let cards = [],
    first = null,
    solved = new Set(),
    moves = 0,
    locked = false,
    round = 0;
  function exportSummary() {
    const id = current(),
      c = cases.find((x) => x.id === id);
    const series = [
      ["Contexto", [c.background, c.goal]],
      [
        "Citas",
        appointments
          .filter((a) => a.caseId === id)
          .map(
            (a) => a.date + " " + a.time + " · " + a.reason + " · " + a.status,
          ),
      ],
      [
        "Notas",
        notes
          .filter((n) => n.caseId === id)
          .map((n) => n.type + " · " + n.text),
      ],
      [
        "Diario",
        reports
          .filter((r) => r.caseId === id)
          .map((r) => r.date + " · " + r.symptom + " · " + r.level),
      ],
      [
        "Actividad",
        entries
          .filter((e) => e.caseId === id)
          .map((e) => e.stamp + " · " + e.description),
      ],
    ];
    note(
      "El archivo contendrá únicamente las secciones elegidas de este caso ficticio.",
    );
    const selected = new Set();
    const preview = el("pre", undefined, "preview-text");
    const button = action(
      "Descargar resumen",
      () => downloadText("kindforest-caso-" + id + ".txt", preview.textContent),
      "primary",
    );
    const update = () => {
      button.disabled = !selected.size;
      preview.textContent = [
        c.label,
        ...series
          .filter(([k]) => selected.has(k))
          .map(
            ([k, lines]) => k + "\n" + (lines.join("\n") || "Sin registros."),
          ),
      ].join("\n\n");
    };
    series.forEach(([name]) => {
      const l = el("label", undefined, "check-row"),
        box = input("checkbox");
      box.checked = false;
      box.onchange = () => {
        if (box.checked) selected.add(name);
        else selected.delete(name);
        update();
      };
      l.append(box, el("span", name));
      body.append(l);
    });
    update();
    body.append(preview, button);
  }
  function hospital() {
    const id = current(),
      at = beds.indexOf(id);
    note("Cuatro camas de práctica. Una cama admite un solo caso a la vez.");
    beds.forEach((occupant, i) => {
      const own = occupant === id;
      const label = own
        ? "Dar de alta"
        : occupant
          ? null
          : at < 0
            ? "Ingresar aquí"
            : "Trasladar aquí";
      const controls = label
        ? [
            action(
              label,
              () => {
                if (at >= 0) beds[at] = null;
                if (!own) beds[i] = id;
                log(id, "Hospital · " + (own ? "Alta" : "Cama " + (i + 1)));
                refresh("hospital");
              },
              "small-button",
            ),
          ]
        : [];
      body.append(
        row(
          "Cama " + (i + 1),
          occupant ? "Caso " + occupant : "Disponible",
          controls,
        ),
      );
    });
  }
  function protocol() {
    const labels = [
      "Pregunta de investigación",
      "Población y objetivo",
      "Diseño propuesto",
      "Siguiente paso",
    ];
    note(
      "Borrador de trabajo de esta sesión. Escribe sobre el diseño sin incluir datos que identifiquen a personas.",
    );
    const save = action(
      "Descargar borrador",
      () =>
        downloadText(
          "kindforest-protocolo.txt",
          labels.map((k) => k + "\n" + (draft[k] || "Pendiente")).join("\n\n"),
        ),
      "primary",
    );
    const update = () => {
      save.disabled = !labels.some((k) => draft[k]?.trim());
    };
    labels.forEach((k) => {
      const t = el("textarea");
      t.rows = 2;
      t.maxLength = 600;
      t.value = draft[k] || "";
      t.oninput = () => {
        draft[k] = t.value;
        update();
      };
      body.append(field(k, t));
    });
    update();
    body.append(save);
  }
  function compute(id, config, store, format) {
    const form = el("div", undefined, "desk-form"),
      out = el("p", undefined, "calc-result");
    out.setAttribute("role", "status");
    const fields = config.map(([label, min, max, initial, step]) => {
      const n = input("number", store[label] ?? initial);
      n.min = min;
      n.max = max;
      n.step = step || 1;
      form.append(field(label, n));
      return n;
    });
    const recalc = () => {
      fields.forEach((n, i) => (store[config[i][0]] = n.value));
      out.textContent = fields.every(
        (n) => n.validity.valid && Number.isFinite(n.valueAsNumber),
      )
        ? format(fields.map((n) => n.valueAsNumber))
        : "Revisa los valores y sus unidades.";
    };
    form.oninput = recalc;
    body.append(form, out);
    recalc();
  }
  function plans() {
    const options = ["Paciente", "Profesional", "Clínica"];
    const info = {
      Paciente: [
        "Onco-Pilot",
        "Seguimiento y material educativo. El original anuncia el acceso gratuito para pacientes.",
      ],
      Profesional: [
        "Básico, Esencial, Pro y 360",
        "Los niveles profesionales distinguen funciones locales y consumo de servicios de IA.",
      ],
      Clínica: [
        "Clínica",
        "La modalidad para instituciones tiene condiciones propias de contratación.",
      ],
    };
    const a = select(options),
      b = select(options, "Profesional"),
      results = el("div");
    const draw = () => {
      results.replaceChildren();
      for (const name of new Set([a.value, b.value]))
        results.append(row(name + " · " + info[name][0], info[name][1]));
    };
    a.onchange = draw;
    b.onchange = draw;
    body.append(
      field("Primer perfil", a),
      field("Comparar con", b),
      results,
      external(
        "Ver precios y condiciones en ROMI ↗",
        "https://kind-forest-0ad32cb0f.6.azurestaticapps.net/planes.html",
      ),
    );
    draw();
    note("KindForest no cobra suscripciones.");
  }
  function circle() {
    note(
      "Distribuye tareas del ejemplo. Los cambios son locales a esta sesión.",
    );
    const tasks = [
      "Preparar documentos",
      "Acompañar a la cita",
      "Coordinar el traslado",
      "Consultar requisitos del apoyo",
    ];
    for (const task of tasks) {
      const s = select(
        [
          "Por asignar",
          "Paciente",
          "Familiar",
          "Persona cuidadora",
          "Equipo de apoyo",
        ],
        roster.get(task),
      );
      s.onchange = () => roster.set(task, s.value);
      body.append(field(task, s));
    }
  }
  function memory() {
    if (!cards.length) reset();
    const grid = el("div", undefined, "memory-grid"),
      status = el("p", undefined, "note");
    status.setAttribute("role", "status");
    const faces = {
      "calendar-days": "Agenda",
      microscope: "Microscopio",
      leaf: "Hoja",
      "heart-pulse": "Pulso",
      compass: "Brújula",
      "book-open": "Libro",
    };
    function reset() {
      round++;
      cards = [...pairs, ...pairs];
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
      }
      solved = new Set();
      first = null;
      locked = false;
      moves = 0;
    }
    function paint(second = null) {
      grid.replaceChildren();
      cards.forEach((key, i) => {
        const shown = solved.has(key) || i === first || i === second;
        const b = action(shown ? faces[key] : "?", () => reveal(i), "answer");
        b.setAttribute(
          "aria-label",
          "Carta " + (i + 1) + (shown ? " · " + faces[key] : " oculta"),
        );
        b.disabled = shown || locked;
        grid.append(b);
      });
      status.textContent =
        (solved.size === pairs.length ? "Completado · " : "") +
        moves +
        " intentos · " +
        solved.size +
        " de " +
        pairs.length +
        " parejas";
    }
    function reveal(i) {
      if (locked || i === first || solved.has(cards[i])) return;
      if (first === null) {
        first = i;
        paint();
        return;
      }
      moves++;
      if (cards[first] === cards[i]) {
        solved.add(cards[i]);
        first = null;
        paint();
        return;
      }
      locked = true;
      paint(i);
      const active = round;
      setTimeout(() => {
        if (round !== active) return;
        first = null;
        locked = false;
        if (grid.isConnected) paint();
        else if (
          document.getElementById("panel-title").textContent ===
            "Juego de memoria" &&
          document.getElementById("panel").open
        )
          refresh("memoria");
      }, 900);
    }
    body.append(
      status,
      grid,
      action(
        "Nueva partida",
        () => {
          reset();
          paint();
        },
        "secondary",
      ),
    );
    paint();
  }
  return {
    hospital,
    protocol,
    export: exportSummary,
    plans,
    circle,
    memory,
    budget: () =>
      compute(
        "budget",
        [
          ["Consultas mensuales", 0, 9999, 30],
          ["Honorario por consulta (MXN)", 0, 999999, 500, 0.01],
          ["Costos mensuales (MXN)", 0, 99999999, 5000, 0.01],
        ],
        budgets,
        ([count, fee, cost]) =>
          "Ingresos: " +
          mxn.format(count * fee) +
          " · Margen antes de impuestos: " +
          mxn.format(count * fee - cost),
      ),
    time: () =>
      compute(
        "time",
        [
          ["Consulta (minutos)", 0, 1440, 240],
          ["Documentación (minutos)", 0, 1440, 60],
          ["Formación (minutos)", 0, 1440, 30],
        ],
        time,
        (vals) => {
          const all = vals.reduce((s, n) => s + n, 0);
          return all > 1440
            ? "El total supera un día."
            : all
              ? all +
                " min en total · " +
                Math.round((vals[0] * 100) / all) +
                " % en consulta"
              : "Añade minutos a la jornada.";
        },
      ),
    bmi: () => {
      note(
        "Ejercicio de cálculo en adultos. El IMC aislado no define el estado nutricional ni una indicación de tratamiento.",
      );
      compute(
        "bmi",
        [
          ["Peso (kg)", 10, 500, 70, 0.1],
          ["Estatura (cm)", 70, 250, 170, 0.1],
        ],
        bmi,
        ([kg, cm]) =>
          "IMC: " +
          (kg / (cm / 100) ** 2).toLocaleString("es-MX", {
            maximumFractionDigits: 1,
          }) +
          " kg/m²",
      );
    },
  };
}
