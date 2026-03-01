import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../services/prisma';
import { sendSuccess, sendError, sendCreated, ErrorCodes } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { auditMiddleware } from '../../middleware/audit';
import { logger } from '../../utils/logger';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();

// All routes require auth
router.use(authenticate);

const castReq = (req: any) => req;

const wardSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    type: z.enum(['GENERAL', 'ICU', 'EMERGENCY', 'MATERNITY', 'PEDIATRIC', 'SURGICAL', 'CARDIAC', 'ONCOLOGY', 'PRIVATE']),
    daily_rate: z.number().min(0),
    department_id: z.string().optional(),
    total_beds: z.number().min(1),
});

const bedSchema = z.object({
    ward_id: z.string().uuid(),
    bed_number: z.string().min(1),
    bed_type: z.string().optional(),
    daily_rate_override: z.number().optional(),
});

const paymentSchema = z.object({
    amount: z.number().positive(),
    method: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'INSURANCE', 'ONLINE']),
    transaction_id: z.string().optional(),
    notes: z.string().optional(),
});

const admissionSchema = z.object({
    patient_id: z.string().uuid(),
    bed_id: z.string().uuid(),
    admission_notes: z.string().optional(),
    diagnosis_on_admission: z.string().optional(),
    advance_paid: z.number().optional(),
    expected_discharge: z.string().optional().transform(v => v ? new Date(v) : undefined),
});

const chargeSchema = z.object({
    description: z.string(),
    amount: z.number().positive(),
    quantity: z.number().int().positive().default(1),
    category: z.string().default('OTHER'),
    is_emergency: z.boolean().optional().default(false),
});

const noteSchema = z.object({
    note: z.string(),
    category: z.string().default('GENERAL'),
});

// WARD ROUTES
router.get('/', authorize('wards:read'), async (req: any, res: Response) => {
    try {
        const wards = await prisma.ward.findMany({
            where: { tenant_id: req.tenantId!, is_active: true },
            include: {
                _count: { select: { beds: true } },
                beds: {
                    where: { is_active: true },
                    select: {
                        id: true,
                        bed_number: true,
                        status: true,
                        bed_type: true,
                        admissions: {
                            where: { discharged_at: null },
                            take: 1,
                            select: { id: true, patient: { select: { first_name: true, last_name: true } } }
                        }
                    }
                }
            }
        });
        sendSuccess(res, wards);
    } catch (error) {
        logger.error('Get wards error', { error });
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch wards', 500);
    }
});

router.post('/', authorize('wards:write'), auditMiddleware({ resource: 'ward', action: 'CREATE' }), async (req: Request, res: Response) => {
    try {
        const data = wardSchema.parse(req.body);
        const tenantId = req.tenantId!;

        const existingWard = await prisma.ward.findFirst({
            where: { tenant_id: tenantId, code: data.code }
        });
        if (existingWard) {
            return sendError(res, ErrorCodes.CONFLICT, 'A ward with this code already exists', 409);
        }

        const ward = await prisma.$transaction(async (tx) => {
            const newWard = await tx.ward.create({
                data: {
                    name: data.name,
                    code: data.code,
                    type: data.type,
                    daily_rate: data.daily_rate,
                    total_beds: data.total_beds,
                    department_id: data.department_id,
                    tenant_id: tenantId
                }
            });

            // Auto-create beds
            const bedsData = Array.from({ length: data.total_beds }).map((_, i) => ({
                tenant_id: tenantId,
                ward_id: newWard.id,
                bed_number: `${data.code}-${(i + 1).toString().padStart(2, '0')}`,
                status: 'AVAILABLE' as const
            }));

            await tx.bed.createMany({
                data: bedsData as any
            });

            return newWard;
        });

        sendCreated(res, ward);
    } catch (error: any) {
        if (error instanceof z.ZodError) return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
        logger.error('Create ward error', { error });
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to create ward', 500);
    }
});

router.delete('/:id', authorize('wards:write'), auditMiddleware({ resource: 'ward', action: 'DELETE' }), async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId!;

        // Check if there are active admissions
        const activeAdmissions = await prisma.bedAdmission.count({
            where: {
                tenant_id: tenantId,
                discharged_at: null,
                bed: { ward_id: id }
            }
        });

        if (activeAdmissions > 0) {
            return sendError(res, ErrorCodes.BAD_REQUEST, 'Cannot delete ward with active patients.', 400);
        }

        await prisma.$transaction(async (tx) => {
            // Deactivate beds first
            await tx.bed.updateMany({
                where: { ward_id: id, tenant_id: tenantId },
                data: { is_active: false }
            });

            // Deactivate ward
            await tx.ward.update({
                where: { id, tenant_id: tenantId },
                data: { is_active: false }
            });
        });

        sendSuccess(res, { message: 'Ward deleted successfully' });
    } catch (error) {
        logger.error('Delete ward error', { error });
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to delete ward', 500);
    }
});

router.patch('/:id', authorize('wards:write'), auditMiddleware({ resource: 'ward', action: 'UPDATE' }), async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId!;
        const data = wardSchema.partial().parse(req.body);

        const ward = await prisma.ward.update({
            where: { id, tenant_id: tenantId },
            data: {
                name: data.name,
                code: data.code,
                type: data.type,
                daily_rate: data.daily_rate ? new Decimal(data.daily_rate) : undefined,
                department_id: data.department_id,
                total_beds: data.total_beds
            }
        });

        sendSuccess(res, ward);
    } catch (error: any) {
        if (error instanceof z.ZodError) return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
        logger.error('Update ward error', { error });
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to update ward', 500);
    }
});

// BED ROUTES
router.post('/beds', authorize('wards:write'), async (req: any, res: Response) => {
    try {
        const data = bedSchema.parse(req.body);
        const bed = await prisma.bed.create({
            data: { ...data, tenant_id: req.tenantId! }
        });
        sendCreated(res, bed);
    } catch (error: any) {
        if (error instanceof z.ZodError) return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to create bed', 500);
    }
});

// ADMISSION ROUTES
router.post('/admissions', authorize('wards:write'), async (req: any, res: Response) => {
    try {
        const data = admissionSchema.parse(req.body);
        const tenantId = req.tenantId!;

        // Check if bed is available
        const bed = await prisma.bed.findFirst({ where: { id: data.bed_id, tenant_id: tenantId } });
        if (!bed || bed.status !== 'AVAILABLE') return sendError(res, ErrorCodes.BAD_REQUEST, 'Bed is not available', 400);

        // Create admission and update bed status in a transaction
        const admission = await prisma.$transaction(async (tx) => {
            const new_admission = await tx.bedAdmission.create({
                data: {
                    tenant_id: tenantId,
                    patient_id: data.patient_id,
                    bed_id: data.bed_id,
                    admission_notes: data.admission_notes,
                    diagnosis_on_admission: data.diagnosis_on_admission,
                    advance_paid: data.advance_paid || 0,
                    expected_discharge: data.expected_discharge,
                    admitted_by: req.user!.userId
                }
            });

            await tx.bed.update({
                where: { id: data.bed_id },
                data: { status: 'OCCUPIED' }
            });

            return new_admission;
        });

        sendCreated(res, admission);
    } catch (error: any) {
        if (error instanceof z.ZodError) return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
        logger.error('Admission error', { error });
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to admit patient', 500);
    }
});

// TRANSFER ROUTES
router.post('/admissions/:id/transfer', authorize('wards:write'), auditMiddleware({ resource: 'admission', action: 'UPDATE' }), async (req: any, res: Response) => {
    try {
        const { id } = req.params; // Current admission ID
        const { new_bed_id, notes } = z.object({
            new_bed_id: z.string().uuid(),
            notes: z.string().optional()
        }).parse(req.body);
        const tenantId = req.tenantId!;

        const currentAdmission = await prisma.bedAdmission.findUnique({
            where: { id, tenant_id: tenantId },
            include: { bed: { include: { ward: true } } }
        });

        if (!currentAdmission || currentAdmission.discharged_at) {
            return sendError(res, ErrorCodes.BAD_REQUEST, 'Admission not found or already discharged', 400);
        }

        const newBed = await prisma.bed.findFirst({
            where: { id: new_bed_id, tenant_id: tenantId },
            include: { ward: true }
        });

        if (!newBed || newBed.status !== 'AVAILABLE') {
            return sendError(res, ErrorCodes.BAD_REQUEST, 'New bed is not available', 400);
        }

        const updatedAdmission = await prisma.$transaction(async (tx) => {
            // 1. Mark current bed as AVAILABLE
            await tx.bed.update({
                where: { id: currentAdmission.bed_id },
                data: { status: 'AVAILABLE' }
            });

            // 2. Mark new bed as OCCUPIED
            await tx.bed.update({
                where: { id: new_bed_id },
                data: { status: 'OCCUPIED' }
            });

            // 3. Close existing admission
            await tx.bedAdmission.update({
                where: { id },
                data: {
                    discharged_at: new Date(),
                    discharge_notes: `SYSTEM: Patient transferred to ${newBed.ward.name} (${newBed.bed_number}). ${notes || ''}`,
                    discharged_by: req.user!.userId
                }
            });

            // 4. Create NEW admission for the new bed
            const new_admission = await tx.bedAdmission.create({
                data: {
                    tenant_id: tenantId,
                    patient_id: currentAdmission.patient_id,
                    bed_id: new_bed_id,
                    admission_notes: `SYSTEM: Transferred from ${currentAdmission.bed.ward.name} (${currentAdmission.bed.bed_number}). ${notes || ''}`,
                    diagnosis_on_admission: currentAdmission.diagnosis_on_admission,
                    advance_paid: 0,
                    admitted_by: req.user!.userId
                },
                include: {
                    patient: true,
                    bed: { include: { ward: true } }
                }
            });

            // 5. Create an automatic progress note to record the transfer history
            await tx.progressNote.create({
                data: {
                    tenant_id: tenantId,
                    admission_id: new_admission.id,
                    patient_id: currentAdmission.patient_id,
                    doctor_id: req.user!.userId,
                    category: 'NURSING',
                    note: `SYSTEM: Patient transferred from ${currentAdmission.bed.ward.name} (${currentAdmission.bed.bed_number}) to ${newBed.ward.name} (${newBed.bed_number}). Reason: ${notes || 'Not specified'}`
                }
            });

            return new_admission;
        });

        sendSuccess(res, { message: 'Transfer successful', admission: updatedAdmission });
    } catch (error: any) {
        if (error instanceof z.ZodError) return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
        logger.error('Transfer error', { error });
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to transfer patient', 500);
    }
});

// DISCHARGE ROUTES
router.post('/admissions/:id/discharge', authorize('wards:write'), async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { notes } = z.object({ notes: z.string().optional() }).parse(req.body);
        const tenantId = req.tenantId!;

        const admission = await prisma.bedAdmission.findUnique({
            where: { id, tenant_id: tenantId }
        });

        if (!admission || admission.discharged_at) {
            return sendError(res, ErrorCodes.BAD_REQUEST, 'Admission not found or already discharged', 400);
        }

        await prisma.$transaction(async (tx) => {
            await tx.bedAdmission.update({
                where: { id },
                data: {
                    discharged_at: new Date(),
                    discharge_notes: notes,
                    discharged_by: req.user!.userId
                }
            });

            await tx.bed.update({
                where: { id: admission.bed_id },
                data: { status: 'AVAILABLE' }
            });
        });

        sendSuccess(res, { message: 'Patient discharged successfully' });
    } catch (error) {
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to discharge patient', 500);
    }
});

// ADMISSION DETAIL & CHARGES
router.get('/admissions/:id', authorize('wards:read'), async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId!;

        const currentAdmission = await prisma.bedAdmission.findUnique({
            where: { id, tenant_id: tenantId },
            include: {
                patient: true,
                bed: { include: { ward: true } }
            }
        });

        if (!currentAdmission) return sendError(res, ErrorCodes.NOT_FOUND, 'Admission not found', 404);

        // To support transfers, we fetch all admissions for this patient
        // We will aggregate vitals, notes, and charges from all admissions that are still "relevant" 
        // (e.g., from the current stay or uninvoiced)
        const allPatientAdmissions = await prisma.bedAdmission.findMany({
            where: { patient_id: currentAdmission.patient_id, tenant_id: tenantId },
            include: { bed: { include: { ward: true } } }
        });
        const admissionIds = allPatientAdmissions.map(a => a.id);

        const [charges, vitals, progress_notes, payments] = await Promise.all([
            prisma.patientCharge.findMany({
                where: { admission_id: { in: admissionIds }, tenant_id: tenantId },
                orderBy: { created_at: 'desc' }
            }),
            prisma.vitalSign.findMany({
                where: { admission_id: { in: admissionIds }, tenant_id: tenantId },
                orderBy: { recorded_at: 'desc' },
                take: 50
            }),
            prisma.progressNote.findMany({
                where: { admission_id: { in: admissionIds }, tenant_id: tenantId },
                include: { doctor: { select: { first_name: true, last_name: true } } },
                orderBy: { created_at: 'desc' }
            }),
            prisma.payment.findMany({
                where: { admission_id: { in: admissionIds }, tenant_id: tenantId },
                orderBy: { created_at: 'desc' }
            })
        ]);

        // Calculate aggregate stay cost across all admissions
        let totalStayCost = 0;
        let totalDays = 0;
        const stayBreakdown = [];

        for (const adm of allPatientAdmissions) {
            const start = new Date(adm.admitted_at);
            const end = adm.discharged_at ? new Date(adm.discharged_at) : new Date();
            const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
            const rate = adm.bed.daily_rate_override || adm.bed.ward.daily_rate;
            const cost = diffDays * Number(rate);

            totalStayCost += cost;
            totalDays += diffDays;
            stayBreakdown.push({
                ward: adm.bed.ward.name,
                bed: adm.bed.bed_number,
                days: diffDays,
                rate,
                cost
            });
        }

        const totalCharges = charges.reduce((sum, c) => sum + (Number(c.amount) * c.quantity), 0);
        const totalAdvance = allPatientAdmissions.reduce((sum, a) => sum + Number(a.advance_paid), 0);

        sendSuccess(res, {
            ...currentAdmission,
            charges,
            vitals,
            progress_notes,
            payments,
            stay_details: {
                total_days: totalDays,
                total_stay_cost: totalStayCost,
                breakdown: stayBreakdown
            },
            running_total: totalStayCost + totalCharges - totalAdvance
        });
    } catch (error) {
        logger.error('Get admission detail error', { error });
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch admission detail', 500);
    }
});

router.post('/admissions/:id/charges', authorize('wards:write'), async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const data = chargeSchema.parse(req.body);
        const tenantId = req.tenantId!;

        const admission = await prisma.bedAdmission.findUnique({ where: { id, tenant_id: tenantId } });
        if (!admission) return sendError(res, ErrorCodes.NOT_FOUND, 'Admission not found', 404);

        const charge = await prisma.patientCharge.create({
            data: {
                tenant_id: tenantId,
                admission_id: id,
                patient_id: admission.patient_id,
                description: data.description,
                amount: new Decimal(data.amount),
                quantity: data.quantity,
                category: data.category,
                is_emergency: data.is_emergency,
                service_status: (data.category === 'SURGERY' && !data.is_emergency) ? 'PENDING_APPROVAL' : 'READY',
                performed_by: req.user!.userId
            }
        });

        sendCreated(res, charge);
    } catch (error: any) {
        if (error instanceof z.ZodError) return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to add charge', 500);
    }
});

router.delete('/admissions/:id/charges/:chargeId', authorize('wards:write'), async (req: any, res: Response) => {
    try {
        const { id, chargeId } = req.params;
        const tenantId = req.tenantId!;

        await prisma.patientCharge.delete({
            where: { id: chargeId, admission_id: id, tenant_id: tenantId }
        });

        sendSuccess(res, { message: 'Charge removed successfully' });
    } catch (error) {
        logger.error('Delete charge error', { error });
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to delete charge', 500);
    }
});

router.patch('/admissions/:id/charges/:chargeId', authorize('wards:write'), async (req: any, res: Response) => {
    try {
        const { id, chargeId } = req.params;
        const tenantId = req.tenantId!;
        const { quantity, amount } = z.object({
            quantity: z.number().int().positive().optional(),
            amount: z.number().positive().optional()
        }).parse(req.body);

        const updated = await prisma.patientCharge.update({
            where: { id: chargeId, admission_id: id, tenant_id: tenantId },
            data: {
                quantity: quantity,
                amount: amount ? new Decimal(amount) : undefined
            }
        });

        sendSuccess(res, updated);
    } catch (error: any) {
        if (error instanceof z.ZodError) return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
        logger.error('Update charge error', { error });
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to update charge', 500);
    }
});

const vitalsSchema = z.object({
    temperature: z.number().optional(),
    blood_pressure_systolic: z.number().int().optional(),
    blood_pressure_diastolic: z.number().int().optional(),
    pulse_rate: z.number().int().optional(),
    respiratory_rate: z.number().int().optional(),
    oxygen_saturation: z.number().optional(),
    weight: z.number().optional(),
    height: z.number().optional(),
    notes: z.string().optional(),
});

router.post('/admissions/:id/vitals', authorize('wards:write'), async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId!;
        const data = vitalsSchema.parse(req.body);

        const admission = await prisma.bedAdmission.findUnique({ where: { id, tenant_id: tenantId } });
        if (!admission) return sendError(res, ErrorCodes.NOT_FOUND, 'Admission not found', 404);

        const vitals = await prisma.vitalSign.create({
            data: {
                tenant_id: tenantId,
                admission_id: id,
                patient_id: admission.patient_id,
                temperature: data.temperature || null,
                blood_pressure_systolic: data.blood_pressure_systolic,
                blood_pressure_diastolic: data.blood_pressure_diastolic,
                pulse_rate: data.pulse_rate,
                respiratory_rate: data.respiratory_rate,
                oxygen_saturation: data.oxygen_saturation || null,
                weight: data.weight || null,
                height: data.height || null,
                recorded_by: req.user!.userId
            }
        });

        sendCreated(res, vitals);
    } catch (error: any) {
        if (error instanceof z.ZodError) return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
        logger.error('Add vitals error', { error });
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to add vitals', 500);
    }
});

router.post('/admissions/:id/charges/:chargeId/approve', authorize('wards:write'), async (req: any, res: Response) => {
    try {
        const { id, chargeId } = req.params;
        const tenantId = req.tenantId!;

        const charge = await prisma.patientCharge.findFirst({
            where: { id: chargeId, admission_id: id, tenant_id: tenantId }
        });

        if (!charge) return sendError(res, ErrorCodes.NOT_FOUND, 'Charge not found', 404);

        // Logic: If planned surgery, check if paid or if we just want to force approve
        const updated = await prisma.patientCharge.update({
            where: { id: chargeId },
            data: {
                service_status: 'APPROVED',
                approved_at: new Date(),
                approved_by: req.user!.userId
            }
        });

        sendSuccess(res, updated);
    } catch (error) {
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to approve charge', 500);
    }
});

router.post('/admissions/:id/notes', authorize('wards:write'), async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const data = noteSchema.parse(req.body);
        const tenantId = req.tenantId!;

        const admission = await prisma.bedAdmission.findUnique({ where: { id, tenant_id: tenantId } });
        if (!admission) return sendError(res, ErrorCodes.NOT_FOUND, 'Admission not found', 404);

        const note = await prisma.progressNote.create({
            data: {
                tenant_id: tenantId,
                admission_id: id,
                patient_id: admission.patient_id,
                doctor_id: req.user!.userId,
                note: data.note,
                category: data.category
            }
        });

        sendCreated(res, note);
    } catch (error: any) {
        if (error instanceof z.ZodError) return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to add note', 500);
    }
});

router.post('/admissions/:id/payments', authorize('wards:write'), async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const data = paymentSchema.parse(req.body);
        const tenantId = req.tenantId!;

        const admission = await prisma.bedAdmission.findUnique({ where: { id, tenant_id: tenantId } });
        if (!admission) return sendError(res, ErrorCodes.NOT_FOUND, 'Admission not found', 404);

        const payment = await prisma.$transaction(async (tx) => {
            const p = await tx.payment.create({
                data: {
                    tenant_id: tenantId,
                    admission_id: id,
                    amount: new Decimal(data.amount),
                    method: data.method,
                    transaction_id: data.transaction_id,
                    notes: data.notes,
                    received_by: req.user!.userId
                }
            });

            // Update advance_paid by incrementing
            await tx.bedAdmission.update({
                where: { id },
                data: {
                    advance_paid: { increment: data.amount }
                }
            });

            return p;
        });

        sendCreated(res, payment);
    } catch (error: any) {
        if (error instanceof z.ZodError) return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to record payment', 500);
    }
});

export default router;
