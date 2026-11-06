# Cartografía local

Fuente: **Natural Earth**, dominio público. Licencia y condiciones incluidas en `LICENCIA.md`.

Se descargaron los archivos siguientes mediante HTTPS con verificación TLS el 4 de noviembre de 2026:

- Divisiones: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson
- Países: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson
- Licencia: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/LICENSE.md

`provincias.geojson` conserva las geometrías de las 24 entidades con `adm0_a3 == ARG` del primer archivo. `paises.geojson` conserva Argentina, Brasil, Chile, Bolivia, Paraguay, Uruguay y Perú, y agrega las Islas Malvinas (FLK) como geometría sin atributos estadísticos, según `ADM0_A3` del segundo. Se descartaron los atributos originales; cada provincia conserva como `id` el nombre de Natural Earth para vincular sus agregados en el mapa coroplético, sin dibujar etiquetas provinciales. No se simplificaron ni redondearon las coordenadas. Estos archivos contienen únicamente cartografía pública, no datos de personas ni instituciones.

SHA-256 de los archivos originales descargados:

```text
22d0e3ad85eb3e27f17cabf8ba2d50e554fbc27a87796ff891d958185da62fb5  ne_10m_admin_1_states_provinces.geojson
6866c877d39cba9c357620878839b336d569f8c662d3cfab4cb1dbe2d39c977f  ne_110m_admin_0_countries.geojson
```

SHA-256 de las selecciones versionadas:

```text
6f1101e6b44344504eba151b9613ab15dfe6fa8950af6c4ca8fe3907e2551d59  provincias.geojson
95f3128874faeb6e09b8aeb0c34e0ab676491066dad817da57edd8f0840ccc03  paises.geojson
```

El generador integra ambas selecciones en el HTML. La visualización usa proyección Mercator, límites políticos sin etiquetas, países grises y mar azul. No utiliza servicios de mapas ni descarga teselas al abrirse. Los nombres de instituciones pertenecen a las tablas del tablero y se dibujan en una capa independiente desde un acercamiento de 4×, con control de superposición; no proceden de la cartografía.

Las Islas Malvinas se incorporaron el 6 de noviembre de 2026 desde el mismo archivo de países. Se representan en gris, sin texto, también en el minimapa. No participan de las métricas provinciales. El zoom conserva su ubicación geográfica; cuando el mapa enfoca una institución pueden quedar fuera del encuadre.

## Capas de detalle e íconos de la portada (6 de noviembre de 2026)

- `departamentos.geojson`: 525 entidades de la copia pública de cartografía del IGN difundida por CONAE, tomada de https://github.com/mgaitan/departamentos_argentina, revisión `a3b3e106ac0b16ac9531c24539e6dc662ba8add1`, archivo `departamentos-argentina.json`. Fuente de origen citada por el repositorio: https://2mp.conae.gov.ar/index.php/materialeseducativos/coberturasvectoriales/522-sig-250-del-instituto-geografico-nacional. Se excluyeron las dos geometrías de islas del Atlántico Sur de esta capa administrativa; Malvinas conserva su representación gris en la capa de países. Se conservaron únicamente nombre, provincia y asignación sanitaria de partidos bonaerenses. Esta edición contiene 134 partidos de Buenos Aires, anteriores a la separación de Lezama: no se presenta como división administrativa actualizada en 2026.
- `barrios-caba.geojson`: los 48 barrios del Gobierno de la Ciudad de Buenos Aires, copia pública de https://github.com/OpenDataCordoba/barrios, revisión `cfb3f504496eab3f668656c101a79fa8bafa3946`, archivo `caba_barrios.geojson`. El repositorio cita la fuente oficial https://data.buenosaires.gob.ar/dataset/barrios/resource/1c3d185b-fdc9-474b-b41b-9bd960a3806e. Solo conserva nombre y provincia.
- `regiones-sanitarias-ba.geojson`: 12 regiones, obtenidas por disolución de los partidos de la capa IGN según la correspondencia departamento/región del catálogo institucional del proyecto. Se comprobó una correspondencia única para los 135 partidos del catálogo. Chascomús y Lezama pertenecen a la región XI, por lo que la geometría anterior a su separación no introduce una división sanitaria artificial. No se exporta el catálogo institucional ni sus coordenadas; solo la geometría agrupada y el identificador romano de región. Este archivo se usa para el ícono de la portada.

Preparación visual con Mapshaper: Douglas-Peucker, conservación de entidades, intervalo de 25 metros para departamentos (coordenadas a cinco decimales), 2 metros para barrios (seis decimales) y 150 metros para el ícono regional (cinco decimales). Los límites no se usan para asignar personas a territorios ni calcular indicadores. `LICENCIA.md` documenta Natural Earth; las capas adicionales conservan las referencias a sus organismos de origen y copias públicas indicadas arriba.

SHA-256 de las capas preparadas:

```text
fb9f2dbcbf3c09f023f5ecf600f4829d4a28686e0641a367066da4e7ae2b6246  departamentos.geojson
5ac9d27d026d9e04952ca08aaf93f93efb784fb794135779fb17111b4e21df28  barrios-caba.geojson
1b9c6fc483cdb7355890afa0a1be30b3d44be9343504eb801ca07bcdd3057464  regiones-sanitarias-ba.geojson
```

La capa de polígonos oficiales de localidades bonaerenses está pendiente. No se usan polígonos de barrios fuera de CABA ni se convierten centroides de localidades en supuestos límites. El lector admite `localidades-ba.geojson` cuando se incorpore una capa verificada de Polygon/MultiPolygon; rechaza capas de puntos. Las fuentes Georef e IDEBA no fueron accesibles por la política de red del entorno de desarrollo; se guardó una propuesta de acceso para revisión/publicación del entorno.
