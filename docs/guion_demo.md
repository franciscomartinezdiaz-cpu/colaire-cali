# Guion de demo (5 minutos)

1. **Inicio (30 s).** Pantalla de acceso: "ColAIre – Inteligencia Ambiental para Colombia". Entrar como `ciudadano3@colaire.test` / `colaire2026`.
2. **Escenario (1 min).** Reportes ciudadanos → *Cargar escenario del 10 de agosto*. Mapa y chat → **⟲ Reiniciar** (velocidad x120). Los mensajes llegan a su hora; mostrar capas (🚒 bomberos, 🏥 salud, 🚦 semáforos).
3. **Chat en vivo con n8n (1,5 min).** Con la simulación en pausa, escribir:
   *"Necesito ayuda en mariano ramos, mi mamá quedó atrapada en el supermercado D1 y esta estructura colapsó"*.
   Abrir **Ver flujo de datos**: n8n · Gemini, ubicación, entidades, 🚒 estación más cercana, 🏥 hospital más cercano, 📨 alerta en Telegram (mostrar el celular).
4. **Ayuda solidaria (45 s).** *"Se necesitan voluntarios con palas en Mariano Ramos"* → punto 🙋. Otra cuenta: *"Tenemos agua para donar en El Ingenio"* → 🤝.
5. **Entidad (45 s).** Salir y entrar como `saludcali@colaire.test`: Notificaciones con contador; marcar un reporte **En atención** → **Atendido**.
6. **Cierre (30 s).** Limitaciones: datos de referencia (POT 2014, satelitales), ubicaciones aproximadas, no reemplaza la línea 123.
