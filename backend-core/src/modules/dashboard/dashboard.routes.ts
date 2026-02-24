// /backend-core/src/modules/dashboard/dashboard.routes.ts
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { prisma } from '../../services/prisma';
import { sendSuccess } from '../../utils/response';

const router = Router();
router.use(authenticate);

router.get('/stats', async (req, res) => {
  const tenantId = req.tenantId!;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    total_patients,
    today_appointments,
    monthly_revenue,
    total_beds,
    occupied_beds
  ] = await Promise.all([
    prisma.patient.count({ where: { tenant_id: tenantId, is_active: true } }),
    prisma.appointment.count({
      where: {
        tenant_id: tenantId,
        scheduled_at: { gte: today, lt: tomorrow }
      }
    }),
    prisma.payment.aggregate({
      where: {
        tenant_id: tenantId,
        payment_date: { gte: startOfMonth }
      },
      _sum: { amount: true }
    }),
    prisma.bed.count({ where: { tenant_id: tenantId, is_active: true } }),
    prisma.bedAdmission.count({
      where: { tenant_id: tenantId, discharged_at: null }
    })
  ]);

  const bed_occupancy = total_beds > 0 ? (occupied_beds / total_beds * 100).toFixed(1) : 0;

  sendSuccess(res, {
    total_patients,
    today_appointments,
    monthly_revenue: monthly_revenue._sum.amount || 0,
    bed_occupancy: parseFloat(bed_occupancy as string)
  });
});

export default router;