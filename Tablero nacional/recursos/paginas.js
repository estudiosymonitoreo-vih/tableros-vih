// Autor: Ariel Adaszko
"use strict";
(() => {
  const d = JSON.parse(document.getElementById("datos-tablero").textContent), t = d.tablas;
  const $ = id => document.getElementById(id), colores = ["#9ed9fa","#f1ac60","#b2a0dd","#86bbc0","#65b8cb","#d5cc8e","#d6a3ca"];
  const f = (v,n=0) => Number.isFinite(v) ? new Intl.NumberFormat("es-AR",{maximumFractionDigits:n,minimumFractionDigits:n}).format(v) : "—";
  const el = (tag,cl,text) => { const e=document.createElement(tag); if(cl)e.className=cl; if(text!==undefined)e.textContent=text; return e; };
  const ns="http://www.w3.org/2000/svg", sv=(tag,attrs={},text)=>{const e=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;};
  const uniq=a=>[...new Set(a)], numeric=v=>Number.isFinite(v);
  const normalizarJurisdiccion=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/, argentina$/,'');
  const desconocida=v=>normalizarJurisdiccion(v)==='desconocido';
  function ordenJurisdiccion(v){const n=normalizarJurisdiccion(v);return n==='pais'?0:['ciudad de buenos aires','ciudad autonoma de buenos aires','caba'].includes(n)?1:['provincia de buenos aires','buenos aires'].includes(n)?2:n==='hospitales nacionales'?4:n==='servicios penitenciarios'?5:3;}
  const compararJurisdicciones=(a,b)=>ordenJurisdiccion(a)-ordenJurisdiccion(b)||a.localeCompare(b,'es');
  const etiquetaJurisdiccion=v=>ordenJurisdiccion(v)===1?'Ciudad de Buenos Aires':ordenJurisdiccion(v)===2?'Buenos Aires':v;
  const provincia=()=>$("provincia").value;
  const filas=id=>(t[id]||[]).filter(r=>r.Provincia_atencion===provincia());
  // Editorial 3.0: navegación dentro del lienzo para escalar junto al contenido, sin restar una barra lateral.
  const main=document.querySelector("main"),viewport=el("div","reporte-viewport");main.querySelector("header").after(document.querySelector("aside"));main.querySelector("footer").append(document.querySelector(".volver-tableros"));main.before(viewport);viewport.append(main);
  function dimensionar(){const movil=innerWidth<700,ancho=innerWidth-32,escala=movil?1:Math.min(ancho/1366,Math.max(1,innerHeight-24)/768);main.style.transform=movil?"none":`scale(${escala})`;viewport.style.width=movil?"100%":`${1366*escala}px`;viewport.style.height=movil?"auto":`${768*escala}px`;}
  dimensionar();
  const general=()=>d.general.find(r=>r.Provincia_atencion===provincia())||{};
  const vacio=host=>host.append(el("p","sin-datos","Sin datos disponibles para esta selección."));
  const panel=(host,titulo,cl="")=>{const p=el("section","grafico-panel "+cl);p.append(el("h3","rotulo",titulo));const c=el("div","interior");p.append(c);host.append(p);return c;};
  const nota=(host,text)=>host.append(el("p","nota",text));
  const participacion=(a,k)=>{const total=a.reduce((s,r)=>s+(numeric(r[k])?r[k]:0),0);return a.map(r=>({...r,participacion:total>0&&numeric(r[k])?100*r[k]/total:null}));};
  const leyenda=(host,labels,paleta=colores)=>{const l=el("div","leyenda");labels.forEach((s,i)=>{const x=el("span",null,s),c=el("i");c.style.background=paleta[i%paleta.length];x.prepend(c);l.append(x)});host.append(l);};
  function tabla(host,datos,cols,limite=6) {
    if(!datos.length)return vacio(host);
    const estado={q:"",col:host.classList.contains("tabla-definiciones")?null:cols[1]?.[0]||cols[0][0],desc:true};
    const entrada=el("input","buscar");entrada.type="search";entrada.placeholder="Buscar…";entrada.setAttribute("aria-label","Buscar en tabla");
    host.classList.add('tabla-con-controles');const toggle=el('button','abrir-busqueda','⌕');toggle.type='button';toggle.setAttribute('aria-label','Mostrar búsqueda en tabla');toggle.onclick=()=>{host.classList.toggle('tabla-buscando');if(host.classList.contains('tabla-buscando'))entrada.focus()};
    const vista=el("div","tabla-scroll"),pie=el("div","paginacion");host.append(toggle,entrada,vista,pie);
    function pintar(){
      let a=datos.filter(r=>cols.some(([k])=>String(r[k]??"").toLocaleLowerCase().includes(estado.q)));
      if(estado.col)a=a.slice().sort((x,y)=>{const v=x[estado.col],w=y[estado.col];return (numeric(v)&&numeric(w)?v-w:String(v??"").localeCompare(String(w??""),"es"))*(estado.desc?-1:1)});
      vista.tabIndex=0;vista.setAttribute("aria-label","Lista desplazable; usar rueda o flechas");
      const table=el("table"),head=el("thead"),tr=el("tr");
      cols.forEach(([k,n])=>{const th=el("th"),b=el("button",null,n+(estado.col===k?(estado.desc?" ▾":" ▴"):""));b.type="button";b.onclick=()=>{estado.desc=estado.col===k?!estado.desc:false;estado.col=k;pintar()};th.append(b);tr.append(th)});head.append(tr);table.append(head);
      const body=el("tbody");a.forEach(r=>{const row=el("tr");cols.forEach(([k,,dec=0,pct=false])=>{row.append(el("td",null,numeric(r[k])?f(r[k],dec)+(pct?"%":""):String(r[k]??"—")))});body.append(row)});table.append(body);vista.replaceChildren(table);
      pie.replaceChildren(el("span",null,`${a.length} registros`));
    }
    entrada.oninput=()=>{estado.q=entrada.value.toLocaleLowerCase();vista.scrollTop=0;pintar()};pintar();
  }
  function barras(host,datos,x,y,serie=null,{horizontal=false,pct=false,linea=false,log=false,conBarras=false,formato=null}={}) {
    const a=datos.filter(r=>numeric(r[y])&&r[x]!==null&&r[x]!==undefined);
    if(!a.length)return vacio(host);
    const xs=uniq(a.map(r=>String(r[x]))),ss=serie?uniq(a.map(r=>String(r[serie]))):["Valor"];
    // Nunca sumar claves repetidas silenciosamente.
    if(new Set(a.map(r=>JSON.stringify([r[x],serie?r[serie]:""]))).size!==a.length){nota(host,"Hay claves duplicadas en la fuente; no se agregaron valores.");return;}
    const territorial=!!host.closest('.territorial'),historico=!!host.closest('.historico-grafico'),cs=historico?["#f6a04d","#4285f4","#ae7ce5"]:colores;
    const anualTarv=!!host.closest('.evolucion-anual'),anualPrep=!!host.closest('.es-prep .profilaxis-anual'),anualPep=!!host.closest('.es-pep .profilaxis-anual'),reserva=anualTarv?94:anualPrep?56:anualPep?20:serie?32:12;
    const perfilMediana=!!host.closest('.perfil-mediana');
    const W=Math.max(200,host.clientWidth),H=Math.max(120,host.clientHeight-(perfilMediana?0:reserva),host.closest(".perfil-residencia")?xs.length*26+60:0),left=horizontal?(anualTarv||anualPrep?45:Math.min(170,W*.38)):52,right=horizontal?58:26,top=host.closest(".comparativo-barras")?4:22,bottom=horizontal?(host.closest(".comparativo-barras")?14:26):historico?(xs.length<=8?42:110):anualPep?30:perfilMediana?42:territorial?38:56,iw=W-left-right,ih=H-top-bottom;
    const bruto=Math.max(0,...a.map(r=>r[y])),pot=10**Math.floor(Math.log10(bruto/4||1)),salto=[1,2,2.5,5,10].find(z=>z*pot>=bruto/4)*pot;
    const max=pct?100:Math.ceil(bruto/(salto||1))*(salto||1),min=Math.min(0,...a.map(r=>r[y]));
    const minDato=Math.min(...a.map(r=>r[y])),estricta=log&&minDato>0&&bruto/minDato>=10,simetrica=log&&minDato<=0;
    const trans=v=>estricta?Math.log10(v):simetrica?Math.sign(v)*Math.log10(1+Math.abs(v)):v;
    const lo=estricta?Math.floor(Math.log10(minDato)):trans(min),hi=estricta?Math.ceil(Math.log10(max)):trans(max);
    const unit=v=>estricta&&v===0?0:(trans(v)-lo)/(hi-lo||1);
    const s=sv("svg",{viewBox:`0 0 ${W} ${H}`,class:"grafico-svg",role:"img","aria-label":host.parentElement.querySelector("h3")?.textContent||"Gráfico"});
    if(host.closest(".perfil-residencia")){s.style.minHeight=H+"px";s.style.flex="none";}
    const ticks=estricta?Array.from({length:Math.max(1,Math.round(hi-lo)+1)},(_,i)=>lo+i):(horizontal&&W<280?[0,2,4]:[0,1,2,3,4]).map(i=>lo+(hi-lo)*i/4);
    ticks.forEach(v=>{const q=(v-lo)/(hi-lo||1),pos=horizontal?left+iw*q:top+ih-ih*q,val=estricta?10**v:simetrica?Math.sign(v)*(10**Math.abs(v)-1):v,txt=formato?formato(val):null;const texto=txt?.endsWith('%')?txt:Math.abs(val)>=1000?f(val/1000,Math.abs(val)%1000?1:0)+" mil":txt||f(val,pct?0:Math.abs(val)<2&&val!==0?1:0)+(pct?"%":"");s.append(sv("line",horizontal?{x1:pos,y1:top,x2:pos,y2:top+ih,stroke:"#ffffff38"}:{x1:left,y1:pos,x2:W-right,y2:pos,stroke:"#ffffff38"}));s.append(sv("text",{x:horizontal?pos:left-5,y:horizontal?H-8:pos+4,"text-anchor":horizontal?"middle":"end",fill:"white","font-size":11},texto));});
    xs.forEach((label,i)=>{if(!horizontal&&!historico&&xs.length>12&&i%Math.ceil(xs.length/18)!==0&&i!==xs.length-1)return;const pos=(i+.5)*(horizontal?ih:iw)/xs.length,x=horizontal?left-7:left+pos,y=horizontal?top+pos+4:historico?H-bottom+(xs.length<=8?16:10):anualPep?H-12:perfilMediana?H-13:territorial?H-bottom+18:H-36,attrs={x,y,"text-anchor":horizontal?"end":"middle",fill:"white","font-size":11};if(!horizontal&&xs.length>12){attrs.transform=`rotate(${historico?-90:-55} ${x} ${y})`;attrs["text-anchor"]="end";attrs["font-size"]=historico?10:9;}const text=/^\d{4}-\d{2}-\d{2}$/.test(label)?label.slice(0,7):label.replace(/^Provincia de /i,''),node=sv("text",attrs,text.length>(historico?20:24)?text.slice(0,historico?19:23)+"…":text);if(!horizontal&&xs.length<=8&&text.includes(' ')){node.textContent='';const words=text.split(' '),parts=words.length>2?[words.slice(0,2).join(' '),words.slice(2).join(' ')]:words;parts.forEach((v,j)=>node.append(sv('tspan',{x,dy:j?11:0},v)));}s.append(node);});
    ss.forEach((name,j)=>{
      let path=[];
      xs.forEach((label,i)=>{const r=a.find(r=>String(r[x])===label&&(!serie||String(r[serie])===name));if(!r){if(path.length){s.append(sv("polyline",{points:path.join(" "),fill:"none",stroke:colores[j%7],"stroke-width":2}));path=[];}return;}
        const step=(horizontal?ih:iw)/xs.length,band=step*.8/ss.length,base=horizontal?left+iw*unit(0):top+ih-ih*unit(0),pos=horizontal?left+iw*unit(r[y]):top+ih-ih*unit(r[y]);
        if(linea){const px=left+(i+.5)*iw/xs.length;if(conBarras)s.append(sv("rect",{x:left+i*step+step*.1,y:Math.min(base,pos),width:step*.8,height:Math.abs(pos-base),fill:colores[1]}));path.push(`${px},${pos}`);const c=sv("circle",{cx:px,cy:pos,r:2.5,fill:colores[j%7]});c.append(sv("title",{},`${label} · ${name}: ${f(r[y],2)}`));s.append(c);return;}
        const color=cs[(serie?j:!horizontal&&xs.length<=8?i:0)%cs.length];
        const unica=!horizontal&&a.length===1,ancho=unica?Math.min(64,band*.9):band*.9,bx=unica?left+iw/2-ancho/2:left+i*step+step*.1+j*band;
        const rect=sv("rect",horizontal?{x:Math.min(base,pos),y:top+i*step+step*.1+j*band,width:Math.max(0.5,Math.abs(pos-base)),height:band*.9,fill:color}:{x:bx,y:Math.min(base,pos),width:ancho,height:Math.max(.5,Math.abs(pos-base)),fill:color});if(horizontal){const cy=top+i*step+step*.1+(j+.45)*band;rect.setAttribute('y',cy-1);rect.setAttribute('height',2);rect.setAttribute('rx',1);rect.setAttribute('opacity',.7);const punto=sv('circle',{cx:pos,cy,r:Math.max(2.4,Math.min(4,band*.32)),fill:color,class:'punto-dato','data-categoria':label,'data-valor':r[y]});punto.append(sv('title',{},`${label} · ${name}: ${f(r[y],2)}${pct?'%':''}`));s.append(punto);}rect.setAttribute('class','barra-dato');rect.setAttribute('data-categoria',label);rect.setAttribute('data-valor',r[y]);rect.append(sv("title",{},`${label} · ${name}: ${f(r[y],2)}${pct?"%":""}`));s.append(rect);
        if((xs.length<=8||horizontal)&&!(horizontal&&band<11)){const texto=formato?formato(r[y]):f(r[y],pct?1:0)+(pct?"%":""),tx=horizontal?Math.min(W-5,pos+8):unica?left+iw/2:left+i*step+step*.1+(j+.45)*band,ty=horizontal?top+i*step+step*.1+(j+.65)*band:pos-5;s.append(sv("text",{class:"etiqueta-valor",x:tx,y:ty,fill:"white","font-size":horizontal?10:11,"text-anchor":horizontal?"start":"middle"},texto));}
      });if(path.length)s.append(sv("polyline",{points:path.join(" "),fill:"none",stroke:colores[j%7],"stroke-width":2}));
    });host.append(s);if(serie)leyenda(host,ss,cs);if(anualTarv)nota(host,"(**) Si la fecha de actualización es previa al 30/6 del año, se toma el último mes procesado.");if(log)host.dataset.escala=estricta?"logaritmica":simetrica?"simetrica":"lineal";
  }
  function dona(host,a,label,valor,pctCampo=null,solida=false){
    const datos=a.filter(r=>numeric(r[valor])&&r[valor]>=0),total=datos.reduce((s,r)=>s+r[valor],0);if(!total)return vacio(host);
    const genero=["Genero","género"].includes(label);if(genero){const orden=host.closest('.es-pep')?["Mujer CIS","Mujer","Varón CIS","Varón","Mujer trans","Varón trans","Otro","Otros","SD","Desconocido"]:["Varón CIS","Varón","Mujer CIS","Mujer","Mujer trans","Varón trans","Otro","Otros","SD","Desconocido"];datos.sort((x,y)=>{const a=orden.indexOf(x[label]),b=orden.indexOf(y[label]);return (a<0?99:a)-(b<0?99:b)})}
    const indiceGenero=n=>/^Varón( CIS| cis)?$/.test(n)?0:/^Mujer( CIS| cis)?$/.test(n)?1:n==='Mujer trans'?2:n==='Varón trans'?3:n==='Otro'||n==='Otros'?4:5,paleta=datos.map((r,i)=>colores[genero?indiceGenero(r[label]):i%7]);
    const cohorte=!!host.closest(".evolucion-cohorte");
    const s=sv("svg",{viewBox:cohorte?"0 0 300 240":"38 8 224 224",class:"dona-svg",role:"img","aria-label":"Distribución"});let offset=0;const radio=solida?(cohorte?40:55):83,circ=2*Math.PI*radio;
    const labels=[],externas=[];
    datos.forEach((r,i)=>{const p=r[valor]/total,c=sv("circle",{cx:150,cy:120,r:radio,fill:"none",stroke:paleta[i],"data-categoria":r[label],"data-valor":r[valor],"data-porcentaje":p*100,"stroke-width":solida?(cohorte?80:110):55,"stroke-dasharray":`${p*circ} ${circ*(1-p)}`,"stroke-dashoffset":-offset*circ,transform:"rotate(-90 150 120)"});const texto=`${r[label]}: ${f(r[valor])} · ${f(pctCampo?r[pctCampo]:p*100,1)}%`;c.append(sv("title",{},texto));s.append(c);if(p>.07||cohorte&&p>0){const angle=(offset+p/2)*2*Math.PI-Math.PI/2,rr=solida?45:83;if(cohorte&&p<=.07){externas.push({angle,texto:f(p*100,1)+"%",lado:Math.cos(angle)<0?-1:1,y:120+100*Math.sin(angle)});}else labels.push(sv("text",{x:150+rr*Math.cos(angle),y:124+rr*Math.sin(angle),"text-anchor":"middle",fill:"#183051","font-size":13},f(pctCampo?r[pctCampo]:p*100,1)+"%"));}offset+=p;});labels.forEach(x=>s.append(x));
    for(const lado of [-1,1]){const grupo=externas.filter(e=>e.lado===lado).sort((a,b)=>a.y-b.y);grupo.forEach((e,i)=>e.y=Math.max(16,e.y,i?grupo[i-1].y+17:16));if(grupo.length&&grupo.at(-1).y>224){const exceso=grupo.at(-1).y-224;grupo.forEach(e=>e.y-=exceso)}grupo.forEach(e=>{const x=150+lado*105;s.append(sv('polyline',{points:[(150+80*Math.cos(e.angle))+','+(120+80*Math.sin(e.angle)),(150+92*Math.cos(e.angle))+','+e.y,x+','+e.y].join(' '),fill:'none',stroke:'#ffffffaa','stroke-width':1}));s.append(sv('text',{x:x+lado*3,y:e.y+4,'text-anchor':lado<0?'end':'start',fill:'white','font-size':12,class:'porcentaje-segmento'},e.texto))})}
    host.append(s);leyenda(host,datos.map(r=>String(r[label]).replace(" CIS","").replace("Desconocido","SD").replace(/^En TARV$/,'Continúa en TARV')),paleta);
  }
  function apiladas(host,a,genero,edad,valor){
    const datos=a.filter(r=>numeric(r[valor])&&r[valor]>=0);if(!datos.length)return vacio(host);host.classList.add("apilado-host");const gs=uniq(datos.map(r=>r[genero]));let es=uniq(datos.map(r=>r[edad]));if(es.includes("<18")){const o=["<18","18-24","65 o más","25-34","35-44","45-54","55-64"];es.sort((a,b)=>o.indexOf(a)-o.indexOf(b))}
    const W=Math.max(180,host.clientWidth-95),H=Math.max(180,host.clientHeight),L=36,T=22,B=42,iw=W-L-5,ih=H-T-B,s=sv("svg",{viewBox:`0 0 ${W} ${H}`,class:"grafico-svg",role:"img","aria-label":"Distribución porcentual por género y edad"});
    [0,25,50,75,100].forEach(v=>{const y=T+ih-v/100*ih;s.append(sv("line",{x1:L,y1:y,x2:W-5,y2:y,stroke:"#ffffff40"}));s.append(sv("text",{x:L-3,y:y+4,fill:"white","font-size":10,"text-anchor":"end"},v+"%"));});
    gs.forEach((g,i)=>{let base=0;es.forEach((e,j)=>{const r=datos.find(r=>r[genero]===g&&r[edad]===e);if(!r)return;const x=L+i*iw/gs.length+3,w=iw/gs.length-6,rect=sv("rect",{x,y:T+ih-(base+r[valor])/100*ih,width:w,height:r[valor]/100*ih,fill:colores[j%7]});rect.append(sv("title",{},`${g} · ${e}: ${f(r[valor],1)}%`));s.append(rect);if(r[valor]>8)s.append(sv("text",{x:x+w/2,y:T+ih-(base+r[valor]/2)/100*ih+3,"text-anchor":"middle",fill:"#18284b","font-size":9},f(r[valor],1)+"%"));base+=r[valor];});const text=sv("text",{x:L+(i+.5)*iw/gs.length,y:host.closest('.perfil-edad')?H-13:H-23,"text-anchor":"middle",fill:"white","font-size":10});String(g).replace(" CIS","").split(" ").forEach((v,j)=>text.append(sv("tspan",{x:L+(i+.5)*iw/gs.length,dy:j?11:0},v)));s.append(text);});host.append(s);leyenda(host,es);const lista=host.querySelector(".leyenda");[...lista.children].reverse().forEach(n=>lista.append(n));
  }
  function medidor(host,v,n){if(!numeric(v)){vacio(host);return;}const s=sv("svg",{viewBox:"0 0 240 68",class:"medidor medidor-lineal",role:"img","aria-label":`${f(v,1)}%`});s.append(sv("text",{x:0,y:24,fill:"#9ed9fa","font-size":26,"font-weight":700},f(v,1)+"%"),sv("rect",{x:0,y:36,width:240,height:8,fill:"#536385"}),sv("rect",{x:0,y:36,width:240*Math.max(0,Math.min(100,v))/100,height:8,fill:"#9ed9fa"}),sv("text",{x:0,y:62,fill:"white","font-size":10},"0%"),sv("text",{x:240,y:62,fill:"white","font-size":10,"text-anchor":"end"},"100%"));host.append(el("div","numero-indicador",f(n)),s);}
  function mapa(host,a,nombre="nombre_institucion",cantidad="cantidad"){
    window.crearMapaSVIH(host,a,{nombre,cantidad,seleccion:provincia()});
  }
  function serieMixta(host,a,estudios,personas,promedio){
    if(!a.length)return vacio(host);
    const contadores=a.filter(r=>[personas,estudios].includes(r["Métrica"])).map(r=>({...r,"Métrica":r["Métrica"]===personas?"Personas":"Estudios"}));
    contadores.sort((x,y)=>(x["Métrica"]==="Personas"?0:1)-(y["Métrica"]==="Personas"?0:1)||x["Año"]-y["Año"]);
    barras(host,contadores,"Año","Valor","Métrica");
    const s=host.querySelector("svg");if(!s)return;
    const ratios=a.filter(r=>r["Métrica"]===promedio&&numeric(r.Valor)).sort((x,y)=>x["Año"]-y["Año"]),xs=uniq(contadores.map(r=>String(r["Año"]))),max=Math.ceil(Math.max(1,...ratios.map(r=>r.Valor))*2)/2;
    const width=s.viewBox.baseVal.width,height=s.viewBox.baseVal.height,base=height-60,plot=height-76;
    const points=ratios.map(r=>`${55+(xs.indexOf(String(r["Año"]))+.5)*(width-73)/xs.length},${base-r.Valor/max*plot}`);
    s.querySelectorAll('.etiqueta-valor').forEach(e=>{const ex=Number(e.getAttribute('x')),ey=Number(e.getAttribute('y'));ratios.forEach(r=>{const rx=55+(xs.indexOf(String(r['Año']))+.5)*(width-73)/xs.length,ry=base-r.Valor/max*plot;if(Math.abs(ex-rx)<(width-73)/xs.length*.45&&Math.abs(ey-ry)<18)e.setAttribute('y',Math.min(ey,ry-20));});});
    s.append(sv("polyline",{points:points.join(" "),fill:"none",stroke:"white","stroke-width":2}));
    ratios.forEach(r=>{const x=55+(xs.indexOf(String(r["Año"]))+.5)*(width-73)/xs.length,y=base-r.Valor/max*plot;s.append(sv("circle",{cx:x,cy:y,r:2.5,fill:"white"}),sv("text",{x:x-24,y:y-10,fill:"white","font-size":11,"text-anchor":"middle"},f(r.Valor,2)))});
    for(let v=0;v<=max+.001;v+=max<=3?.5:1)s.append(sv("text",{x:width-2,y:base-v/max*plot+4,fill:"white","font-size":11,"text-anchor":"end"},f(v,Number.isInteger(v)?0:1)));
    const legend=host.querySelector('.leyenda'),prom=el('span'),line=el('i');line.style.background='white';line.style.height='2px';prom.append(line,document.createTextNode('Promedio'));legend?.append(prom);
  }
  function flujo(host,a){
    const orderSources=['En_TARV','Alta'],orderTargets=['En TARV','Perdidos 180 días o más','Posiblemente migró de subsistema de salud','Perdidos 90 a 179 días','Fallecido'];
    const rows=a.filter(r=>numeric(r.value)&&r.value>0).slice().sort((a,b)=>orderSources.indexOf(a.source)-orderSources.indexOf(b.source)||orderTargets.indexOf(a.target)-orderTargets.indexOf(b.target));if(!rows.length)return vacio(host);
    const order=['En TARV','Perdidos 180 días o más','Posiblemente migró de subsistema de salud','Perdidos 90 a 179 días','Fallecido'],sources=uniq(rows.map(r=>r.source)).sort((a,b)=>(a==='En_TARV'?-1:1)),targets=uniq(rows.map(r=>r.target)).sort((a,b)=>order.indexOf(a)-order.indexOf(b)),sums=(key,v)=>rows.filter(r=>r[key]===v).reduce((s,r)=>s+r.value,0),total=rows.reduce((s,r)=>s+r.value,0),W=host.clientWidth,H=host.clientHeight,L=48,R=W-48,gap=host.closest(".tt-evolucion")?14:host.closest(".territorial")?22:12,scale=Math.max(30,H-24-Math.max(0,targets.length-1)*gap)/total;
    const s=sv("svg",{viewBox:`0 0 ${W} ${H}`,class:"grafico-svg",role:"img","aria-label":"Flujos de situación de tratamiento"}),sy={},ty={},paleta=['#bd79aa','#b09a37','#989354','#8c8d3c','#6dbac4'];let y=10;sources.forEach(v=>{sy[v]=y;s.append(sv("rect",{x:L,y,width:12,height:sums('source',v)*scale,fill:v==='Alta'?'#7873ba':'#c1a340'}));s.append(sv("text",{x:L+16,y:y+12,fill:"white","font-size":10},v==='En_TARV'?'Hace un año':v));s.append(sv("text",{x:L-5,y:y+Math.max(9,sums('source',v)*scale/2),"text-anchor":"end",fill:"white","font-size":11,class:"valor-nodo"},f(sums('source',v))));y+=sums('source',v)*scale+gap});y=10;targets.forEach((v,i)=>{ty[v]=y;s.append(sv("rect",{x:R,y,width:12,height:sums('target',v)*scale,fill:paleta[i%5]}));s.append(sv("text",{x:R-5,y:y+10,"text-anchor":"end",fill:"white","font-size":9},v==='En TARV'?'Ahora':v==='Posiblemente migró de subsistema de salud'?'Posible cambio de subsector':v==='Perdidos 180 días o más'?'Sin retiro ≥180 días':v==='Perdidos 90 a 179 días'?'Sin retiro 90–179 días':v));s.append(sv("text",{x:R+16,y:y+Math.max(9,sums('target',v)*scale/2),fill:"white","font-size":11,class:"valor-nodo"},f(sums('target',v))));y+=sums('target',v)*scale+gap});rows.forEach(r=>{const h=r.value*scale,path=sv("path",{d:`M${L+12} ${sy[r.source]} C${W*.4} ${sy[r.source]},${W*.6} ${ty[r.target]},${R} ${ty[r.target]} L${R} ${ty[r.target]+h} C${W*.6} ${ty[r.target]+h},${W*.4} ${sy[r.source]+h},${L+12} ${sy[r.source]+h} Z`,fill:paleta[targets.indexOf(r.target)%5],'fill-opacity':.55,class:'cinta-sankey','data-source':r.source,'data-target':r.target,'data-inicio':sy[r.source],'data-fin':ty[r.target],'data-alto':h});path.append(sv('title',{},`${r.source} → ${r.target}: ${f(r.value)}`));s.prepend(path);if(r.source==='En_TARV'&&r.target==='En TARV')s.append(sv('text',{x:(L+12+R)/2,y:(sy[r.source]+ty[r.target]+h)/2,'text-anchor':'middle','dominant-baseline':'middle',fill:'white','font-size':12,'font-weight':700,class:'valor-cinta-principal'},f(r.value)));sy[r.source]+=h;ty[r.target]+=h});host.append(s);
  }
  function tortaCohorte(host,rows){const orden=['En TARV','Perdidos 180 días o más','Posiblemente migró de subsistema de salud','Perdidos 90 a 179 días','Fallecido'];const cohorte=rows.filter(r=>r.source==='En_TARV').slice().sort((a,b)=>orden.indexOf(a.target)-orden.indexOf(b.target));dona(host,cohorte,'target','value',null,true);}
  // Motor visual compartido; las vistas territoriales tienen filtros y contratos propios.
  window.SVIH_UI={el,sv,panel,tabla:tablaEditorial,barras,medidor,flujo,tortaCohorte,serieMixta,mapa,nota,leyenda,f,dimensionar,compararJurisdicciones,etiquetaJurisdiccion};
  if(d.ambito&&d.ambito!=="nacional"){window.addEventListener("resize",dimensionar);return;}
  const home=el("div","pagina pagina-principal");home.id="vista-general";
  document.querySelectorAll("main>section").forEach(s=>home.append(s));document.querySelector("main").insertBefore(home,document.querySelector("footer"));
  const mini=el("div");mini.id="mini-mapa";home.append(mini);window.crearMapaComparativoSVIH(mini,[],{mini:true,seleccion:provincia()});
  const notas=el("div","notas-principal");notas.append(el("p",null,"(*) Los indicadores epidemiológicos corresponden a información suministrada por todos los subsistemas de salud al SNVS. TARV y PrEP corresponden al subsector público."),el("p",null,"(**) Si la fecha de actualización es previa al 30/6 del año, se toma el último mes procesado."));home.append(notas);
  const otras=el("div","pagina");otras.id="vista-pagina";home.after(otras);
  const paginas=[["general","General TARV"],["perfil","Perfil"],["tratamiento","Tratamiento"],["evolucion","Evolución TARV"],["laboratorio","Laboratorio"],["prep","PrEP"],["pep","PeP"],["comparativo","Comparativo"],["historico","Evolución y comparación"],["definiciones","Definiciones"]];
  let activa="general",histIndicador=null,histPeriodos=null,histJurisdicciones=null,indicadorComparativo="N_TARV";
  // Símbolos semánticos a color: tablero, población, cápsula, trayectoria,
  // laboratorio, prevención, urgencia, territorio, comparación y glosario.
  const iconos={
    general:['#2765ca','M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z'],
    perfil:['#9354b4','M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M1 21v-3a5 5 0 0 1 10 0v3M17 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6M14 21v-3a4 4 0 0 1 8 0v3'],
    tratamiento:['#078d90','M4 12 12 4a5.66 5.66 0 0 1 8 8l-8 8a5.66 5.66 0 0 1-8-8ZM8 8l8 8'],
    evolucion:['#3b8c47','M2 6h5v5M3 10a9 9 0 1 0 3-6M8 16l3-4 3 2 4-6'],
    laboratorio:['#b44b97','M9 2h6M10 2v8L3 21h18l-7-11V2M7 15h10M10 18h.1M14 17h.1'],
    prep:['#198869','M12 2 3 6v6c0 6 9 10 9 10s9-4 9-10V6ZM7 12l3 3 7-7'],
    pep:['#d45b26','M4 3h16v18H4ZM10 6h4v4h4v4h-4v4h-4v-4H6v-4h4Z'],
    comparativo:['#3976ac','M2 5l7-3 6 3 7-3v17l-7 3-6-3-7 3ZM9 2v17M15 5v17'],
    historico:['#b77b0e','M2 3v18h20M6 17V9h3v8ZM12 17V5h3v12ZM18 17v-6h3v6Z'],
    definiciones:['#7163aa','M2 3h7l3 3 3-3h7v17h-7l-3 2-3-2H2ZM12 6v16M5 8h4M5 12h4M15 8h4M15 12h4']
  };
  const nav=document.querySelector("nav");nav.replaceChildren();paginas.forEach(([id,nombre])=>{const a=el("a"),[color,dibujo]=iconos[id],icono=sv("svg",{viewBox:"0 0 24 24",class:"nav-icon","aria-hidden":"true",fill:"none",stroke:color,"stroke-width":1.8,"stroke-linejoin":"round","stroke-linecap":"round"});icono.style.background=color+'18';icono.append(sv("path",{d:dibujo}));a.append(icono,el("span",null,nombre));a.href="#"+id;a.dataset.pagina=id;nav.append(a);});
  const tarjetasTotal=(host,items)=>items.forEach(([nombre,v,pct])=>{const p=panel(host,nombre,"mini");p.append(el("div","numero-indicador",f(v,pct?1:0)+(pct?"%":"")));});
  // Composición de las maquetas aprobadas, con datos del contrato original.
  // Las vistas completas comparten diálogo nativo, cierre y limpieza (también Escape).
  function abrirDialogoEditorial(titulo, dibujar) {
    const modal=el('dialog','editorial-dialog'),cabecera=el('div','dialog-cabecera');
    const encabezado=el('h2',null,titulo);encabezado.id='titulo-vista-completa';modal.setAttribute('aria-labelledby',encabezado.id);
    const cerrar=el('button',null,'Cerrar');cerrar.type='button';cerrar.onclick=()=>modal.close();
    const cuerpo=el('div','dialog-tabla');cabecera.append(encabezado,cerrar);modal.append(cabecera,cuerpo);document.body.append(modal);
    modal.addEventListener('close',()=>modal.remove());modal.showModal();dibujar(cuerpo);
  }
  function tablaEditorial(host, datos, cols, limite = 5) {
    if(host.classList.contains("tabla-definiciones"))return tabla(host,datos,cols,limite);
    if (!datos.length) return vacio(host);
    const clave = cols[1]?.[0] || cols[0][0];
    const orden = datos.slice().sort((a,b) => numeric(a[clave]) && numeric(b[clave]) ? b[clave]-a[clave] : String(b[clave]??'').localeCompare(String(a[clave]??''),'es'));
    const vista = el('div','tabla-editorial-previa');
    host.append(vista);
    tabla(vista, orden.slice(0,limite), cols);
    vista.querySelector('.paginacion')?.remove();
    vista.querySelector('.abrir-busqueda')?.remove();
    vista.querySelectorAll('td:first-child').forEach(td => td.title=td.textContent);
    const abrir = el('button','ver-completo',`${f(datos.length)} registros · ver tabla completa`);
    abrir.type='button';host.append(abrir);
    abrir.onclick=()=>abrirDialogoEditorial(host.closest('.grafico-panel')?.querySelector('h3')?.textContent||'Tabla completa',cuerpo=>tabla(cuerpo,datos,cols));
  }
  function jurisdiccionesPerfil(host) {
    // Ambas series usan el total nacional TARV al corte. El Porcentaje de residencia
    // del caché excluye NA en su denominador y por eso no se compara directamente.
    const total=d.general.find(r=>ordenJurisdiccion(r.Provincia_atencion)===0)?.N_TARV;
    if(!numeric(total)||total<=0){nota(host,'No hay un total nacional de personas en TARV válido para calcular los porcentajes.');return;}
    const clave=v=>ordenJurisdiccion(v)===1?'caba':ordenJurisdiccion(v)===2?'buenos aires':normalizarJurisdiccion(v);
    const datos=new Map();let duplicada=false;
    const incorporar=(filas,campo,numerador,serie)=>{
      const vistas=new Set();
      filas.forEach(r=>{
        const nombre=r[campo];if(typeof nombre!=='string'||!nombre.trim()||ordenJurisdiccion(nombre)===0)return;
        const k=clave(nombre);if(vistas.has(k)){duplicada=true;return;}vistas.add(k);
        if(!datos.has(k))datos.set(k,{jurisdiccion:etiquetaJurisdiccion(nombre.replace(/, Argentina$/i,'')),residencia:null,atencion:null});
        datos.get(k)[serie]=numeric(r[numerador])&&r[numerador]>=0?100*r[numerador]/total:null;
      });
    };
    incorporar(t.residencia||[],'Prov_residencia','Personas','residencia');
    incorporar(d.general,'Provincia_atencion','N_TARV','atencion');
    if(duplicada){nota(host,'Hay jurisdicciones duplicadas en la fuente; no se agregaron valores.');return;}
    const filas=[...datos.values()].sort((a,b)=>(b.residencia??-1)-(a.residencia??-1)||(b.atencion??-1)-(a.atencion??-1)||compararJurisdicciones(a.jurisdiccion,b.jurisdiccion));
    if(!filas.length)return vacio(host);
    const dibujar=cuerpo=>{
      cuerpo.classList.add('perfil-jurisdicciones');
      leyenda(cuerpo,['Residencia','Atención']);
      const scroll=el('div','perfil-jurisdicciones-grafico');scroll.tabIndex=0;scroll.setAttribute('aria-label','Jurisdicciones: residencia y atención; lista desplazable');cuerpo.append(scroll);
      const W=Math.max(280,cuerpo.clientWidth),L=W>550?225:Math.min(150,W*.43),R=55,T=24,paso=44,H=T+filas.length*paso+25,iw=W-L-R;
      const max=Math.max(10,Math.ceil(Math.max(...filas.flatMap(r=>[r.residencia??0,r.atencion??0]))/10)*10);
      const s=sv('svg',{viewBox:`0 0 ${W} ${H}`,class:'grafico-svg',role:'img','aria-label':'Porcentaje del total nacional de personas en TARV por jurisdicción de residencia y atención'});
      s.style.height=H+'px';s.style.minHeight=H+'px';
      for(let i=0;i<=4;i++){const valor=max*i/4,x=L+iw*i/4;s.append(sv('line',{x1:x,y1:T,x2:x,y2:H-20,stroke:'#ffffff38'}),sv('text',{x,y:15,'text-anchor':'middle',fill:'white','font-size':10},f(valor,valor%1?1:0)+'%'));}
      filas.forEach((r,i)=>{
        const y=T+i*paso,label=sv('text',{x:L-8,y:y+23,'text-anchor':'end',fill:'white','font-size':11},r.jurisdiccion.length>(W>550?32:21)?r.jurisdiccion.slice(0,W>550?31:20)+'…':r.jurisdiccion);
        label.append(sv('title',{},r.jurisdiccion));s.append(label);
        ['residencia','atencion'].forEach((serie,j)=>{
          const valor=r[serie],by=y+6+j*15,color=colores[j],texto=numeric(valor)?f(valor,1)+'%':'—';
          if(numeric(valor)){
            const barra=sv('rect',{x:L,y:by,width:iw*valor/max,height:11,fill:color,class:'barra-dato','data-categoria':r.jurisdiccion,'data-serie':serie,'data-valor':valor});
            barra.append(sv('title',{},`${r.jurisdiccion} · ${j?'Atención':'Residencia'}: ${texto}`));s.append(barra);
          }
          s.append(sv('text',{x:L+(numeric(valor)?iw*valor/max:0)+5,y:by+10,fill:color,'font-size':10,class:'etiqueta-valor'},texto));
        });
      });scroll.append(s);
      nota(cuerpo,'Porcentaje del total nacional de personas en TARV. —: sin dato en la fuente.');
    };
    dibujar(host);
    const ver=el('button','ver-completo','Ver todas las jurisdicciones');ver.type='button';ver.setAttribute('aria-haspopup','dialog');
    ver.onclick=()=>abrirDialogoEditorial('Jurisdicción de residencia y atención',dibujar);host.parentElement.append(ver);
  }
  function medianaEditorial(host, datos) {
    const a=datos.filter(r=>numeric(r.Mediana_edad));if(!a.length)return vacio(host);
    const W=Math.max(320,host.clientWidth),H=Math.max(120,host.clientHeight),L=106,R=72,T=9,B=30,max=Math.max(60,Math.ceil(Math.max(...a.map(r=>r.Mediana_edad))/10)*10),iw=W-L-R,ih=H-T-B;
    const s=sv('svg',{viewBox:`0 0 ${W} ${H}`,class:'grafico-svg',role:'img','aria-label':'Mediana de edad según género, en años'});
    for(let v=0;v<=max;v+=10){const x=L+v/max*iw;s.append(sv('line',{x1:x,y1:T,x2:x,y2:H-B,stroke:'#ffffff20'}),sv('text',{x,y:H-16,fill:'white','font-size':12,'text-anchor':'middle'},String(v)));}
    a.forEach((r,i)=>{const y=T+(i+.5)*ih/a.length,x=L+r.Mediana_edad/max*iw;
      s.append(sv('text',{x:L-12,y:y+4,fill:'white','font-size':13,'text-anchor':'end'},r.Genero),sv('line',{x1:L,y1:y,x2:x,y2:y,stroke:'#9ed9fa','stroke-width':2}));
      const punto=sv('circle',{cx:x,cy:y,r:5,fill:'#9ed9fa','data-valor':r.Mediana_edad});punto.append(sv('title',{},`${r.Genero}: ${f(r.Mediana_edad)} años`));s.append(punto,sv('text',{x:x+14,y:y+4,fill:'white','font-size':13,'font-weight':600},`${f(r.Mediana_edad)} años`));
    });host.append(s);
  }
  function edadEditorial(host, datos) {
    const a=datos.filter(r=>numeric(r.Porcentaje)&&r.Porcentaje>=0);if(!a.length)return vacio(host);
    const grupos=['Mujer','Mujer trans','Varón','Varón trans'],edades=uniq(a.map(r=>r.Grupo_edad)),paleta=['#577ab3','#7895ca','#a6b9e0','#4294d0','#64b8bf','#acd5ca','#edc77b'];
    const W=Math.max(320,host.clientWidth),H=Math.max(125,host.clientHeight-30),L=100,T=4,B=24,iw=W-L-15,ih=H-T-B,paso=ih/4,alto=Math.min(21,paso*.64);
    const s=sv('svg',{viewBox:`0 0 ${W} ${H}`,class:'grafico-svg',role:'img','aria-label':'Porcentajes por género y grupo de edad'});
    [0,25,50,75,100].forEach(v=>{const x=L+v/100*iw;s.append(sv('line',{x1:x,y1:T,x2:x,y2:H-B,stroke:'#ffffff18'}),sv('text',{x,y:H-5,fill:'#dce7f4','font-size':11,'text-anchor':'middle'},v+'%'));});
    grupos.forEach((g,i)=>{const cy=T+(i+.5)*paso,y=cy-alto/2;let acumulado=0;
      s.append(sv('text',{x:L-12,y:cy+4,fill:'white','font-size':12,'text-anchor':'end'},g));
      edades.forEach((edad,j)=>{const r=a.find(r=>r.Genero===g&&r.Grupo_edad===edad);if(!r)return;const x=L+acumulado/100*iw,w=r.Porcentaje/100*iw;
        const rect=sv('rect',{x,y,width:w,height:alto,fill:paleta[j%paleta.length],stroke:'#242c50','stroke-width':.6,'data-valor':r.Porcentaje});rect.append(sv('title',{},`${g} · ${edad}: ${f(r.Porcentaje,1)}%`));s.append(rect);
        if(w>=39)s.append(sv('text',{x:x+w/2,y:cy+3,'text-anchor':'middle',fill:j>=2?'#12283c':'white','font-size':9,'font-weight':600},f(r.Porcentaje,1)+'%'));
        acumulado+=r.Porcentaje;
      });
    });host.append(s);leyenda(host,edades,paleta);
  }
  function perfil(host){
    const g=el('div','diseno-perfil');host.append(g);
    const resumen=panel(g,'Personas en TARV','perfil-resumen'),hero=el('div','perfil-total');hero.append(el('strong',null,f(general().N_TARV)),el('span',null,'personas en TARV'));resumen.append(hero);
    const grupos=[['Varones',['Varón CIS','Varón cis','Varón']],['Mujeres',['Mujer CIS','Mujer cis','Mujer']],['Mujeres trans',['Mujer trans']],['Varones trans',['Varón trans']],['Otros',['Otros','Otro']],['Sin información',['Desconocido','SD']]];
    const cifras=el('div','cifras-genero');grupos.forEach(([nombre,aliases])=>{const r=filas('genero').find(r=>aliases.includes(r.Genero)),c=el('div');c.append(el('small',null,nombre),el('strong',null,f(r?.Casos)));cifras.append(c)});resumen.append(cifras);
    const composicion=panel(g,'Distribución por género','perfil-genero'),ring=el('div','genero-ring'),lista=el('div','genero-leyenda');composicion.append(ring,lista);dona(ring,filas('genero'),'Genero','Casos','Porcentaje');ring.querySelector('.leyenda')?.remove();
    const dibujo=ring.querySelector('svg');if(dibujo){dibujo.querySelectorAll('text').forEach(e=>e.remove());dibujo.append(sv('text',{x:150,y:118,'text-anchor':'middle',fill:'white','font-size':27,'font-weight':700},f(general().N_TARV)),sv('text',{x:150,y:139,'text-anchor':'middle',fill:'white','font-size':12},'personas'));}
    const paleta=['#9ed9fa','#f1ac60','#b2a0dd','#75c3ca','#bfdceb','#edf2f8'];
    grupos.forEach(([nombre,aliases],i)=>{const r=filas('genero').find(r=>aliases.includes(r.Genero)),linea=el('div'),muestra=el('i');muestra.style.background=paleta[i];linea.append(muestra,el('span',null,nombre),el('strong',null,f(r?.Casos)),el('span',null,numeric(r?.Porcentaje)?f(r.Porcentaje,1)+'%':'—'));lista.append(linea)});
    dibujo?.querySelectorAll('circle').forEach((c,i)=>c.setAttribute('stroke',paleta[i%paleta.length]));
    tablaEditorial(panel(g,'Residencia de las personas en TARV','perfil-localidades'),participacion(filas('localidades'),'Cantidad'),[['Localidad_residencia','Localidad'],['Cantidad','Personas'],['participacion','%',1,true]],5);
    const residencia=panel(g,'Jurisdicción de residencia y atención','perfil-residencia');residencia.dataset.excepcion='nacional';
    jurisdiccionesPerfil(residencia);
    const orden=['Mujer CIS','Varón CIS','Mujer trans','Varón trans'],adultos=r=>orden.includes(r.Genero);
    medianaEditorial(panel(g,'Mediana de edad según género','perfil-mediana'),filas('mediana').filter(adultos).sort((a,b)=>orden.indexOf(a.Genero)-orden.indexOf(b.Genero)).map(r=>({...r,Genero:r.Genero.replace(' CIS','')})));
    edadEditorial(panel(g,'Distribución por género y edad','perfil-edad'),filas('edad').filter(adultos).map(r=>({...r,Genero:r.Genero.replace(' CIS','')})));
  }
  function tratamiento(host){
    const a=filas('tratamiento')[0]||{},g=el('div','diseno-tratamiento');host.append(g);
    const superior=el('div','tratamiento-superior');g.append(superior);
    tarjetasTotal(superior,[['Personas en TARV',general().N_TARV],['Ya deberían haber retirado nuevamente medicación',a.Porc_caducados,true],['Instituciones que dispensan TARV',general().N_instituciones_disp_TARV]]);
    superior.children[1].append(el('small','nota-carga','Puede estar afectado por demoras de carga'));
    [['Esquemas basados en DTG','Prop_DTG_tto','N_DTG_tto','dtg'],['Biterapia','Prop_biterapia','Biterapia','biterapia'],['Primera línea de primera elección','Porc_recomendado','N_recomendado','recomendado']].forEach(([n,p,v,cl])=>medidor(panel(g,n,cl),a[p],a[v]));
    g.querySelector('.biterapia>.rotulo').append(el('small','subtitulo-esquema','DTG/3TC o DTG/DRV800'));
    tablaEditorial(panel(g,'Principales esquemas','esquemas'),filas('esquemas'),[['drogas','Esquema'],['cantidad','Personas'],['cantidad_p','%',1,true]],5);
    tablaEditorial(panel(g,'Personas en TARV por institución','instituciones'),participacion(d.mapa.filter(r=>r.Provincia_atencion===provincia()),'cantidad'),[['nombre_institucion','Institución'],['cantidad','Personas'],['participacion','%',1,true]],5);
    barras(panel(g,'Meses de medicación en última entrega','meses'),['1','2','3_mas'].map((k,i)=>({mes:['1 mes','2 meses','3 meses o más'][i],valor:a['Prop_TARV_'+k+(k==='1'||k==='2'?'_mes':'')]})),'mes','valor',null,{pct:true});
    barras(panel(g,'Personas en TARV por fármaco','drogas'),['XTC','DTG','DRV800','RAL','EFV','AZT','NVP'].map(k=>({droga:k,valor:a['Prop_'+k+'_tto']})),'droga','valor',null,{pct:true,horizontal:true});
    barras(panel(g,'Líneas de tratamiento · 15 años o más','lineas'),[1,2,3].map(k=>({linea:k+'ª línea',valor:a['Porc_tto_'+k]})),'linea','valor',null,{pct:true});
  }
  function evolucion(host){
    const g=el("div","diseno-evolucion");host.append(g);
    const nombres={N_VIH_seguimiento:"Con alguna prestación en servicios de salud",Dispensa_TARV:"Al menos una dispensa en el año",Personas_en_TARV:"En TARV al 30/6 del año",Anio_1er_TARV:"Primera dispensa ese año"};
    const tipos=["N_VIH_seguimiento","Dispensa_TARV","Personas_en_TARV","Anio_1er_TARV"];
    const anual=filas("anual_tarv").slice().sort((a,b)=>Number(b.Anio)-Number(a.Anio)||tipos.indexOf(a.Tipo_de_metrica)-tipos.indexOf(b.Tipo_de_metrica)).map(r=>({...r,Tipo_de_metrica:nombres[r.Tipo_de_metrica]||r.Tipo_de_metrica}));
    barras(panel(g,"Evolución de las personas en TARV","evolucion-anual"),anual,"Anio","Valor","Tipo_de_metrica",{horizontal:true});
    const resumen=el("div","evolucion-resumen");g.append(resumen);const cad=filas("tratamiento")[0]?.N_TARV_caducado;
    tarjetasTotal(resumen,[["En TARV normal",numeric(cad)&&numeric(general().N_TARV)?general().N_TARV-cad:null],["Ya deberían haber vuelto",cad],["3 a 6 meses sin retiro",general().perdidos_90_179],["180 días o más sin retiro",general().perdidos_180_mas]]);
    const porcentaje=el("small","porcentaje-caducados",f(filas("tratamiento")[0]?.Porc_caducados,1)+"% de las personas en TARV");resumen.children[1].append(porcentaje);
    flujo(panel(g,"Situación de quienes hace un año estaban en TARV","evolucion-flujo"),filas("flujo"));
    tortaCohorte(panel(g,"Situación de quienes hace un año estaban en TARV","evolucion-cohorte"),filas("flujo"));
    const mensual=panel(g,"Personas en TARV al 30 de junio de cada año","evolucion-mensual"),datosMes=filas('mensual_tarv').filter(r=>numeric(r.Valor)).sort((a,b)=>a.Fecha.localeCompare(b.Fecha));barras(mensual,datosMes,"Fecha","Valor",null,{linea:true});
    const grafMes=mensual.querySelector('svg');if(grafMes&&datosMes.length){const ultimo=Number(datosMes.at(-1).Fecha.slice(0,4)),puntos=[...grafMes.querySelectorAll('circle')],H=grafMes.viewBox.baseVal.height;datosMes.forEach((r,i)=>{const anio=Number(r.Fecha.slice(0,4));if(r.Fecha.slice(5,7)!=='06'||anio>=ultimo||anio<ultimo-4||!puntos[i])return;const x=puntos[i].getAttribute('cx');grafMes.append(sv('text',{x,y:H*.52,'text-anchor':'middle',fill:'white','font-size':11},String(anio)),sv('text',{x,y:H*.52+24,'text-anchor':'middle',fill:anio===ultimo-1?'#f6a04d':'white','font-size':22},f(r.Valor)));});grafMes.querySelectorAll('polyline').forEach(p=>p.setAttribute('stroke','#b8d8f6'));grafMes.querySelectorAll('circle').forEach(p=>p.setAttribute('fill','#b8d8f6'));}
  }
  function laboratorio(host){
    const g=el("div","diseno-laboratorio");host.append(g);const resumen=panel(g,"% de personas en TARV con carga viral indetectable","laboratorio-viral"),actual=general();
    resumen.append(el("strong","viral-valor",f(actual.Prop_indetectables,1)+"%"),el("div","viral-ic",`IC 95   ${f(actual.Prop_indetect_IC95_inf,1)}%  ${f(actual.Prop_indetect_IC95_sup,1)}%`));
    const cobertura=el("div","viral-cobertura");cobertura.append(el("span",null,"Información sobre carga viral"),el("strong",null,f(actual.Prop_con_info_cv,1)+"%"));resumen.append(cobertura);
    const cd=panel(g,"Distribución de CD4 en personas en TARV","laboratorio-cd4"),info=el("div","cd4-cobertura");info.append(el("span",null,"Información sobre CD4"),el("strong",null,f(filas("cd4_cobertura")[0]?.Prop_con_info_cd4,1)+"%"));cd.append(info);
    const ordenCD4=["500 o más","350 a 499","200 a 349","<200"],dist=filas("cd4_distribucion").slice().sort((a,b)=>ordenCD4.indexOf(a.intervalo_cd4)-ordenCD4.indexOf(b.intervalo_cd4));if(!dist.length)vacio(cd);else{const bar=el("div","cd4-barra");dist.forEach((r,i)=>{const seg=el("span",null,f(r.porcentaje,1)+"%");seg.style.width=(numeric(r.porcentaje)?r.porcentaje:0)+"%";seg.style.background=colores[i%7];seg.title=r.intervalo_cd4+": "+f(r.n_personas)+" personas";bar.append(seg)});cd.append(bar);leyenda(cd,dist.map(r=>r.intervalo_cd4));}
    serieMixta(panel(g,"Estudios de carga viral por año","laboratorio-estudios-cv"),filas("cv"),"CV","CV_p","Promedio_CV");
    serieMixta(panel(g,"Estudios de CD4 por año","laboratorio-estudios-cd4"),filas("cd4"),"CD4","CD4_p","Promedio_CD4");
    const avisos=el('div','notas-laboratorio');avisos.append(el('p',null,document.querySelector('.aviso-origen').textContent),el('p',null,'(*) Los números bajos en algunas jurisdicciones indican que en las mismas no se están cargando los datos en el sistema.'));host.append(avisos);
  }
  function profilaxis(host,tipo){
    const prep=tipo==="prep",g=el("div","diseno-profilaxis "+(prep?"es-prep":"es-pep"));host.append(g);
    if(prep){const r=filas("prep")[0]||{},c=panel(g,"Personas en PrEP","profilaxis-resumen");tarjetasTotal(c,[["N° de personas en PrEP",r.N_prep],["% por provincia donde retira",r.Porc_prep,true]]);}
    const anual=prep?filas("anual_prep").filter(r=>r.etiqueta===(provincia()==="País"?"País":"TOTAL PROVINCIA")).sort((a,b)=>b.anio-a.anio||(a.indicador==="Inicios"?-1:1)).map(r=>({...r,indicador:r.indicador==="Inicios"?"Personas con primer retiro ese año":"Personas con al menos un retiro en el año"})):filas("anual_pep");
    barras(panel(g,prep?"Evolución personas en PrEP":"PeP por año","profilaxis-anual"),anual,prep?"anio":"Anio",prep?"valor":"Valor",prep?"indicador":"Indicador",{horizontal:prep});
    const inst=filas("mapa_"+tipo),nombre=prep?"nombre_institucion":"Institucion",cant=prep?"cantidad":"Cantidad";
    tablaEditorial(panel(g,prep?"Personas en PrEP por institución":"Instituciones que dispensaron PeP los últimos 12 meses","profilaxis-instituciones"),participacion(inst,cant),[[nombre,"Institución"],[cant,"N"],["participacion","%",1,true]],6);
    mapa(panel(g,prep?"Localización de instituciones que distribuyen PrEP":"Instituciones que dispensaron PeP los últimos 12 meses","profilaxis-mapa"),inst,nombre,cant);
    barras(panel(g,prep?"Evolución de personas en PrEP por mes y año":"Evolución de personas en PeP","profilaxis-mensual"),filas("mensual_"+tipo).sort((a,b)=>String(a.Fecha||a.periodo).localeCompare(String(b.Fecha||b.periodo))),prep?"Fecha":"periodo",prep?"Valor":"valor",null,{linea:prep,conBarras:prep});
    dona(panel(g,"Distribución por género","profilaxis-genero"),filas("genero_"+tipo),prep?"género":"Genero",prep?"casos":"Personas",prep?"porcentaje":"Porcentaje");
    const grupo=prep?"género":"Genero",orden=prep?["Varón trans","Varón CIS","Mujer trans","Mujer CIS"]:["Varón CIS","Mujer CIS","Mujer trans","Varón trans"];apiladas(panel(g,"Distribución por género y edad","profilaxis-edad"),filas("edad_"+tipo).filter(r=>orden.includes(r[grupo])).sort((a,b)=>orden.indexOf(a[grupo])-orden.indexOf(b[grupo])),grupo,prep?"grupo_edad":"Grupo_edad",prep?"porcentaje":"Porcentaje");
  }
  function historico(host){
    const rows=(t.historico||[]).filter(r=>!desconocida(r.Provincia_atencion)),controles=el("div","controles-historicos");host.append(controles);const etiquetas=window.SVIH_ETIQUETAS_INDICADORES;const inds=uniq(rows.map(r=>r.Indicador)).filter(k=>Object.hasOwn(etiquetas,k)),periodos=uniq(rows.map(r=>r.Periodo)).sort().reverse();
    if(!inds.length){vacio(host);return;}if(!inds.includes(histIndicador))histIndicador=inds.includes("N_TARV")?"N_TARV":inds[0];if(!histPeriodos)histPeriodos=periodos.slice(0,1);
    const jurisdicciones=uniq(rows.map(r=>r.Provincia_atencion)).sort(compararJurisdicciones);
    if(histJurisdicciones===null)histJurisdicciones=jurisdicciones.includes("País")?["País"]:jurisdicciones.slice(0,1);else histJurisdicciones=histJurisdicciones.filter(v=>jurisdicciones.includes(v));
    const jurisd=el('details','selector-jurisdicciones'),resumenJurisd=el('summary'),opcionesJurisd=el('div','opciones-periodos');jurisd.append(resumenJurisd,opcionesJurisd);controles.append(jurisd);
    const resumenSeleccion=()=>{resumenJurisd.textContent=histJurisdicciones.length===jurisdicciones.length?'Jurisdicciones: todas ▾':histJurisdicciones.length===1?etiquetaJurisdiccion(histJurisdicciones[0])+' ▾':`Jurisdicciones (${histJurisdicciones.length}) ▾`;};resumenSeleccion();
    const todasLabel=el('label'),todas=el('input');todas.type='checkbox';todas.checked=histJurisdicciones.length===jurisdicciones.length;todasLabel.append(todas,document.createTextNode('Todos'));opcionesJurisd.append(todasLabel);
    jurisdicciones.forEach(v=>{const l=el('label'),c=el('input');c.type='checkbox';c.value=v;c.checked=histJurisdicciones.includes(v);c.dataset.jurisdiccion=v;l.append(c,document.createTextNode(etiquetaJurisdiccion(v)));opcionesJurisd.append(l);c.onchange=()=>{histJurisdicciones=[...opcionesJurisd.querySelectorAll('[data-jurisdiccion]:checked')].map(x=>x.value);todas.checked=histJurisdicciones.length===jurisdicciones.length;todas.indeterminate=histJurisdicciones.length>0&&!todas.checked;resumenSeleccion();dibujar()};});
    todas.indeterminate=histJurisdicciones.length>0&&!todas.checked;todas.onchange=()=>{histJurisdicciones=todas.checked?jurisdicciones.slice():[];opcionesJurisd.querySelectorAll('[data-jurisdiccion]').forEach(c=>c.checked=todas.checked);resumenSeleccion();dibujar()};
    const lab=el("label",null,"Indicador "),sel=el("select");inds.forEach(v=>{const o=el("option",null,etiquetas[v]);o.value=v;sel.append(o)});sel.value=histIndicador;lab.append(sel);controles.append(lab);
    const periodLabel=el("div","selector-periodos"),multi=el("details"),summary=el("summary"),opciones=el("div","opciones-periodos");multi.append(summary,opciones);periodLabel.append(multi);controles.append(periodLabel);
    const actualizarResumen=()=>{summary.textContent=histPeriodos.length===1?"Período: "+new Date(histPeriodos[0]+"T12:00:00").toLocaleDateString("es-AR",{day:"2-digit",month:"short",year:"numeric"})+" ▾":`Período (${histPeriodos.length}) ▾`;};actualizarResumen();
    periodos.forEach(v=>{const l=el("label"),c=el("input");c.type="checkbox";c.value=v;c.checked=histPeriodos.includes(v);l.append(c,document.createTextNode(new Date(v+"T12:00:00").toLocaleDateString("es-AR",{day:"2-digit",month:"short",year:"numeric"})));opciones.append(l);c.onchange=()=>{histPeriodos=[...opciones.querySelectorAll("input:checked")].map(i=>i.value);actualizarResumen();dibujar()};});
    const graf=panel(host,"Evolución de indicadores por período","historico-grafico"),estadisticas=el("div","resumen-historico");
    host.append(estadisticas);
    const dibujar=()=>{
      graf.replaceChildren();estadisticas.replaceChildren();const pct=etiquetas[histIndicador].startsWith("%"),a=rows.filter(r=>r.Indicador===histIndicador&&histPeriodos.includes(r.Periodo)&&histJurisdicciones.includes(r.Provincia_atencion)).sort((a,b)=>compararJurisdicciones(a.Provincia_atencion,b.Provincia_atencion)||b.Periodo.localeCompare(a.Periodo)).map(r=>({...r,periodo_visible:new Date(r.Periodo+"T12:00:00").toLocaleDateString("es-AR",{day:"2-digit",month:"short",year:"numeric"})}));
      barras(graf,a,"Provincia_atencion","Valor","periodo_visible",{formato:v=>f(v,pct?1:0)+(pct?"%":"")});
      const hayBarras=!!graf.querySelector('.barra-dato'),periodosVisibles=uniq(histPeriodos).sort().reverse();
      estadisticas.classList.toggle('varios-periodos',periodosVisibles.length>1);
      for(const periodo of periodosVisibles){
        const grupo=el('section','resumen-periodo');grupo.dataset.periodo=periodo;grupo.append(el('h3',null,new Date(periodo+'T12:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'})));estadisticas.append(grupo);
        const visibles=hayBarras?a.filter(r=>r.Periodo===periodo&&numeric(r.Valor)):[],valores=visibles.map(r=>r.Valor).sort((a,b)=>a-b),n=valores.length;
        const resumen={Mediana:n?(n%2?valores[(n-1)/2]:valores[n/2-1]/2+valores[n/2]/2):null,'Máximo':n?valores[n-1]:null,'Mínimo':n?valores[0]:null};
        for(const [nombre,v]of Object.entries(resumen)){
          const c=el('div','estadistica-periodo'),valor=el('strong',null,n?f(v,pct||!Number.isInteger(v)?1:0)+(pct?'%':''):'—');valor.dataset.valor=n?v:'';c.dataset.estadistica=nombre;c.append(el('span',null,nombre),valor);
          if(n&&nombre!=='Mediana'){const nombres=uniq(visibles.filter(r=>r.Valor===v).map(r=>r.Provincia_atencion)).sort(compararJurisdicciones).map(etiquetaJurisdiccion);c.append(el('small','jurisdiccion-extremo',nombres.join(' · ')));}
          grupo.append(c);
        }
      }
      if(!periodosVisibles.length)estadisticas.append(el('p','sin-datos','Sin períodos seleccionados.'));
    };
    sel.onchange=()=>{histIndicador=sel.value;dibujar()};dibujar();
  }

  function comparativo(host){
    const datos=t.comparativo||[],g=el("div","comparativo-grid"),selector=el("div","selector-comparativo"),encabezado=el("div","encabezado-selector","Indicador (1)"),buscar=el("input","buscar-indicador"),lista=el("div","lista-indicadores"),vista=el("div","comparativo-vista"),titulo=el("h3","titulo-comparativo"),cuerpo=el("div","comparativo-cuerpo"),mapaHost=el("div","comparativo-mapa"),barHost=el("div","comparativo-barras");buscar.type="search";buscar.placeholder="Escribí el término de búsqueda";buscar.setAttribute("aria-label","Buscar indicador provincial");selector.append(encabezado,buscar,lista);cuerpo.append(mapaHost,barHost);vista.append(titulo,cuerpo);g.append(selector,vista);host.append(g);
    const configs=window.SVIH_COMPARATIVO;function dibujar(){const cfg=configs.find(x=>x.id===indicadorComparativo),formato=v=>numeric(v)?f(v,cfg.tipo==="numero"?0:1)+(cfg.tipo==="porcentaje"?"%":""):"—";titulo.textContent=cfg.titulo;const rows=datos.filter(r=>r.Provincia_atencion!=="País"&&!desconocida(r.Provincia_atencion)).map(r=>({...r,valor:window.valorComparativoSVIH(r,cfg)})),pais=datos.find(r=>r.Provincia_atencion==="País");window.crearMapaComparativoSVIH(mapaHost,rows,{formato,nacional:window.valorComparativoSVIH(pais,cfg)});barHost.replaceChildren();barras(barHost,rows.slice().sort((a,b)=>(b.valor??-Infinity)-(a.valor??-Infinity)),"Provincia_atencion","valor",null,{horizontal:true,log:cfg.tipo==="numero",formato});lista.querySelectorAll("input").forEach(i=>i.checked=i.value===indicadorComparativo);mapaHost.dataset.indicador=cfg.id;barHost.dataset.indicador=cfg.id;}
    configs.forEach(cfg=>{const l=el("label"),radio=el("input");radio.type="radio";radio.name="indicador-provincial";radio.value=cfg.id;l.append(radio,el("span",null,cfg.etiqueta));lista.append(l);radio.onchange=()=>{indicadorComparativo=radio.value;dibujar()};});buscar.oninput=()=>{const q=buscar.value.toLocaleLowerCase();lista.querySelectorAll("label").forEach(l=>l.hidden=!l.textContent.toLocaleLowerCase().includes(q));};dibujar();
  }
  const titulos={perfil:"Perfil de las personas con VIH que están en TARV",tratamiento:"Características del TARV",evolucion:"Evolución del TARV",laboratorio:"Carga viral y CD4",prep:"Personas en PrEP",pep:"Profilaxis post exposición",comparativo:"Comparativo por provincia",historico:"Evolución indicadores y comparador interjurisdiccional",definiciones:"Definición de indicadores"};
  function mostrar(){
    main.dataset.vista=activa;document.querySelector(".barra").hidden=["historico","comparativo","definiciones"].includes(activa);const paisOption=$("provincia").querySelector('option[value="País"]');if(paisOption)paisOption.textContent=activa==="historico"?"Jurisdicción: todas":"País";
    home.hidden=activa!=="general";otras.hidden=activa==="general";nav.querySelectorAll("a").forEach(a=>{a.classList.toggle("activo",a.dataset.pagina===activa);if(a.dataset.pagina===activa)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")});
    if(activa==="general"){otras.replaceChildren();window.ajustarRotulosSVIH?.();return;}otras.replaceChildren(el("h2","titulo-pagina",titulos[activa]));
    if(activa==="perfil")perfil(otras);if(activa==="tratamiento")tratamiento(otras);if(activa==="evolucion")evolucion(otras);if(activa==="laboratorio")laboratorio(otras);if(activa==="prep"||activa==="pep")profilaxis(otras,activa);
    if(activa==="comparativo")comparativo(otras);
    if(activa==="historico")historico(otras);
    if(activa==="definiciones"){const tablaHost=el("div","tabla-definiciones");otras.append(tablaHost);tabla(tablaHost,t.definiciones||[],[["PÁGINA DEL TABLERO","PÁGINA DEL TABLERO"],["INDICADOR","INDICADOR"],["DESCRIPCIÓN","DESCRIPCIÓN"],["OBSERVACIONES","OBSERVACIONES"]],50);nota(otras,"Abreviaturas:\nDRVIHyT: Dirección de Respuesta al VIH, ITS, Hepatitis Virales y TB.\nSNVS: Sistema Nacional de Vigilancia de la Salud.\nSVIH: Sistema de gestión de insumos de la DRVIHyT.\nTARV: Tratamiento antirretroviral de VIH.");}
  }
  function ruta(){const id=location.hash.slice(1);activa=paginas.some(([k])=>k===id)?id:"general";mostrar();}
  document.addEventListener("territorio-tablero",mostrar);window.addEventListener("hashchange",ruta);window.addEventListener("resize",()=>{dimensionar();mostrar()});ruta();
})();
