// Autor: Ariel Adaszko
"use strict";
(() => {
  const datos = JSON.parse(document.getElementById("datos-tablero").textContent);
  const $ = id => document.getElementById(id);
  const formato = (v, dec = 0, escala = 1, porcentaje = false) =>
    v === null || v === undefined || !Number.isFinite(v) ? "—" :
      new Intl.NumberFormat("es-AR", {minimumFractionDigits: dec, maximumFractionDigits: dec}).format(v * escala) + (porcentaje ? "%" : "");
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = (tag, attrs) => {
    const el = document.createElementNS(svgNS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  };
  const contexto = datos.contexto_epidemiologico;
  const epidemiologia = contexto ? contexto.indicadores.map(c=>[c.campo,c.etiqueta,c.decimales,c.escala,c.porcentaje,c.serie,c.estado]) : [
    ["Casos_2024", "Nuevos diagnósticos de VIH 2024", 0, 1, false, "casos"],
    ["Tasa_2024", "Tasa de VIH por 100 mil · 2024", 1, 1, false, "tasa"],
    ["Dx_tardio_2023_2024", "Diagnóstico tardío de VIH · 2023/24", 1, 100, true],
    ["Enf_avanz_2023_2024", "Enfermedad avanzada al diagnóstico · 2023/24", 1, 100, true],
    ["Mortalidad_2023", "Mortalidad por sida por 100 mil · 2023", 1, 1, false, "mortalidad"],
    ["Sifilis_2024", "Tasa de sífilis por 100 mil · 2024", 1, 1, false, "sifilis"]
  ];
  if(contexto)$("epidemiologia").classList.add('contexto-actualizado');
  const tarjetas = [
    ["N_TARV", "Personas en TARV"], ["N_TARV_hace_1_anio", "Hace 12 meses"],
    ["Variación_TARV", "Variación interanual", 1, 1, true],
    ["N_TARV_criterio_OMS", "TARV · criterio ONUSIDA"],
    ["N_instituciones_disp_TARV", "Instituciones que dispensan TARV"],
    ["dispensa_TARV_2026", "Al menos una dispensa este año"],
    ["Anio_1er_TARV_2026", "Primera dispensa registrada este año"],
    ["N_VIH_seguimiento_2026", "Alguna prestación en 2026"],
    ["Porc_en_TARV", "Por provincia de atención", 1, 1, true],
    ["Prop_residentes", "Por provincia de residencia", 1, 1, true]
  ];
  const detalles = [
    ["Prop_indetectables", "Carga viral indetectable", 1, 1, true],
    ["revincular", "Personas que retiraron TARV los últimos 12 meses, ya no lo hacen, están vivas y no tienen otra cobertura social"],
    ["Prop_notificados", "Notificadas en SNVS", 1, 1, true],
    ["Prop_caso_confirmado", "Confirmadas en SNVS", 1, 1, true]
  ];
  function tarjeta(config, fila, provincia) {
    const [campo, titulo, dec = 0, escala = 1, porcentaje = false, serie, estado] = config;
    const cont = document.createElement("article");
    cont.className = "tarjeta" + (["Casos_2024", "Enf_avanz_2023_2024", "N_TARV", "N_instituciones_disp_TARV"].includes(campo) ? " destacado" : "");
    cont.dataset.campo = campo;
    const label = document.createElement("div"); label.className = "etiqueta"; const textoLabel=document.createElement("span");textoLabel.textContent=titulo;label.append(textoLabel);
    const valor = document.createElement("div"); valor.className = "valor"; valor.textContent = formato(fila[campo], campo==="Sifilis_2024"&&Number.isInteger(fila[campo])?0:dec, escala, porcentaje);
    if(!Number.isFinite(fila[campo])&&estado&&fila[estado]){valor.textContent=fila[estado];valor.classList.add('valor-estado');}
    cont.append(label, valor);
    const referencias = ["Tasa_2024","Dx_tardio_2023_2024","Enf_avanz_2023_2024","Mortalidad_2023","Sifilis_2024","Variación_TARV","Prop_notificados","Prop_caso_confirmado",...(contexto?contexto.indicadores.filter(c=>c.campo!=='Casos_VIH_2025'&&c.campo!=='Proporcion_diagnosticos_2025').map(c=>c.campo):[])];
    if (provincia !== "País" && referencias.includes(campo)) {
      const origen=contexto&&contexto.indicadores.some(c=>c.campo===campo)?contexto.filas:datos.general;
      const pais = origen.find(x=>x.Provincia_atencion==="País"), ref = document.createElement("span");
      ref.className="referencia-nacional";ref.textContent=`${formato(pais?.[campo],1,escala,porcentaje)} nac.`;valor.append(ref);
    }
    // La participación nacional siempre es 100%: no dibujar su curva plana.
    if (serie && !(campo === 'Proporcion_diagnosticos_2025' && provincia === 'País')) {
      const origenSeries=contexto&&contexto.indicadores.some(c=>c.campo===campo)?contexto.series:datos.series;
      const puntos = (origenSeries[serie] || []).filter(x => x.provincia === provincia).sort((a,b) => a.anio - b.anio);
      const validos = puntos.filter(x => Number.isFinite(x.valor) && Number.isFinite(x.anio));
      const nota = document.createElement("div"); nota.className = "subtitulo";
      if (validos.length >= 2) {
        const min = Math.min(...validos.map(x => x.valor)), max = Math.max(...validos.map(x => x.valor));
        const ini = validos[0].anio, fin = validos[validos.length - 1].anio;
        const graf = svg("svg", {viewBox:"0 0 140 40",class:"spark",role:"img","aria-label":titulo + ": serie anual"});
        const tituloSVG = svg("title", {}); tituloSVG.textContent = validos.map(x => `${x.anio}: ${formato(x.valor, dec, escala, porcentaje)}`).join("; "); graf.append(tituloSVG);
        // Un faltante corta la línea; no se inventan valores ni se unen huecos.
        let tramo = [];
        const agregar = () => { if (tramo.length) graf.append(svg("polyline", {points:tramo.join(" "),fill:"none",stroke:"#539aff","stroke-width":3})); tramo = []; };
        for (const x of puntos) {
          if (!Number.isFinite(x.valor) || !Number.isFinite(x.anio)) { agregar(); continue; }
          tramo.push(`${5 + (x.anio-ini)/Math.max(1,fin-ini)*130},${max===min ? 20 : 34-(x.valor-min)/(max-min)*28}`);
        }
        agregar();
        const defs=svg("defs",{}),idFlecha=`flecha-serie-${campo}`;
        const flecha=svg("marker",{id:idFlecha,viewBox:"0 0 10 10",refX:10,refY:5,markerWidth:10,markerHeight:10,markerUnits:"userSpaceOnUse",orient:"auto"});
        flecha.append(svg("path",{d:"M0 0L10 5L0 10Z",fill:"#539aff"}));defs.append(flecha);graf.prepend(defs);
        const ultimoTramo=[...graf.querySelectorAll("polyline")].at(-1);
        ultimoTramo?.setAttribute("marker-end",`url(#${idFlecha})`);
        // Un punto aislado tras un faltante también se señala, sin unir el hueco.
        const puntosFinales=ultimoTramo?.getAttribute("points").trim().split(/\s+/)||[];
        if(puntosFinales.length===1){const [x,y]=puntosFinales[0].split(",").map(Number);graf.append(svg("path",{d:"M-10 -5L0 0L-10 5Z",transform:`translate(${x} ${y})`,fill:"#539aff",class:"flecha-punto-aislado"}));}
        cont.append(graf); nota.textContent = `${ini} – ${fin}`;
      } else nota.textContent = "Serie no disponible";
      cont.append(nota);
    }
    if (campo === "Prop_indetectables") {
      cont.classList.add("supresion");
      const nacional = datos.general.find(x => x.Provincia_atencion === "País");
      const referencia = document.createElement("span"); referencia.className = "referencia-nacional";
      referencia.textContent = `${formato(nacional?.Prop_indetectables,1,1,true)} nac.`;
      if (provincia !== "País") valor.append(referencia);
      const intervalo = document.createElement("div"); intervalo.className = "intervalo";
      intervalo.textContent = `IC 95%: ${formato(fila.Prop_indetect_IC95_inf,1,1,true)} – ${formato(fila.Prop_indetect_IC95_sup,1,1,true)}`;
      const cobertura = document.createElement("div"); cobertura.className = "subtitulo cobertura";
      const disponibilidad = document.createElement("span"); disponibilidad.textContent = "Información de carga viral";
      const badge = document.createElement("strong"); badge.textContent = formato(fila.Prop_con_info_cv,1,1,true);
      if(fila.Prop_con_info_cv<75) badge.classList.add("cobertura-parcial");
      cobertura.append(disponibilidad,badge);
      cont.append(intervalo, cobertura);
    }
    if (campo === "revincular") {
      cont.classList.add("perdida-seguimiento");
      label.title=titulo;textoLabel.textContent="Sin retiro de TARV";
      const criterio=document.createElement("p");criterio.className="criterio-seguimiento";criterio.textContent="Personas vivas, con retiro en los últimos 12 meses y sin otra cobertura social";cont.append(criterio);
      valor.remove();
      for (const [id, texto] of [["perdidos_90_179","3 a 6 meses"],["perdidos_180_mas","180 días o más"]]) {
        const linea = document.createElement("div"); linea.className = "desglose";
        const etiqueta = document.createElement("span"); etiqueta.textContent = texto;
        const cantidad = document.createElement("strong"); cantidad.dataset.campo = id;
        cantidad.textContent = formato(fila[id]); linea.append(etiqueta,cantidad); cont.append(linea);
      }
    }
    return cont;
  }
  function dibujarMapa(provincia) {
    $("mapa").replaceChildren();
    // El exportador ya duplica las instituciones bajo País: no sumar ambas copias.
    const tienePais = datos.mapa.some(x => x.Provincia_atencion === "País");
    const lista = (datos.mapa || []).filter(x => x.Provincia_atencion === provincia ||
      (provincia === "País" && !tienePais));
    const resultado = window.crearMapaSVIH($("mapa"), lista, {seleccion:provincia});
    $("mapa-nota").textContent = `${resultado.registros} registros con ubicación · ${resultado.excluidos} sin coordenadas válidas o cantidad positiva.`;
    if($("mini-mapa")) window.crearMapaComparativoSVIH($("mini-mapa"),[],{mini:true,seleccion:provincia});
  }
  function ajustarRotulos(){
    document.querySelectorAll('.tarjeta .etiqueta').forEach(e=>{e.style.fontSize='';const texto=e.firstElementChild;if(!texto||!e.clientWidth)return;let tam=parseFloat(getComputedStyle(e).fontSize);const estilo=getComputedStyle(e),alto=e.clientHeight-parseFloat(estilo.paddingTop)-parseFloat(estilo.paddingBottom);while(texto.offsetHeight>alto&&tam>9){tam-=.25;e.style.fontSize=tam+'px';}});
  }
  window.addEventListener('resize',ajustarRotulos);
  document.addEventListener('territorio-tablero',ajustarRotulos);
  window.ajustarRotulosSVIH=ajustarRotulos;
  function actualizar() {
    const provincia = $("provincia").value;
    const fila = datos.general.find(x => x.Provincia_atencion === provincia)||{};
    for (const [id, config] of [["epidemiologia",epidemiologia],["tarv",tarjetas],["detalle",detalles]]) {
      const origen=id==='epidemiologia'&&contexto?contexto.filas.find(r=>r.Provincia_atencion===provincia)||{}:fila;
      $(id).replaceChildren(...config.map(x=>tarjeta(x,origen,provincia)));
    }
    ajustarRotulos();
    dibujarMapa(provincia);
    document.dispatchEvent(new CustomEvent("territorio-tablero", {detail:provincia}));
  }
  $("fecha").textContent = "Corte: " + datos.fecha;
  $("demo").hidden = !datos.demostracion;
  if (datos.faltantes.length) { $("faltantes").hidden=false; $("faltantes").textContent="Hay indicadores ausentes en la fuente; se muestran como —: " + datos.faltantes.join(", "); }
  const territorios=datos.general.filter(x=>String(x.Provincia_atencion).trim().toLocaleLowerCase()!=="desconocido");
  for (const fila of territorios) { const o=document.createElement("option"); o.value=fila.Provincia_atencion; o.textContent=fila.Provincia_atencion; $("provincia").append(o); }
  const inicial = datos.general.some(x=>x.Provincia_atencion==="País") ? "País" : territorios[0]?.Provincia_atencion;
  $("provincia").value=inicial; $("provincia").addEventListener("change",actualizar);
  $("restablecer").addEventListener("click",()=>{ $("provincia").value=inicial; actualizar(); });
  actualizar();
})();
