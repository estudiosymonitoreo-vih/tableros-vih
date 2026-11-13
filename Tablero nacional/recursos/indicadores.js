// Autor: Ariel Adaszko
"use strict";
// Correspondencia literal del CASE de Looker Studio provisto por la persona usuaria.
window.SVIH_ETIQUETAS_INDICADORES = Object.freeze({
  N_TARV: "N° de personas en tratamiento antirretroviral (TARV)",
  N_TARV_criterio_OMS: "N° de personas en TARV (criterio OMS)",
  N_prep: "N° de personas en PrEP",
  Porc_caducados: "% de personas en TARV tratamientos que ya deberían haber retirado nuevamente",
  N_instituciones_disp_TARV: "N° de instituciones que dispensan TARV",
  Prop_TARV_1_mes: "% de personas con dispensa de TARV por un mes",
  Prop_TARV_2_mes: "% de personas con dispensa de TARV por 2 meses",
  Prop_TARV_3_mas: "% de personas con última dispensa por 3 meses o más",
  Prop_notificados: "% de personas casos abiertos en el SNVS",
  Prop_caso_confirmado: "% de personas con casos confirmados en el SNVS",
  revincular: "N° de personas a revincular",
  Prop_a_revincular: "% de personas a revincular",
  Prop_indetectables: "% de personas con carga viral indetectable (supresión viral)",
  Prop_con_info_cv: "% de personas con información de carga viral",
  Prop_DTG_tto: "% de personas > 14 años en tratamiento con Dolutegravir (DTG)",
  Prop_DRV800_tto: "% de personas > 14 años en tratamiento con Darunavir 800 mg",
  Prop_EFV_tto: "% de personas > 14 años en tratamiento con Efavirenz",
  Prop_RAL_tto: "% de personas > 14 años en tratamiento con Raltegravir",
  Prop_AZT_tto: "% de personas > 14 años en tratamiento con AZT",
  Prop_NVP_tto: "% de personas > 14 años en tratamiento con Nevirapina",
  Prop_biterapia: "% de personas en biterapia",
  Porc_tto_1: "% de personas > 14 años con esquema de primera línea",
  Porc_tto_2: "% de personas > 14 años con esquema de segunda línea",
  Porc_tto_3: "% de personas > 14 años con esquema de tercera línea",
  Porc_recomendado: "% de personas > 14 años con esquema de primera elección",
  Porc_alternativo: "% de personas > 14 años con esquema alternativo",
  Porc_no_recomendado: "% de personas > 14 años con esquema no recomendado"
});

// Mismo criterio visual en Principal y Laboratorio: celeste desde 70%,
// transición continua y naranja intenso en 40% o menos, sin cambiar el valor.
window.colorInformacionCargaViralSVIH = valor => {
  const avance = Number.isFinite(valor) ? Math.max(0, Math.min(1, (70 - valor) / 30)) : 0;
  const inicio = [158, 217, 250], fin = [255, 140, 0];
  return `rgb(${inicio.map((canal, i) => Math.round(canal + avance * (fin[i] - canal))).join(', ')})`;
};
