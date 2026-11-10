// Author: Ariel Adaszko
/* Tablero autónomo: consume exclusivamente tablas agregadas, sin servicios externos. */
'use strict';
(() => {
const D = window.SNVS_DATOS;
if (!D) { document.getElementById('contenido').textContent='No se pudieron cargar los datos del tablero.'; return; }
const T=D.tablas, $=id=>document.getElementById(id), NS='http://www.w3.org/2000/svg';
const porcentajesDT=new WeakMap();
// El umbral usa los conteos de la selección, antes de redondear porcentajes.
for(const nombre of ['diagnostico','diagnostico_vias','diagnostico_regional'])if(T[nombre])T[nombre]=T[nombre].map(r=>{
 const insuficiente=!(r.total>0&&r.validos/r.total>=.6);
 const fila={...r,n:r.validos,insuficiente,tardio:insuficiente?null:r.tardio,avanzada:insuficiente?null:r.avanzada};porcentajesDT.set(fila,{tardio:r.tardio,avanzada:r.avanzada});return fila;
});
function paraMapaDT(r){if(!r)return r;const insuficiente=!(r.total>0&&r.validos/r.total>=.55),original=porcentajesDT.get(r)||r;return {...r,insuficiente,tardio:insuficiente?null:original.tardio,avanzada:insuficiente?null:original.avanzada};}
const colores=['#4c94f1','#efa056','#b38ae5','#b7ca6b','#32b6c9','#e7c63c','#e078b2','#807cce','#d9b886'];
const paginas=[['casos','Casos y tasas','M3 19V5m0 14h18M6 15l5-6 4 3 6-8'],['geografia','Distribución geográfica','M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2V5zm6-2v16m6-14v16'],['genero','Distribución por género','M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 2a3 3 0 1 0 0-6M2 21v-3a6 6 0 0 1 12 0v3m3-7a5 5 0 0 1 5 5v2'],['edad','Distribución por edad','M4 20V14h4v6m2 0V9h4v11m2 0V3h4v17'],['vias','Vías de transmisión','M4 5h7l6 6h4M4 19h7l6-6h4M17 7l4 4-4 4'],['diagnostico','Diagnóstico tardío · evolución','M3 12h4l3-8 4 16 3-8h4'],['mapas-diagnostico','Diagnóstico tardío · mapas','M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2V5zm6-2v16m6-14v16']];
const edades=['Todas las edades','0-9','10-14','15-19','20-24','25-34','35-44','45-54','55-64','65 o más'];
const generos=['Todos los géneros','Varón','Mujer','Mujer trans','Varón trans'];
const regiones=['GBA','Centro','Cuyo','NEA','NOA','Patagonia'];
const uniq=a=>[...new Set(a)], fmt=(v,d=1)=>v==null||!Number.isFinite(v)?'Sin datos':v.toLocaleString('es-AR',{maximumFractionDigits:d});
const geoSort=(a,b)=>(a==='Argentina'?-100:regiones.includes(a)?regiones.indexOf(a)-90:0)-(b==='Argentina'?-100:regiones.includes(b)?regiones.indexOf(b)-90:0)||a.localeCompare(b,'es');
const geos=uniq(T.casos.map(r=>r.geografia)).sort(geoSort), anios=uniq(T.casos.map(r=>r.anio)).sort((a,b)=>a-b);
let pagina=paginas.some(p=>p[0]===location.hash.slice(1))?location.hash.slice(1):'casos';
const estados={};
const exacto=(v,d=1)=>v==null||!Number.isFinite(v)?'Sin datos':v.toLocaleString('es-AR',{minimumFractionDigits:d,maximumFractionDigits:d});
function abrirDialogo(titulo,contenido){$('dialogo-titulo').textContent=titulo;$('dialogo-contenido').replaceChildren(contenido);if(!$('dialogo').open)$('dialogo').showModal();}
function ajustarPantalla(){
 if(innerWidth<=700)return;
 // Redibujar las coordenadas con el espacio real, sin escalar texto ni mapas.
 document.querySelectorAll('svg.grafico').forEach(s=>{
  const ancho=s.clientWidth,alto=s.clientHeight;
  if(ancho>0&&alto>0)s.dibujar(ancho,alto);
 });
}

function textoVisible(texto){return String(texto).replace(/\bVarón\b/g,'Varones').replace(/\bMujer\b/g,'Mujeres').replace(/\s+cis\b/gi,'');}
function nodo(tag,texto,cls){const n=document.createElement(tag);if(texto!=null)n.textContent=textoVisible(texto);if(cls)n.className=cls;return n;}
function svg(tag,attrs={},texto){const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);if(texto!=null)n.textContent=textoVisible(texto);return n;}
function tituloSVG(n,txt){n.append(svg('title',{},txt));return n;}
function valorSeguro(r,campo){return r[campo]==null?null:Number(r[campo]);}
function conjunto(datos,campo,orden){const opciones=uniq(datos.map(r=>r[campo]).filter(v=>v!=null));return orden?[...orden.filter(v=>opciones.includes(v)),...opciones.filter(v=>!orden.includes(v)).sort()]:opciones.sort((a,b)=>typeof a==='number'?a-b:String(a).localeCompare(String(b),'es'));}
function filtro(host,datos,campo,etiqueta,clave,inicial,multiple=false,orden){
 const opciones=conjunto(datos,campo,orden).filter(v=>campo!=='geografia'||!/^desconocid[oa]s?$|^SD$|^sin dato/i.test(String(v).trim())), estado=estados[pagina];
 if(!(clave in estado))estado[clave]=multiple?[inicial??opciones[0]]:(inicial??opciones[0]);
 let actual=multiple?estado[clave].filter(v=>opciones.includes(v)):estado[clave];
 if(multiple&&!actual.length)actual=[opciones[0]];
 if(!multiple&&!opciones.includes(actual))actual=opciones[0];
 estado[clave]=actual;
 const etiquetaN=nodo('div',null,'control');etiquetaN.append(nodo('span',etiqueta));
 if(!multiple){const s=nodo('select');s.setAttribute('aria-label',etiqueta);s.dataset.clave=clave;
 opciones.forEach(v=>{const o=nodo('option',campo==='indicador'&&String(v).startsWith('Tasa')?'Tasas por 100.000':String(v));o.value=String(v);o.selected=v===actual;s.append(o);});
 s.onchange=()=>{estado[clave]=opciones.find(v=>String(v)===s.value);render();};etiquetaN.append(s);
 }else{const d=nodo('details'),res=nodo('summary',actual.length===1?String(actual[0]):`${actual.length} selecciones`);d.dataset.clave=clave;d.append(res);
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
function detalle(host,filas){
 muestra(host,filas);
 const scroll=nodo('div',null,'tabla-scroll'),table=nodo('table');
 const campos=filas.length?Object.keys(filas[0]):[],head=nodo('thead'),hr=nodo('tr');
 campos.forEach(c=>{const th=nodo('th',c);th.scope='col';hr.append(th);});head.append(hr);table.append(head);
 const body=nodo('tbody');filas.forEach(r=>{const tr=nodo('tr');campos.forEach(c=>tr.append(nodo('td',typeof r[c]==='number'?fmt(r[c],3):r[c]??'Sin datos')));body.append(tr);});table.append(body);scroll.append(table);
 const acciones=nodo('div',null,'acciones-datos'),ver=nodo('button','Ver datos'),b=nodo('button','Descargar CSV');
 ver.onclick=()=>abrirDialogo(host.querySelector('h3')?.textContent||'Datos del gráfico',scroll);
 b.disabled=!filas.length;b.onclick=()=>{const csv=[campos,...filas.map(r=>campos.map(c=>r[c]??''))].map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));const a=nodo('a');a.href=url;a.download=`vih-${pagina}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};acciones.append(ver,b);host.append(acciones);
}
function vacio(host){host.append(nodo('p','Sin datos para esta selección.','vacio'));}
function abreviarVia(v){return ({'Prácticas sexuales con mujeres sin protección':'Sexual con mujeres (sin protección)','Prácticas sexuales con varones sin protección':'Sexual con varones (sin protección)','Prácticas sexuales con trans sin protección':'Sexual con personas trans (sin protección)','Uso compartido de equipo de inyección en los últimos 10 años':'Equipo de inyección compartido'})[v]||v;}
function leyenda(host,series){const l=nodo('div',null,'leyenda');series.forEach((s,i)=>{const t=nodo('span'),m=nodo('i',null,'muestra');m.style.background=colores[i%colores.length];t.append(m,document.createTextNode(textoVisible(abreviarVia(s))));t.title=s;l.append(t);});host.append(l);}
function grafico(host,filas,{tipo='linea',porcentaje=false,unidad='',ordenSeries=null,decimales=1,datosDetalle=null,ancho=720,alto=390,ordenX=null,coloresSeries=null}={}){
 if(!filas.some(r=>r.valor!=null)&&!filas.some(r=>r.insuficiente)){vacio(host);detalle(host,datosDetalle||filas);return;}
 const xs=ordenX?ordenX.filter(x=>filas.some(r=>r.anio===x)):uniq(filas.map(r=>r.anio)).sort((a,b)=>a-b),series=ordenSeries?ordenSeries.filter(s=>filas.some(r=>r.serie===s)):uniq(filas.map(r=>r.serie||'Valor'));
 const s=svg('svg',{class:'grafico',role:'img','aria-label':host.querySelector('h3').textContent});
 s.dibujar=(w,h)=>{
 const L=55,R=22,U=35,B=42,iw=Math.max(1,w-L-R),ih=Math.max(1,h-U-B);
 s.setAttribute('viewBox',`0 0 ${w} ${h}`);s.replaceChildren();tituloSVG(s,host.querySelector('h3').textContent+'. Los valores están disponibles en la tabla debajo del gráfico.');
 const max=porcentaje?100:Math.max(1,...filas.map(r=>r.valor??0))*1.13;
 const x=i=>L+(i+.5)*iw/xs.length, y=v=>U+ih*(1-v/max);
 for(let j=0;j<=4;j++){const v=max*j/4,yy=y(v);s.append(svg('line',{x1:L,x2:w-R,y1:yy,y2:yy,class:'rejilla'}),svg('text',{x:L-10,y:yy+4,'text-anchor':'end'},fmt(v,v<5?1:0)+(porcentaje?'%':'')));}
 xs.forEach((a,i)=>s.append(svg('text',{x:x(i),y:h-17,'text-anchor':'middle'},a)));
 const matriz=new Map(filas.map(r=>[`${r.anio}|${r.serie||'Valor'}`,r.valor]));
 series.forEach((nombre,j)=>{let segmentos=[],tramo=[];xs.forEach((a,i)=>{const v=matriz.get(`${a}|${nombre}`);if(v==null){if(tipo==='barras'&&j===0&&filas.some(r=>r.anio===a&&r.insuficiente))s.append(svg('text',{x:x(i),y:y(0)-12,'text-anchor':'middle',class:'sin-datos-suficientes'},'Sin datos suficientes'));if(tramo.length)segmentos.push(tramo);tramo=[];return;}
 const color=(tipo==='linea'||tipo==='puntos')&&series.length===1?'#73d4ef':(coloresSeries?.[nombre]||colores[j%colores.length]),etiqueta=exacto(v,porcentaje?1:decimales)+(porcentaje?'%':''),tooltip=`${a} · ${nombre}: ${fmt(v)}${porcentaje?'%':unidad?' '+unidad:''}`;
 if(tipo==='linea'||tipo==='puntos'){const final=i===xs.length-1;tramo.push([x(i),y(v)]);s.append(tituloSVG(svg('circle',{cx:x(i),cy:y(v),r:tipo==='puntos'?7:4,fill:final?'#ffdc8d':color,tabindex:0,'aria-label':tooltip}),tooltip));s.append(svg('text',{x:x(i),y:y(v)-12-(j%3)*12,'text-anchor':'middle',class:'valor-punto'},etiqueta));}
 else {const ancho=iw/xs.length*.74;let base=0,xx=x(i)-ancho/2,bw=ancho;
 if(tipo==='apilado'){for(let k=0;k<j;k++)base+=matriz.get(`${a}|${series[k]}`)??0;}else{bw=ancho/series.length;xx+=j*bw;}
 s.append(tituloSVG(svg('rect',{x:xx,y:y(v+base),width:Math.max(1,bw-1),height:ih*v/max,fill:color,tabindex:0,'aria-label':tooltip}),tooltip));
 if(tipo==='barras'){const xxLabel=xx+bw/2,yyLabel=y(v+base)-8;s.append(svg('text',{x:xxLabel,y:yyLabel,'text-anchor':series.length>3?'start':'middle',class:'valor-barra',...(series.length>3?{transform:`rotate(-55 ${xxLabel} ${yyLabel})`}:{})},etiqueta));}
 if(v>8&&tipo==='apilado')s.append(svg('text',{x:xx+bw/2,y:y(base+v/2)+4,'text-anchor':'middle',fill:'#fff',class:'valor-apilado'},fmt(v)+(porcentaje?'%':'')));
 }});if(tramo.length)segmentos.push(tramo);if(tipo==='linea')segmentos.forEach(tr=>s.prepend(svg('polyline',{points:tr.map(p=>p.join(',')).join(' '),fill:'none',stroke:series.length===1?'#73d4ef':colores[j%colores.length],'stroke-width':2.8})));});
 };s.dibujar(ancho,alto);
 host.append(s);leyenda(host,series);if(coloresSeries)host.querySelectorAll('.leyenda .muestra').forEach((m,i)=>m.style.background=coloresSeries[series[i]]||colores[i%colores.length]);if((tipo==='linea'||tipo==='puntos')&&series.length===1)host.querySelector('.leyenda .muestra').style.background='#73d4ef';detalle(host,datosDetalle||filas);
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
function mapa(host,filas,campo='valor',unidad='',color='#237bd1',region='Argentina'){
 const regional=region!=='Argentina',features=regional?D.mapa.territorios.features.filter(f=>f.properties.region===region):D.mapa.provincias.features;
 filas=features.map(f=>filas.find(r=>r.geografia===nombreMapa(f.id))||{geografia:nombreMapa(f.id),n:0,validos:0,total:0,insuficiente:campo!=='valor'});
 const insuficientes=new Set(filas.filter(r=>r.insuficiente).map(r=>r.geografia));
 const valores=new Map(filas.map(r=>[r.geografia,valorSeguro(r,campo)]));
 const validos=[...valores.values()].filter(v=>v!=null&&Number.isFinite(v));
 const max=Math.max(1,...validos),division=nodo('div',null,'mapa-y-ranking'),columna=nodo('div',null,'mapa-columna'),wrap=nodo('div',null,'mapa-contenedor');
 const s=svg('svg',{viewBox:'0 0 330 420',class:'mapa',role:'group','aria-label':`Mapa de ${region} por jurisdicción`}),g=svg('g');s.append(g);
 const proy=([lon,lat])=>[60+(lon+76)*Math.PI/180*500,10+(Math.log(Math.tan(Math.PI/4-21*Math.PI/360))-Math.log(Math.tan(Math.PI/4+lat*Math.PI/360)))*500];
 const anillo=ring=>ring.map((p,i)=>(i?'L':'M')+proy(p).map(v=>v.toFixed(2)).join(',')).join('')+'Z';
 const path=geom=>{const polys=geom.type==='Polygon'?[geom.coordinates]:geom.type==='MultiPolygon'?geom.coordinates:[];return polys.map(p=>p.map(anillo).join('')).join('');};
 D.mapa.paises.features.forEach(f=>g.append(svg('path',{d:path(f.geometry),fill:'#e3e9ec',stroke:'#a3b4ba'})));
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
 let z=1,dx=0,dy=0;const transforma=()=>g.setAttribute('transform',`translate(${dx},${dy}) translate(165,210) scale(${z}) translate(-165,-210)`);
 const botones=nodo('div',null,'zoom');[['+','Acercar',()=>z=Math.min(6,z*1.4)],['−','Alejar',()=>z=Math.max(1,z/1.4)],['↺','Restablecer mapa',()=>{z=1;dx=0;dy=0;}]].forEach(([txt,label,fn])=>{const b=nodo('button',txt);b.setAttribute('aria-label',label);b.onclick=()=>{fn();transforma();};botones.append(b);});
 let inicio=null;s.onpointerdown=e=>{inicio=[e.clientX,e.clientY,dx,dy];s.setPointerCapture(e.pointerId);};s.onpointermove=e=>{if(inicio){const rect=s.getBoundingClientRect();dx=inicio[2]+(e.clientX-inicio[0])*330/rect.width;dy=inicio[3]+(e.clientY-inicio[1])*420/rect.height;transforma();}};s.onpointerup=s.onpointercancel=()=>{inicio=null;};
 wrap.append(s,botones);columna.append(wrap,info);const escala=nodo('div',null,'escala');const grad=nodo('i',null,'gradiente');grad.style.background=`linear-gradient(90deg,${color}33,${color})`;escala.append(nodo('span',unidad==='%'?'0%':'0'),grad,nodo('span',fmt(max)+unidad),nodo('span',campo==='valor'?'Gris: sin datos':'Gris: sin datos suficientes (<55% válidos)'));if(!validos.length)escala.replaceChildren(nodo('span',campo==='valor'?'Sin datos para esta selección.':'Sin jurisdicciones con datos suficientes.'));columna.append(escala);
 const ranking=nodo('div',null,'ranking');ranking.dataset.maximo=String(max);ranking.style.setProperty('--color-mapa',color);[...valores].sort((a,b)=>(b[1]??-1)-(a[1]??-1)).forEach(([n,v])=>{const row=nodo('div',null,'fila-ranking'),bar=nodo('div',null,'barra-ranking'),i=nodo('i');i.style.width=`${v==null?0:v/max*100}%`;i.style.background=color;if(v==null||!Number.isFinite(v))row.classList.add('sin-dato');bar.append(i);if(insuficientes.has(n)){row.classList.add('insuficiente');row.append(nodo('span',n),nodo('span','Sin datos suficientes','aviso-insuficiente'));}else row.append(nodo('span',n),bar,nodo('strong',v==null?'s/d':exacto(v,unidad?1:0)+(unidad==='%'?'%':'')));ranking.append(row);});division.append(columna,ranking);host.append(division);detalle(host,filas);
}
function seccionCasos(host){
 const grid=layout(host),p=panel(grid,'Evolución de casos'),c=controles(p);
 const ind=filtro(c,T.casos,'indicador','Indicador','indicador','Casos'),geo=filtro(c,T.casos,'geografia','Unidad geográfica','geo','Argentina',true,geos),sexo=filtro(c,T.casos,'genero','Sexo','sexo','Ambos sexos',true,['Ambos sexos','Mujeres','Varones']),edad=filtro(c,T.casos,'edad','Grupo de edad','edad','Todas las edades',true,edades);
 p.querySelector('h3').textContent=ind==='Casos'?'Evolución de casos':'Evolución de tasas por 100.000 habitantes';
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
 grafico(p,filas.map(r=>({...r,anio:r.anio,serie:nombreSerie(r),valor:r.valor})),{unidad:ind==='Casos'?'casos':'por 100.000 habitantes',decimales:ind==='Casos'?0:1});
 const fijos=filtrosSeries.filter(f=>f.valores.length===1).map(f=>`${f.etiqueta}: ${f.valores[0]}`);
 const comunes=nodo('p',fijos.length?fijos.join(' · '):'Comparación por geografía, sexo y edad.','contexto-series');
 comunes.setAttribute('aria-label','Filtros comunes a todas las series');
 const leyenda=p.querySelector('.leyenda');p.insertBefore(comunes,leyenda||p.querySelector('.muestra-n'));
 // Si todos los filtros son únicos, la línea neutra identifica la única serie.
 if(leyenda&&!dimensiones.length)leyenda.hidden=true;
 const m=panel(grid,'Casos por provincia'),cm=controles(m),prov=T.casos.filter(r=>r.nivel==='Provincial');
 const im=filtro(cm,prov,'indicador','Indicador del mapa','im','Tasa por 100.000 habitantes'),am=filtro(cm,prov,'anio','Año','am',anios.at(-1)),sm=filtro(cm,prov,'genero','Sexo','sm','Ambos sexos'),em=filtro(cm,prov,'edad','Grupo de edad','em','Todas las edades',false,edades);
 m.querySelector('h3').textContent=im==='Casos'?'Casos por provincia':'Tasas por provincia (por 100.000 habitantes)';
 mapa(m,prov.filter(r=>r.indicador===im&&r.anio===am&&r.genero===sm&&r.edad===em),'valor',im==='Casos'?'':' por 100 mil',{'Ambos sexos':'#237bd1','Mujeres':'#c47729','Varones':'#9466c6'}[sm]||'#237bd1');
}
function seccionGeografia(host){const c=controles(host),s=filtro(c,T.regiones,'genero','Género','s','Todos los géneros',false,generos),e=filtro(c,T.regiones,'edad','Grupo de edad','e','Todas las edades',false,edades),a=filtro(c,T.provincias,'anio','Año del mapa y ranking','a',anios.at(-1));
 const g=layout(host),p=panel(g,'Distribución de diagnósticos por región');grafico(p,T.regiones.filter(r=>r.genero===s&&r.edad===e).map(r=>({...r,anio:r.anio,serie:r.serie,valor:r.valor})),{tipo:'apilado',porcentaje:true,ordenSeries:regiones});
 const m=panel(g,'Participación provincial en los diagnósticos');mapa(m,T.provincias.filter(r=>r.genero===s&&r.edad===e&&r.anio===a&&r.indicador==='Porcentaje'),'valor','%');m.append(nodo('p','Porcentaje sobre el total de diagnósticos de las provincias con residencia conocida, según los filtros elegidos.','nota'));}
function seccionGenero(host){const c=controles(host),g=filtro(c,T.genero,'geografia','Unidad geográfica','g','Argentina',false,geos),e=filtro(c,T.genero,'edad','Grupo de edad','e','Todas las edades',false,edades),grid=layout(host);
 grafico(panel(grid,'Proporción de diagnósticos por género'),T.genero.filter(r=>r.geografia===g&&r.edad===e).map(r=>({...r,anio:r.anio,serie:r.serie,valor:r.valor})),{tipo:'apilado',porcentaje:true,ordenSeries:['Mujer','Varón',...uniq(T.genero.map(r=>r.serie)).filter(v=>!['Mujer','Varón'].includes(v))],coloresSeries:{'Mujer':colores[0],'Varón':colores[3],'Mujer trans':colores[1],'Otro':colores[2],'Varón trans':colores[4]}});
 grafico(panel(grid,'Razón varones / mujeres'),T.razon.filter(r=>r.geografia===g&&r.edad===e).map(r=>({...r,anio:r.anio,serie:'Razón varones / mujeres',valor:r.valor})),{tipo:'puntos'});}
function seccionEdad(host){const c=controles(host),g=filtro(c,T.edad,'geografia','Unidad geográfica','g','Argentina',false,geos),s=filtro(c,T.edad,'genero','Género','s','Todos los géneros',false,generos),grid=layout(host);
 grafico(panel(grid,'Distribución por grupo de edad'),T.edad.filter(r=>r.geografia===g&&r.genero===s).map(r=>({...r,anio:r.anio,serie:r.serie,valor:r.valor})),{tipo:'apilado',porcentaje:true,ordenSeries:edades});
 grafico(panel(grid,'Mediana de edad al diagnóstico'),T.mediana.filter(r=>r.geografia===g&&r.genero===s).map(r=>({...r,anio:r.anio,serie:'Mediana de edad',valor:r.valor})),{unidad:'años',decimales:0});}
// Barras horizontales agrupadas por año, con valores fuera de la barra y escala común.
function graficoViasBarras(host,filas){
 if(!filas.length){vacio(host);detalle(host,filas);return;}
 const anios=uniq(filas.map(r=>r.anio)).sort((a,b)=>a-b),vias=uniq(filas.map(r=>r.serie)),lista=nodo('div',null,'evolucion-vias');
 for(const anio of anios){const grupo=nodo('div',null,'grupo-via'),nombre=nodo('span',anio,'nombre-via');grupo.append(nombre);const barras=nodo('div',null,'barras-anuales');
  const ordenadas=vias.map((via,i)=>({via,i,r:filas.find(r=>r.serie===via&&r.anio===anio)})).sort((a,b)=>(b.r?.valor??-Infinity)-(a.r?.valor??-Infinity)||a.i-b.i);
  ordenadas.forEach(({via,i,r})=>{const v=r?.valor,linea=nodo('div',null,'barra-anual'),pista=nodo('div',null,'pista-anual'),barra=nodo('i');barra.style.width=`${v??0}%`;barra.style.background=colores[i%colores.length];pista.append(barra);linea.append(pista,nodo('strong',v==null?'Sin datos':exacto(v,1)+'%'));linea.setAttribute('role','img');linea.dataset.via=via;linea.setAttribute('aria-label',`${anio} · ${via}: ${v==null?'Sin datos':exacto(v,1)+'%'}`);linea.title=linea.getAttribute('aria-label');barras.append(linea);});grupo.append(barras);lista.append(grupo);
 }
 host.append(lista);leyenda(host,vias);host.append(nodo('p','Cada grupo representa un año y cada barra una vía de transmisión. Escala común: 0–100%; valores al final de cada fila.','nota'));detalle(host,filas);
}
function seccionVias(host){
 const c=controles(host),g=filtro(c,T.vias,'geografia','Unidad geográfica','g','Argentina',false,geos),s=filtro(c,T.vias,'genero','Género · evolución','s','Varón',false,generos),e=filtro(c,T.vias,'edad','Grupo de edad · evolución','e','Todas las edades',false,edades);
 const varones=T.vias.filter(r=>r.geografia===g&&r.genero==='Varón'&&edades.slice(1).includes(r.edad)),a=s==='Varón'?filtro(c,varones,'anio','Año · varones por edad','a',anios.at(-1)):null;
 const disponibles=T.vias.filter(r=>r.geografia===g&&r.genero===s&&r.edad===e),ultimos=uniq(disponibles.map(r=>r.anio)).sort((a,b)=>a-b).slice(-5),grid=layout(host,s==='Varón'?'dos':'una');
 graficoViasBarras(panel(grid,'Vías de transmisión · evolución de los últimos cinco años'),disponibles.filter(r=>ultimos.includes(r.anio)));
 if(s!=='Varón')return;
 const p=panel(grid,`Vías de transmisión en varones · por edad · ${a??'sin año disponible'}`);
 grafico(p,varones.filter(r=>r.anio===a).map(r=>({...r,anio:r.edad,serie:r.serie,valor:r.valor})),{tipo:'apilado',porcentaje:true,ordenX:edades.slice(1),alto:390});
 p.insertBefore(nodo('p','Varones. Cada barra representa el 100% de las vías informadas en ese grupo de edad; los grupos sin casos se muestran sin barra.','nota'),p.lastElementChild);
}
function seccionDiagnostico(host){
 const c=controles(host),g=filtro(c,T.diagnostico,'geografia','Unidad geográfica · ambos gráficos','g','Argentina',false,geos),s=filtro(c,T.diagnostico,'genero','Género · evolución','s','Todos los géneros',false,generos),e=filtro(c,T.diagnostico,'edad','Grupo de edad · ambos gráficos','e','Todas las edades',false,edades);
 const rutas=(T.diagnostico_vias||[]).filter(r=>r.geografia===g&&r.edad===e&&/^(Prácticas sexuales|Uso compartido de equipo de inyección)/.test(r.via)),a=s==='Varón'&&rutas.length?filtro(c,rutas,'anio','Año · varones por vía','a',anios.at(-1)):null;
 const grid=layout(host,s==='Varón'?'dos':'una'),hist=T.diagnostico.filter(r=>r.geografia===g&&r.genero===s&&r.edad===e),ultimos=uniq(hist.map(r=>r.anio)).sort((a,b)=>a-b).slice(-4),p=panel(grid,'Diagnóstico tardío y enfermedad avanzada · evolución');
 const barras=filas=>filas.flatMap(r=>[{...r,anio:r.anio,serie:'Diagnóstico tardío (incluye avanzada)',valor:r.tardio},{...r,anio:r.anio,serie:'Enfermedad avanzada',valor:r.avanzada}]);
 grafico(p,barras(hist.filter(r=>ultimos.includes(r.anio))),{tipo:'barras',porcentaje:true,alto:390,datosDetalle:hist.filter(r=>ultimos.includes(r.anio))});
 p.insertBefore(nodo('p','Diagnóstico tardío incluye enfermedad avanzada. Las barras se comparan, no se suman. Porcentajes sobre casos con dato de oportunidad diagnóstica.','nota'),p.lastElementChild);
 if(s!=='Varón')return;
 const q=panel(grid,`Diagnóstico tardío en varones · por vía · ${a??'sin año disponible'}`),seleccion=rutas.filter(r=>r.anio===a);
 graficoDiagnosticoVias(q,seleccion);
 q.insertBefore(nodo('p','Varones. Cada vía usa sus casos con dato de oportunidad diagnóstica como denominador. DT incluye enfermedad avanzada; las barras se comparan, no se suman.','nota'),q.lastElementChild);

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
 mapa(panel(grid,`Diagnóstico tardío por jurisdicción · ${r}`),prov,'tardio','%','#237bd1',r);mapa(panel(grid,`Enfermedad avanzada por jurisdicción · ${r}`),prov,'avanzada','%','#d67555',r);
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
  }else if(pagina==='genero'){
   const filas=T.genero.filter(r=>r.geografia===e.g&&r.edad===e.e&&r.anio===ultimo);
   const razon=T.razon.find(r=>r.geografia===e.g&&r.edad===e.e&&r.anio===ultimo);
   const valor=genero=>filas.find(r=>r.serie===genero)?.valor;
   tarjetas.push([`Proporción de varones · ${ultimo}`,porcentaje(valor('Varón')),`${e.g} · ${e.e}`],
    [`Proporción de mujeres · ${ultimo}`,porcentaje(valor('Mujer')),'Otras categorías permanecen en el gráfico'],
    [`Razón varones / mujeres · ${ultimo}`,exacto(razon?.valor,1),'Cociente de diagnósticos, no una tasa poblacional']);
  }else if(pagina==='edad'){
   const filas=T.edad.filter(r=>r.geografia===e.g&&r.genero===e.s&&r.anio===ultimo),grupo=mayor(filas);
   const mediana=T.mediana.find(r=>r.geografia===e.g&&r.genero===e.s&&r.anio===ultimo);
   const mayores=suma(filas.filter(r=>['55-64','65 o más'].includes(r.serie)));
   tarjetas.push([`Mediana de edad · ${ultimo}`,esNumero(mediana?.valor)?exacto(mediana.valor,0)+' años':'Sin datos',`${e.g} · ${e.s}`],
    ['Grupo de edad más frecuente',grupo?.serie||'Sin datos',grupo?porcentaje(grupo.valor)+' de los diagnósticos':'Sin datos'],
    ['Proporción de 55 años o más',porcentaje(mayores),`Distribución por edad · ${ultimo}`]);
  }else if(pagina==='vias'){
   const filas=T.vias.filter(r=>r.geografia===e.g&&r.genero===e.s&&r.edad===e.e);
   const periodos=uniq(filas.map(r=>r.anio)).sort((a,b)=>a-b).slice(-5),anio=periodos.at(-1);
   const actuales=filas.filter(r=>r.anio===anio),via=mayor(actuales),desconocida=actuales.find(r=>/desconoc/i.test(r.serie));
   tarjetas.push([`Vía de mayor proporción${anio?' · '+anio:''}`,porcentaje(via?.valor),via?.serie||'Sin datos'],
    ['Vía desconocida',porcentaje(desconocida?.valor),`${e.g} · ${e.s} · ${e.e}`],
    ['Período mostrado',periodos.length?`${periodos[0]}–${anio}`:'Sin datos','Últimos cinco años disponibles para esta selección']);
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
 $('contenido').replaceChildren();document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-current',b.dataset.pagina===pagina?'page':'false'));
 ({casos:seccionCasos,geografia:seccionGeografia,genero:seccionGenero,edad:seccionEdad,vias:seccionVias,diagnostico:seccionDiagnostico,'mapas-diagnostico':seccionMapasDiagnostico})[pagina]($('contenido'));presentarResumen();ajustarPantalla();}
 paginas.forEach(([id,nombre,path])=>{const b=nodo('button');b.dataset.pagina=id;const colorIcono={casos:['#307de0','#e8f0fd'],geografia:['#277cb7','#e9f3f9'],genero:['#a649c6','#f5eafa'],edad:['#26913c','#edf6ee'],vias:['#009ca5','#e8f5f5'],diagnostico:['#cf419b','#faedf6'],'mapas-diagnostico':['#be8c18','#fbf4e4']}[id];b.style.setProperty('--icono',colorIcono[0]);b.style.setProperty('--icono-fondo',colorIcono[1]);const icon=svg('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':1.7,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':true,class:'nav-icon'});icon.append(svg('path',{d:path}));b.append(icon,nodo('span',nombre));b.onclick=()=>{pagina=id;history.replaceState(null,'',`#${id}`);render();$('titulo').focus();};$('navegacion').append(b);});
 $('navegacion').append($('restablecer'));
 $('periodo').textContent=`Fuente: SNVS / SISA · Diagnósticos ${anios[0]}–${anios.at(-1)}`;$('fecha-exportacion').textContent=`Fecha de exportación de la base: ${D.meta.fecha_exportacion||'no informada'}`;$('demo').hidden=!D.meta.demostracion;
 $('restablecer').onclick=()=>{estados[pagina]={};render();};window.addEventListener('hashchange',()=>{if(paginas.some(p=>p[0]===location.hash.slice(1))){pagina=location.hash.slice(1);render();}});
 document.addEventListener('click',e=>document.querySelectorAll('.control details[open]').forEach(d=>{if(!d.contains(e.target))d.open=false;}));document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.control details[open]').forEach(d=>{d.open=false;d.querySelector('summary').focus();});});
 $('abrir-metodologia').onclick=()=>abrirDialogo('Acerca de los datos',$('metodologia').content.cloneNode(true));$('cerrar-dialogo').onclick=()=>$('dialogo').close();let vistaMovil=innerWidth<=700;window.addEventListener('resize',()=>{const nueva=innerWidth<=700;if(nueva!==vistaMovil){vistaMovil=nueva;render();}else ajustarPantalla();});
 render();
})();
