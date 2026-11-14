# n8n · Flujo de ColAIre

- `workflows/colaire_flujo_cloud.json` → para **n8n Cloud** (colaire.app.n8n.cloud): las claves se pegan en el nodo *Configuración y entrada*.
- `workflows/colaire_flujo.json` → para **n8n con Docker** (lee las claves del archivo `.env`).
- `workflows/colaire_semaforos_cloud.json` / `colaire_semaforos.json` → reportes de **semáforos dañados**: correo a Jhinna (Gmail) con ubicación y hora. Webhook `/webhook/colaire-semaforo`.

`workflows/colaire_flujo.json` se importa y activa solo la primera vez que corre `docker compose up`.

Nodos: Webhook → Configuración (.env) → Prompt → Gemini → Fusionar IA → Overpass (cruce de calles)
→ Nominatim (lugar) → Elegir ubicación → Ruteo a entidades → Responder a la plataforma + Telegram.

Para volver a importarlo desde cero: `docker compose down -v` (borra los datos de n8n) y luego `docker compose up -d`.
Para importarlo a mano: n8n → Workflows → Import from File.
