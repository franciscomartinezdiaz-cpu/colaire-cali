# Datos de ColAIre

| Archivo | Contenido | Fuente |
|---|---|---|
| `salud_cali.geojson` | 482 equipamientos de salud (polígonos) con tipo, nivel, público/privado y grupo de ícono | POT Cali (IDESC), convertido de MAGNA-SIRGAS / Cali (EPSG 6249) a WGS84 |
| `bomberos_cali.geojson` | 11 estaciones de Bomberos Voluntarios | bomberoscali.org/infraestructura-3 (pines oficiales de Google Maps; X9 aproximada) |
| `fallas_geologicas_cali.geojson` | 17 tramos de fallas dentro del perímetro urbano | Estructuras geológicas, IDESC |
| `edificaciones_centroides.geojson` | 5.146 edificaciones evaluadas (centroide, estado, pisos, índice de escombros, barrio oficial) | Datos prediales satelitales del hackatón |
| `resumen_danos_por_barrio.csv` | Daños por barrio oficial (342) y cercanía a fallas | Cálculo de ColAIre |

Comunas, barrios y semáforos vienen del repo `tangara_2026_v2` y están en `web/data/`.
Datos de referencia: verificar el funcionamiento de cada equipamiento después del sismo.
