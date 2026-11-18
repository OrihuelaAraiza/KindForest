# Revisión del sitio público de ROMI y primera implementación de KindForest

**18 de noviembre de 2026.** La portada se identifica como ROMI Clinical Intelligence. Se obtuvo una respuesta HTTP 200 y se revisaron el documento de entrada, su navegación, las once páginas HTML enlazadas desde el menú, el catálogo público de apoyos y las cabeceras de la portada. El alcance es la experiencia publicada que llega al navegador. Los datos de pacientes, las cuentas, los permisos efectivos del servidor, la facturación y la operación clínica quedan sin verificar. [Sitio de referencia](https://kind-forest-0ad32cb0f.6.azurestaticapps.net/)

## Segunda exploración y cobertura actual

Se volvió a cargar la portada y se recorrieron el selector de público, la bienvenida de Onco-Pilot y su vista de ejemplo en español. Esta última ofrece síntomas, medicinas, confirmación o cambio de cita, lectura en voz alta y cuidado diario. Las entradas profesionales incluyen agenda, recepción, expediente, interconsulta, red, tablero de alertas, agentes, gestión y comunidad. Algunas funciones se identificaron en la navegación declarada por el cliente; no se accedió a cuentas ajenas ni se verificó el funcionamiento del servidor.

| Área observada | Implementación actual en KindForest | Límite de la adaptación |
| --- | --- | --- |
| Agenda, recepción, expediente y hospital | Casos ficticios, altas en el listado, notas, gestión por hora y estado, cambio de cita, calendario ICS, asignación de cama, traslado y alta. | Estado en memoria. La sesión de práctica no es un expediente clínico institucional. |
| Interconsulta, alertas, seguimiento, comités y autorizaciones | Borrador descargable, tableros por caso, reportes del diario con revisión y resumen exportable por sección. | Las acciones no contactan a especialistas y los permisos de práctica no sustituyen autorización de un servidor. |
| Onco-Pilot, guías de cuidados y orientación | Diario, documentos, recordatorios durante la sesión, tareas de acompañamiento, preparación de cita, recursos de nutrición, llamada a emergencias y lectura local cuando existe una voz disponible. | Sin monitorización, avisos fuera de la sesión, transcripción de entrevistas ni interpretación clínica automatizada. |
| Investigación, congresos y red | Constructor de protocolo, consulta de ensayos, 14 congresos, 17 guías, 34 sociedades y 22 fichas de apoyo, filtros y favoritos. | Datos de referencia fechados. Las colaboraciones, inscripciones, mensajería y directorios vivos permanecen en los servicios externos. |
| Administración, aprendizaje y bienestar | Presupuestos, honorarios y costos estimados, distribución del tiempo, indicadores de sesión, IMC de práctica, aula, juego de memoria, pausas y actividades. | El comparador de planes es informativo. La facturación, cobros, donaciones y acceso profesional verificado requieren servicios institucionales. |
| Agente, acceso y entrega | Búsqueda local aproximada, lectura accesible, enlace del recorrido, instalación web y uso sin conexión tras la primera carga completa. | La búsqueda no es IA clínica. Quedan fuera las cuentas biométricas, sincronización, IA remota, recetas firmadas, recomendaciones de tratamiento y la paridad multilingüe del original. |

Se probaron los recorridos de los dos públicos, apertura y contenido de todas las herramientas, búsqueda, selección, seguimiento entre módulos, cálculos monetarios, exportación y reapertura sin conexión. En siete vistas de Chromium a 390 px no se detectaron infracciones con las reglas automáticas WCAG A/AA 2.0 y 2.1 de axe-core. Esto no constituye una certificación de accesibilidad o de seguridad clínica.

## Tercera entrega: interfaz

Se rehízo la capa visual sin cambiar el alcance de los datos ni las garantías de privacidad. Las dos hojas de estilo se unificaron en `styles.css`, con variables de color para tema claro y oscuro y un tono por área de trabajo, compartido por pestañas, tarjetas y ventanas. Los titulares usan Instrument Serif servida desde el mismo dominio. La portada incluye una búsqueda destacada, cifras calculadas a partir de los datos y un visor de la micrografía con retícula y barrido animados. La mesa de herramientas destaca seis herramientas en una cuadrícula con dos tarjetas anchas.

| Cambio | Verificación |
| --- | --- |
| Paleta de búsqueda (`Ctrl K`, `⌘ K`, `/`) sobre herramientas, biblioteca, directorios y acciones | Prueba de navegador: atajos, ranking literal, flechas con vuelta, apertura filtrada del directorio, cambio de público y estado sin resultados. |
| Tema según el sistema, aplicado antes del primer pintado, con cambio manual por sesión | Prueba con esquema oscuro emulado y cambio a claro desde **Lectura y acceso**. Almacenamiento local y de sesión en 0. |
| Marcador en cada tarjeta de la biblioteca, contador y aviso visual | Prueba de alta y baja desde la tarjeta y desde la ficha, con estado sincronizado. |
| Movimiento: entrada escalonada, revelado al desplazarse, retícula y barrido | Se desactiva con `prefers-reduced-motion` o con **Reducir movimiento**. Sin animación, el contenido es visible desde el inicio. |
| Ventanas como hojas inferiores en móvil | Sin desbordamiento horizontal a 320 px en las 77 aperturas de herramientas de la prueba existente. |

axe-core 4.10.3 en Chromium no notificó infracciones de las reglas automáticas WCAG A/AA 2.0 y 2.1. Se revisaron ambos públicos, la paleta, una herramienta y la selección, en tema claro y oscuro, a 390 y 1280 px (`tests/test_accessibility.py`). La auditoría señaló un destello de tema claro al cargar con sistema oscuro y transiciones que ignoraban la preferencia de movimiento reducido; ambos se corrigieron. Quedan pendientes las pruebas en Safari y Firefox y una revisión manual con lector de pantalla.

## Primera entrega (registro histórico)

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
