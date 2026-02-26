#!/usr/bin/env node

import { program } from 'commander';
import logger from './utils/logger.js';
import { getConfig, validateConfig } from './config/env.js';
import { ShortcutService } from './services/shortcut.service.js';
import { SlackService } from './services/slack.service.js';
import { ReportService } from './services/report.service.js';
import { SlackFormatter } from './formatters/slack-formatter.js';

program
  .name('weekly-reports')
  .description('Sistema de reportes semanales desde Shortcut a Slack')
  .version('1.0.0');

program
  .command('generate')
  .description('Genera el reporte semanal')
  .option('--days <n>', 'Días de lookback (default: 7)', '7')
  .option('--overdue <days>', 'Umbral de tareas vencidas en días (default: 7)', '7')
  .option('--inactive <days>', 'Umbral de inactividad de canales en días (default: 7)', '7')
  .option('--dry-run', 'Muestra el reporte sin enviar a Slack')
  .option('--save <path>', 'Guarda el reporte en JSON en la ruta especificada')
  .action(async (options) => {
    try {
      // Validate configuration
      if (!validateConfig()) {
        process.exit(1);
      }

      const config = getConfig();

      // Initialize services
      logger.info('Inicializando servicios...');
      const shortcutService = new ShortcutService(
        config.SHORTCUT_API_TOKEN,
        config.SHORTCUT_API_URL
      );
      const slackService = new SlackService(
        config.SLACK_BOT_TOKEN,
        config.SLACK_REPORT_CHANNEL_ID
      );
      const reportService = new ReportService(shortcutService, slackService);

      // Generate report
      logger.info('Generando reporte...');
      const reportData = await reportService.generateReport({
        overdueDaysThreshold: parseInt(options.overdue, 10),
        inactiveDaysThreshold: parseInt(options.inactive, 10),
        daysLookback: parseInt(options.days, 10)
      });

      // Format for Slack
      logger.info('Formateando reporte para Slack...');
      const blocks = SlackFormatter.formatReport(reportData);

      // Display report
      if (options.dryRun) {
        logger.info('\n=== REPORTE (DRY RUN) ===\n');
        console.log(JSON.stringify(blocks, null, 2));
        logger.info('\n=== FIN DEL REPORTE ===\n');
      } else {
        // Send to Slack
        logger.info('Enviando reporte a Slack...');
        await slackService.sendReport(blocks);
        logger.info('✅ Reporte enviado exitosamente');
      }

      // Save to file if requested
      if (options.save) {
        const fs = await import('fs');
        const path = await import('path');
        const fullPath = path.resolve(options.save);
        fs.writeFileSync(fullPath, JSON.stringify(reportData, null, 2));
        logger.info(`💾 Reporte guardado en: ${fullPath}`);
      }
    } catch (error) {
      logger.error('Error al generar el reporte', error as Error);
      process.exit(1);
    }
  });

program
  .command('test-connection')
  .description('Verifica las conexiones a APIs de Shortcut y Slack')
  .action(async () => {
    try {
      // Validate configuration
      if (!validateConfig()) {
        process.exit(1);
      }

      const config = getConfig();

      // Test Slack
      logger.info('Testeando conexión a Slack...');
      const slackService = new SlackService(
        config.SLACK_BOT_TOKEN,
        config.SLACK_REPORT_CHANNEL_ID
      );
      const slackOk = await slackService.testConnection();

      if (slackOk) {
        logger.info('✅ Conexión a Slack: OK');
      } else {
        logger.error('❌ Conexión a Slack: FALLIDA');
      }

      // Test Shortcut
      logger.info('Testeando conexión a Shortcut...');
      const shortcutService = new ShortcutService(
        config.SHORTCUT_API_TOKEN,
        config.SHORTCUT_API_URL
      );

      try {
        await shortcutService.cacheProjects();
        logger.info('✅ Conexión a Shortcut: OK');
      } catch (error) {
        logger.error('❌ Conexión a Shortcut: FALLIDA', error as Error);
      }

      if (slackOk) {
        logger.info('\n✅ Todas las conexiones están OK. ¡Puedes ejecutar: npm run report');
      } else {
        logger.error('\n❌ Hay problemas de conexión. Revisa tu .env');
        process.exit(1);
      }
    } catch (error) {
      logger.error('Error al testear conexiones', error as Error);
      process.exit(1);
    }
  });

program
  .command('help')
  .description('Muestra la ayuda detallada')
  .action(() => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║        SISTEMA DE REPORTES SEMANALES SLACK                ║
║        (Powered by Shortcut & Slack APIs)                 ║
╚════════════════════════════════════════════════════════════╝

PRIMEROS PASOS:
1. Copiar .env.example a .env
2. Completar los tokens:
   - SHORTCUT_API_TOKEN: Desde Shortcut > Settings > API Tokens
   - SLACK_BOT_TOKEN: Desde Slack > App > OAuth & Permissions
   - SLACK_REPORT_CHANNEL_ID: ID del canal donde enviar (click derecho en Slack)

3. Testear conexión:
   npm run test:connection

4. Generar reporte:
   npm run report

OPCIONES AVANZADAS:
   npm run report -- --dry-run              # Mostrar sin enviar
   npm run report -- --days 14              # Últimos 14 días
   npm run report -- --overdue 5            # Tareas vencidas > 5 días
   npm run report -- --save ./report.json   # Guardar en archivo

DOCUMENTACIÓN:
- Shortcut API: https://developer.shortcut.com/
- Slack API: https://api.slack.com/
    `);
  });

program.parse();

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
