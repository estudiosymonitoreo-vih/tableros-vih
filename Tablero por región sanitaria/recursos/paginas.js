"use strict";
(() => {
  const d = JSON.parse(document.getElementById("datos-tablero").textContent), t = d.tablas;
  const $ = id => document.getElementById(id), colores = ["#4285f4","#f6a04d","#ae7ce5","#b5c956","#28b4c8","#edcd38","#e27bb4"];
  const f = (v,n=0) => Number.isFinite(v) ? new Intl.NumberFormat("es-AR",{maximumFractionDigits:n,minimumFractionDigits:n}).format(v) : "—";
  const el = (tag,cl,text) => { const e=document.createElement(tag); if(cl)e.className=cl; if(text!==undefined)e.textContent=text; return e; };
  const ns="http://www.w3.org/2000/svg", sv=(tag,attrs={},text)=>{const e=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;};
  const uniq=a=>[...new Set(a)], numeric=v=>Number.isFinite(v);
  const normalizarJurisdiccion=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/, argentina$/,'');
  const desconocida=v=>normalizarJurisdiccion(v)==='desconocido';
  function ordenJurisdiccion(v){const n=normalizarJurisdiccion(v);return n==='pais'?0:['ciudad de buenos aires','ciudad autonoma de buenos aires','caba'].includes(n)?1:['provincia de buenos aires','buenos aires'].includes(n)?2:n==='hospitales nacionales'?4:n==='servicios penitenciarios'?5:3;}
  const compararJurisdicciones=(a,b)=>ordenJurisdiccion(a)-ordenJurisdiccion(b)||a.localeCompare(b,'es');
  const etiquetaJurisdiccion=v=>ordenJurisdiccion(v)===1?'Ciudad de Buenos Aires':ordenJurisdiccion(v)===2?'Provincia de Buenos Aires':v;
  const provincia=()=>$("provincia").value;
  const filas=id=>(t[id]||[]).filter(r=>r.Provincia_atencion===provincia());
  const main=document.querySelector("main"),viewport=el("div","reporte-viewport");main.before(viewport);viewport.append(main);
  function dimensionar(){const movil=innerWidth<700,ancho=innerWidth-(movil?0:260)-32,escala=movil?1:Math.min(1,ancho/1366);main.style.transform=movil?"none":`scale(${escala})`;viewport.style.width=movil?"100%":`${1366*escala}px`;viewport.style.height=movil?"auto":`${768*escala}px`;}
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
    const anualTarv=!!host.closest('.evolucion-anual'),anualPrep=!!host.closest('.es-prep .profilaxis-anual'),anualPep=!!host.closest('.es-pep .profilaxis-anual'),reserva=anualTarv?110:anualPrep?56:anualPep?20:serie?32:12;
    const perfilMediana=!!host.closest('.perfil-mediana');
    const W=Math.max(200,host.clientWidth),H=Math.max(120,host.clientHeight-(perfilMediana?0:reserva)),left=horizontal?(anualTarv||anualPrep?45:Math.min(170,W*.38)):52,right=horizontal?58:26,top=22,bottom=horizontal?26:historico?(xs.length<=8?42:110):anualPep?30:perfilMediana?42:territorial?38:56,iw=W-left-right,ih=H-top-bottom;
    const bruto=Math.max(0,...a.map(r=>r[y])),pot=10**Math.floor(Math.log10(bruto/4||1)),salto=[1,2,2.5,5,10].find(z=>z*pot>=bruto/4)*pot;
    const max=pct?100:Math.ceil(bruto/(salto||1))*(salto||1),min=Math.min(0,...a.map(r=>r[y]));
    const minDato=Math.min(...a.map(r=>r[y])),estricta=log&&minDato>0&&bruto/minDato>=10,simetrica=log&&minDato<=0;
    const trans=v=>estricta?Math.log10(v):simetrica?Math.sign(v)*Math.log10(1+Math.abs(v)):v;
    const lo=estricta?Math.floor(Math.log10(minDato)):trans(min),hi=estricta?Math.ceil(Math.log10(max)):trans(max);
    const unit=v=>estricta&&v===0?0:(trans(v)-lo)/(hi-lo||1);
    const s=sv("svg",{viewBox:`0 0 ${W} ${H}`,class:"grafico-svg",role:"img","aria-label":host.parentElement.querySelector("h3")?.textContent||"Gráfico"});
    const ticks=estricta?Array.from({length:Math.max(1,Math.round(hi-lo)+1)},(_,i)=>lo+i):[0,1,2,3,4].map(i=>lo+(hi-lo)*i/4);
    ticks.forEach(v=>{const q=(v-lo)/(hi-lo||1),pos=horizontal?left+iw*q:top+ih-ih*q,val=estricta?10**v:simetrica?Math.sign(v)*(10**Math.abs(v)-1):v,txt=formato?formato(val):null;const texto=txt?.endsWith('%')?txt:Math.abs(val)>=1000?f(val/1000,Math.abs(val)%1000?1:0)+" mil":txt||f(val,pct?0:Math.abs(val)<2&&val!==0?1:0)+(pct?"%":"");s.append(sv("line",horizontal?{x1:pos,y1:top,x2:pos,y2:top+ih,stroke:"#ffffff38"}:{x1:left,y1:pos,x2:W-right,y2:pos,stroke:"#ffffff38"}));s.append(sv("text",{x:horizontal?pos:left-5,y:horizontal?H-8:pos+4,"text-anchor":horizontal?"middle":"end",fill:"white","font-size":11},texto));});
    xs.forEach((label,i)=>{if(!horizontal&&!historico&&xs.length>12&&i%Math.ceil(xs.length/18)!==0&&i!==xs.length-1)return;const pos=(i+.5)*(horizontal?ih:iw)/xs.length,x=horizontal?left-7:left+pos,y=horizontal?top+pos+4:historico?H-bottom+(xs.length<=8?16:10):anualPep?H-12:perfilMediana?H-13:territorial?H-bottom+18:H-36,attrs={x,y,"text-anchor":horizontal?"end":"middle",fill:"white","font-size":11};if(!horizontal&&xs.length>12){attrs.transform=`rotate(${historico?-90:-55} ${x} ${y})`;attrs["text-anchor"]="end";attrs["font-size"]=historico?10:9;}const text=/^\d{4}-\d{2}-\d{2}$/.test(label)?label.slice(0,7):label,node=sv("text",attrs,text.length>(historico?20:24)?text.slice(0,historico?19:23)+"…":text);if(!horizontal&&xs.length<=8&&text.includes(' ')){node.textContent='';const words=text.split(' '),parts=words.length>2?[words.slice(0,2).join(' '),words.slice(2).join(' ')]:words;parts.forEach((v,j)=>node.append(sv('tspan',{x,dy:j?11:0},v)));}s.append(node);});
    ss.forEach((name,j)=>{
      let path=[];
      xs.forEach((label,i)=>{const r=a.find(r=>String(r[x])===label&&(!serie||String(r[serie])===name));if(!r){if(path.length){s.append(sv("polyline",{points:path.join(" "),fill:"none",stroke:colores[j%7],"stroke-width":2}));path=[];}return;}
        const step=(horizontal?ih:iw)/xs.length,band=step*.8/ss.length,base=horizontal?left+iw*unit(0):top+ih-ih*unit(0),pos=horizontal?left+iw*unit(r[y]):top+ih-ih*unit(r[y]);
        if(linea){const px=left+(i+.5)*iw/xs.length;if(conBarras)s.append(sv("rect",{x:left+i*step+step*.1,y:Math.min(base,pos),width:step*.8,height:Math.abs(pos-base),fill:colores[1]}));path.push(`${px},${pos}`);const c=sv("circle",{cx:px,cy:pos,r:2.5,fill:colores[j%7]});c.append(sv("title",{},`${label} · ${name}: ${f(r[y],2)}`));s.append(c);return;}
        const color=cs[(serie?j:!horizontal&&xs.length<=8?i:0)%cs.length];
        const unica=!horizontal&&a.length===1,ancho=unica?Math.min(64,band*.9):band*.9,bx=unica?left+iw/2-ancho/2:left+i*step+step*.1+j*band;
        const rect=sv("rect",horizontal?{x:Math.min(base,pos),y:top+i*step+step*.1+j*band,width:Math.max(0.5,Math.abs(pos-base)),height:band*.9,fill:color}:{x:bx,y:Math.min(base,pos),width:ancho,height:Math.max(.5,Math.abs(pos-base)),fill:color});rect.setAttribute('class','barra-dato');rect.setAttribute('data-categoria',label);rect.setAttribute('data-valor',r[y]);rect.append(sv("title",{},`${label} · ${name}: ${f(r[y],2)}${pct?"%":""}`));s.append(rect);
        if(xs.length<=8||horizontal){const texto=formato?formato(r[y]):f(r[y],pct?1:0)+(pct?"%":""),tx=horizontal?Math.min(W-5,pos+4):unica?left+iw/2:left+i*step+step*.1+(j+.45)*band,ty=horizontal?top+i*step+step*.1+(j+.65)*band:pos-5;if(horizontal&&host.closest('.perfil-residencia,.comparativo-barras'))s.append(sv('rect',{x:tx-2,y:ty-10,width:texto.length*5.7+4,height:14,rx:2,fill:'#fc5927',class:'etiqueta-barra'}));s.append(sv("text",{x:tx,y:ty,fill:"white","font-size":horizontal?10:11,"text-anchor":horizontal?"start":"middle"},texto));}
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
    datos.forEach((r,i)=>{const p=r[valor]/total,c=sv("circle",{cx:150,cy:120,r:radio,fill:"none",stroke:paleta[i],"stroke-width":solida?(cohorte?80:110):55,"stroke-dasharray":`${p*circ} ${circ*(1-p)}`,"stroke-dashoffset":-offset*circ,transform:"rotate(-90 150 120)"});const texto=`${r[label]}: ${f(r[valor])} · ${f(pctCampo?r[pctCampo]:p*100,1)}%`;c.append(sv("title",{},texto));s.append(c);if(p>.07||cohorte&&p>0){const angle=(offset+p/2)*2*Math.PI-Math.PI/2,rr=solida?45:83;if(cohorte&&p<=.07){externas.push({angle,texto:f(p*100,1)+"%",lado:Math.cos(angle)<0?-1:1,y:120+100*Math.sin(angle)});}else labels.push(sv("text",{x:150+rr*Math.cos(angle),y:124+rr*Math.sin(angle),"text-anchor":"middle",fill:"#183051","font-size":13},f(pctCampo?r[pctCampo]:p*100,1)+"%"));}offset+=p;});labels.forEach(x=>s.append(x));
    for(const lado of [-1,1]){const grupo=externas.filter(e=>e.lado===lado).sort((a,b)=>a.y-b.y);grupo.forEach((e,i)=>e.y=Math.max(16,e.y,i?grupo[i-1].y+17:16));if(grupo.length&&grupo.at(-1).y>224){const exceso=grupo.at(-1).y-224;grupo.forEach(e=>e.y-=exceso)}grupo.forEach(e=>{const x=150+lado*105;s.append(sv('polyline',{points:[(150+80*Math.cos(e.angle))+','+(120+80*Math.sin(e.angle)),(150+92*Math.cos(e.angle))+','+e.y,x+','+e.y].join(' '),fill:'none',stroke:'#ffffffaa','stroke-width':1}));s.append(sv('text',{x:x+lado*3,y:e.y+4,'text-anchor':lado<0?'end':'start',fill:'white','font-size':12,class:'porcentaje-segmento'},e.texto))})}
    host.append(s);leyenda(host,datos.map(r=>String(r[label]).replace(" CIS","").replace("Desconocido","SD").replace(/^En TARV$/,'Continúa en TARV')),paleta);
  }
  function apiladas(host,a,genero,edad,valor){
    const datos=a.filter(r=>numeric(r[valor])&&r[valor]>=0);if(!datos.length)return vacio(host);host.classList.add("apilado-host");const gs=uniq(datos.map(r=>r[genero]));let es=uniq(datos.map(r=>r[edad]));if(es.includes("<18")){const o=["<18","18-24","65 o más","25-34","35-44","45-54","55-64"];es.sort((a,b)=>o.indexOf(a)-o.indexOf(b))}
    const W=Math.max(180,host.clientWidth-95),H=Math.max(180,host.clientHeight),L=36,T=22,B=42,iw=W-L-5,ih=H-T-B,s=sv("svg",{viewBox:`0 0 ${W} ${H}`,class:"grafico-svg",role:"img","aria-label":"Distribución porcentual por género y edad"});
    [0,25,50,75,100].forEach(v=>{const y=T+ih-v/100*ih;s.append(sv("line",{x1:L,y1:y,x2:W-5,y2:y,stroke:"#ffffff40"}));s.append(sv("text",{x:L-3,y:y+4,fill:"white","font-size":10,"text-anchor":"end"},v+"%"));});
    gs.forEach((g,i)=>{let base=0;es.forEach((e,j)=>{const r=datos.find(r=>r[genero]===g&&r[edad]===e);if(!r)return;const x=L+i*iw/gs.length+3,w=iw/gs.length-6,rect=sv("rect",{x,y:T+ih-(base+r[valor])/100*ih,width:w,height:r[valor]/100*ih,fill:colores[j%7]});rect.append(sv("title",{},`${g} · ${e}: ${f(r[valor],1)}%`));s.append(rect);if(r[valor]>8)s.append(sv("text",{x:x+w/2,y:T+ih-(base+r[valor]/2)/100*ih+3,"text-anchor":"middle",fill:"#18284b","font-size":9},f(r[valor],1)+"%"));base+=r[valor];});const text=sv("text",{x:L+(i+.5)*iw/gs.length,y:host.closest('.perfil-edad')?H-13:H-23,"text-anchor":"middle",fill:"white","font-size":10});String(g).replace(" CIS","").split(" ").forEach((v,j)=>text.append(sv("tspan",{x:L+(i+.5)*iw/gs.length,dy:j?11:0},v)));s.append(text);});host.append(s);leyenda(host,es);const lista=host.querySelector(".leyenda");[...lista.children].reverse().forEach(n=>lista.append(n));
  }
  function medidor(host,v,n){if(!numeric(v)){vacio(host);return;}const s=sv("svg",{viewBox:"0 0 240 135",class:"medidor",role:"img","aria-label":`${f(v,1)}%`});s.append(sv("path",{d:"M 20 120 A 100 100 0 0 1 220 120",fill:"none",stroke:"#bdbdbd","stroke-width":26}));const p=Math.max(0,Math.min(100,v));s.append(sv("path",{d:"M 20 120 A 100 100 0 0 1 220 120",fill:"none",stroke:colores[0],"stroke-width":26,pathLength:100,"stroke-dasharray":`${p} 100`}));s.append(sv("text",{x:120,y:112,fill:"white","font-size":28,"text-anchor":"middle"},f(v,1)+"%"));if(host.closest(".diseno-tratamiento"))s.querySelectorAll("path").forEach(p=>p.setAttribute("transform","translate(24 24) scale(.8)"));host.append(el("div","numero-indicador",f(n)),s);}
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
    s.append(sv("polyline",{points:points.join(" "),fill:"none",stroke:"white","stroke-width":2}));
    ratios.forEach(r=>{const x=55+(xs.indexOf(String(r["Año"]))+.5)*(width-73)/xs.length,y=base-r.Valor/max*plot;s.append(sv("text",{x,y:y-7,fill:"white","font-size":11,"text-anchor":"middle"},f(r.Valor,2)))});
    for(let v=0;v<=max+.001;v+=max<=3?.5:1)s.append(sv("text",{x:width-2,y:base-v/max*plot+4,fill:"white","font-size":11,"text-anchor":"end"},f(v,Number.isInteger(v)?0:1)));
    const legend=host.querySelector('.leyenda'),prom=el('span'),line=el('i');line.style.background='white';line.style.height='2px';prom.append(line,document.createTextNode('Promedio'));legend?.append(prom);
  }
  function flujo(host,a){
    const orderSources=['En_TARV','Alta'],orderTargets=['En TARV','Perdidos 180 días o más','Posiblemente migró de subsistema de salud','Perdidos 90 a 179 días','Fallecido'];
    const rows=a.filter(r=>numeric(r.value)&&r.value>0).slice().sort((a,b)=>orderSources.indexOf(a.source)-orderSources.indexOf(b.source)||orderTargets.indexOf(a.target)-orderTargets.indexOf(b.target));if(!rows.length)return vacio(host);
    const order=['En TARV','Perdidos 180 días o más','Posiblemente migró de subsistema de salud','Perdidos 90 a 179 días','Fallecido'],sources=uniq(rows.map(r=>r.source)).sort((a,b)=>(a==='En_TARV'?-1:1)),targets=uniq(rows.map(r=>r.target)).sort((a,b)=>order.indexOf(a)-order.indexOf(b)),sums=(key,v)=>rows.filter(r=>r[key]===v).reduce((s,r)=>s+r.value,0),total=rows.reduce((s,r)=>s+r.value,0),W=host.clientWidth,H=host.clientHeight,L=48,R=W-48,scale=Math.max(30,H-20-targets.length*13)/total;
    const s=sv("svg",{viewBox:`0 0 ${W} ${H}`,class:"grafico-svg",role:"img","aria-label":"Flujos de situación de tratamiento"}),sy={},ty={},paleta=['#bd79aa','#b09a37','#989354','#8c8d3c','#6dbac4'];let y=10;sources.forEach(v=>{sy[v]=y;s.append(sv("rect",{x:L,y,width:12,height:sums('source',v)*scale,fill:v==='Alta'?'#7873ba':'#c1a340'}));s.append(sv("text",{x:L+16,y:y+12,fill:"white","font-size":10},v==='En_TARV'?'En TARV hace un año':v));s.append(sv("text",{x:L-5,y:y+Math.max(9,sums('source',v)*scale/2),"text-anchor":"end",fill:"white","font-size":11,class:"valor-nodo"},f(sums('source',v))));y+=sums('source',v)*scale+13});y=10;targets.forEach((v,i)=>{ty[v]=y;s.append(sv("rect",{x:R,y,width:12,height:sums('target',v)*scale,fill:paleta[i%5]}));s.append(sv("text",{x:R-5,y:y+10,"text-anchor":"end",fill:"white","font-size":9},v==='En TARV'?'En TARV ahora':v));s.append(sv("text",{x:R+16,y:y+Math.max(9,sums('target',v)*scale/2),fill:"white","font-size":11,class:"valor-nodo"},f(sums('target',v))));y+=sums('target',v)*scale+13});rows.forEach(r=>{const h=r.value*scale,path=sv("path",{d:`M${L+12} ${sy[r.source]} C${W*.4} ${sy[r.source]},${W*.6} ${ty[r.target]},${R} ${ty[r.target]} L${R} ${ty[r.target]+h} C${W*.6} ${ty[r.target]+h},${W*.4} ${sy[r.source]+h},${L+12} ${sy[r.source]+h} Z`,fill:paleta[targets.indexOf(r.target)%5],'fill-opacity':.55,class:'cinta-sankey','data-source':r.source,'data-target':r.target,'data-inicio':sy[r.source],'data-fin':ty[r.target],'data-alto':h});path.append(sv('title',{},`${r.source} → ${r.target}: ${f(r.value)}`));s.prepend(path);if(r.source==='En_TARV'&&r.target==='En TARV')s.append(sv('text',{x:(L+12+R)/2,y:(sy[r.source]+ty[r.target]+h)/2,'text-anchor':'middle','dominant-baseline':'middle',fill:'white','font-size':12,'font-weight':700,class:'valor-cinta-principal'},f(r.value)));sy[r.source]+=h;ty[r.target]+=h});host.append(s);
  }
  // Motor visual compartido; las vistas territoriales tienen filtros y contratos propios.
  window.SVIH_UI={el,sv,panel,tabla,barras,medidor,flujo,serieMixta,mapa,nota,leyenda,f,dimensionar,compararJurisdicciones,etiquetaJurisdiccion};
  if(d.ambito&&d.ambito!=="nacional"){window.addEventListener("resize",dimensionar);return;}
  const home=el("div","pagina pagina-principal");home.id="vista-general";
  document.querySelectorAll("main>section").forEach(s=>home.append(s));document.querySelector("main").insertBefore(home,document.querySelector("footer"));
  const mini=el("div");mini.id="mini-mapa";home.append(mini);window.crearMapaComparativoSVIH(mini,[],{mini:true,seleccion:provincia()});
  const notas=el("div","notas-principal");notas.append(el("p",null,"(*) Los indicadores epidemiológicos corresponden a información suministrada por todos los subsistemas de salud al SNVS. TARV y PrEP corresponden al subsector público."),el("p",null,"(**) Si la fecha de actualización es previa al 30/6 del año, se toma el último mes procesado."));home.append(notas);
  const otras=el("div","pagina");otras.id="vista-pagina";home.after(otras);
  const paginas=[["general","Tablero general TARV"],["perfil","Perfil de las personas en TARV"],["tratamiento","Características del TARV"],["evolucion","Evolución personas en TARV"],["laboratorio","Laboratorio TARV"],["prep","Tablero PrEP"],["pep","Tablero PeP"],["comparativo","Comparativo por provincia"],["historico","Evolución y comparación"],["definiciones","Definiciones"]];
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
  function perfil(host){
    const g=el("div","diseno-perfil");host.append(g);
    const resumen=panel(g,"N° de personas en TARV","perfil-resumen");resumen.append(el("div","numero-indicador acento",f(general().N_TARV)));const cifras=el("div","cifras-genero");
    const grupos=[["Varones",["Varón CIS","Varón cis","Varón"]],["Varones trans",["Varón trans"]],["Otros",["Otros","Otro"]],["Mujeres",["Mujer CIS","Mujer cis","Mujer"]],["Mujeres trans",["Mujer trans"]],["Desconocido",["Desconocido","SD"]]];
    grupos.forEach(([nombre,aliases])=>{const r=filas("genero").find(r=>aliases.includes(r.Genero)),c=el("div");c.append(el("small",null,nombre),el("strong",null,f(r?.Casos)));cifras.append(c)});resumen.append(cifras);
    tabla(panel(g,"Residencia de las personas en TARV","perfil-localidades"),participacion(filas("localidades"),"Cantidad"),[["Localidad_residencia","Localidad"],["Cantidad","Cantidad"],["participacion","%",1,true]],5);
    const residencia=panel(g,"Personas en TARV por jurisdicción de residencia","perfil-residencia");residencia.dataset.excepcion="nacional";barras(residencia,(t.residencia||[]).filter(r=>!r.Prov_residencia.startsWith("País" )).sort((a,b)=>b.Porcentaje-a.Porcentaje).map(r=>({...r,Prov_residencia:r.Prov_residencia.replace(/, Argentina$/,"")})),"Prov_residencia","Porcentaje",null,{horizontal:true,log:true,formato:v=>f(v,1)+"%"});
    dona(panel(g,"% de personas en TARV según género","perfil-genero"),filas("genero"),"Genero","Casos","Porcentaje");
    const orden=["Mujer CIS","Varón CIS","Mujer trans","Varón trans"],adultos=r=>orden.includes(r.Genero);
    barras(panel(g,"Mediana de edad de personas en TARV según género","perfil-mediana"),filas("mediana").filter(adultos).sort((a,b)=>orden.indexOf(a.Genero)-orden.indexOf(b.Genero)).map(r=>({...r,Genero:r.Genero.replace(" CIS","")})),"Genero","Mediana_edad");
    apiladas(panel(g,"Distribución por género y edad","perfil-edad"),filas("edad").filter(adultos).map(r=>({...r,Genero:r.Genero.replace(" CIS","")})),"Genero","Grupo_edad","Porcentaje");
  }
  function tratamiento(host){
    const a=filas("tratamiento")[0]||{},g=el("div","diseno-tratamiento");host.append(g);
    const superior=el("div","tratamiento-superior");g.append(superior);tarjetasTotal(superior,[["N° de personas en TARV",general().N_TARV],["Personas en TARV que ya deberían haber vuelto a retirar medicación",a.Porc_caducados,true]]);
    [["Esquemas basados en DTG","Prop_DTG_tto","N_DTG_tto","dtg"],["Biterapia (DTG/3TC o DTG/DRV800)","Prop_biterapia","Biterapia","biterapia"],["Primera línea con tratamientos de primera elección","Porc_recomendado","N_recomendado","recomendado"]].forEach(([n,p,v,cl])=>medidor(panel(g,n,cl),a[p],a[v]));
    tabla(panel(g,"Principales esquemas","esquemas"),filas("esquemas"),[["drogas","Esquema"],["cantidad","N"],["cantidad_p","%",1,true]],6);
    const inst=panel(g,"Personas en TARV por institución","instituciones");const totalInstituciones=el("p","nota total-instituciones",`Instituciones que dispensan TARV: ${f(general().N_instituciones_disp_TARV)}`);inst.parentElement.prepend(totalInstituciones);tabla(inst,participacion(d.mapa.filter(r=>r.Provincia_atencion===provincia()),"cantidad"),[["nombre_institucion","Institución"],["cantidad","N"],["participacion","%",1,true]],9);
    barras(panel(g,"% según meses de medicación en última entrega","meses"),["1","2","3_mas"].map((k,i)=>({mes:["1 mes","2 meses","3 meses o más"][i],valor:a["Prop_TARV_"+k.replace("3_mas","3_mas")+(k==="1"||k==="2"?"_mes":"")]})),"mes","valor",null,{pct:true});
    barras(panel(g,"% de personas en TARV con drogas específicas","drogas"),["XTC","DTG","DRV800","RAL","EFV","AZT","NVP"].map(k=>({droga:k,valor:a["Prop_"+k+"_tto"]})),"droga","valor",null,{pct:true});
    barras(panel(g,"Líneas de tratamiento TARV en 15 años o más","lineas"),[1,2,3].map(k=>({linea:k+"ª línea",valor:a["Porc_tto_"+k]})),"linea","valor",null,{pct:true});
    host.append(el('p','notas-tratamiento','(*) Indicador afectado por demora en carga de dispensas de TARV en las farmacias de los hospitales.'));
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
    const ordenCohorte=['En TARV','Perdidos 180 días o más','Posiblemente migró de subsistema de salud','Perdidos 90 a 179 días','Fallecido'],cohorte=filas("flujo").filter(r=>r.source==="En_TARV").sort((a,b)=>ordenCohorte.indexOf(a.target)-ordenCohorte.indexOf(b.target));dona(panel(g,"Situación de quienes hace un año estaban en TARV","evolucion-cohorte"),cohorte,"target","value",null,true);
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
    tabla(panel(g,prep?"Personas en PrEP por institución":"Instituciones que dispensaron PeP los últimos 12 meses","profilaxis-instituciones"),participacion(inst,cant),[[nombre,"Institución"],[cant,"N"],["participacion","%",1,true]],6);
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
    const configs=window.SVIH_COMPARATIVO;function dibujar(){const cfg=configs.find(x=>x.id===indicadorComparativo),formato=v=>numeric(v)?f(v,cfg.tipo==="numero"?0:1)+(cfg.tipo==="porcentaje"?"%":""):"—";titulo.textContent=cfg.titulo;const rows=datos.filter(r=>r.Provincia_atencion!=="País").map(r=>({...r,valor:window.valorComparativoSVIH(r,cfg)})),pais=datos.find(r=>r.Provincia_atencion==="País");window.crearMapaComparativoSVIH(mapaHost,rows,{formato,nacional:window.valorComparativoSVIH(pais,cfg)});barHost.replaceChildren();barras(barHost,rows.slice().sort((a,b)=>(b.valor??-Infinity)-(a.valor??-Infinity)),"Provincia_atencion","valor",null,{horizontal:true,log:cfg.tipo==="numero",formato});lista.querySelectorAll("input").forEach(i=>i.checked=i.value===indicadorComparativo);mapaHost.dataset.indicador=cfg.id;barHost.dataset.indicador=cfg.id;}
    configs.forEach(cfg=>{const l=el("label"),radio=el("input");radio.type="radio";radio.name="indicador-provincial";radio.value=cfg.id;l.append(radio,el("span",null,cfg.etiqueta));lista.append(l);radio.onchange=()=>{indicadorComparativo=radio.value;dibujar()};});buscar.oninput=()=>{const q=buscar.value.toLocaleLowerCase();lista.querySelectorAll("label").forEach(l=>l.hidden=!l.textContent.toLocaleLowerCase().includes(q));};dibujar();
  }
  const titulos={perfil:"Perfil de las personas con VIH que están en TARV",tratamiento:"Característica del TARV",evolucion:"Evolución del TARV",laboratorio:"Carga viral y CD4",prep:"Personas en PrEP",pep:"Profilaxis post exposición",comparativo:"Comparativo por provincia",historico:"Evolución indicadores y comparador interjurisdiccional",definiciones:"Definición de indicadores"};
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
