import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../services/prisma';
import { sendSuccess, sendError, sendCreated, ErrorCodes } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { authorize, hasPermission } from '../../middleware/rbac';
import { config } from '../../config';
import { cacheDel, CacheKeys } from '../../services/redis';
import { logger } from '../../utils/logger';

const router = Router();
router.use(authenticate);

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().optional(),
  role_name: z.enum(['ADMIN', 'DOCTOR', 'PHARMACIST', 'LAB_TECH', 'NURSE', 'RECEPTIONIST', 'PATIENT']),
  department_id: z.string().uuid().optional(),
  specialization: z.string().optional(),
  license_number: z.string().optional(),
  employee_id: z.string().optional(),
});

const updateUserSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  department_id: z.string().uuid().optional(),
  specialization: z.string().optional(),
  license_number: z.string().optional(),
  employee_id: z.string().optional(),
  availability_status: z.enum(['AVAILABLE', 'ON_BREAK', 'OFF_DUTY']).optional(),
  skills: z.union([z.string(), z.array(z.string())]).optional(),
  settings: z.record(z.any()).optional(),
  two_factor_enabled: z.boolean().optional(),
});

// GET /api/v1/users
router.get('/', authorize('users:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;
    const role = req.query.role as string;
    const search = req.query.search as string;

    const where: any = { tenant_id: tenantId, is_active: true };
    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = { name: role };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone: true,
          status: true,
          avatar_url: true,
          specialization: true,
          availability_status: true,
          skills: true,
          employee_id: true,
          last_login_at: true,
          created_at: true,
          role: { select: { name: true } },
          department: { select: { name: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    sendSuccess(res, users, 200, {
      page, limit, total, totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch users', 500);
  }
});

// POST /api/v1/users
router.post('/', authorize('users:write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const data = createUserSchema.parse(req.body);
    const tenantId = req.tenantId!;

    // Check email uniqueness
    const existing = await prisma.user.findFirst({
      where: { tenant_id: tenantId, email: data.email },
    });

    if (existing) {
      sendError(res, ErrorCodes.CONFLICT, 'Email already in use', 409);
      return;
    }

    const role = await prisma.role.findUnique({ where: { name: data.role_name as any } });
    if (!role) {
      sendError(res, ErrorCodes.NOT_FOUND, 'Role not found', 404);
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, config.security.bcryptRounds);

    const user = await prisma.user.create({
      data: {
        tenant_id: tenantId,
        role_id: role.id,
        email: data.email,
        password_hash: passwordHash,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        department_id: data.department_id,
        specialization: data.specialization,
        license_number: data.license_number,
        employee_id: data.employee_id,
        status: 'ACTIVE',
        email_verified: true,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        status: true,
        role: { select: { name: true } },
      },
    });

    sendCreated(res, user);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
      return;
    }
    logger.error('Create user error', { error });
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to create user', 500);
  }
});

// PATCH /api/v1/users/:id/status
router.patch('/:id/status', authorize('users:write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;
    const { status } = req.body;

    if (id === req.user!.userId) {
      sendError(res, ErrorCodes.FORBIDDEN, 'Cannot change your own status', 403);
      return;
    }

    const user = await prisma.user.findFirst({ where: { id, tenant_id: tenantId } });
    if (!user) {
      sendError(res, ErrorCodes.NOT_FOUND, 'User not found', 404);
      return;
    }

    await prisma.user.update({ where: { id }, data: { status } });
    await cacheDel(CacheKeys.user(tenantId, id));

    sendSuccess(res, { message: 'User status updated' });
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to update user status', 500);
  }
});

// PUT /api/v1/users/:id (Modified to allow self-attendance updates)
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;
    const isSelf = id === req.user!.userId;
    const hasWritePermission = hasPermission(req.user!.role, 'users:write');

    if (!isSelf && !hasWritePermission) {
      sendError(res, ErrorCodes.FORBIDDEN, 'Insufficient permissions. Required: users:write', 403);
      return;
    }

    const rawData = updateUserSchema.parse(req.body);
    let data = rawData;

    // Security: If self-updating without admin permissions, ONLY allow specific fields
    if (isSelf && !hasWritePermission) {
      data = {};
      if (rawData.availability_status) data.availability_status = rawData.availability_status;
      if (rawData.settings) data.settings = rawData.settings;
      if (rawData.two_factor_enabled !== undefined) data.two_factor_enabled = rawData.two_factor_enabled;

      if (Object.keys(data).length === 0) {
        sendError(res, ErrorCodes.FORBIDDEN, 'Insufficient permissions to update these fields', 403);
        return;
      }
    }

    const user = await prisma.user.findFirst({ where: { id, tenant_id: tenantId } });
    if (!user) {
      sendError(res, ErrorCodes.NOT_FOUND, 'User not found', 404);
      return;
    }

    // Handle skills conversion if necessary
    const updateData: any = { ...data };
    if (data.skills && typeof data.skills === 'string') {
      updateData.skills = data.skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        status: true,
        specialization: true,
        availability_status: true,
        skills: true,
        employee_id: true,
        role: { select: { name: true } },
        department: { select: { name: true } },
      },
    });

    await cacheDel(CacheKeys.user(tenantId, id));
    sendSuccess(res, updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
      return;
    }
    logger.error('Update user error', { error });
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to update user', 500);
  }
});

// GET /api/v1/users/doctors
router.get('/doctors', authorize('appointments:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;

    const doctorRole = await prisma.role.findUnique({ where: { name: 'DOCTOR' } });

    const doctors = await prisma.user.findMany({
      where: { tenant_id: tenantId, role_id: doctorRole!.id, status: 'ACTIVE', is_active: true },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        specialization: true,
        avatar_url: true,
        department: { select: { name: true } },
      },
    });

    sendSuccess(res, doctors);
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch doctors', 500);
  }
});

// GET /api/v1/users/audit-logs
router.get('/audit-logs', authorize('admin:reports'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const skip = (page - 1) * limit;
    const resource = req.query.resource as string;
    const user_id = req.query.user_id as string;

    const where: any = { tenant_id: tenantId };
    if (resource) where.resource = resource;
    if (user_id) where.user_id = user_id;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { first_name: true, last_name: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    sendSuccess(res, logs, 200, {
      page, limit, total, totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch audit logs', 500);
  }
});

// GET /api/v1/users/notifications
router.get('/notifications', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.userId;
    const unread_only = req.query.unread_only === 'true';

    const where: any = { tenant_id: tenantId, user_id: userId };
    if (unread_only) where.read_at = null;

    const notifications = await prisma.notification.findMany({
      where,
      take: 50,
      orderBy: { created_at: 'desc' },
    });

    sendSuccess(res, notifications);
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch notifications', 500);
  }
});

// PATCH /api/v1/users/notifications/:id/read
router.patch('/notifications/:id/read', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;

    await prisma.notification.updateMany({
      where: { id, tenant_id: tenantId, user_id: req.user!.userId },
      data: { read_at: new Date(), status: 'READ' },
    });

    sendSuccess(res, { message: 'Notification marked as read' });
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to mark notification as read', 500);
  }
});

// GET /api/v1/users/availability - Publicly visible staff on duty (basic info only)
router.get('/availability', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const users = await prisma.user.findMany({
      where: {
        tenant_id: tenantId,
        is_active: true,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        availability_status: true,
        role: { select: { name: true } },
        department: { select: { name: true } },
      },
    });

    sendSuccess(res, users);
  } catch (error) {
    logger.error('Fetch availability error', { error });
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch staff availability', 500);
  }
});

export default router;
