import { Request, Response, NextFunction } from 'express';
import { sendError, ErrorCodes } from '../utils/response';
import { cacheGet, cacheSet, CacheKeys } from '../services/redis';
import { prisma } from '../services/prisma';
import { logger } from '../utils/logger';

export const tenantMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.tenantId) {
      next();
      return;
    }

    const tenantId = req.user.tenantId;

    // Check cache first
    const cached = await cacheGet<{ id: string; is_active: boolean }>(
      `tenant:${tenantId}:info`
    );

    if (cached) {
      if (!cached.is_active) {
        sendError(res, ErrorCodes.FORBIDDEN, 'Tenant account is suspended', 403);
        return;
      }
      next();
      return;
    }

    // Fetch from DB
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, is_active: true },
    });

    if (!tenant) {
      sendError(res, ErrorCodes.NOT_FOUND, 'Tenant not found', 404);
      return;
    }

    if (!tenant.is_active) {
      sendError(res, ErrorCodes.FORBIDDEN, 'Tenant account is suspended', 403);
      return;
    }

    // Cache tenant info for 10 minutes
    await cacheSet(`tenant:${tenantId}:info`, tenant, 600);

    next();
  } catch (error) {
    logger.error('Tenant middleware error', { error });
    next(error);
  }
};

// Ensure all queries are scoped to tenant
export const ensureTenantScope = (req: Request): string => {
  if (!req.tenantId) {
    throw new Error('Tenant context not found');
  }
  return req.tenantId;
};
