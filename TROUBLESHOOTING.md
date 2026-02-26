# 🔧 Guía de Troubleshooting

## Problemas Comunes y Soluciones

### Error: "SHORTCUT_API_TOKEN is required"

**Causa:** La variable de entorno no está definida o el archivo `.env` no existe.

**Solución:**
```bash
# 1. Crear .env desde el template
cp .env.example .env

# 2. Editar .env y añadir tu token
# SHORTCUT_API_TOKEN=sk_...

# 3. Verificar que no hay espacios alrededor del =
# ❌ SHORTCUT_API_TOKEN = sk_...
# ✅ SHORTCUT_API_TOKEN=sk_...

# 4. Intentar de nuevo
npm run test:connection
```

---

### Error: "Slack API returned error: invalid_auth"

**Causa:** El token de Slack es inválido, expirado o tiene permisos insuficientes.

**Solución:**
```bash
# 1. Verificar que el token empieza con xoxb-
# 2. Ir a https://api.slack.com/apps
# 3. Seleccionar tu app (Weekly Reports)
# 4. OAuth & Permissions → Copiar Bot User OAuth Token nuevamente
# 5. Actualizar SLACK_BOT_TOKEN en .env
# 6. Verificar permisos (ver sección de Permisos abajo)
# 7. Intentar: npm run test:connection
```

**Permisos requeridos:**
- `channels:read`
- `channels:history`
- `chat:write`

---

### Error: "Channel not found" o "not_in_channel"

**Causa:** El bot no está en el canal o el ID del canal es incorrecto.

**Solución:**
```bash
# 1. Obtener ID correctamente:
#    - En Slack, click derecho en el canal
#    - View channel details
#    - Copiar el Channel ID (empieza con C)

# 2. Invitar al bot al canal:
#    - En Slack, @ menciona al bot "Weekly Reports"
#    - O arrastra el bot al canal desde los detalles

# 3. Actualizar .env:
SLACK_REPORT_CHANNEL_ID=C_CORRECT_ID

# 4. Intentar: npm run test:connection
```

---

### Error: "Cannot find module '@slack/web-api'"

**Causa:** Las dependencias no están instaladas.

**Solución:**
```bash
# Instalar dependencias
npm install

# Si persiste, limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

---

### Error: "Reporte vacío o sin datos"

**Causa:** Las épicas no tienen historias, o no hay tareas vencidas.

**Solución:**
```bash
# 1. Verificar con dry-run:
npm run report -- --dry-run

# 2. Aumentar rango de días:
npm run report -- --days 30

# 3. Reducir umbral de tareas vencidas:
npm run report -- --overdue 1

# 4. Verificar en Shortcut que existen:
#    - Tareas con due_date en el pasado
#    - Épicas con historias

# 5. Ver logs detallados:
LOG_LEVEL=debug npm run report
```

---

### Error: "Timeout error" o "ECONNREFUSED"

**Causa:** Las APIs de Shortcut o Slack están caídas, o hay problemas de red.

**Solución:**
```bash
# 1. Verificar estado de APIs:
#    - Shortcut: status.app.shortcut.com
#    - Slack: status.slack.com

# 2. Verificar conexión a internet:
ping google.com

# 3. Aumentar timeout:
# Editar src/utils/http-client.ts:
# DEFAULT_TIMEOUT = 60000  // 60 segundos

# 4. Aumentar reintentos:
# DEFAULT_RETRIES = 5
```

---

### Error: "Rate limit exceeded"

**Causa:** Se hizo demasiadas requests a las APIs.

**Solución:**
```bash
# 1. El sistema ya tiene reintentos exponenciales
#    Esperar y reintentar automáticamente

# 2. Si persiste, esperar 5-10 minutos

# 3. Ver logs:
LOG_LEVEL=debug npm run report

# 4. En desarrollo, reducir cantidad de épicas:
#    Shortcut API limita a 100 requests/minuto
```

---

### El reporte se envía pero mal formateado en Slack

**Causa:** El Block Kit tiene caracteres que no se renderizan bien.

**Solución:**
```bash
# 1. Actualizar emojis en SlackFormatter
# 2. Reducir tamaño de mensajes
# 3. Usar markdown en lugar de HTML

# Ver ejemplo en: src/formatters/slack-formatter.ts
```

---

### Error: "TypeScript compilation failed"

**Causa:** Hay errores de tipos en el código.

**Solución:**
```bash
# 1. Ver error completo:
npm run build

# 2. Fijar tipos:
#    - Revisar tipos en src/formatters/types.ts
#    - Usar 'as' para castear si es necesario

# 3. Si es en testing:
npm run dev  # Ejecutar con ts-node en lugar de compilar
```

---

### Archivos muy grandes en reportes

**Causa:** Demasiadas épicas o tareas creando un mensaje gigante.

**Solución:**
```bash
# 1. Splitear en múltiples mensajes:
#    - Editar SlackFormatter para enviar en batches
#    - O crear múltiples canales

# 2. Limitar datos:
npm run report -- --days 7

# 3. Filtrar épicas sin actividad
#    Modificar ShortcutService para ignorar épicas vacías
```

---

## Debugging Avanzado

### Ver logs detallados

```bash
# Debug level
LOG_LEVEL=debug npm run report

# Guardar logs en archivo
LOG_LEVEL=debug npm run report > logs.txt 2>&1
```

### Probar cada componente por separado

```bash
# Test solo Slack
npm run test:connection

# Test generación sin envío
npm run report:dry

# Test con guardado en JSON
npm run report:dry -- --save debug.json
```

### Inspeccionar datos intermedios

```bash
# Editar src/services/report.service.ts
// Añadir logs antes de retornar
logger.debug('Report data:', {
  overdue: reportData.overdueTasks.total,
  epics: reportData.epicMetrics.length
});
```

---

## Problemas Específicos por Componente

### Shortcut

**Problema:** No se encuentran tareas vencidas

```bash
# 1. Verificar que el token funciona
npm run test:connection

# 2. Verificar que hay tareas con due_date pasada
# En Shortcut: Search for stories with due_date < today

# 3. Aumentar dias threshold
npm run report -- --overdue 1

# 4. Ver logs:
LOG_LEVEL=debug npm run report
```

**Problema:** Épicas sin métricas de tiempo

```bash
# 1. Asegúrate que las épicas tienen historias
# 2. Las historias deben tener estimates
# 3. Algunas historias deben tener time tracked
```

### Slack

**Problema:** Canales #temp no se detectan

```bash
# 1. Verificar que el canal contiene "temp" en el nombre
# 2. Verificar que el bot puede ver el canal
# 3. Intentar renombrar a #temp-something

# Editar SlackFormatter.isTempChannel() para debug
private isTempChannel(name: string): boolean {
  console.log(`Checking: ${name}`);
  return name.includes('temp');
}
```

**Problema:** Última actividad incorrecta

```bash
# Slack API históricamente tiene límite de 1000 mensajes
# Si el canal es muy activo, podrías perder historia

# Solución: Aumentar limit en src/services/slack.service.ts
limit: 5000  // Aumentar de 1
```

---

## Validación de .env

```bash
# Script para validar .env
node -e "
require('dotenv').config();
const required = ['SHORTCUT_API_TOKEN', 'SLACK_BOT_TOKEN', 'SLACK_REPORT_CHANNEL_ID'];
required.forEach(key => {
  if (!process.env[key]) console.log('❌ Missing:', key);
  else console.log('✅ Found:', key);
});
"
```

---

## Reset y Limpieza

```bash
# Limpiar caché
rm -rf dist node_modules .turbo

# Reinstalar
npm install

# Recompilar
npm run build
```

---

## Contacto y Reportar Bugs

Si no encuentras la solución:

1. Ejecuta: `LOG_LEVEL=debug npm run report 2>&1 | tee error.log`
2. Incluye la salida del log
3. Incluye tu versión: `npm --version` y `node --version`
4. Describe qué esperas vs qué sucede

---

## Links Útiles

- [Shortcut API Documentation](https://developer.shortcut.com/docs/api)
- [Slack API Documentation](https://api.slack.com/methods)
- [Block Kit Reference](https://api.slack.com/reference/block-kit)
- [Slack Status](https://status.slack.com)
- [Shortcut Status](https://status.app.shortcut.com)
