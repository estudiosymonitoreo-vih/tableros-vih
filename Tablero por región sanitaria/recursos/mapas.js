"use strict";
// Mapa vectorial local. No carga teselas, fuentes, nombres geográficos ni servicios externos.
window.crearMapaSVIH = (() => {
  const base = JSON.parse(document.getElementById("cartografia-tablero").textContent);
  const ns = "http://www.w3.org/2000/svg";
  const svg = (tag, attrs = {}, text) => {
    const e = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const fmt = n => Number.isFinite(n) ? new Intl.NumberFormat("es-AR").format(n) : "—";
  const project = ([lon, lat]) => [lon, -180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + Math.max(-85, Math.min(85, lat)) * Math.PI / 360))];
  function path(geometry) {
    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.type === "MultiPolygon" ? geometry.coordinates : [];
    return polygons.map(p => p.map(r => r.map((c, i) => {
      const [x, y] = project(c);
      return (i ? "L" : "M") + x.toFixed(6) + " " + y.toFixed(6);
    }).join("") + "Z").join("")).join("");
  }
  // Las geometrías se proyectan una vez, no por punto ni por evento de zoom.
  const paises = base.paises.features.map(f => path(f.geometry));
  const provincias = base.provincias.features.map(f => path(f.geometry));
  const normalizar = s => String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/, argentina$/,"").replace(/^provincia de /,"").replace(/^ciudad autonoma de buenos aires$/,"ciudad de buenos aires").replace(/^caba$|^caba, argentina$/,"ciudad de buenos aires").trim();
  // Posiciones cartográficas de rótulos; nunca sustituyen coordenadas institucionales.
  const rotulos = {'buenos aires':[-60,-36.8],'ciudad de buenos aires':[-55.8,-35.5],catamarca:[-67.6,-26.1],chaco:[-60.5,-26.1],chubut:[-68.3,-43.5],cordoba:[-64,-32.2],corrientes:[-57.8,-28.8],'entre rios':[-59.2,-32.4],formosa:[-59.5,-24.5],jujuy:[-65.9,-23], 'la pampa':[-65,-37.6],'la rioja':[-67,-29.6],mendoza:[-69,-34.3],misiones:[-54.6,-26.9],neuquen:[-70,-38.5],'rio negro':[-67,-40.8],salta:[-64.1,-24.6],'san juan':[-68.8,-30.8],'san luis':[-66,-33.7],'santa cruz':[-69,-49.5],'santa fe':[-61,-30.9],'santiago del estero':[-63.4,-28], 'tierra del fuego':[-67.5,-54.4],tucuman:[-65.3,-26.9]};
  const coordenadas = g => g.type === 'Polygon' ? g.coordinates.flat() : g.type === 'MultiPolygon' ? g.coordinates.flat(2) : [];
  // Límites públicos en gris, detrás de los puntos y textos. Se dibuja solo lo visible.
  const capasDetalle=[['departamentos',12,.55],['barrios_caba',.45,.6],['localidades_ba',.8,.5]];
  const cacheDetalle={};
  function crearDetalleCartografico(mapa,antes=null){
    const capas=capasDetalle.map(([nombre,umbral,grosor])=>{const g=svg('g',{class:'limites-'+nombre,fill:'none',stroke:'#8d9298','stroke-opacity':.65,'pointer-events':'none'});mapa.insertBefore(g,antes);return{nombre,umbral,grosor,g,clave:''}});
    return vista=>capas.forEach(c=>{
      if(vista.w>c.umbral){c.g.style.display='none';return}c.g.style.display='';
      if(!cacheDetalle[c.nombre])cacheDetalle[c.nombre]=(base[c.nombre]?.features||[]).map((f,i)=>{const p=coordenadas(f.geometry).map(project),xs=p.map(p=>p[0]),ys=p.map(p=>p[1]);return{i,geometry:f.geometry,b:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]}});
      const visibles=cacheDetalle[c.nombre].filter(f=>f.b[0]<=vista.x+vista.w&&f.b[2]>=vista.x&&f.b[1]<=vista.y+vista.h&&f.b[3]>=vista.y),clave=visibles.map(f=>f.i).join(',');
      if(c.clave===clave)return;c.clave=clave;c.g.replaceChildren(...visibles.map(f=>{if(!f.d)f.d=path(f.geometry);return svg('path',{d:f.d,'stroke-width':c.grosor,'vector-effect':'non-scaling-stroke'})}));
    });
  }
  const zoomMaximo = 1024;
  let contadorMapas = 0;
  function navegarComparativo(caja, mapa) {
    const actualizarLimites=crearDetalleCartografico(mapa,mapa.querySelector('.valores-provinciales'));
    const inicial={x:-82,y:15,w:35,h:57};let vista={...inicial},zoom=1;
    mapa.setAttribute('tabindex','0');mapa.setAttribute('role','application');
    mapa.setAttribute('aria-label','Mapa provincial. Usar botones, rueda, flechas o arrastrar para navegar.');
    const controles=document.createElement('div');controles.className='mapa-controles';
    const estado=document.createElement('span');estado.className='mapa-zoom';estado.setAttribute('aria-live','polite');
    const pintar=()=>{mapa.setAttribute('viewBox',`${vista.x} ${vista.y} ${vista.w} ${vista.h}`);caja.dataset.zoom=String(zoom);estado.textContent=zoom.toFixed(1)+'×';mapa.querySelectorAll('path:not([vector-effect="non-scaling-stroke"])').forEach(p=>{if(!p.dataset.grosor)p.dataset.grosor=p.getAttribute('stroke-width')||.12;p.setAttribute('stroke-width',Number(p.dataset.grosor)/zoom)});mapa.querySelectorAll('.valor-provincia').forEach(p=>{p.setAttribute('font-size',.94/zoom);p.setAttribute('stroke-width',.22/zoom)});actualizarLimites(vista);};
    const punto=(x,y)=>new DOMPoint(x,y).matrixTransform(mapa.getScreenCTM().inverse());
    function acercar(factor,centro={x:vista.x+vista.w/2,y:vista.y+vista.h/2}){const nuevo=Math.max(1,Math.min(zoomMaximo,zoom*factor)),k=zoom/nuevo;vista={x:centro.x+(vista.x-centro.x)*k,y:centro.y+(vista.y-centro.y)*k,w:vista.w*k,h:vista.h*k};zoom=nuevo;pintar();}
    const restablecer=()=>{vista={...inicial};zoom=1;pintar()};
    [['+','Acercar mapa',()=>acercar(2)],['−','Alejar mapa',()=>acercar(.5)],['⌂','Restablecer mapa de Argentina',restablecer]].forEach(([t,l,fn])=>{const b=document.createElement('button');b.type='button';b.textContent=t;b.setAttribute('aria-label',l);b.onclick=fn;controles.append(b)});controles.append(estado);caja.append(controles);
    mapa.addEventListener('wheel',e=>{e.preventDefault();acercar(Math.exp(-Math.max(-300,Math.min(300,e.deltaY))*.004),punto(e.clientX,e.clientY))},{passive:false});
    mapa.addEventListener('dblclick',e=>{e.preventDefault();acercar(2,punto(e.clientX,e.clientY))});
    const punteros=new Map();let distancia=0;
    mapa.addEventListener('pointerdown',e=>{if(e.button!==0)return;punteros.set(e.pointerId,{x:e.clientX,y:e.clientY});mapa.setPointerCapture(e.pointerId)});
    mapa.addEventListener('pointermove',e=>{if(!punteros.has(e.pointerId))return;const anterior=punteros.get(e.pointerId);punteros.set(e.pointerId,{x:e.clientX,y:e.clientY});if(punteros.size===2){const[a,b]=[...punteros.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(distancia>0)acercar(d/distancia,punto((a.x+b.x)/2,(a.y+b.y)/2));distancia=d;}else{const a=punto(anterior.x,anterior.y),b=punto(e.clientX,e.clientY);vista.x+=a.x-b.x;vista.y+=a.y-b.y;pintar();}});
    ['pointerup','pointercancel'].forEach(t=>mapa.addEventListener(t,e=>{punteros.delete(e.pointerId);distancia=0}));
    mapa.addEventListener('keydown',e=>{if(['+','=','-','Home','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();if(e.key==='+'||e.key==='=')acercar(2);if(e.key==='-')acercar(.5);if(e.key==='Home')restablecer();if(e.key==='ArrowLeft')vista.x-=vista.w*.1;if(e.key==='ArrowRight')vista.x+=vista.w*.1;if(e.key==='ArrowUp')vista.y-=vista.h*.1;if(e.key==='ArrowDown')vista.y+=vista.h*.1;if(e.key.startsWith('Arrow'))pintar();});pintar();
  }
  window.crearMapaComparativoSVIH = function(host, filas, {formato = v => fmt(v), nacional = null, mini = false, seleccion = "País"} = {}) {
    host.replaceChildren();
    const caja = document.createElement("div"); caja.className = mini ? "mini-argentina" : "mapa-coropletico"; host.append(caja);
    const s = svg("svg",{viewBox:"-82 15 35 57",role:"img","aria-label":mini?"Jurisdicción seleccionada en Argentina":"Mapa de indicadores por provincia de Argentina"});
    const validos = filas.filter(r=>Number.isFinite(r.valor)&&base.provincias.features.some(f=>normalizar(f.id)===normalizar(r.Provincia_atencion))), valores = validos.map(r=>r.valor), min = valores.length?Math.min(...valores):null, max = valores.length?Math.max(...valores):null;
    paises.forEach((d,i)=>{if(!mini||base.paises.features[i].id==='Islas Malvinas')s.append(svg("path",{d,fill:"#c4c4c4",stroke:"#999","stroke-width":.1}));});
    provincias.forEach((d,i)=>{
      const nombre = base.provincias.features[i].id;
      const r = filas.find(r=>normalizar(r.Provincia_atencion)===normalizar(nombre));
      let fill="#f5f5ee";
      if (mini) {if(normalizar(seleccion)===normalizar(nombre))fill="#4285f4";}
      else if(Number.isFinite(r?.valor)){const z=max===min ? 0.5 : (r.valor-min)/(max-min);fill=`rgb(${Math.round(185-165*z)},${Math.round(221-110*z)},${Math.round(244-45*z)})`;}
      const p=svg("path",{d,fill,stroke:mini?"#aaa":"#516474","stroke-width":mini ? 0.12 : 0.09,class:"provincia-indicador","data-jurisdiccion":nombre||"","data-valor":Number.isFinite(r?.valor)?r.valor:""});
      p.append(svg("title",{},`${nombre}: ${formato(r?.valor)}`));s.append(p);
    });
    if(!mini){
      const etiquetas=svg('g',{class:'valores-provinciales','pointer-events':'none'});
      base.provincias.features.forEach(f=>{
        const clave=normalizar(f.id),pos=rotulos[clave];if(!pos)return;
        const r=filas.find(r=>normalizar(r.Provincia_atencion)===clave),[x,y]=project(pos);
        if(clave==='ciudad de buenos aires'){const [cx,cy]=project([-58.45,-34.6]);etiquetas.append(svg('path',{d:`M${cx} ${cy}L${x} ${y}`,fill:'none',stroke:'#203751','stroke-width':.12,class:'linea-caba'}));}
        const texto=svg('text',{x,y,'text-anchor':'middle','dominant-baseline':'middle',class:'valor-provincia','data-jurisdiccion':f.id,fill:'#132c47',stroke:'#fff','stroke-width':.22,'paint-order':'stroke','stroke-linejoin':'round','font-family':'Arial','font-size':.94,'font-weight':700},formato(r?.valor));
        texto.append(svg('title',{},`${f.id}: ${formato(r?.valor)}`));etiquetas.append(texto);
      });s.append(etiquetas);
    }caja.append(s);if(!mini)navegarComparativo(caja,s);
    if(!mini){const valor=document.createElement("div");valor.className="valor-pais-mapa";const label=document.createElement("small");label.textContent="PAÍS";const strong=document.createElement("strong");strong.textContent=formato(nacional);valor.append(label,strong);caja.append(valor);const leyenda=document.createElement("div");leyenda.className="escala-mapa";const a=document.createElement("span"),b=document.createElement("span"),grad=document.createElement("i");a.textContent=formato(min);b.textContent=formato(max);leyenda.append(a,grad,b);host.append(leyenda);}
  };
  return function crearMapa(host, datos, {nombre = "nombre_institucion", cantidad = "cantidad", seleccion = "País", encuadrarPuntos = false} = {}) {
    host.replaceChildren();
    const validos = datos.filter(r => Number.isFinite(r.Latitud) && Number.isFinite(r.Longitud) &&
      Math.abs(r.Latitud) <= 90 && Math.abs(r.Longitud) <= 180 && Number.isFinite(r[cantidad]) && r[cantidad] > 0);
    const frame = document.createElement("div"); frame.className = "mapa-interactivo";
    const map = svg("svg", {role: "application", tabindex: "0", "aria-label": "Mapa de Argentina e instituciones. Use más y menos para acercar o alejar; flechas para desplazar."});
    frame.append(map); host.append(frame);
    const width = () => Math.max(1, map.getBoundingClientRect().width || 260);
    const height = () => Math.max(1, map.getBoundingClientRect().height || 300);
    const norte = project([-64, -20])[1], sur = project([-64, -56.5])[1];
    let h = (sur - norte) * 1.08, w = h * width() / height();
    if (w < 24) { w = 24; h = w * height() / width(); }
    const inicial = {x: -64 - w / 2, y: (norte + sur) / 2 - h / 2, w, h};
    let vista = {...inicial}, zoom = 1, moved = false, ultimaDistancia = 0;
    const provinciaSeleccionada=base.provincias.features.find(f=>normalizar(f.id)===normalizar(seleccion));
    if(provinciaSeleccionada||(encuadrarPuntos&&validos.length)){
      const coords=(encuadrarPuntos&&validos.length?validos.map(r=>[r.Longitud,r.Latitud]):coordenadas(provinciaSeleccionada.geometry)).map(project),xs=coords.map(c=>c[0]),ys=coords.map(c=>c[1]);
      const cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
      let fw=Math.max(.7,Math.max(...xs)-Math.min(...xs))*1.25,fh=Math.max(.7,Math.max(...ys)-Math.min(...ys))*1.25;
      const aspecto=width()/height();if(fw/fh<aspecto)fw=fh*aspecto;else fh=fw/aspecto;
      zoom=Math.max(1,Math.min(zoomMaximo,inicial.w/fw));vista={x:cx-inicial.w/zoom/2,y:cy-inicial.h/zoom/2,w:inicial.w/zoom,h:inicial.h/zoom};
      frame.dataset.foco=seleccion;
    }
    const tierra = svg("g", {class: "tierra-vecina"});
    paises.forEach(p => tierra.append(svg("path", {d: p, fill: "#c4c4c4", stroke: "#939393", "stroke-width": ".65", "vector-effect": "non-scaling-stroke", "fill-rule": "evenodd"})));
    const division = svg("g", {class: "division-provincial"});
    provincias.forEach(p => division.append(svg("path", {d: p, fill: "#f5f5ee", stroke: "#7c8586", "stroke-width": ".8", "vector-effect": "non-scaling-stroke", "fill-rule": "evenodd"})));
    const puntos = svg("g", {class: "puntos-instituciones"}), nombres = svg("g", {class: "nombres-instituciones", "pointer-events": "none"});
    map.append(tierra, division, puntos, nombres);
    const actualizarLimites=crearDetalleCartografico(map,puntos);
    const popup = document.createElement("div"); popup.className = "mapa-detalle"; popup.hidden = true; frame.append(popup);
    const tooltip=document.createElement('div');tooltip.className='mapa-tooltip';tooltip.id='mapa-tooltip-'+(++contadorMapas);tooltip.setAttribute('role','tooltip');tooltip.hidden=true;frame.append(tooltip);
    function ubicarTooltip(clientX,clientY){
      const r=frame.getBoundingClientRect(),escala=r.width/frame.clientWidth||1,x=(clientX-r.left)/escala,y=(clientY-r.top)/escala;
      tooltip.style.left=Math.max(6,Math.min(frame.clientWidth-tooltip.offsetWidth-6,x+10))+'px';
      tooltip.style.top=Math.max(6,Math.min(frame.clientHeight-tooltip.offsetHeight-6,y+12))+'px';
    }
    const nodos = [], max = Math.max(1, ...validos.map(r => r[cantidad]));
    function detalle(r) {
      tooltip.hidden=true;
      const cerrar = document.createElement("button"); cerrar.type = "button"; cerrar.textContent = "×"; cerrar.setAttribute("aria-label", "Cerrar detalle de institución");
      cerrar.onclick = () => {popup.hidden = true;};
      const texto = document.createElement("span"); texto.textContent = `${r[nombre] || "Institución sin nombre"} · ${fmt(r[cantidad])} personas`;
      popup.replaceChildren(cerrar, texto); popup.hidden = false;
    }
    // Los puntos grandes van detrás de los pequeños para facilitar la selección.
    validos.slice().sort((a, b) => b[cantidad] - a[cantidad]).forEach(r => {
      const [x, y] = project([r.Longitud, r.Latitud]);
      const radio = 2.5 + 22 * Math.sqrt(r[cantidad] / max);
      const c = svg("circle", {cx: x, cy: y, fill: "#4285f4", "fill-opacity": ".8", stroke: "#e4f0ff", "stroke-width": ".6", "vector-effect": "non-scaling-stroke", tabindex: "0", role: "button", "aria-label": `${r[nombre] || "Institución"}: ${fmt(r[cantidad])} personas`});
      c.setAttribute('aria-describedby',tooltip.id);
      const mostrarTooltip=(x,y)=>{tooltip.textContent=`${r[nombre]||'Institución sin nombre'}\n${fmt(r[cantidad])} personas`;tooltip.hidden=false;ubicarTooltip(x,y)};
      c.addEventListener('mouseenter',e=>mostrarTooltip(e.clientX,e.clientY));
      c.addEventListener('mousemove',e=>{if(!tooltip.hidden)ubicarTooltip(e.clientX,e.clientY)});
      c.addEventListener('mouseleave',()=>{tooltip.hidden=true});
      c.addEventListener('focus',()=>{const r=c.getBoundingClientRect();mostrarTooltip(r.left+r.width/2,r.top+r.height/2)});
      c.addEventListener('blur',()=>{tooltip.hidden=true});
      c.addEventListener("click", e => {if (!moved || e.detail === 0) detalle(r);});
      c.addEventListener("keydown", e => {if (e.key === "Enter" || e.key === " ") {e.preventDefault(); e.stopPropagation(); detalle(r);}});
      const texto = svg("text", {class: "nombre-institucion", fill: "#203049", "paint-order": "stroke", stroke: "#fff", "stroke-linejoin": "round"}, String(r[nombre] || "Institución sin nombre"));
      puntos.append(c); nombres.append(texto); nodos.push({r, x, y, radio, c, texto});
    });
    const controles = document.createElement("div"); controles.className = "mapa-controles";
    function boton(texto, label, accion) {const b = document.createElement("button"); b.type = "button"; b.textContent = texto; b.setAttribute("aria-label", label); b.onclick = accion; controles.append(b);}
    const estado = document.createElement("span"); estado.className = "mapa-zoom"; estado.setAttribute("aria-live", "polite");
    const credito = document.createElement("small"); credito.className = "mapa-creditos"; credito.textContent = "Natural Earth · IGN · GCBA";
    function pintar() {
      map.setAttribute("viewBox", `${vista.x} ${vista.y} ${vista.w} ${vista.h}`);
      actualizarLimites(vista);
      const unidad = vista.w / width(), ocupados = [];
      nodos.forEach(n => {n.c.setAttribute("r", n.radio * unidad); n.texto.style.display = "none";});
      // Desde 4×: solo nombres visibles y sin superposición. Hover/clic siempre da el nombre completo.
      if (zoom >= 4) nodos.forEach(n => {
        const px = (n.x - vista.x) / unidad, py = (n.y - vista.y) / unidad;
        if (px < 0 || py < 0 || px > width() || py > height()) return;
        const largo = Math.min(210, String(n.r[nombre] || "Institución sin nombre").length * 6.3);
        let tx = px + n.radio + 4;
        if (tx + largo > width()) tx = px - n.radio - largo - 4;
        const box = {x: tx, y: py - 9, w: largo, h: 16};
        if (box.x < 0 || ocupados.some(b => box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y)) return;
        ocupados.push(box); const texto = String(n.r[nombre] || "Institución sin nombre");
        n.texto.textContent = texto.length > 33 ? texto.slice(0, 32) + "…" : texto;
        n.texto.setAttribute("x", vista.x + tx * unidad); n.texto.setAttribute("y", n.y + 3 * unidad);
        n.texto.setAttribute("font-size", 11 * unidad); n.texto.setAttribute("stroke-width", 3 * unidad);
        n.texto.style.display = "block";
      });
      frame.dataset.zoom = zoom.toFixed(2); estado.textContent = `${zoom.toFixed(1)}×`;
    }
    function acercar(factor, ax = width() / 2, ay = height() / 2) {
      const nuevo = Math.min(zoomMaximo, Math.max(1, zoom * factor)), k = zoom / nuevo;
      vista.x += vista.w * ax / width() * (1 - k); vista.y += vista.h * ay / height() * (1 - k);
      vista.w *= k; vista.h *= k; zoom = nuevo; pintar();
    }
    boton("+", "Acercar mapa", () => acercar(2));
    boton("−", "Alejar mapa", () => acercar(.5));
    boton("⌂", "Restablecer mapa de Argentina", () => {vista = {...inicial}; zoom = 1; popup.hidden = true; pintar();});
    controles.append(estado); frame.append(controles, credito);
    map.addEventListener("wheel", e => {e.preventDefault(); const r = map.getBoundingClientRect(); acercar(Math.exp(-Math.max(-300, Math.min(300, e.deltaY)) * .004), e.clientX - r.left, e.clientY - r.top);}, {passive: false});
    map.addEventListener("dblclick", e => {e.preventDefault(); const r = map.getBoundingClientRect(); acercar(2, e.clientX - r.left, e.clientY - r.top);});
    const pointers = new Map();
    map.addEventListener("pointerdown", e => {if (e.button !== 0) return; tooltip.hidden=true; moved = false; pointers.set(e.pointerId, {x: e.clientX, y: e.clientY}); e.target.setPointerCapture(e.pointerId);});
    map.addEventListener("pointermove", e => {
      if (!pointers.has(e.pointerId)) return;
      const prev = pointers.get(e.pointerId); pointers.set(e.pointerId, {x: e.clientX, y: e.clientY});
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()], distancia = Math.hypot(a.x - b.x, a.y - b.y);
        if (ultimaDistancia > 0) {const r = map.getBoundingClientRect(); acercar(distancia / ultimaDistancia, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);}
        ultimaDistancia = distancia; moved = true;
      } else {
        const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
        if (dx || dy) {moved = true; vista.x -= dx * vista.w / width(); vista.y -= dy * vista.h / height(); pintar();}
      }
    });
    const fin = e => {pointers.delete(e.pointerId); ultimaDistancia = 0;};
    map.addEventListener("pointerup", fin); map.addEventListener("pointercancel", fin);
    map.addEventListener("keydown", e => {
      if (["+", "=", "-", "Home", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault();
      if (e.key === "+" || e.key === "=") acercar(2);
      if (e.key === "-") acercar(.5);
      if (e.key === "Home") {vista = {...inicial}; zoom = 1; pintar();}
      if (e.key === "ArrowLeft") vista.x -= vista.w * .1;
      if (e.key === "ArrowRight") vista.x += vista.w * .1;
      if (e.key === "ArrowUp") vista.y -= vista.h * .1;
      if (e.key === "ArrowDown") vista.y += vista.h * .1;
      if (e.key.startsWith("Arrow")) pintar();
    });
    if (!validos.length) {const mensaje = document.createElement("span"); mensaje.className = "mapa-sin-puntos"; mensaje.textContent = "Sin instituciones con coordenadas y cantidad válidas."; frame.append(mensaje);}
    pintar();
    return {registros: validos.length, excluidos: datos.length - validos.length};
  };
})();
