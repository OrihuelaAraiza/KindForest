# Revisión del sitio público de ROMI y primera implementación de KindForest

**18 de noviembre de 2026.** La portada se identifica como ROMI Clinical Intelligence. Se obtuvo una respuesta HTTP 200 y se revisaron el documento de entrada, su navegación, las once páginas HTML enlazadas desde el menú, el catálogo público de apoyos y las cabeceras de la portada. El alcance es la experiencia publicada que llega al navegador. Los datos de pacientes, las cuentas, los permisos efectivos del servidor, la facturación y la operación clínica quedan sin verificar. [Sitio de referencia](https://kind-forest-0ad32cb0f.6.azurestaticapps.net/)

## Qué ofrece el sitio

| Recorrido | Elementos observados | Cobertura en KindForest |
| --- | --- | --- |
| Práctica clínica | Médico, Interconsulta y Red médica. El cliente incluye interfaz para expedientes, agenda y agentes. | Lista imprimible para preparar una interconsulta. Expediente, agenda, red y agentes pendientes. |
| Conocimiento profesional | LAION, bienestar, congresos, guías y sociedades. | Biblioteca con búsqueda, categorías y enlaces a instituciones. Quedan pendientes la red de investigación y el calendario por fechas. |
| Pacientes y cuidadores | Onco-Pilot, HOPE y OncoGuía. HOPE explica la investigación clínica y cómo buscar estudios. | Preparación de cita, información educativa y búsqueda de estudios en el registro externo. El seguimiento individual, los recordatorios y los recorridos guiados quedan pendientes. |
| Apoyo práctico | Apoyos y Grupos. El directorio de apoyos distingue fuentes y fechas. Grupos ofrece búsqueda por localidad. | Tres referencias de México y material para quienes cuidan. El resto del directorio, los grupos y las inscripciones quedan pendientes. |
| Comercial y legal | Planes, invitaciones y documentos de uso y privacidad. La página legal se presenta como borrador para revisión jurídica. | Aviso específico de privacidad y alcance del atlas estático. La contratación y los acuerdos de tratamiento de datos quedan fuera de esta primera entrega. |

## Hallazgos y decisiones

| Área | Evidencia pública | Consecuencia y respuesta |
| --- | --- | --- |
| Entrada y estructura | La portada reúne enlaces clínicos, académicos, personales y comerciales. El HTML inicial contiene un elemento principal vacío que rellena JavaScript. | A un visitante nuevo le cuesta anticipar qué tarea corresponde a su recorrido. KindForest abre con dos opciones de público, un objetivo por vista y una biblioteca filtrable. El HTML incluye enlaces a fuentes para navegadores sin JavaScript. |
| Peso y caché | El cuerpo HTML de la portada mide 1 855 530 bytes. Un solo bloque de JavaScript embebido suma aproximadamente 1,74 millones de caracteres. Hay dos declaraciones de manifiesto. | Cambiar una función exige recargar el documento que la contiene. El atlas separa HTML, estilos, catálogo, lógica e imagen. La portada y sus recursos locales iniciales suman unos 137 kB antes de compresión. Las cifras comparan tamaños de archivo de productos de distinto alcance, no tiempos de carga. |
| Seguridad del navegador | La portada entrega HSTS, protección contra marcos, una política de referente restrictiva y protección contra detección de tipos. Su CSP permite JavaScript y estilos en línea, y conexiones a un comodín de Azure. | Se conservaron controles equivalentes en la configuración de alojamiento. El cliente nuevo usa archivos propios e inserta los textos mediante el DOM. La CSP bloquea conexiones de datos y scripts en línea. Las fuentes externas se abren por decisión del visitante. Los encabezados del clon deberán comprobarse en el alojamiento elegido. |
| Privacidad | La aplicación pública incluye funciones de agenda, expedientes, IA y registro. El cliente también usa almacenamiento web, por ejemplo para preferencias. La inspección pública no establece qué protege cada cuenta ni qué guarda el servidor. | Los recorridos implementados funcionan sin datos clínicos ni identificadores personales. Búsquedas, recursos elegidos y casillas viven en memoria y se borran al recargar. Al abrir ClinicalTrials.gov se envían al registro el tema y los filtros mostrados. |
| Calidad de información | El portal distingue directorios, enlaces directos y búsquedas, y pide confirmar vigencia. La inscripción en estudios y la disponibilidad de apoyos cambian. | Las fichas identifican la institución, explican qué revisar y enlazan a la fuente. El atlas no calcula elegibilidad ni promete plazas, prestaciones o fechas. La vigencia de todos los destinos externos no se verificó individualmente. |
| Accesibilidad | El portal distingue recorridos y algunas páginas ofrecen aumentar el texto. No se realizó una evaluación WCAG integral del original. | El atlas añade enlace para saltar al contenido, controles etiquetados, foco visible, diálogos operables con Escape y retorno de foco. Conserva la selección al cambiar de recorrido y ofrece impresión con únicamente los puntos elegidos. |

## Verificación local

- Chromium a 320, 390 y 1280 px. Se comprobó navegación entre públicos, historial, búsqueda sin acentos, categorías, resultados vacíos, alta y baja de una ficha y pérdida deliberada de la selección al recargar.
- Se verificaron la URL preparada para ensayos, la ausencia de solicitudes a terceros durante las interacciones locales y la ausencia de escrituras en almacenamiento local o de sesión.
- Se generó un PDF con una sola pregunta seleccionada y se comprobó su texto. El documento contenía el título, el nombre de la lista y la pregunta marcada.
- Axe-core 4.10.3 en Chromium, a 390 px, sobre la portada profesional, la vista de pacientes, la ficha de ensayos y la lista de preparación. Las reglas automáticas WCAG A/AA 2.0 y 2.1 aplicadas no notificaron infracciones en esos cuatro estados. Quedan pendientes una revisión manual con lector de pantalla y pruebas en Safari y Firefox.

Antes de incorporar expediente o seguimiento individual se necesitará diseñar y verificar autorización por paciente, consentimiento, auditoría de acceso, conservación y eliminación de datos, junto con revisión clínica y jurídica. La experiencia pública del original no permite deducir esas garantías.
