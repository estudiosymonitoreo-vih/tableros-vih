/* Tablero autónomo: consume exclusivamente tablas agregadas, sin servicios externos. */
'use strict';
(() => {
const D = window.SNVS_DATOS;
if (!D) { document.getElementById('contenido').textContent='No se pudieron cargar los datos del tablero.'; return; }
const T=D.tablas, $=id=>document.getElementById(id), NS='http://www.w3.org/2000/svg';
const colores=['#4c94f1','#efa056','#b38ae5','#b7ca6b','#32b6c9','#e7c63c','#e078b2','#807cce','#d9b886'];
const paginas=[['casos','Casos y tasas','M3 19V5m0 14h18M6 15l5-6 4 3 6-8'],['geografia','Distribución geográfica','M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2V5zm6-2v16m6-14v16'],['genero','Distribución por género','M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 2a3 3 0 1 0 0-6M2 21v-3a6 6 0 0 1 12 0v3m3-7a5 5 0 0 1 5 5v2'],['edad','Distribución por edad','M4 20V14h4v6m2 0V9h4v11m2 0V3h4v17'],['vias','Vías de transmisión','M4 5h7l6 6h4M4 19h7l6-6h4M17 7l4 4-4 4'],['diagnostico','Diagnóstico tardío','M3 12h4l3-8 4 16 3-8h4']];
const edades=['Todas las edades','0-9','10-14','15-19','20-24','25-34','35-44','45-54','55-64','65 o más'];
const generos=['Todos los géneros','Varón','Mujer','Mujer trans','Varón trans'];
const regiones=['GBA','Centro','Cuyo','NEA','NOA','Patagonia'];
const uniq=a=>[...new Set(a)], fmt=(v,d=1)=>v==null||!Number.isFinite(v)?'Sin datos':v.toLocaleString('es-AR',{maximumFractionDigits:d});
const geoSort=(a,b)=>(a==='Argentina'?-100:regiones.includes(a)?regiones.indexOf(a)-90:0)-(b==='Argentina'?-100:regiones.includes(b)?regiones.indexOf(b)-90:0)||a.localeCompare(b,'es');
const geos=uniq(T.casos.map(r=>r.geografia)).sort(geoSort), anios=uniq(T.casos.map(r=>r.anio)).sort((a,b)=>a-b);
let pagina=paginas.some(p=>p[0]===location.hash.slice(1))?location.hash.slice(1):'casos';
const estados={};
function nodo(tag,texto,cls){const n=document.createElement(tag);if(texto!=null)n.textContent=texto;if(cls)n.className=cls;return n;}
function svg(tag,attrs={},texto){const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);if(texto!=null)n.textContent=texto;return n;}
function tituloSVG(n,txt){n.append(svg('title',{},txt));return n;}
function valorSeguro(r,campo){return r[campo]==null?null:Number(r[campo]);}
function conjunto(datos,campo,orden){const opciones=uniq(datos.map(r=>r[campo]).filter(v=>v!=null));return orden?[...orden.filter(v=>opciones.includes(v)),...opciones.filter(v=>!orden.includes(v)).sort()]:opciones.sort((a,b)=>typeof a==='number'?a-b:String(a).localeCompare(String(b),'es'));}
function filtro(host,datos,campo,etiqueta,clave,inicial,multiple=false,orden){
 const opciones=conjunto(datos,campo,orden), estado=estados[pagina];
 if(!(clave in estado))estado[clave]=multiple?[inicial??opciones[0]]:(inicial??opciones[0]);
 let actual=multiple?estado[clave].filter(v=>opciones.includes(v)):estado[clave];
 if(multiple&&!actual.length)actual=[opciones[0]];
 if(!multiple&&!opciones.includes(actual))actual=opciones[0];
 estado[clave]=actual;
 const etiquetaN=nodo('div',null,'control');etiquetaN.append(nodo('span',etiqueta));
 if(!multiple){const s=nodo('select');s.setAttribute('aria-label',etiqueta);s.dataset.clave=clave;
 opciones.forEach(v=>{const o=nodo('option',String(v));o.value=String(v);o.selected=v===actual;s.append(o);});
 s.onchange=()=>{estado[clave]=opciones.find(v=>String(v)===s.value);render();};etiquetaN.append(s);
 }else{const d=nodo('details'),res=nodo('summary',actual.length===1?String(actual[0]):`${actual.length} selecciones`);d.dataset.clave=clave;d.append(res);
 const lista=nodo('div',null,'opciones'),busca=nodo('input');busca.type='search';busca.placeholder='Buscar';busca.setAttribute('aria-label',`Buscar ${etiqueta.toLowerCase()}`);const grupo=nodo('div',null,'lista-opciones');
 opciones.forEach(v=>{const l=nodo('label'),i=nodo('input');i.type='checkbox';i.checked=actual.includes(v);i.value=String(v);l.append(i,nodo('span',String(v)));
 i.onchange=()=>{const nuevos=i.checked?[...estado[clave],v]:estado[clave].filter(x=>x!==v);if(!nuevos.length){i.checked=true;return;}estado[clave]=nuevos;render();const abierto=document.querySelector(`details[data-clave="${clave}"]`);abierto.open=true;const foco=[...abierto.querySelectorAll('input[type=checkbox]')].find(n=>n.value===String(v));if(foco)foco.focus();};grupo.append(l);});
 busca.oninput=()=>{for(const l of grupo.children)l.hidden=!l.textContent.toLocaleLowerCase('es').includes(busca.value.toLocaleLowerCase('es'));};lista.append(busca,grupo);d.append(lista);etiquetaN.append(d);
 }host.append(etiquetaN);return estado[clave];
}
function controles(host){const c=nodo('div',null,'controles');host.append(c);return c;}
function panel(host,titulo){const p=nodo('section',null,'panel');p.append(nodo('h3',titulo));host.append(p);return p;}
function layout(host,clase='dos'){const n=nodo('div',null,clase);host.append(n);return n;}
function detalle(host,filas){const d=nodo('details',null,'datos-detalle');d.append(nodo('summary','Ver datos del gráfico'));const scroll=nodo('div',null,'tabla-scroll'),table=nodo('table');
 const campos=filas.length?Object.keys(filas[0]):[],head=nodo('thead'),hr=nodo('tr');campos.forEach(c=>{const th=nodo('th',c);th.scope='col';hr.append(th);});head.append(hr);table.append(head);const body=nodo('tbody');filas.forEach(r=>{const tr=nodo('tr');campos.forEach(c=>tr.append(nodo('td',typeof r[c]==='number'?fmt(r[c],3):r[c]??'Sin datos')));body.append(tr);});table.append(body);scroll.append(table);d.append(scroll);host.append(d);
 const acciones=nodo('div',null,'acciones-datos'),b=nodo('button','Descargar CSV');b.disabled=!filas.length;b.onclick=()=>{const csv=[campos,...filas.map(r=>campos.map(c=>r[c]??''))].map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));const a=nodo('a');a.href=url;a.download=`vih-${pagina}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};acciones.append(b);host.append(acciones);
}
function vacio(host){host.append(nodo('p','Sin datos para esta selección.','vacio'));}
function leyenda(host,series){const l=nodo('div',null,'leyenda');series.forEach((s,i)=>{const t=nodo('span'),m=nodo('i',null,'muestra');m.style.background=colores[i%colores.length];t.append(m,document.createTextNode(s));l.append(t);});host.append(l);}
function grafico(host,filas,{tipo='linea',porcentaje=false,unidad='',ordenSeries=null}={}){
 if(!filas.some(r=>r.valor!=null)){vacio(host);detalle(host,filas);return;}
 const xs=uniq(filas.map(r=>r.anio)).sort((a,b)=>a-b),series=ordenSeries?ordenSeries.filter(s=>filas.some(r=>r.serie===s)):uniq(filas.map(r=>r.serie||'Valor'));
 const w=720,h=360,L=55,R=22,U=26,B=42,iw=w-L-R,ih=h-U-B;
 const s=svg('svg',{viewBox:`0 0 ${w} ${h}`,class:'grafico',role:'img','aria-label':host.querySelector('h3').textContent});tituloSVG(s,host.querySelector('h3').textContent+'. Los valores están disponibles en la tabla debajo del gráfico.');
 const max=porcentaje?100:Math.max(1,...filas.map(r=>r.valor??0))*1.13;
 const x=i=>L+(i+.5)*iw/xs.length, y=v=>U+ih*(1-v/max);
 for(let j=0;j<=4;j++){const v=max*j/4,yy=y(v);s.append(svg('line',{x1:L,x2:w-R,y1:yy,y2:yy,class:'rejilla'}),svg('text',{x:L-10,y:yy+4,'text-anchor':'end'},fmt(v,v<5?1:0)+(porcentaje?'%':'')));}
 xs.forEach((a,i)=>s.append(svg('text',{x:x(i),y:h-17,'text-anchor':'middle'},a)));
 const matriz=new Map(filas.map(r=>[`${r.anio}|${r.serie||'Valor'}`,r.valor]));
 series.forEach((nombre,j)=>{let segmentos=[],tramo=[];xs.forEach((a,i)=>{const v=matriz.get(`${a}|${nombre}`);if(v==null){if(tramo.length)segmentos.push(tramo);tramo=[];return;}
 const color=colores[j%colores.length],tooltip=`${a} · ${nombre}: ${fmt(v)}${porcentaje?'%':unidad?' '+unidad:''}`;
 if(tipo==='linea'){tramo.push([x(i),y(v)]);s.append(tituloSVG(svg('circle',{cx:x(i),cy:y(v),r:4,fill:color,tabindex:0,'aria-label':tooltip}),tooltip));}
 else {const ancho=iw/xs.length*.74;let base=0,xx=x(i)-ancho/2,bw=ancho;
 if(tipo==='apilado'){for(let k=0;k<j;k++)base+=matriz.get(`${a}|${series[k]}`)??0;}else{bw=ancho/series.length;xx+=j*bw;}
 s.append(tituloSVG(svg('rect',{x:xx,y:y(v+base),width:Math.max(1,bw-1),height:ih*v/max,fill:color,tabindex:0,'aria-label':tooltip}),tooltip));
 if(v>8&&tipo==='apilado')s.append(svg('text',{x:xx+bw/2,y:y(base+v/2)+4,'text-anchor':'middle',fill:'#fff'},fmt(v)));
 }});if(tramo.length)segmentos.push(tramo);if(tipo==='linea')segmentos.forEach(tr=>s.prepend(svg('polyline',{points:tr.map(p=>p.join(',')).join(' '),fill:'none',stroke:colores[j%colores.length],'stroke-width':2.8})));});
 host.append(s);leyenda(host,series);detalle(host,filas);
}
const nombreMapa=n=>n==='Ciudad de Buenos Aires'?'CABA':n;
function mapa(host,filas,campo='valor',unidad='',color='#237bd1'){
 const valores=new Map(filas.map(r=>[r.geografia,valorSeguro(r,campo)]));
 const validos=[...valores.values()].filter(v=>v!=null&&Number.isFinite(v));
 if(!validos.length){vacio(host);detalle(host,filas);return;}
 const max=Math.max(1,...validos),wrap=nodo('div',null,'mapa-contenedor');
 const s=svg('svg',{viewBox:'0 0 330 420',class:'mapa',role:'group','aria-label':'Mapa de Argentina por jurisdicción'}),g=svg('g');s.append(g);
 const proy=([lon,lat])=>[60+(lon+76)*Math.PI/180*500,10+(Math.log(Math.tan(Math.PI/4-21*Math.PI/360))-Math.log(Math.tan(Math.PI/4+lat*Math.PI/360)))*500];
 const anillo=ring=>ring.map((p,i)=>(i?'L':'M')+proy(p).map(v=>v.toFixed(2)).join(',')).join('')+'Z';
 const path=geom=>{const polys=geom.type==='Polygon'?[geom.coordinates]:geom.type==='MultiPolygon'?geom.coordinates:[];return polys.map(p=>p.map(anillo).join('')).join('');};
 D.mapa.paises.features.forEach(f=>g.append(svg('path',{d:path(f.geometry),fill:'#e3e9ec',stroke:'#a3b4ba'})));
 const info=nodo('div','Pasá sobre una jurisdicción o seleccionála para ver el valor.','mapa-info');info.setAttribute('aria-live','polite');
 D.mapa.provincias.features.forEach(f=>{const nombre=nombreMapa(f.id),v=valores.get(nombre),txt=`${nombre}: ${fmt(v)}${v==null?'':unidad}`;
 const p=tituloSVG(svg('path',{d:path(f.geometry),fill:v==null?'#929baa':color,'fill-opacity':v==null?1:.18+.82*v/max,'data-nombre':nombre,tabindex:0,'aria-label':txt}),txt);
 for(const ev of ['pointerenter','focus','click'])p.addEventListener(ev,()=>{info.textContent=txt;});g.append(p);});
 // CABA se ofrece además como un punto ampliado para facilitar su selección.
 const pos=proy([-58.4,-34.6]),vC=valores.get('CABA'),ct=`CABA: ${fmt(vC)}${vC==null?'':unidad}`;
 const c=tituloSVG(svg('circle',{cx:pos[0],cy:pos[1],r:4,fill:vC==null?'#929baa':color,stroke:'white',tabindex:0,'aria-label':ct}),ct);['focus','click','pointerenter'].forEach(e=>c.addEventListener(e,()=>{info.textContent=ct;}));g.append(c);
 let z=1,dx=0,dy=0;const transforma=()=>g.setAttribute('transform',`translate(${dx},${dy}) translate(165,210) scale(${z}) translate(-165,-210)`);
 const botones=nodo('div',null,'zoom');[['+','Acercar',()=>z=Math.min(6,z*1.4)],['−','Alejar',()=>z=Math.max(1,z/1.4)],['↺','Restablecer mapa',()=>{z=1;dx=0;dy=0;}]].forEach(([txt,label,fn])=>{const b=nodo('button',txt);b.setAttribute('aria-label',label);b.onclick=()=>{fn();transforma();};botones.append(b);});
 let inicio=null;s.onpointerdown=e=>{inicio=[e.clientX,e.clientY,dx,dy];s.setPointerCapture(e.pointerId);};s.onpointermove=e=>{if(inicio){const rect=s.getBoundingClientRect();dx=inicio[2]+(e.clientX-inicio[0])*330/rect.width;dy=inicio[3]+(e.clientY-inicio[1])*420/rect.height;transforma();}};s.onpointerup=s.onpointercancel=()=>{inicio=null;};
 wrap.append(s,botones);host.append(wrap,info);const escala=nodo('div',null,'escala');const grad=nodo('i',null,'gradiente');grad.style.background=`linear-gradient(90deg,#bedbf6,${color})`;escala.append(nodo('span','0'),grad,nodo('span',fmt(max)+unidad),nodo('span','Gris: sin datos'));host.append(escala);
 const ranking=nodo('div',null,'ranking');[...valores].sort((a,b)=>(b[1]??-1)-(a[1]??-1)).forEach(([n,v])=>{const row=nodo('div',null,'fila-ranking'),bar=nodo('div',null,'barra-ranking'),i=nodo('i');i.style.width=`${v==null?0:v/max*100}%`;i.style.background=color;bar.append(i);row.append(nodo('span',n),bar,nodo('strong',fmt(v)+(v==null?'':unidad)));ranking.append(row);});host.append(ranking);detalle(host,filas);
}
function seccionCasos(host){
 const grid=layout(host),p=panel(grid,'Evolución de casos y tasas'),c=controles(p);
 const ind=filtro(c,T.casos,'indicador','Indicador','indicador','Casos',true),geo=filtro(c,T.casos,'geografia','Unidad geográfica','geo','Argentina',true,geos),sexo=filtro(c,T.casos,'genero','Sexo','sexo','Ambos sexos',true,['Ambos sexos','Mujeres','Varones']),edad=filtro(c,T.casos,'edad','Grupo de edad','edad','Todas las edades',true,edades);
 const filas=T.casos.filter(r=>ind.includes(r.indicador)&&geo.includes(r.geografia)&&sexo.includes(r.genero)&&edad.includes(r.edad));
 for(const indicador of ind){const q=panel(p,indicador);grafico(q,filas.filter(r=>r.indicador===indicador).map(r=>({anio:r.anio,serie:`${r.geografia} · ${r.genero} · ${r.edad}`,valor:r.valor})),{unidad:indicador==='Casos'?'casos':'por 100.000 habitantes'});}
 p.append(nodo('p','Podés comparar múltiples unidades geográficas, sexos y edades. Cada combinación es una serie independiente. Las tasas regionales por edad pueden no estar disponibles.','nota'));
 const m=panel(grid,'Distribución provincial'),cm=controles(m),prov=T.casos.filter(r=>r.nivel==='Provincial');
 const im=filtro(cm,prov,'indicador','Indicador del mapa','im','Casos'),am=filtro(cm,prov,'anio','Año','am',anios.at(-1)),sm=filtro(cm,prov,'genero','Sexo','sm','Ambos sexos'),em=filtro(cm,prov,'edad','Grupo de edad','em','Todas las edades',false,edades);
 mapa(m,prov.filter(r=>r.indicador===im&&r.anio===am&&r.genero===sm&&r.edad===em),'valor',im==='Casos'?'':' por 100 mil');
}
function seccionGeografia(host){const c=controles(host),s=filtro(c,T.regiones,'genero','Género','s','Todos los géneros',false,generos),e=filtro(c,T.regiones,'edad','Grupo de edad','e','Todas las edades',false,edades),a=filtro(c,T.provincias,'anio','Año del mapa y ranking','a',anios.at(-1));
 const g=layout(host),p=panel(g,'Distribución de diagnósticos por región');grafico(p,T.regiones.filter(r=>r.genero===s&&r.edad===e).map(r=>({anio:r.anio,serie:r.serie,valor:r.valor})),{tipo:'apilado',porcentaje:true,ordenSeries:regiones});
 const m=panel(g,'Participación provincial en los diagnósticos');mapa(m,T.provincias.filter(r=>r.genero===s&&r.edad===e&&r.anio===a&&r.indicador==='Porcentaje'),'valor','%');m.append(nodo('p','Porcentaje sobre el total de diagnósticos de las provincias con residencia conocida, según los filtros elegidos.','nota'));}
function seccionGenero(host){const c=controles(host),g=filtro(c,T.genero,'geografia','Unidad geográfica','g','Argentina',false,geos),e=filtro(c,T.genero,'edad','Grupo de edad','e','Todas las edades',false,edades),grid=layout(host);
 grafico(panel(grid,'Proporción de diagnósticos por género'),T.genero.filter(r=>r.geografia===g&&r.edad===e).map(r=>({anio:r.anio,serie:r.serie,valor:r.valor})),{tipo:'apilado',porcentaje:true});
 grafico(panel(grid,'Razón varones / mujeres'),T.razon.filter(r=>r.geografia===g&&r.edad===e).map(r=>({anio:r.anio,serie:'Razón varones / mujeres',valor:r.valor})));}
function seccionEdad(host){const c=controles(host),g=filtro(c,T.edad,'geografia','Unidad geográfica','g','Argentina',false,geos),s=filtro(c,T.edad,'genero','Género','s','Todos los géneros',false,generos),grid=layout(host);
 grafico(panel(grid,'Distribución por grupo de edad'),T.edad.filter(r=>r.geografia===g&&r.genero===s).map(r=>({anio:r.anio,serie:r.serie,valor:r.valor})),{tipo:'apilado',porcentaje:true,ordenSeries:edades});
 grafico(panel(grid,'Mediana de edad al diagnóstico'),T.mediana.filter(r=>r.geografia===g&&r.genero===s).map(r=>({anio:r.anio,serie:'Mediana de edad',valor:r.valor})),{unidad:'años'});}
function seccionVias(host){const c=controles(host),g=filtro(c,T.vias,'geografia','Unidad geográfica','g','Argentina',false,geos),s=filtro(c,T.vias,'genero','Género','s','Varón',false,generos),e=filtro(c,T.vias,'edad','Grupo de edad','e','Todas las edades',false,edades);const disponibles=T.vias.filter(r=>r.geografia===g&&r.genero===s&&r.edad===e),ultimos=uniq(disponibles.map(r=>r.anio)).sort((a,b)=>a-b).slice(-5);
 grafico(panel(host,'Distribución según vía de transmisión · últimos cinco años disponibles'),disponibles.filter(r=>ultimos.includes(r.anio)).map(r=>({anio:r.anio,serie:r.serie,valor:r.valor})),{tipo:'barras',porcentaje:true});}
function seccionDiagnostico(host){const c=controles(host),g=filtro(c,T.diagnostico,'geografia','Unidad geográfica de la serie','g','Argentina',false,geos),s=filtro(c,T.diagnostico,'genero','Género','s','Todos los géneros',false,generos),e=filtro(c,T.diagnostico,'edad','Grupo de edad','e','Todas las edades',false,edades),a=filtro(c,T.diagnostico,'anio','Año de los mapas','a',anios.at(-1));
 const hist=T.diagnostico.filter(r=>r.geografia===g&&r.genero===s&&r.edad===e),ultimos=uniq(hist.map(r=>r.anio)).sort((a,b)=>a-b).slice(-4),p=panel(host,'Diagnóstico tardío y enfermedad avanzada');
 grafico(p,hist.filter(r=>ultimos.includes(r.anio)).flatMap(r=>[{anio:r.anio,serie:'Diagnóstico tardío (incluye avanzada)',valor:r.tardio},{anio:r.anio,serie:'Enfermedad avanzada',valor:r.avanzada}]),{tipo:'barras',porcentaje:true});
 p.append(nodo('p','Diagnóstico tardío incluye enfermedad avanzada. Las barras se comparan, no se suman. Porcentajes sobre casos con dato de oportunidad diagnóstica.','nota'));detalle(p,hist);
 const grid=layout(host),prov=T.diagnostico.filter(r=>r.genero===s&&r.edad===e&&r.anio===a&&D.mapa.provincias.features.some(f=>nombreMapa(f.id)===r.geografia));
 mapa(panel(grid,'Diagnóstico tardío por jurisdicción'),prov,'tardio','%');mapa(panel(grid,'Enfermedad avanzada por jurisdicción'),prov,'avanzada','%','#d67555');}
function render(){if(!estados[pagina])estados[pagina]={};const page=paginas.find(p=>p[0]===pagina);$('titulo').textContent=page[1];$('numero').textContent=`${String(paginas.indexOf(page)+1).padStart(2,'0')} / 06 · TABLERO EPIDEMIOLÓGICO`;
 $('contenido').replaceChildren();document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-current',b.dataset.pagina===pagina?'page':'false'));
 ({casos:seccionCasos,geografia:seccionGeografia,genero:seccionGenero,edad:seccionEdad,vias:seccionVias,diagnostico:seccionDiagnostico})[pagina]($('contenido'));}
 paginas.forEach(([id,nombre,path])=>{const b=nodo('button');b.dataset.pagina=id;const icon=svg('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':1.7,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':true});icon.append(svg('path',{d:path}));b.append(icon,nodo('span',nombre));b.onclick=()=>{pagina=id;history.replaceState(null,'',`#${id}`);render();$('titulo').focus();};$('navegacion').append(b);});
 $('periodo').textContent=`Diagnósticos ${anios[0]}–${anios.at(-1)} · Argentina`;$('actualizacion').textContent=`Actualización: ${D.meta.actualizado} (hora de Argentina)`;$('demo').hidden=!D.meta.demostracion;
 $('restablecer').onclick=()=>{estados[pagina]={};render();};window.addEventListener('hashchange',()=>{if(paginas.some(p=>p[0]===location.hash.slice(1))){pagina=location.hash.slice(1);render();}});
 document.addEventListener('click',e=>document.querySelectorAll('.control details[open]').forEach(d=>{if(!d.contains(e.target))d.open=false;}));document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.control details[open]').forEach(d=>{d.open=false;d.querySelector('summary').focus();});});
 render();
})();
