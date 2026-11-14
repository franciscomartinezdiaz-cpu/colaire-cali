// ===== ColAIre · Reportes ciudadanos (versión con sesión) =====
const $=(s)=>document.querySelector(s);
const esc=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=(p)=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const MIN=60000;
const ULEV={ninguna:0,azul:1,amarillo:2,naranja:3,rojo:4};
const VENTANA={rojo:180,naranja:240,amarillo:360,azul:90,ninguna:60};
const DEMO_PASS='colaire2026';

const ROLES={
  ciudadano:{l:'Ciudadano',c:'#0f766e'}, adulto_mayor:{l:'Adulto mayor',c:'#0e7490'}, estudiante:{l:'Estudiante',c:'#4f46e5'}, turista:{l:'Turista',c:'#c026d3'},
  movilidad:{l:'Sec. Movilidad',c:'#2563eb',inst:1}, riesgo:{l:'Gestión del Riesgo',c:'#b45309',inst:1}, salud:{l:'Sec. Salud',c:'#059669',inst:1},
  bomberos:{l:'Bomberos',c:'#dc2626',inst:1}, policia:{l:'Policía',c:'#1e3a8a',inst:1}, cruzroja:{l:'Cruz Roja',c:'#be123c',inst:1},
  defensacivil:{l:'Defensa Civil',c:'#ca8a04',inst:1}, alcaldia:{l:'Alcaldía',c:'#334155',inst:1}, gobernacion:{l:'Gobernación',c:'#166534',inst:1},
};
const ROLES_REGISTRO=['ciudadano','adulto_mayor','estudiante','turista'];
const DEF_ACC=[
  ['ciudadano1','Ciudadano 1','ciudadano','SAN ANTONIO'],['ciudadano2','Ciudadano 2','ciudadano','SILOE'],['ciudadano3','Ciudadana 3','ciudadano','Calima'],
  ['adultomayor','Adulto mayor','adulto_mayor','Granada'],['estudiantesuniversidad','Estudiantes universidad','estudiante','El Ingenio'],
  ['turista1','Turista 1','turista','Granada'],['turista2','Turista 2','turista','SAN ANTONIO'],
  ['secretariamov','Secretaría de Movilidad','movilidad',''],['gestionriesgo','Secretaría de Gestión del Riesgo','riesgo',''],
  ['saludcali','Secretaría de Salud','salud',''],['bomberoscali','Bomberos Cali','bomberos',''],['policiacali','Policía Metropolitana','policia',''],
  ['cruzrojavalle','Cruz Roja Valle','cruzroja',''],['defensacivil','Defensa Civil','defensacivil',''],
  ['alcaldiacali','Alcaldía de Cali','alcaldia',''],['gobernacionvalle','Gobernación del Valle','gobernacion',''],
].map(([u,n,r,b])=>({email:u+'@colaire.test',nombre:n,rol:r,barrio:b,demo:true}));
const barrioTxt=(r)=>r.barrio?`${r.barrioAprox?'cerca de ':''}${nombreBarrio(r.barrio)}`:'';
const isInst=(u)=>!!(u&&ROLES[u.rol]&&ROLES[u.rol].inst);

// ---------- Datos geográficos reales (repo tangara_2026_v2) ----------
const BARRIOS=GEO_BARRIOS.features.map(f=>f.properties);
const BARRIO_BY=Object.fromEntries(BARRIOS.map(b=>[b.barrio,b]));
const COMUNA_BY=Object.fromEntries(GEO_COMUNAS.features.map(f=>[f.properties.comuna,f.properties]));
const titulo=(s)=>s.toLowerCase().replace(/(^|[\s(.-])(\S)/g,(m,a,b)=>a+b.toUpperCase());
const nombreBarrio=(b)=>/[a-z]/.test(b)?b:titulo(b);
(function construirGazetteer(){
  const SKIP=new Set(['el hoyo','la isla','popular','porvenir','la esperanza','la paz','la base','el piloto','la nueva base','los andes','el rodeo','la merced','el nacional','la alianza','el bosque','santa fe','fatima','la floresta','el troncal','la fortaleza','industrial']);
  const reEsc=(s)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const vistos=new Set(); const out=[];
  const lista=[...BARRIOS].sort((a,b)=>b.barrio.length-a.barrio.length);
  for(const b of lista){
    let n=norm(b.barrio).replace(/^(urbanizacion|sector|barrio)\s+/,'').replace(/\s+(i{1,3}|iv|\d+a?\.?\s*etapa|primera etapa|segunda etapa|etapa.*)$/,'').replace(/\s+/g,' ').trim();
    if(n.length<4 || SKIP.has(n) || vistos.has(n)) continue; vistos.add(n);
    out.push(['\\b'+reEsc(n)+'\\b', b.lat, b.lon, `Barrio ${nombreBarrio(b.barrio)} (Comuna ${b.comuna})`]);
  }
  const reales=new Set(out.map(o=>o[0]));
  const sitios=LUGARES.filter(l=>!BARRIOS.some(b=>new RegExp(l[0]).test(norm(b.barrio))));
  const ofi=[], vo=new Set(); if(typeof CAPA_BARRIOS!=='undefined') for(const b of [...CAPA_BARRIOS].sort((x,y)=>y.n.length-x.n.length)){
    const n=norm(b.n).replace(/^(urbanizacion|sector|barrio)\s+/,'').replace(/\s+(i{1,3}|iv|\d+a?\.?\s*etapa|primera etapa|segunda etapa|etapa.*)$/,'').replace(/\s+/g,' ').trim();
    if(n.length<4||SKIP.has(n)||vo.has(n)) continue; vo.add(n); ofi.push(['\\b'+reEsc(n)+'\\b',b.c[1],b.c[0],`Barrio ${b.n} (Comuna ${+b.com})`]); }
  const out2=out.map(o=>{ const nm=o[0]; const of=ofi.find(x=>x[0]===nm); return of||o; });
  globalThis.LUGARES_OVERRIDE=ofi.filter(x=>!out.some(o=>o[0]===x[0])).concat(out2).concat(sitios);
})();
function pip(pt,ring){ let ins=false; for(let i=0,j=ring.length-1;i<ring.length;j=i++){ const xi=ring[i][0],yi=ring[i][1],xj=ring[j][0],yj=ring[j][1];
  if(((yi>pt[1])!==(yj>pt[1])) && (pt[0]<(xj-xi)*(pt[1]-yi)/(yj-yi)+xi)) ins=!ins; } return ins; }
function enPoligono(lat,lon,geom){ for(const poly of geom.coordinates){ if(pip([lon,lat],poly[0]) && !poly.slice(1).some(h=>pip([lon,lat],h))) return true; } return false; }
function enCapa(lat,lon,o){ if(!o._bb){ let x0=180,y0=90,x1=-180,y1=-90; for(const p of o.p) for(const [x,y] of p[0]){ if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; } o._bb=[x0,y0,x1,y1]; }
  const b=o._bb; if(lon<b[0]||lon>b[2]||lat<b[1]||lat>b[3]) return false; return enPoligono(lat,lon,{coordinates:o.p}); }
function barrioOficial(lat,lon){ return (typeof CAPA_BARRIOS!=='undefined')?CAPA_BARRIOS.find(o=>enCapa(lat,lon,o))||null:null; }
function comunaOficial(lat,lon){ return (typeof CAPA_COMUNAS!=='undefined')?CAPA_COMUNAS.find(o=>enCapa(lat,lon,o))||null:null; }
function ubicarBarrio(lat,lon){
  const ob=barrioOficial(lat,lon); if(ob) return {barrio:ob.n,comuna:+ob.com,codigo:ob.k};
  for(const f of GEO_BARRIOS.features) if(enPoligono(lat,lon,f.geometry)) return f.properties;
  let best=null,bd=1e9; for(const b of BARRIOS){ const d=distM({lat,lon},b); if(d<bd){ bd=d; best=b; } }
  if(best&&bd<1200) return {...best,aprox:true};
  for(const f of GEO_COMUNAS.features) if(enPoligono(lat,lon,f.geometry)) return {barrio:null,comuna:f.properties.comuna};
  return null;
}

// ---------- Almacenamiento ----------
const S={mode:'local',db:null,data:{usuarios:{},reportes:{},mensajes:{},ayudas:{},semaforos:{}}};
const LSKEY='colaire_chat_v1';
function lsGet(k,d){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch(e){ return d; } }
function lsSet(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
function loadLocal(){ const d=lsGet(LSKEY,null); if(d) S.data={usuarios:d.usuarios||{},reportes:d.reportes||{},mensajes:d.mensajes||{},ayudas:d.ayudas||{},semaforos:d.semaforos||{}}; }
function saveLocal(){ if(S.mode==='local') lsSet(LSKEY,S.data); }
window.addEventListener('storage',e=>{ if(e.key===LSKEY&&S.mode==='local'){ loadLocal(); renderAll(); } });
const docId=(email)=>email.toLowerCase().replace(/[^a-z0-9._-]/g,'_');
const WQ={};
function put(col,obj){
  S.data[col][obj.id]=obj;
  if(S.mode==='db'){ const k=col+'/'+obj.id; WQ[k]=(WQ[k]||Promise.resolve()).then(()=>S.db.collection(col).doc(obj.id).set(JSON.parse(JSON.stringify(obj)))).catch(e=>{
      if(e&&e.code==='quota_exceeded') toast('La base de datos está llena: borra datos de prueba.'); else if(e&&e.code==='invalid_argument') toast('Tu acceso a la página es de solo lectura: no se guardó.'); }); }
  else saveLocal();
  renderAll();
}
async function delAll(){
  if(S.mode==='db') for(const col of ['reportes','usuarios','mensajes','ayudas','semaforos']) for(const id of Object.keys(S.data[col])){ try{ await S.db.collection(col).doc(id).delete(); }catch(e){} }
  S.data={usuarios:{},reportes:{},mensajes:{},ayudas:{},semaforos:{}}; saveLocal(); renderAll();
}
async function initDB(){
  if(!(window.claude&&window.claude.use)) return;
  let db=null; try{ db=await window.claude.use('db'); }catch(e){}
  if(!db) return;
  S.db=db; S.mode='db'; S.data={usuarios:{},reportes:{},mensajes:{},ayudas:{},semaforos:{}}; $('#dbmode').textContent='Conectando…';
  const timer=setTimeout(()=>{ $('#dbmode').textContent='Datos compartidos (sin respuesta aún)'; },10000);
  for(const col of ['usuarios','reportes','mensajes','ayudas','semaforos']){
    db.collection(col).onSnapshot(snap=>{ const o={}; for(const d of snap.docs){ const v=d.data(); if(v) o[d.id]={...v,id:d.id}; } S.data[col]=o;
      if(!snap.metadata.fromCache){ clearTimeout(timer); $('#dbmode').textContent='Datos compartidos en línea'; } renderAll(); },
      ()=>{ clearTimeout(timer); $('#dbmode').textContent='Datos compartidos (sin conexión)'; });
  }
}

// ---------- Sesión ----------
async function hashPass(pass,salt){
  try{ const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+'|'+pass)); return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join(''); }
  catch(e){ let h=0; for(const ch of salt+'|'+pass) h=(h*31+ch.charCodeAt(0))|0; return 'x'+h; }
}
function usuario(email){ if(!email) return null; email=email.toLowerCase(); const st=S.data.usuarios[docId(email)]; if(st) return st; const d=DEF_ACC.find(a=>a.email===email); return d?{...d,id:docId(email)}:null; }
let SES=lsGet('colaire_rc_ses',null);
const yo=()=>usuario(SES);
async function login(email,pass){
  email=email.trim().toLowerCase(); const u=usuario(email);
  if(!u) return 'No existe una cuenta con ese correo.';
  if(u.hash){ if(await hashPass(pass,u.salt)!==u.hash) return 'Contraseña incorrecta.'; }
  else if(pass!==DEMO_PASS) return 'Contraseña incorrecta (las cuentas de prueba usan colaire2026).';
  SES=email; lsSet('colaire_rc_ses',email); entrar(); return null;
}
async function registrar(nombre,email,pass,rol,barrio){
  email=email.trim().toLowerCase();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'Correo no válido.';
  if(usuario(email)) return 'Ya existe una cuenta con ese correo.';
  if(pass.length<6) return 'La contraseña debe tener al menos 6 caracteres.';
  const salt=Math.random().toString(36).slice(2,12); const b=BARRIO_BY[barrio];
  put('usuarios',{id:docId(email),email,nombre:nombre.trim(),rol,barrio,comuna:b?b.comuna:null,salt,hash:await hashPass(pass,salt),hogar:{},creado:Date.now()});
  SES=email; lsSet('colaire_rc_ses',email); entrar(); return null;
}
function salir(){ document.querySelector('[data-at=login]').click(); $('#lPass').value=''; SES=null; lsSet('colaire_rc_ses',null); document.body.classList.remove('auth'); if(PLAY){ clearInterval(PLAY); PLAY=null; } }
function entrar(){ SEEN=null; document.body.classList.add('auth'); showView('mapa'); renderAll(); setTimeout(()=>map&&map.invalidateSize(),60); }

// login UI
document.querySelectorAll('[data-at]').forEach(b=>b.onclick=()=>{ document.querySelectorAll('[data-at]').forEach(x=>x.classList.toggle('on',x===b)); $('#f-login').style.display=b.dataset.at==='login'?'':'none'; $('#f-reg').style.display=b.dataset.at==='registro'?'':'none'; });
$('#demoAcc').innerHTML=DEF_ACC.map(a=>`<button type="button" data-demo="${a.email}">${esc(a.email.split('@')[0])}</button>`).join('');
$('#demoAcc').onclick=e=>{ const b=e.target.closest('[data-demo]'); if(!b) return; $('#lEmail').value=b.dataset.demo; $('#lPass').value=DEMO_PASS; };
$('#f-login').onsubmit=async e=>{ e.preventDefault(); $('#lErr').textContent=(await login($('#lEmail').value,$('#lPass').value))||''; };
$('#f-reg').onsubmit=async e=>{ e.preventDefault(); $('#rErr').textContent=(await registrar($('#rName').value,$('#rEmail').value,$('#rPass').value,$('#rRol').value,$('#rBarrio').value))||''; };
$('#logout').onclick=salir;
const barrioOpts=(sel)=>`<option value="">— Elige tu barrio —</option>`+[...BARRIOS].sort((a,b)=>norm(a.barrio).localeCompare(norm(b.barrio))).map(b=>`<option value="${esc(b.barrio)}"${b.barrio===sel?' selected':''}>${esc(nombreBarrio(b.barrio))} · Comuna ${b.comuna}</option>`).join('');
$('#rRol').innerHTML=ROLES_REGISTRO.map(r=>`<option value="${r}">${ROLES[r].l}</option>`).join('');
$('#rBarrio').innerHTML=barrioOpts('');

// ---------- Reloj: simulación del 10 de agosto de 2026 o en vivo ----------
const LOGO_W='img/bird_white.png';
const LOGO_N='img/bird_navy.png';
const SIM0=Date.parse('2026-08-10T07:00:00-05:00'), SIMEND=Date.parse('2026-08-10T14:00:00-05:00');
let MODO=lsGet('colaire_modo','sim'), TSIM=lsGet('colaire_tsim',SIM0), PLAY=null, LASTTS=0;
const nowT=()=>MODO==='vivo'?Date.now():TSIM;
const enVentana=(ts)=>MODO==='sim'?(ts>=SIM0&&ts<=SIMEND):ts>SIMEND;
function tsNuevo(){ if(MODO==='vivo'){ LASTTS=Date.now(); return LASTTS; } LASTTS=Math.max(TSIM,LASTTS+1000); TSIM=Math.max(TSIM,LASTTS); return LASTTS; }
const fmtH=(ts)=>new Date(ts).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:'America/Bogota'});
const fmtD=(ts)=>new Date(ts).toLocaleString('es-CO',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Bogota'});
function hace(ms){ const m=Math.round(ms/MIN); if(m<1) return 'ahora'; if(m<60) return `hace ${m} min`; const h=Math.floor(m/60); return `hace ${h} h ${m%60} min`; }
const visibles=(col)=>Object.values(S.data[col]).filter(x=>x.ts<=nowT()&&enVentana(x.ts));

// ---------- Estado de un reporte en T ----------
function estadoReporte(r,T){
  const conf=(r.confirmaciones||[]).filter(c=>c.ts<=T);
  let u=r.urgencia||'azul'; for(const c of conf) if(c.urgencia&&ULEV[c.urgencia]>ULEV[u]) u=c.urgencia;
  const est=(r.estados||[]).filter(e=>e.ts<=T); const e=est.length?est[est.length-1]:{estado:'nuevo',ts:r.ts};
  const last=Math.max(r.ts,...conf.map(c=>c.ts),e.ts);
  const personas=new Set([r.autor,...conf.map(c=>c.autor)]).size;
  const age=(T-last)/MIN;
  let inten=e.estado==='atendido'?Math.max(0,0.5-(T-e.ts)/MIN/120):Math.max(ULEV[u]>=3?0.3:0.12,1-age/VENTANA[u]);
  inten=Math.min(1,inten*(1+0.15*(personas-1)));
  return {u,estado:e.estado,estTs:e.ts,personas,conf,last,inten,sinAtender:u==='rojo'&&e.estado==='nuevo'&&(T-r.ts)>30*MIN};
}
function estadoAyuda(a,T){ const est=(a.estados||[]).filter(e=>e.ts<=T); const e=est.length?est[est.length-1]:{estado:'abierto',ts:a.ts}; return {estado:e.estado,estTs:e.ts,resp:(a.respuestas||[]).filter(r=>r.ts<=T)}; }

// ---------- Conexión con n8n ----------
const CFG=window.COLAIRE_CONFIG||{};
let N8N=lsGet('colaire_n8n',null)||{url:CFG.n8nUrl||'',on:!!CFG.n8nActivo};
const n8nActivo=()=>!!(N8N.on&&/^https?:\/\//.test(N8N.url||''));
async function llamarN8N(payload,ms=15000){
  const ctl=new AbortController(); const t=setTimeout(()=>ctl.abort(),ms);
  try{ const r=await fetch(N8N.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:ctl.signal});
    const txt=await r.text(); if(!r.ok) throw new Error('HTTP '+r.status+(txt?': '+txt.slice(0,120):''));
    let j; try{ j=JSON.parse(txt); }catch(e){ throw new Error('La respuesta no es JSON. ¿El flujo termina en «Responder a la plataforma»?'); }
    if(Array.isArray(j)) j=j[0]; if(!j||j.ok!==true) throw new Error('Respuesta inesperada del flujo'); return j;
  } finally{ clearTimeout(t); } }
function renderMotor(){ const on=n8nActivo(); $('#motorPill').innerHTML=on?'<span class="dotg"></span> Motor: n8n':'<span class="dotl"></span> Motor: local'; $('#motorPill').classList.toggle('on',on); }
function abrirN8N(){
  $('#mbox').innerHTML=`<div class="row" style="gap:10px;align-items:center;margin-bottom:6px"><img src="${LOGO_N}" width="34" alt=""><h3 style="margin:0">Conectar con n8n</h3></div>
  <p class="ex" style="margin-top:0">Cada mensaje del chat se envía a tu flujo de n8n, que lo interpreta con IA, busca la dirección en OpenStreetMap y envía alertas por Telegram. Si n8n no responde en 15 s, la plataforma usa su motor local.</p>
  <div class="field"><label>URL del webhook (Production URL del nodo «Mensaje del chat ciudadano»)</label><input id="n8nUrl" placeholder="https://tu-instancia.app.n8n.cloud/webhook/colaire-mensaje" value="${esc(N8N.url||'')}"></div>
  <label class="ex" style="display:flex;gap:6px;align-items:center;margin-bottom:10px"><input type="checkbox" id="n8nOn" ${N8N.on?'checked':''}> Usar n8n para procesar los mensajes del chat</label>
  <div class="row"><button class="btn" id="n8nSave">Guardar</button><button class="btn sec" id="n8nTest">Probar conexión</button><button class="btn sec" id="n8nClose">Cerrar</button></div>
  <div id="n8nRes" class="ex" style="margin-top:10px"></div>`;
  $('#modal').style.display='grid';
  const leer=()=>{ N8N={url:$('#n8nUrl').value.trim(),on:$('#n8nOn').checked}; lsSet('colaire_n8n',N8N); renderMotor(); };
  $('#n8nSave').onclick=()=>{ leer(); $('#n8nRes').innerHTML=n8nActivo()?'✅ Guardado. Los próximos mensajes pasarán por n8n.':'Guardado. Se usará el motor local.'; renderAll(); };
  $('#n8nClose').onclick=()=>{ $('#modal').style.display='none'; };
  $('#n8nTest').onclick=async()=>{ leer(); if(!/^https?:\/\//.test(N8N.url)){ $('#n8nRes').textContent='Escribe la URL del webhook.'; return; }
    $('#n8nRes').textContent='Enviando mensaje de prueba…'; const t0=performance.now();
    try{ const j=await llamarN8N({texto:'Prueba de conexión: hay una mujer herida en la calle 5 con carrera 34',autor:SES,nombre:(yo()||{}).nombre,rol:(yo()||{}).rol,ts:Date.now(),prueba:true,local:{clas:clasificar('hay una mujer herida en la calle 5 con carrera 34'),candidatos:geocodificar('calle 5 con carrera 34').candidatos}});
      $('#n8nRes').innerHTML=`✅ Conectado en ${Math.round(performance.now()-t0)} ms · modelo: <b>${esc(j.modelo)}</b> · urgencia: ${esc(j.urgencia)} · ubicación: ${esc(j.ubic?j.ubic.label+' ('+j.ubic.fuente+')':'—')} · Telegram: ${j.telegram?j.telegram.enviados:0} alerta(s)${j.errorIA?`<div style="color:#b45309">⚠ Gemini respondió con error: ${esc(j.errorIA)}. Revisa la clave en «Configuración y entrada».</div>`:''}`; }
    catch(e){ $('#n8nRes').innerHTML=`<span style="color:#b91c1c">❌ No se pudo conectar: ${esc(e.name==='AbortError'?'n8n no respondió en 15 s':e.message)}</span><div>Revisa que el flujo esté <b>activo</b>, que uses la <b>Production URL</b> y que el nodo Webhook tenga <i>Allowed Origins (CORS)</i> en <code>*</code>.</div>`; } };
}

// ---------- Pipeline del chat ciudadano ----------
const EMERG=new Set(['atrapados','heridos','colapso','incendio','gas','electrico','estructura']);
const RE_OFERTA=/\b(tengo|tenemos|ofrezco|ofrecemos|puedo (llevar|donar|ayudar|prestar|transportar)|podemos (llevar|donar|ayudar)|dono|donamos|regalo|para donar|disponible para)\b/;
const RE_PERSONAL=/\b(voluntari\w*|personal|rescatistas?|brigadistas?|medicos?|enfermer\w*|paramedicos?|psicolog\w*|ingenier\w*|manos|gente para (ayudar|cargar|remover))\b/;
const ITEMS=[[/\bagua\b/,'Agua'],[/\b(comida|aliment\w*|mercados?|almuerzos?)\b/,'Alimentos'],[/\b(cobij\w*|ropa|frazadas?)\b/,'Cobijas y ropa'],[/\b(panal\w*|bebes?|leche|formula)\b/,'Insumos para bebés'],
  [/\b(medicament\w*|botiquin\w*|insumos medicos|curaciones|gasas?)\b/,'Insumos médicos'],[/\b(carpas?|albergue|refugio|colchonetas?)\b/,'Albergue'],[/\b(linternas?|plantas? (electricas?|de luz)|baterias?|generador\w*|velas?|camioneta|transporte|transportar)\b/,'Energía y logística'],
  [/\b(mascotas?|perros?|gatos?|concentrado)\b/,'Mascotas'],[/\b(aseo|jabon|papel higienico|toallas)\b/,'Aseo personal'],[/\b(palas?|picos?|guantes|cascos?|herramientas?)\b/,'Rescate y escombros'],
  [/\b(voluntari\w*|personal|manos|rescatistas?|brigadistas?)\b/,'Voluntarios'],[/\b(medicos?|enfermer\w*|paramedicos?)\b/,'Personal de salud'],[/\bpsicolog\w*/,'Apoyo psicológico'],[/\b(ingenier\w*|arquitect\w*)\b/,'Evaluación estructural']];
const PERSONAL_ITEMS=new Set(['Voluntarios','Personal de salud','Apoyo psicológico','Evaluación estructural']);
function clasificar(texto){
  const it=interpretar(texto); const t=norm(texto);
  const items=[...new Set(ITEMS.filter(([r])=>r.test(t)).map(x=>x[1]))];
  const oferta=RE_OFERTA.test(t), personal=items.some(i=>PERSONAL_ITEMS.has(i));
  const emerg=(it.categorias||[]).some(c=>EMERG.has(c));
  let tipo;
  if(emerg && !oferta) tipo='emergencia';
  else if(oferta && items.length) tipo='oferta';
  else if(items.length) tipo='ayuda';
  else if(it.urgencia!=='ninguna') tipo='info';
  else tipo='charla';
  if(tipo==='emergencia' && it.categoria && !EMERG.has(it.categoria)) it.categoria=[...it.categorias].find(c=>EMERG.has(c));
  return {...it,tipo,items,personal};
}
const ROL_NOMBRE=(r)=>(ROLES[r]||{l:r}).l;
function rutasReporte(cat,u){
  const s=new Set(RUTEO_R[cat]||['riesgo']);
  if(u==='rojo'){ ['salud','riesgo','alcaldia','gobernacion'].forEach(x=>s.add(x)); }
  if(u==='naranja'){ ['riesgo','alcaldia'].forEach(x=>s.add(x)); }
  return [...s];
}
const RUTEO_R={atrapados:['bomberos','defensacivil','cruzroja','salud','riesgo'],heridos:['salud','cruzroja','bomberos','riesgo'],colapso:['bomberos','defensacivil','riesgo'],
  estructura:['riesgo','bomberos'],incendio:['bomberos','riesgo','policia'],gas:['bomberos','riesgo'],electrico:['bomberos','riesgo'],necesidades:['riesgo','cruzroja','alcaldia'],via:['movilidad','policia'],info:['riesgo']};
function rutasAyuda(a){
  if(a.tipo==='ofrece') return ['riesgo','cruzroja'];
  const s=new Set(a.personal?['riesgo','defensacivil','cruzroja','alcaldia']:['riesgo','cruzroja','alcaldia','gobernacion']);
  if(a.items.some(i=>['Personal de salud','Apoyo psicológico','Insumos médicos'].includes(i))) s.add('salud');
  return [...s];
}
function crearReporte(texto,loc,autor,ts,interp,extra={}){
  interp=interp||interpretar(texto); if(interp.urgencia==='ninguna') interp={...interp,urgencia:'azul',categoria:interp.categoria||'info'};
  const ub=ubicarBarrio(loc.lat,loc.lon);
  let best=null,bd=1e9;
  for(const r of Object.values(S.data.reportes)){ if(r.ts>ts) continue; const st=estadoReporte(r,ts); if(st.estado==='atendido'||ts-st.last>30*MIN) continue;
    const d=distM(loc,r); if(d<150&&d<bd){ best=r; bd=d; } }
  if(best){ put('reportes',{...best,confirmaciones:[...(best.confirmaciones||[]),{ts,autor,texto,urgencia:interp.urgencia}]}); return {sumado:true,r:best}; }
  const r={id:uid('r_'),ts,autor,texto,interp,urgencia:interp.urgencia,categoria:interp.categoria||'info',lat:loc.lat,lon:loc.lon,label:loc.label,conf:loc.conf||'aprox.',
    barrio:ub&&ub.barrio?ub.barrio:null,barrioAprox:!!(ub&&ub.aprox),comuna:ub?ub.comuna:null,necesidades:extra.necesidades||NEC_SEL.slice(),contacto:extra.contacto||'',mensajeId:extra.mensajeId||null,confirmaciones:[],estados:[{estado:'nuevo',ts,por:autor}]};
  put('reportes',r); return {sumado:false,r};
}
function crearAyuda(c,loc,autor,ts,texto,mensajeId){
  const ub=ubicarBarrio(loc.lat,loc.lon);
  const a={id:uid('a_'),ts,autor,texto,mensajeId,tipo:c.tipo==='oferta'?'ofrece':'necesita',personal:c.personal,items:c.items,lat:loc.lat,lon:loc.lon,label:loc.label,
    barrio:ub&&ub.barrio?ub.barrio:null,barrioAprox:!!(ub&&ub.aprox),comuna:ub?ub.comuna:null,respuestas:[],estados:[{estado:'abierto',ts,por:autor}]};
  put('ayudas',a); return a;
}
// Ejecuta el flujo completo: interpretar → ubicar → crear reporte/punto → notificar
async function procesarMensaje(texto,autor,ts,{osm=true,loc=null,n8n=true}={}){
  const c=clasificar(texto); let cands=geocodificar(texto).candidatos;
  const t0=performance.now();
  if(osm && !loc && !(n8n&&n8nActivo()) && ['emergencia','ayuda','oferta','info'].includes(c.tipo) && parseVias(texto).vias.length){ try{ const r=await conTiempo(geocodificarOSM(texto,cands),9000); if(r&&r.length) cands=r; }catch(e){} }
  let viaN8N=null;
  if(n8n && n8nActivo()){
    const au=usuario(autor)||{};
    try{ const j=await llamarN8N({texto,autor,nombre:au.nombre||autor,rol:au.rol||'ciudadano',ts,barrioPerfil:au.barrio||null,local:{clas:c,candidatos:cands}});
      const TIP=['emergencia','ayuda','oferta','info','charla'];
      if(TIP.includes(j.tipo)) c.tipo=j.tipo; if(URG.includes(j.urgencia)) c.urgencia=j.urgencia; if(j.categoria&&CATS[j.categoria]) c.categoria=j.categoria;
      if(Array.isArray(j.items)) { c.items=j.items; c.personal=!!j.personal; } if(j.resumen) c.resumen=j.resumen; c.fuente='n8n';
      if(j.ubic&&isFinite(j.ubic.lat)&&isFinite(j.ubic.lon)) cands=[{lat:+j.ubic.lat,lon:+j.ubic.lon,label:j.ubic.label||'Ubicación de n8n',conf:j.ubic.conf||'OSM',fuente:j.ubic.fuente},...cands.filter(x=>distM(x,j.ubic)>150)];
      viaN8N={modelo:j.modelo,ms:j.ms,telegram:(j.telegram||{}).enviados||0,errorIA:j.errorIA||null,notificados:Array.isArray(j.notificados)?j.notificados:null};
    }catch(e){ viaN8N={fallo:e.name==='AbortError'?'n8n no respondió a tiempo':e.message}; toast('n8n no respondió: se usó el motor local.'); }
  }
  const u=yo(); if(!loc && !cands.length && u && u.barrio && BARRIO_BY[u.barrio] && autor===SES && c.tipo!=='charla'){ const b=BARRIO_BY[u.barrio]; cands=[{lat:b.lat,lon:b.lon,label:`Barrio del perfil: ${nombreBarrio(b.barrio)} (Comuna ${b.comuna})`,conf:'perfil'}]; }
  let ubic=loc||cands[0]||null;
  if(ubic&&!/^Barrio /.test(ubic.label)){ let best=null,bd=1e9; for(const s of SEMAFOROS){ if(s[4]!=='interseccion') continue; const d=distM(ubic,{lat:s[5],lon:s[6]}); if(d<bd){ bd=d; best=s; } }
    if(best&&bd<60) ubic={...ubic,semaforo:{id:best[0],dir:best[1],comuna:best[2],dist:Math.round(bd)}}; }
  const m={id:uid('m_'),ts,autor,texto,clas:c,ubic,alternativas:loc?[]:cands.slice(1,3),reporteId:null,ayudaId:null,notif:[],ms:0,motor:viaN8N&&!viaN8N.fallo?'n8n':'local',n8n:viaN8N};
  if(ubic){
    if(c.tipo==='emergencia'||c.tipo==='info'){ const res=crearReporte(texto,ubic,autor,ts,c,{necesidades:c.items,mensajeId:m.id}); m.reporteId=res.r.id; m.sumado=res.sumado; m.notif=rutasReporte(res.r.categoria,c.urgencia);
      if(c.tipo==='emergencia'){ const ob=barrioOficial(ubic.lat,ubic.lon); if(ob) m.zona={k:ob.k,n:ob.n,com:+ob.com,s:ob.s?{n:ob.s.n,esc:ob.s.est[0],techo:ob.s.est[1],pct:ob.s.pct_escombros}:null,f:ob.f}; const eb=estacionCercana(ubic); m.bomb={id:eb.b.id,barrio:eb.b.barrio,d:Math.round(eb.d)}; m.salud=contextoSalud(ubic,res.r.categoria); if(m.salud&&m.salud.afectado&&!m.notif.includes('salud')) m.notif.push('salud'); } }
    else if(c.tipo==='ayuda'||c.tipo==='oferta'){ const a=crearAyuda(c,ubic,autor,ts,texto,m.id); m.ayudaId=a.id; m.notif=rutasAyuda(a); }
  }
  if(viaN8N&&viaN8N.notificados&&m.notif.length) m.notif=[...new Set([...viaN8N.notificados,...m.notif])];
  m.ms=Math.round(performance.now()-t0);
  put('mensajes',m); return m;
}
async function ubicarMensaje(mid,loc){
  const m=S.data.mensajes[mid]; if(!m) return; const nm={...m,ubic:loc,alternativas:[]};
  const r=m.reporteId&&S.data.reportes[m.reporteId], a=m.ayudaId&&S.data.ayudas[m.ayudaId];
  const ub=ubicarBarrio(loc.lat,loc.lon); const geo={lat:loc.lat,lon:loc.lon,label:loc.label,barrio:ub&&ub.barrio?ub.barrio:null,barrioAprox:!!(ub&&ub.aprox),comuna:ub?ub.comuna:null};
  if(r && r.mensajeId===m.id) put('reportes',{...r,...geo,conf:'confirmada'});
  else if(a) put('ayudas',{...a,...geo});
  else if(m.clas.tipo==='emergencia'||m.clas.tipo==='info'){ const res=crearReporte(m.texto,loc,m.autor,m.ts,m.clas,{necesidades:m.clas.items,mensajeId:m.id}); nm.reporteId=res.r.id; nm.notif=rutasReporte(res.r.categoria,m.clas.urgencia); }
  else if(m.clas.tipo==='ayuda'||m.clas.tipo==='oferta'){ const na=crearAyuda(m.clas,loc,m.autor,m.ts,m.texto,m.id); nm.ayudaId=na.id; nm.notif=rutasAyuda(na); }
  put('mensajes',nm);
}

// ---------- Reporte desde el formulario ----------
const NECESIDADES=['Rescate y escombros','Primeros auxilios','Insumos médicos','Agua','Alimentos','Albergue','Cobijas y ropa','Insumos para bebés','Aseo personal','Mascotas','Energía y logística','Voluntarios'];
let NEC_SEL=[];
function renderNec(){ $('#necOpts').innerHTML=NECESIDADES.map(n=>`<label class="chip" style="cursor:pointer;${NEC_SEL.includes(n)?'background:#dbeefa;border-color:#2ea3d6':''}"><input type="checkbox" data-nec="${esc(n)}" ${NEC_SEL.includes(n)?'checked':''} style="display:none">${esc(n)}</label>`).join(''); }
document.addEventListener('change',e=>{ const n=e.target.dataset&&e.target.dataset.nec; if(n===undefined) return; NEC_SEL=e.target.checked?[...NEC_SEL,n]:NEC_SEL.filter(x=>x!==n); renderNec(); });
let PREV={cands:[],sel:0,pick:null}, OSM_ST='', OSM_REQ=0;
function opcionesUbicacion(){ const u=yo(); const out=PREV.cands.map(c=>({...c})); if(PREV.pick) out.unshift({...PREV.pick});
  if(u&&u.barrio&&BARRIO_BY[u.barrio]){ const b=BARRIO_BY[u.barrio]; out.push({lat:b.lat,lon:b.lon,label:`Mi barrio: ${nombreBarrio(b.barrio)} (Comuna ${b.comuna})`,conf:'barrio'}); } return out; }
function renderPreview(solo){
  const t=$('#rTxt').value; const it=t.trim()?interpretar(t):null;
  if(!solo){ OSM_ST=''; PREV.cands=t.trim()?geocodificar(t).candidatos:[]; }
  $('#preview').innerHTML=it&&it.urgencia!=='ninguna'?`<div class="row" style="margin-bottom:8px"><span class="chip u" style="background:${URG_COLOR[it.urgencia]}">${URG_LABEL[it.urgencia]}</span><span class="chip">${esc(CATS[it.categoria]?.label||'')}</span>${it.hits.length?`<span class="chip">🔎 ${esc(it.hits.slice(0,4).join(', '))}</span>`:''}</div>`:(t.trim()?'<div class="ex" style="margin-bottom:8px">No se detectó una emergencia: se registrará como informativo.</div>':'');
  const ops=opcionesUbicacion(); if(PREV.sel>=ops.length) PREV.sel=0;
  $('#locOpts').innerHTML=(OSM_ST?`<div class="ex" style="margin-bottom:4px">${OSM_ST}</div>`:'')+ops.map((o,i)=>`<label class="opt"><input type="radio" name="loc" value="${i}"${i===PREV.sel?' checked':''}> <span>📍 ${esc(o.label)}${['media','baja'].includes(o.conf)?' <span class="ex">(revisar)</span>':''}</span></label>`).join('')
    +`<button class="btn sec sm" id="bPick" type="button">Marcar en el mapa</button>${!ops.length?' <span class="ex">Escribe una dirección o un barrio, o márcalo en el mapa.</span>':''}`;
  $('#bPick').onclick=()=>startPick({form:true});
}
async function refinarOSM(){ const t=$('#rTxt').value; if(!t.trim()||!parseVias(t).vias.length) return; const id=++OSM_REQ; OSM_ST='🔎 Buscando el cruce en OpenStreetMap…'; renderPreview(true);
  let c=null; try{ c=await geocodificarOSM(t,geocodificar(t).candidatos); }catch(e){} if(id!==OSM_REQ||$('#rTxt').value!==t) return;
  if(c&&c.some(x=>x.conf==='OSM')){ PREV.cands=c; OSM_ST='✅ Cruce encontrado en OpenStreetMap'; } else OSM_ST='Se usa la ubicación calculada con las intersecciones semaforizadas de Cali.'; PREV.sel=0; renderPreview(true); }
let PT=null,PT2=null; $('#rTxt').addEventListener('input',()=>{ clearTimeout(PT); PT=setTimeout(()=>{ PREV.sel=0; renderPreview(); clearTimeout(PT2); PT2=setTimeout(refinarOSM,700); },250); });
$('#locOpts').addEventListener('change',e=>{ if(e.target.name==='loc') PREV.sel=+e.target.value; });
$('#rSend').onclick=()=>{
  const t=$('#rTxt').value.trim(); if(!t){ $('#rMsg').textContent='Escribe qué pasa.'; return; }
  const loc=opcionesUbicacion()[PREV.sel]; if(!loc){ $('#rMsg').textContent='Falta la ubicación.'; return; }
  const res=crearReporte(t,loc,SES,tsNuevo(),null,{contacto:$('#rCont').value.trim()});
  $('#rTxt').value=''; $('#rCont').value=''; NEC_SEL=[]; renderNec(); PREV={cands:[],sel:0,pick:null}; renderPreview();
  $('#rMsg').textContent=(res.sumado?'Se sumó a un reporte cercano abierto · ':'Reporte registrado · ')+fmtD(res.r.ts); verReporte(res.r.id);
};
function cambiarEstado(rid,estado){ const r=S.data.reportes[rid]; const u=yo(); if(!r||!isInst(u)) return; put('reportes',{...r,estados:[...(r.estados||[]),{estado,ts:tsNuevo(),por:u.email}]}); toast(`Reporte marcado «${estado}».`); }
function confirmar(rid){ const r=S.data.reportes[rid]; if(!r) return; if(r.autor===SES||(r.confirmaciones||[]).some(c=>c.autor===SES)){ toast('Ya habías reportado este caso.'); return; }
  put('reportes',{...r,confirmaciones:[...(r.confirmaciones||[]),{ts:tsNuevo(),autor:SES,texto:'Confirmo que sigue la situación.'}]}); toast('Gracias, se sumó tu confirmación.'); }
function responderAyuda(aid){ const a=S.data.ayudas[aid]; if(!a) return; if(a.autor===SES||(a.respuestas||[]).some(r=>r.autor===SES)){ toast('Ya respondiste a este punto.'); return; }
  put('ayudas',{...a,respuestas:[...(a.respuestas||[]),{ts:tsNuevo(),autor:SES}]}); toast(a.tipo==='ofrece'?'Se avisó a quien ofrece la ayuda.':'Se avisó a quien pidió la ayuda.'); }
function cubrirAyuda(aid){ const a=S.data.ayudas[aid]; const u=yo(); if(!a||!(isInst(u)||a.autor===SES)) return; put('ayudas',{...a,estados:[...(a.estados||[]),{estado:'cubierto',ts:tsNuevo(),por:SES}]}); toast('Punto marcado como cubierto.'); }

// ---------- Notificaciones (derivadas del flujo) ----------
function notificaciones(T){
  const out=[]; const lbl=(c)=>(CATS[c]||{label:'Reporte'}).label;
  for(const m of Object.values(S.data.mensajes)){ if(m.ts>T||!enVentana(m.ts)||!m.notif||!m.notif.length) continue;
    const c=m.clas; const a=usuario(m.autor);
    if(c.tipo==='emergencia'||c.tipo==='info') out.push({id:'nm_'+m.id,ts:m.ts,roles:m.notif,u:c.urgencia,titulo:`${m.sumado?'Confirmación de reporte':'Nuevo reporte'} · ${URG_LABEL[c.urgencia]}`,cuerpo:`${lbl(c.categoria)} en ${m.ubic.label}. «${m.texto}» — ${a?a.nombre:m.autor}${m.bomb?` · Estación de bomberos más cercana: ${m.bomb.id} ${m.bomb.barrio} (${fmtDist(m.bomb.d)})`:''}${m.salud?` · Hospital más cercano: ${m.salud.hospital.n} (${fmtDist(m.salud.hospital.d)})`:''}${m.salud&&m.salud.afectado?` · ⚠ Equipamiento de salud cercano: ${m.salud.afectado.n}`:''}`,rid:m.reporteId});
    else out.push({id:'nm_'+m.id,ts:m.ts,roles:m.notif,u:c.tipo==='oferta'?'atendido':'amarillo',titulo:c.tipo==='oferta'?'Ofrecimiento de ayuda solidaria':(c.personal?'Se necesita personal':'Se necesitan insumos'),cuerpo:`${c.items.join(', ')} · ${m.ubic.label}. «${m.texto}»`,aid:m.ayudaId});
  }
  for(const r of Object.values(S.data.reportes)){ if(r.ts>T||!enVentana(r.ts)) continue; const st=estadoReporte(r,T);
    const afect=[...new Set([r.autor,...st.conf.map(c=>c.autor)])];
    if(!r.mensajeId) out.push({id:'nr_'+r.id,ts:r.ts,roles:rutasReporte(r.categoria,r.urgencia),u:r.urgencia,titulo:`Nuevo reporte · ${URG_LABEL[r.urgencia]}`,cuerpo:`${lbl(r.categoria)} en ${r.label}`,rid:r.id});
    for(const e of (r.estados||[]).slice(1)) if(e.ts<=T) out.push({id:'ne_'+r.id+e.ts,ts:e.ts,emails:afect,roles:[],u:e.estado==='atendido'?'atendido':st.u,titulo:`Tu reporte está «${e.estado}»`,cuerpo:`${ROL_NOMBRE(usuario(e.por)?.rol)} · ${r.label}`,rid:r.id});
    if(r.urgencia==='rojo'){ const lim=r.ts+30*MIN, f=(r.estados||[]).find(e=>e.estado!=='nuevo'); if(lim<=T&&(!f||f.ts>lim)) out.push({id:'nx_'+r.id,ts:lim,roles:['alcaldia','gobernacion','riesgo','salud'],u:'rojo',titulo:'ESCALAMIENTO: crítico sin atención 30 min',cuerpo:`${lbl(r.categoria)} en ${r.label}`,rid:r.id}); }
  }
  for(const a of Object.values(S.data.ayudas)){ if(a.ts>T||!enVentana(a.ts)) continue; const st=estadoAyuda(a,T);
    for(const r of st.resp) out.push({id:'na_'+a.id+r.ts,ts:r.ts,emails:[a.autor],roles:[],u:'atendido',titulo:a.tipo==='ofrece'?'Alguien quiere tu ayuda ofrecida':'Alguien responde a tu solicitud',cuerpo:`${(usuario(r.autor)||{nombre:r.autor}).nombre} puede apoyar · ${a.items.join(', ')}`,aid:a.id});
    if(a.tipo==='ofrece'){ const cerca=Object.values(S.data.ayudas).filter(b=>b.tipo==='necesita'&&b.ts<=a.ts&&distM(a,b)<3000&&b.items.some(i=>a.items.includes(i))&&estadoAyuda(b,a.ts).estado==='abierto');
      if(cerca.length) out.push({id:'nc_'+a.id,ts:a.ts,emails:[...new Set(cerca.map(b=>b.autor))],roles:[],u:'atendido',titulo:'Hay una oferta de ayuda cerca de tu solicitud',cuerpo:`${a.items.join(', ')} · ${a.label}`,aid:a.id}); }
  }
  for(const r of Object.values(S.data.semaforos||{})){ if(r.ts>T||!enVentana(r.ts)) continue; const a=usuario(r.autor);
    out.push({id:'ns_'+r.id,ts:r.ts,roles:['movilidad'],u:'naranja',titulo:`🚦 Semáforo dañado · #${r.sid}`,cuerpo:`${r.dir} (Comuna ${r.comuna}) · ${r.tipo}${r.nota?` — «${r.nota}»`:''} · reportado por ${a?a.nombre:r.autor} a las ${fmtH(r.ts)}`,sid:r.sid});
    for(const e of (r.estados||[])) if(e.ts<=T) out.push({id:'nsr_'+r.id+e.ts,ts:e.ts,emails:[r.autor],roles:[],u:'atendido',titulo:`🚦 Semáforo #${r.sid} reparado`,cuerpo:`${r.dir} · ${ROL_NOMBRE((usuario(e.por)||{}).rol)}`,sid:r.sid}); }
  return out.sort((x,y)=>y.ts-x.ts);
}
function misNotif(T){ const u=yo(); if(!u) return []; return notificaciones(T).filter(n=>(n.roles||[]).includes(u.rol)||(n.emails||[]).includes(u.email)); }
let SEEN=null;
function checkToasts(){ const T=nowT(); const mine=misNotif(T); const ids=new Set(mine.map(n=>n.id));
  if(SEEN) for(const n of mine) if(!SEEN.has(n.id)&&T-n.ts<20*MIN) toast(`<b>🔔 ${esc(n.titulo)}</b><br>${esc(n.cuerpo.slice(0,140))}`,URG_COLOR[n.u]);
  SEEN=ids; }
const seenKey=()=>'colaire_seen_'+MODO;
function lastSeen(){ return (lsGet(seenKey(),{})[SES])||0; }
function renderBadge(){ const n=misNotif(nowT()).filter(x=>x.ts>lastSeen()).length; $('#nbadge').innerHTML=n?`<span class="badge">${n}</span>`:''; }
function renderNotif(){
  const u=yo(); if(!u) return; $('#nwho').textContent=`${u.nombre} (${ROL_NOMBRE(u.rol)})`;
  const ls=lastSeen(); const list=misNotif(nowT());
  $('#nlist').innerHTML=list.length?list.map(n=>`<div class="rep${n.ts>ls?' new':''}" style="border-left-color:${URG_COLOR[n.u]||'#0b4f78'}"><div class="top"><b>${esc(n.titulo)}</b></div><div class="txt">${esc(n.cuerpo)}</div><div class="meta">${esc(fmtD(n.ts))} · ${hace(nowT()-n.ts)}</div><div class="row">${n.rid?`<button class="btn sec sm" data-act="ver" data-rid="${n.rid}">Ver en el mapa</button>`:''}${n.aid?`<button class="btn sec sm" data-act="verA" data-aid="${n.aid}">Ver en el mapa</button>`:''}${n.sid?`<button class="btn sec sm" data-act="verSem" data-sid="${n.sid}">Ver semáforo</button>`:''}</div></div>`).join('')
    :`<div class="empty">Sin notificaciones${isInst(u)?' para esta entidad todavía. Pulsa ▶ Play en el mapa para correr la simulación.':'.'}</div>`;
}
$('#markread').onclick=()=>{ const s=lsGet(seenKey(),{}); s[SES]=nowT(); lsSet(seenKey(),s); renderNotif(); renderBadge(); };
function toast(h,color){ const d=document.createElement('div'); d.className='toast'; if(color) d.style.borderLeftColor=color; d.innerHTML=h; $('#toasts').appendChild(d); while($('#toasts').children.length>4) $('#toasts').firstChild.remove(); setTimeout(()=>d.remove(),6000); }


// ---------- Equipamientos de salud (POT Cali, IDESC) ----------
const SG={
  hospital:{l:'Hospital o clínica con hospitalización',c:'#dc2626',s:26,svg:'<rect x="2" y="2" width="20" height="20" rx="5" fill="#dc2626"/><path d="M8 7v10M16 7v10M8 12h8" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>'},
  centro_salud:{l:'Centro o puesto de salud (red pública)',c:'#059669',s:22,svg:'<circle cx="12" cy="12" r="10" fill="#059669"/><path d="M12 6.5v11M6.5 12h11" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>'},
  ips:{l:'IPS / EPS',c:'#2563eb',s:24,svg:'<rect x="1" y="5" width="22" height="14" rx="4" fill="#2563eb"/><text x="12" y="15.4" text-anchor="middle" font-family="Inter,Arial" font-size="8.5" font-weight="800" fill="#fff">IPS</text>'},
  clinica:{l:'Clínica especializada o temática',c:'#7c3aed',s:22,svg:'<circle cx="12" cy="12" r="10" fill="#7c3aed"/><path d="M5 12.5h3.2l1.6-3.5 2.6 7 1.8-4.2H19" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'},
  consultorio:{l:'Centro médico o consultorio',c:'#0e7490',s:17,svg:'<circle cx="12" cy="12" r="10" fill="#0e7490"/><path d="M12 7.5v9M7.5 12h9" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>'},
  laboratorio:{l:'Laboratorio',c:'#475569',s:18,svg:'<circle cx="12" cy="12" r="10" fill="#475569"/><path d="M10 6h4M10.6 6v4.5L7 17h10l-3.6-6.5V6" stroke="#fff" stroke-width="1.8" fill="none" stroke-linejoin="round"/>'},
  cruzroja:{l:'Cruz Roja',c:'#dc2626',s:24,svg:'<circle cx="12" cy="12" r="10" fill="#fff" stroke="#dc2626" stroke-width="2"/><path d="M12 6.5v11M6.5 12h11" stroke="#dc2626" stroke-width="3.6"/>'},
  otro:{l:'Otro (sanidad, fundaciones, ópticas…)',c:'#94a3b8',s:16,svg:'<circle cx="12" cy="12" r="9" fill="#94a3b8"/><circle cx="12" cy="12" r="3" fill="#fff"/>'},
};
const SALUD_O=SALUD.map(([n,dir,tipo,cat,nivel,prop,esc,g,lat,lon,area,poly],i)=>({i,n,dir,tipo,cat,nivel,prop,esc,g,lat,lon,area,poly}));
const SAL_ON=new Set(lsGet('colaire_salud_on',['hospital','centro_salud','ips','clinica','cruzroja']));
const svgIcon=(g,big)=>{ const k=SG[g]; const s=big?k.s+6:k.s; return L.divIcon({className:'sicon',html:`<svg width="${s}" height="${s}" viewBox="0 0 24 24">${k.svg}</svg>`,iconSize:[s,s],iconAnchor:[s/2,s/2],popupAnchor:[0,-s/2]}); };
function cercanos(p,grupo,n=1){ return SALUD_O.filter(s=>!grupo||grupo.includes(s.g)).map(s=>({s,d:distM(p,s)})).sort((a,b)=>a.d-b.d).slice(0,n); }
const fmtDist=(m)=>m<1000?`${Math.round(m/10)*10} m`:`${(m/1000).toFixed(1)} km`;
function saludPopup(s){ const T=nowT(); const cerca=visibles('reportes').filter(r=>distM(r,s)<300&&estadoReporte(r,T).estado!=='atendido');
  const niv={'1':'Baja complejidad (nivel 1)','2':'Mediana complejidad (nivel 2)','3':'Alta complejidad (nivel 3)'}[s.nivel]||'—';
  return `<div><div class="row" style="gap:8px;align-items:center"><svg width="26" height="26" viewBox="0 0 24 24">${SG[s.g].svg}</svg><b style="font-size:13.5px">${esc(s.n)}</b></div>
  <div class="ex" style="margin:4px 0">${esc(SG[s.g].l)}</div>
  <div class="kv" style="font-size:12px"><b>Tipo</b><span>${esc(s.tipo)}</span><b>Dirección</b><span>${esc(s.dir||'—')}</span><b>Complejidad</b><span>${niv}</span><b>Carácter</b><span>${s.prop==='PUB'?'Público':s.prop==='PRIV'?'Privado':'—'}</span><b>Escala</b><span>${esc(s.esc||'—')}</span><b>Área del predio</b><span>${s.area.toLocaleString('es-CO')} m²</span></div>
  ${cerca.length?`<div class="warn" style="margin-top:6px">⚠ ${cerca.length} reporte(s) abiertos a menos de 300 m: puede estar afectado o recibir pacientes.</div>`:''}
  <div class="ex" style="margin-top:6px">Fuente: equipamientos de salud, POT Cali (IDESC). Verificar funcionamiento tras el sismo.</div></div>`; }
function initSalud(){
  if(!map) return;
  LG.salud=L.layerGroup(); LG.saludPoly=L.layerGroup(); LG.saludMk={};
  for(const s of SALUD_O){
    const mk=L.marker([s.lat,s.lon],{icon:svgIcon(s.g,s.g==='hospital'&&s.nivel==='3'),riseOnHover:true}).bindTooltip(`${esc(s.n)}`,{direction:'top',offset:[0,-10]}).bindPopup(()=>saludPopup(s),{maxWidth:300});
    mk._s=s; LG.saludMk[s.i]=mk;
    const pl=L.polygon(s.poly.map(r=>r.map(([x,y])=>[y,x])),{color:SG[s.g].c,weight:1.5,fillColor:SG[s.g].c,fillOpacity:.25}).bindTooltip(esc(s.n),{sticky:true}).bindPopup(()=>saludPopup(s),{maxWidth:300}); pl._s=s;
    LG.saludPoly.addLayer(pl);
  }
  const box=$('#saludTipos'); const cnt={}; for(const s of SALUD_O) cnt[s.g]=(cnt[s.g]||0)+1;
  box.innerHTML=Object.entries(SG).map(([g,k])=>`<label class="sub"><input type="checkbox" data-sg="${g}" ${SAL_ON.has(g)?'checked':''}><svg width="16" height="16" viewBox="0 0 24 24">${k.svg}</svg> ${esc(k.l)} <span class="ex">${cnt[g]||0}</span></label>`).join('');
  box.addEventListener('change',e=>{ const g=e.target.dataset.sg; if(!g) return; e.target.checked?SAL_ON.add(g):SAL_ON.delete(g); lsSet('colaire_salud_on',[...SAL_ON]); renderSalud(); });
  $('#L-sal').onchange=e=>{ $('#saludTipos').style.display=e.target.checked?'':'none'; renderSalud(); contarCapas(); };
  map.on('zoomend',renderSalud); renderSalud();
}
function renderSalud(){
  if(!map||!LG.salud) return; const on=$('#L-sal').checked; const z=map.getZoom();
  LG.salud.clearLayers(); LG.saludPoly.eachLayer(()=>{});
  if(!on){ map.removeLayer(LG.salud); map.removeLayer(LG.saludPoly); return; }
  map.addLayer(LG.salud);
  for(const s of SALUD_O){ if(!SAL_ON.has(s.g)) continue; if(z<13.5 && !['hospital','centro_salud','cruzroja'].includes(s.g)) continue; LG.salud.addLayer(LG.saludMk[s.i]); }
  if(z>=15.5){ map.addLayer(LG.saludPoly); LG.saludPoly.eachLayer(l=>l.setStyle({opacity:SAL_ON.has(l._s.g)?1:0,fillOpacity:SAL_ON.has(l._s.g)?.25:0,interactive:SAL_ON.has(l._s.g)})); } else map.removeLayer(LG.saludPoly);
  $('#saludZoom').style.display=z<13.5?'':'none';
}
// Contexto de salud para el flujo de emergencias
function contextoSalud(ubic,cat){
  if(!ubic) return null;
  const h=cercanos(ubic,['hospital'],1)[0], c=cercanos(ubic,['centro_salud'],1)[0];
  const ctx={hospital:{n:h.s.n,d:Math.round(h.d),i:h.s.i,nivel:h.s.nivel},centro:{n:c.s.n,d:Math.round(c.d),i:c.s.i}};
  if(['colapso','estructura','incendio','gas','electrico','atrapados'].includes(cat)){ const af=cercanos(ubic,null,1)[0]; if(af&&af.d<150) ctx.afectado={n:af.s.n,d:Math.round(af.d),i:af.s.i,g:af.s.g}; }
  return ctx;
}


// ---------- Estaciones de Bomberos Voluntarios de Cali (bomberoscali.org) ----------
const BOMB_O=BOMBEROS.map(([id,nom,dir,barrio,lat,lon,prec,nota])=>({id,nom,dir,barrio,lat,lon,prec,nota}));
function estacionCercana(p){ return BOMB_O.filter(b=>b.prec==='exacta').map(b=>({b,d:distM(p,b)})).sort((x,y)=>x.d-y.d)[0]; }
function bomberoPopup(b){ const T=nowT(); const cerca=visibles('reportes').filter(r=>estadoReporte(r,T).estado!=='atendido'&&estacionCercana(r).b.id===b.id&&ULEV[estadoReporte(r,T).u]>=3);
  return `<div><div class="row" style="gap:10px;align-items:center;flex-wrap:nowrap"><img src="${BOMBEROS_LOGO}" width="56" height="56" alt="Bomberos Voluntarios de Cali" style="border-radius:50%;flex:none"><div><b style="font-size:14px">Estación ${esc(b.id)}</b><div style="font-size:12.5px">${esc(b.nom)}</div><div class="ex">Bomberos Voluntarios de Cali</div></div></div>
  <div class="kv" style="font-size:12px;margin-top:8px"><b>Dirección</b><span>${esc(b.dir)}</span><b>Barrio</b><span>${esc(b.barrio)}</span><b>Ubicación</b><span>${b.prec==='exacta'?'Pin oficial (Google Maps)':'Aproximada'}</span></div>
  ${b.nota?`<div class="ex" style="margin-top:4px">${esc(b.nota)}</div>`:''}
  ${cerca.length?`<div class="warn" style="margin-top:6px">🔥 ${cerca.length} emergencia(s) críticas o altas abiertas en su zona de cobertura más cercana.</div>`:''}
  <div class="row" style="margin-top:8px"><a class="btn sec sm" href="https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lon}" target="_blank" rel="noopener">Cómo llegar ↗</a></div>
  <div class="ex" style="margin-top:6px">Fuente: bomberoscali.org/infraestructura</div></div>`; }
function initBomberos(){
  if(!map) return;
  const icon=(b)=>L.divIcon({className:'bicon',html:`<div class="bwrap${b.prec!=='exacta'?' aprox':''}"><img src="${BOMBEROS_LOGO}" alt="Bomberos Voluntarios de Cali"></div>`,iconSize:[38,38],iconAnchor:[19,19],popupAnchor:[0,-18]});
  LG.bomb=L.layerGroup(BOMB_O.map(b=>L.marker([b.lat,b.lon],{icon:icon(b),zIndexOffset:900,riseOnHover:true}).bindTooltip(`Bomberos · Estación ${b.id} · ${b.barrio}`,{direction:'top',offset:[0,-20]}).bindPopup(()=>bomberoPopup(b),{maxWidth:300})));
  if($('#L-bomb').checked) map.addLayer(LG.bomb);
  $('#L-bomb').onchange=e=>{ e.target.checked?map.addLayer(LG.bomb):map.removeLayer(LG.bomb); contarCapas(); };
}


// ---------- Capas oficiales: comunas, barrios, edificaciones y fallas ----------
const EST_COL=['#b91c1c','#f97316','#94a3b8','#ffffff'], EST_CORTO=['Alta probabilidad de escombros','Posible desaparición de techo','Sin cambio aparente / daño interno','Sin datos satelitales'];
const fmtN=(n)=>(n??0).toLocaleString('es-CO');
const CODIGOS_CON_DATOS=new Set((typeof CAPA_COMUNAS!=='undefined'?CAPA_COMUNAS:[]).filter(c=>c.s).map(c=>+c.k));
function nivelFalla(f){ if(!f) return null; if(f.cruza.length||f.dist<300) return {t:'Alta',c:'#b91c1c',bg:'#fef2f2'}; if(f.dist<1000) return {t:'Media',c:'#c2410c',bg:'#fff7ed'}; return {t:'Baja',c:'#15803d',bg:'#f0fdf4'}; }
function poblacionDe(tipo,k){ const P=tipo==='barrio'?globalThis.POB_BARRIOS:globalThis.POB_COMUNAS; return P&&P[k]?P[k]:null; }
let INFO=null, ORDEN_CAPAS=()=>{};
function infoHtml(tipo,o){
  const s=o.s, f=o.f, nv=nivelFalla(f), T=nowT();
  const head=`<div class="ihead"><span class="itag">${tipo==='barrio'?(o.cat==='Sector'?'Sector':'Barrio'):'Comuna'}</span><button class="x" data-close-info aria-label="Cerrar">×</button></div>
    <h3>${esc(o.n)}</h3><div class="ex">${tipo==='barrio'?`<a href="#" data-act="infoC" data-k="${o.com}">Comuna ${+o.com}</a> · `:''}${(o.area/1e6).toLocaleString('es-CO',{maximumFractionDigits:2})} km²${tipo==='barrio'&&o.mapa?` · <a href="${esc(o.mapa)}" target="_blank" rel="noopener">Mapa oficial ↗</a>`:''}</div>`;
  let dano;
  if(s){ const ev=s.n-s.est[3];
    dano=`<div class="isec"><h4>🏚 Daños estructurales <span class="ex">(análisis satelital)</span></h4>
      <div class="big">${fmtN(s.n)} <span>edificaciones evaluadas</span></div>
      <div class="sbar">${s.est.map((v,i)=>v?`<span style="flex:${v};background:${EST_COL[i]}" title="${EST_CORTO[i]}: ${v}"></span>`:'').join('')}</div>
      ${s.est.map((v,i)=>`<div class="srow"><span class="sw" style="background:${EST_COL[i]}"></span><span class="sl">${EST_CORTO[i]}</span><b>${fmtN(v)}</b><span class="ex">${s.n?Math.round(100*v/s.n):0}%</span></div>`).join('')}
      <div class="kpis"><div><b style="color:#b91c1c">${s.pct_escombros??'—'}%</b><span>probabilidad de escombros<br>(alta prob. sobre ${fmtN(ev)} con datos)</span></div>
        <div><b>${s.idx_prom??'—'}</b><span>índice de escombros promedio<br>(máx. ${s.idx_max??'—'})</span></div>
        <div><b>${fmtN(s.altos_af)}</b><span>edificios de 4+ pisos<br>con escombros o sin techo</span></div>
        <div><b>${s.pisos_prom??'—'}</b><span>pisos en promedio</span></div></div></div>`; }
  else dano=`<div class="isec"><h4>🏚 Daños estructurales</h4><div class="ex">No hay edificaciones evaluadas en ${tipo==='barrio'?'este barrio':'esta comuna'}. El análisis satelital del hackatón cubre 52 barrios de las comunas ${[...CODIGOS_CON_DATOS].sort((a,b)=>a-b).join(', ')}.</div></div>`;
  const P=poblacionDe(tipo,o.k);
  const pob=P?`<div class="isec"><h4>👥 Población y vivienda</h4><div class="kpis">
      <div><b>${fmtN(P.viviendas)}</b><span>viviendas</span></div><div><b>${fmtN(P.total)}</b><span>personas</span></div>
      <div><b>${fmtN(P.hombres)}</b><span>hombres</span></div><div><b>${fmtN(P.mujeres)}</b><span>mujeres</span></div></div>
      <div class="vuln"><b>Población vulnerable: ${fmtN((P.v_1_18||0)+(P.v_60||0))}</b>${P.total?` <span class="ex">(${Math.round(100*((P.v_1_18||0)+(P.v_60||0))/P.total)}%)</span>`:''}<div class="ex">${fmtN(P.v_1_18)} de 1 a 18 años · ${fmtN(P.v_60)} de 60 años o más</div></div></div>`
    :`<div class="isec"><h4>👥 Población y vivienda</h4><div class="ex">Pendiente: se cargará con los archivos de población por barrio y comuna (viviendas, sexo y población vulnerable).</div></div>`;
  const fal=f?`<div class="isec"><h4>〰 Fallas geológicas</h4><div class="risk" style="background:${nv.bg};color:${nv.c}">Proximidad a fallas: <b>${nv.t}</b></div>
      ${f.cruza.length?`<div style="font-size:12.5px;margin-top:4px">⚠ Lo atraviesa: <b>${esc(f.cruza.join(', '))}</b></div>`:''}
      <div class="ex" style="margin-top:3px">Falla más cercana al centro: ${esc(f.falla)} a ${fmtDist(f.dist)}. Indicador de cercanía, no un estudio de amenaza sísmica.</div></div>`:'';
  const dentro=(x)=>tipo==='barrio'?enCapa(x.lat,x.lon,o):enCapa(x.lat,x.lon,o);
  const reps=visibles('reportes').filter(dentro).map(r=>estadoReporte(r,T)).filter(st=>st.estado!=='atendido');
  const ays=visibles('ayudas').filter(dentro).filter(x=>estadoAyuda(x,T).estado!=='cubierto');
  const cnt=['rojo','naranja','amarillo','azul'].map(u=>[u,reps.filter(r=>r.u===u).length]).filter(x=>x[1]);
  const rep=`<div class="isec"><h4>💬 Reportes ciudadanos abiertos</h4>${reps.length||ays.length?`<div class="row" style="gap:5px">${cnt.map(([u,n])=>`<span class="chip u" style="background:${URG_COLOR[u]}">${n} ${URG_LABEL[u].toLowerCase()}</span>`).join('')}${ays.length?`<span class="chip">🤝 ${ays.length} ayuda solidaria</span>`:''}</div>`:'<div class="ex">Sin reportes abiertos a esta hora.</div>'}</div>`;
  let extra='';
  if(tipo==='comuna'){ const top=CAPA_BARRIOS.filter(b=>+b.com===+o.k&&b.s).sort((x,y)=>y.s.est[0]-x.s.est[0]).slice(0,5);
    if(top.length) extra=`<div class="isec"><h4>Barrios con más edificaciones con escombros</h4>${top.map(b=>`<a href="#" class="tb" data-act="infoB" data-k="${b.k}"><span>${esc(b.n)}</span><b>${b.s.est[0]}</b></a>`).join('')}</div>`; }
  return head+dano+pob+fal+rep+extra+`<div class="ex" style="margin-top:6px">Fuentes: límites IDESC (Acuerdo 0636 de 2026) · datos prediales satelitales del hackatón · fallas IDESC.</div>`;
}
function abrirInfo(tipo,o){ INFO={tipo,k:o.k}; cerrarPops(); const p=$('#infoPanel'); p.innerHTML=infoHtml(tipo,o); p.classList.add('open'); p.scrollTop=0; resaltar(); }
function cerrarInfo(){ INFO=null; $('#infoPanel').classList.remove('open'); resaltar(); }
function refrescarInfo(){ if(!INFO) return; const o=(INFO.tipo==='barrio'?CAPA_BARRIOS:CAPA_COMUNAS).find(x=>x.k===INFO.k); if(o){ const st=$('#infoPanel').scrollTop; $('#infoPanel').innerHTML=infoHtml(INFO.tipo,o); $('#infoPanel').scrollTop=st; } }
function resaltar(){ if(!LG.barO) return;
  LG.barO.eachLayer(l=>l.setStyle(INFO&&INFO.tipo==='barrio'&&l._o.k===INFO.k?{...estiloBarrio(l._o),color:'#ffffff',weight:4,opacity:1,fillOpacity:.6}:estiloBarrio(l._o)));
  LG.comO.eachLayer(l=>l.setStyle(INFO&&INFO.tipo==='comuna'&&l._o.k===INFO.k?{...estiloComuna(l._o),color:'#ffffff',weight:4.5,opacity:1,fillOpacity:.55}:estiloComuna(l._o))); }
const HUE_COM=(k)=>Math.round(((+k-1)*137.508)%360);
const hsl=(h,s,l)=>`hsl(${h},${s}%,${l}%)`;
function colorBarrio(o){ if(o._col) return o._col; const h=HUE_COM(o.com); const i=parseInt(String(o.k).slice(-2),10)||0; const dh=((i*47)%31)-15, dl=[0,8,-6,12,-10,4][i%6];
  o._col={f:hsl((h+dh+360)%360,72,Math.max(30,Math.min(68,50+dl))),b:hsl((h+dh+360)%360,80,28)}; return o._col; }
const estiloBarrio=(o)=>{ const c=colorBarrio(o); return {color:c.b,weight:1.2,opacity:.9,fillColor:c.f,fillOpacity:.32}; };
const estiloComuna=(o)=>{ const h=HUE_COM(o.k); return {color:hsl(h,85,25),weight:2.4,opacity:1,fillColor:hsl(h,75,50),fillOpacity:.33}; };
const ll=(p)=>p.map(r=>r.map(([x,y])=>[y,x]));
function initCapasOficiales(){
  if(typeof CAPA_BARRIOS==='undefined'||!map) return;
  LG.comO=L.layerGroup(CAPA_COMUNAS.map(o=>{ const l=L.polygon(o.p.map(ll),estiloComuna(o)); l._o=o; l.bindTooltip(o.n,{sticky:true}); l.on('click',e=>{ if(PICK) return; L.DomEvent.stopPropagation(e); abrirInfo('comuna',o); }); return l; }));
  LG.comHalo=L.layerGroup(CAPA_COMUNAS.map(o=>L.polygon(o.p.map(ll),{color:'#ffffff',weight:6,opacity:.75,fill:false,interactive:false})));
  LG.lblO=L.layerGroup(CAPA_COMUNAS.map(o=>L.marker([o.c[1],o.c[0]],{icon:L.divIcon({className:'lbl',html:'C'+(+o.k),iconSize:null}),interactive:false})));
  LG.barO=L.layerGroup(CAPA_BARRIOS.map(o=>{ const l=L.polygon(o.p.map(ll),estiloBarrio(o)); l._o=o; l.bindTooltip(`${o.n}${o.s?` · ${o.s.n} edificaciones evaluadas`:''}`,{sticky:true}); l.on('click',e=>{ if(PICK) return; L.DomEvent.stopPropagation(e); abrirInfo('barrio',o); }); return l; }));
  LG.fal=L.layerGroup(CAPA_FALLAS.flatMap(f=>{ const pts=f.c.map(([x,y])=>[y,x]);
    return [L.polyline(pts,{color:'#dc2626',weight:16,opacity:.13,interactive:false}),
      L.polyline(pts,{color:'#7c2d12',weight:3.2,dashArray:'9 6',opacity:.95}).bindTooltip(`〰 ${f.n}`,{sticky:true}).bindPopup(`<div><b>〰 ${esc(f.n)}</b><div class="ex">Tramo de ${fmtN(f.l)} m dentro del perímetro urbano${f.a?` · estudio ${f.a}`:''}</div><div class="ex" style="margin-top:4px">Las zonas cercanas a fallas pueden sentir con más fuerza las réplicas. Fuente: estructuras geológicas, IDESC.</div></div>`)]; }));
  // Los polígonos van al fondo para no tapar reportes, ayudas ni fallas
  const alFondo=()=>{ if(map.hasLayer(LG.barO)) LG.barO.eachLayer(l=>l.bringToBack()); if(map.hasLayer(LG.comO)) LG.comO.eachLayer(l=>l.bringToBack()); if(LG.comHalo&&map.hasLayer(LG.comHalo)) LG.comHalo.eachLayer(l=>l.bringToBack()); if(LG.bar&&map.hasLayer(LG.bar)) LG.bar.bringToBack(); };
  ORDEN_CAPAS=alFondo;
  const t=(id,lyr,extra)=>{ const el=$('#'+id); const f=()=>{ (el.checked?map.addLayer(lyr):map.removeLayer(lyr)); extra&&extra(); alFondo(); }; el.onchange=()=>{ f(); contarCapas(); }; f(); };
  t('L-com',LG.comO,()=>{ const on=$('#L-com').checked; [LG.lblO,LG.comHalo].forEach(x=>on?map.addLayer(x):map.removeLayer(x)); });
  t('L-bar',LG.barO); t('L-fal',LG.fal);
  const excl=(on,off)=>{ $('#'+on).addEventListener('change',()=>{ if($('#'+on).checked&&$('#'+off).checked){ $('#'+off).checked=false; $('#'+off).dispatchEvent(new Event('change')); if(INFO&&((off==='L-bar'&&INFO.tipo==='barrio')||(off==='L-com'&&INFO.tipo==='comuna'))) cerrarInfo(); } }); };
  excl('L-com','L-bar'); excl('L-bar','L-com');
  LG.barO.eachLayer(l=>l.on('mouseover',()=>{ if(!(INFO&&INFO.k===l._o.k)) l.setStyle({weight:2.6,fillOpacity:.5}); }).on('mouseout',()=>resaltar()));
  LG.comO.eachLayer(l=>l.on('mouseover',()=>{ if(!(INFO&&INFO.k===l._o.k)) l.setStyle({weight:3.4,fillOpacity:.5}); }).on('mouseout',()=>resaltar()));
  [LG.zon,LG.rep,LG.ayu].forEach(x=>x&&x.bringToFront&&0);
}


// ---------- Reporte de semáforos dañados ----------
let SEM_MK={}, SEMSEL=null;
const TIPOS_DANO=['Apagado','Intermitente / desincronizado','Luces dañadas','Poste o estructura caída','Otro'];
const SEM_BY=Object.fromEntries(SEMAFOROS.map(([id,dir,com,est,prec,lat,lon])=>[id,{id,dir,com,est,prec,lat,lon}]));
function reportesSem(id,T){ return Object.values(S.data.semaforos||{}).filter(r=>r.sid===id&&r.ts<=T&&enVentana(r.ts)).sort((a,b)=>a.ts-b.ts); }
function estadoSem(id,T){ const rs=reportesSem(id,T); if(!rs.length) return {estado:'operativo',rs}; const last=rs[rs.length-1]; const rep=(last.estados||[]).filter(e=>e.ts<=T).pop(); return {estado:rep?rep.estado:'dañado',rs,last}; }
function urlSemaforos(){ const u=N8N.url||''; return ((typeof CFG!=='undefined'&&CFG.n8nSemaforosUrl))||u.replace(/colaire-mensaje\/?$/,'colaire-semaforo'); }
function semPanelHtml(id){
  const s=SEM_BY[id]; if(!s) return ''; const T=nowT(); const st=estadoSem(id,T); const u=yo(); const mov=u&&['movilidad','policia','alcaldia'].includes(u.rol);
  const ESTC={operativo:['#16a34a','Funcionando (inventario 2025)'],'dañado':['#dc2626','Reportado como dañado'],reparado:['#16a34a','Reparado por Movilidad']}[st.estado]||['#64748b',st.estado];
  const hist=st.rs.slice(-4).reverse().map(r=>`<li><b>${esc(fmtD(r.ts))}</b> · ${esc(r.tipo)}${r.nota?` — «${esc(r.nota)}»`:''}<div class="ex">${esc((usuario(r.autor)||{nombre:r.autor}).nombre)} · correo a Jhinna: ${esc({enviado:'✅ enviado',error:'⚠ falló',pendiente:'enviando…','sin n8n':'sin n8n (solo notificación interna)','sin destinatario':'⚠ falta el correo en n8n'}[r.correo]||r.correo||'—')}</div></li>`).join('');
  return `<div class="ihead"><span class="itag" style="background:#15803d">Semáforo</span><button class="x" data-close-sem aria-label="Cerrar">×</button></div>
  <h3>🚦 Semáforo #${s.id}</h3><div style="font-weight:600">${esc(s.dir)}</div>
  <div class="ex">Comuna ${s.com} · ${s.lat.toFixed(5)}, ${s.lon.toFixed(5)} · ubicación ${s.prec==='interseccion'?'exacta (cruce OSM)':'aproximada'}</div>
  <div class="risk" style="margin-top:8px;background:${ESTC[0]}15;color:${ESTC[0]};border:1px solid ${ESTC[0]}40"><b>●</b> ${ESTC[1]}${st.last?` · último reporte ${esc(fmtH(st.last.ts))}`:''}</div>
  ${hist?`<div class="isec"><h4>Reportes (${st.rs.length})</h4><ul style="margin:0;padding-left:16px;font-size:12px">${hist}</ul></div>`:''}
  <div class="isec"><h4>¿El semáforo está dañado?</h4>
    <div class="field" style="margin-bottom:6px"><select id="semTipo">${TIPOS_DANO.map(t=>`<option>${t}</option>`).join('')}</select></div>
    <div class="field" style="margin-bottom:8px"><input id="semNota" placeholder="Comentario opcional (ej. sin luz desde la réplica)" maxlength="200"></div>
    <button class="btn red" style="width:100%" data-act="semRep" data-sid="${s.id}">⚠ Reportar semáforo dañado</button>
    <div class="ex" style="margin-top:6px">Se notifica a la Secretaría de Movilidad y, con n8n, se envía un correo a Jhinna con la ubicación y la hora del reporte.</div>
    ${mov&&st.estado==='dañado'?`<button class="btn green" style="width:100%;margin-top:8px" data-act="semOk" data-sid="${s.id}">✔ Marcar como reparado</button>`:''}
    <div id="semMsg" class="ex" style="margin-top:6px"></div></div>
  <div class="ex" style="margin-top:6px">Inventario de intersecciones semaforizadas 2025 (Alcaldía de Cali).</div>`;
}
function abrirSemaforo(id){ SEMSEL=id; const p=$('#semPanel'); p.innerHTML=semPanelHtml(id); p.classList.add('open'); pintarSemaforos(); }
function cerrarSemaforo(){ SEMSEL=null; $('#semPanel').classList.remove('open'); pintarSemaforos(); }
function refrescarSemaforo(){ if(!SEMSEL) return; const p=$('#semPanel'); const tipo=$('#semTipo')&&$('#semTipo').value, nota=$('#semNota')&&$('#semNota').value, msg=$('#semMsg')&&$('#semMsg').innerHTML;
  if(document.activeElement&&p.contains(document.activeElement)) return; p.innerHTML=semPanelHtml(SEMSEL); if(tipo) $('#semTipo').value=tipo; if(nota) $('#semNota').value=nota; if(msg) $('#semMsg').innerHTML=msg; }
function pintarSemaforos(){ if(!LG.sem) return; const T=nowT();
  for(const [id,mk] of Object.entries(SEM_MK)){ const st=estadoSem(+id,T).estado; const s=SEM_BY[id]; const sel=+id===SEMSEL;
    mk.setStyle(st==='dañado'?{radius:sel?10:8,color:sel?'#facc15':'#fff',weight:sel?3:2,fillColor:'#dc2626',fillOpacity:1}:{radius:sel?8:5,color:sel?'#facc15':'#fff',weight:sel?3:1.4,fillColor:s.prec==='interseccion'?'#16a34a':'#f59e0b',fillOpacity:.95});
    if(st==='dañado') mk.bringToFront(); } }
async function reportarSemaforo(id){
  const s=SEM_BY[id]; const u=yo(); if(!s||!u) return;
  const tipo=$('#semTipo').value, nota=$('#semNota').value.trim(); const ts=tsNuevo();
  const r={id:uid('s_'),ts,tsReal:Date.now(),sid:id,dir:s.dir,comuna:s.com,lat:s.lat,lon:s.lon,tipo,nota,autor:SES,estados:[],correo:n8nActivo()?'pendiente':'sin n8n'};
  put('semaforos',r); if(document.activeElement) document.activeElement.blur();
  $('#semMsg').innerHTML='✅ Reporte registrado y notificado a la Secretaría de Movilidad.'+(n8nActivo()?' Enviando correo a Jhinna…':' (Conecta n8n para enviar el correo.)'); refrescarSemaforo();
  toast(`🚦 Semáforo #${id} reportado como dañado`);
  if(!n8nActivo()) return;
  let estado='error';
  try{ const ctl=new AbortController(); const t=setTimeout(()=>ctl.abort(),15000);
    const resp=await fetch(urlSemaforos(),{method:'POST',headers:{'Content-Type':'application/json'},signal:ctl.signal,body:JSON.stringify({evento:'semaforo_danado',semaforo:{id:s.id,direccion:s.dir,comuna:s.com,lat:s.lat,lon:s.lon,precision:s.prec},
      tipo,nota,reportado_por:{correo:SES,nombre:u.nombre,rol:ROL_NOMBRE(u.rol)},hora_reporte:new Date(ts).toISOString(),hora_reporte_local:fmtD(ts),hora_envio:new Date().toISOString(),simulacion:MODO==='sim'})});
    clearTimeout(t); const j=await resp.json().catch(()=>({})); estado=!resp.ok?'error':j.correo==='enviado'?'enviado':j.correo==='sin destinatario'?'sin destinatario':'error';
  }catch(e){ estado='error'; }
  const cur=S.data.semaforos[r.id]; if(cur) put('semaforos',{...cur,correo:estado});
  if(document.activeElement&&$('#semPanel').contains(document.activeElement)) document.activeElement.blur(); refrescarSemaforo();
  if($('#semMsg')) $('#semMsg').innerHTML=estado==='enviado'?'✅ Notificado a Movilidad y correo enviado a Jhinna.':estado==='sin destinatario'?'⚠ Notificado a Movilidad. Falta poner el correo de Jhinna en el flujo de n8n.':'⚠ Se notificó a Movilidad, pero n8n no confirmó el correo. Revisa el flujo «ColAIre · Semáforos dañados» (credencial de Gmail y que esté activo).';
}
const LIVE_SEM_LAYER=()=>true;
function repararSemaforo(id){ const T=nowT(); const st=estadoSem(id,T); const u=yo(); if(!st.last||!u) return; put('semaforos',{...st.last,estados:[...(st.last.estados||[]),{estado:'reparado',ts:tsNuevo(),por:SES}]}); toast(`Semáforo #${id} marcado como reparado`); if(document.activeElement) document.activeElement.blur(); refrescarSemaforo(); pintarSemaforos(); }

// ---------- Mapa ----------
let map=null,LG={},MK={},AK={},OPENR=null,PICK=null;
function colorSens(p){ const t=Math.max(0,Math.min(1,((p||0)-20)/30)); const a=[254,243,199],m=[245,158,11],z=[124,45,18]; const mix=(x,y,k)=>x.map((v,i)=>Math.round(v+(y[i]-v)*k)); const c=t<.5?mix(a,m,t*2):mix(m,z,(t-.5)*2); return `rgb(${c.join(',')})`; }
function barrioPopup(p){ const T=nowT(); const abiertos=visibles('reportes').filter(r=>r.barrio===p.barrio&&estadoReporte(r,T).estado!=='atendido').length;
  return `<div><b>${esc(nombreBarrio(p.barrio))}</b> · Comuna ${p.comuna} · Estrato ${esc(p.estrato||'—')}<br>Población: ${(p.poblacion_total||0).toLocaleString('es-CO')}<br>Niños 0-14: ${(p.ninos_0_14||0).toLocaleString('es-CO')} · Mayores de 65: ${(p.mayores_65||0).toLocaleString('es-CO')}<br>Población sensible: <b>${p.pct_sensible??'—'}%</b><br>Reportes abiertos: <b>${abiertos}</b><div class="ex">Fuente: DANE (repo tangara_2026_v2)</div></div>`; }
function initMap(){
  if(typeof L==='undefined'){ $('#map').innerHTML='<div class="empty">No se pudo cargar la librería del mapa. Revisa la conexión a internet.</div>'; return; }
  map=L.map('map',{zoomControl:true,attributionControl:true,minZoom:11,maxZoom:19,zoomSnap:0.5});
  const bases=capasBase(map);
  LG.com=L.geoJSON(GEO_COMUNAS,{style:{color:'#334155',weight:1.8,fill:false},interactive:false});
  LG.bar=L.geoJSON(GEO_BARRIOS,{style:()=>({color:'#64748b',weight:.6,fillOpacity:0,fill:true}),onEachFeature:(f,l)=>{ l.bindTooltip(nombreBarrio(f.properties.barrio),{sticky:true}); l.on('click',e=>{ if(PICK) return; L.popup().setLatLng(e.latlng).setContent(barrioPopup(f.properties)).openOn(map); }); }});
  LG.lbl=L.layerGroup(GEO_COMUNAS.features.map(f=>{ const p=f.properties; let lat=0,lon=0,n=0; for(const pt of f.geometry.coordinates[0][0]){ lon+=pt[0]; lat+=pt[1]; n++; } return L.marker([lat/n,lon/n],{icon:L.divIcon({className:'lbl',html:'C'+p.comuna,iconSize:null}),interactive:false}); }));
  LG.sem=L.layerGroup(); SEM_MK={};
  for(const [id,dir,com,est,prec,lat,lon] of SEMAFOROS){ const mk=L.circleMarker([lat,lon],{radius:5,color:'#fff',weight:1.4,fillColor:prec==='interseccion'?'#16a34a':'#f59e0b',fillOpacity:.95});
    mk.bindTooltip(`🚦 ${dir}`,{direction:'top'}); mk.on('click',ev=>{ L.DomEvent.stopPropagation(ev); abrirSemaforo(id); }); mk._sid=id; SEM_MK[id]=mk; LG.sem.addLayer(mk); }
  LG.zon=L.layerGroup().addTo(map); LG.rep=L.layerGroup().addTo(map); LG.ayu=L.layerGroup().addTo(map);
  map.fitBounds(L.geoJSON(GEO_COMUNAS).getBounds(),{padding:[20,20]});
  L.control.layers(bases,null,{position:'bottomright'}).addTo(map);
  $('#L-rep').onchange=e=>e.target.checked?map.addLayer(LG.rep):map.removeLayer(LG.rep);
  $('#L-zon').onchange=e=>e.target.checked?map.addLayer(LG.zon):map.removeLayer(LG.zon);
  $('#L-ayu').onchange=e=>e.target.checked?map.addLayer(LG.ayu):map.removeLayer(LG.ayu);
  $('#L-sem').onchange=e=>{ e.target.checked?map.addLayer(LG.sem):(map.removeLayer(LG.sem),cerrarSemaforo()); pintarSemaforos(); };
  $('#L-ate').onchange=renderMap;
  $('#L-sen').onchange=e=>{ const on=e.target.checked; $('#senLegend').style.display=on?'':'none'; on?map.addLayer(LG.bar):map.removeLayer(LG.bar);
    LG.bar.setStyle(f=>on?{color:'#64748b',weight:.4,fillColor:colorSens(f.properties.pct_sensible),fillOpacity:.5}:{color:'#64748b',weight:.6,fillOpacity:0}); ORDEN_CAPAS(); contarCapas(); };
  map.on('click',e=>{ if(!PICK) return; const p=PICK; endPick(); const lat=+e.latlng.lat.toFixed(5),lon=+e.latlng.lng.toFixed(5); const ub=ubicarBarrio(lat,lon);
    const loc={lat,lon,label:'Punto marcado en el mapa'+(ub&&ub.barrio?` · ${nombreBarrio(ub.barrio)}`:''),conf:'confirmada'};
    if(p.form){ PREV.pick=loc; PREV.sel=0; showView('reportes'); renderPreview(true); } else if(p.mid) ubicarMensaje(p.mid,loc); });
  map.on('popupopen',e=>{ OPENR=e.popup._rid||null; const el=e.popup.getElement(); if(el&&!el._act){ el._act=1; el.addEventListener('click',onAct); } });
  map.on('popupclose',()=>{ OPENR=null; });
  initCapasOficiales(); initSalud(); initBomberos();
}
function startPick(p){ PICK=p; showView('mapa'); $('#pickbar').style.display='block'; $('#map').style.cursor='crosshair'; }
function endPick(){ PICK=null; $('#pickbar').style.display='none'; $('#map').style.cursor=''; }
$('#pickcancel').onclick=()=>{ const f=PICK&&PICK.form; endPick(); if(f) showView('reportes'); };
function popupHtml(r,st){
  const u=yo(); const col=st.estado==='atendido'?URG_COLOR.atendido:URG_COLOR[st.u]; const a=usuario(r.autor);
  const lines=[{ts:r.ts,autor:r.autor,texto:r.texto},...st.conf].slice(-5).map(c=>`<li><b>${esc(fmtH(c.ts))}</b> ${esc((usuario(c.autor)||{nombre:c.autor}).nombre)}: ${esc(c.texto)}</li>`).join('');
  return `<div><b><span class="dot" style="background:${col}"></span> ${esc(CATS[r.categoria]?.label||'Reporte')}</b><div class="ex">${esc(r.label)}${r.barrio?` · ${esc(barrioTxt(r))}`:''}${r.comuna?` · Comuna ${r.comuna}`:''}</div>
  ${(r.necesidades||[]).length?`<div class="ex"><b>Necesita:</b> ${esc(r.necesidades.join(', '))}</div>`:''}<div class="ex">Inicio ${esc(fmtD(r.ts))} · ${st.personas} persona(s) · por ${esc(a?a.nombre:r.autor)}</div>
  <div style="margin:4px 0"><span class="chip u" style="background:${URG_COLOR[st.u]}">${URG_LABEL[st.u]}</span> <span class="chip">Estado: ${esc(st.estado)}</span></div>
  ${(()=>{ if(!['rojo','naranja'].includes(st.u)) return ''; const h=cercanos(r,['hospital'],1)[0]; const eb=estacionCercana(r); return `<div class="ex">🚒 Bomberos más cercanos: <a href="#" data-act="verB" data-bid="${eb.b.id}">Estación ${esc(eb.b.id)} ${esc(eb.b.barrio)}</a> (${fmtDist(eb.d)})</div><div class="ex">🏥 Hospital más cercano: <a href="#" data-act="verS" data-si="${h.s.i}">${esc(h.s.n)}</a> (${fmtDist(h.d)})</div>`; })()}
  <ul style="margin:4px 0;padding-left:16px;font-size:12px;max-height:110px;overflow:auto">${lines}</ul>
  <div class="row">${isInst(u)?(st.estado!=='atendido'?`<button class="btn purple sm" data-act="estado" data-rid="${r.id}" data-e="en atención">En atención</button><button class="btn green sm" data-act="estado" data-rid="${r.id}" data-e="atendido">Atendido</button>`:''):`<button class="btn sm" data-act="confirmar" data-rid="${r.id}">Sigue pasando aquí</button>`}</div></div>`;
}
const AY_COL={personal:'#7c3aed',insumos:'#d97706',ofrece:'#059669',cubierto:'#94a3b8'};
const ayClase=(a,st)=>st.estado==='cubierto'?'cubierto':a.tipo==='ofrece'?'ofrece':a.personal?'personal':'insumos';
function ayudaPopup(a,st){ const u=yo(); const k=ayClase(a,st); const au=usuario(a.autor);
  const titulo={personal:'Se necesita personal',insumos:'Se necesitan insumos',ofrece:'Ofrece ayuda',cubierto:'Cubierto'}[k];
  return `<div><b style="color:${AY_COL[k]}">${titulo}</b><div class="row" style="margin:4px 0">${a.items.map(i=>`<span class="chip">${esc(i)}</span>`).join('')}</div><div style="font-size:12.5px">«${esc(a.texto)}»</div>
  <div class="ex">${esc(a.label)}${a.barrio?` · ${esc(barrioTxt(a))}`:''} · ${esc(fmtD(a.ts))} · ${esc(au?au.nombre:a.autor)}</div><div class="ex">${st.resp.length} persona(s) respondieron · estado: ${esc(st.estado)}</div>
  <div class="row" style="margin-top:6px">${st.estado!=='cubierto'&&!isInst(u)&&a.autor!==SES?`<button class="btn sm" data-act="responder" data-aid="${a.id}">${a.tipo==='ofrece'?'La necesito':'Puedo ayudar'}</button>`:''}${st.estado!=='cubierto'&&(isInst(u)||a.autor===SES)?`<button class="btn green sm" data-act="cubrir" data-aid="${a.id}">Marcar cubierto</button>`:''}</div></div>`; }
function renderMap(){
  if(!map) return; const T=nowT(); const keep=OPENR;
  LG.rep.clearLayers(); LG.zon.clearLayers(); LG.ayu.clearLayers(); MK={}; AK={};
  const showAte=$('#L-ate').checked;
  for(const r of visibles('reportes').sort((a,b)=>ULEV[a.urgencia]-ULEV[b.urgencia])){
    const st=estadoReporte(r,T); const done=st.estado==='atendido'; if(done&&!showAte&&st.inten<=0) continue;
    const col=done?URG_COLOR.atendido:URG_COLOR[st.u];
    if(!done){ const rad=180+140*Math.sqrt(st.personas)+60*ULEV[st.u];
      L.circle([r.lat,r.lon],{radius:rad*1.8,stroke:false,fillColor:col,fillOpacity:.10*st.inten,interactive:false}).addTo(LG.zon);
      L.circle([r.lat,r.lon],{radius:rad,stroke:false,fillColor:col,fillOpacity:.28*st.inten,interactive:false}).addTo(LG.zon); }
    const mk=L.circleMarker([r.lat,r.lon],{radius:7+2.5*Math.sqrt(st.personas),color:st.estado==='en atención'?'#7c3aed':'#fff',weight:2.5,dashArray:st.estado==='en atención'?'4 3':null,fillColor:col,fillOpacity:done?.55:.35+.6*st.inten,className:st.sinAtender?'pulse':''}).addTo(LG.rep);
    const pp=L.popup({maxWidth:320}).setContent(popupHtml(r,st)); pp._rid='r'+r.id; mk.bindPopup(pp); mk.bindTooltip(`${URG_LABEL[st.u]} · ${r.label}`,{direction:'top',offset:[0,-8]}); MK['r'+r.id]=mk;
  }
  for(const a of visibles('ayudas')){
    const st=estadoAyuda(a,T); if(st.estado==='cubierto'&&!showAte) continue; const k=ayClase(a,st);
    const ic={personal:'🙋',insumos:'📦',ofrece:'🤝',cubierto:'✔'}[k];
    const mk=L.marker([a.lat,a.lon],{icon:L.divIcon({className:'aicon',html:`<div style="background:${AY_COL[k]}">${ic}</div>`,iconSize:[30,30],iconAnchor:[15,15],popupAnchor:[0,-14]})}).addTo(LG.ayu);
    const pp=L.popup({maxWidth:300}).setContent(ayudaPopup(a,st)); pp._rid='a'+a.id; mk.bindPopup(pp); mk.bindTooltip(`${ic} ${a.items.join(', ')}`,{direction:'top',offset:[0,-14]}); MK['a'+a.id]=mk;
  }
  if(keep&&MK[keep]) MK[keep].openPopup();
}
function verReporte(rid,pref='r'){ const o=pref==='r'?S.data.reportes[rid]:S.data.ayudas[rid]; if(!o) return; showView('mapa'); if(map){ map.setView([o.lat,o.lon],15.5); setTimeout(()=>MK[pref+rid]&&MK[pref+rid].openPopup(),300); } }

// ---------- Línea de tiempo ----------
function renderTimeline(){
  const T=nowT(); const sim=MODO==='sim';
  $('#tslider').disabled=!sim; $('#tslider').value=sim?Math.round(1000*(T-SIM0)/(SIMEND-SIM0)):1000;
  $('#tlabel').innerHTML=sim?`<span class="simb">SIMULACIÓN</span> ${esc(fmtD(T))}`:`<span class="live">● EN VIVO</span> ${esc(fmtD(T))}`;
  $('#bPlay').disabled=!!PLAY; $('#bPause').disabled=!PLAY; $('#clock').innerHTML=$('#tlabel').innerHTML;
  $('#mode').textContent=sim?'Simulación 10 ago 2026':'En vivo';
}
function guardarT(){ lsSet('colaire_tsim',TSIM); lsSet('colaire_modo',MODO); }
function play(){ if(PLAY) return; if(MODO!=='sim'){ MODO='sim'; SEEN=null; }
  if(TSIM>=SIMEND) TSIM=SIM0;
  PLAY=setInterval(()=>{ TSIM=Math.min(SIMEND,TSIM+(+$('#speed').value)*250); if(TSIM>=SIMEND) pausa(); guardarT(); renderAll(); },250); renderAll(); }
function pausa(){ if(PLAY){ clearInterval(PLAY); PLAY=null; } guardarT(); renderAll(); }
$('#bPlay').onclick=play; $('#bPause').onclick=pausa;
$('#bRestart').onclick=()=>{ if(PLAY){ clearInterval(PLAY); PLAY=null; } MODO='sim'; TSIM=SIM0; LASTTS=0; SEEN=null; guardarT(); play(); };
$('#bLive').onclick=()=>{ if(PLAY){ clearInterval(PLAY); PLAY=null; } MODO=MODO==='sim'?'vivo':'sim'; SEEN=null; guardarT(); renderAll(); };
$('#tslider').addEventListener('input',e=>{ if(MODO!=='sim') return; TSIM=SIM0+(SIMEND-SIM0)*e.target.value/1000; LASTTS=0; SEEN=null; guardarT(); renderAll(); });

// ---------- Chat ciudadano ----------
const TIPO_LBL={emergencia:'Emergencia',ayuda:'Ayuda solidaria',oferta:'Ofrecimiento',info:'Información',charla:'Conversación'};
function pipelineHtml(m,full){
  const c=m.clas, n=(m.notif||[]).map(ROL_NOMBRE);
  const paso=(i,t,d)=>`<div class="step"><span class="sn">${i}</span><div><b>${t}</b><div>${d}</div></div></div>`;
  const motor=m.motor==='n8n'?`<span class="mtag n8n">n8n · ${esc(m.n8n.modelo||'')}</span>`:`<span class="mtag">motor local</span>${m.n8n&&m.n8n.fallo?` <span class="ex" style="color:#b45309">(n8n falló: ${esc(m.n8n.fallo)})</span>`:''}`;
  const s2=(c.tipo==='charla'?'Sin incidente: solo conversación':`${TIPO_LBL[c.tipo]}${c.urgencia!=='ninguna'&&c.tipo!=='ayuda'&&c.tipo!=='oferta'?` · <span style="color:${URG_COLOR[c.urgencia]};font-weight:700">${URG_LABEL[c.urgencia]}</span> · ${esc(CATS[c.categoria]?.label||'')}`:''}${c.items.length?` · ${esc(c.items.join(', '))}`:''}${c.hits.length?`<div class="ex">Palabras clave: ${esc(c.hits.slice(0,5).join(', '))}</div>`:''}`)+`${c.resumen?`<div class="ex">Resumen IA: ${esc(c.resumen)}</div>`:''}<div style="margin-top:3px">${motor}</div>`;
  const s3=m.ubic?`${esc(m.ubic.label)}${m.ubic.semaforo?`<div class="ex" style="color:#15803d">🚦 Semáforo #${m.ubic.semaforo.id} · ${esc(m.ubic.semaforo.dir)} (Comuna ${m.ubic.semaforo.comuna})</div>`:''}<div class="ex">${m.ubic.lat}, ${m.ubic.lon} · ${m.ubic.fuente?esc(m.ubic.fuente):m.ubic.conf==='OSM'?'cruce en OpenStreetMap':/^Barrio /.test(m.ubic.label)?'centro del barrio (límites oficiales IDESC)':m.ubic.conf==='alta'?'intersecciones semaforizadas de Cali':m.ubic.conf==='perfil'?'barrio del perfil':m.ubic.conf==='confirmada'?'marcado en el mapa':'estimación, revisar'}</div>`:(c.tipo==='charla'?'—':'<span style="color:#dc2626">No se encontró dirección</span>');
  let s4=n.length?`${m.sumado?'Confirmación a: ':''}${esc(n.join(', '))}`:(c.tipo==='charla'?'—':'Pendiente de ubicación');
  const z=m.zona;
  let s3z=z?`<div class="ex">🏚 ${esc(z.n)} (Comuna ${z.com}): ${z.s?`${fmtN(z.s.esc)} edificaciones con alta probabilidad de escombros y ${fmtN(z.s.techo)} con posible desaparición de techo de ${fmtN(z.s.n)} evaluadas`:'sin edificaciones evaluadas'} · 〰 ${z.f.cruza.length?`atravesado por ${esc(z.f.cruza.join(', '))}`:`falla más cercana a ${fmtDist(z.f.dist)}`} · <a href="#" data-act="infoB" data-k="${z.k}">ver barrio</a></div>`:'';
  if(m.motor==='n8n') s4+=`<div class="ex">📨 Telegram: ${m.n8n.telegram?`${m.n8n.telegram} alerta(s) enviadas por n8n`:'sin alertas (bot no configurado o mensaje sin destinatarios)'}</div>`;
  if(m.bomb) s4+=`<div class="ex">🚒 Estación de bomberos más cercana: <a href="#" data-act="verB" data-bid="${m.bomb.id}">${esc(m.bomb.id)} ${esc(m.bomb.barrio)}</a> (${fmtDist(m.bomb.d)})</div>`;
  if(m.salud){ s4+=`<div class="ex">🏥 Hospital más cercano: <a href="#" data-act="verS" data-si="${m.salud.hospital.i}">${esc(m.salud.hospital.n)}</a> (${fmtDist(m.salud.hospital.d)}) · ✚ Centro de salud: <a href="#" data-act="verS" data-si="${m.salud.centro.i}">${esc(m.salud.centro.n)}</a> (${fmtDist(m.salud.centro.d)})</div>`;
    if(m.salud.afectado) s4+=`<div class="ex" style="color:#b91c1c">⚠ Equipamiento de salud a ${m.salud.afectado.d} m del incidente: ${esc(m.salud.afectado.n)}. Se avisó a la Secretaría de Salud.</div>`; }
  if(!full) return '';
  return `<div class="pipe">${paso(1,'Recibido',esc(fmtD(m.ts))+' · '+esc((usuario(m.autor)||{nombre:m.autor}).nombre))}${paso(2,'Interpretado',s2)}${paso(3,'Georreferenciado',s3+s3z)}${paso(4,'Notificado',s4)}</div>`;
}
let OPENPIPE=new Set();
function renderChat(){
  const box=$('#msgs'); const atBottom=box.scrollHeight-box.scrollTop-box.clientHeight<80; const u=yo();
  const ms=visibles('mensajes').sort((a,b)=>a.ts-b.ts).slice(-150);
  $('#composer').style.display=u&&!isInst(u)?'':'none'; $('#instNote').style.display=u&&isInst(u)?'':'none';
  box.innerHTML=ms.length?ms.map(m=>{ const a=usuario(m.autor)||{nombre:m.autor,rol:'ciudadano'}; const r=ROLES[a.rol]||ROLES.ciudadano; const c=m.clas;
    const ini=a.nombre.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase(); const chips=[];
    if(c.tipo==='emergencia'||c.tipo==='info') chips.push(`<span class="chip u" style="background:${URG_COLOR[c.urgencia]}">${URG_LABEL[c.urgencia]}</span>`);
    if(c.tipo==='ayuda') chips.push(`<span class="chip u" style="background:${c.personal?AY_COL.personal:AY_COL.insumos}">${c.personal?'🙋 Se necesita personal':'📦 Se necesitan insumos'}</span>`);
    if(c.tipo==='oferta') chips.push(`<span class="chip u" style="background:${AY_COL.ofrece}">🤝 Ofrece ayuda</span>`);
    if(m.ubic) chips.push(`<button class="chip" data-act="${m.reporteId?'ver':'verA'}" data-rid="${m.reporteId||''}" data-aid="${m.ayudaId||''}">📍 ${esc(m.ubic.label)}</button>`);
    if(m.ubic&&m.ubic.semaforo) chips.push(`<span class="chip" style="border-color:#86efac;color:#15803d" title="Ubicación exacta tomada del inventario de semáforos">🚦 Semáforo #${m.ubic.semaforo.id}</span>`);
    if(m.notif&&m.notif.length) chips.push(`<span class="chip">🔔 ${m.notif.length} entidades</span>`);
    if(!m.ubic&&c.tipo!=='charla'&&m.autor===SES) chips.push(`<button class="chip" data-act="pick" data-mid="${m.id}">⚠ Marcar ubicación en el mapa</button>`);
    if(m.ubic&&m.autor===SES&&(m.alternativas||[]).length) chips.push(...m.alternativas.map((x,i)=>`<button class="chip" data-act="alt" data-mid="${m.id}" data-i="${i}">¿Era ${esc(x.label)}?</button>`));
    if(c.tipo!=='charla') chips.push(`<button class="chip" data-act="pipe" data-mid="${m.id}">${OPENPIPE.has(m.id)?'Ocultar flujo':'Ver flujo de datos'}</button>`);
    return `<div class="msg${m.autor===SES?' me':''}"><div class="mav" style="background:${r.c}">${esc(ini)}</div><div class="bub"><div class="meta"><b>${esc(a.nombre)}</b> ${esc(r.l)} · ${esc(fmtH(m.ts))}</div><div class="txt">${esc(m.texto)}</div>${chips.length?`<div class="row" style="gap:5px;margin-top:4px">${chips.join('')}</div>`:''}${OPENPIPE.has(m.id)?pipelineHtml(m,true):''}</div></div>`; }).join('')
    :`<div class="emptybird"><img src="${LOGO_N}" alt=""><div>${MODO==='sim'?'Aún no hay mensajes a esta hora de la simulación.<br>Pulsa ▶ Play (o carga el escenario en Reportes) y escribe mientras corre.':'Aún no hay mensajes en vivo.'}</div></div>`;
  if(atBottom||CHAT_FORCE){ box.scrollTop=box.scrollHeight; CHAT_FORCE=false; }
  // panel de flujo de datos
  const last=ms.filter(m=>m.clas.tipo!=='charla').slice(-6).reverse();
  $('#flow').innerHTML=`<div class="engine"><img src="${LOGO_W}" alt=""><div style="flex:1"><b>Motor de interpretación ColAIre</b><div>Recibe → interpreta → georreferencia → notifica · ${n8nActivo()?'conectado a n8n':'motor local'}</div></div><button class="btn sm engbtn" data-act="n8n">${n8nActivo()?'n8n ✓':'Conectar n8n'}</button></div>`+(last.length?last.map(m=>`<div class="flowitem"><div class="txt">«${esc(m.texto.slice(0,110))}${m.texto.length>110?'…':''}»</div>${pipelineHtml(m,true)}</div>`).join(''):'<div class="empty">Aquí verás cómo se procesa cada mensaje: recepción, interpretación, georreferenciación y notificación.</div>');
}
let CHAT_FORCE=true;
const EJ_CHAT=['Necesito ayuda en mariano ramos, mi mamá quedó atrapada en el supermercado D1 y esta estructura colapsó','Se necesitan voluntarios con palas para remover escombros en la calle 5 con carrera 50','Necesitamos agua, cobijas y pañales en Siloé, hay muchos niños','Tenemos 40 botellas de agua para donar en el barrio El Ingenio','Hay una mujer herida en la calle 5 con carrera 34!!'];
$('#cex').innerHTML=EJ_CHAT.map((e,i)=>`<a href="#" data-cex="${i}">${i+1}</a>`).join(' · ');
$('#cex').onclick=e=>{ const i=e.target.dataset.cex; if(i!==undefined){ e.preventDefault(); $('#ctxt').value=EJ_CHAT[+i]; $('#ctxt').focus(); } };
async function enviarChat(){
  const t=$('#ctxt').value.trim(); const u=yo(); if(!t||!u||isInst(u)) return;
  $('#csend').disabled=true; $('#csend').textContent='Procesando…';
  try{ const m=await procesarMensaje(t,SES,tsNuevo()); $('#ctxt').value=''; CHAT_FORCE=true; OPENPIPE.add(m.id); renderAll();
    if(m.ubic&&map){ map.setView([m.ubic.lat,m.ubic.lon],Math.max(map.getZoom(),14.5)); const k=m.reporteId?'r'+m.reporteId:m.ayudaId?'a'+m.ayudaId:null; if(k) setTimeout(()=>MK[k]&&MK[k].openPopup(),300); }
  } finally{ $('#csend').disabled=false; $('#csend').textContent='Enviar'; }
}
$('#csend').onclick=enviarChat;
$('#motorPill').onclick=abrirN8N; renderMotor();
$('#ctxt').addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); enviarChat(); } });
document.querySelectorAll('[data-ct]').forEach(b=>b.onclick=()=>{ document.querySelectorAll('[data-ct]').forEach(x=>x.classList.toggle('on',x===b)); $('#msgs').style.display=b.dataset.ct==='chat'?'':'none'; $('#flow').style.display=b.dataset.ct==='flujo'?'':'none'; $('#cfoot').style.display=b.dataset.ct==='chat'?'':'none'; });

// ---------- Vistas ----------
function showView(v){ document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===v)); document.querySelectorAll('.view').forEach(s=>s.classList.toggle('on',s.id==='v-'+v)); if(v==='mapa'&&map) setTimeout(()=>map.invalidateSize(),50); if(v==='reportes') renderPreview(); if(v==='perfil') renderPerfil(true); if(v==='notif') renderNotif(); }
$('#nav').onclick=e=>{ const b=e.target.closest('button'); if(b) showView(b.dataset.v); };
function repCard(r,st){
  const u=yo(); const a=usuario(r.autor); const col=st.estado==='atendido'?URG_COLOR.atendido:URG_COLOR[st.u];
  return `<div class="rep" style="border-left-color:${col}"><div class="top"><span class="chip u" style="background:${URG_COLOR[st.u]}">${URG_LABEL[st.u]}</span><span class="chip">${esc(CATS[r.categoria]?.label||r.categoria)}</span><span class="chip">${esc(st.estado)}</span>${st.sinAtender?'<span class="chip" style="color:#dc2626;border-color:#dc2626">Sin atención &gt; 30 min</span>':''}${st.personas>1?`<span class="chip">${st.personas} personas</span>`:''}</div>
  <div class="txt">${esc(r.texto)}</div>${(r.necesidades||[]).length?`<div class="row">${r.necesidades.map(n=>`<span class="chip" style="background:#fef3c7;border-color:#fde68a">${esc(n)}</span>`).join('')}</div>`:''}${r.contacto?`<div class="meta">Contacto en el punto: ${esc(r.contacto)}</div>`:''}
  <div class="meta">📍 ${esc(r.label)}${r.barrio?` · ${esc(barrioTxt(r))}`:''}${r.comuna?` · Comuna ${r.comuna}`:''} · ${esc(fmtD(r.ts))} · ${esc(a?a.nombre:r.autor)}</div>
  <div class="row"><button class="btn sec sm" data-act="ver" data-rid="${r.id}">Ver en el mapa</button>${isInst(u)&&st.estado!=='atendido'?`<button class="btn purple sm" data-act="estado" data-rid="${r.id}" data-e="en atención">Atender</button><button class="btn green sm" data-act="estado" data-rid="${r.id}" data-e="atendido">Atendido</button>`:''}${!isInst(u)&&r.autor!==SES&&st.estado!=='atendido'?`<button class="btn sm" data-act="confirmar" data-rid="${r.id}">Sigue pasando</button>`:''}</div></div>`;
}
$('#fN').innerHTML='<option value="">Toda necesidad</option>'+NECESIDADES.map(n=>`<option>${esc(n)}</option>`).join('');
$('#fC').innerHTML='<option value="">Todas las comunas</option>'+GEO_COMUNAS.features.map(f=>f.properties.comuna).sort((a,b)=>a-b).map(c=>`<option value="${c}">Comuna ${c}</option>`).join('');
function renderReportes(){
  const T=nowT(); const fN=$('#fN').value,fU=$('#fU').value,fE=$('#fE').value,fC=$('#fC').value,mine=$('#fMine').checked,q=norm($('#fQ').value);
  const rows=visibles('reportes').map(r=>({r,st:estadoReporte(r,T)})).sort((a,b)=>(a.st.estado==='atendido')-(b.st.estado==='atendido')||ULEV[b.st.u]-ULEV[a.st.u]||b.r.ts-a.r.ts);
  let rojo=0,abiertos=0,ate=0; const tAt=[];
  for(const {r,st} of rows){ if(st.estado!=='atendido'){ abiertos++; if(st.u==='rojo') rojo++; } else ate++; const f=(r.estados||[]).find(e=>e.estado!=='nuevo'&&e.ts<=T); if(f) tAt.push((f.ts-r.ts)/MIN); }
  const ay=visibles('ayudas').filter(a=>estadoAyuda(a,T).estado!=='cubierto');
  $('#stats').innerHTML=[[rows.length,'Reportes'],[rojo,'Críticos abiertos'],[abiertos,'Abiertos'],[ate,'Atendidos'],[tAt.length?Math.round(tAt.reduce((x,y)=>x+y,0)/tAt.length)+' min':'—','Tiempo promedio a atención'],[ay.length,'Puntos de ayuda abiertos']].map(([n,l])=>`<div class="stat"><div class="n">${n}</div><div class="l">${l}</div></div>`).join('');
  $('#tbanner').innerHTML=MODO==='sim'?`<div class="warn">Mostrando la simulación del 10 de agosto a las ${esc(fmtH(T))}. Los datos cambian a medida que corre el reloj.</div>`:'';
  const f=rows.filter(({r,st})=>(!fN||(r.necesidades||[]).includes(fN))&&(!fU||st.u===fU)&&(!fE||st.estado===fE)&&(!fC||String(r.comuna)===fC)&&(!mine||r.autor===SES||st.conf.some(c=>c.autor===SES))&&(!q||norm(r.label+' '+(r.barrio||'')+' '+r.texto).includes(q)));
  $('#rlist').innerHTML=f.length?f.map(({r,st})=>repCard(r,st)).join(''):'<div class="empty">No hay reportes con estos filtros a esta hora.</div>';
}
['#fN','#fU','#fE','#fC','#fMine','#fQ'].forEach(s=>$(s).addEventListener('input',renderReportes));
function renderHeader(){ const u=yo(); if(!u) return; $('#uName').textContent=u.nombre; $('#uRol').textContent=ROL_NOMBRE(u.rol); }
let PERF_INIT=null;
function renderPerfil(force){
  const u=yo(); if(!u) return; const r=ROLES[u.rol]||ROLES.ciudadano; const ini=u.nombre.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
  $('#pHead').innerHTML=`<div class="av" style="background:${r.c}">${esc(ini)}</div><div><div style="font-size:18px;font-weight:700">${esc(u.nombre)}</div><div class="ex">${esc(u.email)}</div><div class="row" style="margin-top:4px"><span class="chip">${esc(r.l)}</span>${u.demo&&!u.hash?'<span class="chip">Cuenta de prueba</span>':''}</div></div>`;
  const b=u.barrio&&BARRIO_BY[u.barrio];
  $('#pBarrio').innerHTML=b?`<h3>Mi barrio: ${esc(nombreBarrio(b.barrio))}</h3><div class="kv"><b>Comuna</b><span>${b.comuna}</span><b>Estrato</b><span>${esc(b.estrato||'—')}</span><b>Población</b><span>${(b.poblacion_total||0).toLocaleString('es-CO')}</span><b>Niños 0-14</b><span>${(b.ninos_0_14||0).toLocaleString('es-CO')}</span><b>Mayores de 65</b><span>${(b.mayores_65||0).toLocaleString('es-CO')}</span><b>Población sensible</b><span>${b.pct_sensible??'—'}%</span></div><div class="row" style="margin-top:10px"><button class="btn sec sm" data-act="barrio">Ver mi barrio en el mapa</button></div>`
    :`<h3>Mi barrio</h3><div class="ex">${isInst(u)?'Cuenta institucional: recibe las notificaciones del flujo de datos y atiende reportes de toda la ciudad.':'Aún no has elegido tu barrio. Hazlo en «Editar datos».'}</div>`;
  if(force||PERF_INIT!==SES){ PERF_INIT=SES; $('#pName').value=u.nombre; $('#pBar').innerHTML=barrioOpts(u.barrio||''); $('#pTel').value=u.telefono||''; const h=u.hogar||{}; $('#hN').checked=!!h.ninos; $('#hM').checked=!!h.mayores; $('#hD').checked=!!h.discapacidad; $('#hE').checked=!!h.embarazo; $('#pMsg').textContent=''; }
  const T=nowT(); const mios=visibles('reportes').filter(x=>x.autor===SES||(x.confirmaciones||[]).some(c=>c.autor===SES)).map(x=>({r:x,st:estadoReporte(x,T)})).sort((a,b)=>b.r.ts-a.r.ts);
  const atend=visibles('reportes').filter(x=>(x.estados||[]).some(e=>e.por===SES&&e.estado==='atendido'&&e.ts<=T)).length;
  $('#pStats').innerHTML=(isInst(u)?[[atend,'Reportes que atendí'],[misNotif(T).length,'Notificaciones recibidas']]:[[mios.length,'Mis reportes'],[mios.filter(x=>x.st.estado==='en atención').length,'En atención'],[mios.filter(x=>x.st.estado==='atendido').length,'Atendidos'],[visibles('mensajes').filter(m=>m.autor===SES).length,'Mensajes en el chat']]).map(([n,l])=>`<div class="stat"><div class="n">${n}</div><div class="l">${l}</div></div>`).join('');
  $('#pList').innerHTML=mios.length?mios.map(({r,st})=>repCard(r,st)).join(''):'<div class="empty">Aún no has enviado reportes.</div>';
}
$('#f-prof').onsubmit=e=>{ e.preventDefault(); const u=yo(); if(!u) return; const b=BARRIO_BY[$('#pBar').value];
  const nu={...u,id:docId(u.email),nombre:$('#pName').value.trim()||u.nombre,barrio:$('#pBar').value,comuna:b?b.comuna:null,telefono:$('#pTel').value.trim(),hogar:{ninos:$('#hN').checked,mayores:$('#hM').checked,discapacidad:$('#hD').checked,embarazo:$('#hE').checked},actualizado:Date.now()};
  delete nu.demo; put('usuarios',nu); PERF_INIT=null; $('#pMsg').textContent='Datos guardados.'; };

// ---------- Acciones ----------
async function onAct(e){ const b=e.target.closest('[data-act]'); if(!b) return; const a=b.dataset.act; const m=b.dataset.mid&&S.data.mensajes[b.dataset.mid];
  if(a==='n8n'){ abrirN8N(); return; }
  if(a==='semRep'){ reportarSemaforo(+b.dataset.sid); return; }
  if(a==='semOk'){ repararSemaforo(+b.dataset.sid); return; }
  if(a==='verSem'){ const s=SEM_BY[b.dataset.sid]; if(s){ showView('mapa'); if(!$('#L-sem').checked){ $('#L-sem').checked=true; $('#L-sem').dispatchEvent(new Event('change')); } map&&map.setView([s.lat,s.lon],16.5); abrirSemaforo(s.id); } return; }
  if(a==='infoC'){ e.preventDefault(); const o=CAPA_COMUNAS.find(x=>x.k===b.dataset.k); if(o){ if(!$('#L-com').checked){ $('#L-com').checked=true; $('#L-com').dispatchEvent(new Event('change')); } abrirInfo('comuna',o); } return; }
  if(a==='infoB'){ e.preventDefault(); const o=CAPA_BARRIOS.find(x=>x.k===b.dataset.k); if(o){ if(!$('#L-bar').checked){ $('#L-bar').checked=true; $('#L-bar').dispatchEvent(new Event('change')); } abrirInfo('barrio',o); if(map){ const l=L.polygon(o.p.map(ll)); map.fitBounds(l.getBounds(),{maxZoom:16,padding:[40,40]}); } } return; }
  if(a==='verB'){ e.preventDefault(); const bo=BOMB_O.find(x=>x.id===b.dataset.bid); if(bo&&map){ showView('mapa'); if(!$('#L-bomb').checked){ $('#L-bomb').checked=true; $('#L-bomb').dispatchEvent(new Event('change')); } map.setView([bo.lat,bo.lon],16); setTimeout(()=>{ LG.bomb.eachLayer(l=>{ const ll=l.getLatLng(); if(Math.abs(ll.lat-bo.lat)<1e-6&&Math.abs(ll.lng-bo.lon)<1e-6) l.openPopup(); }); },350); } }
  if(a==='verS'){ e.preventDefault(); const s=SALUD_O[+b.dataset.si]; if(s&&map){ showView('mapa'); if(!$('#L-sal').checked){ $('#L-sal').checked=true; $('#L-sal').dispatchEvent(new Event('change')); } SAL_ON.add(s.g); map.setView([s.lat,s.lon],16.5); setTimeout(()=>{ renderSalud(); LG.saludMk[s.i].addTo(LG.salud); LG.saludMk[s.i].openPopup(); },350); } }
  if(a==='ver'&&b.dataset.rid) verReporte(b.dataset.rid,'r');
  if(a==='verA'&&b.dataset.aid) verReporte(b.dataset.aid,'a');
  if(a==='estado') cambiarEstado(b.dataset.rid,b.dataset.e);
  if(a==='confirmar') confirmar(b.dataset.rid);
  if(a==='responder') responderAyuda(b.dataset.aid);
  if(a==='cubrir') cubrirAyuda(b.dataset.aid);
  if(a==='pipe'&&m){ OPENPIPE.has(m.id)?OPENPIPE.delete(m.id):OPENPIPE.add(m.id); renderChat(); }
  if(a==='pick'&&m) startPick({mid:m.id});
  if(a==='alt'&&m) ubicarMensaje(m.id,{...m.alternativas[+b.dataset.i]});
  if(a==='barrio'){ const u=yo(); const f=GEO_BARRIOS.features.find(x=>x.properties.barrio===u.barrio); if(f&&map){ showView('mapa'); map.fitBounds(L.geoJSON(f).getBounds(),{maxZoom:16}); setTimeout(()=>L.popup().setLatLng([f.properties.lat,f.properties.lon]).setContent(barrioPopup(f.properties)).openOn(map),300); } }
}
document.addEventListener('click',onAct);

// ---------- Escenario del 10 de agosto de 2026 ----------
const H=(hm)=>Date.parse(`2026-08-10T${hm}:00-05:00`);
const ESC=[
  ['07:36','ciudadano1','Tembló durísimo! Se cayó un edificio en la calle 5 con carrera 50, hay personas atrapadas'],
  ['07:38','ciudadano2','Confirmo, en la calle 5 con carrera 50 se oyen gritos bajo los escombros, urgente'],
  ['07:40','ciudadano3','Necesito ayuda en mariano ramos, mi mamá quedó atrapada en el supermercado D1 y esta estructura colapsó'],
  ['07:42','adultomayor','Hay una mujer herida en la calle 5 con carrera 34, necesitamos una ambulancia!!'],
  ['07:45','turista1','Olor a gas muy fuerte en Chipichape, evacuaron el centro comercial'],
  ['07:48','estudiantesuniversidad','Grieta enorme en la calle 13 con carrera 100, en la entrada de Univalle'],
  ['07:52','ciudadano1','Cables caídos en la calle 44 con carrera 1, hay chispas'],
  ['07:55','ciudadano2','Estamos bien en el punto de encuentro del barrio San Antonio'],
  ['08:00','turista2','Vía bloqueada por escombros en la calle 70 con carrera 1'],
  ['08:05','ciudadano3','En Mariano Ramos necesitamos voluntarios con palas y guantes para remover escombros'],
  ['08:10','estudiantesuniversidad','Tenemos 40 botellas de agua y un botiquín para donar en el barrio El Ingenio'],
  ['08:14','ciudadano2','Necesitamos agua, cobijas y pañales en Siloé, hay muchos niños'],
  ['08:20','adultomayor','Sigue la mujer herida en la calle 5 con carrera 34, nadie ha llegado'],
  ['08:25','ciudadano1','Se necesitan médicos y enfermeras en el albergue del barrio Calima'],
  ['08:32','turista1','Puedo llevar comida y ropa a quien la necesite, estoy en Granada'],
  ['08:40','ciudadano3','Incendio en una casa en El Vallado, hay humo negro'],
  ['08:50','estudiantesuniversidad','Se necesitan psicólogos para acompañar a las familias en Mojica'],
  ['09:05','ciudadano2','Necesitamos carpas y colchonetas para 30 familias en Potrero Grande'],
  ['09:20','ciudadano1','Otra grieta en Terrón Colorado, la columna de la casa se ve inclinada'],
  ['09:45','ciudadano3','Se cayó la pared de una casa en Alfonso López, hay una familia atrapada'],
  ['10:10','turista2','Ofrezco mi camioneta para transportar insumos desde San Antonio'],
];
const ESC_EST=[['07:47',0,'bomberoscali','en atención'],['07:51',2,'defensacivil','en atención'],['07:56',4,'bomberoscali','en atención'],['08:15',4,'bomberoscali','atendido'],['08:22',8,'secretariamov','en atención'],
  ['08:28',3,'saludcali','en atención'],['08:46',3,'saludcali','atendido'],['09:02',8,'secretariamov','atendido'],['09:10',2,'defensacivil','atendido'],['09:30',0,'bomberoscali','atendido'],['09:12',15,'bomberoscali','atendido']];
const ESC_AY=[['08:12',9,'turista2','resp'],['08:40',9,'cruzrojavalle','cubierto'],['08:36',11,'turista1','resp'],['09:30',11,'cruzrojavalle','cubierto']];
$('#seed').onclick=async()=>{
  $('#seed').disabled=true; const ids=[];
  for(const [hm,u,txt] of ESC){ $('#seedMsg').textContent=`Procesando mensaje ${ids.length+1}/${ESC.length}…`; ids.push(await procesarMensaje(txt,u+'@colaire.test',H(hm),{osm:false,n8n:false})); }
  for(const [hm,i,u,e] of ESC_EST){ const m=ids[i]; const r=m&&m.reporteId&&S.data.reportes[m.reporteId]; if(!r) continue; put('reportes',{...r,estados:[...(r.estados||[]),{estado:e,ts:H(hm),por:u+'@colaire.test'}].sort((a,b)=>a.ts-b.ts)}); }
  for(const [hm,i,u,k] of ESC_AY){ const m=ids[i]; const a=m&&m.ayudaId&&S.data.ayudas[m.ayudaId]; if(!a) continue;
    put('ayudas',k==='resp'?{...a,respuestas:[...(a.respuestas||[]),{ts:H(hm),autor:u+'@colaire.test'}]}:{...a,estados:[...(a.estados||[]),{estado:'cubierto',ts:H(hm),por:u+'@colaire.test'}]}); }
  $('#seed').disabled=false; MODO='sim'; TSIM=SIM0; SEEN=null; guardarT();
  $('#seedMsg').textContent='Escenario cargado. Ve a «Mapa y chat» y pulsa ⟲ Reiniciar: los mensajes llegan a su hora y puedes escribir mientras corre.'; renderAll();
};
$('#wipe').onclick=()=>{ $('#mbox').innerHTML=`<h3 style="margin-top:0">¿Borrar mensajes, reportes, puntos de ayuda y cuentas creadas?</h3><p class="ex">Las cuentas de prueba siguen disponibles.</p><div class="row"><button class="btn red" id="wy">Borrar</button><button class="btn sec" id="wn">Cancelar</button></div>`;
  $('#modal').style.display='grid'; $('#wn').onclick=()=>$('#modal').style.display='none'; $('#wy').onclick=async()=>{ $('#modal').style.display='none'; await delAll(); $('#seedMsg').textContent='Datos borrados.'; }; };

// ---------- Botones flotantes de capas y leyenda ----------
function cerrarPops(){ document.querySelectorAll('.pop').forEach(p=>p.classList.remove('open')); document.querySelectorAll('.fab').forEach(f=>{ f.classList.remove('on'); f.setAttribute('aria-expanded','false'); }); }
document.querySelectorAll('.fab').forEach(f=>f.addEventListener('click',e=>{ e.stopPropagation(); const p=document.getElementById(f.dataset.pop); const abrir=!p.classList.contains('open'); cerrarPops(); if(abrir) cerrarInfo(); if(abrir){ p.classList.add('open'); f.classList.add('on'); f.setAttribute('aria-expanded','true'); } }));
document.querySelectorAll('.pop').forEach(p=>{ p.addEventListener('click',e=>e.stopPropagation()); p.addEventListener('mousedown',e=>e.stopPropagation()); p.addEventListener('wheel',e=>e.stopPropagation()); });
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=cerrarPops);
$('#semPanel').addEventListener('click',e=>{ if(e.target.closest('[data-close-sem]')) cerrarSemaforo(); else onAct(e); e.stopPropagation(); });
['mousedown','wheel','dblclick','keydown'].forEach(ev=>$('#semPanel').addEventListener(ev,e=>e.stopPropagation()));
$('#infoPanel').addEventListener('click',e=>{ if(e.target.closest('[data-close-info]')) cerrarInfo(); else onAct(e); e.stopPropagation(); });
['mousedown','wheel','dblclick'].forEach(ev=>$('#infoPanel').addEventListener(ev,e=>e.stopPropagation()));
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ cerrarPops(); cerrarInfo(); cerrarSemaforo(); } });
$('#map').addEventListener('mousedown',cerrarPops);
function contarCapas(){ $('#layerCount').textContent=document.querySelectorAll('#layers input[type=checkbox]:checked').length; }
document.querySelectorAll('#layers input[type=checkbox]').forEach(i=>i.addEventListener('change',contarCapas)); contarCapas(); if($('#legLogo')) $('#legLogo').src=BOMBEROS_LOGO;

// ---------- Chat desplegable ----------
const VM=$('#v-mapa'); const CHAT_MIN=320, chatMax=()=>Math.min(760,Math.round(window.innerWidth*0.6));
let CHATW=lsGet('colaire_chatw',420), CHAT_OFF=lsGet('colaire_chatoff',false), CHAT_SEEN=0;
function aplicarChat(){ CHATW=Math.max(CHAT_MIN,Math.min(chatMax(),CHATW)); VM.style.setProperty('--chatw',CHATW+'px'); VM.classList.toggle('chat-off',CHAT_OFF); VM.classList.toggle('wide',CHATW>=chatMax()-10);
  $('#chatWide').title=VM.classList.contains('wide')?'Reducir el chat':'Ampliar el chat'; lsSet('colaire_chatw',CHATW); lsSet('colaire_chatoff',CHAT_OFF);
  clearTimeout(aplicarChat.t); aplicarChat.t=setTimeout(()=>map&&map.invalidateSize(),300); }
function nuevosChat(){ const n=visibles('mensajes').length; if(!CHAT_OFF){ CHAT_SEEN=n; $('#chatNew').style.display='none'; return; } const d=n-CHAT_SEEN; $('#chatNew').style.display=d>0?'':'none'; $('#chatNew').textContent=d>99?'99+':d; }
$('#chatWide').onclick=()=>{ CHATW=VM.classList.contains('wide')?420:chatMax(); aplicarChat(); };
$('#chatClose').onclick=()=>{ CHAT_SEEN=visibles('mensajes').length; CHAT_OFF=true; aplicarChat(); };
$('#chatOpen').onclick=()=>{ CHAT_OFF=false; CHAT_FORCE=true; aplicarChat(); renderAll(); };
$('#grip').addEventListener('mousedown',e=>{ e.preventDefault(); VM.classList.add('dragging'); const x0=e.clientX, w0=CHATW;
  const mv=ev=>{ CHATW=w0+(x0-ev.clientX); aplicarChat(); }; const up=()=>{ VM.classList.remove('dragging'); document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up); map&&map.invalidateSize(); };
  document.addEventListener('mousemove',mv); document.addEventListener('mouseup',up); });
window.addEventListener('resize',aplicarChat); aplicarChat();

// ---------- Render ----------
let RQ=false;
function renderAll(){ if(RQ) return; RQ=true; requestAnimationFrame(()=>{ RQ=false; if(!document.body.classList.contains('auth')) return;
  renderHeader(); renderTimeline(); renderMap(); renderChat(); nuevosChat(); refrescarInfo(); pintarSemaforos(); refrescarSemaforo(); renderReportes(); renderBadge(); checkToasts();
  if($('#v-perfil').classList.contains('on')) renderPerfil(false); if($('#v-notif').classList.contains('on')) renderNotif(); }); }
loadLocal(); initMap(); renderNec();
if(SES&&yo()) entrar();
setInterval(()=>{ if(MODO==='vivo') renderAll(); },30000);
initDB().then(()=>{ if(SES&&yo()&&!document.body.classList.contains('auth')) entrar(); });
