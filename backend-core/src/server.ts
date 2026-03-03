import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { connectDatabase, disconnectDatabase } from './services/prisma';
import { connectMongoDB, disconnectMongoDB } from './services/mongodb';
import { getRedisClient, disconnectRedis } from './services/redis';
import { scheduleRecurringJobs, closeAllQueues } from './services/queue';
import { startAllProcessors } from './jobs/processors';

const bootstrap = async (): Promise<void> => {
  try {
    logger.info(`🚀 Starting HMS Core Service (${config.env})...`);

    // Connect to databases
    await connectDatabase();
    await connectMongoDB();

    // Initialize Redis
    getRedisClient();

    // Start queue processors
    startAllProcessors();
    await scheduleRecurringJobs();

    // Create and start HTTP server
    const app = createApp();
    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: config.services.frontendUrl,
        credentials: true
      }
    });

    (global as any).io = io;

    io.on('connection', (socket: any) => {
      logger.info(`🔌 New socket connection: ${socket.id}`);
      socket.on('disconnect', () => logger.info(`🔌 Socket disconnected: ${socket.id}`));
    });

    server.listen(config.port, () => {
      logger.info(`✅ HMS Core Service running on port ${config.port}`);
      logger.info(`📚 API Base: http://localhost:${config.port}/api/v1`);
      logger.info(`❤️  Health: http://localhost:${config.port}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      server.close(async () => {
        try {
          await closeAllQueues();
          await disconnectDatabase();
          await disconnectMongoDB();
          await disconnectRedis();
          logger.info('✅ Graceful shutdown complete');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error });
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection', { reason });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

bootstrap();
