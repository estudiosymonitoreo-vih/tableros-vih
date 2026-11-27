// Autor: Ariel Adaszko
'use strict';
(()=>{
  const datos=JSON.parse(document.getElementById('datos-tablero').textContent),t=datos.tablas,u=window.SVIH_UI,{el,sv,panel,tabla,barras,medidor,flujo,tortaCohorte,serieMixta,nota,f,selectorIndicador}=u,$=id=>document.getElementById(id),regional=datos.ambito==='regional',general=t.general;
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim(),uniq=a=>[...new Set(a)],numeric=Number.isFinite;
  const esTotal=v=>/^total\b|^pais$|^provincia (de )?buenos aires$/.test(norm(v));
  const scope=()=>$('provincia').value,inst=()=>$('institucion').value,esPBA=v=>norm(v)==='provincia de buenos aires';
  const filas=(id,soloScope=false)=>(t[id]||[]).filter(r=>r.Provincia_atencion===scope()&&(soloScope||r.Institucion===inst()));
  const actual=()=>filas('general')[0]||{},total=()=>filas('general',true).find(r=>esTotal(r.Institucion))||{};
  const campos={...window.SVIH_ETIQUETAS_INDICADORES,'Variación_TARV':'Variación interanual','Porc_prep':regional?'% del total provincial de personas en PrEP':'% de personas en PrEP por provincia donde retira'};
  const totalesRegionales=()=>general.filter(r=>esTotal(r.Institucion));
  const indicadoresComparables=filas=>Object.keys(campos).filter(k=>
    k==='Prop_perdida_seguimiento'||filas.some(r=>numeric(r[k])));
  const valorComparable=(fila,id)=>id==='Prop_perdida_seguimiento'
    ?window.porcentajePerdidaSeguimientoSVIH(fila):fila[id];
  const paginas=[['general','Principales indicadores'],['tratamiento','Tratamiento'],['laboratorio','Laboratorio'],['prevencion','PrEP y PeP'],['comparador',regional?'Comparador- por institución':'Comparación'],...(regional?[['regiones','Comparador por región sanitaria'],['mapa','Mapa']]:[]),['definiciones','Definiciones']];
  const iconos={general:['#2765ca','M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z'],tratamiento:['#078d90','M4 12 12 4a5.66 5.66 0 0 1 8 8l-8 8a5.66 5.66 0 0 1-8-8ZM8 8l8 8'],laboratorio:['#b44b97','M9 2h6M10 2v8L3 21h18l-7-11V2M7 15h10'],prevencion:['#198869','M12 2 3 6v6c0 6 9 10 9 10s9-4 9-10V6ZM7 12l3 3 7-7'],comparador:['#b77b0e','M2 3v18h20M6 17V9h3v8ZM12 17V5h3v12ZM18 17v-6h3v6Z'],regiones:['#3976ac','M2 5l7-3 6 3 7-3v17l-7 3-6-3-7 3ZM9 2v17M15 5v17'],definiciones:['#7163aa','M2 3h7l3 3 3-3h7v17h-7l-3 2-3-2H2ZM12 6v16M5 8h4M5 12h4M15 8h4M15 12h4']};
  iconos.mapa=['#3976ac','M3 5l6-3 6 3 6-3v17l-6 3-6-3-6 3ZM9 2v17M15 5v17'];
  const nav=document.querySelector('nav');for(const[id,nombre]of paginas){const a=el('a'),[color,d]=iconos[id],icono=sv('svg',{viewBox:'0 0 24 24',class:'nav-icon',fill:'none',stroke:color,'stroke-width':1.8,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'});icono.style.background=color+'18';icono.append(sv('path',{d}));a.href='#'+id;a.dataset.pagina=id;a.append(icono,el('span',null,nombre));nav.append(a)}
  const ordenar=(a,b)=>a.localeCompare(b,'es',{numeric:true}),roman=v=>{const z=norm(v).match(/(?:sanitaria|region)\s+([ivx]+)$/);if(!z)return 99;const x=z[1].split('').map(c=>({i:1,v:5,x:10})[c]);return x.reduce((s,v,i)=>s+(v<(x[i+1]||0)?-v:v),0)};
  const compararTerritorios=(a,b)=>regional&&roman(a)<99&&roman(b)<99?roman(a)-roman(b):u.compararJurisdicciones(a,b);
  const scopes=uniq(general.map(r=>r.Provincia_atencion)).filter(v=>v&&norm(v)!=='desconocido').sort(compararTerritorios);
  for(const v of scopes){const o=el('option',null,v);o.value=v;$('provincia').append(o)}
  $('provincia').value=regional?scopes.find(v=>roman(v)===1)||scopes[0]:scopes.find(v=>v==='Ciudad de Buenos Aires')||scopes.find(v=>v!=='País')||scopes[0];
  function cargarInstituciones(){const opts=uniq(filas('general',true).map(r=>r.Institucion)).filter(v=>norm(v)!=='desconocido').sort((a,b)=>Number(esTotal(b))-Number(esTotal(a))||ordenar(a,b));$('institucion').replaceChildren(...opts.map(v=>{const o=el('option',null,v);o.value=v;return o}));$('institucion').value=opts.find(esTotal)||opts[0]||'';}
  cargarInstituciones();let activa='general',indicador='N_TARV',seleccionComparador=null,seleccionRegiones=null;
  const ordenComparadores={instituciones:'valor',regiones:'valor'};
  const tarjeta=(host,titulo,valor,pct=false,cl='')=>{const p=panel(host,titulo,'territorial-tarjeta '+cl);p.append(el('div','numero-indicador',f(valor,pct?1:0)+(pct&&numeric(valor)?'%':'')));return p};
  function supresion(host,umbralChico=false){const r=actual(),cobertura=el('b',null,f(r.Prop_con_info_cv,1)+(numeric(r.Prop_con_info_cv)?'%':''));cobertura.style.color=window.colorInformacionCargaViralSVIH(r.Prop_con_info_cv);const p=panel(host,'Carga viral indetectable','territorial-supresion');const rotulo=p.parentElement.querySelector('.rotulo'),texto=el('span',null,'Carga viral indetectable');texto.append(el('span',umbralChico?'umbral-indetectable':null,'\u00a0(<50)'));rotulo.replaceChildren(texto);const line=el('div','supresion-linea');line.append(el('strong',null,f(r.Prop_indetectables,1)+(numeric(r.Prop_indetectables)?'%':'')),el('small',null,'Disponibilidad de información'),cobertura);p.append(line,el('p','ic-viral',`IC 95%: ${f(r.Prop_indetect_IC95_inf,1)}% — ${f(r.Prop_indetect_IC95_sup,1)}%`));return p;}
  function institucionesMapa(id,soloScope=false){const a=t[id]||[],exactas=a.filter(r=>r.Provincia_atencion===scope());let rows=exactas;if(!rows.length&&scope()==='País')rows=a.filter(r=>r.Provincia_atencion!=='País');if(!rows.length&&regional&&esPBA(scope()))rows=a.filter(r=>!esPBA(r.Provincia_atencion)&&r.Provincia_atencion!=='País');return rows.filter(r=>soloScope||esTotal(inst())||norm(r.nombre_institucion||r.Institucion)===norm(inst()));}
  function mapa(host,rows,indicador,tratamiento,nombre='nombre_institucion',cantidad='cantidad'){
    const hospital=activa==='general'&&!esTotal(inst())?inst():null;
    const tituloExportacion=[indicador,scope(),hospital,`Corte: ${datos.fecha}`].filter(Boolean).join(' · ');
    window.crearMapaSVIH(host,rows,{nombre,cantidad,seleccion:scope(),
      encuadrarPuntos:regional||!esTotal(inst()),tituloExportacion,tratamiento});
  }
  function institucionesTabla(host,metrica='N_TARV',provinciaSolo=true){const a=filas('general',true).filter(r=>!esTotal(r.Institucion)&&(provinciaSolo||esTotal(inst())||r.Institucion===inst())),den=total()[metrica],prepRegional=regional&&metrica==='N_prep';tabla(host,a.map(r=>({...r,participacion:prepRegional?r.Porc_prep:numeric(den)&&den>0&&numeric(r[metrica])?r[metrica]/den*100:null})),[['Institucion','Institución'],[metrica,'N'],['participacion',prepRegional?'% provincial':'%',1,true]]);}
  function resumenGeneral(host){const r=actual(),g=el('div','territorial-general');host.append(g);const kpis=el('div','tg-kpis');g.append(kpis);for(const[n,c,p,cl]of[['Personas en TARV','N_TARV',false,'acento'],['Hace 12 meses','N_TARV_hace_1_anio'],['Variación interanual','Variación_TARV',true],['TARV · criterio ONUSIDA','N_TARV_criterio_OMS'],['Instituciones que dispensan TARV','N_instituciones_disp_TARV',false,'acento tg-instituciones']])tarjeta(kpis,n,r[c],p,cl);
    const actividad=el('div','tg-actividad');g.append(actividad);tarjeta(actividad,'Al menos una dispensa este año',r['dispensa_TARV_'+datos.anio],false,'tg-dispensa');tarjeta(actividad,'Primera dispensa registrada este año',r['Anio_1er_TARV_'+datos.anio],false,'tg-inicios');tarjeta(actividad,'Alguna prestación en '+datos.anio,r['N_VIH_seguimiento_'+datos.anio],false,'tg-seguimiento');const s=supresion(g,true);s.parentElement.classList.add('tg-supresion');const perdida=panel(g,'Sin retiro de TARV · personas vivas, con retiro en los últimos 12 meses y sin otra cobertura social','tg-perdida');[['3 a 6 meses sin retiro','perdidos_90_179'],['180 días o más sin retiro','perdidos_180_mas']].forEach(([n,c])=>{const x=el('div','perdida-linea');const valor=el('strong',null,f(r[c]));valor.dataset.campo=c;x.append(el('small',null,n),valor);perdida.append(x)});tarjeta(g,'Notificadas en SNVS',r.Prop_notificados,true,'tg-notificados');tarjeta(g,'Confirmadas en SNVS',r.Prop_caso_confirmado,true,'tg-confirmados');
    const tipos=['N_VIH_seguimiento','Dispensa_TARV','Personas_en_TARV','Anio_1er_TARV'],nombres=['Con alguna prestación en servicios de salud','Al menos una dispensa en el año','En TARV al 30/6 del año','Primera dispensa ese año'];barras(panel(g,'Evolución de las personas en TARV','evolucion-anual tg-anual'),filas('anual').slice().sort((a,b)=>Number(b.Anio)-Number(a.Anio)||tipos.indexOf(a.Tipo_de_metrica)-tipos.indexOf(b.Tipo_de_metrica)).map(r=>({...r,Tipo_de_metrica:nombres[tipos.indexOf(r.Tipo_de_metrica)]||r.Tipo_de_metrica})),'Anio','Valor','Tipo_de_metrica',{horizontal:true});mapa(panel(g,'Distribución de TARV','tg-mapa'),institucionesMapa('mapa'),'Instituciones de dispensa de TARV','TARV');const loc=filas('localidades'),den=r.N_TARV;tabla(panel(g,'Residencia de las personas en TARV','tg-localidades'),loc.map(x=>({...x,Porcentaje:numeric(den)&&den>0?100*x.Cantidad/den:null})),[['Localidad_residencia','Residencia'],['Cantidad','N'],['Porcentaje','%',1,true]]);
    nota(host,'(*) TARV y PrEP corresponden al subsector público. (**) Si el corte es previo al 30/6 del año, se muestra el último mes procesado.');}
  function tratamiento(host){const r=actual(),g=el('div','territorial-tratamiento');host.append(g);const resumen=el('div','tt-resumen');g.append(resumen);tarjeta(resumen,'Personas en TARV',r.N_TARV,false,'acento');tarjeta(resumen,'Personas que ya deberían haber vuelto a retirar medicación',r.Porc_caducados,true);

    const perdida=window.porcentajePerdidaSeguimientoSVIH(r);
    tarjeta(resumen,'Pérdida de seguimiento último año',perdida,true,'tt-perdida');
    medidor(panel(g,'Esquemas basados en DTG','tt-dtg'),r.Prop_DTG_tto,r.N_DTG_tto);medidor(panel(g,'Biterapia (DTG/3TC o DTG/DRV800)','tt-biterapia'),r.Prop_biterapia,r.Biterapia);tabla(panel(g,'Principales esquemas de personas en TARV','tt-esquemas'),filas('esquemas'),[['drogas','Esquema'],['cantidad','N'],['cantidad_p','%',1,true]]);const instit=panel(g,'Personas en TARV por institución','tt-instituciones');const numero=el('p','total-instituciones',`Instituciones que dispensan TARV: ${f(r.N_instituciones_disp_TARV)}`);instit.parentElement.prepend(numero);institucionesTabla(instit,'N_TARV',false);barras(panel(g,'Meses de medicación · última entrega','tt-meses'),[1,2,3].map((v,i)=>({mes:['1 mes','2 meses','3 meses o más'][i],valor:r[['Prop_TARV_1_mes','Prop_TARV_2_mes','Prop_TARV_3_mas'][i]]})),'mes','valor',null,{pct:true});barras(panel(g,'Personas en TARV por fármaco','tt-drogas'),['XTC','DTG','DRV800','RAL','EFV','AZT','NVP'].map(v=>({droga:v,valor:r['Prop_'+v+'_tto']})),'droga','valor',null,{pct:true,horizontal:true});const evolucion=el('div','tt-evolucion');g.append(evolucion);flujo(panel(evolucion,'Evolución de las personas en TARV el último año','tt-flujo'),filas('flujo'));tortaCohorte(panel(evolucion,'Situación de quienes estaban en TARV hace un año','tt-cohorte evolucion-cohorte'),filas('flujo'));nota(host,'(*) Indicador afectado por demora en la carga de dispensas de TARV en las farmacias de los hospitales.');}
  function laboratorio(host){const g=el('div','territorial-laboratorio');host.append(g);const v=supresion(g);v.parentElement.classList.add('tl-viral');for(const[id,titulo]of [['cv','Estudios de carga viral por año'],['cd4','Estudios de CD4 por año']]){const a=filas(id).map(r=>({...r,'Métrica':r.Metrica}));serieMixta(panel(g,titulo,'tl-'+id),a,id==='cv'?'CV':'CD4',id==='cv'?'CV_p':'CD4_p',id==='cv'?'Prom_cv':'Prom_cd4');}nota(host,'Los números bajos en algunas jurisdicciones pueden indicar que no se están cargando todos los datos en el sistema.');}
  function prevencion(host){const g=el('div','territorial-prevencion');host.append(g);const r=total(),res=el('div','tp-resumen');g.append(res);tarjeta(res,'N° de personas en PrEP',r.N_prep,false,'acento');tarjeta(res,regional?campos.Porc_prep:'% de personas por provincia donde retira',r.Porc_prep,true);const prep=panel(g,'Personas en PrEP por institución','tp-instituciones');institucionesTabla(prep,'N_prep');mapa(panel(g,'Localización de instituciones que distribuyen PrEP','tp-mapa'),institucionesMapa('mapa_prep',true),'Instituciones que distribuyen PrEP','PrEP');const h=el('h2','tp-separador','Profilaxis post exposición');g.append(h);barras(panel(g,'PeP por año','tp-anual'),filas('anual_pep',true),'Anio','Valor','Indicador');const a=filas('mapa_pep',true),den=a.reduce((s,r)=>s+(numeric(r.Cantidad)?r.Cantidad:0),0);tabla(panel(g,'Instituciones que dispensaron PeP los últimos 12 meses','tp-pep'),a.map(r=>({...r,Porcentaje:den>0?100*r.Cantidad/den:null})),[['Institucion','Institución'],['Cantidad','N'],['Porcentaje','%',1,true]]);
    mapa(panel(g,'Localización de instituciones que dispensaron PeP','tp-mapa-pep'),a,
      'Instituciones que dispensaron PeP en los últimos 12 meses','PeP','Institucion','Cantidad');
  }
  function comparador(host,porRegion=false){const controles=el('div','controles-comparador'),lab=el('label'),details=el('details'),summary=el('summary'),opts=el('div','opciones-periodos'),etiqueta=el('div','control-indicador', 'Indicador: ');details.append(summary,opts);lab.append(details);controles.append(lab,etiqueta);host.append(controles);const candidatos=porRegion?totalesRegionales():filas('general',true),clave=porRegion?'Provincia_atencion':'Institucion',valores=uniq(candidatos.map(r=>r[clave])).filter(v=>norm(v)!=='desconocido').sort(porRegion?compararTerritorios:(a,b)=>Number(esTotal(b))-Number(esTotal(a))||ordenar(a,b));let elegidos=porRegion?seleccionRegiones:seleccionComparador;if(!elegidos||!elegidos.every(v=>valores.includes(v)))elegidos=porRegion?[valores.find(esPBA)||valores[0]]:[valores.find(esTotal)||valores[0]];
    const indicators=indicadoresComparables(candidatos);if(!indicators.includes(indicador))indicador=indicators.includes('N_TARV')?'N_TARV':indicators[0];etiqueta.append(selectorIndicador(indicators,campos,indicador,id=>{indicador=id;dibujar()}));const graph=panel(host,porRegion?'Comparación entre regiones sanitarias':'Comparación por institución','tc-grafico historico-grafico'),stats=el('div','tc-resumen');host.append(stats);
    const tipoOrden=porRegion?'regiones':'instituciones',ordenHost=el('div','orden-historico'),ordenBoton=el('button','boton-orden-historico');ordenBoton.type='button';ordenHost.append(el('small',null,'Ordenar barras'),ordenBoton);controles.append(ordenHost);
    const definicion=el('section','definicion-indicador definicion-indicador-al-pie');
    definicion.setAttribute('aria-label','Definición del indicador seleccionado');
    host.append(definicion);
    ordenBoton.onclick=()=>{ordenComparadores[tipoOrden]=ordenComparadores[tipoOrden]==='valor'?'alfabetico':'valor';dibujar()};
    function dibujar(){summary.textContent=(porRegion?'Regiones':'Instituciones')+` (${elegidos.length}) ▾`;graph.replaceChildren();const pct=String(campos[indicador]).startsWith('%')||(porRegion&&indicador==='Variación_TARV'),rows=candidatos.filter(r=>elegidos.includes(r[clave]));
      window.mostrarDefinicionIndicadorSVIH(definicion,indicador,t.definiciones);
      // Ordenar solo las filas visibles conserva totales, filtros y resúmenes.
      if(indicador==='Prop_perdida_seguimiento'){
        for(let i=0;i<rows.length;i++)rows[i]={...rows[i],Prop_perdida_seguimiento:valorComparable(rows[i],indicador)};
      }
      rows.sort((a,b)=>{
        if(ordenComparadores[tipoOrden]==='valor'){
          if(numeric(a[indicador])!==numeric(b[indicador]))return numeric(a[indicador])?-1:1;
          if(numeric(a[indicador])&&a[indicador]!==b[indicador])return b[indicador]-a[indicador];
        }
        return ordenar(a[clave],b[clave]);
      });
      ordenBoton.textContent=ordenComparadores[tipoOrden]==='valor'?'↓ Valor':porRegion?'A–Z Región':'A–Z Institución';ordenBoton.setAttribute('aria-pressed',String(ordenComparadores[tipoOrden]==='valor'));ordenBoton.title='Alternar orden alfabético y valor de mayor a menor. Empates por nombre; faltantes al final.';
      barras(graph,rows,clave,indicador,null,{etiquetasHorizontales:regional,formato:v=>f(v,pct?1:0)+(pct?'%':'')});
      const grafico=graph.querySelector('.grafico-svg');
      if(grafico){
        grafico.dataset.tituloExportacion=campos[indicador]+(porRegion?' por región sanitaria':' por institución');
        grafico.dataset.ambitoExportacion=porRegion?'Provincia de Buenos Aires':scope();
      }
      stats.replaceChildren();
      stats.hidden=graph.querySelectorAll('.barra-dato').length===1;
      if(stats.hidden)return;
      const visibles=rows.filter(r=>numeric(r[indicador])).map(r=>r[indicador]).sort((a,b)=>a-b),n=visibles.length,resumen={Mediana:n?(n%2?visibles[(n-1)/2]:visibles[n/2-1]/2+visibles[n/2]/2):null,'Máximo':n?visibles[n-1]:null,'Mínimo':n?visibles[0]:null};for(const[nombre,v]of Object.entries(resumen)){const x=el('div');x.append(el('span',null,nombre),el('strong',null,f(v,pct||!Number.isInteger(v)?1:0)+(pct&&numeric(v)?'%':'')));if(n&&nombre!=='Mediana')x.append(el('small',null,uniq(rows.filter(r=>r[indicador]===v).map(r=>r[clave])).sort(ordenar).join(' · ')));stats.append(x)}}
    const todo=el('label'),check=el('input');check.type='checkbox';check.checked=elegidos.length===valores.length;check.indeterminate=!!elegidos.length&&!check.checked;todo.append(check,document.createTextNode('Todos'));opts.append(todo);check.onchange=()=>{elegidos=check.checked?valores.slice():[];opts.querySelectorAll('[data-opcion]').forEach(x=>x.checked=check.checked);guardar();dibujar()};for(const v of valores){const l=el('label'),c=el('input');c.type='checkbox';c.dataset.opcion=v;c.checked=elegidos.includes(v);l.append(c,document.createTextNode(v));opts.append(l);c.onchange=()=>{elegidos=[...opts.querySelectorAll('[data-opcion]:checked')].map(x=>x.dataset.opcion);check.checked=elegidos.length===valores.length;check.indeterminate=!!elegidos.length&&!check.checked;guardar();dibujar()}}function guardar(){if(porRegion)seleccionRegiones=elegidos;else seleccionComparador=elegidos;}dibujar();}
  let indicadorMapaRegional='N_TARV',ordenMapaRegional='valor';
  function mapaRegional(host){
    const totales=totalesRegionales(),ids=indicadoresComparables(totales);
    ids.splice(ids.includes('N_TARV')?1:0,0,'Porc_en_TARV');
    if(!ids.includes(indicadorMapaRegional))indicadorMapaRegional=ids[0];
    const etiquetas={...campos,Porc_en_TARV:'% de personas en TARV por región de atención'};
    const provincia=totales.find(r=>esPBA(r.Provincia_atencion));
    const baseRegiones=totales.filter(r=>roman(r.Provincia_atencion)<99);
    const valor=(r,id)=>{
      if(!r)return null;
      if(id==='Porc_en_TARV')return numeric(r.N_TARV)&&provincia?.N_TARV>0?100*r.N_TARV/provincia.N_TARV:null;
      return valorComparable(r,id);
    };
    const pagina=el('div','comparativo-grid mapa-regional-grid'),selector=el('div','selector-comparativo');
    const buscar=el('input','buscar-indicador'),lista=el('div','lista-indicadores');
    buscar.type='search';buscar.placeholder='Buscar indicador…';buscar.setAttribute('aria-label','Buscar indicador');
    selector.append(el('div','encabezado-selector','Indicador (1)'),buscar,lista);
    const vista=el('div','comparativo-vista'),cabecera=el('div','cabecera-comparativo');
    const titulo=el('h3','titulo-comparativo'),orden=el('button','boton-orden-historico');
    orden.type='button';cabecera.append(titulo,orden);
    const cuerpo=el('div','comparativo-cuerpo'),mapaHost=el('div','comparativo-mapa');
    const ranking=el('div','comparativo-barras');
    cuerpo.append(mapaHost,ranking);vista.append(cabecera,cuerpo);
    const definicion=el('section','definicion-indicador definicion-indicador-en-recuadro');
    definicion.setAttribute('aria-label','Definición del indicador seleccionado');definicion.tabIndex=0;
    pagina.append(selector,vista,definicion);host.append(pagina);
    const definiciones=[{
      INDICADOR:'% de personas en TARV por provincia de atención',
      'DESCRIPCIÓN':'Personas en TARV atendidas en la región como porcentaje del total provincial al corte.'
    },...t.definiciones];
    let mapaDibujado=null;
    function dibujar(){
      const id=indicadorMapaRegional,etiqueta=etiquetas[id];
      const pct=etiqueta.startsWith('%')||id==='Variación_TARV';
      const formato=v=>numeric(v)?f(v,pct?1:0)+(pct?'%':''):'—';
      const filas=baseRegiones.map(r=>({
        codigo:norm(r.Provincia_atencion).split(' ').at(-1).toUpperCase(),
        region:r.Provincia_atencion,valor:valor(r,id)
      }));
      titulo.textContent=etiqueta;
      const valorProvincial=valor(provincia,id);
      orden.textContent=ordenMapaRegional==='valor'?'↓ Valor':'I–XII Región';
      orden.setAttribute('aria-label','Ordenar regiones por '+(ordenMapaRegional==='valor'?'número de región':'valor'));
      if(mapaDibujado!==id){
        const mostrarProvincial=id!=='Porc_en_TARV'&&id!=='Porc_prep';
        window.crearMapaRegionesSVIH(mapaHost,filas,{formato,provincial:valorProvincial,mostrarProvincial,tituloExportacion:etiqueta+' · Regiones sanitarias de Buenos Aires · '+datos.fecha});
        window.mostrarDefinicionIndicadorSVIH(definicion,id,definiciones);
        mapaDibujado=id;
      }
      filas.sort((a,b)=>{
        if(ordenMapaRegional==='valor'){
          if(numeric(a.valor)!==numeric(b.valor))return numeric(a.valor)?-1:1;
          if(numeric(a.valor)&&a.valor!==b.valor)return b.valor-a.valor;
        }
        return roman(a.region)-roman(b.region);
      });
      ranking.replaceChildren();
      barras(ranking,[...filas,{region:'Provincia de Buenos Aires',valor:valorProvincial}],'region','valor',null,{horizontal:true,formato});
      const grafico=ranking.querySelector('.grafico-svg');
      if(grafico){grafico.dataset.tituloExportacion=etiqueta;grafico.dataset.ambitoExportacion='Regiones sanitarias de Buenos Aires';}
    }
    orden.onclick=()=>{ordenMapaRegional=ordenMapaRegional==='valor'?'region':'valor';dibujar()};
    for(const id of ids){
      const fila=el('label'),radio=el('input');
      radio.type='radio';radio.name='indicador-mapa-regional';radio.value=id;radio.checked=id===indicadorMapaRegional;
      fila.append(radio,el('span',null,etiquetas[id]));lista.append(fila);
      radio.onchange=()=>{indicadorMapaRegional=id;dibujar()};
    }
    buscar.oninput=()=>{for(const fila of lista.children)fila.hidden=!norm(fila.textContent).includes(norm(buscar.value))};
    dibujar();
  }
  function ajustarTitulos(){document.querySelectorAll('.territorial-tarjeta .rotulo').forEach(x=>{let n=12;x.style.fontSize=n+'px';while(x.scrollHeight>x.clientHeight+1&&n>9){n-=.25;x.style.fontSize=n+'px'}})}
  // Editorial 3.0: reservar la misma cabecera/navegación en hospital y región.
  function distribuirEspacio(){
    if(innerWidth<700)return;
    const main=document.querySelector("main");
    main.style.setProperty("--top-titulo","181px");main.style.setProperty("--top-filtros","137px");main.style.setProperty("--top-datos","224px");main.style.setProperty("--alto-vista","478px");
  }
  function mostrar(){
    if(!regional)$('acceso-regiones-sanitarias').hidden=!esPBA(scope());
    document.querySelector('main').dataset.vista=activa;document.querySelector('main').dataset.ambito=datos.ambito;const vista=$('vista-territorial');vista.replaceChildren();$('filtro-institucion').hidden=['prevencion','comparador','regiones','mapa','definiciones'].includes(activa);document.querySelector('.filtros-territoriales').hidden=['regiones','mapa','definiciones'].includes(activa);$('titulo-vista').textContent=({general:'Personas en TARV',tratamiento:'Características del TARV',laboratorio:'Carga viral y CD4',prevencion:'Personas en PrEP',comparador:'Comparador de indicadores por institución',regiones:'Comparador de indicadores por región sanitaria',mapa:'Mapa de regiones sanitarias',definiciones:'Definición de indicadores'})[activa];nav.querySelectorAll('a').forEach(a=>{a.classList.toggle('activo',a.dataset.pagina===activa);if(a.dataset.pagina===activa)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});distribuirEspacio();if(activa==='general')resumenGeneral(vista);if(activa==='tratamiento')tratamiento(vista);if(activa==='laboratorio')laboratorio(vista);if(activa==='prevencion')prevencion(vista);if(activa==='comparador'||activa==='regiones')comparador(vista,activa==='regiones');if(activa==='mapa')mapaRegional(vista);if(activa==='definiciones'){const host=el('div','tabla-definiciones');vista.append(host);tabla(host,t.definiciones,[['INDICADOR','INDICADOR'],['DESCRIPCIÓN','DESCRIPCIÓN'],['OBSERVACIONES','OBSERVACIONES']]);nota(vista,'SVIH: Sistema de gestión de insumos de VIH. TARV: Tratamiento antirretroviral. SNVS: Sistema Nacional de Vigilancia de la Salud.');}ajustarTitulos();}
  $('provincia').onchange=()=>{cargarInstituciones();seleccionComparador=null;mostrar()};$('institucion').onchange=mostrar;function ruta(){activa=paginas.some(([id])=>id===location.hash.slice(1))?location.hash.slice(1):'general';mostrar()}window.addEventListener('hashchange',ruta);window.addEventListener('resize',mostrar);ruta();
})();
