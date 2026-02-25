import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../services/prisma';
import { sendSuccess, sendError, sendCreated, ErrorCodes } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { auditMiddleware } from '../../middleware/audit';
import { cacheGet, cacheSet, cacheDel, CacheKeys } from '../../services/redis';
import { logger } from '../../utils/logger';

const router = Router();

// All routes require auth
router.use(authenticate);

const patientSchema = z.object({
  mrn: z.string().optional(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  date_of_birth: z.string().transform((d) => new Date(d)),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  blood_group: z.enum(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'UNKNOWN']).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    zip: z.string().optional(),
  }).optional(),
  emergency_contact: z.object({
    name: z.string(),
    relation: z.string(),
    phone: z.string(),
  }).optional(),
  insurance_info: z.object({
    provider: z.string(),
    policy_number: z.string(),
    group_number: z.string().optional(),
    expiry: z.string().optional(),
  }).optional(),
  allergies: z.array(z.string()).optional(),
  chronic_conditions: z.array(z.string()).optional(),
});

// GET /api/v1/patients
router.get('/', authorize('patients:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where: any = { tenant_id: tenantId, is_active: true };

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { mrn: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          mrn: true,
          first_name: true,
          last_name: true,
          date_of_birth: true,
          gender: true,
          blood_group: true,
          phone: true,
          email: true,
          allergies: true,
          chronic_conditions: true,
          registered_at: true,
        },
      }),
      prisma.patient.count({ where }),
    ]);

    sendSuccess(res, patients, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error('Get patients error', { error });
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch patients', 500);
  }
});

// GET /api/v1/patients/:id
router.get('/:id', authorize('patients:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;

    // Cache check
    const cached = await cacheGet(CacheKeys.patient(tenantId, id));
    if (cached) {
      sendSuccess(res, cached);
      return;
    }

    const patient = await prisma.patient.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        appointments: {
          take: 5,
          orderBy: { scheduled_at: 'desc' },
          select: {
            id: true,
            status: true,
            scheduled_at: true,
            type: true,
            doctor: { select: { first_name: true, last_name: true } },
          },
        },
        vital_signs: {
          orderBy: { recorded_at: 'desc' },
        },
        bed_admissions: {
          orderBy: { admitted_at: 'desc' },
          include: {
            bed: { include: { ward: true } },
            progress_notes: {
              orderBy: { created_at: 'desc' },
              include: { doctor: { select: { last_name: true } } }
            }
          }
        },
        progress_notes: {
          orderBy: { created_at: 'desc' }
        },
        invoices: {
          orderBy: { created_at: 'desc' },
          include: {
            items: true
          }
        },
        lab_orders: {
          orderBy: { created_at: 'desc' },
          include: { items: { include: { test: true } } }
        },
        prescriptions: {
          orderBy: { created_at: 'desc' },
          include: { items: true }
        }
      },
    });

    if (!patient) {
      sendError(res, ErrorCodes.NOT_FOUND, 'Patient not found', 404);
      return;
    }

    const mappedPatient = {
      ...patient,
      admissions: patient.bed_admissions || []
    };

    await cacheSet(CacheKeys.patient(tenantId, id), mappedPatient, 300);
    sendSuccess(res, mappedPatient);
  } catch (error) {
    logger.error('Get patient error', { error });
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch patient', 500);
  }
});

// POST /api/v1/patients
router.post(
  '/',
  authorize('patients:write'),
  auditMiddleware({ resource: 'patient', action: 'CREATE' }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = patientSchema.parse(req.body);
      const tenantId = req.tenantId!;

      let mrn = data.mrn;

      if (!mrn) {
        // Auto-generate MRN: P-YYYYMMDD-XXXX (last 4 chars of UUID)
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        mrn = `P-${date}-${random}`;
      } else {
        // Check MRN uniqueness per tenant only if provided
        const existing = await prisma.patient.findFirst({
          where: { tenant_id: tenantId, mrn },
        });

        if (existing) {
          sendError(res, ErrorCodes.CONFLICT, 'MRN already exists for this tenant', 409);
          return;
        }
      }

      const patient = await prisma.patient.create({
        data: {
          tenant_id: tenantId,
          ...data,
          mrn, // Ensure the generated or provided MRN is used
        },
      });

      sendCreated(res, patient);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
        return;
      }
      logger.error('Create patient error', { error });
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to create patient', 500);
    }
  }
);

// PUT /api/v1/patients/:id
router.put(
  '/:id',
  authorize('patients:write'),
  auditMiddleware({ resource: 'patient', action: 'UPDATE' }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;
      const data = patientSchema.partial().parse(req.body);

      const patient = await prisma.patient.findFirst({
        where: { id, tenant_id: tenantId },
      });

      if (!patient) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Patient not found', 404);
        return;
      }

      const updated = await prisma.patient.update({
        where: { id },
        data,
      });

      // Invalidate cache
      await cacheDel(CacheKeys.patient(tenantId, id));

      sendSuccess(res, updated);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
        return;
      }
      logger.error('Update patient error', { error });
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to update patient', 500);
    }
  }
);

// DELETE /api/v1/patients/:id (soft delete)
router.delete('/:id', authorize('patients:delete'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;

    const patient = await prisma.patient.findFirst({ where: { id, tenant_id: tenantId } });
    if (!patient) {
      sendError(res, ErrorCodes.NOT_FOUND, 'Patient not found', 404);
      return;
    }

    await prisma.patient.update({ where: { id }, data: { is_active: false } });
    await cacheDel(CacheKeys.patient(tenantId, id));

    sendSuccess(res, { message: 'Patient deactivated successfully' });
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to deactivate patient', 500);
  }
});

// POST /api/v1/patients/:id/vital-signs
router.post('/:id/vital-signs', authorize('patients:write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;

    const patient = await prisma.patient.findFirst({ where: { id, tenant_id: tenantId } });
    if (!patient) {
      sendError(res, ErrorCodes.NOT_FOUND, 'Patient not found', 404);
      return;
    }

    const vitalSign = await prisma.vitalSign.create({
      data: {
        tenant_id: tenantId,
        patient_id: id,
        recorded_by: req.user!.userId,
        ...req.body,
      },
    });

    sendCreated(res, vitalSign);
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to record vital signs', 500);
  }
});

// GET /api/v1/patients/:id/vital-signs
router.get('/:id/vital-signs', authorize('patients:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;
    const limit = parseInt(req.query.limit as string) || 10;

    const vitalSigns = await prisma.vitalSign.findMany({
      where: { patient_id: id, tenant_id: tenantId },
      take: limit,
      orderBy: { recorded_at: 'desc' },
    });

    sendSuccess(res, vitalSigns);
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch vital signs', 500);
  }
});

export default router;
