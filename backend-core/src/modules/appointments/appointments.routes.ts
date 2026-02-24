import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../services/prisma';
import { sendSuccess, sendError, sendCreated, ErrorCodes } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { auditMiddleware } from '../../middleware/audit';
import { addNotificationJob } from '../../services/queue';
import { logger } from '../../utils/logger';

const router = Router();
router.use(authenticate);

const appointmentSchema = z.object({
  patient_id: z.string().uuid(),
  doctor_id: z.string().uuid(),
  department_id: z.string().uuid().optional(),
  type: z.enum(['CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'PROCEDURE', 'LAB_VISIT', 'RADIOLOGY', 'VACCINATION', 'TELEMEDICINE']).default('CONSULTATION'),
  scheduled_at: z.string().transform((d) => new Date(d)),
  duration_mins: z.number().int().min(5).max(480).default(30),
  chief_complaint: z.string().optional(),
  notes: z.string().optional(),
  room_number: z.string().optional(),
});

// GET /api/v1/appointments
router.get('/', authorize('appointments:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;
    const status = req.query.status as string;
    const doctor_id = req.query.doctor_id as string;
    const patient_id = req.query.patient_id as string;
    const date = req.query.date as string;

    const where: any = { tenant_id: tenantId };
    if (status) where.status = status;
    if (patient_id) where.patient_id = patient_id;

    // Doctor can only see their own appointments
    if (req.user!.role === 'DOCTOR') {
      where.doctor_id = req.user!.userId;
    } else if (doctor_id) {
      where.doctor_id = doctor_id;
    }

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.scheduled_at = { gte: start, lte: end };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduled_at: 'asc' },
        include: {
          patient: { select: { id: true, first_name: true, last_name: true, mrn: true, phone: true } },
          doctor: { select: { id: true, first_name: true, last_name: true, specialization: true } },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    sendSuccess(res, appointments, 200, {
      page, limit, total, totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error('Get appointments error', { error });
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch appointments', 500);
  }
});

// POST /api/v1/appointments
router.post(
  '/',
  authorize('appointments:write'),
  auditMiddleware({ resource: 'appointment', action: 'CREATE' }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = appointmentSchema.parse(req.body);
      const tenantId = req.tenantId!;

      // Check doctor availability (no overlapping appointments)
      const overlapping = await prisma.appointment.findFirst({
        where: {
          tenant_id: tenantId,
          doctor_id: data.doctor_id,
          status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
          scheduled_at: {
            gte: new Date(data.scheduled_at.getTime() - data.duration_mins * 60000),
            lte: new Date(data.scheduled_at.getTime() + data.duration_mins * 60000),
          },
        },
      });

      if (overlapping) {
        sendError(res, ErrorCodes.CONFLICT, 'Doctor has an overlapping appointment at this time', 409);
        return;
      }

      const appointment = await prisma.appointment.create({
        data: {
          tenant_id: tenantId,
          created_by: req.user!.userId,
          ...data,
        },
        include: {
          patient: { select: { first_name: true, last_name: true, user_id: true } },
          doctor: { select: { first_name: true, last_name: true } },
        },
      });

      // Queue notification
      if (appointment.patient.user_id) {
        await addNotificationJob({
          tenantId,
          userId: appointment.patient.user_id,
          type: 'APPOINTMENT_REMINDER',
          title: 'Appointment Scheduled',
          message: `Your appointment with Dr. ${appointment.doctor.first_name} ${appointment.doctor.last_name} is scheduled for ${data.scheduled_at.toLocaleString()}`,
          data: { appointment_id: appointment.id },
        });
      }

      sendCreated(res, appointment);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
        return;
      }
      logger.error('Create appointment error', { error });
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to create appointment', 500);
    }
  }
);

// PATCH /api/v1/appointments/:id/status
router.patch('/appointments/:id/status', authorize('appointments:write'), async (req: Request, res: Response): Promise<void> => {
  // handled below
});

// PATCH /api/v1/appointments/:id
router.patch('/:id', authorize('appointments:write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;

    const appointment = await prisma.appointment.findFirst({ where: { id, tenant_id: tenantId } });
    if (!appointment) {
      sendError(res, ErrorCodes.NOT_FOUND, 'Appointment not found', 404);
      return;
    }

    const { status, cancelled_reason, ...rest } = req.body;

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...rest,
        status: status || appointment.status,
        cancelled_reason: status === 'CANCELLED' ? cancelled_reason : appointment.cancelled_reason,
      },
    });

    sendSuccess(res, updated);
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to update appointment', 500);
  }
});

// GET /api/v1/appointments/today
router.get('/today', authorize('appointments:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const where: any = {
      tenant_id: tenantId,
      scheduled_at: { gte: start, lte: end },
      status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
    };

    if (req.user!.role === 'DOCTOR') where.doctor_id = req.user!.userId;

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { scheduled_at: 'asc' },
      include: {
        patient: { select: { first_name: true, last_name: true, mrn: true, phone: true } },
        doctor: { select: { first_name: true, last_name: true } },
      },
    });

    sendSuccess(res, appointments);
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch today\'s appointments', 500);
  }
});


// GET /api/v1/appointments/queue/today
router.get('/queue/today', authorize('appointments:read'), async (req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const queue = await prisma.appointment.findMany({
    where: {
      tenant_id: req.tenantId!,
      scheduled_at: { gte: today, lt: tomorrow },
      status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] }
    },
    include: {
      patient: { select: { first_name: true, last_name: true, mrn: true } },
      doctor: { select: { first_name: true, last_name: true } }
    },
    orderBy: { scheduled_at: 'asc' }
  });

  const enriched = queue.map((apt:any, index:number) => ({
    ...apt,
    token_number: index + 1,
    estimated_wait_mins: index * 15 // 15 min per patient
  }));

  sendSuccess(res, enriched);
});

// PATCH /api/v1/appointments/:id/call-next
router.patch('/:id/call-next', authorize('appointments:write'), async (req: Request, res: Response) => {
  await prisma.appointment.update({
    where: { id: req.params.id },
    data: { status: 'IN_PROGRESS' }
  });
  // Trigger notification to patient
  sendSuccess(res, { message: 'Patient called' });
});



// GET /api/v1/appointments/available-slots
router.get('/available-slots', async (req: Request, res: Response) => {
  const { doctor_id, date } = req.query;
  
  const startDate = new Date(date as string);
  startDate.setHours(9, 0, 0, 0); // 9 AM
  const endDate = new Date(date as string);
  endDate.setHours(17, 0, 0, 0); // 5 PM

  // Get doctor's schedule
  const dayOfWeek = startDate.getDay();
  const schedule = await prisma.staffSchedule.findFirst({
    where: { user_id: doctor_id, day_of_week: dayOfWeek, is_active: true }
  });

  if (!schedule) {
    return sendSuccess(res, []);
  }

  // Get booked appointments
  const booked = await prisma.appointment.findMany({
    where: {
      doctor_id,
      scheduled_at: { gte: startDate, lte: endDate },
      status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] }
    },
    select: { scheduled_at: true, duration_mins: true }
  });

  // Generate 30-min slots
  const slots = [];
  let current = new Date(startDate);
  current.setHours(parseInt(schedule.start_time.split(':')[0]), parseInt(schedule.start_time.split(':')[1]));

  while (current < endDate) {
    const isBooked = booked.some(apt => {
      const start = new Date(apt.scheduled_at);
      const end = new Date(start.getTime() + apt.duration_mins * 60000);
      return current >= start && current < end;
    });

    slots.push({
      time: current.toISOString(),
      available: !isBooked
    });

    current = new Date(current.getTime() + 30 * 60000); // +30 mins
  }

  sendSuccess(res, slots);
});

// POST /api/v1/appointments/book-online
router.post('/book-online', async (req: Request, res: Response) => {
  // Similar to regular appointment creation but with patient self-booking
  // Status would be 'SCHEDULED' and require confirmation
});

export default router;
