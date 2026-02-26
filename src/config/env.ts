import dotenv from 'dotenv';
import { z } from 'zod';
import logger from '../utils/logger.js';

dotenv.config();

const configSchema = z.object({
  // Shortcut
  SHORTCUT_API_TOKEN: z.string().min(1, 'SHORTCUT_API_TOKEN is required'),
  SHORTCUT_API_URL: z.string().url().default('https://api.app.shortcut.com'),

  // Slack
  SLACK_BOT_TOKEN: z.string().min(1, 'SLACK_BOT_TOKEN is required'),
  SLACK_REPORT_CHANNEL_ID: z.string().min(1, 'SLACK_REPORT_CHANNEL_ID is required'),
  SLACK_API_URL: z.string().url().default('https://slack.com/api'),

  // Report configuration
  OVERDUE_DAYS_THRESHOLD: z.string().transform(Number).default('7'),
  INACTIVE_CHANNELS_DAYS: z.string().transform(Number).default('7'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Optional
  NODE_ENV: z.enum(['development', 'production']).default('production'),
  REPORT_OUTPUT_DIR: z.string().default('./reports')
});

let config: z.infer<typeof configSchema> | null = null;

export function getConfig() {
  if (!config) {
    try {
      config = configSchema.parse(process.env);
      logger.info('Configuration loaded successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues
          .map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)
          .join('\n');
        logger.error(`Configuration validation failed:\n${issues}`);
        process.exit(1);
      }
      throw error;
    }
  }

  return config;
}

export function validateConfig() {
  try {
    getConfig();
    logger.debug('All environment variables are valid');
    return true;
  } catch (error) {
    logger.error('Configuration validation failed', error as Error);
    return false;
  }
}
