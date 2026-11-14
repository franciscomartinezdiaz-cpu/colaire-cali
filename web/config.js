// Configuración de la plataforma ColAIre.
// n8nUrl: webhook del flujo "ColAIre · Chat ciudadano" (se crea solo con docker compose).
// n8nActivo: true para procesar el chat con n8n; si n8n no responde, la plataforma usa su motor local.
window.COLAIRE_CONFIG = {
  n8nUrl: 'https://colaire.app.n8n.cloud/webhook/colaire-mensaje',   // n8n Cloud. Con Docker local: http://localhost:5678/webhook/colaire-mensaje
  n8nSemaforosUrl: 'https://colaire.app.n8n.cloud/webhook/colaire-semaforo', // flujo «ColAIre · Semáforos dañados» (correo a Jhinna)
  n8nActivo: true
};
