import { Request, Response, NextFunction } from 'express';
import { addAuditLogJob } from '../services/queue';
import { logger } from '../utils/logger';

interface AuditOptions {
  resource: string;
  action: string;
  extractResourceId?: (req: Request, res: Response) => string | undefined;
}

export const auditMiddleware = (options: AuditOptions) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown) {
      // Only audit successful mutations
      if (res.statusCode < 400 && req.user) {
        const resourceId =
          options.extractResourceId?.(req, res) ||
          (req.params.id as string) ||
          (body as any)?.data?.id;

        addAuditLogJob({
          tenantId: req.user.tenantId,
          userId: req.user.userId,
          action: options.action as any,
          resource: options.resource,
          resourceId,
          newValues: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : undefined,
          ipAddress: req.ip || req.socket?.remoteAddress,
          userAgent: req.headers['user-agent'],
        }).catch((err) => logger.error('Failed to add audit log job', { error: err }));
      }

      return originalJson(body);
    };

    next();
  };
};

// Process audit log jobs
export const processAuditLog = async (job: any): Promise<void> => {
  const { prisma } = await import('../services/prisma');
  const data = job.data;

  await prisma.auditLog.create({
    data: {
      tenant_id: data.tenantId,
      user_id: data.userId,
      action: data.action,
      resource: data.resource,
      resource_id: data.resourceId,
      new_values: data.newValues,
      old_values: data.oldValues,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
    },
  });
};
