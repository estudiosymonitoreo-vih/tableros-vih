// Author: Ariel Adaszko
/* Tablero autónomo: consume exclusivamente tablas agregadas, sin servicios externos. */
'use strict';
(() => {
const D = window.SNVS_DATOS;
if (!D) { document.getElementById('contenido').textContent='No se pudieron cargar los datos del tablero.'; return; }
const T=D.tablas, $=id=>document.getElementById(id), NS='http://www.w3.org/2000/svg';
const botonRestablecer=$('restablecer');
const sifilis=window.SNVS_SIFILIS_LOCAL;
const porcentajesDT=new WeakMap();
// El umbral usa los conteos de la selección, antes de redondear porcentajes.
for(const nombre of ['diagnostico','diagnostico_vias','diagnostico_regional'])if(T[nombre])T[nombre]=T[nombre].map(r=>{
 const insuficiente=!(r.total>0&&r.validos/r.total>=.6);
 const fila={...r,n:r.validos,insuficiente,tardio:insuficiente?null:r.tardio,avanzada:insuficiente?null:r.avanzada};porcentajesDT.set(fila,{tardio:r.tardio,avanzada:r.avanzada});return fila;
});
function paraMapaDT(r){if(!r)return r;const insuficiente=!(r.total>0&&r.validos/r.total>=.55),original=porcentajesDT.get(r)||r;return {...r,insuficiente,tardio:insuficiente?null:original.tardio,avanzada:insuficiente?null:original.avanzada};}
const colores=['#4c94f1','#efa056','#b38ae5','#b7ca6b','#32b6c9','#e7c63c','#e078b2','#807cce','#d9b886'];
const paginas=[['casos','VIH · Casos y tasas','M3 19V5m0 14h18M6 15l5-6 4 3 6-8'],['geografia','VIH · Distribución geográfica','M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2V5zm6-2v16m6-14v16'],['genero','VIH · Género y edad','M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 2a3 3 0 1 0 0-6M2 21v-3a6 6 0 0 1 12 0v3m3-7a5 5 0 0 1 5 5v2'],['vias','VIH · Vías de transmisión','M4 5h7l6 6h4M4 19h7l6-6h4M17 7l4 4-4 4'],['diagnostico','VIH · Diagnóstico tardío · evolución','M3 12h4l3-8 4 16 3-8h4'],['mapas-diagnostico','VIH · Diagnóstico tardío · mapas','M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2V5zm6-2v16m6-14v16'],['mortalidad','Mortalidad por sida','M3 19V5m0 14h18M6 8l5 3 4-2 6 7'],['definiciones','Definiciones','M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3V4zm9 2v16M6 8h3m-3 4h3m6-4h3m-3 4h3']];
const iconoSifilis='M3 19V5m0 14h18M7 16v-4m5 4V8m5 8V5';
// La solapa de diagnósticos de sífilis queda oculta hasta verificar la variable de provincia.
if(sifilis?.tamizaje||sifilis?.tamizaje_gestantes)paginas.splice(-1,0,['sifilis-territorio','ITS · Tamizaje de sífilis',iconoSifilis]);
if(sifilis?.coinfeccion?.length)paginas.splice(-1,0,['sifilis-coinfeccion','ITS · Coinfección VIH–Sífilis',iconoSifilis]);
const edades=['Todas las edades','0-9','10-14','15-19','20-24','25-34','35-44','45-54','55-64','65 o más'];
const generos=['Todos los géneros','Varón','Mujer','Mujer trans','Varón trans'];
const regiones=['GBA','Centro','Cuyo','NEA','NOA','Patagonia'];
const uniq=a=>[...new Set(a)], fmt=(v,d=1)=>v==null||!Number.isFinite(v)?'Sin datos':v.toLocaleString('es-AR',{maximumFractionDigits:d});
const geoSort=(a,b)=>(a==='Argentina'?-100:regiones.includes(a)?regiones.indexOf(a)-90:0)-(b==='Argentina'?-100:regiones.includes(b)?regiones.indexOf(b)-90:0)||a.localeCompare(b,'es');
const geos=uniq(T.casos.map(r=>r.geografia)).sort(geoSort), anios=uniq(T.casos.map(r=>r.anio)).sort((a,b)=>a-b);
const destinoInicial=['edad','genero-edad'].includes(location.hash.slice(1))?'genero':location.hash.slice(1);
let pagina=paginas.some(p=>p[0]===destinoInicial)?destinoInicial:'casos';
if(destinoInicial==='genero'&&location.hash!=='#genero')history.replaceState(null,'','#genero');
const estados={};
const exacto=(v,d=1)=>v==null||!Number.isFinite(v)?'Sin datos':v.toLocaleString('es-AR',{minimumFractionDigits:d,maximumFractionDigits:d});
function abrirDialogo(titulo,contenido){$('dialogo-titulo').textContent=titulo;$('dialogo-contenido').replaceChildren(contenido);if(!$('dialogo').open)$('dialogo').showModal();}
function abrirMetodologia(){
 const [,nombre]=paginas.find(([id])=>id===pagina);
 const contenido=nodo('div',null,'metodologia-solapa');
 contenido.append($(`metodologia-${pagina}`).content.cloneNode(true));
 if(['casos','geografia','mapas-diagnostico','mortalidad','sifilis'].includes(pagina)){
  contenido.append($('metodologia-cartografia').content.cloneNode(true));
 }
 if(['casos','mortalidad','definiciones'].includes(pagina)){
  contenido.append($('metodologia-empalme').content.cloneNode(true));
 }
 if(['casos','mortalidad','sifilis','definiciones'].includes(pagina)){
  contenido.append($('metodologia-poblacion-2022').content.cloneNode(true));
 }
 contenido.append($('metodologia-enlaces').content.cloneNode(true));
 abrirDialogo(`Acerca de los datos · ${nombre}`,contenido);
}
function ajustarPantalla(){
 // Redibujar las coordenadas con el espacio real, sin escalar texto ni mapas.
 document.querySelectorAll(innerWidth<=700?'.demografia-bloques svg.grafico, .diagnostico-evolucion svg.grafico, .pagina-sifilis svg.grafico':'svg.grafico').forEach(s=>{
  const ancho=s.clientWidth,alto=s.clientHeight;
  if(ancho>0&&alto>0)s.dibujar?.(ancho,alto);
 });
}

function textoVisible(texto){return String(texto).replace(/\bVarón\b/g,'Varones').replace(/\bMujer\b/g,'Mujeres').replace(/\s+cis\b/gi,'');}
function nodo(tag,texto,cls){const n=document.createElement(tag);if(texto!=null)n.textContent=textoVisible(texto);if(cls)n.className=cls;return n;}
function svg(tag,attrs={},texto){const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);if(texto!=null)n.textContent=textoVisible(texto);return n;}
function tituloSVG(n,txt){n.append(svg('title',{},txt));return n;}
function valorSeguro(r,campo){return r[campo]==null?null:Number(r[campo]);}
function conjunto(datos,campo,orden){const opciones=uniq(datos.map(r=>r[campo]).filter(v=>v!=null));return orden?[...orden.filter(v=>opciones.includes(v)),...opciones.filter(v=>!orden.includes(v)).sort()]:opciones.sort((a,b)=>typeof a==='number'?a-b:String(a).localeCompare(String(b),'es'));}
function filtro(host,datos,campo,etiqueta,clave,inicial,multiple=false,orden,resumenMultiple){
 const opciones=conjunto(datos,campo,orden).filter(v=>campo!=='geografia'||!/^desconocid[oa]s?$|^SD$|^sin dato/i.test(String(v).trim())), estado=estados[pagina];
 if(!(clave in estado))estado[clave]=multiple?[].concat(inicial??opciones[0]):(inicial??opciones[0]);
 let actual=multiple?estado[clave].filter(v=>opciones.includes(v)):estado[clave];
 if(multiple&&!actual.length)actual=[opciones[0]];
 if(!multiple&&!opciones.includes(actual))actual=opciones[0];
 estado[clave]=actual;
 const etiquetaN=nodo('div',null,'control');etiquetaN.append(nodo('span',etiqueta));
 if(!multiple){const s=nodo('select');s.setAttribute('aria-label',etiqueta);s.dataset.clave=clave;
 opciones.forEach(v=>{const o=nodo('option',campo==='indicador'&&String(v).startsWith('Tasa')?'Tasas por 100.000':String(v));o.value=String(v);o.selected=v===actual;s.append(o);});
 s.onchange=()=>{estado[clave]=opciones.find(v=>String(v)===s.value);render();};etiquetaN.append(s);
 }else{const d=nodo('details'),res=nodo('summary',actual.length===1?String(actual[0]):resumenMultiple??`${actual.length} selecciones`);d.dataset.clave=clave;d.append(res);
 const lista=nodo('div',null,'opciones'),busca=nodo('input');busca.type='search';busca.placeholder='Buscar';busca.setAttribute('aria-label',`Buscar ${etiqueta.toLowerCase()}`);const grupo=nodo('div',null,'lista-opciones');
 opciones.forEach(v=>{const l=nodo('label'),i=nodo('input');i.type='checkbox';i.checked=actual.includes(v);i.value=String(v);l.append(i,nodo('span',String(v)));
 i.onchange=()=>{const nuevos=i.checked?[...estado[clave],v]:estado[clave].filter(x=>x!==v);if(!nuevos.length){i.checked=true;return;}estado[clave]=nuevos;render();const abierto=document.querySelector(`details[data-clave="${clave}"]`);abierto.open=true;const foco=[...abierto.querySelectorAll('input[type=checkbox]')].find(n=>n.value===String(v));if(foco)foco.focus();};grupo.append(l);});
 busca.oninput=()=>{for(const l of grupo.children)l.hidden=!l.textContent.toLocaleLowerCase('es').includes(busca.value.toLocaleLowerCase('es'));};lista.append(busca,grupo);d.append(lista);etiquetaN.append(d);
 }
 const trazos={indicador:'M4 19V11h4v8m2 0V5h4v14m2 0V8h4v11',geografia:'M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2V5zm6-2v16m6-14v16',region:'M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2V5zm6-2v16m6-14v16',genero:'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 2a3 3 0 1 0 0-6M2 21v-3a6 6 0 0 1 12 0v3m3-7a5 5 0 0 1 5 5v2',edad:'M12 3v18M5 7h14M5 12h14M5 17h14',anio:'M4 5h16v16H4zM4 10h16M8 2v6M16 2v6'};
 etiquetaN.dataset.tipo=campo;const caja=nodo('div',null,'selector-visual'),icono=svg('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':1.7,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':true,class:'selector-icono'});icono.append(svg('path',{d:trazos[campo]||trazos.indicador}));caja.append(etiquetaN.lastElementChild,icono);etiquetaN.append(caja);
 if(multiple){const marca=nodo('small',`${actual.length}`,'cantidad-selecciones');marca.title='Cantidad de selecciones';etiquetaN.firstElementChild.append(marca);}
 host.append(etiquetaN);return estado[clave];
}
function controles(host){const c=nodo('div',null,'controles');host.append(c);return c;}
function panel(host,titulo){const p=nodo('section',null,'panel');p.append(nodo('h3',titulo));host.append(p);return p;}
function layout(host,clase='dos'){const n=nodo('div',null,clase);host.append(n);return n;}
function muestra(host,filas){
 const usadas=filas.filter(r=>!r.insuficiente&&(!('valor' in r)||r.valor!=null));
 const total=host.dataset.nTotal!=null?Number(host.dataset.nTotal):usadas.reduce((s,r)=>s+(r.n??0),0);
 const texto=`n = ${fmt(total,0)}`;
 const n=nodo('p',texto,'muestra-n');n.title='Casos válidos utilizados en el gráfico para los filtros y el período mostrados. En DT/EA se aplica un mínimo de cobertura del 55% en mapas y del 60% en evolución y vías.';host.append(n);
}
const encabezadosDetalle={
 anio:'Año',categoria:'Categoría',grupo_edad:'Grupo de edad',geografia:'Ámbito geográfico',
 region:'Región',genero:'Género',via:'Vía de transmisión',total_vih:'Total VIH',
 sin_coinfeccion:'Sin coinfección registrada',porcentaje:'Porcentaje',positividad:'Positividad',
 tardio:'Diagnóstico tardío',avanzada:'Enfermedad avanzada',validos:'Casos con dato',
 casos_tardio:'Casos de diagnóstico tardío',casos_avanzada:'Casos de enfermedad avanzada',
 insuficiente:'Datos insuficientes',n:'N'
};
function detalle(host,filas,{valorPorcentual=false}={}){
 muestra(host,filas);
 const scroll=nodo('div',null,'tabla-scroll'),table=nodo('table');
 const campos=filas.length?Object.keys(filas[0]):[],head=nodo('thead'),hr=nodo('tr');
 const esAnio=c=>/^(?:anio|año)(?:[_ ]|$)/i.test(c.trim());
 const porcentaje=(c,r)=>c==='valor'
  ?valorPorcentual||r.indicador==='Porcentaje'
  :/^(porcentaje|positividad|tardio|avanzada|noAvanzado)$/i.test(c)||c.includes('%');
 const numericas=new Set(campos.filter(c=>filas.some(r=>typeof r[c]==='number'||porcentaje(c,r))));
 campos.forEach(c=>{
  const texto=c.replaceAll('_',' ');
  const titulo=encabezadosDetalle[c]??texto.replace(/^anio\b/i,'Año');
  const th=nodo('th',titulo.charAt(0).toLocaleUpperCase('es')+titulo.slice(1));
  th.scope='col';th.classList.toggle('celda-numerica',numericas.has(c));hr.append(th);
 });head.append(hr);table.append(head);
 const body=nodo('tbody');
 filas.forEach(r=>{
  const tr=nodo('tr');
  campos.forEach(c=>{
   const valor=r[c];
   const texto=typeof valor==='number'&&Number.isFinite(valor)
    ?(porcentaje(c,r)?exacto(valor,1)+'%':esAnio(c)||c==='categoria'?String(valor):fmt(valor,3))
    :typeof valor==='boolean'?valor?'Sí':'No':valor??'Sin datos';
   tr.append(nodo('td',texto,numericas.has(c)?'celda-numerica':null));
  });
  body.append(tr);
 });table.append(body);scroll.append(table);
 const acciones=nodo('div',null,'acciones-datos'),ver=nodo('button','Ver datos'),b=nodo('button','Descargar CSV');
 ver.onclick=()=>abrirDialogo(host.dataset.tituloDatos||host.querySelector('h3')?.textContent||'Datos del gráfico',scroll);
 b.disabled=!filas.length;b.onclick=()=>{const csv=[campos,...filas.map(r=>campos.map(c=>r[c]??''))].map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));const a=nodo('a');a.href=url;a.download=pagina.startsWith('sifilis')?`${pagina}.csv`:`vih-${pagina}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};acciones.append(ver,b);host.append(acciones);
}
function vacio(host){host.append(nodo('p','Sin datos para esta selección.','vacio'));}
function abreviarVia(v){return ({'Prácticas sexuales con mujeres sin protección':'Sexual con mujeres (sin protección)','Prácticas sexuales con varones sin protección':'Sexual con varones (sin protección)','Prácticas sexuales con trans sin protección':'Sexual con personas trans (sin protección)','Uso compartido de equipo de inyección en los últimos 10 años':'Equipo de inyección compartido'})[v]||v;}
function leyenda(host,series){const l=nodo('div',null,'leyenda');series.forEach((s,i)=>{const t=nodo('span'),m=nodo('i',null,'muestra');m.style.background=colores[i%colores.length];t.append(m,document.createTextNode(textoVisible(abreviarVia(s))));t.title=s;l.append(t);});host.append(l);}
function incluirPeriodoTitulo(host,filas){
 const titulo=host.querySelector('h3');if(!titulo||/\b(?:19|20)\d{2}\b/.test(titulo.textContent))return;
 const anos=uniq(filas.map(r=>r.anio).filter(a=>Number.isInteger(a)&&a>=1900&&a<=2099)).sort((a,b)=>a-b);
 if(anos.length)titulo.textContent+=` · ${anos[0]===anos.at(-1)?anos[0]:anos[0]+'–'+anos.at(-1)}`;
}
function grafico(host,filas,{tipo='linea',porcentaje=false,maximoPorcentaje=100,unidad='',ordenSeries=null,decimales=1,datosDetalle=null,ancho=720,alto=390,ordenX=null,coloresSeries=null,separacionBarras=1,tooltips=true,rotularTotales=false,proporcionFija=false}={}){
 incluirPeriodoTitulo(host,filas);
 const formatoDetalle={valorPorcentual:porcentaje&&!datosDetalle};
 if(!filas.some(r=>r.valor!=null)&&!filas.some(r=>r.insuficiente)){vacio(host);detalle(host,datosDetalle||filas,formatoDetalle);return;}
 const xs=ordenX?ordenX.filter(x=>filas.some(r=>r.anio===x)):uniq(filas.map(r=>r.anio)).sort((a,b)=>a-b),series=ordenSeries?ordenSeries.filter(s=>filas.some(r=>r.serie===s)):uniq(filas.map(r=>r.serie||'Valor'));
 const totales=new Map();
 if(tipo==='apilado')for(const {anio,valor} of filas){
  if(valor!=null)totales.set(anio,(totales.get(anio)??0)+valor);
 }
 const s=svg('svg',{class:'grafico',role:'img','aria-label':host.querySelector('h3').textContent});
 const dibujar=(w,h)=>{
 const diagnosticoCompacto=!!host.closest('.diagnostico-con-vias'),compacto=diagnosticoCompacto||!!host.closest('.demografia-bloques'),L=compacto?42:55,R=compacto?16:22,U=compacto?16:35,B=diagnosticoCompacto?31:compacto?27:42,iw=Math.max(1,w-L-R),ih=Math.max(1,h-U-B);
 s.setAttribute('viewBox',`0 0 ${w} ${h}`);s.replaceChildren();if(tooltips===true)tituloSVG(s,host.querySelector('h3').textContent+'. Los valores están disponibles en la tabla debajo del gráfico.');
 const max=porcentaje&&maximoPorcentaje!=null?maximoPorcentaje:Math.max(1,...(tipo==='apilado'?totales.values():filas.map(r=>r.valor??0)))*1.13;
 const x=i=>L+(i+.5)*iw/xs.length, y=v=>U+ih*(1-v/max);
 for(let j=0;j<=4;j++){const v=max*j/4,yy=y(v);s.append(svg('line',{x1:L,x2:w-R,y1:yy,y2:yy,class:'rejilla'}),svg('text',{x:L-10,y:yy+4,'text-anchor':'end'},fmt(v,v<5?1:0)+(porcentaje?'%':'')));}
 xs.forEach((a,i)=>s.append(svg('text',{x:x(i),y:h-17,'text-anchor':'middle'},a)));
 const matriz=new Map(filas.map(r=>[`${r.anio}|${r.serie||'Valor'}`,r.valor]));
 const coloresBarras=new Map(filas.filter(r=>r.color).map(r=>[`${r.anio}|${r.serie||'Valor'}`,r.color]));
 series.forEach((nombre,j)=>{let segmentos=[],tramo=[];xs.forEach((a,i)=>{const v=matriz.get(`${a}|${nombre}`);if(v==null){if(tipo==='barras'&&j===0&&filas.some(r=>r.anio===a&&r.insuficiente))s.append(svg('text',{x:x(i),y:y(0)-12,'text-anchor':'middle',class:'sin-datos-suficientes'},'Sin datos suficientes'));if(tramo.length)segmentos.push(tramo);tramo=[];return;}
 const color=(tipo==='linea'||tipo==='puntos')&&series.length===1?'#73d4ef':(coloresBarras.get(`${a}|${nombre}`)||coloresSeries?.[nombre]||colores[j%colores.length]),etiqueta=exacto(v,porcentaje?1:decimales)+(porcentaje?'%':''),tooltip=`${a==='Todas'?'Todas las edades':a} · ${nombre}: ${fmt(v)}${porcentaje?'%':unidad?' '+unidad:''}`;
 if(tipo==='linea'||tipo==='puntos'){const final=i===xs.length-1,textoTooltip=tooltips==='categoria'?`${nombre}: ${etiqueta}`:tooltip;tramo.push([x(i),y(v),textoTooltip]);const punto=svg('circle',{cx:x(i),cy:y(v),r:tipo==='puntos'?7:4,fill:final?'#ffdc8d':color,tabindex:0,'aria-label':tooltip});s.append(tooltips?tituloSVG(punto,textoTooltip):punto);s.append(svg('text',{x:x(i),y:y(v)-12-(j%3)*12,'text-anchor':'middle',class:'valor-punto'},etiqueta));}
 else {const ancho=iw/xs.length*.74;let base=0,xx=x(i)-ancho/2,bw=ancho;
 if(tipo==='apilado'){for(let k=0;k<j;k++)base+=matriz.get(`${a}|${series[k]}`)??0;}else{bw=ancho/series.length;xx+=j*bw;}
 const hueco=tipo==='barras'?Math.min(separacionBarras,bw*.2):1;
 s.append(tituloSVG(svg('rect',{x:xx+(tipo==='barras'?hueco/2:0),y:y(v+base),width:Math.max(1,bw-hueco),height:ih*v/max,fill:color,tabindex:0,'aria-label':tooltip}),tooltip));
 if(tipo==='barras'){const xxLabel=xx+bw/2,yyLabel=y(v+base)-8;s.append(svg('text',{x:xxLabel,y:yyLabel,'text-anchor':series.length>3?'start':'middle',class:'valor-barra',...(series.length>3?{transform:`rotate(-55 ${xxLabel} ${yyLabel})`}:{})},etiqueta));}
 if(tipo==='apilado'&&v>(rotularTotales?0:8))s.append(svg('text',{x:xx+bw/2,y:y(base+v/2)+4,'text-anchor':'middle',fill:'#fff',class:'valor-apilado'},rotularTotales?etiqueta:fmt(v)+(porcentaje?'%':'')));
 }});if(tramo.length)segmentos.push(tramo);if(tipo==='linea')segmentos.forEach(tr=>{
  const linea=svg('polyline',{points:tr.map(p=>p.slice(0,2).join(',')).join(' '),fill:'none',stroke:series.length===1?'#73d4ef':colores[j%colores.length],'stroke-width':2.8});
  // Casos/tasas: identificar la serie y el valor observado más cercano, sin el título general.
  if(tooltips==='categoria'){
   tituloSVG(linea,tr[0][2]);
   linea.addEventListener('pointermove',evento=>{
    const punto=s.createSVGPoint();punto.x=evento.clientX;punto.y=evento.clientY;
    const posicion=punto.matrixTransform(s.getScreenCTM().inverse());
    const cercano=tr.reduce((a,b)=>Math.abs(b[0]-posicion.x)<Math.abs(a[0]-posicion.x)?b:a);
    linea.querySelector('title').textContent=cercano[2];
   });
  }
  s.prepend(linea);
 });});
 if(rotularTotales)xs.forEach((anio,i)=>{
  const total=totales.get(anio);
  if(total!=null)s.append(svg('text',{x:x(i),y:y(total)-12,'text-anchor':'middle',class:'valor-barra'},exacto(total,decimales)));
 });
 };
 if(!proporcionFija)s.dibujar=dibujar;
 dibujar(ancho,alto);
 host.append(s);leyenda(host,series);if(coloresSeries)host.querySelectorAll('.leyenda .muestra').forEach((m,i)=>m.style.background=coloresSeries[series[i]]||colores[i%colores.length]);if((tipo==='linea'||tipo==='puntos')&&series.length===1)host.querySelector('.leyenda .muestra').style.background='#73d4ef';detalle(host,datosDetalle||filas,formatoDetalle);
 // La mediana conserva rótulos y accesibilidad, sin tooltips tampoco en su leyenda.
 if(!tooltips)host.querySelectorAll('.leyenda [title]').forEach(n=>n.removeAttribute('title'));
}
const nombreMapa=n=>n==='Ciudad de Buenos Aires'?'CABA':n;
const posicionesProvincia={
 'Buenos Aires':[-60.3,-37.1],'Catamarca':[-67,-27.7],'Chaco':[-60.5,-26.3],'Chubut':[-68.3,-43.4],
 'Córdoba':[-64,-32.2],'Corrientes':[-57.8,-28.7],'Entre Ríos':[-59.2,-32.1],'Formosa':[-59.4,-24.7],
 'Jujuy':[-66,-23.3],'La Pampa':[-65.5,-37.3],'La Rioja':[-67.3,-29.7],'Mendoza':[-68.7,-34.3],
 'Misiones':[-54.7,-26.9],'Neuquén':[-70,-38.7],'Río Negro':[-67.7,-40.7],'Salta':[-64.5,-24.6],
 'San Juan':[-68.9,-30.8],'San Luis':[-66,-33.8],'Santa Cruz':[-69.3,-49.3],'Santa Fe':[-60.8,-30.3],
 'Santiago del Estero':[-63.1,-28.2],'Tierra del Fuego':[-67.7,-54.5],'Tucumán':[-65.4,-26.8]
};
function mapa(host,filas,campo='valor',unidad='',color='#237bd1',region='Argentina',{soloMapa=false,maximo=null}={}){
 incluirPeriodoTitulo(host,filas.length?filas:[{anio:pagina==='casos'?estados[pagina]?.am:estados[pagina]?.a}]);
 const regional=region!=='Argentina',features=regional?D.mapa.territorios.features.filter(f=>f.properties.region===region):D.mapa.provincias.features;
 filas=features.map(f=>filas.find(r=>r.geografia===nombreMapa(f.id))||{geografia:nombreMapa(f.id),n:0,validos:0,total:0,insuficiente:campo!=='valor'});
 const insuficientes=new Set(filas.filter(r=>r.insuficiente).map(r=>r.geografia));
 const valores=new Map(filas.map(r=>[r.geografia,valorSeguro(r,campo)]));
 const validos=[...valores.values()].filter(v=>v!=null&&Number.isFinite(v));
 const max=maximo??Math.max(1,...validos),division=nodo('div',null,'mapa-y-ranking'),columna=nodo('div',null,'mapa-columna'),wrap=nodo('div',null,'mapa-contenedor');
 const s=svg('svg',{viewBox:'0 0 330 420',class:'mapa',role:'group','aria-label':`Mapa de ${region} por jurisdicción`}),g=svg('g');s.append(g);
 const proy=([lon,lat])=>[60+(lon+76)*Math.PI/180*500,10+(Math.log(Math.tan(Math.PI/4-21*Math.PI/360))-Math.log(Math.tan(Math.PI/4+lat*Math.PI/360)))*500];
 const anillo=ring=>ring.map((p,i)=>(i?'L':'M')+proy(p).map(v=>v.toFixed(2)).join(',')).join('')+'Z';
 const path=geom=>{const polys=geom.type==='Polygon'?[geom.coordinates]:geom.type==='MultiPolygon'?geom.coordinates:[];return polys.map(p=>p.map(anillo).join('')).join('');};
 D.mapa.paises.features.forEach(f=>{
  const malvinas=soloMapa&&f.id==='Islas Malvinas';
  const forma=svg('path',{d:path(f.geometry),fill:malvinas?'#929baa':'#e3e9ec',stroke:'#a3b4ba'});
  g.append(malvinas?tituloSVG(forma,'Islas Malvinas'):forma);
 });
 const info=nodo('div','Pasá sobre una jurisdicción o seleccionála para ver el valor.','mapa-info');info.setAttribute('aria-live','polite');
 features.forEach(f=>{const nombre=nombreMapa(f.id),v=valores.get(nombre),txt=`${nombre}: ${insuficientes.has(nombre)?'Sin datos suficientes':fmt(v)}${v==null?'':unidad}`;
 const p=tituloSVG(svg('path',{d:path(f.geometry),fill:v==null?'#929baa':color,'fill-opacity':v==null?1:.18+.82*v/max,'data-nombre':nombre,tabindex:0,'aria-label':txt}),txt);
 for(const ev of ['pointerenter','focus','click'])p.addEventListener(ev,()=>{info.textContent=txt;});g.append(p);});
 // Los rótulos se dibujan después de los polígonos para mantenerlos visibles.
 const decimales=unidad?1:0;
 for(const f of features){const nombre=nombreMapa(f.id),posicion=regional?f.properties.etiqueta:posicionesProvincia[nombre];if(!posicion)continue;const [x,y]=proy(posicion),v=valores.get(nombre);g.append(svg('text',{x,y,'text-anchor':'middle',class:'valor-provincia','data-provincia':nombre},v==null?'s/d':exacto(v,decimales)+(unidad==='%'?'%':'')));}
 if(!regional){const pos=proy([-58.4,-34.6]),vC=valores.get('CABA'),ct=`CABA: ${insuficientes.has('CABA')?'Sin datos suficientes':fmt(vC)}${vC==null?'':unidad}`;
 const c=tituloSVG(svg('circle',{cx:pos[0],cy:pos[1],r:3,fill:vC==null?'#929baa':color,stroke:'white',tabindex:0,'aria-label':ct}),ct);['focus','click','pointerenter'].forEach(e=>c.addEventListener(e,()=>{info.textContent=ct;}));g.append(c);
 const etiquetaCaba=proy([-53.2,-35.8]);
 g.append(svg('path',{d:`M${pos[0]},${pos[1]}L${etiquetaCaba[0]-3},${etiquetaCaba[1]}`,class:'linea-caba'}),svg('text',{x:etiquetaCaba[0],y:etiquetaCaba[1]-7,'text-anchor':'middle',class:'valor-provincia'},'CABA'),svg('text',{x:etiquetaCaba[0],y:etiquetaCaba[1]+6,'text-anchor':'middle',class:'valor-provincia','data-provincia':'CABA'},vC==null?'s/d':exacto(vC,decimales)+(unidad==='%'?'%':'')));}
 if(regional){
  const puntos=[];const recorrer=v=>{if(typeof v[0]==='number')puntos.push(proy(v));else v.forEach(recorrer);};features.forEach(f=>recorrer(f.geometry.coordinates));
  const xs=puntos.map(p=>p[0]),ys=puntos.map(p=>p[1]),x0=Math.min(...xs),y0=Math.min(...ys),ancho=Math.max(...xs)-x0,alto=Math.max(...ys)-y0;
  const escalaRegion=Math.min(280/ancho,370/alto);const regionalG=svg('g',{transform:`translate(${165-(x0+ancho/2)*escalaRegion},${210-(y0+alto/2)*escalaRegion}) scale(${escalaRegion})`});
  // Los países quedan como fondo; la región se amplía dentro de su propia capa.
  const fondo=g.querySelectorAll('path:not([data-nombre])');fondo.forEach(n=>n.remove());
  while(g.firstChild)regionalG.append(g.firstChild);g.append(regionalG);
  const etiquetas=[...regionalG.querySelectorAll('text')].map(t=>({t,x:Number(t.getAttribute('x')),y:Number(t.getAttribute('y')),originalY:Number(t.getAttribute('y'))}));
  for(let vuelta=0;vuelta<30;vuelta++)for(let i=0;i<etiquetas.length;i++)for(let j=i+1;j<etiquetas.length;j++){
   const a=etiquetas[i],b=etiquetas[j],dy=(b.y-a.y)*escalaRegion;
   if(Math.abs((a.x-b.x)*escalaRegion)<28&&Math.abs(dy)<17){const mover=(17-Math.abs(dy))/2/escalaRegion;a.y-=mover;b.y+=mover;}
  }
  etiquetas.forEach(({t,x,y,originalY})=>{t.style.fontSize=`${16/escalaRegion}px`;t.style.strokeWidth=`${2.2/escalaRegion}px`;t.setAttribute('y',y);tituloSVG(t,t.getAttribute('data-provincia')+': '+t.textContent);if(Math.abs(y-originalY)*escalaRegion>3)regionalG.insertBefore(svg('line',{x1:x,y1:originalY,x2:x,y2:y,stroke:'#dae7f5','stroke-width':.8/escalaRegion}),t);});
 }
 // Encuadre nacional sobre las provincias y el rótulo de CABA, con margen mínimo.
 let marco={x:0,y:0,ancho:330,alto:420};
 if(!regional){
  const puntos=[];const recorrer=v=>{if(typeof v[0]==='number')puntos.push(proy(v));else v.forEach(recorrer);};features.forEach(f=>recorrer(f.geometry.coordinates));
  if(soloMapa)D.mapa.paises.features.filter(f=>f.id==='Islas Malvinas').forEach(f=>recorrer(f.geometry.coordinates));
  const caba=proy([-53.2,-35.8]);puntos.push([caba[0]+20,caba[1]-14],[caba[0]+20,caba[1]+14]);
  const xs=puntos.map(p=>p[0]),ys=puntos.map(p=>p[1]);
  marco={x:Math.min(...xs)-8,y:Math.min(...ys)-8,ancho:Math.max(...xs)-Math.min(...xs)+16,alto:Math.max(...ys)-Math.min(...ys)+16};
  s.setAttribute('viewBox',`${marco.x} ${marco.y} ${marco.ancho} ${marco.alto}`);
 }
 const centroX=marco.x+marco.ancho/2,centroY=marco.y+marco.alto/2;
 let z=1,dx=0,dy=0;const transforma=()=>g.setAttribute('transform',`translate(${dx},${dy}) translate(${centroX},${centroY}) scale(${z}) translate(${-centroX},${-centroY})`);
 const botones=nodo('div',null,'zoom');[['+','Acercar',()=>z=Math.min(6,z*1.4)],['−','Alejar',()=>z=Math.max(1,z/1.4)],['↺','Restablecer mapa',()=>{z=1;dx=0;dy=0;}]].forEach(([txt,label,fn])=>{const b=nodo('button',txt);b.setAttribute('aria-label',label);b.onclick=()=>{fn();transforma();};botones.append(b);});
 let inicio=null;s.onpointerdown=e=>{inicio=[e.clientX,e.clientY,dx,dy];s.setPointerCapture(e.pointerId);};s.onpointermove=e=>{if(inicio){const rect=s.getBoundingClientRect();dx=inicio[2]+(e.clientX-inicio[0])*marco.ancho/rect.width;dy=inicio[3]+(e.clientY-inicio[1])*marco.alto/rect.height;transforma();}};s.onpointerup=s.onpointercancel=()=>{inicio=null;};
 wrap.append(s,botones);columna.append(wrap,info);const escala=nodo('div',null,'escala');const grad=nodo('i',null,'gradiente');grad.style.background=`linear-gradient(90deg,${color}33,${color})`;escala.append(nodo('span',unidad==='%'?'0%':'0'),grad,nodo('span',fmt(max)+unidad),nodo('span',campo==='valor'?'Gris: sin datos':'Gris: sin datos suficientes (<55% válidos)'));if(!validos.length)escala.replaceChildren(nodo('span',campo==='valor'?'Sin datos para esta selección.':'Sin jurisdicciones con datos suficientes.'));columna.append(escala);
 if(soloMapa){host.append(columna);return;}
 const ranking=nodo('div',null,'ranking');ranking.dataset.maximo=String(max);ranking.style.setProperty('--color-mapa',color);[...valores].sort((a,b)=>(b[1]??-1)-(a[1]??-1)).forEach(([n,v])=>{const row=nodo('div',null,'fila-ranking'),bar=nodo('div',null,'barra-ranking'),i=nodo('i');i.style.width=`${v==null?0:v/max*100}%`;i.style.background=color;if(v==null||!Number.isFinite(v))row.classList.add('sin-dato');bar.append(i);if(insuficientes.has(n)){row.classList.add('insuficiente');row.append(nodo('span',n),nodo('span','Sin datos suficientes','aviso-insuficiente'));}else row.append(nodo('span',n),bar,nodo('strong',v==null?'s/d':exacto(v,unidad?1:0)+(unidad==='%'?'%':'')));ranking.append(row);});division.append(columna,ranking);host.append(division);detalle(host,filas);
 if(pagina!=='mortalidad'){division.classList.add('mapa-extendido');division.append(host.querySelector('.muestra-n'),host.querySelector('.acciones-datos'));}
}
function colorMapa(genero,avanzada=false){
 const paletas={'Ambos sexos':['#237bd1','#d67555'],'Todos los géneros':['#237bd1','#d67555'],'Mujer':['#c47729','#9b4f16'],'Mujeres':['#c47729','#9b4f16'],'Varón':['#9466c6','#704396'],'Varones':['#9466c6','#704396'],'Mujer trans':['#cc529a','#98366f'],'Varón trans':['#168e9b','#0b6772']};
 return (paletas[genero]||paletas['Todos los géneros'])[avanzada?1:0];
}
function graficosMortalidadEdad(host,filas,sexo){
 const tasas=panel(host,'Tasas de mortalidad por sida por edad · 2024');tasas.classList.add('mortalidad-tasas-edad');
 const distribucion=panel(host,'Distribución de defunciones por sida por edad · 2024');distribucion.classList.add('mortalidad-distribucion-edad');
 if(!filas.length){vacio(tasas);vacio(distribucion);return;}
 tasas.append(nodo('p',`${sexo} · por 100.000 habitantes`,'nota contexto-mortalidad-edad'));
 const lista=nodo('ol',null,'lista-tasas-edad'),max=Math.max(1,...filas.map(r=>r.tasa));
 filas.forEach(r=>{const fila=nodo('li',null,'fila-tasa-edad'),pista=nodo('div',null,'pista-tasa-edad'),barra=nodo('i');
  fila.dataset.edad=r.grupo_edad;fila.dataset.valor=r.tasa;barra.style.width=`${r.tasa/max*100}%`;barra.style.background=colorMapa(sexo);pista.append(barra);
  fila.append(nodo('span',r.grupo_edad),pista,nodo('strong',exacto(r.tasa,1),'valor-tasa-edad'));fila.title=`${r.grupo_edad}: ${exacto(r.tasa,1)} por 100.000 habitantes`;lista.append(fila);
 });tasas.append(lista);detalle(tasas,filas);tasas.querySelector('.muestra-n').remove();
 distribucion.append(nodo('p',`${sexo} · porcentaje de defunciones`,'nota contexto-mortalidad-edad'));
 const s=svg('svg',{class:'grafico dona-mortalidad',role:'img','aria-label':distribucion.querySelector('h3').textContent+' · '+sexo});
 s.dibujar=(w,h)=>{
  s.setAttribute('viewBox',`0 0 ${w} ${h}`);s.replaceChildren();tituloSVG(s,distribucion.querySelector('h3').textContent+' · '+sexo);
  const cx=w/2,cy=h/2,r=Math.max(20,Math.min(w*.20,h*.39)),interior=r*.57,total=filas.reduce((a,f)=>a+f.porcentaje,0),rotulos=[];
  const paleta=[...colores,'#9baac4'];let angulo=-Math.PI/2;
  filas.forEach((f,i)=>{
   const fraccion=f.porcentaje/total,fin=angulo+fraccion*Math.PI*2,medio=(angulo+fin)/2,punto=(a,radio)=>[cx+radio*Math.cos(a),cy+radio*Math.sin(a)],color=paleta[i],texto=`${f.grupo_edad}: ${exacto(f.porcentaje,1)}%`;
   if(fraccion>0){const a=punto(angulo,r),b=punto(fin,r),c=punto(fin,interior),d=punto(angulo,interior),grande=fraccion>.5?1:0;
    const porcion=tituloSVG(svg('path',{d:`M${a}A${r},${r} 0 ${grande} 1 ${b}L${c}A${interior},${interior} 0 ${grande} 0 ${d}Z`,fill:color,stroke:'#242c50','stroke-width':1,class:'porcion-dona',tabindex:0,'data-edad':f.grupo_edad,'data-porcentaje':f.porcentaje,'aria-label':texto}),texto);s.append(porcion);
   }
   const lado=Math.cos(medio)>=0?1:-1,nombre=f.grupo_edad.replace(' años','').replace(' y más','+').replaceAll('-','–');
   rotulos.push({lado,y:cy+(r+9)*Math.sin(medio),origen:fraccion>0?punto(medio,r):null,color,nombre,porcentaje:f.porcentaje,edad:f.grupo_edad});angulo=fin;
  });
  for(const lado of [-1,1]){
   const etiquetas=rotulos.filter(e=>e.lado===lado).sort((a,b)=>a.y-b.y),paso=13,min=10,max=h-6;
   etiquetas.forEach((e,i)=>e.y=Math.max(min,e.y,i?etiquetas[i-1].y+paso:min));
   for(let i=etiquetas.length-1;i>=0;i--)etiquetas[i].y=Math.min(etiquetas[i].y,i===etiquetas.length-1?max:etiquetas[i+1].y-paso);
   etiquetas.forEach(e=>{const x=cx+lado*(r+16);if(e.origen)s.append(svg('polyline',{points:`${e.origen} ${cx+lado*(r+8)},${e.y} ${x},${e.y}`,fill:'none',stroke:e.color,'stroke-width':1,class:'linea-dona'}));
    s.append(svg('text',{x:x+lado*3,y:e.y+3,'text-anchor':lado>0?'start':'end',class:'rotulo-dona','data-lado':lado,'data-edad':e.edad,'data-porcentaje':e.porcentaje},`${e.nombre} · ${exacto(e.porcentaje,1)}%`));
   });
  }
  s.append(svg('text',{x:cx,y:cy-1,'text-anchor':'middle',class:'centro-dona'},'2024'),svg('text',{x:cx,y:cy+13,'text-anchor':'middle',class:'centro-dona-nota'},'defunciones'));
 };s.dibujar(360,210);distribucion.append(s);detalle(distribucion,filas);distribucion.querySelector('.muestra-n').remove();
}
function seccionMortalidad(host){
 const datos=T.mortalidad||[],c=controles(host);
 if(!datos.length){host.append(nodo('p','Regenerá el tablero para incorporar el archivo auxiliar de mortalidad.'));return;}
 const sexo=filtro(c,datos,'sexo','Sexo','sexo','Ambos sexos',false,['Ambos sexos','Varones','Mujeres']);
 const tipo=filtro(c,datos,'tipo','Indicador','tipo','Tasa bruta',false,['Tasa bruta','Tasa ajustada por edad','Defunciones']);
 const defunciones=tipo==='Defunciones',decimales=defunciones?0:1,unidad=defunciones?'':' por 100.000 habitantes',titulo=defunciones?'Defunciones por sida':'Tasa de mortalidad por sida por 100.000 habitantes';
 const filas=datos.filter(r=>r.sexo===sexo&&r.tipo===tipo&&r.anio>=2020),extras=['Desconocido','Otro país'],geografias=[...uniq(filas.map(r=>r.geografia)).filter(g=>!extras.includes(g)).sort(geoSort),...extras.filter(g=>filas.some(r=>r.geografia===g))];
 const nacional=filas.find(r=>r.geografia==='Argentina'&&r.anio===2024);
 const resumen=nodo('section',null,'resumen-indicadores resumen-mortalidad');resumen.setAttribute('aria-label',defunciones?'Defunciones nacionales por sida':'Tasa nacional de mortalidad por sida');
 tarjetaResumen(resumen,defunciones?'Defunciones por sida · Argentina':`${tipo} de mortalidad por sida · Argentina`,exacto(nacional?.valor,decimales),`${sexo} · 2024${unidad?' · por 100.000 habitantes':''}`);host.append(resumen);
 const columnas=nodo('div',null,'mortalidad-columnas');host.append(columnas);columnas.append(c,resumen);
 const tablaPanel=panel(columnas,`${titulo} · 2020–2024`),wrap=nodo('div',null,'tabla-mortalidad'),tabla=nodo('table');
 const head=nodo('thead'),hr=nodo('tr');['Jurisdicción',2020,2021,2022,2023,2024].forEach(t=>{const th=nodo('th',String(t));th.scope='col';hr.append(th);});head.append(hr);tabla.append(head);
 const body=nodo('tbody');for(const geo of geografias){const tr=nodo('tr'),th=nodo('th',geo);th.scope='row';tr.append(th);for(const a of [2020,2021,2022,2023,2024])tr.append(nodo('td',exacto(filas.find(r=>r.geografia===geo&&r.anio===a)?.valor,decimales)));body.append(tr);}tabla.append(body);wrap.append(tabla);tablaPanel.append(wrap);
 const barrasPanel=panel(columnas,`${titulo} · por provincia · 2024`),p=panel(columnas,`Mapa de ${titulo.toLowerCase()} · 2024`),actuales=filas.filter(r=>r.anio===2024&&r.geografia!=='Argentina'&&!extras.includes(r.geografia));
 p.classList.add('panel-mortalidad');
 mapa(p,actuales,'valor',unidad,colorMapa(sexo));
 if(defunciones){const nota=nodo('p',null,'nota mortalidad-residencias');nota.setAttribute('aria-live','polite');extras.forEach((g,i)=>{if(i)nota.append(document.createTextNode(' · '));const valor=filas.find(r=>r.geografia===g&&r.anio===2024)?.valor;nota.append(nodo('span',`${g}: ${exacto(valor,0)}`));});p.querySelector('.mapa-columna').append(nota);}
 p.querySelectorAll('.muestra-n').forEach(n=>n.remove());
 barrasPanel.classList.add('barras-mortalidad');barrasPanel.append(p.querySelector('.ranking'));
 const acciones=p.querySelector('.acciones-datos');if(acciones)barrasPanel.append(acciones);
 const tituloComun=`${titulo} · por provincia · 2024`,comparacion=nodo('section',null,'mortalidad-comparacion'),encabezado=nodo('h3',tituloComun);
 encabezado.id='titulo-mortalidad-comparacion';comparacion.append(encabezado);
 for(const panelDatos of [barrasPanel,p]){panelDatos.querySelector('h3').remove();panelDatos.dataset.tituloDatos=tituloComun;panelDatos.setAttribute('aria-labelledby',encabezado.id);comparacion.append(panelDatos);}
 columnas.append(comparacion);
 const edadColumna=nodo('section',null,'mortalidad-edad-columna');edadColumna.setAttribute('aria-label','Mortalidad por sida por edad en 2024');columnas.append(edadColumna);
 graficosMortalidadEdad(edadColumna,(T.mortalidad_edad||[]).filter(r=>r.sexo===sexo&&r.anio===2024),sexo);

 if(defunciones)host.append(nodo('p','Fuente de defunciones: CSV procesados DEIS 2020–2024. Tasas y distribución por edad: tablas de 2024 incorporadas al tablero.','nota'));
 $('periodo').textContent='Fuente: DEIS / Ministerio de Salud · Mortalidad por causas asociadas al VIH · 2020–2024';
}

function seccionCasos(host){
 const grid=layout(host),p=panel(grid,'Evolución de casos de VIH'),c=controles(p);
 const ind=filtro(c,T.casos,'indicador','Indicador','indicador','Casos'),geo=filtro(c,T.casos,'geografia','Unidad geográfica','geo','Argentina',true,geos),sexo=filtro(c,T.casos,'genero','Sexo','sexo','Ambos sexos',true,['Ambos sexos','Mujeres','Varones']),edad=filtro(c,T.casos,'edad','Grupo de edad','edad','Todas las edades',true,edades);
 p.querySelector('h3').textContent=ind==='Casos'?'Evolución de casos de VIH':'Evolución de tasas de VIH por 100.000 habitantes';
 const filas=T.casos.filter(r=>ind===r.indicador&&geo.includes(r.geografia)&&sexo.includes(r.genero)&&edad.includes(r.edad));
 // Solo las dimensiones que varían necesitan repetirse en la leyenda.
 const filtrosSeries=[{campo:'geografia',etiqueta:'Geografía',valores:geo},{campo:'genero',etiqueta:'Sexo',valores:sexo},{campo:'edad',etiqueta:'Edad',valores:edad}];
 const dimensiones=filtrosSeries.filter(f=>f.valores.length>1).map(f=>f.campo);
 const nombreSerie=r=>(dimensiones.length?dimensiones.map(c=>r[c]):[r.geografia]).join(' · ');
 const visibles=filas.filter(r=>r.valor!=null),porAnio=new Map();
 for(const r of visibles){if(!porAnio.has(r.anio))porAnio.set(r.anio,[]);porAnio.get(r.anio).push(r);}
 const total=(T.muestra_casos||[]).filter(c=>(porAnio.get(c.anio)||[]).some(r=>
  (r.geografia==='Argentina'||r.geografia===c.geografia||r.geografia===c.region)&&
  (r.genero==='Ambos sexos'||r.genero===c.genero)&&
  (r.edad==='Todas las edades'||r.edad===c.edad))).reduce((s,r)=>s+r.n,0);
 p.dataset.nTotal=String(total);
 grafico(p,filas.map(r=>({...r,anio:r.anio,serie:nombreSerie(r),valor:r.valor})),{unidad:ind==='Casos'?'casos':'por 100.000 habitantes',decimales:ind==='Casos'?0:1,tooltips:'categoria'});
 const fijos=filtrosSeries.filter(f=>f.valores.length===1).map(f=>`${f.etiqueta}: ${f.valores[0]}`);
 const comunes=nodo('p',fijos.length?fijos.join(' · '):'Comparación por geografía, sexo y edad.','contexto-series');
 comunes.setAttribute('aria-label','Filtros comunes a todas las series');
 const leyenda=p.querySelector('.leyenda');p.insertBefore(comunes,leyenda||p.querySelector('.muestra-n'));
 // Si todos los filtros son únicos, la línea neutra identifica la única serie.
 if(leyenda&&!dimensiones.length)leyenda.hidden=true;
 const m=panel(grid,'Casos de VIH por provincia'),cm=controles(m),prov=T.casos.filter(r=>r.nivel==='Provincial');
 const im=filtro(cm,prov,'indicador','Indicador del mapa','im','Tasa por 100.000 habitantes'),am=filtro(cm,prov,'anio','Año','am',anios.at(-1)),sm=filtro(cm,prov,'genero','Sexo','sm','Ambos sexos'),em=filtro(cm,prov,'edad','Grupo de edad','em','Todas las edades',false,edades);
 m.querySelector('h3').textContent=im==='Casos'?'Casos de VIH por provincia':'Tasas de VIH por provincia (por 100.000 habitantes)';
 mapa(m,prov.filter(r=>r.indicador===im&&r.anio===am&&r.genero===sm&&r.edad===em),'valor',im==='Casos'?'':' por 100 mil',colorMapa(sm));
}
function seccionGeografia(host){const c=controles(host),s=filtro(c,T.regiones,'genero','Género','s','Todos los géneros',false,generos),e=filtro(c,T.regiones,'edad','Grupo de edad','e','Todas las edades',false,edades),a=filtro(c,T.provincias,'anio','Año del mapa y ranking','a',anios.at(-1));
 const g=layout(host),p=panel(g,'Distribución de diagnósticos de VIH por región');grafico(p,T.regiones.filter(r=>r.genero===s&&r.edad===e).map(r=>({...r,anio:r.anio,serie:r.serie,valor:r.valor})),{tipo:'apilado',porcentaje:true,ordenSeries:regiones});
 const m=panel(g,'Participación provincial en los diagnósticos de VIH');mapa(m,T.provincias.filter(r=>r.genero===s&&r.edad===e&&r.anio===a&&r.indicador==='Porcentaje'),'valor','%',colorMapa(s));m.append(nodo('p','Porcentaje sobre el total de diagnósticos de las provincias con residencia conocida, según los filtros elegidos.','nota'));}
function seccionGenero(host){
 const c=controles(host),g=filtro(c,[...T.genero,...T.edad],'geografia','Unidad geográfica','g','Argentina',false,geos);
 const geografia=crearBandaFiltros(c,'Geografía de los cuatro gráficos','Selección compartida');geografia.classList.add('geografia-demografia');host.append(geografia);
 const grid=nodo('div',null,'demografia-bloques');host.append(grid);
 const bloque=(clase,titulo)=>{const n=nodo('section',null,`bloque-demografia ${clase}`),cabecera=nodo('div',null,'cabecera-demografia');cabecera.append(nodo('h2',titulo));const indicadores=nodo('aside',null,'indicadores-demografia');indicadores.setAttribute('aria-label',`Filtros e indicadores de ${titulo.toLowerCase()}`);n.append(cabecera,indicadores);grid.append(n);return {n,cabecera,indicadores};};
 const izquierda=bloque('bloque-genero','Género'),derecha=bloque('bloque-edad','Edad');
 const cg=controles(izquierda.indicadores),e=filtro(cg,T.genero,'edad','Grupo de edad','e','Todas las edades',false,edades);
 const ce=controles(derecha.indicadores),s=filtro(ce,T.edad,'genero','Género','s','Todos los géneros',false,generos);
 izquierda.indicadores.append(crearBandaFiltros(cg,'Filtrar los gráficos de género','Grupo de edad'));
 derecha.indicadores.append(crearBandaFiltros(ce,'Filtrar los gráficos de edad','Género'));
 const ultimo=anios.at(-1),pct=v=>typeof v==='number'&&Number.isFinite(v)?exacto(v,1)+'%':'Sin datos';
 const generoActual=T.genero.filter(r=>r.geografia===g&&r.edad===e&&r.anio===ultimo),razonActual=T.razon.find(r=>r.geografia===g&&r.edad===e&&r.anio===ultimo);
 const edadActual=T.edad.filter(r=>r.geografia===g&&r.genero===s&&r.anio===ultimo),mediana=T.mediana.find(r=>r.geografia===g&&r.genero===s&&r.anio===ultimo),grupo=[...edadActual].filter(r=>r.serie!=='Todas las edades'&&Number.isFinite(r.valor)).sort((a,b)=>b.valor-a.valor)[0];
 const mayores=edadActual.filter(r=>['55-64','65 o más'].includes(r.serie)),sumaMayores=mayores.length&&mayores.every(r=>Number.isFinite(r.valor))?mayores.reduce((a,r)=>a+r.valor,0):null;
 // 10–19 años comprende ambos grupos quinquenales; no asumir cero si falta alguno.
 const adolescentes=['10-14','15-19'].map(serie=>edadActual.find(r=>r.serie===serie)),sumaAdolescentes=adolescentes.every(r=>Number.isFinite(r?.valor))?adolescentes.reduce((a,r)=>a+r.valor,0):null;
 const resumenG=nodo('section',null,'resumen-indicadores'),resumenE=nodo('section',null,'resumen-indicadores');resumenG.setAttribute('aria-label','Resumen de género');resumenE.setAttribute('aria-label','Resumen de edad');
 izquierda.indicadores.append(resumenG);derecha.indicadores.append(resumenE);
 tarjetaResumen(resumenG,`Proporción de varones · ${ultimo}`,pct(generoActual.find(r=>r.serie==='Varón')?.valor),`${g} · ${e}`);
 tarjetaResumen(resumenG,`Proporción de mujeres · ${ultimo}`,pct(generoActual.find(r=>r.serie==='Mujer')?.valor),'Otras categorías permanecen en el gráfico');
 tarjetaResumen(resumenG,`Razón varones / mujeres · ${ultimo}`,exacto(razonActual?.valor,1),'Cociente de diagnósticos');
 tarjetaResumen(resumenE,`Mediana de edad · ${ultimo}`,Number.isFinite(mediana?.valor)?exacto(mediana.valor,0)+' años':'Sin datos',`${g} · ${s}`);
 tarjetaResumen(resumenE,'Grupo de edad más frecuente',grupo?.serie||'Sin datos',grupo?pct(grupo.valor)+' de los diagnósticos':'Sin datos');
 tarjetaResumen(resumenE,`Proporción de 10 a 19 años · ${ultimo}`,pct(sumaAdolescentes),'Distribución por edad');
 tarjetaResumen(resumenE,`Proporción de 55 años o más · ${ultimo}`,pct(sumaMayores),'Distribución por edad');
 const generar=(host,titulo,filas,opciones,tendencia=false)=>{
  const p=panel(host,titulo);p.classList.add(tendencia?'demografia-tendencia':'demografia-distribucion');grafico(p,filas,opciones);
  const cabecera=nodo('div',null,'demografia-titulo'),acciones=p.querySelector('.acciones-datos');cabecera.append(p.querySelector('h3'));
  if(acciones){const csv=acciones.lastElementChild;csv.textContent='CSV';csv.setAttribute('aria-label','Descargar CSV');cabecera.append(acciones);}p.prepend(cabecera);
  const pie=nodo('div',null,'demografia-pie');for(const selector of ['.leyenda','.muestra-n']){const elemento=p.querySelector(selector);if(elemento)pie.append(elemento);}p.append(pie);
 };
 generar(izquierda.n,'Proporción de diagnósticos de VIH por género',T.genero.filter(r=>r.geografia===g&&r.edad===e),{tipo:'apilado',porcentaje:true,ordenSeries:['Mujer','Varón',...uniq(T.genero.map(r=>r.serie)).filter(v=>!['Mujer','Varón'].includes(v))],coloresSeries:{'Mujer':colores[0],'Varón':colores[3],'Mujer trans':colores[1],'Otro':colores[2],'Varón trans':colores[4]}});
 generar(izquierda.n,'Razón varones / mujeres en diagnósticos de VIH',T.razon.filter(r=>r.geografia===g&&r.edad===e).map(r=>({...r,serie:'Razón varones / mujeres'})),{tipo:'puntos'},true);
 generar(derecha.n,'Distribución de diagnósticos de VIH por edad',T.edad.filter(r=>r.geografia===g&&r.genero===s),{tipo:'apilado',porcentaje:true,ordenSeries:edades});
 generar(derecha.n,'Mediana de edad al diagnóstico de VIH',T.mediana.filter(r=>r.geografia===g&&r.genero===s).map(r=>({...r,serie:'Mediana de edad'})),{unidad:'años',decimales:0,tooltips:false},true);
 $('periodo').textContent=`Fuente: SNVS / SISA · Diagnósticos ${anios[0]}–${ultimo} · Datos actualizables por retraso de notificación`;
}
// Torta de 2025: porciones exactas según conteos y rótulos externos sin solapamiento.
function graficoViasTorta(host,filas){
 const total=filas.reduce((s,r)=>s+(r.n||0),0);
 if(!filas.length||!total){vacio(host);detalle(host,filas,{valorPorcentual:true});return;}
 const s=svg('svg',{class:'grafico torta',role:'img','aria-label':host.querySelector('h3').textContent});
 s.dibujar=(w,h)=>{
  s.setAttribute('viewBox',`0 0 ${w} ${h}`);s.replaceChildren();tituloSVG(s,host.querySelector('h3').textContent);
  const cx=w/2,cy=h/2,r=.75*Math.max(24,Math.min(w*.23,(h-60)/2)),externas=[],linea=15;
  const partir=(texto,ancho)=>{const limite=Math.max(10,Math.floor(ancho/6.8)),lineas=[];for(const palabra of texto.split(' ')){if(!lineas.length||lineas.at(-1).length+palabra.length+1>limite)lineas.push(palabra);else lineas[lineas.length-1]+=' '+palabra;}return lineas;};
  const rotulo=(x,y,lineas,ancla,clase,lado)=>{const t=svg('text',{x,y,'text-anchor':ancla,class:`valor-torta ${clase}`,...(lado?{'data-lado':lado}:{})});lineas.forEach((texto,i)=>t.append(svg('tspan',{x,dy:i?linea:0},texto)));s.append(t);};
  let angulo=-Math.PI/2;
  filas.forEach((fila,i)=>{
   const fraccion=fila.n/total,fin=angulo+2*Math.PI*fraccion,medio=(angulo+fin)/2,punto=(a,radio)=>[cx+radio*Math.cos(a),cy+radio*Math.sin(a)],inicio=punto(angulo,r),ultimo=punto(fin,r),porcentaje=exacto(fila.valor,1)+'%',color=colores[i%colores.length],nombre=textoVisible(abreviarVia(fila.serie));
   if(fraccion>0){const porcion=fraccion>=1-1e-10?svg('circle',{cx,cy,r}):svg('path',{d:`M${cx},${cy}L${inicio[0]},${inicio[1]}A${r},${r} 0 ${fraccion>.5?1:0} 1 ${ultimo[0]},${ultimo[1]}Z`});
    porcion.setAttribute('class','porcion-torta');porcion.setAttribute('fill',color);porcion.setAttribute('stroke','#242c50');porcion.setAttribute('stroke-width','1');porcion.setAttribute('tabindex','0');porcion.setAttribute('aria-label',`${fila.serie}: ${porcentaje} · n = ${fmt(fila.n,0)}`);tituloSVG(porcion,porcion.getAttribute('aria-label'));s.append(porcion);
   }
   const internas=[...partir(nombre,Math.min(175,r*.8)),porcentaje],anchoInterior=Math.max(...internas.map(t=>t.length))*6.8;
   if(fraccion>=.14&&internas.length*linea<=r*.5&&2*r*.52*Math.sin(Math.min(Math.PI,fin-angulo)/2)>anchoInterior+14){
    const [x,y]=punto(medio,r*.52);rotulo(x,y-(internas.length-1)*linea/2+4,internas,'middle','interior');
   }else{const lado=Math.cos(medio)>=0?1:-1,anchoExterior=Math.max(65,w/2-r-46),lineas=[...partir(nombre,anchoExterior),porcentaje];externas.push({lado,origen:fraccion>0?punto(medio,r*.98):null,codo:punto(medio,r+10),y:cy+(r+15)*Math.sin(medio),lineas,alto:lineas.length*linea,color});}
   angulo=fin;
  });
  for(const lado of [-1,1]){
   const etiquetas=externas.filter(e=>e.lado===lado).sort((a,b)=>a.y-b.y),min=8,max=h-8,separacion=8;
   etiquetas.forEach((e,i)=>e.y=Math.max(e.y,min+e.alto/2,i?etiquetas[i-1].y+etiquetas[i-1].alto/2+separacion+e.alto/2:min));
   for(let i=etiquetas.length-1;i>=0;i--)etiquetas[i].y=Math.min(etiquetas[i].y,i===etiquetas.length-1?max-etiquetas[i].alto/2:etiquetas[i+1].y-etiquetas[i+1].alto/2-separacion-etiquetas[i].alto/2);
   etiquetas.forEach(e=>{const x=cx+lado*(r+27);if(e.origen)s.append(svg('polyline',{points:`${e.origen.join(',')} ${e.codo.join(',')} ${x},${e.y}`,fill:'none',stroke:e.color,'stroke-width':1.4,class:'linea-torta'}));rotulo(x+lado*5,e.y-(e.lineas.length-1)*linea/2+4,e.lineas,lado>0?'start':'end','exterior',lado);});
  }

 };
 s.dibujar(720,390);host.append(s);detalle(host,filas,{valorPorcentual:true});
}
function seccionVias(host){
 const c=controles(host),g=filtro(c,T.vias,'geografia','Unidad geográfica','g','Argentina',false,geos),s=filtro(c,T.vias,'genero','Género · torta 2025','s','Varón',false,generos),e=filtro(c,T.vias,'edad','Grupo de edad · torta 2025','e','Todas las edades',false,edades);
 const varones=T.vias.filter(r=>r.geografia===g&&r.genero==='Varón'&&edades.slice(1).includes(r.edad)),a=s==='Varón'?filtro(c,varones,'anio','Año · varones por edad','a',anios.at(-1)):null;
 const disponibles=T.vias.filter(r=>r.geografia===g&&r.genero===s&&r.edad===e&&r.anio===2025),grid=layout(host,s==='Varón'?'dos':'una vias-acotadas');
 graficoViasTorta(panel(grid,'Vías de transmisión en diagnósticos de VIH · 2025'),disponibles);
 if(s!=='Varón')return;
 const p=panel(grid,`Vías de transmisión en diagnósticos de VIH en varones · por edad · ${a??'sin año disponible'}`);
 grafico(p,varones.filter(r=>r.anio===a).map(r=>({...r,anio:r.edad,serie:r.serie,valor:r.valor})),{tipo:'apilado',porcentaje:true,ordenX:edades.slice(1),alto:390});
 p.insertBefore(nodo('p','Varones. Cada barra representa el 100% de las vías informadas en ese grupo de edad; los grupos sin casos se muestran sin barra.','nota'),p.lastElementChild);
}
function seccionDiagnostico(host){
 const c=controles(host),g=filtro(c,T.diagnostico,'geografia','Unidad geográfica · todos los gráficos','g','Argentina',false,geos),s=filtro(c,T.diagnostico,'genero','Género · evolución y por edad','s','Todos los géneros',false,generos),e=filtro(c,T.diagnostico,'edad','Grupo de edad · evolución, por género y por vía','e','Todas las edades',false,edades);
 const rutas=(T.diagnostico_vias||[]).filter(r=>r.geografia===g&&r.edad===e&&/^(Prácticas sexuales|Uso compartido de equipo de inyección)/.test(r.via)),a=s==='Varón'&&rutas.length?filtro(c,rutas,'anio','Año · varones por vía','a',anios.at(-1)):null;
 const grid=layout(host,s==='Varón'?'diagnostico-evolucion diagnostico-con-vias':'diagnostico-evolucion');
 const izquierda=layout(grid,'diagnostico-izquierda');
 const datos=T.diagnostico.filter(r=>r.geografia===g);
 const hist=datos.filter(r=>r.genero===s&&r.edad===e),ultimos=anios.slice(-4);
 const periodo=`${ultimos[0]}–${ultimos.at(-1)}`;
 const p=panel(izquierda,'Evolución anual del diagnóstico de VIH');
 p.classList.add('diagnostico-anual');
 p.querySelector('h3').append(nodo('small',` ${g} · ${s} · ${e} · ${periodo}`));
 const porEdad=panel(grid,'Diagnóstico tardío de VIH por edad');
 porEdad.querySelector('h3').append(nodo('small',` ${g} · ${s} · Bienios ${periodo}`));
 const porGenero=panel(grid,'Diagnóstico tardío de VIH por género');
 porGenero.classList.add('diagnostico-por-genero');
 porGenero.querySelector('h3').append(nodo('small',` ${g} · ${e} · Bienios ${periodo}`));
 graficoDiagnosticoBienios(porEdad,datos.filter(r=>r.genero===s),'edad',edades.slice(1),ultimos);
 graficoDiagnosticoBienios(porGenero,datos.filter(r=>r.edad===e),'genero',generos.slice(1),ultimos);
 const barras=filas=>filas.flatMap(r=>[{...r,anio:r.anio,serie:'Diagnóstico tardío (incluye avanzada)',valor:r.tardio},{...r,anio:r.anio,serie:'Enfermedad avanzada',valor:r.avanzada}]);
 const anual=hist.filter(r=>ultimos.includes(r.anio));
 grafico(p,barras(anual),{tipo:'barras',porcentaje:true,alto:390,separacionBarras:6,datosDetalle:anual});
 const nota=nodo('span','Porcentajes sobre casos con dato de oportunidad diagnóstica.','nota');
 if(s==='Varón'){nota.prepend(' · ');p.querySelector('.muestra-n').append(nota);}
 pieDiagnostico(p);
 if(s!=='Varón'){p.append(nota);return;}
 const q=panel(izquierda,'Diagnóstico de VIH por vía de transmisión');
 q.querySelector('h3').append(nodo('small',` ${g} · Varones · ${e} · ${a??'sin año disponible'}`));
 graficoDiagnosticoVias(q,rutas.filter(r=>r.anio===a));
 pieDiagnostico(q);
 q.append(nodo('p','Porcentajes sobre casos con dato de oportunidad diagnóstica en cada vía.','nota'));
}
function pieDiagnostico(host){
 const pie=layout(host,'diagnostico-pie');
 pie.append(host.querySelector('.muestra-n'),host.querySelector('.acciones-datos'));
}
function graficoDiagnosticoBienios(host,datos,campo,grupos,periodo){
 const bienios=[periodo.slice(0,2),periodo.slice(2,4)].filter(b=>b.length);
 const filas=grupos.flatMap(grupo=>bienios.map(bienio=>{
  const parte=datos.filter(r=>r[campo]===grupo&&bienio.includes(r.anio));
  const n=parte.reduce((s,r)=>s+r.validos,0),total=parte.reduce((s,r)=>s+r.total,0);
  const insuficiente=!(total>0&&n/total>=.6);
  // Los paquetes anteriores conservan solo los porcentajes anuales redondeados.
  const tasa=campo=>insuficiente?null:parte.reduce((s,r)=>
   s+(r[`casos_${campo}`]!=null?100*r[`casos_${campo}`]:r.validos*(porcentajesDT.get(r)[campo]??0)),0)/n;
  const tardio=tasa('tardio'),avanzada=tasa('avanzada');
  return {grupo,bienio:bienio.join('–'),n,total,insuficiente,tardio,avanzada,noAvanzado:insuficiente?null:tardio-avanzada};
 }));
 const h=host.querySelector('h3');
 const series=['Tardío no avanzado','Enfermedad avanzada'];
 const porcentaje=v=>exacto(v,1)+'%';
 const s=svg('svg',{class:'grafico grafico-bienios',role:'img','aria-label':h.textContent});
 s.dibujar=(w,alto)=>{
  const L=w<400?138:152,R=52,U=3,B=20,ancho=Math.max(1,w-L-R),fin=alto-B;
  const pasoGrupo=(fin-U)/grupos.length;
  const pasoBienio=Math.max(0,Math.min(21,(pasoGrupo-4)/bienios.length));
  const barra=Math.max(0,Math.min(18,pasoBienio-2)),x=v=>L+ancho*v/100;
  s.setAttribute('viewBox',`0 0 ${w} ${alto}`);
  s.replaceChildren();
  for(const v of [0,25,50,75,100]){
   s.append(svg('line',{x1:x(v),x2:x(v),y1:U,y2:fin,class:'rejilla'}),
    svg('text',{x:x(v),y:alto-4,'text-anchor':'middle'},v+'%'));
  }
  filas.forEach((f,i)=>{
   const grupo=Math.floor(i/bienios.length),bienio=i%bienios.length;
   const centro=U+(grupo+.5)*pasoGrupo,y=centro+(bienio-(bienios.length-1)/2)*pasoBienio;
   if(!bienio){
    const separador=U+grupo*pasoGrupo;
    if(grupo)s.append(svg('line',{x1:0,x2:w,y1:separador,y2:separador,class:'rejilla'}));
    s.append(svg('text',{x:0,y:centro+3,class:'grupo-bienio'},f.grupo));
   }
   s.append(svg('text',{x:L-7,y:y+3,'text-anchor':'end',class:'periodo-bienio'},f.bienio));
   if(f.insuficiente){
    s.append(svg('text',{x:L+5,y:y+3,class:'sin-datos-suficientes'},f.total?'Sin datos suficientes':'Sin datos'));
    return;
   }
   const etiqueta=`${f.grupo} · ${f.bienio} · ${series[0]} ${porcentaje(f.noAvanzado)} · ${series[1]} ${porcentaje(f.avanzada)} · Total tardío ${porcentaje(f.tardio)} · n = ${fmt(f.n,0)}`;
   const g=svg('g',{tabindex:0,role:'img','aria-label':textoVisible(etiqueta)});
   tituloSVG(g,etiqueta);
   [[0,f.noAvanzado],[f.noAvanzado,f.avanzada]].forEach(([inicio,valor],j)=>{
    const pixeles=x(valor)-L;
    g.append(svg('rect',{x:x(inicio),y:y-barra/2,width:pixeles,height:barra,fill:colores[j]}));
    if(pixeles>=35&&barra>=11)g.append(svg('text',{x:x(inicio+valor/2),y:y+3,'text-anchor':'middle',class:'valor-bienio'},porcentaje(valor)));
   });
   g.append(svg('text',{x:x(f.tardio)+5,y:y+3,class:'total-bienio'},porcentaje(f.tardio)));
   s.append(g);
  });
 };
 s.dibujar(660,grupos.length*34+23);
 host.append(s);
 leyenda(host,series);
 host.querySelector('.leyenda').append(nodo('span','% al final: diagnóstico tardío total'));
 host.dataset.nTotal=filas.reduce((s,f)=>s+(f.insuficiente?0:f.n),0);
 detalle(host,filas.map(({grupo,bienio,n,total,tardio,avanzada,noAvanzado})=>({
  [campo==='edad'?'Grupo de edad':'Género']:grupo,Bienio:bienio,'n válido':n,'Casos totales':total,
  'Tardío no avanzado (%)':noAvanzado,'Enfermedad avanzada (%)':avanzada,'Diagnóstico tardío (%)':tardio
 })));
 pieDiagnostico(host);
}
function graficoDiagnosticoVias(host,filas){
 if(!filas.length){vacio(host);detalle(host,filas);return;}
 const abreviar=v=>({'Prácticas sexuales con mujeres sin protección':'Sexual con mujeres','Prácticas sexuales con varones sin protección':'Sexual con varones','Prácticas sexuales con trans sin protección':'Sexual con personas trans','Uso compartido de equipo de inyección en los últimos 10 años':'Equipo de inyección compartido'})[v]||v;
 const lista=nodo('div',null,'diagnostico-vias');
 filas.forEach(r=>{const fila=nodo('div',null,'via-diagnostico');if(r.insuficiente){fila.append(nodo('span',abreviar(r.via),'via-nombre'),nodo('span','Sin datos suficientes','aviso-insuficiente'));lista.append(fila);return;}const nombre=nodo('span',abreviar(r.via),'via-nombre');nombre.title=r.via;fila.append(nombre);
 const barras=nodo('div',null,'via-barras');[['tardio','Diagnóstico tardío',colores[0]],['avanzada','Enfermedad avanzada',colores[1]]].forEach(([campo,etiqueta,color])=>{const linea=nodo('div',null,'via-metrica'),pista=nodo('div',null,'via-pista'),barra=nodo('i'),valor=nodo('strong',r.insuficiente?'Sin datos suficientes':r[campo]==null?'Sin datos':exacto(r[campo],1)+'%');barra.style.width=`${r[campo]??0}%`;barra.style.background=color;pista.append(barra);linea.append(pista,valor);linea.setAttribute('role','img');linea.setAttribute('aria-label',`${r.via} · ${etiqueta}: ${valor.textContent} (${r.validos} casos con dato)`);barras.append(linea);});fila.append(barras);lista.append(fila);});host.append(lista);
 leyenda(host,['Diagnóstico tardío (incluye avanzada)','Enfermedad avanzada']);detalle(host,filas);
}
function seccionMapasDiagnostico(host){
 const c=controles(host),r=filtro(c,[{region:'Argentina'},...regiones.map(region=>({region}))],'region','Región del mapa','r','Argentina',false,['Argentina',...regiones]),s=filtro(c,T.diagnostico,'genero','Género','s','Todos los géneros',false,generos),e=filtro(c,T.diagnostico,'edad','Grupo de edad','e','Todas las edades',false,edades),a=filtro(c,T.diagnostico,'anio','Año','a',anios.at(-1));
 const fuente=r==='Argentina'?T.diagnostico:(T.diagnostico_regional||[]).filter(x=>x.region===r),grid=layout(host),prov=fuente.filter(x=>x.genero===s&&x.edad===e&&x.anio===a).map(paraMapaDT);
 mapa(panel(grid,`Diagnóstico tardío de VIH por jurisdicción · ${r}`),prov,'tardio','%',colorMapa(s),r);mapa(panel(grid,`Enfermedad avanzada al diagnóstico de VIH por jurisdicción · ${r}`),prov,'avanzada','%',colorMapa(s,true),r);
}
const sexosSifilis=['Varones','Mujeres','Sin clasificación en F/M'];
const coloresSifilis={'Ambos sexos':'#446bb6',Varones:'#4c94f1',Mujeres:'#24b5aa','Sin clasificación en F/M':'#a7b1c2'};
function selectorSifilis(c,campo,opciones,etiqueta,inicial){
 return filtro(c,opciones.map(valor=>({[campo]:valor})),campo,etiqueta,campo,inicial,false,opciones);
}
function pieSifilis(p,n,lugar,nota){
 const partes=[`n = ${exacto(n,0)}`,'Fuente: SNVS',`Exportación: ${sifilis.exportacion}`];
 p.append(nodo('p',partes.join(' · '),'nota pie-sifilis'));
 if(sifilis.regiones[lugar])p.append(nodo('p',`Jurisdicciones: ${sifilis.regiones[lugar].join(', ')}`,'nota'));
 if(nota)p.append(nodo('p',nota,'nota'));
}
function etiquetaEdadSifilis(edad){
 if(edad==='Todas las edades')return '10 años o más';
 if(edad==='65 o más')return '65 años o más';
 return edad+' años';
}
function resumenSifilis(host,fila){
 const resumen=nodo('section',null,'resumen-indicadores resumen-sifilis');
 resumen.setAttribute('aria-label','Indicadores principales de sífilis');
 const contexto=`${fila.geografia} · ${fila.anio} · ${fila.sexo} · ${etiquetaEdadSifilis(fila.edad)}`;
 tarjetaResumen(resumen,'Tasa de sífilis por 100.000 habitantes',exacto(fila.tasa,1),contexto);
 tarjetaResumen(resumen,'Casos de sífilis notificados',exacto(fila.casos,0),contexto);
 host.prepend(resumen);
}
function evolucionSifilis(host,{medida,sexo,lugar,edad}){
 const p=panel(host,'');
 p.classList.add('panel-evolucion-sifilis');
 const tasa=medida==='Tasas',series=sexo==='Por sexo'?sexosSifilis.slice(0,2):[sexo];
 const filas=sifilis.datos.filter(r=>r.geografia===lugar&&r.edad===edad&&series.includes(r.sexo));
 p.querySelector('h3').textContent=`${tasa?'Evolución de la tasa de sífilis por 100.000 habitantes':'Evolución de los casos de sífilis'} · ${lugar} · ${sexo.toLowerCase()} · ${etiquetaEdadSifilis(edad)} · ${sifilis.anios[0]}–${sifilis.anios.at(-1)}`;
 p.dataset.nTotal=filas.reduce((n,r)=>n+r.casos,0);
 grafico(p,filas.map(r=>({anio:r.anio,serie:r.sexo,valor:tasa?r.tasa:r.casos})),{
  tipo:'barras',unidad:tasa?'por 100.000 habitantes':'casos',decimales:tasa?1:0,
  ordenSeries:series,coloresSeries:coloresSifilis,datosDetalle:filas
 });
 p.querySelector('.muestra-n').remove();
 alinearAccionesGrafico(p);
 pieSifilis(p,Number(p.dataset.nTotal),lugar,tasa&&sexo==='Por sexo'?'Las tasas por sexo usan los casos y la población de mujeres y varones.':'');
}
function distribucionSifilis(host,{anio,lugar}){
 const p=panel(host,'');
 const filas=sexosSifilis.map(s=>sifilis.datos.find(r=>r.geografia===lugar&&r.anio===anio&&r.edad==='Todas las edades'&&r.sexo===s));
 const total=filas.reduce((n,r)=>n+r.casos,0);
 const titulo=`Porcentaje de casos de sífilis según sexo registrado · ${lugar} · ${anio} · 10 años o más`;
 p.querySelector('h3').textContent=titulo;
 if(!total){vacio(p);pieSifilis(p,0,lugar);return;}
 const contenido=nodo('div',null,'distribucion-sifilis');
 const s=svg('svg',{viewBox:'-12 -12 264 264',role:'img','aria-label':titulo});
 const leyenda=nodo('ul',null,'leyenda-sifilis');
 const rotulos=[];
 let avance=0,pequenos=0;
 for(const filaSexo of filas){
  const porcentaje=filaSexo.casos/total*100,color=coloresSifilis[filaSexo.sexo];
  const valor=`${exacto(porcentaje,1)}%`,etiqueta=`${filaSexo.sexo} · ${valor} · ${exacto(filaSexo.casos,0)} casos`;
  if(porcentaje>0){
   s.append(tituloSVG(svg('circle',{cx:120,cy:120,r:83,fill:'none',stroke:color,'stroke-width':48,
    pathLength:100,'stroke-dasharray':`${porcentaje} ${100-porcentaje}`,
    'stroke-dashoffset':-avance,transform:'rotate(-90 120 120)'}),etiqueta));
   const angulo=(avance+porcentaje/2)*Math.PI/50-Math.PI/2;
   const punto=r=>[120+r*Math.cos(angulo),120+r*Math.sin(angulo)];
   let [x,y]=punto(83);
   if(porcentaje<8){
    const [inicioX,inicioY]=punto(108),[codoX,codoY]=punto(116);
    const lado=pequenos++%2===0?1:-1;
    x=Math.max(18,Math.min(222,codoX+lado*32));y=Math.max(0,Math.min(240,codoY));
    rotulos.push(svg('polyline',{points:`${inicioX},${inicioY} ${codoX},${codoY} ${x},${y}`,fill:'none',stroke:color,'stroke-width':1.2}));
    y-=5;
   }
   rotulos.push(svg('text',{x,y:y+4,'text-anchor':'middle',class:'porcentaje-sifilis'},valor));
  }
  avance+=porcentaje;
  const fila=nodo('li'),marca=nodo('i');marca.style.background=color;
  fila.append(marca,document.createTextNode(filaSexo.sexo));leyenda.append(fila);
 }
 s.append(...rotulos);
 contenido.append(s,leyenda);p.append(contenido);
 pieSifilis(p,total,lugar);
}
function alinearAccionesGrafico(p){
 const leyenda=p.querySelector('.leyenda'),acciones=p.querySelector('.acciones-datos');
 if(!acciones)return;
 const pie=layout(p,'pie-grafico');
 if(leyenda)pie.append(leyenda);
 pie.append(acciones);
}
function regionesSifilis(host,{medida,anio,sexo,edad}){
 const tasa=medida==='Tasas',porSexo=sexo==='Por sexo';
 const series=porSexo?sexosSifilis.slice(0,2):['Ambos sexos'];
 const coloresRegion={Centro:'#4c94f1',Cuyo:'#a187e4',NEA:'#2fa998',NOA:'#d86286',Patagonia:'#679846',Argentina:'#bf782d'};
 const lugares=Object.keys(coloresRegion);
 const filas=sifilis.datos.filter(r=>r.anio===anio&&r.edad===edad&&lugares.includes(r.geografia)&&series.includes(r.sexo));
 const p=panel(host,`${tasa?'Tasas de sífilis por 100.000 habitantes':'Casos de sífilis'} por región · ${anio} · ${etiquetaEdadSifilis(edad)} · ${sexo.toLowerCase()}`);
 const barras=filas.map(r=>({anio:r.geografia,serie:r.sexo,valor:tasa?r.tasa:r.casos,
  color:r.sexo==='Mujeres'?`color-mix(in srgb, ${coloresRegion[r.geografia]}, white 48%)`:coloresRegion[r.geografia]}));
 const datosDetalle=filas.map(({geografia,sexo,casos,tasa:valor,poblacion})=>
  tasa?{geografia,sexo,tasa:valor,poblacion}:{geografia,sexo,casos});
 grafico(p,barras,{tipo:'barras',unidad:tasa?'por 100.000 habitantes':'casos',decimales:tasa?1:0,
  ordenX:lugares,ordenSeries:series,coloresSeries:{Varones:'#73849d',Mujeres:'#bfccd9'},datosDetalle});
 if(!porSexo)p.querySelector('.leyenda')?.remove();
 p.querySelector('.muestra-n').remove();
 alinearAccionesGrafico(p);
 const total=filas.filter(r=>r.geografia==='Argentina').reduce((n,r)=>n+r.casos,0);
 pieSifilis(p,total,'Argentina');
}
function edadSifilis(host,{medida,anio,lugar,sexo}){
 const p=panel(host,'');
 p.classList.add('panel-edad-sifilis');
 const tasa=medida==='Tasas',porSexo=sexo==='Por sexo';
 const series=porSexo?sexosSifilis.slice(0,2):['Ambos sexos'];
 const grupos=[...sifilis.edades.filter(e=>e!=='10-14'),'Todas las edades'];
 const datos=sifilis.datos.filter(r=>r.geografia===lugar&&r.anio===anio&&series.includes(r.sexo));
 const filas=grupos.flatMap(edad=>series.map(sexo=>datos.find(r=>r.edad===edad&&r.sexo===sexo)));
 p.querySelector('h3').textContent=`${tasa?'Tasas de sífilis por 100.000 habitantes':'Casos de sífilis'} por edad · ${lugar} · ${anio} · ${sexo.toLowerCase()}`;
 const etiquetaGrupo=edad=>edad==='Todas las edades'?'Todas':edad==='65 o más'?'65+':edad;
 const barras=filas.map(r=>({anio:etiquetaGrupo(r.edad),serie:r.sexo,valor:tasa?r.tasa:r.casos,
  color:r.edad==='Todas las edades'?(r.sexo==='Mujeres'?'#ffcb71':'#bf782d'):null}));
 const datosDetalle=filas.map(({edad,sexo,tasa:valor,poblacion,casos})=>
  tasa?{edad,sexo,tasa:valor,poblacion}:{edad,sexo,casos});
 grafico(p,barras,{tipo:'barras',unidad:tasa?'por 100.000 habitantes':'casos',decimales:tasa?1:0,
  ordenX:grupos.map(etiquetaGrupo),ordenSeries:series,coloresSeries:coloresSifilis,datosDetalle});
 p.querySelector('.muestra-n').remove();
 alinearAccionesGrafico(p);
 const total=datos.filter(r=>r.edad==='Todas las edades').reduce((n,r)=>n+r.casos,0);
 pieSifilis(p,total,lugar,'Todas las edades incluye el grupo de 10–14 años y los diagnósticos sin edad informada.');
}
function mapaSifilis(host,{medida,sexo,anio,edad}){
 const tasa=medida==='Tasas',series=sexo==='Por sexo'?sexosSifilis.slice(0,2):['Ambos sexos'];
 const datos=sifilis.datos.filter(r=>sifilis.provincias.includes(r.geografia)&&r.anio===anio&&
  r.edad===edad&&series.includes(r.sexo));
 const maximo=Math.max(1,...datos.map(r=>tasa?r.tasa:r.casos));
 const coloresEdad=['#237bd1','#8d57b8','#158f84','#ce6c2d','#69862c','#c5507b','#7765d4','#a95843'];
 const coloresEdadMujeres=['#168c7a','#c95d48','#a74d9b','#357ecb','#a458a3','#648734','#bd772d','#3187a5'];
 const ordenEdad=['Todas las edades',...sifilis.edades.filter(e=>e!=='10-14')];
 const indiceEdad=Math.max(0,ordenEdad.indexOf(edad));
 const p=panel(host,`${tasa?'Tasas de sífilis por 100.000 habitantes':'Casos de sífilis'} por jurisdicción · ${anio} · ${etiquetaEdadSifilis(edad)} · ${sexo.toLowerCase()}`);
 p.classList.add('panel-mapa-sifilis');
 const mapas=layout(p,'mapas-sifilis');
 if(series.length>1)mapas.classList.add('mapas-sifilis-por-sexo');
 for(const serie of series){
  const marco=nodo('div',null,'mapa-sifilis');
  mapas.append(marco);
  if(series.length>1)marco.append(nodo('h4',serie));
  const color=(serie==='Mujeres'?coloresEdadMujeres:coloresEdad)[indiceEdad];
  const filas=datos.filter(r=>r.sexo===serie).map(r=>({geografia:r.geografia,anio,valor:tasa?r.tasa:r.casos}));
  mapa(marco,filas,'valor',tasa?' por 100.000 habitantes':'',color,'Argentina',{soloMapa:true,maximo});
 }
}
function seccionSifilis(host){
 const banda=layout(host,'banda-filtros'),c=controles(banda);
 const medida=selectorSifilis(c,'indicador',['Tasas','Casos'],'Indicador','Tasas');
 const sexo=selectorSifilis(c,'genero',['Ambos sexos','Por sexo'],'Sexo','Ambos sexos');
 const anio=selectorSifilis(c,'anio',sifilis.anios,'Año',sifilis.anios.at(-1));
 const lugar=selectorSifilis(c,'geografia',['Argentina',...Object.keys(sifilis.regiones),...sifilis.provincias],'Ámbito geográfico','Argentina');
 const edadesSeleccionables=sifilis.edades.filter(e=>e!=='10-14');
 const edad=selectorSifilis(c,'edad',['Todas las edades',...edadesSeleccionables],'Grupo de edad','Todas las edades');
 resumenSifilis(host,sifilis.datos.find(r=>r.geografia===lugar&&r.edad===edad&&
  r.anio===anio&&r.sexo==='Ambos sexos'));
 const grilla=layout(host,'sifilis-columnas'),seleccion={medida,sexo,anio,lugar,edad};
 const izquierda=layout(grilla,'sifilis-izquierda');
 evolucionSifilis(izquierda,seleccion);distribucionSifilis(izquierda,seleccion);
 const centro=layout(grilla,'sifilis-centro');
 regionesSifilis(centro,seleccion);edadSifilis(centro,seleccion);
 mapaSifilis(grilla,seleccion);
}
function graficarTamizaje(p,filas,tasa,evolucion,ordenX){
 const datosDetalle=filas.map(({anio,grupo_edad,estudiadas,positivas,positividad})=>
  ({anio,grupo_edad,estudiadas,negativas:estudiadas==null||positivas>estudiadas?null:estudiadas-positivas,positivas,positividad}));
 const categoria=r=>evolucion?r.anio:r.grupo_edad==='Todas las edades'?'Todas':rotuloEdadTamizaje(r.grupo_edad);
 const totalEdad=r=>!evolucion&&r.grupo_edad==='Todas las edades';
 const valores=tasa?filas.map(r=>({anio:categoria(r),serie:'Positividad',valor:r.positividad,color:totalEdad(r)?'#bf782d':null})):
  datosDetalle.flatMap(r=>[{anio:categoria(r),serie:'Negativas',valor:r.negativas,color:totalEdad(r)?'#bf782d':null},
   {anio:categoria(r),serie:'Positivas',valor:r.negativas==null?null:r.positivas,color:totalEdad(r)?'#ffcb71':null}]);
 const lineaFija=tasa&&evolucion;
 grafico(p,valores,{
  tipo:tasa?(evolucion?'linea':'barras'):'apilado',porcentaje:tasa,maximoPorcentaje:null,unidad:tasa?'':'pruebas',
  decimales:tasa?1:0,ordenX,ordenSeries:tasa?null:['Negativas','Positivas'],
  coloresSeries:{Positividad:'#73d4ef',Negativas:'#446bb6',Positivas:'#168e85'},datosDetalle,rotularTotales:!tasa,
  proporcionFija:lineaFija,ancho:lineaFija?520:780,alto:lineaFija?260:390
 });
 const linea=lineaFija&&p.querySelector('svg.grafico');
 if(linea){
  linea.setAttribute('preserveAspectRatio','xMidYMid meet');
  const marco=nodo('div',null,'marco-positividad');
  linea.before(marco);
  marco.append(linea);
 }
 p.querySelector('.muestra-n').remove();
 alinearAccionesGrafico(p);
}
function rotuloEdadTamizaje(edad){
 return edad==='>= a 75'?'75+':edad.replace(' a ','–');
}
function evolucionTamizaje(host,tamizaje,poblacion,{tasa,lugar,edad}){
 const columna=layout(host,'tamizaje-poblacion');
 columna.append(nodo('h3',poblacion,'tamizaje-poblacion-titulo'));
 if(!tamizaje){vacio(columna);return;}
 const periodo=`${tamizaje.anios[0]}–${tamizaje.anios.at(-1)}`;
 const p=panel(columna,`Evolución de ${tasa?'la positividad en las':'las'} pruebas de tamizaje de sífilis · ${lugar} · ${rotuloEdadTamizaje(edad)} · ${periodo}`);
 p.classList.add('panel-tamizaje-sifilis','tamizaje-evolucion');
 const filas=tamizaje.datos.filter(r=>r.geografia===lugar&&(r.grupo_edad||'Todas las edades')===edad);
 graficarTamizaje(p,filas,tasa,true,tamizaje.anios);
}
function compararEdadTamizaje(host,tamizaje,{tasa,lugar,anio},gestantes=false){
 if(!tamizaje?.grupos?.length)return;
 const grupos=tamizaje.grupos.filter(g=>!gestantes||!['65 a 74','>= a 75'].includes(g));
 const p=panel(host,`${tasa?'Positividad en pruebas':'Pruebas'} de tamizaje de sífilis por grupo de edad · ${lugar} · ${anio}`);
 p.classList.add('panel-tamizaje-sifilis','tamizaje-comparacion-edad');
 const filas=tamizaje.datos.filter(r=>r.geografia===lugar&&r.anio===anio&&
  (r.grupo_edad==='Todas las edades'||grupos.includes(r.grupo_edad)));
 graficarTamizaje(p,filas,tasa,false,[...grupos.map(rotuloEdadTamizaje),'Todas']);
}
function seccionTamizajeSifilis(host){
 const tamizaje=sifilis.tamizaje;
 if(!tamizaje){vacio(host);return;}
 const c=controles(layout(host,'banda-filtros'));
 const indicador=selectorSifilis(c,'indicador_tamizaje',['Tasas','Casos'],'Indicador','Tasas');
 const lugar=selectorSifilis(c,'geografia',['Argentina',...Object.keys(sifilis.regiones),...sifilis.provincias],'Ámbito geográfico','Argentina');
 const grupos=tamizaje.grupos||[],tasa=indicador==='Tasas';
 const edad=grupos.length?selectorSifilis(c,'edad',['Todas las edades',...grupos],'Grupo de edad','Todas las edades'):'Todas las edades';
 const evoluciones=layout(host,'tamizaje-columnas'),gestantes=sifilis.tamizaje_gestantes;
 evolucionTamizaje(evoluciones,tamizaje,'Población general',{tasa,lugar,edad});
 evolucionTamizaje(evoluciones,gestantes,'Personas gestantes',{tasa,lugar,edad});
 if(grupos.length){
  const bandaEdad=layout(host,'banda-filtros filtro-anio-tamizaje');
  const anio=selectorSifilis(controles(bandaEdad),'anio',tamizaje.anios,'Año de las comparaciones por edad',tamizaje.anios.at(-1));
  const comparaciones=layout(host,'tamizaje-columnas'),filtros={tasa,lugar,anio};
  compararEdadTamizaje(comparaciones,tamizaje,filtros);
  compararEdadTamizaje(comparaciones,gestantes,filtros,true);
 }
 if(tasa)host.append(nodo('p','Positividad = pruebas positivas ÷ pruebas estudiadas × 100.','nota'));
 if(sifilis.regiones[lugar])host.append(nodo('p',`Jurisdicciones: ${sifilis.regiones[lugar].join(', ')}. El total regional suma los registros disponibles de cada año.`,'nota'));
}
function graficoCoinfeccion(p,filas,porSexo,medidas){
 const personas=medidas.includes('Personas'),proporciones=medidas.includes('Proporciones');
 const grupos=uniq(filas.map(r=>r.categoria)),series=uniq(filas.map(r=>r.sexo));
 const base='#416ab0',cruce='#efa056',lineas=porSexo?['#8ed2ff','#60e0cb']:['#ffdc79'];
 const dibujo=svg('svg',{class:'grafico grafico-coinfeccion',role:'img','aria-label':p.querySelector('h3').textContent});
 p.append(dibujo);
 const ley=nodo('div',null,'leyenda');
 const items=personas?[['VIH sin coinfección registrada',base],['Coinfección',cruce]]:[];
 if(proporciones)items.push(...series.map((s,i)=>[porSexo?'Porcentaje · '+s:'Porcentaje de coinfección',lineas[i]]));
 items.forEach(([texto,color])=>{
  const item=nodo('span'),marca=nodo('i',null,'muestra');marca.style.background=color;
  item.append(marca,document.createTextNode(texto));ley.append(item);
 });
 p.append(ley);
 const validas=filas.filter(r=>r.sin_coinfeccion!=null);
 if(!validas.length)vacio(p);
 dibujo.dibujar=(w,h)=>{
  dibujo.replaceChildren();dibujo.setAttribute('viewBox',`0 0 ${w} ${h}`);
  const izq=47,der=w-12,arriba=29,piso=h-39,alto=piso-arriba;
  if(der<=izq||alto<=0)return;
  const maxN=Math.max(4,Math.ceil(Math.max(0,...validas.map(r=>r.total_vih))*1.16/4)*4);
  const maxP=Math.min(100,Math.max(4,Math.ceil(Math.max(0,...validas.map(r=>r.porcentaje??0))*1.16/4)*4));
  const y=n=>piso-alto*n/maxN,yp=n=>piso-alto*n/maxP;
  const paso=(der-izq)/grupos.length,barra=Math.min(74,paso*.78/series.length);
  const x=(i,j)=>izq+paso*(i+.5)+barra*(j-(series.length-1)/2);
  function texto(t,xx,yy,extra={}){const n=svg('text',{x:xx,y:yy,'text-anchor':'middle',fill:'#f5f5f8','font-size':11,...extra});n.textContent=t;dibujo.append(n);}
  for(let i=0;i<=4;i++){
   const yy=y(i*maxN/4);
   dibujo.append(svg('line',{x1:izq,y1:yy,x2:der,y2:yy,stroke:'#7188ab','stroke-opacity':.28}));
   texto(personas?fmt(i*maxN/4,0):fmt(i*maxP/4,1)+'%',izq-5,yy+4,{'text-anchor':'end'});
  }
  grupos.forEach((g,i)=>{
   texto(g,izq+paso*(i+.5),piso+19,{'font-size':grupos.length>7?9:11});
  });
  const puntos=series.map(()=>[]);
  filas.forEach(r=>{
   const j=series.indexOf(r.sexo),xx=x(grupos.indexOf(r.categoria),j);
   if(r.sin_coinfeccion==null){texto('—',xx,piso-6);puntos[j].push(null);return;}
   if(r.total_vih===0){if(personas)texto('0',xx,piso-6);puntos[j].push(null);return;}
   if(personas){
   const grupo=svg('g');
   const ayuda=svg('title');ayuda.textContent=`${r.categoria} · ${r.sexo}: ${fmt(r.coinfecciones,0)} de ${fmt(r.total_vih,0)} (${fmt(r.porcentaje,1)} %)`;
   grupo.append(ayuda,svg('rect',{x:xx-barra*.46,y:y(r.sin_coinfeccion),width:barra*.92,height:piso-y(r.sin_coinfeccion),fill:base}),
    svg('rect',{x:xx-barra*.46,y:y(r.total_vih),width:barra*.92,height:y(r.sin_coinfeccion)-y(r.total_vih),fill:cruce}));
   dibujo.append(grupo);texto(fmt(r.total_vih,0),xx,y(r.total_vih)-7,{'font-size':porSexo?9:11,'font-weight':700});
   if(y(r.sin_coinfeccion)-y(r.total_vih)>=14)texto(fmt(r.coinfecciones,0),xx,(y(r.total_vih)+y(r.sin_coinfeccion))/2+4,{fill:'#222a4a','font-size':10,'font-weight':700,'pointer-events':'none'});
   }
   if(proporciones)puntos[j].push({x:personas?xx:x(grupos.indexOf(r.categoria),(series.length-1)/2),y:yp(r.porcentaje),r});
  });
  if(proporciones)puntos.forEach((serie,j)=>{
   const color=lineas[j];
   const ruta=serie.map((pt,i)=>pt?`${i&&serie[i-1]?'L':'M'}${pt.x},${pt.y}`:'').join(' ');
   dibujo.append(svg('path',{d:ruta,fill:'none',stroke:color,'stroke-width':2}));
   serie.filter(Boolean).forEach(pt=>{
    dibujo.append(svg('circle',{cx:pt.x,cy:pt.y,r:3.6,fill:color}));
    const yy=pt.y-9;
    texto(exacto(pt.r.porcentaje,1)+'%',pt.x,personas&&Math.abs(yy-(y(pt.r.total_vih)-7))<13?pt.y+15:yy,
     {fill:color,'font-size':porSexo?9:11,'font-weight':700,stroke:'#222a4a','stroke-width':2,'paint-order':'stroke'});
   });
  });
 };
 p.dataset.nTotal=filas.reduce((n,r)=>n+r.total_vih,0);
 detalle(p,filas);
 if(filas.some(r=>r.sin_coinfeccion==null))p.append(nodo('p','Sin barra cuando las coinfecciones superan el total de VIH.','nota'));
}
function seccionCoinfeccion(host){
 const banda=layout(host,'banda-filtros'),c=controles(banda);
 c.classList.add('controles-coinfeccion');
 const periodo=sifilis.anios;
 const anio=selectorSifilis(c,'anio',periodo,'Año de las comparaciones',periodo.at(-1));
 const opciones=['Personas','Proporciones'];
 const medidas=filtro(c,opciones.map(indicador=>({indicador})),'indicador','Mostrar','medidas',opciones,true,opciones,'Personas y Proporciones');
 const modo=selectorSifilis(c,'genero',['Ambos sexos','Por sexo'],'Sexo','Ambos sexos');
 const lugar=selectorSifilis(c,'geografia',['Argentina',...Object.keys(sifilis.regiones),...sifilis.provincias],'Ámbito geográfico','Argentina');
 const edad=selectorSifilis(c,'edad',edades,'Grupo de edad','Todas las edades');
 const porSexo=modo==='Por sexo',sexos=porSexo?['Varones','Mujeres']:['Ambos sexos'];
 const totales=new Map(T.casos.filter(r=>r.indicador==='Casos').map(r=>[[r.anio,r.geografia,r.genero,r.edad].join('|'),r.valor]));
 function filas(categorias,campos){
  return categorias.flatMap(categoria=>sexos.map(sexo=>{
   const [a,g,e]=campos(categoria),territorios=sifilis.regiones[g]||[g];
   const total=territorios.reduce((n,p)=>n+(totales.get([a,p,sexo,e].join('|'))??0),0);
   const coinfecciones=sifilis.coinfeccion.reduce((n,r)=>n+(r.anio===a&&(g==='Argentina'||territorios.includes(r.geografia))&&
    (sexo==='Ambos sexos'||r.sexo===sexo)&&(e==='Todas las edades'||r.edad===e)?r.casos:0),0);
   return {categoria,sexo,total_vih:total,coinfecciones,sin_coinfeccion:coinfecciones<=total?total-coinfecciones:null,
    porcentaje:total>0&&coinfecciones<=total?100*coinfecciones/total:null};
  }));
 }
 const grilla=layout(host,'coinfeccion-columnas');
 const lapso=periodo.length>1?`${periodo[0]}–${periodo.at(-1)}`:periodo[0];
 graficoCoinfeccion(panel(grilla,`Coinfección VIH–sífilis por año · ${lugar} · ${edad} · ${lapso}`),
  filas(periodo,a=>[a,lugar,edad]),porSexo,medidas);
 graficoCoinfeccion(panel(grilla,`Coinfección VIH–sífilis por edad · ${lugar} · ${anio}`),
  filas(edades.filter(e=>!['Todas las edades','0-9','10-14'].includes(e)),e=>[anio,lugar,e]),porSexo,medidas);
 graficoCoinfeccion(panel(grilla,`Coinfección VIH–sífilis por región · ${anio} · ${edad}`),
  filas(Object.keys(sifilis.regiones),g=>[anio,g,edad]),porSexo,medidas);
 host.append(nodo('p','Se considera coinfección cuando una persona recibe los diagnósticos de VIH y sífilis en el mismo año calendario. La proporción se calcula sobre el total de diagnósticos de VIH. La comparación regional abarca todo el país.','nota'));
}
function seccionDefiniciones(host){
 const fuentes=nodo('section',null,'fuentes-metodologia');
 fuentes.append(nodo('h3','Fuentes y denominadores de VIH y mortalidad por sida'),
  $('metodologia-empalme').content.cloneNode(true),
  $('metodologia-poblacion-2022').content.cloneNode(true),
  $('metodologia-enlaces').content.cloneNode(true));
 const grid=layout(host,'definiciones-grid');
 const definiciones=[
  ['Tasa de mortalidad por sida','Mide las defunciones por causas asociadas al VIH en un año y territorio, por cada 100.000 habitantes. La tasa bruta divide las defunciones por la población del mismo año, territorio y sexo seleccionado. La tasa ajustada por edad combina las tasas específicas por edad usando una población estándar para facilitar comparaciones entre poblaciones con distintas estructuras etarias.','Tasa bruta = defunciones por causas asociadas al VIH / población × 100.000. Tasa ajustada = suma de tasas específicas por edad ponderadas por la población estándar.','Fuente: Boletín N°43 Respuesta al VIH y las ITS en Argentina, tablas 2–7, páginas 70–75; DEIS / Ministerio de Salud de la Nación. Se muestran las tasas publicadas: tabla 2020–2024 y tarjeta nacional, barras y mapa de 2024. La tasa ajustada no representa un conteo de defunciones.'],
  ['Tasa de diagnósticos de VIH','Número de diagnósticos de VIH registrados en un año, dividido por la población de referencia del mismo año y territorio, multiplicado por 100.000. Al filtrar sexo o edad se utiliza la población del grupo correspondiente.','Tasa = diagnósticos de VIH / población × 100.000','Describe diagnósticos notificados, no el momento de adquisición del VIH. La notificación puede retrasarse y las series pueden actualizarse. No se interpreta como incidencia de nuevas infecciones.'],
  ['Razón varones / mujeres','Cociente entre la cantidad de diagnósticos de VIH de las categorías Varones y Mujeres del análisis de género, para el mismo período, territorio y grupo de edad.','Razón = diagnósticos en Varones / diagnósticos en Mujeres','Por ejemplo, 2,3 expresa 2,3 diagnósticos en Varones por cada diagnóstico en Mujeres. No es un porcentaje ni una tasa poblacional. Si el denominador es cero, se muestra Sin datos. Las categorías trans se mantienen diferenciadas en la distribución por género.'],
  ['Diagnóstico tardío de VIH','Se refiere a casos en los que el recuento de CD4 disponible es menor a 350 cél/mm³ y/o se reporta uno o más eventos clínicos de los estadios 2, 3 o 4 de la OMS, y/o el campo estadio clínico se registra como “sintomático sin criterio de sida” o “enfermedad marcadora de sida”.','Porcentaje = (Tardío + Avanzado) / casos válidos × 100','El denominador excluye SD e incluye la categoría Desconocido.'],
  ['Enfermedad avanzada al diagnóstico de VIH','Representa un subgrupo de las personas con diagnóstico tardío. Aplica a casos en los que el recuento de CD4 es menor a 200 cél/mm³ y/o se presenta uno o más eventos clínicos de los estadios 3 y/o 4 de la OMS, y/o se registra como “enfermedad marcadora de sida” en la variable estadio clínico.','Porcentaje = Avanzado / casos válidos × 100','Usa el mismo denominador que diagnóstico tardío.']
 ];
 for(const [titulo,descripcion,formula,nota] of definiciones){const p=panel(grid,titulo);p.append(nodo('p',descripcion),nodo('p',formula,'formula-definicion'),nodo('p',nota,'nota'));}
 host.append(nodo('p','Disponibilidad de datos: los mapas provinciales y regionales requieren al menos 55% de casos válidos sobre el total; la evolución y el análisis por vía requieren 60%. Por debajo se indica Sin datos suficientes.','nota'));
 host.append(fuentes);
}
// Resúmenes de los agregados existentes. No se calculan variaciones interanuales.
function tarjetaResumen(host,etiqueta,numero,contexto){
 const box=nodo('div',null,'tarjeta-resumen'),texto=nodo('div');
 texto.append(nodo('p',etiqueta,'resumen-etiqueta'),nodo('p',numero,'resumen-numero'),nodo('p',contexto,'resumen-contexto'));
 const icono=svg('svg',{viewBox:'0 0 24 24',class:'resumen-icono',fill:'none',stroke:'currentColor','stroke-width':1.6,'aria-hidden':true});
 icono.append(svg('path',{d:etiqueta==='Período de diagnóstico'?'M4 5h16v16H4zM4 10h16M8 2v6M16 2v6':'M3 19V5m0 14h18M6 15l5-6 4 3 6-8'}));
 box.append(texto,icono);host.append(box);
}
function crearBandaFiltros(control,titulo,alcance){
 const banda=nodo('section',null,'banda-filtros'),h=nodo('h3');banda.setAttribute('aria-label',titulo);
 const icono=svg('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':1.6,'aria-hidden':true});
 icono.append(svg('path',{d:'M3 6h18M6 12h12M9 18h6'}));
 h.append(icono,document.createTextNode(titulo),nodo('span',alcance,'filtro-alcance'));banda.append(h,control);return banda;
}
function presentarResumen(){
 if(pagina==='definiciones'||pagina==='mortalidad'||pagina==='genero'||pagina.startsWith('sifilis'))return;
 const host=$('contenido'),e=estados[pagina],ultimo=anios.at(-1),tarjetas=[];
 const esNumero=v=>typeof v==='number'&&Number.isFinite(v);
 const porcentaje=v=>esNumero(v)?exacto(v,1)+'%':'Sin datos';
 const suma=filas=>filas.length&&filas.every(r=>esNumero(r.valor))?filas.reduce((total,r)=>total+r.valor,0):null;
 const mayor=filas=>filas.filter(r=>esNumero(r.valor)).sort((a,b)=>b.valor-a.valor)[0];
 let filtros;
 if(pagina==='casos'){
  const controles=[...host.querySelectorAll('.panel > .controles')];
  filtros=nodo('div',null,'banda-doble');
  filtros.append(crearBandaFiltros(controles[0],'Filtrar la evolución','Geografía, sexo y edad: múltiples'),
    crearBandaFiltros(controles[1],'Filtrar el mapa y el ranking','Todos de opción única'));host.prepend(filtros);
  const geografias=e.geo,sexos=e.sexo,edadesElegidas=e.edad;
  if(geografias.length===1&&sexos.length===1&&edadesElegidas.length===1){
   const filas=T.casos.filter(r=>r.geografia===geografias[0]&&r.genero===sexos[0]&&r.edad===edadesElegidas[0]&&r.anio===ultimo);
   const valor=indicador=>filas.find(r=>r.indicador===indicador)?.valor;
   const contexto=`${geografias[0]} · ${sexos[0]} · ${edadesElegidas[0]}`;
   tarjetas.push([`Diagnósticos · ${ultimo}`,exacto(valor('Casos'),0),contexto],
    ['Tasa por 100.000 habitantes',exacto(valor('Tasa por 100.000 habitantes'),1),`Serie histórica · último año: ${ultimo}`],
    ['Período de diagnóstico',`${anios[0]}–${ultimo}`,'Datos sujetos a actualización por notificación']);
  }else{
   // No sumar país, regiones, sexos y edades: pueden superponerse entre sí.
   tarjetas.push(['Combinaciones elegidas',String(geografias.length*sexos.length*edadesElegidas.length),'Se comparan por separado; puede haber cruces sin datos'],
    ['Indicador de evolución',e.indicador==='Casos'?'Casos':'Tasas','El mapa conserva sus propios filtros'],
    ['Período de diagnóstico',`${anios[0]}–${ultimo}`,'Datos sujetos a actualización por notificación']);
  }
 }else{
  filtros=crearBandaFiltros(host.querySelector(':scope > .controles'),'Filtros de esta página','Todos de opción única');host.prepend(filtros);
  if(pagina==='geografia'){
   const provincias=T.provincias.filter(r=>r.genero===e.s&&r.edad===e.e&&r.anio===e.a&&r.indicador==='Casos');
   const region=mayor(T.regiones.filter(r=>r.genero===e.s&&r.edad===e.e&&r.anio===e.a));
   tarjetas.push([`Diagnósticos con provincia conocida · ${e.a}`,exacto(suma(provincias),0),`${e.s} · ${e.e}`],
    ['Región con mayor participación',porcentaje(region?.valor),region?.serie||'Sin datos'],
    ['Comparación territorial','24 provincias',`Mapa y ranking corresponden a ${e.a}`]);
  }else if(pagina==='vias'){
   const filas=T.vias.filter(r=>r.geografia===e.g&&r.genero===e.s&&r.edad===e.e&&r.anio===2025);
   const anio=2025;
   const actuales=filas.filter(r=>r.anio===anio),via=mayor(actuales),desconocida=actuales.find(r=>/desconoc/i.test(r.serie));
   tarjetas.push([`Vía de mayor proporción${anio?' · '+anio:''}`,porcentaje(via?.valor),via?.serie||'Sin datos'],
    ['Vía desconocida',porcentaje(desconocida?.valor),`${e.g} · ${e.s} · ${e.e}`],
    ['Año de la torta',filas.length?'2025':'Sin datos','Diagnósticos de VIH de 2025 para esta selección']);
  }else if(pagina==='diagnostico'||pagina==='mapas-diagnostico'){
   const anio=pagina==='diagnostico'?ultimo:e.a,geografia=pagina==='diagnostico'?e.g:(e.r||'Argentina');
   const dato=T.diagnostico.find(r=>r.geografia===geografia&&r.genero===e.s&&r.edad===e.e&&r.anio===anio),fila=pagina==='mapas-diagnostico'?paraMapaDT(dato):dato;
   const cobertura=esNumero(fila?.validos)&&fila?.total>0?fila.validos/fila.total*100:null;
   tarjetas.push([`Diagnóstico tardío · ${anio}`,fila?.insuficiente?'Sin datos':porcentaje(fila?.tardio),`${geografia} · ${e.s} · ${e.e}`],
    [`Enfermedad avanzada · ${anio}`,fila?.insuficiente?'Sin datos':porcentaje(fila?.avanzada),'Es un subconjunto del diagnóstico tardío'],
    ['Casos con dato de oportunidad diagnóstica',porcentaje(cobertura),`Denominador válido · ${geografia} · ${anio}`]);
  }
 }
 const resumen=nodo('section',null,'resumen-indicadores');resumen.setAttribute('aria-label','Resumen de indicadores');
 for(const tarjeta of tarjetas)tarjetaResumen(resumen,...tarjeta);filtros.after(resumen);
 $('periodo').textContent=`Fuente: SNVS / SISA · Diagnósticos ${anios[0]}–${ultimo} · Datos actualizables por retraso de notificación`;
 // La referencia nacional se compara con la misma métrica, sexo/género, edad y año.
 let referencias=[];
 if(pagina==='casos'&&e.im!=='Casos')referencias=[T.casos.find(r=>r.geografia==='Argentina'&&r.indicador===e.im&&r.genero===e.sm&&r.edad===e.em&&r.anio===e.am)?.valor];
 if(pagina==='mapas-diagnostico'){
  const nacional=paraMapaDT(T.diagnostico.find(r=>r.geografia===(e.r||'Argentina')&&r.genero===e.s&&r.edad===e.e&&r.anio===e.a));
  referencias=[nacional?.tardio,nacional?.avanzada];
 }
 host.querySelectorAll('.ranking').forEach((ranking,index)=>{
  const referencia=referencias[index],maximo=Number(ranking.dataset.maximo);
  if(!esNumero(referencia)||!Number.isFinite(maximo)||maximo<=0)return;
  if(referencia>=0&&referencia<=maximo){ranking.classList.add('con-referencia');ranking.style.setProperty('--referencia',referencia/maximo*100+'%');}
  ranking.previousElementSibling.append(nodo('p',`Referencia ${pagina==='mapas-diagnostico'&&e.r!=='Argentina'?e.r:'nacional'}: ${exacto(referencia,1)}${pagina==='mapas-diagnostico'?'%':' por 100.000'}`,'nota-referencia'));
 });
}

function render(){if(!estados[pagina])estados[pagina]={};const page=paginas.find(p=>p[0]===pagina);$('titulo').textContent=page[1];
 const version=pagina==='casos'?'V 2.0':pagina==='definiciones'?'V 2.0 AA':'';$('version-tablero').textContent=version;$('version-tablero').hidden=!version;
 const esSifilis=pagina.startsWith('sifilis');
 const tamizaje=pagina==='sifilis-territorio'?sifilis.tamizaje:null;
 $('contenido').classList.toggle('pagina-sifilis',esSifilis);
 $('periodo').textContent=tamizaje?`Fuente: SNVS · Tamizaje ${tamizaje.anios[0]}–${tamizaje.anios.at(-1)}`:esSifilis?`Fuente: SNVS · Diagnósticos ${sifilis.anios[0]}–${sifilis.anios.at(-1)}`:`Fuente: SNVS / SISA · Diagnósticos ${anios[0]}–${anios.at(-1)}`;
 $('fecha-exportacion').textContent=`Fecha de exportación de la base: ${tamizaje?.exportacion||(esSifilis?sifilis.exportacion:D.meta.fecha_exportacion||'no informada')}`;
 $('contenido').replaceChildren();document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-current',b.dataset.pagina===pagina?'page':'false'));
 const host=$('contenido');
 ({casos:seccionCasos,geografia:seccionGeografia,genero:seccionGenero,vias:seccionVias,diagnostico:seccionDiagnostico,'mapas-diagnostico':seccionMapasDiagnostico,mortalidad:seccionMortalidad,sifilis:seccionSifilis,'sifilis-territorio':seccionTamizajeSifilis,'sifilis-coinfeccion':seccionCoinfeccion,definiciones:seccionDefiniciones})[pagina](host);
 presentarResumen();
 const filtros=host.querySelector('.banda-doble > :last-child .controles') ||
  host.querySelector('.controles');
 if(filtros){filtros.classList.add('controles-con-restablecer');filtros.append(botonRestablecer);}
 ajustarPantalla();}
 paginas.forEach(([id,nombre,path])=>{const b=nodo('button');b.dataset.pagina=id;const colorIcono={casos:['#307de0','#e8f0fd'],geografia:['#277cb7','#e9f3f9'],genero:['#a649c6','#f5eafa'],edad:['#26913c','#edf6ee'],vias:['#009ca5','#e8f5f5'],diagnostico:['#cf419b','#faedf6'],'mapas-diagnostico':['#be8c18','#fbf4e4'],mortalidad:['#237bd1','#e8f0fd'],definiciones:['#7561bb','#f0ecfa']}[id]||['#168e9b','#e8f5f5'];b.style.setProperty('--icono',colorIcono[0]);b.style.setProperty('--icono-fondo',colorIcono[1]);const icon=svg('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':1.7,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':true,class:'nav-icon'});icon.append(svg('path',{d:path}));b.append(icon,nodo('span',nombre));b.onclick=()=>{pagina=id;history.replaceState(null,'',`#${id}`);render();$('titulo').focus();};$('navegacion').append(b);});
 $('demo').hidden=!D.meta.demostracion;
 botonRestablecer.onclick=()=>{estados[pagina]={};render();botonRestablecer.focus();};window.addEventListener('hashchange',()=>{if(paginas.some(p=>p[0]===location.hash.slice(1))){pagina=location.hash.slice(1);render();}});
 document.addEventListener('click',e=>document.querySelectorAll('.control details[open]').forEach(d=>{if(!d.contains(e.target))d.open=false;}));document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.control details[open]').forEach(d=>{d.open=false;d.querySelector('summary').focus();});});
 $('abrir-metodologia').onclick=abrirMetodologia;$('cerrar-dialogo').onclick=()=>$('dialogo').close();let vistaMovil=innerWidth<=700;window.addEventListener('resize',()=>{const nueva=innerWidth<=700;if(nueva!==vistaMovil){vistaMovil=nueva;render();}else ajustarPantalla();});
 render();
})();
