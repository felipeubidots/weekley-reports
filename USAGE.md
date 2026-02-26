# 📖 Guía de Uso

## Flujo Básico

### 1. Preparar (primera vez)

```bash
# Clonar/navegar a la carpeta
cd /c/Work/weeklyreports

# Instalar dependencias
npm install

# Copiar template de configuración
cp .env.example .env

# ⚠️ IMPORTANTE: Editar .env con tus tokens
# Ver SETUP.md para instrucciones detalladas
```

### 2. Verificar Conexión

```bash
npm run test:connection
```

**Resultado esperado:**
```
✅ Slack connection successful
✅ Shortcut connection successful
✅ All connections OK
```

### 3. Generar Reporte

```bash
# Opción 1: Previsualizar antes de enviar
npm run report:dry

# Opción 2: Generar y enviar a Slack
npm run report

# Opción 3: Guardar en archivo
npm run report -- --save ./weekly-report.json
```

---

## Escenarios de Uso

### Escenario 1: Reporte Semanal Estándar

```bash
# Generar reporte de la última semana
npm run report

# Esto:
# ✓ Obtiene tareas vencidas de los últimos 7 días
# ✓ Calcula métricas de épicas
# ✓ Detecta canales #temp sin actividad
# ✓ Envía el reporte formateado a Slack
```

### Escenario 2: Reporte de Quincena

```bash
# Reporte de los últimos 14 días
npm run report -- --days 14

# Resultado:
# ✓ Incluye más datos históricos
# ✓ Mejor para análisis de tendencias
```

### Escenario 3: Reporte Estricto

```bash
# Solo tareas vencidas hace más de 5 días
npm run report -- --overdue 5

# Uso:
# ✓ Reducir ruido
# ✓ Enfocarse en problemas críticos
```

### Escenario 4: Audit de Canales

```bash
# Canales inactivos hace más de 14 días
npm run report -- --inactive 14

# Uso:
# ✓ Limpiar canales abandonados
# ✓ Encontrar temporales que no se usan
```

### Escenario 5: Reporte Guardado

```bash
# Generar y guardar en archivo
npm run report -- --save ./reports/week-$(date +%Y-%m-%d).json

# Crea un historial de reportes
# Útil para análisis a lo largo del tiempo
```

---

## Ejemplos Prácticos

### Ejemplo 1: Reporte Semanal Normal

```bash
npm run report
```

**Salida esperada en Slack:**

```
📊 Reporte Semanal (19 Feb 2026 - 26 Feb 2026)

🔴 Tareas vencidas: 12
📈 Épicas: 5 (con métricas de tiempo)
⚠️ Canales inactivos: 3

🔴 Tareas Vencidas
Juan
5 tareas | Promedio: 10d
• Tarea 1 (10d)
• Tarea 2 (8d)
• Tarea 3 (7d)
+ 2 más

María
3 tareas | Promedio: 5d
...

📈 Métricas por Épica (Estimado vs Real)
Épica                 | Est(h) | Real(h) | Diff(h) | %
Dashboard            | 80     | 95     | +15    | +19%
Mobile App           | 120    | 105    | -15    | -12%
...

⚠️ Canales #temp sin actividad
#temp-design-review
14 días sin actividad
Última actividad: 12 de febrero de 2026

Generado: 26 de febrero de 2026 10:45 | Tiempo: 2.3s
```

### Ejemplo 2: Previsualizar sin Enviar

```bash
npm run report:dry
```

**Output:**
```json
{
  "type": "header",
  "text": {
    "type": "plain_text",
    "text": "📊 Reporte Semanal (19 Feb 2026 - 26 Feb 2026)",
    "emoji": true
  }
},
...
```

Permite revisar antes de enviar a Slack.

### Ejemplo 3: Guardar para Archivo

```bash
npm run report -- --save ./reports/report-2026-02-26.json
```

**Resultado:**
```
💾 Reporte guardado en: /c/Work/weeklyreports/reports/report-2026-02-26.json
```

**Contenido del archivo:**
```json
{
  "metadata": {
    "generatedAt": "2026-02-26T10:45:00.000Z",
    "executionTimeMs": 2300,
    "reportPeriod": {
      "start": "2026-02-19T10:45:00.000Z",
      "end": "2026-02-26T10:45:00.000Z"
    }
  },
  "overdueTasks": {
    "total": 12,
    "byOwner": [...],
    "allTasks": [...]
  },
  "epicMetrics": [...],
  "slackChannels": {...}
}
```

---

## Opciones Avanzadas

### Cambiar Umbrales

```bash
# Solo tareas vencidas > 3 días
npm run report -- --overdue 3

# Canales sin actividad > 30 días
npm run report -- --inactive 30

# Combinar opciones
npm run report -- --days 30 --overdue 10 --inactive 14
```

### Logging Detallado

```bash
# Ver información de debug
LOG_LEVEL=debug npm run report

# Tipos de log: debug, info, warn, error
LOG_LEVEL=error npm run report  # Solo errores
```

### Modo Desarrollo

```bash
# Sin compilar (ejecuta TypeScript directamente)
npm run dev

# Útil para testing rápido
```

---

## Casos de Uso Empresariales

### Para Managers/PMs

```bash
# Reporte completo semanal
npm run report

# Monitorear sobrecarga de trabajo
npm run report -- --overdue 1  # Tareas apenas vencidas
```

### Para DevOps/Leads Técnicos

```bash
# Épicas y métricas de velocidad
npm run report -- --days 30

# Guardar histórico
npm run report -- --save ./reports/week-$(date +%Y-w%V).json
```

### Para Gestión de Proyectos

```bash
# Canales #temp para revisar
npm run report -- --inactive 1  # Muy sensible

# Más relajado para limpieza mensual
npm run report -- --inactive 30 --days 60
```

---

## Automatización (Futuro)

### Con cron en Linux/Mac

```bash
# Ejecutar cada lunes a las 9 AM
0 9 * * 1 cd /c/Work/weeklyreports && npm run report >> logs/cron.log 2>&1
```

### Con Task Scheduler en Windows

```batch
# PowerShell
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At "09:00"
$action = New-ScheduledTaskAction -Execute "npm" -Argument "run report" -WorkingDirectory "C:\Work\weeklyreports"
Register-ScheduledTask -TaskName "WeeklyReports" -Trigger $trigger -Action $action
```

---

## Tips y Mejores Prácticas

### ✅ Buenas Prácticas

1. **Ejecuta `test:connection` regularmente**
   ```bash
   npm run test:connection
   ```

2. **Usa `--dry-run` primero**
   ```bash
   npm run report:dry
   npm run report  # Después si se ve bien
   ```

3. **Guarda reportes históricos**
   ```bash
   npm run report -- --save ./reports/$(date +%Y-%m-w%V).json
   ```

4. **Monitorea logs**
   ```bash
   LOG_LEVEL=info npm run report
   ```

5. **Actualiza tokens periódicamente** (cada 90 días)

### ❌ Evita

1. ❌ No guardes `.env` en git
2. ❌ No compartas tokens por email/chat
3. ❌ No modificues tokens manualmente
4. ❌ No ejecutes reportes muy frecuentemente (rate limits)
5. ❌ No ignores mensajes de error

---

## Resolución de Problemas Comunes

### "No se envió el reporte"

```bash
# Verificar:
npm run test:connection

# Si falla, revisar:
# - SLACK_BOT_TOKEN en .env
# - SLACK_REPORT_CHANNEL_ID correcto
# - Bot está en el canal
```

### "Reporte vacío"

```bash
# Probar con más datos:
npm run report -- --days 30 --overdue 1

# Verificar:
# - Hay tareas vencidas en Shortcut
# - Hay épicas con historias
# - Hay canales #temp
```

### "Timeout o error de conexión"

```bash
# Revisar:
npm run test:connection

# Si fallan APIs:
# - Verificar estado en status.slack.com
# - Verificar status.app.shortcut.com
# - Revisar conexión a internet
```

---

## Referencia Rápida

```bash
# Instalación y setup
npm install
cp .env.example .env
# ⚠️ Editar .env con tokens
npm run test:connection

# Uso básico
npm run report              # Generar y enviar
npm run report:dry          # Previsualizar
npm run test:connection     # Verificar conexión

# Opciones avanzadas
npm run report -- --days 14                    # 14 días
npm run report -- --overdue 5                  # Tareas vencidas > 5d
npm run report -- --inactive 30                # Canales inactivos > 30d
npm run report -- --save ./report.json         # Guardar en archivo
npm run report -- --dry-run --save ./r.json   # Previsualizar y guardar

# Desarrollo
npm run dev              # Ejecutar con ts-node
npm run build            # Compilar TypeScript
npm run lint             # Validar código
npm run format           # Formatear código

# Logging
LOG_LEVEL=debug npm run report   # Ver detalles
LOG_LEVEL=error npm run report   # Solo errores
```

---

## Soporte Adicional

- 📖 Documentación completa: `README.md`
- 🔧 Configuración: `SETUP.md`
- 🐛 Troubleshooting: `TROUBLESHOOTING.md`
- 📚 APIs: [Shortcut Docs](https://developer.shortcut.com/) | [Slack Docs](https://api.slack.com/)

---

**¡Listo para usar!** 🚀
