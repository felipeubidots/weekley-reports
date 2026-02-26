# 📊 Generar Reporte Semanal

## Comandos para Ejecutar Manualmente

### 1. **Opción A: Generar y Enviar Reporte Completo**

```bash
npm run report
```

**Qué hace:**
- Obtiene tareas vencidas de Shortcut (106+)
- Calcula tiempo invertido en épicas
- Obtiene canales #temp sin actividad
- Envía el reporte formateado a Slack
- Via webhook: Configurado en `.env` (ver SETUP.md para obtener tu webhook)

---

### 2. **Opción B: Previsualizar sin Enviar**

```bash
npm run report:dry
```

**Qué hace:**
- Genera el reporte (como la Opción A)
- **NO envía a Slack**
- Muestra los datos en la consola para revisar primero

---

### 3. **Opción C: Verificar Conexiones**

```bash
npm run test:connection
```

**Qué hace:**
- Verifica que el token de Shortcut sea válido
- Verifica que el token de Slack sea válido
- Útil antes de generar el reporte

---

## 📋 Estructura del Reporte

El reporte incluye 4 outputs:

1. **Tareas Vencidas Totales** - Cantidad total de tareas vencidas en Shortcut
2. **Tareas Vencidas por Persona** - Top 5 personas con más tareas vencidas
3. **Épicas - Tiempo Invertido** - Duración de épicas y enlaces directos
   - Incluye épicas críticas retrasadas
4. **Canales #temp sin Actividad** - Canales temporales vacíos o sin usar

---

## 🔐 Configuración Requerida

**Archivo:** `.env` (ya configurado)

```env
SHORTCUT_API_TOKEN=sct_rw_ubidots_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SLACK_WEBHOOK=https://hooks.slack.com/services/XXXXXXXXXXXX/XXXXXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX
```

**⚠️ IMPORTANTE:** Ver `.env.example` o `SETUP.md` para obtener tus tokens reales

---

## 📌 Flujo Recomendado

### Cada semana (ej: Lunes 9 AM):

1. **Verificar conexiones:**
   ```bash
   npm run test:connection
   ```

2. **Ver previa del reporte:**
   ```bash
   npm run report:dry
   ```

3. **Si se ve bien, enviar:**
   ```bash
   npm run report
   ```

---

## ⚡ Atajos Rápidos

```bash
# Generar y enviar (todo en uno)
npm run report

# Previsualizar sin enviar
npm run report:dry

# Test de conexión
npm run test:connection

# Ver ayuda
npm run -- help
```

---

## 🐛 Si hay errores

1. Revisa que `.env` tenga los tokens correctos
2. Ejecuta `npm run test:connection` para diagnóstico
3. Consulta `TROUBLESHOOTING.md` para más ayuda

---

**Última actualización:** 2026-02-26
**Reporte generado desde:** Shortcut API (MCP) + Slack API
