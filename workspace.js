import { advancedTools, downloadText } from "./advanced-tools.js";
import { referenceBrowser } from "./reference-browser.js";
import Fuse from "./vendor/fuse.mjs";
import { modules, questions } from "./modules.js";

const cases = [
  {
    id: "A",
    label: "Caso A · Primera visita",
    background: "Primera consulta de orientación.",
    goal: "Reunir informes para la cita.",
  },
  {
    id: "B",
    label: "Caso B · Seguimiento",
    background: "Visita de seguimiento ya programada.",
    goal: "Revisar preguntas y próximos pasos.",
  },
  {
    id: "C",
    label: "Caso C · Apoyo familiar",
    background: "Consulta de apoyo a la persona cuidadora.",
    goal: "Preparar recursos y acordar seguimiento.",
  },
];
function today() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}
const fold = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
function dateLabel(date) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date + "T12:00:00"));
}
const byId = (id) => document.getElementById(id);

export function createWorkspace({
  el,
  action,
  show,
  body,
  detail,
  plan,
  privacy,
}) {
  let role = "pro",
    group = "Destacados",
    query = "",
    selectedCase = "A",
    serial = 4,
    timer = null;
  const entries = [],
    appointments = cases.map((c, i) => ({
      id: i + 1,
      uid: crypto.randomUUID(),
      caseId: c.id,
      date: today(),
      time: ["09:00", "10:30", "12:00"][i],
      reason: "Consulta de orientación",
      status: "Programada",
    }));
  const favorites = new Set(),
    referrals = new Map();
  const boards = new Map(),
    checks = new Map(),
    reports = [],
    notes = [],
    lines = [];
  let quizIndex = 0,
    quizAnswer = null,
    score = 0;
  const panel = byId("panel");
  const current = () => (role === "pac" ? "A" : selectedCase);
  const allowed = () =>
    modules.filter((m) => m.role === "both" || m.role === role);
  const getModule = (id) => modules.find((m) => m.id === id);
  const log = (caseId, description) =>
    entries.unshift({
      caseId,
      description,
      stamp: new Date().toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  function icon(name) {
    const img = el("img");
    img.src = "icons/" + name + ".svg";
    img.alt = "";
    img.width = 22;
    img.height = 22;
    return img;
  }
  function field(name, input) {
    const label = el("label", name, "desk-field");
    label.append(input);
    return label;
  }
  function select(values, initial) {
    const node = el("select");
    for (const val of values) {
      const [value, label] = Array.isArray(val) ? val : [val, val];
      const opt = el("option", label);
      opt.value = value;
      node.append(opt);
    }
    if (initial !== undefined) node.value = initial;
    return node;
  }
  function input(type, value) {
    const node = el("input");
    node.type = type;
    node.value = value ?? "";
    node.required = true;
    return node;
  }
  function feedback() {
    const p = el("p", undefined, "desk-feedback");
    p.setAttribute("role", "status");
    return p;
  }
  function external(title, url) {
    const a = el("a", title, "source-link");
    a.href = url;
    a.rel = "noopener noreferrer";
    a.target = "_blank";
    return a;
  }
  function context(change) {
    const box = el("div", undefined, "case-context");
    box.append(
      el("span", "Práctica con casos ficticios · datos de esta sesión", "note"),
    );
    if (role === "pro") {
      const s = select(
        cases.map((c) => [c.id, c.label]),
        selectedCase,
      );
      s.onchange = () => {
        selectedCase = s.value;
        change();
      };
      box.append(field("Caso de práctica", s));
    } else box.append(el("strong", cases[0].label));
    body.append(box);
  }
  function section(title) {
    body.append(el("h3", title, "desk-heading"));
  }
  function row(title, sub, controls = []) {
    const r = el("div", undefined, "desk-row");
    const text = el("div");
    text.append(el("strong", title));
    if (sub) text.append(el("small", sub));
    r.append(text, ...controls);
    return r;
  }
  function note(text) {
    body.append(el("p", text, "note"));
  }
  function submit(text) {
    const b = el("button", text, "primary");
    b.type = "submit";
    return b;
  }
  function go(id) {
    const m = getModule(id);
    if (m && allowed().includes(m)) launch(m);
  }
  function stopTimer() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }
  panel.addEventListener("close", stopTimer);
  const advanced = advancedTools({
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
    refresh: go,
    log,
    cases,
    reports,
    notes,
    appointments,
    entries,
  });
  function launch(m) {
    stopTimer();
    if (m.id === "consulta") {
      plan();
      return;
    }
    if (m.kind === "trials") {
      detail("trials");
      return;
    }
    show(m.name);
    const refresh = () => launch(m);
    if (
      [
        "agenda",
        "record",
        "diary",
        "board",
        "alerts",
        "checklist",
        "export",
        "hospital",
      ].includes(m.kind)
    )
      context(refresh);
    if (["guias", "red", "instituciones", "congresos"].includes(m.id)) {
      referenceBrowser({
        id: m.id,
        el,
        action,
        field,
        select,
        external,
        body,
        favorites,
      });
      if (m.id === "congresos") {
        section("Preparación del congreso");
        board(m);
      }
      return;
    }
    if (Object.hasOwn(advanced, m.kind)) {
      advanced[m.kind]();
      return;
    }
    switch (m.kind) {
      case "agenda":
        agenda();
        break;
      case "record":
        record();
        break;
      case "cases":
        caseList();
        break;
      case "reception":
        reception();
        break;
      case "diary":
        diary();
        break;
      case "alerts":
        alerts();
        break;
      case "board":
        if (m.id === "ic") referral();
        board(m);
        break;
      case "checklist":
        checklist(m);
        break;
      case "directory":
        directory(m);
        break;
      case "quote":
        quote();
        break;
      case "quiz":
        quiz();
        break;
      case "stats":
        stats();
        break;
      case "assistant":
        assistant();
        break;
      case "timer":
        pause();
        break;
      case "emergency":
        emergency();
        break;
    }
  }
  function agenda(editId = null) {
    const id = current(),
      selection = appointments.find((a) => a.id === editId);
    const form = el("form", undefined, "desk-form");
    const date = input("date", selection?.date ?? today()),
      time = input("time", selection?.time ?? "09:30");
    const reason = select(
      [
        "Consulta de orientación",
        "Seguimiento",
        "Sesión de apoyo",
        "Revisión de informes",
      ],
      selection?.reason,
    );
    const msg = feedback();
    form.append(
      field("Fecha", date),
      field("Hora", time),
      field("Motivo", reason),
      submit(selection ? "Guardar cambio" : "Programar cita"),
      msg,
    );
    form.onsubmit = (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      if (
        appointments.some(
          (a) =>
            a.id !== editId &&
            a.date === date.value &&
            a.time === time.value &&
            a.status !== "Cancelada",
        )
      ) {
        msg.textContent = "Ese horario ya está ocupado. Elige otra hora.";
        return;
      }
      if (selection)
        Object.assign(selection, {
          date: date.value,
          time: time.value,
          reason: reason.value,
          status: "Programada",
        });
      else
        appointments.push({
          id: ++serial,
          uid: crypto.randomUUID(),
          caseId: id,
          date: date.value,
          time: time.value,
          reason: reason.value,
          status: "Programada",
        });
      log(id, selection ? "Cita reprogramada" : "Cita programada");
      go("agenda");
    };
    section(selection ? "Reprogramar cita" : "Nueva cita");
    body.append(form);
    if (selection) {
      body.append(action("Volver a citas", () => go("agenda"), "text-button"));
      return;
    }
    section("Citas del caso");
    const items = appointments
      .filter((a) => a.caseId === id)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    for (const a of items) {
      const controls = el("div", undefined, "row-actions");
      if (!["Cancelada", "Atendida"].includes(a.status)) {
        if (role === "pro" || a.status === "Programada") {
          const next =
            a.status === "Programada"
              ? "Confirmada"
              : a.status === "Confirmada"
                ? "En recepción"
                : "Atendida";
          controls.append(
            action(
              {
                Confirmada: "Confirmar",
                "En recepción": "Registrar llegada",
                Atendida: "Marcar atendida",
              }[next],
              () => {
                a.status = next;
                log(id, "Cita: " + next);
                go("agenda");
              },
              "small-button",
            ),
          );
        }
        controls.append(
          action(
            "Reprogramar",
            () => {
              show("Reprogramar cita");
              agenda(a.id);
            },
            "small-button",
          ),
          action(
            "Cancelar cita",
            () => {
              a.status = "Cancelada";
              log(id, "Cita cancelada");
              go("agenda");
            },
            "text-button",
          ),
        );
      }
      if (a.status !== "Cancelada")
        controls.append(
          action("Añadir a calendario", () => calendarFile(a), "text-button"),
        );
      body.append(
        row(dateLabel(a.date) + " · " + a.time, a.reason + " · " + a.status, [
          controls,
        ]),
      );
    }
  }
  function calendarFile(a) {
    const stamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
    const start =
      a.date.replaceAll("-", "") + "T" + a.time.replace(":", "") + "00";
    const content = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//KindForest//Agenda//ES",
      "BEGIN:VEVENT",
      "UID:" + a.uid + "@kindforest",
      "DTSTAMP:" + stamp,
      "DTSTART:" + start,
      "SUMMARY:KindForest - cita de práctica",
      "DESCRIPTION:Horario local. " + a.reason,
      "END:VEVENT",
      "END:VCALENDAR",
      "",
    ].join("\r\n");
    downloadText("kindforest-cita.ics", content, "text/calendar;charset=utf-8");
  }
  function caseList() {
    const visitType = select([
        "Primera visita",
        "Seguimiento",
        "Apoyo familiar",
      ]),
      goal = select([
        "Reunir informes para la cita.",
        "Revisar preguntas y próximos pasos.",
        "Organizar el acompañamiento.",
      ]);
    const form = el("form", undefined, "desk-form");
    form.append(
      field("Tipo de visita", visitType),
      field("Objetivo del ejemplo", goal),
      submit("Crear caso ficticio"),
    );
    form.onsubmit = (e) => {
      e.preventDefault();
      const id = String(cases.length + 1);
      cases.push({
        id,
        label: "Caso " + id + " · " + visitType.value,
        background: visitType.value + " de práctica.",
        goal: goal.value,
      });
      selectedCase = id;
      log(id, "Expediente creado");
      go("exp");
    };
    body.append(form);
    for (const c of cases) {
      body.append(
        row(c.label, c.goal, [
          action(
            "Abrir expediente",
            () => {
              selectedCase = c.id;
              go("exp");
            },
            "small-button",
          ),
        ]),
      );
    }
  }
  function reception() {
    const date = input("date", today()),
      status = select([
        "Todos",
        "Programada",
        "Confirmada",
        "En recepción",
        "Atendida",
        "Cancelada",
      ]);
    const result = el("div");
    const draw = () => {
      result.replaceChildren();
      const found = appointments
        .filter(
          (a) =>
            a.date === date.value &&
            (status.selectedIndex === 0 || a.status === status.value),
        )
        .sort((a, b) => a.time.localeCompare(b.time));
      for (const a of found)
        result.append(
          row(a.time + " · Caso " + a.caseId, a.reason + " · " + a.status, [
            action(
              "Gestionar cita",
              () => {
                selectedCase = a.caseId;
                go("agenda");
              },
              "small-button",
            ),
          ]),
        );
      if (!found.length) result.append(el("p", "Sin citas en esta vista."));
    };
    date.onchange = status.onchange = draw;
    body.append(
      field("Día de la agenda", date),
      field("Estado de cita", status),
      result,
    );
    draw();
  }
  function record() {
    const c = cases.find((c) => c.id === current());
    body.append(el("p", c.background + " " + c.goal, "lead"));
    const type = select([
      "Orientación",
      "Revisión de informes",
      "Plan de seguimiento",
    ]);
    const observation = select([
      "Se revisaron las preguntas del caso",
      "Se organizaron los documentos disponibles",
      "Se acordó revisar el seguimiento en la próxima cita",
    ]);
    const extra = el("textarea");
    extra.maxLength = 480;
    extra.rows = 2;
    const form = el("form", undefined, "desk-form");
    form.append(
      field("Tipo de nota", type),
      field("Observación del ejemplo", observation),
      field("Detalle ficticio opcional · sin datos personales", extra),
      submit("Registrar nota"),
    );
    form.onsubmit = (e) => {
      e.preventDefault();
      notes.unshift({
        caseId: c.id,
        type: type.value,
        text: [observation.value, extra.value.trim()]
          .filter(Boolean)
          .join(". "),
      });
      log(c.id, "Nota registrada: " + type.value);
      go("exp");
    };
    body.append(form);
    section("Resumen del expediente");
    const summary = [
      ...notes
        .filter((n) => n.caseId === c.id)
        .map((n) => n.type + " · " + n.text),
      ...reports
        .filter((r) => r.caseId === c.id)
        .map((r) => r.date + " · " + r.symptom + " · " + r.level),
    ];
    if (!summary.length) note("Aún no hay notas ni reportes para este caso.");
    summary.forEach((s) => body.append(row(s)));
    body.append(action("Ver citas del caso", () => go("agenda"), "secondary"));
    section("Actividad del caso");
    const logItems = entries.filter((e) => e.caseId === c.id);
    if (!logItems.length)
      note("La actividad aparecerá al registrar un cambio.");
    logItems
      .slice(0, 12)
      .forEach((e) => body.append(row(e.description, e.stamp)));
  }
  function diary() {
    const id = current(),
      form = el("form", undefined, "desk-form");
    const symptom = select([
        "Bienestar general",
        "Cansancio",
        "Náusea",
        "Dolor",
        "Sueño",
        "Apetito",
      ]),
      level = select(["Sin molestia", "Leve", "Moderada", "Intensa"]);
    form.append(
      field("Aspecto a registrar", symptom),
      field("Cómo se percibe", level),
      submit("Añadir al diario"),
    );
    form.onsubmit = (e) => {
      e.preventDefault();
      reports.unshift({
        caseId: id,
        symptom: symptom.value,
        level: level.value,
        date: today(),
        seen: false,
      });
      log(id, "Registro en diario");
      go("diario");
    };
    body.append(form);
    note(
      "Diario de práctica. Nadie monitoriza estos registros. Si necesitas atención, contacta a tu equipo o a urgencias.",
    );
    section("Historial");
    const mine = reports.filter((r) => r.caseId === id);
    if (!mine.length) note("El diario de este caso está vacío.");
    mine.forEach((r) =>
      body.append(
        row(
          r.symptom + " · " + r.level,
          dateLabel(r.date) + (r.seen ? " · Revisado" : " · Por revisar"),
        ),
      ),
    );
  }
  function alerts() {
    const pending = reports.filter((r) => r.caseId === current() && !r.seen);
    if (!pending.length)
      note("No hay reportes pendientes de revisión en este caso.");
    pending.forEach((r) =>
      body.append(
        row(r.symptom + " · " + r.level, dateLabel(r.date), [
          action(
            "Marcar revisado",
            () => {
              r.seen = true;
              log(r.caseId, "Reporte revisado");
              go("alertas");
            },
            "small-button",
          ),
        ]),
      ),
    );
    body.append(action("Abrir diario", () => go("diario"), "secondary"));
  }
  function referral() {
    const id = current();
    if (!referrals.has(id)) referrals.set(id, {});
    const draft = referrals.get(id);
    const specialty = select(
      [
        "Oncología médica",
        "Hematología",
        "Cuidados de soporte",
        "Trabajo social",
      ],
      draft.service,
    );
    const reason = select(
      [
        "Segunda opinión",
        "Revisión de informes",
        "Coordinación del seguimiento",
      ],
      draft.reason,
    );
    const question = el("textarea");
    question.maxLength = 480;
    question.value = draft.question || "";
    const copy = action(
      "Descargar interconsulta",
      () =>
        downloadText(
          "kindforest-interconsulta-" + id + ".txt",
          [
            "Interconsulta de práctica · Caso " + id,
            "Servicio: " + specialty.value,
            "Motivo: " + reason.value,
            "Pregunta: " + question.value.trim(),
          ].join("\n"),
        ),
      "secondary",
    );
    const update = () => {
      Object.assign(draft, {
        service: specialty.value,
        reason: reason.value,
        question: question.value,
      });
      copy.disabled = !draft.question.trim();
    };
    specialty.onchange = reason.onchange = question.oninput = update;
    update();
    body.append(
      field("Servicio consultado", specialty),
      field("Motivo de la solicitud", reason),
      field("Pregunta sobre el caso ficticio", question),
      copy,
    );
    section("Seguimiento de la interconsulta");
  }
  function board(m) {
    const id = current(),
      key = m.id + ":" + id;
    if (!boards.has(key)) boards.set(key, []);
    const tickets = boards.get(key),
      choice = select(m.items),
      msg = feedback();
    const form = el("form", undefined, "desk-form");
    form.append(field("Actividad", choice), submit("Añadir al tablero"), msg);
    form.onsubmit = (e) => {
      e.preventDefault();
      if (tickets.some((t) => t.label === choice.value)) {
        msg.textContent = "Esta actividad ya está en el tablero.";
        return;
      }
      tickets.push({ label: choice.value, step: 0 });
      log(id, m.name + " · " + choice.value);
      go(m.id);
    };
    body.append(form);
    if (!tickets.length)
      note("Selecciona una actividad para iniciar su seguimiento.");
    for (const t of tickets) {
      const controls = el("div", undefined, "row-actions");
      if (t.step < m.steps.length - 1)
        controls.append(
          action(
            "Pasar a " + m.steps[t.step + 1],
            () => {
              t.step++;
              log(id, t.label + " · " + m.steps[t.step]);
              go(m.id);
            },
            "small-button",
          ),
        );
      controls.append(
        action(
          "Retirar",
          () => {
            tickets.splice(tickets.indexOf(t), 1);
            go(m.id);
          },
          "text-button",
        ),
      );
      body.append(row(t.label, m.steps[t.step], [controls]));
    }
    if (m.id === "congresos")
      body.append(
        external("Calendario de ASCO ↗", "https://www.asco.org/meetings"),
        external(
          "Calendario de ESMO ↗",
          "https://www.esmo.org/meeting-calendar",
        ),
      );
    if (m.id === "protocolo")
      body.append(
        external(
          "Consultar protocolos registrados ↗",
          "https://clinicaltrials.gov/",
        ),
        external(
          "Biblioteca de investigación en imagen ↗",
          "https://www.cancerimagingarchive.net/",
        ),
      );
  }
  function checklist(m) {
    const key = m.id + ":" + current();
    if (!checks.has(key)) checks.set(key, new Set());
    const selected = checks.get(key);
    const progress = el("p", undefined, "note");
    progress.setAttribute("role", "status");
    const update = () => {
      progress.textContent =
        selected.size + " de " + m.items.length + " puntos completados";
    };
    for (const item of m.items) {
      const label = el("label", undefined, "check-row");
      const box = input("checkbox");
      box.required = false;
      box.checked = selected.has(item);
      box.onchange = () => {
        if (box.checked) selected.add(item);
        else selected.delete(item);
        update();
      };
      label.append(box, el("span", item));
      body.append(label);
    }
    update();
    body.append(progress);
    if (m.id === "grupos")
      body.append(
        external(
          "Orientación del NCI sobre grupos de apoyo ↗",
          "https://www.cancer.gov/espanol/cancer/sobrellevar/adaptacion-al-cancer/grupos-de-apoyo",
        ),
      );
  }
  function directory(m) {
    const search = input("search");
    search.required = false;
    search.placeholder = "Nombre, tema o región";
    const list = el("div");
    const display = () => {
      list.replaceChildren();
      const matches = m.links.filter((l) =>
        fold(l.join(" ")).includes(fold(search.value.trim())),
      );
      matches.forEach(([name, tag, url]) =>
        list.append(row(name, tag, [external("Abrir ↗", url)])),
      );
      if (!matches.length) list.append(el("p", "No hay coincidencias."));
    };
    search.oninput = display;
    body.append(field("Filtrar directorio", search), list);
    display();
    if (m.id === "derechos")
      body.append(action("Privacidad de KindForest", privacy, "secondary"));
  }
  function quote() {
    const form = el("form", undefined, "desk-form");
    const service = select(["Consulta", "Estudio", "Transporte", "Material"]),
      quantity = input("number", "1"),
      price = input("number", "0");
    quantity.min = "1";
    quantity.max = "999";
    price.min = "0";
    price.max = "999999";
    price.step = "0.01";
    form.append(
      field("Concepto", service),
      field("Cantidad", quantity),
      field("Precio unitario en MXN", price),
      submit("Agregar concepto"),
    );
    form.onsubmit = (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      lines.push({
        service: service.value,
        qty: quantity.valueAsNumber,
        cents: Math.round(price.valueAsNumber * 100),
      });
      go("cotizador");
    };
    body.append(form);
    const pesos = (c) =>
      new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
      }).format(c / 100);
    lines.forEach((l, i) =>
      body.append(
        row(l.service + " × " + l.qty, pesos(l.qty * l.cents), [
          action(
            "Quitar",
            () => {
              lines.splice(i, 1);
              go("cotizador");
            },
            "text-button",
          ),
        ]),
      ),
    );
    body.append(
      el(
        "p",
        "Total estimado · " +
          pesos(lines.reduce((sum, l) => sum + l.cents * l.qty, 0)),
        "lead",
      ),
    );
    note("Estimación personal en MXN. Confirma los precios con el prestador.");
  }
  function quiz() {
    if (quizIndex === questions.length) {
      body.append(
        el("p", "Resultado: " + score + " de " + questions.length, "lead"),
        action(
          "Repetir reto",
          () => {
            quizIndex = 0;
            score = 0;
            quizAnswer = null;
            go("aula");
          },
          "primary",
        ),
      );
      return;
    }
    const [q, answers, right, explanation] = questions[quizIndex];
    note("Pregunta " + (quizIndex + 1) + " de " + questions.length);
    section(q);
    answers.forEach((answer, i) => {
      const b = action(
        answer,
        () => {
          quizAnswer = i;
          if (i === right) score++;
          go("aula");
        },
        "answer",
      );
      b.disabled = quizAnswer !== null;
      body.append(b);
    });
    if (quizAnswer !== null) {
      body.append(
        el(
          "p",
          (quizAnswer === right
            ? "Correcto. "
            : "Respuesta correcta: " + answers[right] + ". ") + explanation,
        ),
        action(
          "Continuar",
          () => {
            quizIndex++;
            quizAnswer = null;
            go("aula");
          },
          "primary",
        ),
      );
    }
  }
  let usageChart;
  panel.addEventListener("close", () => {
    usageChart?.destroy();
    usageChart = null;
  });
  async function stats() {
    const counts = [
      [
        "Citas programadas",
        appointments.filter(
          (a) => !["Cancelada", "Atendida"].includes(a.status),
        ).length,
      ],
      [
        "Citas atendidas",
        appointments.filter((a) => a.status === "Atendida").length,
      ],
      ["Reportes por revisar", reports.filter((r) => !r.seen).length],
      ["Notas registradas", notes.length],
      [
        "Actividades en tableros",
        [...boards.values()].reduce((s, a) => s + a.length, 0),
      ],
    ];
    const holder = el("div", undefined, "chart-frame"),
      canvas = el("canvas");
    canvas.setAttribute("role", "img");
    canvas.setAttribute(
      "aria-label",
      "Actividad de la sesión. Los valores se detallan a continuación.",
    );
    holder.append(canvas);
    body.append(holder);
    counts.forEach(([key, n]) => body.append(row(key, String(n))));
    try {
      const { Chart } = await import("./vendor/chart.mjs");
      if (!holder.isConnected || !panel.open) return;
      usageChart?.destroy();
      usageChart = new Chart(canvas, {
        type: "bar",
        data: {
          labels: [
            "Programadas",
            "Atendidas",
            "Por revisar",
            "Notas",
            "En tableros",
          ],
          datasets: [
            {
              label: "Cantidad",
              data: counts.map(([, n]) => n),
              backgroundColor: [
                "#206957",
                "#7d9072",
                "#b67540",
                "#548798",
                "#666c94",
              ],
              borderRadius: 5,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          scales: {
            x: { beginAtZero: true, ticks: { precision: 0 } },
            y: { grid: { display: false } },
          },
        },
      });
    } catch {
      holder.remove();
    }
  }
  function pause() {
    const duration = select([
      ["60", "1 minuto"],
      ["180", "3 minutos"],
      ["300", "5 minutos"],
    ]);
    const display = el("p", "01:00", "clock");
    const control = action(
      "Iniciar pausa",
      () => {
        if (timer !== null) {
          stopTimer();
          control.textContent = "Continuar";
          return;
        }
        const until = Date.now() + left * 1000;
        control.textContent = "Pausar";
        duration.disabled = true;
        timer = setInterval(() => {
          left = Math.max(0, Math.ceil((until - Date.now()) / 1000));
          paint();
          if (!left) {
            stopTimer();
            control.disabled = true;
            status.textContent = "Pausa terminada.";
            duration.disabled = false;
          }
        }, 250);
      },
      "primary",
    );
    const status = feedback();
    let left = 60;
    const paint = () => {
      display.textContent =
        String(Math.floor(left / 60)).padStart(2, "0") +
        ":" +
        String(left % 60).padStart(2, "0");
    };
    const reset = () => {
      stopTimer();
      left = Number(duration.value);
      paint();
      status.textContent = "";
      duration.disabled = false;
      control.disabled = false;
      control.textContent = "Iniciar pausa";
    };
    duration.onchange = reset;
    body.append(
      field("Duración", duration),
      display,
      control,
      action("Reiniciar", reset, "secondary"),
      status,
      external(
        "Bienestar en el trabajo · OMS ↗",
        "https://www.who.int/publications/i/item/9789240053052",
      ),
    );
  }
  function emergency() {
    body.append(
      el(
        "p",
        "En México, llama al 911 si necesitas atención inmediata. Si estás en otro país, usa el número de emergencias local.",
        "lead",
      ),
    );
    const a = el("a", "Llamar al 911 · México", "primary");
    a.href = "tel:911";
    body.append(a);
    section("Durante la llamada");
    body.append(
      el(
        "p",
        "Indica dónde estás, cómo pueden localizarte y qué está ocurriendo. Sigue las instrucciones del servicio de emergencias.",
      ),
    );
    note("KindForest no envía avisos a un hospital.");
  }
  function assistant() {
    note(
      "Buscador local de herramientas. Usa palabras como cita, ensayo o diario.",
    );
    const q = input("search");
    q.required = false;
    const results = el("div");
    const choices = allowed().filter((m) => m.id !== "asistente");
    const index = new Fuse(choices, {
      keys: ["name", "summary", "group", "id"],
      threshold: 0.42,
      ignoreLocation: true,
    });
    const refresh = () => {
      results.replaceChildren();
      const found = q.value.trim()
        ? index
            .search(q.value)
            .slice(0, 6)
            .map((r) => r.item)
        : choices.slice(0, 4);
      found.forEach((m) =>
        results.append(action(m.name, () => launch(m), "answer")),
      );
      if (!found.length)
        results.append(el("p", "Sin coincidencias. Prueba otra palabra."));
    };
    q.oninput = refresh;
    body.append(field("Qué quieres hacer", q), results);
    refresh();
  }
  const highlights = {
    pro: ["agenda", "exp", "ic", "alertas", "protocolo", "asistente"],
    pac: ["agenda", "diario", "medicinas", "ensayos", "oncoguia", "urgencias"],
  };
  function draw() {
    const options = allowed();
    const grid = byId("tool-grid");
    grid.replaceChildren();
    const search = query.trim();
    let visible = options;
    if (search) {
      const index = new Fuse(options, {
        keys: ["name", "summary", "group", "id"],
        threshold: 0.38,
        ignoreLocation: true,
      });
      visible = index.search(search).map((r) => r.item);
    } else if (group === "Destacados")
      visible = highlights[role].map(getModule);
    else if (group !== "Todo")
      visible = options.filter((m) => m.group === group);
    byId("tool-count").textContent =
      visible.length === 1 ? "1 herramienta" : visible.length + " herramientas";
    for (const m of visible) {
      const b = action("", () => launch(m), "tool-card");
      const top = el("span", undefined, "tool-meta");
      const glyph = el("span", undefined, "tool-icon");
      glyph.append(icon(m.icon));
      top.append(glyph, el("span", m.group));
      const title = el("strong", m.name);
      const desc = el("small", m.summary);
      const arr = el("span", "↗", "tool-arrow");
      arr.setAttribute("aria-hidden", "true");
      b.append(top, title, desc, arr);
      grid.append(b);
    }
    if (!visible.length)
      grid.append(
        el(
          "p",
          "No encontramos esa herramienta. Prueba «guías», «citas» o «apoyo».",
        ),
      );
  }
  function tabs() {
    const holder = byId("tool-tabs");
    holder.replaceChildren();
    for (const name of [
      "Destacados",
      "Todo",
      ...new Set(allowed().map((m) => m.group)),
    ]) {
      const b = action(
        name,
        () => {
          group = name;
          query = "";
          byId("tool-query").value = "";
          for (const item of holder.children)
            item.setAttribute("aria-pressed", item === b);
          draw();
        },
        "chip",
      );
      b.setAttribute("aria-pressed", group === name && !query);
      holder.append(b);
    }
  }
  byId("tool-query").addEventListener("input", (e) => {
    query = e.target.value;
    tabs();
    draw();
  });
  byId("quick-help").onclick = () => go("urgencias");
  return {
    setRole(value) {
      role = value;
      group = "Destacados";
      query = "";
      byId("tool-query").value = "";
      tabs();
      draw();
    },
  };
}
