# KindForest · Atlas de oncología

Una adaptación independiente de los recorridos públicos de ROMI Clinical Intelligence. El atlas reúne recursos de oncología para profesionales, pacientes y cuidadores. Incluye una mesa de trabajo con casos ficticios y un recorrido de cuidado para pacientes.

El código del sitio está en `docs/` de `main`. GitHub Pages sirve esos mismos archivos desde la raíz de la rama `gh-pages`. [Abrir el atlas](https://orihuelaaraiza.github.io/KindForest/)

Desde la raíz del repositorio, inicia el sitio con Python 3.

```sh
python3 -m http.server 8086 --bind 127.0.0.1 --directory docs
```

Abre `http://127.0.0.1:8086/` en el mismo equipo. El recorrido de pacientes tiene un enlace directo en `/?vista=pacientes`. El sitio usa módulos de JavaScript y necesita servirse por HTTP. La aplicación funciona sin instalación de paquetes, servicios médicos, cuentas ni credenciales.

- **Profesionales.** Seis fichas de guías, sociedades, congresos y bienestar, con fuente y contexto de uso. La lista de interconsulta se puede imprimir.
- **Pacientes y cuidadores.** Nueve fichas sobre preparación de consulta, ensayos y apoyos, incluidos tres recursos de México. La ficha de ensayos permite preparar una búsqueda por país y reclutamiento en ClinicalTrials.gov.
- **Mi selección.** Conserva las fichas de ambos recorridos mientras la página siga abierta. Cada tarjeta de la biblioteca tiene su marcador y el contador de la cabecera se actualiza al momento. Recargar borra las selecciones y las listas. Los documentos impresos o guardados como PDF los conserva quien los genera.
- **Búsqueda global.** `Ctrl K`, `⌘ K` o `/` abren una paleta que busca a la vez en herramientas, biblioteca, los 87 registros de directorio y acciones rápidas. Se maneja con flechas, `Enter` y `Esc`. Las coincidencias literales se ordenan antes que las aproximadas y un registro de directorio abre su lista ya filtrada.
- **Tema y lectura.** El tema claro u oscuro sigue al sistema desde el primer pintado. En **Lectura y acceso** se puede elegir otro tema, reducir el movimiento o aumentar el texto durante la sesión. Ninguna preferencia se guarda en el navegador.

La portada calcula sus cifras a partir de los datos del recorrido elegido. La sección **Compromisos verificables** comprueba en el propio navegador que no hay datos guardados ni cookies y si la copia sin conexión está lista.

La mesa reúne 50 herramientas distintas. En **Todo** se muestran las disponibles para el público seleccionado. La agenda permite registrar llegadas, reprogramar y exportar citas en ICS. Los reportes del diario se reflejan en la bandeja de revisión y el expediente de práctica. Las notas, las tareas y los presupuestos duran una sesión. La lista y los borradores pueden descargarse cuando la herramienta lo indica.

Los directorios añaden 17 guías, 34 sociedades, 22 apoyos y 14 congresos. Las fuentes y las licencias visuales se documentan en [FUENTES.md](FUENTES.md). Las herramientas están en `docs/modules.js` y los directorios en `docs/directories.js`. El catálogo de la biblioteca se edita en `docs/catalog.js`. La paleta de búsqueda vive en `docs/palette.js` y los iconos en línea y colores por área en `docs/glyphs.js`. `docs/styles.css` reúne el sistema de diseño: variables de color para ambos temas, un tono por área de trabajo y los componentes. Los destinos externos se abren al elegir la fuente. El documento de [auditoría pública](AUDITORIA.md) indica qué se observó, qué se implementó y qué módulos siguen pendientes.

## Verificación

Con Playwright para Python y Chromium disponibles, ejecuta:

```sh
python3 tests/test_browser.py
```

La prueba inicia su propio servidor en un puerto temporal y recorre el atlas en tres tamaños de pantalla. También cubre la paleta de búsqueda, el tema, los marcadores de las tarjetas y las cifras de la portada.

La auditoría de accesibilidad usa axe-core, que no se distribuye con el sitio. Descárgalo con `npm pack axe-core@4.10.3`, extrae el paquete y ejecuta:

```sh
AXE_CORE=package/axe.min.js python3 tests/test_accessibility.py
```

Recorre ambos públicos, la paleta, una herramienta y la selección en tema claro y oscuro, a 390 y 1280 px. Sin `AXE_CORE` la prueba se omite. El directorio `docs/` contiene todos los archivos que serviría un alojamiento estático. `staticwebapp.config.json` define las cabeceras para Azure Static Web Apps; GitHub Pages y el servidor local no aplican esas cabeceras de Azure. La política de seguridad de contenido y la política de referente incluidas en el HTML se aplican también en Pages.

## Publicar una actualización

Tras editar el sitio, ejecuta `python3 tools/prepare_offline.py` e incluye el índice actualizado en el commit. El navegador conserva los archivos públicos para volver a abrir el atlas sin conexión. Una vez probados y subidos los cambios a `main`, publica el contenido de `docs/` en la rama de Pages. Desde la raíz del repositorio:

```sh
git fetch origin refs/heads/main:refs/remotes/origin/main refs/heads/gh-pages:refs/remotes/origin/gh-pages &&
sitio=$(git rev-parse origin/main:docs) &&
anterior=$(git rev-parse origin/gh-pages) &&
version=$(git commit-tree "$sitio" -p "$anterior" -m "Actualiza el atlas de KindForest") &&
git push origin "$version:refs/heads/gh-pages"
```

En GitHub Actions, comprueba que termine **pages build and deployment** y abre el atlas para verificar la versión publicada.
