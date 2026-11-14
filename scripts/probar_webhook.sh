#!/usr/bin/env bash
# Envía un mensaje de prueba al flujo de n8n y muestra la respuesta
curl -s -X POST http://localhost:5678/webhook/colaire-mensaje \
  -H 'Content-Type: application/json' \
  -d '{"texto":"Necesito ayuda en mariano ramos, mi mamá quedó atrapada en el supermercado D1 y esta estructura colapsó","autor":"ciudadano3@colaire.test","nombre":"Ciudadana 3","rol":"ciudadano","ts":1786365600000,"local":{"clas":{"tipo":"emergencia","urgencia":"rojo","categoria":"colapso","items":[]},"candidatos":[{"lat":3.40326,"lon":-76.51711,"label":"Barrio Mariano Ramos (Comuna 16)","conf":"alta"}]}}'
echo
