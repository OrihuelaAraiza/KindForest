# KindForest · Atlas de oncología

Una adaptación independiente de los recorridos públicos de ROMI Clinical Intelligence. El atlas reúne recursos de oncología para profesionales, pacientes y cuidadores. Los textos y la ilustración se prepararon para este proyecto.

El código del sitio está en `docs/` de `main`. GitHub Pages sirve esos mismos archivos desde la raíz de la rama `gh-pages`. [Abrir el atlas](https://orihuelaaraiza.github.io/KindForest/)

Desde la raíz del repositorio, inicia el sitio con Python 3.

```sh
python3 -m http.server 8086 --bind 127.0.0.1 --directory docs
```

Abre `http://127.0.0.1:8086/` en el mismo equipo. El recorrido de pacientes tiene un enlace directo en `/?vista=pacientes`. El sitio usa módulos de JavaScript y necesita servirse por HTTP. La aplicación funciona sin instalación de paquetes, servicios médicos, cuentas ni credenciales.

- **Profesionales.** Seis fichas de guías, sociedades, congresos y bienestar, con fuente y contexto de uso. La lista de interconsulta se puede imprimir.
- **Pacientes y cuidadores.** Nueve fichas sobre preparación de consulta, ensayos y apoyos, incluidos tres recursos de México. La ficha de ensayos permite preparar una búsqueda por país y reclutamiento en ClinicalTrials.gov.
- **Mi selección.** Conserva las fichas de ambos recorridos mientras la página siga abierta. Recargar borra las selecciones y las listas. Los documentos impresos o guardados como PDF los conserva quien los genera.

El catálogo se edita en `docs/catalog.js`. Los destinos externos se abren al elegir la fuente. El documento de [auditoría pública](AUDITORIA.md) indica qué se observó, qué se implementó y qué módulos siguen pendientes.

## Verificación

Con Playwright para Python y Chromium disponibles, ejecuta:

```sh
python3 tests/test_browser.py
```

La prueba inicia su propio servidor en un puerto temporal y recorre el atlas en tres tamaños de pantalla. El directorio `docs/` contiene todos los archivos que serviría un alojamiento estático. `staticwebapp.config.json` define las cabeceras para Azure Static Web Apps; GitHub Pages y el servidor local no aplican esas cabeceras de Azure. La política de seguridad de contenido y la política de referente incluidas en el HTML se aplican también en Pages.

## Publicar una actualización

Una vez probados y subidos los cambios a `main`, publica el contenido de `docs/` en la rama de Pages. Desde la raíz del repositorio:

```sh
git fetch origin main gh-pages &&
sitio=$(git rev-parse origin/main:docs) &&
anterior=$(git rev-parse origin/gh-pages) &&
version=$(git commit-tree "$sitio" -p "$anterior" -m "Actualiza el atlas de KindForest") &&
git push origin "$version:refs/heads/gh-pages"
```

En GitHub Actions, comprueba que termine **pages build and deployment** y abre el atlas para verificar la versión publicada.
