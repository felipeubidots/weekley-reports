/**
 * Sistema de Monitoreo Unificado: Shortcut + ClickUp
 * Automatiza la búsqueda de tareas vencidas y proporciona alertas consolidadas
 *
 * Flujo de ejecución:
 * 1. Busca tareas vencidas en Shortcut (fecha actual o pasado)
 * 2. Busca tareas vencidas en ClickUp (fecha actual o pasado)
 * 3. Identifica duplicados por similitud de nombre
 * 4. Genera reporte consolidado
 * 5. Envía alertas a Slack
 */

const axios = require('axios');
const crypto = require('crypto');

class UnifiedMonitor {
  constructor(config) {
    this.shortcutToken = config.shortcutToken;
    this.clickupToken = config.clickupToken;
    this.slackToken = config.slackToken;
    this.slackChannelId = config.slackChannelId;

    // ClickUp Space IDs para monitoreo
    this.clickupSpaces = {
      productDelivery: '90139458035',
      operations: '90131694508'
    };

    // Shortcut Team IDs
    this.shortcutTeams = {
      platformEngineering: '698a23c8-f13a-4400-a4f0-9c81b9b927a3',
      growthSupport: '698a23a6-8ed3-42c5-a73a-a25566f48634',
      intelligence: '6985160c-3ac7-45d2-a8ae-f1a3d671119f',
      extensibility: '6985269f-a6f9-4738-b9dd-080910387a34'
    };
  }

  /**
   * Tarea 1: Obtener tareas vencidas de Shortcut
   */
  async getShortcutOverdueTasks() {
    console.log('[SHORTCUT] Buscando tareas vencidas...');

    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(
        'https://api.shortcut.com/api/v3/stories/search',
        {
          headers: {
            'Shortcut-Token': this.shortcutToken
          },
          params: {
            completed: `*..${today}`, // Completadas hasta hoy
            'is-unstarted': false
          }
        }
      );

      return response.data.stories || [];
    } catch (error) {
      console.error('[SHORTCUT] Error al buscar tareas:', error.message);
      return [];
    }
  }

  /**
   * Tarea 2: Obtener tareas vencidas de ClickUp
   */
  async getClickupOverdueTasks() {
    console.log('[CLICKUP] Buscando tareas vencidas...');

    try {
      const today = new Date().toISOString().split('T')[0];
      const allTasks = [];

      // Buscar en cada espacio
      for (const [spaceName, spaceId] of Object.entries(this.clickupSpaces)) {
        try {
          const response = await axios.get(
            'https://api.clickup.com/api/v3/teams/9013371168/spaces',
            {
              headers: {
                'Authorization': this.clickupToken
              }
            }
          );

          // Búsqueda de tareas vencidas
          const searchResponse = await axios.post(
            'https://api.clickup.com/api/v3/team/9013371168/tasks/search',
            {
              filters: {
                location: {
                  projects: [spaceId]
                },
                due_date_to: today,
                task_statuses: ['active', 'unstarted']
              }
            },
            {
              headers: {
                'Authorization': this.clickupToken
              }
            }
          );

          allTasks.push(...(searchResponse.data.tasks || []));
          console.log(`[CLICKUP] ${spaceName}: ${searchResponse.data.tasks?.length || 0} tareas vencidas`);
        } catch (error) {
          console.error(`[CLICKUP] Error en ${spaceName}:`, error.message);
        }
      }

      return allTasks;
    } catch (error) {
      console.error('[CLICKUP] Error general al buscar tareas:', error.message);
      return [];
    }
  }

  /**
   * Tarea 3: Calcular similitud entre strings (Levenshtein distance)
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(s1, s2) {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  /**
   * Tarea 4: Detectar duplicados entre Shortcut y ClickUp
   */
  detectDuplicates(shortcutTasks, clickupTasks) {
    const duplicates = [];
    const threshold = 0.85; // 85% de similitud

    for (const shortcutTask of shortcutTasks) {
      for (const clickupTask of clickupTasks) {
        const similarity = this.calculateSimilarity(
          shortcutTask.name.toLowerCase(),
          clickupTask.name.toLowerCase()
        );

        if (similarity >= threshold) {
          duplicates.push({
            shortcut: {
              id: shortcutTask.id,
              name: shortcutTask.name,
              team: shortcutTask.team_id
            },
            clickup: {
              id: clickupTask.id,
              customId: clickupTask.custom_id,
              name: clickupTask.name
            },
            similarity: similarity
          });
        }
      }
    }

    return duplicates;
  }

  /**
   * Tarea 5: Consolidar métricas
   */
  consolidateMetrics(shortcutTasks, clickupTasks, duplicates) {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        shortcut_overdue_count: shortcutTasks.length,
        clickup_overdue_count: clickupTasks.length,
        total_overdue: shortcutTasks.length + clickupTasks.length - duplicates.length,
        duplicates_detected: duplicates.length
      },
      shortcut_details: {
        tasks: shortcutTasks.map(t => ({
          id: t.id,
          name: t.name,
          url: t.app_url,
          team_id: t.team_id
        }))
      },
      clickup_details: {
        tasks: clickupTasks.map(t => ({
          id: t.id,
          customId: t.custom_id,
          name: t.name,
          url: t.url,
          space: t.hierarchy?.project?.name
        }))
      },
      duplicates: duplicates
    };
  }

  /**
   * Tarea 6: Enviar reporte a Slack
   */
  async sendSlackAlert(metrics) {
    console.log('[SLACK] Enviando reporte...');

    try {
      const color = metrics.summary.total_overdue > 0 ? 'danger' : 'good';
      const statusEmoji = metrics.summary.total_overdue > 0 ? ':warning:' : ':white_check_mark:';

      const message = {
        channel: this.slackChannelId,
        username: 'Unified Task Monitor',
        icon_emoji: ':robot_face:',
        attachments: [
          {
            title: `${statusEmoji} Sistema de Monitoreo Unificado - Tareas Vencidas`,
            title_link: 'https://app.shortcut.com',
            color: color,
            fields: [
              {
                title: 'Tareas Vencidas en Shortcut',
                value: `${metrics.summary.shortcut_overdue_count}`,
                short: true
              },
              {
                title: 'Tareas Vencidas en ClickUp',
                value: `${metrics.summary.clickup_overdue_count}`,
                short: true
              },
              {
                title: 'Total Consolidado',
                value: `${metrics.summary.total_overdue}`,
                short: true
              },
              {
                title: 'Duplicados Detectados',
                value: `${metrics.summary.duplicates_detected}`,
                short: true
              }
            ],
            footer: 'Unified Monitoring System',
            ts: Math.floor(Date.now() / 1000)
          }
        ]
      };

      // Agregar detalles de tareas vencidas si las hay
      if (metrics.summary.total_overdue > 0) {
        const overdueTasks = metrics.shortcut_details.tasks.slice(0, 10); // Top 10
        message.attachments.push({
          title: 'Tareas Vencidas (Top 10)',
          text: overdueTasks.map(t => `• <${t.url}|${t.name}>`).join('\n'),
          color: 'danger'
        });
      }

      // Agregar duplicados si los hay
      if (metrics.summary.duplicates_detected > 0) {
        message.attachments.push({
          title: 'Duplicados Detectados',
          text: metrics.duplicates.map(d =>
            `• *${d.shortcut.name}* (Shortcut ${d.shortcut.id}) ↔ *${d.clickup.name}* (ClickUp ${d.clickup.customId})\n  Similitud: ${(d.similarity * 100).toFixed(1)}%`
          ).join('\n'),
          color: 'warning'
        });
      }

      await axios.post('https://slack.com/api/chat.postMessage', message, {
        headers: {
          'Authorization': `Bearer ${this.slackToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[SLACK] Reporte enviado exitosamente');
    } catch (error) {
      console.error('[SLACK] Error al enviar reporte:', error.message);
    }
  }

  /**
   * Ejecutar monitoreo completo
   */
  async runFullMonitoring() {
    console.log('\n========================================');
    console.log('Iniciando Monitoreo Unificado');
    console.log('========================================\n');

    try {
      // Obtener tareas vencidas de ambas plataformas
      console.log('[1/5] Obteniendo tareas de Shortcut...');
      const shortcutTasks = await this.getShortcutOverdueTasks();
      console.log(`      ✓ ${shortcutTasks.length} tareas encontradas\n`);

      console.log('[2/5] Obteniendo tareas de ClickUp...');
      const clickupTasks = await this.getClickupOverdueTasks();
      console.log(`      ✓ ${clickupTasks.length} tareas encontradas\n`);

      console.log('[3/5] Detectando duplicados...');
      const duplicates = this.detectDuplicates(shortcutTasks, clickupTasks);
      console.log(`      ✓ ${duplicates.length} duplicados detectados\n`);

      console.log('[4/5] Consolidando métricas...');
      const metrics = this.consolidateMetrics(shortcutTasks, clickupTasks, duplicates);
      console.log(`      ✓ Métricas consolidadas\n`);

      console.log('[5/5] Enviando reporte a Slack...');
      await this.sendSlackAlert(metrics);
      console.log(`      ✓ Reporte enviado\n`);

      console.log('========================================');
      console.log('Monitoreo Completado Exitosamente');
      console.log('========================================\n');

      return metrics;
    } catch (error) {
      console.error('Error durante el monitoreo:', error);
      throw error;
    }
  }

  /**
   * Configurar ejecución periódica (diaria)
   */
  scheduleDaily() {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(9, 0, 0, 0); // 9:00 AM

    if (now > scheduledTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeout = scheduledTime.getTime() - now.getTime();
    console.log(`Próxima ejecución en: ${scheduledTime.toISOString()}`);

    setTimeout(() => {
      this.runFullMonitoring();
      // Re-programar para el próximo día
      setInterval(() => {
        this.runFullMonitoring();
      }, 24 * 60 * 60 * 1000); // 24 horas
    }, timeout);
  }
}

// Configuración y ejecución
// NOTA: Los valores deben estar en variables de entorno .env, no hardcodeados aquí
const config = {
  shortcutToken: process.env.SHORTCUT_API_TOKEN || '',
  clickupToken: process.env.CLICKUP_TOKEN || '',
  slackToken: process.env.SLACK_BOT_TOKEN || '',
  slackChannelId: process.env.SLACK_REPORT_CHANNEL_ID || ''
};

const monitor = new UnifiedMonitor(config);

// Exportar para uso en otros módulos
module.exports = UnifiedMonitor;

// Si se ejecuta directamente
if (require.main === module) {
  monitor.runFullMonitoring().catch(console.error);
}
