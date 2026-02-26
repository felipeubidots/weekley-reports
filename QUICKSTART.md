# ⚡ Inicio Rápido (5 minutos)

## Paso 1: Preparar el Entorno

```bash
# Navegar a la carpeta del proyecto
cd /c/Work/weeklyreports

# Instalar dependencias (si no están instaladas)
npm install

# Copiar template de configuración
cp .env.example .env
```

## Paso 2: Obtener Tokens (3-5 minutos)

Abre `.env` en tu editor favorito y completa estos 3 campos:

### 1️⃣ SHORTCUT_API_TOKEN

1. Ve a [https://app.shortcut.com](https://app.shortcut.com)
2. Settings (engranaje) → API Tokens
3. Genera un nuevo token
4. Copia y pega en `.env`:
```env
SHORTCUT_API_TOKEN=sk_...
```

### 2️⃣ SLACK_BOT_TOKEN

1. Ve a [https://api.slack.com/apps](https://api.slack.com/apps)
2. Crea una nueva app (o usa una existente)
3. OAuth & Permissions
4. Añade estos permisos (Scopes):
   - `channels:read`
   - `channels:history`
   - `chat:write`
5. Copia el **Bot User OAuth Token**:
```env
SLACK_BOT_TOKEN=xoxb-...
```

### 3️⃣ SLACK_REPORT_CHANNEL_ID

1. En Slack, haz click derecho en el canal donde quieres recibir reportes
2. "View channel details"
3. Copia el Channel ID:
```env
SLACK_REPORT_CHANNEL_ID=C_...
```

**Tu `.env` debería verse así:**
```env
SHORTCUT_API_TOKEN=sk_1234567890...
SLACK_BOT_TOKEN=xoxb-1234567890...
SLACK_REPORT_CHANNEL_ID=C1234ABCD
```

## Paso 3: Verificar que Funciona

```bash
npm run test:connection
```

**Resultado esperado:**
```
✅ Slack connection successful
✅ Shortcut connection successful
```

Si ves errores, revisar [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## Paso 4: Generar tu Primer Reporte

```bash
# Opción A: Previsualizar sin enviar
npm run report:dry

# Opción B: Generar y enviar a Slack
npm run report
```

¡Listo! Deberías ver el reporte en Slack 🎉

---

## Próximos Pasos

- **Aprender más:** Lee [README.md](./README.md) para documentación completa
- **Configuración avanzada:** Lee [SETUP.md](./SETUP.md) para instrucciones detalladas
- **Cómo usar:** Lee [USAGE.md](./USAGE.md) para casos de uso
- **Problemas:** Lee [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) para ayuda

---

## Comandos Útiles

```bash
npm run report              # Generar y enviar reporte
npm run report:dry          # Previsualizar reporte
npm run test:connection     # Verificar conexiones
npm run report -- --days 14 # Reporte de 14 días
npm run report -- --save ./report.json  # Guardar en JSON
```

---

## Ayuda Rápida

| Problema | Solución |
|----------|----------|
| "Token inválido" | Verificar `.env`, revisar SETUP.md |
| "Channel not found" | Invitar bot al canal en Slack |
| "Timeout" | Revisar conexión a internet |
| "Reporte vacío" | Asegurarse que hay datos en Shortcut |

---

**¿Preguntas?** Revisar la documentación en el repo o ejecutar:
```bash
npm run -- help
```
