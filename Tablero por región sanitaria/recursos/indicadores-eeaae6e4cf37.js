// Autor: Ariel Adaszko
"use strict";

window.porcentajePerdidaSeguimientoSVIH = ({N_TARV, perdidos_90_179, perdidos_180_mas}) => {
  if (![N_TARV, perdidos_90_179, perdidos_180_mas].every(Number.isFinite)) return null;
  const perdidos = perdidos_90_179 + perdidos_180_mas;
  const total = N_TARV + perdidos;
  return total > 0 ? 100 * perdidos / total : null;
};

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
  Prop_perdida_seguimiento: "% de pérdida de seguimiento último año",
  Prop_indetectables: "% de personas con carga viral indetectable (supresión viral)",
  Prop_con_info_cv: "% de personas con información de carga viral",
  Prop_CD4_menor_350: "% de personas en TARV con menos de 350 CD4",
  Prop_CD4_menor_200: "% de personas en TARV con menos de 200 CD4",
  Prop_con_info_cd4: "Cobertura de datos de CD4 en personas en TARV",
  Mediana_edad_tarv: "Mediana de edad actual por género en personas en TARV",
  Prop_genero_tarv: "% de personas en TARV por género",
  Prop_TARV_hasta_24: "% de personas en TARV de hasta 24 años",
  Prop_TARV_55_mas: "% de personas en TARV de 55 años o más",
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

window.SVIH_INDICADORES_TARV = Object.freeze([
  "Prop_CD4_menor_350","Prop_CD4_menor_200","Prop_con_info_cd4","Mediana_edad_tarv",
  "Prop_genero_tarv","Prop_TARV_hasta_24","Prop_TARV_55_mas"
]);
window.SVIH_GENEROS_TARV = Object.freeze([
  ["varones","Varones","♂"],["mujeres","Mujeres","♀"],
  ["mujeres_trans","Mujeres trans","♀ᵀ"],["varones_trans","Varones trans","♂ᵀ"]
]);
window.esIndicadorGeneroSVIH = id => id === "Prop_genero_tarv" || id === "Mediana_edad_tarv";
window.opcionesMapaGeneroSVIH = id => window.SVIH_GENEROS_TARV.map(([clave,genero])=>({
  id:id+"_"+clave, etiqueta:window.SVIH_ETIQUETAS_INDICADORES[id]+" · "+genero
}));
window.valoresGeneroSVIH = (fila, id) => window.SVIH_GENEROS_TARV.map(([clave,genero,icono]) => ({
  genero,icono,valor:fila?.[id+"_"+clave]??null
}));
window.esPorcentajeIndicadorSVIH = (id,etiqueta) => id === "Prop_con_info_cd4" || String(etiqueta).startsWith("%");

const titulosDefinicionesSVIH = {
  N_TARV: "N° personas en TARV",
  N_TARV_criterio_OMS: "N° personas en TARV criterio OMS",
  N_prep: "N° de personas en PreP",
  PreP: "N° de personas en PreP",
  Porc_prep: ["% del total provincial de personas en PrEP", "% de eprsonas en PreP por provincia de entrega"],
  N_instituciones_disp_TARV: "N° instituciones que distribuyen TARV",
  Porc_en_TARV: "% de personas en TARV por provincia de atención",
  Prop_residentes: "% de personas en TARV por provincia de residencia",
  Variación_TARV: "Variación interanual en el número de personas en TARV",
  Prop_indetectables: "% de personas en TARV con carga viral indetectables",
  Prop_con_info_cv: "% con información de carga viral",
  Prop_DTG_tto: "% de personas en TARV con DTG en último tto",
  Prop_biterapia: "% de personas en TARV con biterapia",
  Porc_recomendado: "% personas en TARV >=15 con tto de primera elección para la DRVIHyT.",
  Prop_perdida_seguimiento: "Proporción de pérdida de seguimiento de personas que retiraron TARV el último año"
};

const textosDefinicionesSVIH = {
  Porc_caducados: ["Entre las personas en TARV al corte, porcentaje cuya medicación de la última dispensa ya se venció.", "El indicador depende de la oportunidad de carga de las dispensas."],
  Prop_notificados: ["Porcentaje de personas en TARV al corte con notificación en el Sistema Nacional de Vigilancia de la Salud (SNVS)."],
  Prop_caso_confirmado: ["Porcentaje de personas en TARV al corte con caso de VIH confirmado en el SNVS."],
  revincular: ["Personas fuera de TARV, con retiro en los últimos 12 meses y al menos 90 días desde el vencimiento de la última dispensa.", "Se consideran personas con estado VIH, sin fallecimiento ni cobertura social registrados y sin PUCO en el último remito VIH."],
  Prop_a_revincular: ["Personas a revincular divididas por las personas que estaban en TARV hace 12 meses, por 100."],
  Porc_alternativo: ["Entre las personas de 15 años o más en primera línea de TARV, porcentaje con un esquema alternativo según la clasificación de la DRVIHyT."],
  Porc_no_recomendado: ["Entre las personas de 15 años o más en primera línea de TARV, porcentaje con un esquema no recomendado según la clasificación de la DRVIHyT."],
  Casos_2024: ["Número de nuevos diagnósticos de VIH notificados al SNVS en 2024."],
  Casos_VIH_2025: ["Número de nuevos diagnósticos de VIH notificados al SNVS en 2025."],
  Porc_casos: ["Diagnósticos de VIH de la jurisdicción como porcentaje del total nacional de 2024."],
  Proporcion_diagnosticos_2025: ["Diagnósticos de VIH de la jurisdicción como porcentaje del total nacional de 2025."],
  Tasa_2024: ["Nuevos diagnósticos de VIH en 2024 por 100.000 habitantes."],
  Tasa_VIH_2025: ["Nuevos diagnósticos de VIH en 2025 por 100.000 habitantes."],
  Dx_tardio_2023_2024: ["Proporción de diagnósticos tardíos de VIH en 2023–2024, expresada como porcentaje."],
  Dx_tardio_2024_2025: ["Proporción de diagnósticos tardíos de VIH en 2024–2025, expresada como porcentaje.", "Se respeta la indicación de datos insuficientes de la fuente."],
  Enf_avanz_2023_2024: ["Proporción de diagnósticos de VIH en etapa avanzada en 2023–2024, expresada como porcentaje."],
  Enf_avanzada_2024_2025: ["Proporción de diagnósticos de VIH en etapa avanzada en 2024–2025, expresada como porcentaje.", "Se respeta la indicación de datos insuficientes de la fuente."],
  Mortalidad_2023: ["Defunciones por sida en 2023 por 100.000 habitantes.", "Fuente de defunciones: Dirección de Estadísticas e Información de Salud."],
  Mortalidad_sida_2024: ["Defunciones por sida en 2024 por 100.000 habitantes.", "Fuente de defunciones: Dirección de Estadísticas e Información de Salud."],
  Sifilis_2024: ["Tasa de sífilis en población general en 2024, por 100.000 habitantes."],
  Sifilis_2025: ["Tasa de sífilis en población general en 2025, por 100.000 habitantes."]
};

window.mostrarDefinicionIndicadorSVIH = (host, id, catalogo = []) => {
  id = ["Prop_genero_tarv","Mediana_edad_tarv"].find(campo=>id.startsWith(campo+"_")) || id;
  const titulos = [].concat(titulosDefinicionesSVIH[id] ?? window.SVIH_ETIQUETAS_INDICADORES[id] ?? []);
  const nombre = texto => String(texto ?? "").trim().replace(/\.$/, "");
  const fila = catalogo.find(r => titulos.some(titulo => nombre(r.INDICADOR) === nombre(titulo)));
  let [definicion, observaciones] = textosDefinicionesSVIH[id] || [fila?.["DESCRIPCIÓN"], fila?.OBSERVACIONES];
  if (!definicion && /^Prop_TARV_[123]_/.test(id)) {
    const duracion = {1:"un mes", 2:"dos meses", 3:"tres meses o más"}[id.split("_")[2]];
    definicion = `Porcentaje de personas en TARV cuya última dispensa entregó medicación para ${duracion}.`;
  } else if (!definicion && /^Porc_tto_[123]$/.test(id)) {
    const linea = {1:"primera", 2:"segunda", 3:"tercera"}[id.at(-1)];
    definicion = `Porcentaje de personas de 15 años o más clasificadas en ${linea} línea según su tratamiento antirretroviral prescripto en SVIH.`;
  } else if (!definicion && /^Prop_(DRV800|EFV|AZT|RAL|NVP|XTC)_tto$/.test(id)) {
    const farmaco = id.split("_")[1];
    definicion = `Porcentaje de personas en TARV cuyo último tratamiento prescripto incluye ${farmaco === "XTC" ? "lamivudina o emtricitabina" : farmaco}.`;
  }
  const agregar = (rotulo, texto) => {
    const parrafo = document.createElement("p"), destacado = document.createElement("strong");
    destacado.textContent = rotulo;
    if (rotulo === "Observaciones:") parrafo.className = "observaciones-indicador";
    parrafo.append(destacado, " ", texto);
    host.append(parrafo);
  };
  host.replaceChildren();
  agregar("DEFINICIÓN:", definicion || "Sin definición disponible en el catálogo.");
  if (observaciones?.trim()) agregar("Observaciones:", observaciones.trim());
  host.scrollTop = 0;
};

// Mismo criterio visual en Principal y Laboratorio: celeste desde 70%,
// transición continua y naranja intenso en 40% o menos, sin cambiar el valor.
window.colorInformacionCargaViralSVIH = valor => {
  const avance = Number.isFinite(valor) ? Math.max(0, Math.min(1, (70 - valor) / 30)) : 0;
  const inicio = [158, 217, 250], fin = [255, 140, 0];
  return `rgb(${inicio.map((canal, i) => Math.round(canal + avance * (fin[i] - canal))).join(', ')})`;
};
