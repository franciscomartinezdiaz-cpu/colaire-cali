# Correr ColAIre sin Docker

**Solo la plataforma** (sin n8n; usa el motor local):

```bash
cd web
python -m http.server 8080      # Windows: py -m http.server 8080
```
Abre http://localhost:8080

**n8n sin Docker** (requiere Node.js 20+), en otra terminal:

```bash
npx n8n
```
En http://localhost:5678 crea tu usuario, ve a *Workflows → Import from File* y elige `n8n/workflows/colaire_flujo.json`.
Como así n8n no lee el `.env`, abre el nodo **Configuración y entrada** y escribe tu clave de Gemini directamente en `E('GEMINI_API_KEY')` → `'TU_CLAVE'`. Activa el flujo.
