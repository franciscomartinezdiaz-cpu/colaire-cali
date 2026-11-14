#!/usr/bin/env bash
# ColAIre · inicia n8n y la plataforma (Mac / Linux)
cd "$(dirname "$0")"
echo ""
echo "  ColAIre - Inteligencia Ambiental para Colombia"
echo "  ----------------------------------------------"
command -v docker >/dev/null || { echo "  [X] No encuentro Docker. Instala Docker Desktop: https://www.docker.com/products/docker-desktop/"; exit 1; }
docker info >/dev/null 2>&1 || { echo "  [X] Docker no está corriendo. Abre Docker Desktop y vuelve a intentar."; exit 1; }
[ -f .env ] || { cp .env.example .env; echo "  [i] Creé el archivo .env. Pon ahí tu GEMINI_API_KEY si quieres IA."; }
echo "  [..] Levantando n8n y la plataforma (la primera vez descarga imágenes, puede tardar)..."
docker compose up -d || { echo "  [X] Falló docker compose."; exit 1; }
echo "  [..] Esperando a n8n..."
for i in $(seq 1 60); do curl -fs http://localhost:5678/healthz >/dev/null 2>&1 && break; sleep 2; done
echo ""
echo "  Listo:"
echo "    Plataforma  http://localhost:8080"
echo "    n8n         http://localhost:5678   (la primera vez crea tu usuario)"
echo ""
( command -v open >/dev/null && open http://localhost:8080 ) || ( command -v xdg-open >/dev/null && xdg-open http://localhost:8080 ) || true
