import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { logger } from '../utils/logger';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: config.isDev
      ? [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ]
      : [{ emit: 'event', level: 'error' }],
  });


(prisma as any).$on('error', (e: any) => {
  logger.error('Prisma Error', { error: e });
});

if (config.env !== 'production') globalForPrisma.prisma = prisma;

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅ PostgreSQL connected via Prisma');
  } catch (error) {
    logger.error('❌ Failed to connect to PostgreSQL', { error });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('PostgreSQL disconnected');
}
