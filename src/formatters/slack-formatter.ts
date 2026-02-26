import { Block } from '@slack/web-api';
import { ReportData, OverdueByOwner, EpicMetrics, InactiveChannel } from './types.js';
import { DateUtils } from '../utils/date-utils.js';

type SlackBlock = Block | Record<string, unknown>;

export class SlackFormatter {
  static formatReport(reportData: ReportData): SlackBlock[] {
    const blocks: SlackBlock[] = [];

    // Header
    blocks.push(this.formatHeader(reportData));

    // Summary section
    blocks.push(this.formatSummary(reportData));

    blocks.push({ type: 'divider' });

    // Overdue tasks section
    blocks.push(this.formatOverdueHeader());
    blocks.push(...this.formatOverdueByOwner(reportData.overdueTasks.byOwner));

    blocks.push({ type: 'divider' });

    // Epic metrics section
    if (reportData.epicMetrics.length > 0) {
      blocks.push(this.formatEpicsHeader());
      blocks.push(...this.formatEpics(reportData.epicMetrics));
      blocks.push({ type: 'divider' });
    }

    // Inactive channels section
    if (reportData.slackChannels.inactiveTempChannels.length > 0) {
      blocks.push(this.formatInactiveChannelsHeader());
      blocks.push(...this.formatInactiveChannels(reportData.slackChannels.inactiveTempChannels));
      blocks.push({ type: 'divider' });
    }

    // Footer
    blocks.push(this.formatFooter(reportData));

    return blocks;
  }

  private static formatHeader(reportData: ReportData): SlackBlock {
    const startDate = DateUtils.toLocaleDateString(reportData.metadata.reportPeriod.start);
    const endDate = DateUtils.toLocaleDateString(reportData.metadata.reportPeriod.end);

    return {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `📊 Reporte Semanal (${startDate} - ${endDate})`,
        emoji: true
      }
    };
  }

  private static formatSummary(reportData: ReportData): SlackBlock {
    const overdueLine = `🔴 *Tareas vencidas:* ${reportData.overdueTasks.total}`;
    const epicLine = `📈 *Épicas:* ${reportData.epicMetrics.length} (con métricas de tiempo)`;
    const channelsLine = `⚠️ *Canales inactivos:* ${reportData.slackChannels.inactiveTempChannels.length}`;

    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${overdueLine}\n${epicLine}\n${channelsLine}`
      }
    };
  }

  private static formatOverdueHeader(): SlackBlock {
    return {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🔴 Tareas Vencidas',
        emoji: true
      }
    };
  }

  private static formatOverdueByOwner(byOwner: OverdueByOwner[]): SlackBlock[] {
    const blocks: SlackBlock[] = [];

    if (byOwner.length === 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '✅ _No hay tareas vencidas_'
        }
      });
      return blocks;
    }

    for (const owner of byOwner) {
      const tasksSummary = owner.tasks
        .slice(0, 3)
        .map(task => `• ${task.name} (${task.daysOverdue}d)`)
        .join('\n');

      const moreText = owner.tasks.length > 3
        ? `\n_+ ${owner.tasks.length - 3} más_`
        : '';

      const text = `*${owner.ownerName}*\n${owner.tasksCount} tareas | Promedio: ${owner.averageDaysOverdue}d\n${tasksSummary}${moreText}`;

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text
        }
      });
    }

    return blocks;
  }

  private static formatEpicsHeader(): SlackBlock {
    return {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📈 Métricas por Épica (Estimado vs Real)',
        emoji: true
      }
    };
  }

  private static formatEpics(epics: EpicMetrics[]): SlackBlock[] {
    const blocks: SlackBlock[] = [];

    // Create a markdown table
    let tableMarkdown = '```\n';
    tableMarkdown += 'Épica'.padEnd(25) + ' | Est(h) | Real(h) | Diff(h) | %\n';
    tableMarkdown += '-'.repeat(25) + '-+---------+---------+---------+-----\n';

    for (const epic of epics) {
      const estimatedStr = epic.estimatedHours.toString().padEnd(5);
      const actualStr = epic.actualHours.toString().padEnd(5);
      const diffStr = (epic.differenceHours >= 0 ? '+' : '') + epic.differenceHours.toString();
      const percentStr = (epic.percentageDifference >= 0 ? '+' : '') + epic.percentageDifference + '%';

      tableMarkdown += epic.name.substring(0, 24).padEnd(25) +
        ` | ${estimatedStr} | ${actualStr} | ${diffStr.padEnd(6)} | ${percentStr}\n`;
    }
    tableMarkdown += '```\n';

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: tableMarkdown
      }
    });

    return blocks;
  }

  private static formatInactiveChannelsHeader(): SlackBlock {
    return {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '⚠️ Canales #temp sin actividad',
        emoji: true
      }
    };
  }

  private static formatInactiveChannels(channels: InactiveChannel[]): SlackBlock[] {
    const blocks: SlackBlock[] = [];

    if (channels.length === 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '✅ _Todos los canales #temp están activos_'
        }
      });
      return blocks;
    }

    for (const channel of channels) {
      const lastActivity = channel.lastMessageDate
        ? `Última actividad: ${DateUtils.toLocaleDateString(channel.lastMessageDate)}`
        : 'Sin actividad registrada';

      const text = `*#${channel.name}*\n${channel.inactiveDays} días sin actividad\n${lastActivity}`;

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text
        }
      });
    }

    return blocks;
  }

  private static formatFooter(reportData: ReportData): SlackBlock {
    const generatedDate = DateUtils.toLocaleDateString(reportData.metadata.generatedAt);
    const generatedTime = reportData.metadata.generatedAt.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const executionTime = DateUtils.formatDuration(reportData.metadata.executionTimeMs);

    return {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Generado: ${generatedDate} ${generatedTime} | Tiempo: ${executionTime}`
        }
      ]
    };
  }
}
