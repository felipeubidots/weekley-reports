import { WebClient } from '@slack/web-api';
import logger from '../utils/logger.js';
import { DateUtils } from '../utils/date-utils.js';
import {
  InactiveChannel,
  SlackChannel
} from '../formatters/types.js';

export class SlackService {
  private client: WebClient;
  private reportChannelId: string;

  constructor(botToken: string, reportChannelId: string) {
    this.client = new WebClient(botToken);
    this.reportChannelId = reportChannelId;
  }

  async getTempChannels(): Promise<SlackChannel[]> {
    try {
      logger.info('Fetching temp channels from Slack');

      const result = await this.client.conversations.list({
        exclude_archived: true,
        limit: 1000
      });

      if (!result.channels) {
        logger.warn('No channels returned from Slack API');
        return [];
      }

      const tempChannels = result.channels
        .filter(conv => this.isTempChannel(conv.name || ''))
        .map(conv => ({
          id: conv.id!,
          name: conv.name!,
          isMpim: conv.is_mpim || false,
          isPrivate: conv.is_private || false,
          created: conv.created || 0,
          memberCount: 0 // Will be fetched separately if needed
        }));

      logger.info(`Found ${tempChannels.length} temp channels out of ${result.channels.length} total`);
      return tempChannels;
    } catch (error) {
      logger.error('Failed to fetch temp channels', error as Error);
      throw error;
    }
  }

  async getInactiveTempChannels(inactiveDaysThreshold: number): Promise<InactiveChannel[]> {
    try {
      logger.info(`Fetching inactive temp channels (threshold: ${inactiveDaysThreshold} days)`);

      const tempChannels = await this.getTempChannels();
      const inactiveChannels: InactiveChannel[] = [];

      for (const channel of tempChannels) {
        try {
          const { lastMessageDate, isInactive } = await this.checkChannelActivity(
            channel.id,
            inactiveDaysThreshold
          );

          if (isInactive && lastMessageDate) {
            const inactiveDays = DateUtils.inactivityDays(lastMessageDate);
            inactiveChannels.push({
              id: channel.id,
              name: channel.name,
              inactiveDays,
              lastMessageDate,
              memberCount: channel.memberCount || 0
            });
          }
        } catch (error) {
          logger.warn(`Failed to check activity for channel ${channel.name}`, {
            error: (error as Error).message
          });
        }
      }

      inactiveChannels.sort((a, b) => b.inactiveDays - a.inactiveDays);
      logger.info(`Found ${inactiveChannels.length} inactive temp channels`);

      return inactiveChannels;
    } catch (error) {
      logger.error('Failed to fetch inactive temp channels', error as Error);
      throw error;
    }
  }

  async checkChannelActivity(
    channelId: string,
    inactiveDaysThreshold: number
  ): Promise<{ lastMessageDate: Date | null; isInactive: boolean }> {
    try {
      const result = await this.client.conversations.history({
        channel: channelId,
        limit: 1
      });

      if (!result.messages || result.messages.length === 0) {
        return {
          lastMessageDate: null,
          isInactive: true
        };
      }

      const lastMessage = result.messages[0];
      const lastMessageTs = parseFloat(lastMessage.ts || '0');
      const lastMessageDate = new Date(lastMessageTs * 1000);

      const isInactive = DateUtils.isInactiveFor(lastMessageDate, inactiveDaysThreshold);

      return {
        lastMessageDate,
        isInactive
      };
    } catch (error) {
      logger.warn(`Failed to check activity for channel ${channelId}`, {
        error: (error as Error).message
      });
      return {
        lastMessageDate: null,
        isInactive: false
      };
    }
  }

  async sendReport(blocks: unknown[]): Promise<string> {
    try {
      logger.info(`Sending report to channel ${this.reportChannelId}`);

      const result = await this.client.chat.postMessage({
        channel: this.reportChannelId,
        blocks: blocks as never,
        text: 'Weekly Report' // Fallback text for clients that don't support blocks
      });

      if (!result.ok) {
        throw new Error(`Slack API returned error: ${result.error}`);
      }

      logger.info(`Report sent successfully. Message timestamp: ${result.ts}`);
      return result.ts || '';
    } catch (error) {
      logger.error('Failed to send report to Slack', error as Error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.client.auth.test();
      if (result.ok) {
        logger.info(`Slack connection successful. Bot: ${result.user_id}`);
        return true;
      } else {
        logger.error('Slack auth test failed', { error: result.error });
        return false;
      }
    } catch (error) {
      logger.error('Failed to test Slack connection', error as Error);
      return false;
    }
  }

  private isTempChannel(name: string): boolean {
    return name.includes('temp') || name.includes('tmp');
  }
}
