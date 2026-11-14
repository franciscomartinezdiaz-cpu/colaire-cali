# Arquitectura

```
Navegador (web/)                      n8n (docker)
┌───────────────────────────┐  POST   ┌──────────────────────────────────────────┐
│ Chat ciudadano            │ ──────▶ │ Webhook /colaire-mensaje                 │
│ Motor local (respaldo)    │         │ Gemini → Overpass/Nominatim → Ruteo      │
│ Mapa: comunas, barrios,   │ ◀────── │ Respuesta JSON  ·  Alertas por Telegram  │
│ salud, bomberos, semáforos│  JSON   └──────────────────────────────────────────┘
└───────────────────────────┘
```

**Contrato de la respuesta de n8n:** `{ ok, motor, modelo, tipo, urgencia, categoria, items, personal, resumen, ubic:{lat,lon,label,fuente}, notificados:[roles], telegram:{enviados}, errorIA }`

**Archivos de la web:** `index.html` (interfaz) · `config.js` (URL de n8n) · `js/core.js` (interpretación y malla vial) · `js/mapa_osm.js` (capas base y búsqueda OSM) · `js/app.js` (aplicación) · `data/*.js` (capas).

Los datos de usuarios, mensajes y reportes se guardan en el navegador (localStorage). Para compartirlos entre equipos, el siguiente paso es que n8n los guarde en una base de datos (Supabase/Postgres).
