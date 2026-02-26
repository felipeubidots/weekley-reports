import logger from '../utils/logger.js';
import { DateUtils } from '../utils/date-utils.js';
import { ShortcutService } from './shortcut.service.js';
import { SlackService } from './slack.service.js';
import { ReportData } from '../formatters/types.js';

export interface ReportOptions {
  overdueDaysThreshold: number;
  inactiveDaysThreshold: number;
  daysLookback?: number;
}

export class ReportService {
  private shortcutService: ShortcutService;
  private slackService: SlackService;

  constructor(shortcutService: ShortcutService, slackService: SlackService) {
    this.shortcutService = shortcutService;
    this.slackService = slackService;
  }

  async generateReport(options: ReportOptions): Promise<ReportData> {
    const startTime = Date.now();
    logger.info('Starting report generation');

    try {
      // Cache projects for Shortcut service
      await this.shortcutService.cacheProjects();

      // Fetch all data in parallel
      logger.info('Fetching data from Shortcut and Slack');
      const [overdueTasks, overdueTodayByOwner, epicMetrics, inactiveTempChannels] =
        await Promise.all([
          this.shortcutService.getOverdueTasks(options.overdueDaysThreshold),
          this.shortcutService.getOverdueTasksByOwner(options.overdueDaysThreshold),
          this.shortcutService.getEpicsWithMetrics(),
          this.slackService.getInactiveTempChannels(options.inactiveDaysThreshold)
        ]);

      const tempChannels = await this.slackService.getTempChannels();

      const executionTimeMs = Date.now() - startTime;

      const reportData: ReportData = {
        metadata: {
          generatedAt: DateUtils.now(),
          executionTimeMs,
          reportPeriod: {
            start: DateUtils.daysAgo(options.daysLookback || 7),
            end: DateUtils.now()
          }
        },
        overdueTasks: {
          total: overdueTasks.length,
          byOwner: overdueTodayByOwner,
          allTasks: overdueTasks
        },
        epicMetrics,
        slackChannels: {
          inactiveTempChannels,
          totalScanned: tempChannels.length,
          totalTempChannels: tempChannels.length
        }
      };

      logger.info('Report generated successfully', {
        executionTimeMs: `${DateUtils.formatDuration(executionTimeMs)}`,
        overdueTasks: reportData.overdueTasks.total,
        epics: reportData.epicMetrics.length,
        inactiveChannels: reportData.slackChannels.inactiveTempChannels.length
      });

      return reportData;
    } catch (error) {
      logger.error('Report generation failed', error as Error);
      throw error;
    }
  }
}
