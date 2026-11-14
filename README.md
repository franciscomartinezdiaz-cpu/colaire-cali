# ColAIre · Cali Resiliente

**Inteligencia Ambiental para Colombia** · *El aire es de todos. Los datos también.*

Plataforma de participación ciudadana para la respuesta a réplicas del sismo del 10 de agosto de 2026 (DataBridge Hack 2026):
chat ciudadano interpretado con IA, georreferenciación, alertas a entidades por Telegram, ayuda solidaria y capas de salud, bomberos y semáforos.

## Opción 1 · n8n Cloud (sin instalar nada)

1. En https://colaire.app.n8n.cloud → **Create workflow** → menú **⋯** → **Import from File** → `n8n/workflows/colaire_flujo_cloud.json`.
2. Abre el nodo **Configuración y entrada** y pega tu `GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN` y el `chat_id` en `TELEGRAM_CHATS.default`.
3. Guarda y **activa/publica** el flujo.
4. Abre `web/index.html` con doble clic (ya apunta a `https://colaire.app.n8n.cloud/webhook/colaire-mensaje`).
   Abajo del chat, **Motor → Probar conexión**.

## Opción 2 · Todo local con Docker (un comando)

1. Instala y abre **Docker Desktop** (https://www.docker.com/products/docker-desktop/).
2. Descomprime esta carpeta en **Documentos** (`Documentos/colaire-cali`).
3. Ejecuta:
   - **Windows:** doble clic en `iniciar.bat`
   - **Mac / Linux:** en una terminal dentro de la carpeta, `bash iniciar.sh`
   - o directamente: `docker compose up -d`
4. Se abren:
   - **Plataforma:** http://localhost:8080 (usuario `ciudadano1@colaire.test`, contraseña `colaire2026`)
   - **n8n:** http://localhost:5678 (la primera vez te pide crear un usuario)

El flujo de n8n se **importa y activa solo**. La plataforma ya viene apuntando a `http://localhost:5678/webhook/colaire-mensaje`
(lo ves abajo del chat: **Motor: n8n**). Si n8n no responde, usa su motor local y la demo sigue.

## Activar la IA y las alertas por Telegram

Edita el archivo **`.env`** (se crea solo la primera vez) y reinicia con `docker compose up -d`:

| Variable | Qué es |
|---|---|
| `GEMINI_API_KEY` | Clave gratis en https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | Modelo de Gemini (por defecto `gemini-2.5-flash`) |
| `TELEGRAM_BOT_TOKEN` | Token del bot creado con **@BotFather** (`/newbot`) |
| `TELEGRAM_CHAT_DEFAULT` | `chat_id` del grupo "Sala de crisis" |
| `TELEGRAM_CHAT_SALUD`, `_BOMBEROS`, … | Opcional: un grupo por entidad |

**Cómo sacar el `chat_id`:** agrega el bot a tu grupo, escribe cualquier mensaje y abre
`https://api.telegram.org/bot<TU_TOKEN>/getUpdates`. Copia el número de `"chat":{"id": -100...}`.

Sin `GEMINI_API_KEY` el flujo funciona igual con las reglas locales; sin Telegram, simplemente no envía alertas.

## Reporte de semáforos dañados (correo a Jhinna)

En el mapa, activa **🚦 Semáforos**, haz clic en uno y pulsa **⚠ Reportar semáforo dañado**.
La Secretaría de Movilidad (`secretariamov@colaire.test`) recibe la notificación al instante y n8n envía un correo con la ubicación y la hora.

- **n8n Cloud:** importa `n8n/workflows/colaire_semaforos_cloud.json`, abre **Preparar correo** y pega el correo de Jhinna,
  luego en **Enviar correo a Jhinna (Gmail)** crea la credencial de Gmail (botón *Sign in with Google*) y **activa** el flujo.
- **Docker:** pon `CORREO_JHINNA` en `.env`. La credencial de Gmail en n8n local requiere configurar OAuth de Google;
  si es complicado, reemplaza ese nodo por **Send Email (SMTP)**.

La plataforma lo llama en la misma instancia que el chat, cambiando `colaire-mensaje` por `colaire-semaforo`
(o en `web/config.js` con `n8nSemaforosUrl`).

## Probar el webhook

- Mac/Linux: `bash scripts/probar_webhook.sh`
- Windows: `powershell -File scripts\probar_webhook.ps1`

## Estructura

```
colaire-cali/
├── iniciar.bat / iniciar.sh     ← arranque en un clic
├── detener.bat / detener.sh
├── docker-compose.yml           ← n8n + servidor web
├── .env.example                 ← claves (se copia a .env)
├── web/                         ← la plataforma
│   ├── index.html · config.js
│   ├── js/   core.js · mapa_osm.js · app.js
│   ├── data/ geo_cali.js · semaforos.js · salud.js · bomberos.js
│   └── img/  logos
├── n8n/workflows/colaire_flujo.json
├── datos/                       ← GeoJSON de salud y bomberos
├── docs/  guion_demo.md · arquitectura.md
└── scripts/ probar_webhook · sin_docker.md
```

## Problemas comunes

- **"Motor: local" aunque n8n esté arriba:** abre http://localhost:5678, entra al flujo *ColAIre · Chat ciudadano* y verifica que esté **Active**.
  En el chat, toca *Motor* → *Probar conexión*.
- **El flujo no aparece en n8n:** `docker compose down -v` y `docker compose up -d` (reimporta desde cero).
- **Error de Gemini por el modelo:** cambia `GEMINI_MODEL` en `.env` por el que muestre AI Studio.
- **Sin Docker:** ver `scripts/sin_docker.md`.

## Créditos y fuentes

Comunas, barrios, semáforos: repo `tangara_2026_v2` (DANE, Alcaldía de Cali, OpenStreetMap) · Salud: POT Cali (IDESC) ·
Bomberos: bomberoscali.org · Mapas base: CARTO y Esri con datos de OpenStreetMap.

Prototipo de demostración: **no reemplaza la línea de emergencias 123**. Ubicaciones y urgencias son estimaciones automáticas.
