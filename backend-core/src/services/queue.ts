import Bull, { Queue, JobOptions } from 'bull';
import { config } from '../config';
import { logger } from '../utils/logger';

// Queue names
export const QUEUE_NAMES = {
  LAB_PROCESSING: 'lab-processing',
  PHARMACY_SYNC: 'pharmacy-sync',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOG: 'audit-log',
  REPORT_GENERATION: 'report-generation',
  EMAIL: 'email',
  EXPIRY_CHECK: 'expiry-check',
  STOCK_ALERT: 'stock-alert',
} as const;

// Queue instances
const queues = new Map<string, Queue>();

const defaultJobOptions: JobOptions = {
  removeOnComplete: 100,
  removeOnFail: 50,
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
};

export const getQueue = (name: string): Queue => {
  if (!queues.has(name)) {
    const queue = new Bull(name, {
      redis: config.redis.url,
      defaultJobOptions,
    });

    queue.on('error', (err) => logger.error(`Queue ${name} error`, { error: err.message }));
    queue.on('failed', (job, err) =>
      logger.warn(`Job ${job.id} in ${name} failed`, { error: err.message, attempts: job.attemptsMade })
    );
    queue.on('completed', (job) =>
      logger.debug(`Job ${job.id} in ${name} completed`)
    );

    queues.set(name, queue);
  }
  return queues.get(name)!;
};

// Job payloads
export interface LabProcessingJob {
  labOrderId: string;
  tenantId: string;
  fileKeys?: string[];
}

export interface NotificationJob {
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface PharmacySyncJob {
  tenantId: string;
  action: 'EXPIRY_CHECK' | 'STOCK_ALERT' | 'REORDER_CHECK';
}

export interface AuditLogJob {
  tenantId: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

// Queue helpers
export const addLabProcessingJob = (data: LabProcessingJob) =>
  getQueue(QUEUE_NAMES.LAB_PROCESSING).add(data, { priority: 1 });

export const addNotificationJob = (data: NotificationJob) =>
  getQueue(QUEUE_NAMES.NOTIFICATIONS).add(data);

export const addAuditLogJob = (data: AuditLogJob) =>
  getQueue(QUEUE_NAMES.AUDIT_LOG).add(data, { priority: 10, attempts: 1 });

export const addPharmacySyncJob = (data: PharmacySyncJob) =>
  getQueue(QUEUE_NAMES.PHARMACY_SYNC).add(data);

// Schedule recurring jobs
export const scheduleRecurringJobs = async (): Promise<void> => {
  const pharmacyQueue = getQueue(QUEUE_NAMES.PHARMACY_SYNC);

  // Check expiry daily at midnight
  await pharmacyQueue.add(
    { action: 'EXPIRY_CHECK' } as PharmacySyncJob,
    { repeat: { cron: '0 0 * * *' }, jobId: 'daily-expiry-check' }
  );

  // Check stock levels every 6 hours
  await pharmacyQueue.add(
    { action: 'STOCK_ALERT' } as PharmacySyncJob,
    { repeat: { cron: '0 */6 * * *' }, jobId: 'stock-alert-check' }
  );

  logger.info('✅ Recurring jobs scheduled');
};

export const closeAllQueues = async (): Promise<void> => {
  await Promise.all([...queues.values()].map((q) => q.close()));
  queues.clear();
  logger.info('All queues closed');
};
