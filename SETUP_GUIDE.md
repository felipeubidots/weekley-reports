# Guía de Configuración: Sistema de Monitoreo Unificado

## Descripción General

Este sistema automatiza el monitoreo de tareas vencidas en Shortcut y ClickUp, consolidando métricas y enviando alertas a Slack.

**Archivos generados:**
- `unified_monitoring_report.md` - Reporte detallado en Markdown
- `migration_data.json` - Datos estructurados en JSON
- `unified_monitor.js` - Script de automatización
- `MIGRATION_SUMMARY.txt` - Resumen ejecutivo
- `SETUP_GUIDE.md` - Esta guía

---

## 1. Requisitos Previos

### 1.1 Software
- Node.js 14.0+
- npm o yarn
- Bash/Terminal

### 1.2 Acceso a APIs

Necesitarás obtener los siguientes tokens (ver instrucciones en SETUP.md):

- **Shortcut API Token** - (obtener desde Shortcut)
- **ClickUp API Token** - (obtener desde ClickUp)
- **Slack Bot Token** - (obtener desde Slack API)
- **Slack Channel ID** - (disponible en tu workspace de Slack)

---

## 2. Instalación Local

### 2.1 Clonar o descargar archivos

```bash
cd /work/weeklyreports
ls -la
```

Archivos esperados:
```
├── unified_monitoring_report.md
├── migration_data.json
├── unified_monitor.js
├── MIGRATION_SUMMARY.txt
└── SETUP_GUIDE.md
```

### 2.2 Instalar dependencias

```bash
npm install axios dotenv
```

Opcionales para automatización:
```bash
npm install node-cron    # Para programación de tareas
npm install pm2 -g       # Para mantener el proceso ejecutándose
```

### 2.3 Configurar variables de entorno

Crear archivo `.env`:

```bash
cat > .env << 'EOF'
# Shortcut
SHORTCUT_API_TOKEN=sct_rw_ubidots_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# ClickUp
CLICKUP_TOKEN=pk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Slack
SLACK_BOT_TOKEN=xoxb-XXXXXXXXXXXX-XXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXX
SLACK_REPORT_CHANNEL_ID=CXXXXXXXXXX
EOF
```

---

## 3. Uso del Script de Monitoreo

### 3.1 Ejecución manual

```bash
# Ejecutar una vez
node unified_monitor.js
```

Salida esperada:
```
========================================
Iniciando Monitoreo Unificado
========================================

[1/5] Obteniendo tareas de Shortcut...
      ✓ X tareas encontradas

[2/5] Obteniendo tareas de ClickUp...
      ✓ X tareas encontradas

[3/5] Detectando duplicados...
      ✓ X duplicados detectados

[4/5] Consolidando métricas...
      ✓ Métricas consolidadas

[5/5] Enviando reporte a Slack...
      ✓ Reporte enviado

========================================
Monitoreo Completado Exitosamente
========================================
```

### 3.2 Programación con cron (Linux/Mac)

```bash
# Editar crontab
crontab -e

# Agregar entrada para ejecutar diariamente a las 9 AM
0 9 * * * cd /work/weeklyreports && node unified_monitor.js >> logs/monitor.log 2>&1
```

### 3.3 Programación con PM2 (Recomendado)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Crear archivo de configuración ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'unified-monitor',
    script: './unified_monitor.js',
    instances: 1,
    exec_mode: 'fork',
    cron_restart: '0 9 * * *',  // 9 AM diariamente
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/error.log',
    out_file: './logs/output.log'
  }]
};
EOF

# Crear directorio de logs
mkdir -p logs

# Iniciar con PM2
pm2 start ecosystem.config.js

# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs unified-monitor

# Guardar configuración de PM2
pm2 save
pm2 startup
```

### 3.4 Programación con Node Cron (Alternativa)

Crear archivo `monitor_daemon.js`:

```javascript
const cron = require('node-cron');
const UnifiedMonitor = require('./unified_monitor');

require('dotenv').config();

const monitor = new UnifiedMonitor({
  shortcutToken: process.env.SHORTCUT_API_TOKEN,
  clickupToken: process.env.CLICKUP_TOKEN,
  slackToken: process.env.SLACK_BOT_TOKEN,
  slackChannelId: process.env.SLACK_REPORT_CHANNEL_ID
});

// Ejecutar diariamente a las 9:00 AM
cron.schedule('0 9 * * *', () => {
  console.log('Ejecutando monitoreo programado...');
  monitor.runFullMonitoring().catch(console.error);
});

console.log('Daemon iniciado. Esperando horario programado...');
```

Ejecutar:
```bash
node monitor_daemon.js &
```

---

## 4. Interpretación de Resultados

### 4.1 Reporte en Markdown

El archivo `unified_monitoring_report.md` contiene:

- **Sección 1-2:** Exploración de infraestructura
- **Sección 3-5:** Análisis de tareas
- **Sección 6-7:** Recomendaciones de migración
- **Sección 8-10:** Datos técnicos de referencia

**Cómo usar:**
```bash
# Abrir en navegador
open unified_monitoring_report.md

# O ver en terminal
cat unified_monitoring_report.md | less
```

### 4.2 Datos JSON

El archivo `migration_data.json` es máquina-legible para integración:

```bash
# Consultar con jq
cat migration_data.json | jq '.summary'

# Extraer tareas vencidas
cat migration_data.json | jq '.overdue_tasks'

# Obtener tareas para migrar
cat migration_data.json | jq '.tasks_only_in_clickup[] | {custom_id, name, priority}'
```

### 4.3 Alertas de Slack

El sistema envía automáticamente:

- **Estado general:** Verde (sin vencidas) o Rojo (hay vencidas)
- **Métricas:** Conteos de tareas en cada plataforma
- **Detalles:** Top 10 tareas vencidas
- **Duplicados:** Tareas duplicadas con similitud

---

## 5. Integración con Sistemas Externos

### 5.1 Zapier / IFTTT

```javascript
// Webhook para enviar a Zapier
const zapierWebhook = 'https://hooks.zapier.com/hooks/catch/...';

axios.post(zapierWebhook, metrics)
  .then(() => console.log('Datos enviados a Zapier'))
  .catch(error => console.error('Error:', error));
```

### 5.2 Google Sheets

```javascript
// Usando google-sheets-api
const {GoogleSpreadsheet} = require('google-spreadsheet');

async function updateSheets(metrics) {
  const doc = new GoogleSpreadsheet(process.env.SHEET_ID);
  await doc.useServiceAccountAuth(require('./creds.json'));

  const sheet = doc.sheetsByIndex[0];
  await sheet.addRow(metrics.summary);
}
```

### 5.3 Dashboard Personalizado

```bash
# Servir dashboard local
npm install express
```

Crear `dashboard.js`:

```javascript
const express = require('express');
const app = express();

app.get('/api/metrics', async (req, res) => {
  const metrics = require('./migration_data.json');
  res.json(metrics);
});

app.listen(3000, () => {
  console.log('Dashboard en http://localhost:3000');
});
```

---

## 6. Troubleshooting

### 6.1 Error: "Invalid API Token"

```bash
# Verificar tokens en .env
cat .env

# Regenerar token en Shortcut
# 1. Ir a Settings > API Tokens
# 2. Crear nuevo token
# 3. Actualizar en .env
```

### 6.2 Error: "No results found"

```bash
# Verificar que haya tareas vencidas
# El filtro busca tareas con deadline <= hoy

# Para debug, agregar logs:
console.log('Parámetros de búsqueda:', {
  due_date_to: today,
  statuses: ['active', 'unstarted']
});
```

### 6.3 Error: "Slack API error"

```bash
# Verificar permisos del bot en Slack
# 1. Ir a Slack > Manage Apps
# 2. Seleccionar bot
# 3. Verificar permisos: chat:write, chat:postMessage
```

### 6.4 Logs no se guardan

```bash
# Crear directorio de logs
mkdir -p /work/weeklyreports/logs

# Cambiar permisos
chmod 755 /work/weeklyreports/logs

# Redirigir manualmente
node unified_monitor.js 2>&1 | tee logs/$(date +%Y-%m-%d).log
```

---

## 7. Mantenimiento

### 7.1 Rotación de logs

```bash
# Crear script de rotación
cat > rotate_logs.sh << 'EOF'
#!/bin/bash
cd /work/weeklyreports/logs
find . -name "*.log" -mtime +30 -delete  # Eliminar logs > 30 días
gzip -9 *.log 2>/dev/null  # Comprimir logs
EOF

chmod +x rotate_logs.sh

# Agendar en cron
0 2 * * 0 /work/weeklyreports/rotate_logs.sh
```

### 7.2 Verificación mensual

```bash
# Primer lunes de cada mes, revisar:
1. Espacios/equipos nuevos en ClickUp o Shortcut
2. Cambios en estructura de tareas
3. Nuevas integraciones necesarias
4. Actualizar documentación
```

### 7.3 Actualización de espacios monitoreados

Si agregan nuevos espacios en ClickUp:

```javascript
// En unified_monitor.js, actualizar:
this.clickupSpaces = {
  productDelivery: '90139458035',
  operations: '90131694508',
  newSpace: 'nuevo-id-aqui'  // Agregar
};
```

---

## 8. Mejoras Futuras

### 8.1 Características planeadas

- [ ] Dashboard web en tiempo real
- [ ] Webhooks bidireccionales (Shortcut ↔ ClickUp)
- [ ] Machine Learning para predicción de retrasos
- [ ] Reportes PDF automáticos
- [ ] Integración con Jira (si se agrega)
- [ ] Análisis de productividad por equipo

### 8.2 Optimizaciones

```javascript
// Caché para reducir llamadas API
const cache = new Map();

function getCached(key, ttl = 300000) {
  if (cache.has(key)) {
    const entry = cache.get(key);
    if (Date.now() - entry.timestamp < ttl) {
      return entry.value;
    }
  }
  return null;
}

function setCache(key, value) {
  cache.set(key, {
    value,
    timestamp: Date.now()
  });
}
```

---

## 9. Seguridad

### 9.1 Mejores prácticas

```bash
# NO hacer commit de .env
echo ".env" >> .gitignore
echo "logs/" >> .gitignore
echo "node_modules/" >> .gitignore

# Usar variables de entorno en producción
export SHORTCUT_API_TOKEN="..."
export CLICKUP_TOKEN="..."
export SLACK_BOT_TOKEN="..."
```

### 9.2 Rotación de tokens

Cambiar tokens cada 6 meses:

1. En Shortcut: Settings > API Tokens > Revoke
2. En ClickUp: Settings > API > Regenerate
3. Actualizar en .env y sistema
4. Documentar fecha de cambio

### 9.3 Acceso restringido

```bash
# Limitar permisos de archivo
chmod 600 .env
chmod 700 unified_monitor.js

# Auditoría de accesos
ls -la | grep -E "monitor|migration_data"
```

---

## 10. Contacto y Soporte

**Equipo de Implementación:**
- Felipe Moreno (felipe@ubidots.com) - Product Lead
- Gustavo Díaz (gustavo.diaz@ubidots.com) - Technical Lead

**Documentación:**
- Reporte detallado: `unified_monitoring_report.md`
- Datos JSON: `migration_data.json`
- Script principal: `unified_monitor.js`

**Canales Slack:**
- #task-alerts - Alertas automáticas
- #migration-status - Estado de migración
- #critical-issues - Tareas críticas

---

## 11. Resumen de Comandos Útiles

```bash
# Instalación completa
npm install && npm install -g pm2

# Ejecutar monitoreo una vez
node unified_monitor.js

# Iniciar daemon con PM2
pm2 start ecosystem.config.js

# Ver logs en tiempo real
pm2 logs unified-monitor

# Detener monitor
pm2 stop unified-monitor

# Ver estado
pm2 status

# Limpiar logs antiguos
./rotate_logs.sh

# Ver últimas métricas
tail -50 logs/monitor.log

# Extraer tareas de migración urgentes
cat migration_data.json | jq '.migration_recommendations.immediate_actions'
```

---

## 12. Checklist de Implementación

- [ ] Instalar Node.js 14+
- [ ] Descargar/clonar archivos
- [ ] Ejecutar `npm install`
- [ ] Crear archivo `.env` con tokens
- [ ] Probar ejecución manual: `node unified_monitor.js`
- [ ] Configurar PM2 o cron para ejecución programada
- [ ] Verificar alertas en Slack
- [ ] Revisar reporte en markdown
- [ ] Documentar IDs de espacios/equipos nuevos
- [ ] Configurar rotación de logs
- [ ] Entrenar al equipo en el uso del sistema
- [ ] Programar revisiones mensuales

---

**Versión:** 1.0
**Última actualización:** 2026-02-26
**Próxima revisión:** 2026-03-26
