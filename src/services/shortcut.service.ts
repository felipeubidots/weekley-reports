import logger from '../utils/logger.js';
import { HttpClient } from '../utils/http-client.js';
import { DateUtils } from '../utils/date-utils.js';
import {
  OverdueTask,
  OverdueByOwner,
  EpicMetrics,
  ShortcutStory,
  ShortcutEpic,
  ShortcutTimeEntry,
  ShortcutProject
} from '../formatters/types.js';

interface ShortcutListResponse<T> {
  data: T[];
}

interface ShortcutEpicResponse extends ShortcutEpic {
  completed_at?: string;
}

export class ShortcutService {
  private apiToken: string;
  private apiUrl: string;
  private projectsCache: Map<number, ShortcutProject> = new Map();

  constructor(apiToken: string, apiUrl: string) {
    this.apiToken = apiToken;
    this.apiUrl = apiUrl;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Shortcut-Token': this.apiToken.trim()
    };
  }

  async getOverdueTasks(thresholdDays: number): Promise<OverdueTask[]> {
    try {
      logger.info(`Fetching overdue tasks (threshold: ${thresholdDays} days)`);

      const cutoffDate = DateUtils.daysAgo(thresholdDays);
      const filterQuery = `due_before:${DateUtils.toISODateString(cutoffDate)}`;
      const url = `${this.apiUrl}/api/v3/stories?filter=${encodeURIComponent(filterQuery)}`;

      logger.debug(`Shortcut API URL: ${url}`);
      logger.debug(`Headers: ${JSON.stringify(this.getHeaders())}`);

      const response = await HttpClient.get<ShortcutListResponse<ShortcutStory>>(
        url,
        this.getHeaders()
      );

      const overdueTasks = response.data
        .filter(story => {
          if (!story.due_date) return false;
          const dueDate = new Date(story.due_date);
          return DateUtils.isOverdue(dueDate, thresholdDays);
        })
        .map(story => this.mapToOverdueTask(story))
        .sort((a, b) => b.daysOverdue - a.daysOverdue);

      logger.info(`Found ${overdueTasks.length} overdue tasks`);
      return overdueTasks;
    } catch (error) {
      logger.error('Failed to fetch overdue tasks', error as Error);
      throw error;
    }
  }

  async getOverdueTasksByOwner(thresholdDays: number): Promise<OverdueByOwner[]> {
    try {
      const overdueTasks = await this.getOverdueTasks(thresholdDays);

      const byOwner = new Map<string, OverdueTask[]>();

      for (const task of overdueTasks) {
        if (!byOwner.has(task.ownerName)) {
          byOwner.set(task.ownerName, []);
        }
        byOwner.get(task.ownerName)!.push(task);
      }

      const result = Array.from(byOwner.entries())
        .map(([ownerName, tasks]) => ({
          ownerName,
          tasksCount: tasks.length,
          tasks,
          averageDaysOverdue: Math.round(
            tasks.reduce((sum, t) => sum + t.daysOverdue, 0) / tasks.length
          )
        }))
        .sort((a, b) => b.tasksCount - a.tasksCount);

      logger.info(`Grouped ${overdueTasks.length} tasks into ${result.length} owners`);
      return result;
    } catch (error) {
      logger.error('Failed to group overdue tasks by owner', error as Error);
      throw error;
    }
  }

  async getEpicsWithMetrics(): Promise<EpicMetrics[]> {
    try {
      logger.info('Fetching epics with time metrics');

      const epicsResponse = await HttpClient.get<ShortcutListResponse<ShortcutEpicResponse>>(
        `${this.apiUrl}/api/v3/epics`,
        this.getHeaders()
      );

      const epics = epicsResponse.data;
      logger.debug(`Found ${epics.length} epics`);

      const metricsPromises = epics.map(epic => this.getEpicMetrics(epic));
      const metrics = await Promise.all(metricsPromises);

      return metrics
        .filter(m => m !== null)
        .sort((a, b) => Math.abs(b.percentageDifference) - Math.abs(a.percentageDifference));
    } catch (error) {
      logger.error('Failed to fetch epics with metrics', error as Error);
      throw error;
    }
  }

  private async getEpicMetrics(epic: ShortcutEpicResponse): Promise<EpicMetrics | null> {
    try {
      if (!epic.stories || epic.stories.length === 0) {
        return null;
      }

      const storiesResponse = await HttpClient.post<ShortcutListResponse<ShortcutStory>>(
        `${this.apiUrl}/api/v3/stories/bulk`,
        { ids: epic.stories },
        this.getHeaders()
      );

      const stories = storiesResponse.data;
      const completedCount = stories.filter(s => s.completed_at).length;

      let estimatedHours = 0;
      let actualHours = 0;

      for (const story of stories) {
        if (story.estimate) {
          estimatedHours += story.estimate;
        }

        // Fetch time entries for this story
        const timeResponse = await HttpClient.get<ShortcutListResponse<ShortcutTimeEntry>>(
          `${this.apiUrl}/api/v3/stories/${story.id}/time-entries`,
          this.getHeaders()
        );

        const timeEntries = timeResponse.data;
        const totalSeconds = timeEntries.reduce((sum, t) => sum + t.duration, 0);
        actualHours += totalSeconds / 3600;
      }

      const differenceHours = actualHours - estimatedHours;
      const percentageDifference = estimatedHours > 0
        ? Math.round((differenceHours / estimatedHours) * 100)
        : 0;

      return {
        id: epic.id.toString(),
        name: epic.name,
        completedCount,
        totalCount: stories.length,
        estimatedHours: Math.round(estimatedHours * 10) / 10,
        actualHours: Math.round(actualHours * 10) / 10,
        differenceHours: Math.round(differenceHours * 10) / 10,
        percentageDifference,
        url: epic.url
      };
    } catch (error) {
      logger.warn(`Failed to get metrics for epic ${epic.id}`, {
        error: (error as Error).message
      });
      return null;
    }
  }

  private mapToOverdueTask(story: ShortcutStory): OverdueTask {
    const dueDate = new Date(story.due_date!);
    const projectName = this.projectsCache.has(story.project_id)
      ? this.projectsCache.get(story.project_id)!.name
      : 'Unknown Project';

    const ownerName = story.owners && story.owners.length > 0
      ? story.owners[0].name
      : 'Unassigned';

    return {
      id: story.id.toString(),
      name: story.name,
      projectName,
      dueDate,
      ownerName,
      daysOverdue: DateUtils.daysOverdue(dueDate),
      url: story.url
    };
  }

  async cacheProjects(): Promise<void> {
    try {
      const response = await HttpClient.get<ShortcutListResponse<ShortcutProject>>(
        `${this.apiUrl}/api/v3/projects`,
        this.getHeaders()
      );

      for (const project of response.data) {
        this.projectsCache.set(project.id, project);
      }

      logger.debug(`Cached ${this.projectsCache.size} projects`);
    } catch (error) {
      logger.warn('Failed to cache projects', { error: (error as Error).message });
    }
  }
}
