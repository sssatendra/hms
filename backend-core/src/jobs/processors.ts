import { getQueue, QUEUE_NAMES, NotificationJob, PharmacySyncJob, AuditLogJob } from '../services/queue';
import { prisma } from '../services/prisma';
import { logger } from '../utils/logger';

// ─── Audit Log Processor ──────────────────────────────────────────────────────
export const startAuditLogProcessor = (): void => {
  const queue = getQueue(QUEUE_NAMES.AUDIT_LOG);

  queue.process(5, async (job) => {
    const data: AuditLogJob = job.data;

    await prisma.auditLog.create({
      data: {
        tenant_id: data.tenantId,
        user_id: data.userId,
        action: data.action as any,
        resource: data.resource,
        resource_id: data.resourceId,
        old_values: data.oldValues as any,
        new_values: data.newValues as any,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
      },
    });
  });

  logger.info('✅ Audit log processor started');
};

// ─── Notification Processor ───────────────────────────────────────────────────
export const startNotificationProcessor = (): void => {
  const queue = getQueue(QUEUE_NAMES.NOTIFICATIONS);

  queue.process(10, async (job) => {
    const data: NotificationJob = job.data;

    await prisma.notification.create({
      data: {
        tenant_id: data.tenantId,
        user_id: data.userId,
        type: data.type as any,
        title: data.title,
        message: data.message,
        data: data.data as any,
        status: 'SENT',
        sent_at: new Date(),
      },
    });

    // TODO: Integrate with email/SMS provider
    logger.debug('Notification sent', { userId: data.userId, type: data.type });
  });

  logger.info('✅ Notification processor started');
};

// ─── Pharmacy Sync Processor ──────────────────────────────────────────────────
export const startPharmacyProcessor = (): void => {
  const queue = getQueue(QUEUE_NAMES.PHARMACY_SYNC);

  queue.process(3, async (job) => {
    const data: PharmacySyncJob = job.data;
    const tenantId = data.tenantId;

    switch (data.action) {
      case 'EXPIRY_CHECK': {
        const now = new Date();
        const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        // Mark expired items
        await prisma.pharmacyInventory.updateMany({
          where: { tenant_id: tenantId, expiry_date: { lt: now }, status: { not: 'EXPIRED' } },
          data: { status: 'EXPIRED' },
        });

        // Find items expiring soon and notify admins
        const expiringSoon = await prisma.pharmacyInventory.findMany({
          where: {
            tenant_id: tenantId,
            expiry_date: { lte: thirtyDays, gte: now },
            status: 'ACTIVE',
          },
          select: { id: true, drug_name: true, expiry_date: true, stock_quantity: true },
        });

        if (expiringSoon.length > 0) {
          logger.info(`Found ${expiringSoon.length} items expiring soon for tenant ${tenantId}`);
          // Notifications would be sent here
        }
        break;
      }

      case 'STOCK_ALERT': {
        const lowStockItems = await prisma.pharmacyInventory.findMany({
          where: {
            tenant_id: tenantId,
            status: 'LOW_STOCK',
            is_active: true,
          },
          select: { drug_name: true, stock_quantity: true, reorder_level: true },
        });

        if (lowStockItems.length > 0) {
          logger.info(`Low stock alert: ${lowStockItems.length} items for tenant ${tenantId}`);
        }
        break;
      }
    }
  });

  logger.info('✅ Pharmacy processor started');
};

// ─── Lab Processing Processor ─────────────────────────────────────────────────
export const startLabProcessor = (): void => {
  const queue = getQueue(QUEUE_NAMES.LAB_PROCESSING);

  queue.process(5, async (job) => {
    const { labOrderId, tenantId } = job.data;

    // Update order to indicate it's been queued for processing
    await prisma.labOrder.update({
      where: { id: labOrderId },
      data: { status: 'PENDING' },
    });

    logger.debug('Lab order queued for processing', { labOrderId });
  });

  logger.info('✅ Lab processor started');
};

export const startAllProcessors = (): void => {
  startAuditLogProcessor();
  startNotificationProcessor();
  startPharmacyProcessor();
  startLabProcessor();
};
