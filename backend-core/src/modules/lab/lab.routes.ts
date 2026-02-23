import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../services/prisma';
import { sendSuccess, sendError, sendCreated, ErrorCodes } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { auditMiddleware } from '../../middleware/audit';
import { addLabProcessingJob } from '../../services/queue';
import { config } from '../../config';
import { logger } from '../../utils/logger';

const router = Router();
router.use(authenticate);

const labOrderSchema = z.object({
  patient_id: z.string().uuid(),
  appointment_id: z.string().uuid().optional(),
  priority: z.enum(['ROUTINE', 'URGENT', 'STAT']).default('ROUTINE'),
  clinical_notes: z.string().optional(),
  tests: z.array(z.object({
    lab_test_id: z.string().uuid(),
  })).min(1),
});

const generateOrderNumber = () => {
  const now = new Date();
  const prefix = 'LAB';
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `${prefix}-${date}-${rand}`;
};

// GET /api/v1/lab/tests
router.get('/tests', authorize('lab:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const category = req.query.category as string;
    const search = req.query.search as string;

    const where: any = { tenant_id: tenantId, is_active: true };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tests = await prisma.labTest.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    sendSuccess(res, tests);
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch lab tests', 500);
  }
});

// POST /api/v1/lab/tests
router.post('/tests', authorize('admin:settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const test = await prisma.labTest.create({
      data: { tenant_id: tenantId, ...req.body },
    });
    sendCreated(res, test);
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to create lab test', 500);
  }
});

// GET /api/v1/lab/orders
router.get('/orders', authorize('lab:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const patient_id = req.query.patient_id as string;
    const skip = (page - 1) * limit;

    const where: any = { tenant_id: tenantId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (patient_id) where.patient_id = patient_id;

    // Lab tech can only see their assigned orders or pending ones
    if (req.user!.role === 'LAB_TECH') {
      where.OR = [
        { technician_id: req.user!.userId },
        { status: 'PENDING' },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.labOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { created_at: 'desc' }],
        include: {
          patient: { select: { first_name: true, last_name: true, mrn: true } },
          doctor: { select: { first_name: true, last_name: true } },
          items: {
            include: { lab_test: { select: { name: true, code: true, category: true } } },
          },
          files: { select: { id: true, file_name: true, file_type: true, created_at: true } },
        },
      }),
      prisma.labOrder.count({ where }),
    ]);

    sendSuccess(res, orders, 200, {
      page, limit, total, totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error('Get lab orders error', { error });
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch lab orders', 500);
  }
});

// GET /api/v1/lab/orders/:id
router.get('/orders/:id', authorize('lab:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;

    const order = await prisma.labOrder.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        patient: true,
        doctor: { select: { first_name: true, last_name: true, specialization: true } },
        technician: { select: { first_name: true, last_name: true } },
        items: { include: { lab_test: true } },
        files: true,
      },
    });

    if (!order) {
      sendError(res, ErrorCodes.NOT_FOUND, 'Lab order not found', 404);
      return;
    }

    sendSuccess(res, order);
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch lab order', 500);
  }
});

// POST /api/v1/lab/orders
router.post(
  '/orders',
  authorize('lab:write'),
  auditMiddleware({ resource: 'lab_order', action: 'CREATE' }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = labOrderSchema.parse(req.body);
      const tenantId = req.tenantId!;

      // Validate patient belongs to tenant
      const patient = await prisma.patient.findFirst({
        where: { id: data.patient_id, tenant_id: tenantId },
      });

      if (!patient) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Patient not found', 404);
        return;
      }

      // Validate tests exist
      const tests = await prisma.labTest.findMany({
        where: {
          id: { in: data.tests.map((t) => t.lab_test_id) },
          tenant_id: tenantId,
          is_active: true,
        },
      });

      if (tests.length !== data.tests.length) {
        sendError(res, ErrorCodes.NOT_FOUND, 'One or more lab tests not found', 404);
        return;
      }

      const order = await prisma.labOrder.create({
        data: {
          tenant_id: tenantId,
          patient_id: data.patient_id,
          doctor_id: req.user!.userId,
          appointment_id: data.appointment_id,
          order_number: generateOrderNumber(),
          priority: data.priority,
          clinical_notes: data.clinical_notes,
          items: {
            create: data.tests.map((t) => ({
              lab_test_id: t.lab_test_id,
            })),
          },
        },
        include: {
          items: { include: { lab_test: true } },
          patient: { select: { first_name: true, last_name: true, mrn: true } },
        },
      });

      // Queue for processing
      await addLabProcessingJob({
        labOrderId: order.id,
        tenantId,
      });

      sendCreated(res, order);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
        return;
      }
      logger.error('Create lab order error', { error });
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to create lab order', 500);
    }
  }
);

// PATCH /api/v1/lab/orders/:id/status
router.patch('/orders/:id/status', authorize('lab:process'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;
    const { status, rejected_reason } = req.body;

    const validTransitions: Record<string, string[]> = {
      PENDING: ['SAMPLE_COLLECTED', 'CANCELLED'],
      SAMPLE_COLLECTED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    };

    const order = await prisma.labOrder.findFirst({ where: { id, tenant_id: tenantId } });
    if (!order) {
      sendError(res, ErrorCodes.NOT_FOUND, 'Lab order not found', 404);
      return;
    }

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(status)) {
      sendError(res, ErrorCodes.CONFLICT, `Cannot transition from ${order.status} to ${status}`, 409);
      return;
    }

    const updated = await prisma.labOrder.update({
      where: { id },
      data: {
        status,
        technician_id: req.user!.userId,
        sample_collected_at: status === 'SAMPLE_COLLECTED' ? new Date() : undefined,
        completed_at: status === 'COMPLETED' ? new Date() : undefined,
        rejected_reason: status === 'CANCELLED' ? rejected_reason : undefined,
      },
    });

    sendSuccess(res, updated);
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to update lab order status', 500);
  }
});

// PATCH /api/v1/lab/orders/:id/results
router.patch('/orders/:id/results', authorize('lab:process'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;
    const { items } = req.body; // [{lab_order_item_id, results, result_notes}]

    const order = await prisma.labOrder.findFirst({ where: { id, tenant_id: tenantId } });
    if (!order) {
      sendError(res, ErrorCodes.NOT_FOUND, 'Lab order not found', 404);
      return;
    }

    // Update each result
    await Promise.all(
      items.map((item: any) =>
        prisma.labOrderItem.update({
          where: { id: item.lab_order_item_id },
          data: {
            results: item.results,
            result_notes: item.result_notes,
            status: 'COMPLETED',
            verified_by: req.user!.userId,
            verified_at: new Date(),
          },
        })
      )
    );

    sendSuccess(res, { message: 'Results updated successfully' });
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to update results', 500);
  }
});

// GET /api/v1/lab/orders/:id/file-url/:fileId
// Proxy signed URL from lab service
router.get('/orders/:id/file-url/:fileId', authorize('lab:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, fileId } = req.params;
    const tenantId = req.tenantId!;

    const file = await prisma.labFile.findFirst({
      where: { id: fileId, lab_order_id: id, tenant_id: tenantId },
    });

    if (!file) {
      sendError(res, ErrorCodes.NOT_FOUND, 'File not found', 404);
      return;
    }

    // Request signed URL from lab service
    const response = await fetch(
      `${config.services.labUrl}/api/v1/files/signed-url`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket: file.minio_bucket,
          key: file.minio_key,
          expires_in: 3600,
        }),
      }
    );

    if (!response.ok) {
      sendError(res, ErrorCodes.SERVICE_UNAVAILABLE, 'Failed to generate file URL', 503);
      return;
    }

    const { signed_url } = await response.json() as any;
    sendSuccess(res, { signed_url, file_name: file.file_name, file_type: file.file_type });
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to get file URL', 500);
  }
});

// GET /api/v1/lab/stats
router.get('/stats', authorize('lab:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;

    const [pending, inProgress, completed, today] = await Promise.all([
      prisma.labOrder.count({ where: { tenant_id: tenantId, status: 'PENDING' } }),
      prisma.labOrder.count({ where: { tenant_id: tenantId, status: 'IN_PROGRESS' } }),
      prisma.labOrder.count({ where: { tenant_id: tenantId, status: 'COMPLETED' } }),
      prisma.labOrder.count({
        where: {
          tenant_id: tenantId,
          created_at: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    sendSuccess(res, { pending, inProgress, completed, today });
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch stats', 500);
  }
});

export default router;
