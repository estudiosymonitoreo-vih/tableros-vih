// Autor: Ariel Adaszko
"use strict";
// Un único contrato de unidades para mapa, tarjeta nacional y barras.
window.SVIH_COMPARATIVO = Object.freeze([
  ["N_TARV","N° de personas en TARV","Cantidad de personas en TARV","N_TARV","numero",1],
  ["Porc_en_TARV","% de personas en TARV por provincia de atención","% de personas en TARV por jurisdicción de atención","Porc_en_TARV","porcentaje",1],
  ["Prop_residentes","% de personas en TARV por residencia","% de personas en TARV por provincia de residencia","Prop_residentes","porcentaje",1],
  ["N_TARV_criterio_OMS","N° de personas en TARV criterio OMS","Cantidad de personas en TARV (criterio OMS)","N_TARV_criterio_OMS","numero",1],
  ["Variación_TARV","Variación interanual personas en TARV","Variación interanual de la cantidad de personas en TARV","Variación_TARV","porcentaje",1],
  ["N_instituciones_disp_TARV","N° de instituciones que dispensan TARV","Cantidad de instituciones que dispensan TARV","N_instituciones_disp_TARV","numero",1],
  ["Prop_notificados","% de personas en TARV notificadas en el SNVS","% de personas en TARV notificadas en el SNVS","Prop_notificados","porcentaje",1],
  ["Prop_caso_confirmado","% de personas en TARV con caso confirmado","% de personas en TARV con caso de VIH confirmado en el SNVS","Prop_caso_confirmado","porcentaje",1],
  ["revincular","N° de personas a revincular al TARV","Cantidad de personas que retiraron TARV el último año y que deben ser revinculadas","revincular","numero",1],
  ["Prop_indetectables","% de personas en TARV indetectables","% de personas en TARV con carga viral indetectable el último año","Prop_indetectables","porcentaje",1],
  ["Casos_2024","N° de nuevos casos de VIH 2024","Nuevos casos de VIH en 2024 por provincia de residencia","Casos_2024","numero",1],
  ["Porc_casos","% de nuevos casos de VIH 2024","% de nuevos casos de VIH en 2024 por provincia de residencia","Porc_casos","porcentaje",100],
  ["Tasa_2024","Tasa de VIH por 100 mil 2024","Tasa de VIH por 100 mil habitantes 2024 por provincia de residencia","Tasa_2024","tasa",1],
  ["Dx_tardio_2023_2024","% de diagnóstico tardío de VIH 2023/24","% de personas con diagnóstico tardío de VIH 2023-2024 por provincia de residencia","P_dx_tardio","porcentaje",1],
  ["Enf_avanz_2023_2024","% de enfermedad avanzada al diagnóstico 2023/24","% de personas con enfermedad avanzada al momento del diagnóstico 2023-2024","P_EA_al_dx","porcentaje",1],
  ["Mortalidad_2023","Tasa de mortalidad por sida 2023","Tasa de mortalidad por sida por 100 mil habitantes 2023","Mortalidad_2023","tasa",1],
  ["Sifilis_2024","Tasa de sífilis por 100 mil 2024","Tasa de sífilis por 100 mil habitantes en 2024","Sifilis_2024","tasa",1],
  ["PreP","Personas en PrEP","Cantidad de personas en PrEP por provincia de retiro","N_prep","numero",1]
].map(([id,etiqueta,titulo,campo,tipo,escala]) => Object.freeze({id,etiqueta,titulo,campo,tipo,escala})));
window.valorComparativoSVIH = (fila, indicador) => Number.isFinite(fila?.[indicador.campo]) ? fila[indicador.campo] * indicador.escala : null;
