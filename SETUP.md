# 🔧 Guía de Configuración Detallada

Esta guía te ayudará a obtener los tokens necesarios y configurar el sistema.

## 1. Obtener Token de Shortcut API

### Paso 1: Acceder a Shortcut

1. Ve a [https://app.shortcut.com](https://app.shortcut.com)
2. Inicia sesión con tu cuenta
3. Ve a **Settings** (engranaje en la esquina inferior izquierda)

### Paso 2: Crear API Token

1. En Settings, selecciona **API Tokens** (en la barra lateral izquierda)
2. Haz click en **Generate a new Token**
3. Dale un nombre descriptivo, ej: "Weekly Reports"
4. **Copia el token completo** (empieza con `sk_`)

### Paso 3: Guardar en .env

```env
SHORTCUT_API_TOKEN=sk_your_token_here
```

⚠️ **Importante:**
- No compartas este token con nadie
- No lo comitees al repositorio
- Está incluido en `.gitignore`

---

## 2. Crear Bot en Slack y Obtener Token

### Paso 1: Crear una Slack App

1. Ve a [https://api.slack.com/apps](https://api.slack.com/apps)
2. Haz click en **Create New App**
3. Selecciona **From scratch**
4. Nombre: "Weekly Reports"
5. Selecciona tu workspace
6. Haz click en **Create App**

### Paso 2: Configurar Permisos (Scopes)

1. En la barra izquierda, ve a **OAuth & Permissions**
2. Scroll hasta **Scopes** → **Bot Token Scopes**
3. Haz click en **Add an OAuth Scope** y añade:
   - `channels:read` - Para listar canales
   - `channels:history` - Para ver historial de mensajes
   - `chat:write` - Para enviar mensajes
   - `users:read` - (Opcional) Para obtener info de usuarios
   - `users:read.email` - (Opcional) Para obtener emails

Debería verse así:

```
Bot Token Scopes:
✓ channels:read
✓ channels:history
✓ chat:write
✓ users:read (optional)
✓ users:read.email (optional)
```

### Paso 3: Generar Bot Token

1. En **OAuth & Permissions**, scroll hacia arriba
2. Deberías ver **Bot User OAuth Token** que empieza con `xoxb-`
3. **Copia este token**

Si no lo ves:
1. Ve a **Basic Information**
2. Scroll hasta **App Credentials**
3. Haz click en **Generate a new token** bajo "Bot User OAuth Token"

### Paso 4: Instalar App en tu Workspace

1. En la misma página de **OAuth & Permissions**
2. Scroll arriba y haz click en **Reinstall to Workspace** o **Install to Workspace**
3. Confirma los permisos

### Paso 5: Guardar en .env

```env
SLACK_BOT_TOKEN=xoxb_your_token_here
```

---

## 3. Obtener ID del Canal de Slack

### Opción A: Desde Slack Desktop

1. En Slack, haz click derecho en el canal donde quieres recibir los reportes
2. Selecciona **View channel details**
3. Scroll down hasta ver **Channel ID**
4. **Copia el ID** (formato: `C` seguido de caracteres alfanuméricos)

### Opción B: Desde URL

1. Abre el canal en Slack en la web
2. Mira la URL: `https://app.slack.com/client/T.../C...`
3. El `C...` es el Channel ID
4. **Copia solo el ID** (sin el `TXXXXXXXXXXX/`)

### Paso: Guardar en .env

```env
SLACK_REPORT_CHANNEL_ID=C_your_channel_id_here
```

### ⚠️ Asegúrate que:
- El bot está en el canal (invítalo si es necesario)
- El bot tiene permisos para escribir mensajes

---

## 4. Configuración Completa de .env

Después de todos los pasos anteriores, tu archivo `.env` debería verse así:

```env
# === SHORTCUT ===
SHORTCUT_API_TOKEN=sk_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SHORTCUT_API_URL=https://api.app.shortcut.com

# === SLACK ===
SLACK_BOT_TOKEN=xoxb-12345678901-1234567890123-abcdefghijklmnopqrst
SLACK_REPORT_CHANNEL_ID=C1234ABCD
SLACK_API_URL=https://slack.com/api

# === REPORT CONFIGURATION ===
OVERDUE_DAYS_THRESHOLD=7
INACTIVE_CHANNELS_DAYS=7

# === LOGGING ===
LOG_LEVEL=info

# === OPTIONAL ===
NODE_ENV=production
REPORT_OUTPUT_DIR=./reports
```

## 5. Verificar Configuración

Después de completar todo, testea las conexiones:

```bash
npm run test:connection
```

Deberías ver:

```
✅ Conexión a Slack: OK
✅ Conexión a Shortcut: OK
✅ Todas las conexiones están OK. ¡Puedes ejecutar: npm run report
```

## 6. Primer Reporte

Una vez verificado, genera tu primer reporte:

```bash
# Ver el reporte antes de enviarlo
npm run report:dry

# Si todo se ve bien, enviarlo a Slack
npm run report
```

---

## ❓ FAQs de Configuración

### P: ¿Dónde puedo ver mis tokens después de crearlos?

**A:**
- **Shortcut:** Settings → API Tokens (solo se muestra una vez)
- **Slack:** OAuth & Permissions, scrollear arriba

### P: ¿Qué pasa si pierdo el token de Shortcut?

**A:** Tienes que generar uno nuevo. Ve a Settings → API Tokens y crea otro.

### P: ¿Cómo sé si tengo los permisos correctos en Slack?

**A:** Ejecuta `npm run test:connection`. Si falla, checkea los permisos.

### P: ¿Puedo usar el mismo bot para múltiples tareas?

**A:** Sí, pero necesitarías crear variables de entorno separadas. Por ahora, usa el mismo bot.

### P: ¿Dónde encuentro el Channel ID si el canal es privado?

**A:** En canales privados funciona igual. Invita al bot al canal privado, luego sigue los pasos.

### P: ¿Qué pasa si el bot no tiene permisos?

**A:** Verás un error como `Slack API returned error: not_in_channel`. Invita al bot al canal.

---

## 🔄 Rotar/Actualizar Tokens

Si necesitas cambiar un token (ej: por seguridad):

1. **Shortcut:** Crea un nuevo token en Settings → API Tokens
2. **Slack:** En OAuth & Permissions, puedes rotar el token o crear uno nuevo
3. Actualiza el valor en `.env`
4. Corre `npm run test:connection` para verificar

---

## 🛡️ Seguridad

✅ **Buenas prácticas:**
- Nunca compartas tu `.env` por email, chat, etc.
- Los tokens nunca se deben commitear al git
- Usa variables de entorno en producción
- Rota tokens periódicamente
- Revoca tokens que ya no uses

✅ **.env nunca se commitea:**
```
# En .gitignore (ya incluido):
.env
.env.local
.env.*.local
```

---

## 📞 Soporte

Si tienes problemas:

1. Verifica que los tokens son correctos (sin espacios extras)
2. Asegúrate que el bot está en el canal de Slack
3. Revisa los permisos del bot en Slack
4. Corre `npm run test:connection` para diagnóstico
5. Revisa los logs: `LOG_LEVEL=debug npm run report`

---

## Siguiente Paso

Una vez configurado, ve a `README.md` para aprender a usar el sistema.
