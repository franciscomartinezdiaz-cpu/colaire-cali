@echo off
chcp 65001 >nul
title ColAIre - Cali Resiliente
cd /d "%~dp0"
echo.
echo   ColAIre - Inteligencia Ambiental para Colombia
echo   ----------------------------------------------
where docker >nul 2>nul || (echo   [X] No encuentro Docker. Instala Docker Desktop: https://www.docker.com/products/docker-desktop/ & pause & exit /b 1)
docker info >nul 2>nul || (echo   [X] Docker Desktop no esta abierto. Abrelo, espera a que diga "running" y vuelve a ejecutar. & pause & exit /b 1)
if not exist ".env" (copy ".env.example" ".env" >nul & echo   [i] Cree el archivo .env. Pon ahi tu GEMINI_API_KEY y vuelve a ejecutar si quieres IA.)
echo   [..] Levantando n8n y la plataforma (la primera vez descarga imagenes, puede tardar)...
docker compose up -d || (echo   [X] Fallo docker compose. & pause & exit /b 1)
echo   [..] Esperando a n8n...
powershell -NoProfile -Command "for($i=0;$i -lt 60;$i++){try{Invoke-WebRequest -UseBasicParsing http://localhost:5678/healthz -TimeoutSec 2 | Out-Null; exit 0}catch{Start-Sleep 2}}; exit 1"
echo.
echo   Listo:
echo     Plataforma  http://localhost:8080
echo     n8n         http://localhost:5678   (la primera vez crea tu usuario)
echo.
start "" http://localhost:8080
start "" http://localhost:5678
pause
