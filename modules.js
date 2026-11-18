// Public navigation, organized around tasks. Workflows manipulate only the current tab.
const modules = [];
function module(id, role, group, name, summary, icon, kind, options = {}) {
  modules.push({ id, role, group, name, summary, icon, kind, ...options });
}
const clinic = "Consulta",
  personal = "Mi cuidado",
  work = "Gestión",
  learn = "Aprendizaje",
  community = "Red e investigación";
const board = (id, role, group, name, summary, icon, items, steps) =>
  module(id, role, group, name, summary, icon, "board", { items, steps });
const directory = (id, role, group, name, summary, icon, links) =>
  module(id, role, group, name, summary, icon, "directory", { links });
const checklist = (id, role, group, name, summary, icon, items) =>
  module(id, role, group, name, summary, icon, "checklist", { items });

module(
  "agenda",
  "both",
  clinic,
  "Agenda y recepción",
  "Programa, confirma y reprograma citas de práctica.",
  "calendar-days",
  "agenda",
);
module(
  "exp",
  "pro",
  clinic,
  "Expedientes de práctica",
  "Abre el resumen de cada caso y registra una nota estructurada.",
  "notebook-tabs",
  "record",
);
module(
  "diario",
  "both",
  personal,
  "Diario de síntomas",
  "Registra cómo va el día y consulta la evolución del caso.",
  "heart-pulse",
  "diary",
);
module(
  "ic",
  "pro",
  clinic,
  "Interconsulta",
  "Prepara una solicitud y sigue sus etapas en el tablero.",
  "network",
  "board",
  {
    items: [
      "Segunda opinión · oncología",
      "Revisión de imagen",
      "Orientación de trabajo social",
      "Consulta de cuidados de soporte",
    ],
    steps: ["Borrador", "Preparada", "Revisada"],
  },
);
module(
  "alertas",
  "pro",
  clinic,
  "Pendientes y alertas",
  "Revisa los reportes del diario y los asuntos del consultorio.",
  "bell",
  "alerts",
);
module(
  "asistente",
  "both",
  learn,
  "Asistente de navegación",
  "Encuentra la herramienta adecuada escribiendo lo que quieres hacer.",
  "compass",
  "assistant",
);
module(
  "ensayos",
  "both",
  community,
  "Buscador de ensayos",
  "Prepara filtros de ubicación y reclutamiento para el registro oficial.",
  "microscope",
  "trials",
);
module(
  "cotizador",
  "both",
  work,
  "Cotizador de atención",
  "Estima conceptos, cantidades y totales en pesos mexicanos.",
  "wallet",
  "quote",
);
module(
  "aula",
  "both",
  learn,
  "Aula y retos",
  "Practica la lectura de fuentes y el cuidado de la privacidad.",
  "graduation-cap",
  "quiz",
);
module(
  "bienestar",
  "both",
  personal,
  "Pausa de bienestar",
  "Programa una pausa breve y consulta recursos de bienestar.",
  "timer",
  "timer",
);
module(
  "estadistica",
  "pro",
  work,
  "Actividad del consultorio",
  "Revisa citas, reportes y tareas por estado durante la sesión.",
  "activity",
  "stats",
);
module(
  "documentos",
  "both",
  clinic,
  "Carpeta de documentos",
  "Organiza qué informes conviene reunir para la cita.",
  "file-text",
  "board",
  {
    items: [
      "Informe de patología",
      "Resumen de consulta",
      "Informe de imagen",
      "Lista de medicinas",
      "Resultados de laboratorio",
    ],
    steps: ["Por reunir", "Disponible", "Revisado"],
  },
);
board(
  "permisos",
  "both",
  clinic,
  "Permisos y autorizaciones",
  "Ensaya la revisión de permisos sobre un caso ficticio.",
  "shield-check",
  [
    "Compartir resumen con familiar",
    "Solicitar copia de expediente",
    "Compartir informe con especialista",
  ],
  ["Solicitado", "Aprobado", "Revocado"],
);
board(
  "medicinas",
  "both",
  personal,
  "Medicinas y recordatorios",
  "Marca en el ejemplo los pasos del plan acordado con el equipo.",
  "pill",
  [
    "Revisar lista de la mañana",
    "Preparar preguntas sobre medicinas",
    "Revisar lista de la tarde",
    "Confirmar indicaciones con el equipo",
  ],
  ["Pendiente", "Revisado", "Completado"],
);
board(
  "mensajes",
  "both",
  personal,
  "Mensajes de práctica",
  "Prepara y revisa mensajes de ejemplo para una consulta.",
  "messages-square",
  [
    "Quisiera revisar mi próxima cita",
    "Tengo una duda sobre mis indicaciones",
    "Quiero confirmar qué documentos llevar",
  ],
  ["Borrador", "Listo para compartir", "Resuelto"],
);
board(
  "navegacion",
  "pro",
  clinic,
  "Navegación de casos",
  "Sigue las etapas administrativas de un caso hasta la cita.",
  "panels-top-left",
  [
    "Confirmar unidad de atención",
    "Coordinar informe pendiente",
    "Organizar cita de revisión",
  ],
  ["Por coordinar", "En seguimiento", "Resuelto"],
);
board(
  "comite",
  "pro",
  clinic,
  "Comité y hospital",
  "Prepara una sesión, registra una revisión y da seguimiento al acuerdo.",
  "building-2",
  [
    "Presentar caso en comité",
    "Revisar informes con el servicio",
    "Revisar plan de alta",
    "Coordinar seguimiento hospitalario",
  ],
  ["Propuesto", "Revisado", "Seguimiento acordado"],
);
board(
  "registro",
  "pro",
  clinic,
  "Registro y revisión",
  "Completa las etapas de revisión de un registro de ejemplo.",
  "clipboard-list",
  [
    "Capturar visita de ejemplo",
    "Revisar datos del episodio",
    "Verificar los permisos",
  ],
  ["Por registrar", "Registrado", "Validado"],
);
board(
  "protocolo",
  "pro",
  community,
  "Investigación y LAION",
  "Organiza propuestas y la preparación de un protocolo multicéntrico.",
  "flask-conical",
  [
    "Definir pregunta de investigación",
    "Revisar diseño y población",
    "Preparar revisión ética",
    "Proponer colaboración regional",
  ],
  ["Propuesta", "En revisión", "Lista para presentar"],
);
board(
  "congresos",
  "pro",
  community,
  "Mis congresos",
  "Prepara un resumen y organiza tu asistencia a reuniones científicas.",
  "calendar-days",
  [
    "Consultar convocatoria de ASCO",
    "Revisar calendario de ESMO",
    "Preparar resumen para SMeO",
    "Revisar inscripción de AACR",
  ],
  ["Por revisar", "En preparación", "Revisado"],
);
board(
  "perfil",
  "pro",
  work,
  "Perfil y currículum",
  "Organiza las secciones de un perfil profesional de ejemplo.",
  "contact",
  [
    "Formación académica",
    "Certificaciones",
    "Publicaciones",
    "Participación en ensayos",
  ],
  ["Pendiente", "Preparada", "Revisada"],
);
board(
  "seguros",
  "pro",
  work,
  "Aseguradoras y trámites",
  "Revisa el avance de un trámite simulado de cobertura.",
  "shield-check",
  [
    "Revisar cobertura",
    "Preparar documentación",
    "Verificar autorización",
    "Revisar comprobantes",
  ],
  ["Pendiente", "En revisión", "Resuelto"],
);
board(
  "calidad",
  "both",
  work,
  "Mejoras y seguimiento",
  "Organiza propuestas para mejorar la experiencia de atención.",
  "list-checks",
  [
    "Accesibilidad de la consulta",
    "Claridad de las indicaciones",
    "Orientación al llegar",
    "Privacidad en recepción",
  ],
  ["Propuesta", "En revisión", "Completada"],
);
board(
  "aportes",
  "both",
  community,
  "Donaciones y ayuda mutua",
  "Organiza un ofrecimiento de ayuda antes de contactar una institución.",
  "hand-heart",
  [
    "Coordinar transporte",
    "Apoyar con alimentos",
    "Consultar necesidades del albergue",
    "Consultar recepción de insumos",
  ],
  ["Idea", "Por confirmar", "Coordinado"],
);
checklist(
  "consulta",
  "both",
  clinic,
  "Preparar la consulta",
  "Elige qué revisar en tu próxima cita e imprime la selección.",
  "stethoscope",
  [],
);
checklist(
  "oncoguia",
  "pac",
  personal,
  "Mi ruta de atención",
  "Recorre los primeros pasos desde la orientación hasta el seguimiento.",
  "compass",
  [
    "Identificar mi unidad de atención",
    "Pedir una copia de mis informes",
    "Anotar preguntas para la cita",
    "Preguntar por apoyos y transporte",
    "Confirmar el siguiente contacto",
  ],
);
checklist(
  "prevencion",
  "pac",
  personal,
  "Salud y prevención",
  "Prepara temas de salud cotidiana para hablar con tu equipo.",
  "leaf",
  [
    "Preguntar por actividad física adecuada",
    "Comentar cambios en el apetito",
    "Revisar descanso y bienestar",
    "Preguntar por prevención y vacunas",
  ],
);
checklist(
  "abordaje",
  "pro",
  clinic,
  "Revisión de la consulta",
  "Revisa la integridad del encuentro antes de cerrar el caso.",
  "stethoscope",
  [
    "Confirmar el motivo de consulta",
    "Revisar antecedentes e informes",
    "Documentar las preguntas del caso",
    "Acordar el seguimiento con el equipo",
  ],
);
checklist(
  "seguridad",
  "both",
  work,
  "Privacidad y seguridad",
  "Revisa los puntos esenciales antes de compartir información.",
  "shield-check",
  [
    "Comprobar a quién va dirigido el documento",
    "Verificar el canal autorizado",
    "Limitar los datos a lo necesario",
    "Confirmar el permiso para compartir",
  ],
);
checklist(
  "grupos",
  "both",
  community,
  "Grupos y acompañamiento",
  "Prepara la búsqueda de una comunidad o grupo de apoyo.",
  "users",
  [
    "Elegir modalidad presencial o en línea",
    "Consultar si hay una persona moderadora",
    "Revisar reglas de privacidad",
    "Confirmar horarios y requisitos",
    "Consultar al hospital por grupos locales",
  ],
);
directory(
  "guias",
  "pro",
  learn,
  "Guías de práctica",
  "Consulta las colecciones de las sociedades que elaboran las guías.",
  "book-open",
  [
    ["MASCC", "Cuidados de soporte", "https://mascc.org/mascc-guidelines/"],
    [
      "ASH",
      "Hematología",
      "https://www.hematology.org/education/clinicians/guidelines-and-quality-care/clinical-practice-guidelines",
    ],
    [
      "NCCN",
      "Guías y traducciones",
      "https://www.nccn.org/global/what-we-do/clinical-guidelines-translations",
    ],
    ["ESMO", "Oncología médica", "https://www.esmo.org/guidelines"],
  ],
);
directory(
  "red",
  "pro",
  community,
  "Red médica y sociedades",
  "Encuentra asociaciones por región o área de interés.",
  "network",
  [
    ["SMeO", "México · oncología", "https://smeo.org.mx/"],
    ["AMEH", "México · hematología", "https://www.amehac.org/"],
    ["ASCO", "Internacional · oncología", "https://www.asco.org/"],
    ["ESMO", "Europa · oncología", "https://www.esmo.org/"],
    ["AACR", "Internacional · investigación", "https://www.aacr.org/"],
    ["SIOP", "Internacional · pediatría", "https://siop-online.org/"],
    [
      "SLACOM",
      "Latinoamérica · oncología",
      "https://www.uicc.org/membership/sociedad-latinoamericana-y-del-caribe-de-oncologia-medica-slacom",
    ],
  ],
);
directory(
  "instituciones",
  "both",
  community,
  "Establecimientos y apoyos",
  "Localiza fuentes institucionales de orientación en México.",
  "building-2",
  [
    [
      "IMSS-Bienestar",
      "Atención pública · México",
      "https://imssbienestar.gob.mx/",
    ],
    [
      "Casa de la Amistad",
      "Infancia · apoyos · Ciudad de México",
      "https://www.casadelaamistad.org.mx/",
    ],
    [
      "NMDP México",
      "Trasplante · orientación · México",
      "https://www.nmdpmexico.org/",
    ],
  ],
);
directory(
  "noticias",
  "both",
  learn,
  "Noticias y formación",
  "Consulta noticias científicas, cursos y formación continua en la fuente.",
  "book-open",
  [
    [
      "Instituto Nacional del Cáncer",
      "Noticias · español",
      "https://www.cancer.gov/espanol/noticias",
    ],
    [
      "ASCO Education",
      "Formación profesional · inglés",
      "https://education.asco.org/",
    ],
    ["OMS", "Salud pública · español", "https://www.who.int/es"],
    [
      "PubMed",
      "Literatura científica · buscador",
      "https://pubmed.ncbi.nlm.nih.gov/",
    ],
  ],
);
directory(
  "derechos",
  "both",
  work,
  "Derechos, planes y alcance",
  "Consulta privacidad, condiciones y el alcance de cada servicio.",
  "file-text",
  [
    [
      "Planes del servicio original",
      "ROMI · condiciones comerciales vigentes",
      "https://kind-forest-0ad32cb0f.6.azurestaticapps.net/planes.html",
    ],
    [
      "Documentos legales del original",
      "ROMI · privacidad y condiciones",
      "https://kind-forest-0ad32cb0f.6.azurestaticapps.net/legal.html",
    ],
  ],
);
module(
  "urgencias",
  "both",
  personal,
  "Ayuda urgente",
  "Encuentra el número de emergencias y prepara información para la llamada.",
  "heart-pulse",
  "emergency",
);
module(
  "hospital",
  "pro",
  clinic,
  "Hospital y camas",
  "Asigna, traslada y da de alta casos ficticios en cuatro camas.",
  "building-2",
  "hospital",
);
module(
  "resultados",
  "both",
  clinic,
  "Estudios y biomarcadores",
  "Sigue la disponibilidad de informes y revisa su propósito.",
  "microscope",
  "board",
  {
    items: [
      "Informe molecular del caso",
      "Informe de patología",
      "Informe radiológico",
      "Resultado de laboratorio",
    ],
    steps: ["Solicitado", "Disponible", "Revisado con el equipo"],
  },
);
module(
  "resumen",
  "both",
  clinic,
  "Resumen para compartir",
  "Elige las secciones del caso de práctica y descarga una copia.",
  "file-text",
  "export",
);
module(
  "proyecto",
  "pro",
  community,
  "Constructor de protocolo",
  "Redacta la pregunta, objetivos y siguiente paso de un proyecto.",
  "flask-conical",
  "protocol",
);
module(
  "finanzas",
  "pro",
  work,
  "Honorarios y sostenibilidad",
  "Calcula ingresos, costos y margen mensual con tus supuestos.",
  "circle-dollar-sign",
  "budget",
);
module(
  "calculadora",
  "pro",
  clinic,
  "Calculadoras de consulta",
  "Calcula el IMC adulto con control de unidades y rango.",
  "activity",
  "bmi",
);
module(
  "gestiontiempo",
  "pro",
  work,
  "Distribución del tiempo",
  "Calcula cómo se reparte una jornada entre consulta, documentación y formación.",
  "timer",
  "time",
);
module(
  "memoria",
  "both",
  learn,
  "Juego de memoria",
  "Encuentra seis parejas de símbolos y lleva la cuenta de tus intentos.",
  "shapes",
  "memory",
);
module(
  "contactos",
  "both",
  community,
  "Círculo de apoyo",
  "Organiza las tareas de acompañamiento y asígnalas por rol.",
  "hand-heart",
  "circle",
);
module(
  "planes",
  "both",
  work,
  "Comparador de planes",
  "Compara los modelos de acceso descritos por ROMI y consulta las condiciones vigentes.",
  "layers",
  "plans",
);
directory(
  "nutricion",
  "both",
  personal,
  "Nutrición y cuidado",
  "Encuentra material de referencia para conversar con el equipo tratante.",
  "leaf",
  [
    [
      "NCI · Nutrición en el tratamiento",
      "Información en español para pacientes",
      "https://www.cancer.gov/espanol/cancer/tratamiento/efectos-secundarios/perdida-apetito/nutricion-pdq",
    ],
    [
      "NCI · Efectos secundarios",
      "Información para preparar la consulta",
      "https://www.cancer.gov/espanol/cancer/tratamiento/efectos-secundarios",
    ],
  ],
);
directory(
  "servicios",
  "both",
  community,
  "Servicios de ROMI",
  "Continúa en el servicio original cuando necesites contactar a su comunidad.",
  "network",
  [
    [
      "Red médica e interconsulta",
      "ROMI · profesionales",
      "https://kind-forest-0ad32cb0f.6.azurestaticapps.net/#interconsulta",
    ],
    [
      "Red médica",
      "ROMI · red profesional",
      "https://kind-forest-0ad32cb0f.6.azurestaticapps.net/#red",
    ],
    [
      "LAION",
      "Investigación y colaboración",
      "https://kind-forest-0ad32cb0f.6.azurestaticapps.net/laion.html",
    ],
    [
      "Grupos",
      "Comunidad y convocatorias",
      "https://kind-forest-0ad32cb0f.6.azurestaticapps.net/grupos.html",
    ],
    [
      "HOPE",
      "Orientación sobre ensayos",
      "https://kind-forest-0ad32cb0f.6.azurestaticapps.net/hope.html",
    ],
    [
      "OncoGuía",
      "Navegación del paciente",
      "https://kind-forest-0ad32cb0f.6.azurestaticapps.net/oncoguia.html",
    ],
    [
      "Onco-Pilot",
      "Acceso del paciente al servicio original",
      "https://kind-forest-0ad32cb0f.6.azurestaticapps.net/#paciente",
    ],
    [
      "ROMI Médico",
      "Acceso profesional al servicio original",
      "https://kind-forest-0ad32cb0f.6.azurestaticapps.net/#medico",
    ],
  ],
);
module(
  "recepcion",
  "pro",
  clinic,
  "Recepción del día",
  "Consulta la jornada por fecha y estado, y abre la cita de cada caso.",
  "calendar-days",
  "reception",
);
module(
  "casos",
  "pro",
  clinic,
  "Pacientes de práctica",
  "Crea expedientes ficticios y localiza el caso que quieres revisar.",
  "users",
  "cases",
);
export { modules };

export const questions = [
  [
    "¿Dónde se confirma que un estudio sigue reclutando?",
    [
      "En el registro y con el centro responsable",
      "En un comentario en redes",
      "En la fecha de una noticia antigua",
    ],
    0,
    "El registro indica el estado y facilita los datos del centro. La sede puede confirmar disponibilidad.",
  ],
  [
    "¿Qué conviene revisar antes de usar una guía?",
    [
      "Solo el logotipo",
      "La fecha, la población y el organismo responsable",
      "El número de páginas",
    ],
    1,
    "Una guía se interpreta en el contexto de su edición y de la población para la que se elaboró.",
  ],
  [
    "¿Qué medio conviene usar para compartir un informe?",
    [
      "Un grupo público",
      "Una publicación sin nombre",
      "El canal acordado con el equipo y la persona autorizada",
    ],
    2,
    "Comprueba el destinatario y el permiso antes de compartir información.",
  ],
  [
    "¿Dónde puedes confirmar la disponibilidad de un apoyo?",
    [
      "En la institución responsable",
      "En un cartel sin fecha",
      "En el número de veces compartido",
    ],
    0,
    "La institución informa de los requisitos y la disponibilidad actuales.",
  ],
];
