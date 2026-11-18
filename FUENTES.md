# Recursos del atlas

Todos los recursos de terceros se descargaron una vez y se sirven desde el mismo dominio. La navegación no consulta ningún CDN ni servicio externo, y el atlas sigue funcionando sin conexión.

## Identidad visual: «Atlas vivo»

La identidad combina un atlas científico ilustrado del siglo XIX con la microscopía de fluorescencia actual. El tema claro evoca una lámina teñida sobre papel y el tema oscuro, la fluorescencia sobre un portaobjetos negro.

| Elemento | Decisión |
| --- | --- |
| Marca | Símbolo propio (`docs/media/mark.svg`): una célula cuyo núcleo es una hoja, el «Kind» y el «Forest» del nombre. De él se generan el favicon y los iconos de la aplicación. |
| Color | Verde bosque `#0E3B2E`, rosa eosina `#FF4F8B`, papel `#F1EBDF` y negro de laboratorio. Cada área de trabajo lleva el color de una tinción histológica y lo conserva en pestañas, tarjetas, ventanas y búsqueda. |
| Tipografía | Fraunces (titulares, con el eje SOFT que suaviza la letra al pasar el cursor), Instrument Sans (texto) y Martian Mono (etiquetas de lámina y números de catálogo). |
| Sistema | Láminas numeradas (Lám. 0–IV), números de catálogo KF-001 a KF-050 en las herramientas y B-01 a B-15 en la biblioteca, tarjetas con una esquina recta como etiquetas de portaobjetos y grano de papel. |

## Imágenes

| Imagen | Uso | Autoría y licencia |
| --- | --- | --- |
| Células de cáncer de colon | Galería y alternativa del hero sin WebGL | Lorna McInroy · Wellcome Collection · [CC BY 4.0](https://wellcomecollection.org/works/h3ms2c2z) |
| Esferoide de células de cáncer de mama (SEM) | Galería | Izzat Suffian, David McCarthy y Khuloud T. Al-Jamal · Wellcome Collection · [CC BY 4.0](https://wellcomecollection.org/works/bx4777dc) |
| Vellosidades del intestino delgado humano | Galería | S. Schuller · Wellcome Collection · [CC BY 4.0](https://wellcomecollection.org/works/sx6suz9z) |
| Célula de cáncer de mama | Galería | Lorna McInroy · Wellcome Collection · [CC BY 4.0](https://wellcomecollection.org/works/eysuseg6) |
| Células humanas en mitosis | Galería | David Root, conjunto de datos de scikit-image · [CC0](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.human_mitosis) |
| *Cellular pathology*, Rudolf Virchow (1860) | Galería | Wellcome Collection · [dominio público](https://wellcomecollection.org/works/qxb7wksn) |
| Organismos unicelulares y pluricelulares, grabado de Edmund Evans según Tuffen West | Galería | Wellcome Collection · [dominio público](https://wellcomecollection.org/works/pgy2q48k) |
| Treinta y seis objetos microscópicos, grabado de John Scott | Galería | Wellcome Collection · [dominio público](https://wellcomecollection.org/works/ysc6kh9j) |
| Fronda de helecho, impresión natural de Henry Bradbury (c. 1860) | Decoración de la ficha de preparación | Wellcome Collection · [dominio público](https://wellcomecollection.org/works/ww99tar2) |

Las imágenes de Wellcome se descargaron del servicio IIIF de la colección y se redujeron y convirtieron a WebP. Los pies de foto resumen el título publicado por la fuente. El tejido animado del hero es una simulación generativa propia y la interfaz lo indica: no es una imagen clínica.

## Tipografías, iconos y bibliotecas

| Recurso | Uso | Procedencia y condiciones |
| --- | --- | --- |
| Fraunces (Fontsource 5.3.0) | Titulares, cifras y marca. Instancia propia con `fontTools`: tamaño óptico 120, peso 300–600, eje SOFT y WONK activo. | [Fraunces](https://github.com/undercasetype/Fraunces) · [SIL Open Font License](docs/vendor/FRAUNCES-LICENSE.txt) |
| Instrument Sans (Fontsource 5.3.0) | Texto e interfaz. | [Instrument Sans](https://github.com/Instrument/instrument-sans) · [SIL Open Font License](docs/vendor/INSTRUMENT-SANS-LICENSE.txt) |
| Martian Mono (Fontsource 5.3.0) | Etiquetas, números de catálogo y lecturas del hero. | [Martian Mono](https://github.com/evilmartians/mono) · [SIL Open Font License](docs/vendor/MARTIAN-MONO-LICENSE.txt) |
| Phosphor Icons 2.1.1 | Iconos duotono de las herramientas, tintados con el color de su área mediante máscara CSS. Los iconos de la interfaz se generan en `docs/glyph-data.js` con `tools/build_icons.py`. | [Phosphor](https://phosphoricons.com/) · [MIT](docs/vendor/PHOSPHOR-LICENSE.txt) |
| GSAP 3.15.1 con ScrollTrigger y SplitText | Enfoque inicial del hero, titular letra a letra, revelado de láminas, parallax de la galería e inclinación de la cinta según la velocidad del scroll. | [GSAP](https://gsap.com/) · [Licencia estándar sin coste](docs/vendor/GSAP-LICENSE.txt) |
| OGL 1.0.11 | WebGL del hero. Se empaquetan `Renderer`, `Program`, `Mesh` y `Triangle` con esbuild 0.24.2. | [OGL](https://github.com/oframe/ogl) · [Unlicense](docs/vendor/OGL-LICENSE.txt) |
| Fuse.js 7.1.0, distribución básica ESM | Búsqueda aproximada local en la paleta y la mesa. | [Fuse.js](https://www.fusejs.io/) · [Licencia del paquete](docs/vendor/FUSE-LICENSE.txt) |
| Chart.js 4.4.9 | Gráfico de actividad de la sesión, cargado al abrir indicadores. | [Chart.js](https://www.chartjs.org/) · [Licencia MIT](docs/vendor/CHART-LICENSE.txt) · [Dependencia de color](docs/vendor/KURKLE-LICENSE.txt) |

## Datos

| Recurso | Uso | Procedencia y condiciones |
| --- | --- | --- |
| ROMI Clinical Intelligence, directorios públicos | Nombres de instituciones, áreas, sedes y fechas de referencia consultados el 18 de noviembre de 2026. | [Guías](https://kind-forest-0ad32cb0f.6.azurestaticapps.net/guias.html) · [Sociedades](https://kind-forest-0ad32cb0f.6.azurestaticapps.net/sociedades.html) · [Apoyos](https://kind-forest-0ad32cb0f.6.azurestaticapps.net/apoyos.html) · [Congresos](https://kind-forest-0ad32cb0f.6.azurestaticapps.net/congresos.html) |

Los enlaces de búsqueda se distinguen de los enlaces directos. Cada institución confirma vigencia, disponibilidad, fechas y requisitos.
