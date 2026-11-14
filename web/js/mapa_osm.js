// ===== Mapa y geocodificación por internet (OpenStreetMap) =====
const OSM_BBOX={s:3.30,w:-76.60,n:3.52,e:-76.45};
const OSM_CACHE={};
function conTiempo(p,ms){ return Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),ms))]); }

// Capas base de internet
function capasBase(map){
  // Proveedores que funcionan aunque la página se abra como archivo local (sin dominio web).
  // tile.openstreetmap.org bloquea esas solicitudes, por eso no se usa directamente.
  const calles=L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{maxZoom:19,subdomains:'abcd',attribution:'&copy; OpenStreetMap &copy; CARTO'});
  const claro=L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:19,subdomains:'abcd',attribution:'&copy; OpenStreetMap &copy; CARTO'});
  const detalle=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Mapa &copy; Esri, HERE, Garmin, &copy; OpenStreetMap'});
  const sat=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Imágenes &copy; Esri, Maxar, Earthstar'});
  const satLbl=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,pane:'overlayPane',opacity:.9});
  const hibrido=L.layerGroup([sat,satLbl]);
  calles.addTo(map);
  // Si un proveedor falla (sin internet o bloqueado), se cambia solo al siguiente.
  const orden=[calles,detalle,claro]; let fallos=0;
  orden.forEach((capa,i)=>{ capa.on('tileerror',()=>{ if(!map.hasLayer(capa)) return; if(++fallos<6) return; fallos=0; const sig=orden[(i+1)%orden.length]; map.removeLayer(capa); sig.addTo(map); }); capa.on('tileload',()=>{ fallos=0; }); });
  return {'Mapa de calles':calles,'Calles detallado':detalle,'Mapa claro':claro,'Satélite':sat,'Satélite con nombres':hibrido};
}

// Gazetteer con los barrios reales (repo tangara_2026_v2)
function construirGazetteer(){
  if(typeof GEO_BARRIOS==='undefined') return;
  const SKIP=new Set(['el hoyo','la isla','popular','porvenir','la esperanza','la paz','la base','el piloto','la nueva base','los andes','el rodeo','la merced','el nacional','la alianza','el bosque','santa fe','fatima','la floresta','el troncal','la fortaleza','industrial']);
  const reEsc=(s)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const tit=(s)=>/[a-z]/.test(s)?s:s.toLowerCase().replace(/(^|[\s(.-])(\S)/g,(m,a,b)=>a+b.toUpperCase());
  const B=GEO_BARRIOS.features.map(f=>f.properties); const vistos=new Set(); const out=[];
  for(const b of [...B].sort((a,c)=>c.barrio.length-a.barrio.length)){
    const n=norm(b.barrio).replace(/^(urbanizacion|sector|barrio)\s+/,'').replace(/\s+(i{1,3}|iv|\d+a?\.?\s*etapa|primera etapa|segunda etapa|etapa.*)$/,'').replace(/\s+/g,' ').trim();
    if(n.length<4||SKIP.has(n)||vistos.has(n)) continue; vistos.add(n);
    out.push(['\\b'+reEsc(n)+'\\b',b.lat,b.lon,`Barrio ${tit(b.barrio)} (Comuna ${b.comuna})`]);
  }
  const sitios=LUGARES.filter(l=>!B.some(b=>new RegExp(l[0]).test(norm(b.barrio))));
  globalThis.LUGARES_OVERRIDE=out.concat(sitios);
}

// Expresión regular para el nombre de una vía en OpenStreetMap
function reVia(t,n,norte){
  const num=Math.floor(n), letra=(n%1)?' ?A':'( ?[A-H])?( ?Bis)?';
  const tipo=t==='C'?'(Avenida |Av[.]? )?(Calle|Cl[.]?)':t==='K'?'(Avenida |Av[.]? )?(Carrera|Cra[.]?|Kr[.]?)':'(Avenida|Av[.]?)';
  const suf=norte?' ?(Norte|N)':'( ?(Norte|N|Oeste|Sur))?';
  return `^${tipo} 0*${num}${letra}${suf}$`;
}
const OVERPASS=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
async function overpassCruce(a,b,estimado){
  const bb=`(${OSM_BBOX.s},${OSM_BBOX.w},${OSM_BBOX.n},${OSM_BBOX.e})`;
  const q=`[out:json][timeout:12];way["highway"]["name"~"${a}",i]${bb}->.a;way["highway"]["name"~"${b}",i]${bb}->.b;node(w.a)(w.b);out;`;
  for(const url of OVERPASS){
    try{
      const r=await conTiempo(fetch(url,{method:'POST',body:'data='+encodeURIComponent(q),headers:{'Content-Type':'application/x-www-form-urlencoded'}}),9000);
      if(!r.ok) continue; const j=await r.json(); const nodes=(j.elements||[]).filter(e=>e.type==='node');
      if(!nodes.length) return null;
      nodes.sort((x,y)=>distM(estimado,{lat:x.lat,lon:x.lon})-distM(estimado,{lat:y.lat,lon:y.lon}));
      const c=nodes.filter(x=>distM(nodes[0],x)<120); // promedio de las esquinas de la misma intersección
      return {lat:+(c.reduce((s,x)=>s+x.lat,0)/c.length).toFixed(6),lon:+(c.reduce((s,x)=>s+x.lon,0)/c.length).toFixed(6)};
    }catch(e){}
  }
  return null;
}
async function buscarLugar(texto){
  const m=norm(texto).match(/\b(?:en|cerca (?:a|de)|frente a|al lado de|junto a|barrio)\s+(?:la |el |los |las )?([a-z0-9 ]{4,40})/);
  if(!m) return [];
  const q=m[1].replace(/\b(hay|se|con|y|que|donde|porque|necesit\w*|urgente)\b.*$/,'').trim(); if(q.length<4) return [];
  const viewbox=`${OSM_BBOX.w},${OSM_BBOX.n},${OSM_BBOX.e},${OSM_BBOX.s}`;
  const local=location.protocol==='file:';
  if(!local) try{
    const r=await conTiempo(fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&countrycodes=co&bounded=1&viewbox=${viewbox}&q=${encodeURIComponent(q+', Cali')}`,{headers:{'Accept-Language':'es'}}),7000);
    if(r.ok){ const j=await r.json(); if(j.length) return j.slice(0,2).map(x=>({lat:+(+x.lat).toFixed(6),lon:+(+x.lon).toFixed(6),label:x.display_name.split(',').slice(0,3).join(','),conf:'OSM'})); }
  }catch(e){}
  try{
    const r=await conTiempo(fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q+' Cali')}&limit=3&lat=3.43&lon=-76.52&bbox=${OSM_BBOX.w},${OSM_BBOX.s},${OSM_BBOX.e},${OSM_BBOX.n}`),7000);
    if(r.ok){ const j=await r.json(); return (j.features||[]).slice(0,2).map(f=>({lat:+f.geometry.coordinates[1].toFixed(6),lon:+f.geometry.coordinates[0].toFixed(6),label:[f.properties.name,f.properties.district||f.properties.city].filter(Boolean).join(', '),conf:'OSM'})); }
  }catch(e){}
  return [];
}
// Devuelve candidatos mejorados con OpenStreetMap (si hay internet); si falla, los locales
async function geocodificarOSM(texto, locales){
  const key=norm(texto); if(OSM_CACHE[key]) return OSM_CACHE[key];
  const {vias,norte}=parseVias(texto);
  const C=vias.filter(v=>v.t==='C'),K=vias.filter(v=>v.t==='K'),A=vias.filter(v=>v.t==='A');
  const pares=[];
  if(C.length&&K.length) pares.push({a:reVia('C',C[0].n,norte),b:reVia('K',K[0].n,false),est:gridMain(C[0].n,K[0].n),label:`${viaLabel('C',C[0].n)} con ${viaLabel('K',K[0].n)}`});
  if(A.length&&C.length){
    const pm={a:reVia('C',A[0].n,false),b:reVia('K',C[0].n,false),est:gridMain(A[0].n,C[0].n),label:`${viaLabel('C',A[0].n)} con ${viaLabel('K',C[0].n)}`};
    const pn={a:reVia('A',A[0].n,true),b:reVia('C',C[0].n,true),est:gridNorte(C[0].n,A[0].n),label:`${viaLabel('A',A[0].n,true)} con ${viaLabel('C',C[0].n,true)}`};
    norte?pares.push(pn,pm):pares.push(pm,pn);
  }
  if(A.length&&K.length) pares.push({a:reVia('C',A[0].n,false),b:reVia('K',K[0].n,false),est:gridMain(A[0].n,K[0].n),label:`${viaLabel('C',A[0].n)} con ${viaLabel('K',K[0].n)}`});
  const osm=[];
  for(const p of pares.slice(0,2)){ const r=await overpassCruce(p.a,p.b,{lat:p.est[0],lon:p.est[1]}); if(r) osm.push({...r,label:p.label+' · OSM',conf:'OSM'}); }
  if(!osm.length && !(locales||[]).some(c=>c.conf==='alta')) osm.push(...await buscarLugar(texto));
  const res=[...osm]; for(const c of (locales||[])) if(!res.some(x=>distM(x,c)<150)) res.push(c);
  const out=res.slice(0,4); if(osm.length) OSM_CACHE[key]=out; return out;
}
