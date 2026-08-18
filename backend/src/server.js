import { PrismaClient } from '@prisma/client';
import app from './app.js';
import { config } from './config/env.js';
import { logger } from './config/logger.js';

const prisma = new PrismaClient();

async function main() {
  // Connect to PostgreSQL database
  try {
    await prisma.$connect();
    logger.info('PostgreSQL connected via Prisma');
  } catch (err) {
    logger.error({ err }, 'Failed to connect to PostgreSQL — check DATABASE_URL');
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    logger.info(
      { port: config.port, env: config.nodeEnv },
      `JobPulse backend listening`
    );
  });

  // Handles graceful server shutdown on terminate signals
  async function shutdown(signal) {
    logger.info({ signal }, 'Shutdown signal received, closing gracefully');
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Server and DB connection closed');
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main();
