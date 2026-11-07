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
