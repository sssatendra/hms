import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ClinicalNote } from '../../services/mongodb';
import { prisma } from '../../services/prisma';
import { sendSuccess, sendError, sendCreated, ErrorCodes } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { auditMiddleware } from '../../middleware/audit';
import { logger } from '../../utils/logger';

const router = Router();
router.use(authenticate);

const clinicalNoteSchema = z.object({
  patient_id: z.string(),
  appointment_id: z.string().optional(),
  visit_date: z.string().transform((d) => new Date(d)),
  subjective: z.string().default(''),
  objective: z.string().default(''),
  assessment: z.string().min(1),
  plan: z.string().default(''),
  icd_codes: z.array(z.string()).default([]),
  allergies_noted: z.array(z.string()).default([]),
  follow_up_instructions: z.string().optional(),
});

// GET /api/v1/emr/notes
router.get('/notes', authorize('emr:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const patient_id = req.query.patient_id as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const skip = (page - 1) * limit;

    const query: any = { tenant_id: tenantId };
    if (patient_id) query.patient_id = patient_id;

    // Doctors can see all; patients can only see their own
    if (req.user!.role === 'PATIENT') {
      const patientProfile = await prisma.patient.findFirst({
        where: { user_id: req.user!.userId, tenant_id: tenantId },
      });
      if (patientProfile) {
        query.patient_id = patientProfile.id;
      }
    }

    const [notes, total] = await Promise.all([
      ClinicalNote.find(query)
        .sort({ visit_date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ClinicalNote.countDocuments(query),
    ]);

    sendSuccess(res, notes, 200, {
      page, limit, total, totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error('Get EMR notes error', { error });
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch clinical notes', 500);
  }
});

// GET /api/v1/emr/notes/:id
router.get('/notes/:id', authorize('emr:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;

    const note = await ClinicalNote.findOne({ _id: id, tenant_id: tenantId }).lean();

    if (!note) {
      sendError(res, ErrorCodes.NOT_FOUND, 'Clinical note not found', 404);
      return;
    }

    sendSuccess(res, note);
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch clinical note', 500);
  }
});

// POST /api/v1/emr/notes
router.post(
  '/notes',
  authorize('emr:write'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = clinicalNoteSchema.parse(req.body);
      const tenantId = req.tenantId!;

      // Validate patient
      const patient = await prisma.patient.findFirst({
        where: { id: data.patient_id, tenant_id: tenantId },
      });

      if (!patient) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Patient not found', 404);
        return;
      }

      const note = await ClinicalNote.create({
        tenant_id: tenantId,
        doctor_id: req.user!.userId,
        ...data,
        is_signed: false,
        is_amended: false,
        amendments: [],
      });

      sendCreated(res, note);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
        return;
      }
      logger.error('Create clinical note error', { error });
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to create clinical note', 500);
    }
  }
);

// PUT /api/v1/emr/notes/:id
router.put('/notes/:id', authorize('emr:write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;

    const note = await ClinicalNote.findOne({ _id: id, tenant_id: tenantId });
    if (!note) {
      sendError(res, ErrorCodes.NOT_FOUND, 'Clinical note not found', 404);
      return;
    }

    // Only the creating doctor can edit (unless admin)
    if (note.doctor_id !== req.user!.userId && !['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
      sendError(res, ErrorCodes.FORBIDDEN, 'Only the creating doctor can edit this note', 403);
      return;
    }

    if (note.is_signed) {
      // If signed, create amendment
      const previousValues = {
        subjective: note.subjective,
        objective: note.objective,
        assessment: note.assessment,
        plan: note.plan,
      };

      note.amendments.push({
        amended_by: req.user!.userId,
        amended_at: new Date(),
        reason: req.body.amendment_reason || 'Correction',
        previous_values: previousValues,
      } as any);

      note.is_amended = true;
      note.amendment_reason = req.body.amendment_reason;
    }

    // Update fields
    const { amendment_reason, ...updateData } = req.body;
    Object.assign(note, updateData);
    await note.save();

    sendSuccess(res, note);
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to update clinical note', 500);
  }
});

// POST /api/v1/emr/notes/:id/sign
router.post('/notes/:id/sign', authorize('emr:write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;

    const note = await ClinicalNote.findOneAndUpdate(
      { _id: id, tenant_id: tenantId, doctor_id: req.user!.userId },
      { is_signed: true, signed_at: new Date() },
      { new: true }
    );

    if (!note) {
      sendError(res, ErrorCodes.NOT_FOUND, 'Clinical note not found', 404);
      return;
    }

    sendSuccess(res, note);
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to sign clinical note', 500);
  }
});

// GET /api/v1/emr/prescriptions
router.get('/prescriptions', authorize('prescriptions:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const patient_id = req.query.patient_id as string;
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = { tenant_id: tenantId };
    if (patient_id) where.patient_id = patient_id;
    if (status) where.status = status;

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          patient: { select: { first_name: true, last_name: true, mrn: true } },
          doctor: { select: { first_name: true, last_name: true } },
          items: {
            include: {
              inventory_item: { select: { drug_name: true, formulation: true } },
            },
          },
        },
      }),
      prisma.prescription.count({ where }),
    ]);

    sendSuccess(res, prescriptions, 200, {
      page, limit, total, totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch prescriptions', 500);
  }
});

// POST /api/v1/emr/prescriptions
router.post(
  '/prescriptions',
  authorize('prescriptions:write'),
  auditMiddleware({ resource: 'prescription', action: 'CREATE' }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      const { patient_id, appointment_id, diagnosis, notes, valid_until, items } = req.body;

      const prescription = await prisma.prescription.create({
        data: {
          tenant_id: tenantId,
          patient_id,
          doctor_id: req.user!.userId,
          appointment_id,
          diagnosis,
          notes,
          status: 'ACTIVE',
          valid_until: valid_until ? new Date(valid_until) : undefined,
          items: {
            create: items.map((item: any) => ({
              drug_name: item.drug_name,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              quantity_prescribed: item.quantity_prescribed,
              route: item.route,
              instructions: item.instructions,
              inventory_item_id: item.inventory_item_id,
              is_substitutable: item.is_substitutable ?? false,
            })),
          },
        },
        include: {
          items: true,
          patient: { select: { first_name: true, last_name: true } },
        },
      });

      sendCreated(res, prescription);
    } catch (error) {
      logger.error('Create prescription error', { error });
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to create prescription', 500);
    }
  }
);

export default router;
