# Cartografía del tablero epidemiológico

Los dos archivos se reutilizan, sin modificar sus geometrías, de
[estudiosymonitoreo-vih/tableros-vih](https://github.com/estudiosymonitoreo-vih/tableros-vih/tree/main/Tablero%20nacional/Cartografia).
Fuente original: **Natural Earth**, dominio público. Se conserva `LICENCIA.md`.

- `provincias.geojson`: las 24 entidades de Argentina del archivo
  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson
- `paises.geojson`: Argentina, Brasil, Chile, Bolivia, Paraguay, Uruguay y Perú,
  más la geometría de Islas Malvinas sin atributos estadísticos, del archivo
  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson

El paquete SVIH documenta la descarga original el 4 de noviembre de 2026.
No se simplificaron ni redondearon las coordenadas. Los atributos provinciales se
limitan al identificador territorial; `Ciudad de Buenos Aires` se vincula con
`CABA` en los agregados SNVS. No se usan puntos como sustituto de límites:
el círculo de CABA es únicamente una ayuda adicional para seleccionar su valor.

La visualización utiliza proyección Mercator, fondo marino claro y colores
secuenciales para los valores. Países vecinos sin métricas; provincias sin valor
en gris. El paquete integra estos recursos localmente y no consulta Google Maps,
servicios de teselas, CDN ni datos personales al abrir el mapa.

SHA-256 de los archivos reutilizados:

- `provincias.geojson`: `6f1101e6b44344504eba151b9613ab15dfe6fa8950af6c4ca8fe3907e2551d59`
- `paises.geojson`: `95f3128874faeb6e09b8aeb0c34e0ab676491066dad817da57edd8f0840ccc03`

## Vistas regionales

`territorios-regionales.geojson` conserva las provincias Natural Earth para las
regiones sin divisiones internas de Buenos Aires. Para GBA y Centro usa límites
de partidos del **IGN**, publicados por **GeoRef** (descarga nacional de
[departamentos](https://infra.datos.gob.ar/georef/departamentos.geojson)).

Se reutilizó la copia pública exacta del dump GeoRef en
[contact-outreach, commit 82647a6](https://github.com/fnattero/contact-outreach/blob/82647a62e595a2ade4b2624d122d7c6f087cdaaf/backend/src/apps/configuration/data/argentina_departamentos_georef_2026.geojson),
ya que la descarga directa no estaba disponible desde el entorno de trabajo.
SHA-256 del dump: `fc10b1dc734f3a7c274f5a39e6ae8749c4a61789a62fc0184724d6acda9d87fb`.
Se verificaron los 135 partidos de Buenos Aires y la coincidencia exacta de los
24 nombres de GBA definidos en `Funciones_análisis.Rmd`.

GBA muestra CABA y esos 24 partidos. Centro muestra Córdoba, Santa Fe, Entre Ríos
y **Buenos Aires (resto)**, unión geométrica de los otros 111 partidos. Se
conservan los polígonos (no centroides como sustituto de los límites); los puntos
interiores solo ubican los rótulos. La clasificación de La Pampa en Patagonia y
La Rioja en NOA coincide con el procesamiento.

La vista Argentina conserva las 24 jurisdicciones originales; seleccionar una
región amplía únicamente sus divisiones. La cartografía queda integrada en
`datos.js`: no se necesita conexión a un geoservicio al consultar el tablero.

Para recrear esta capa desde el mismo dump, instalar `shapely` y ejecutar
`python Script/Tablero/Cartografia/preparar_regiones.py /ruta/departamentos.geojson`.
Esto no forma parte de la generación habitual del tablero: el GeoJSON ya está
versionado y no agrega dependencias a R ni a Shiny.
