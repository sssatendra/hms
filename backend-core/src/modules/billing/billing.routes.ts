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

const invoiceItemSchema = z.object({
    description: z.string(),
    quantity: z.number().min(1),
    unit_price: z.number().min(0),
    category: z.string().optional(),
    charge_id: z.string().uuid().optional(),
    dispensing_log_id: z.string().uuid().optional(),
    admission_id: z.string().uuid().optional(),
});

const checkoutSchema = z.object({
    patient_id: z.string().uuid(),
    appointment_id: z.string().uuid().optional(),
    items: z.array(invoiceItemSchema),
    discount: z.number().optional().default(0),
    tax: z.number().optional().default(0),
    insurance_provider: z.string().optional(),
    insurance_claim_id: z.string().optional(),
    insurance_amount_covered: z.number().optional().default(0),
    advance_paid: z.number().optional().default(0),
});

const paymentSchema = z.object({
    amount: z.number().positive(),
    method: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'INSURANCE', 'ONLINE']),
    transaction_id: z.string().optional(),
    notes: z.string().optional(),
});

// GET /api/v1/billing/invoices
router.get('/invoices', authorize('billing:read'), async (req: Request, res: Response) => {
    try {
        const invoices = await prisma.invoice.findMany({
            where: { tenant_id: req.tenantId! },
            include: { patient: { select: { first_name: true, last_name: true, mrn: true } } },
            orderBy: { created_at: 'desc' }
        });
        sendSuccess(res, invoices);
    } catch (error) {
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch invoices', 500);
    }
});

// GET /api/v1/billing/invoices/:id
router.get('/invoices/:id', authorize('billing:read'), async (req: Request, res: Response) => {
    try {
        const invoice = await prisma.invoice.findFirst({
            where: { id: req.params.id, tenant_id: req.tenantId! },
            include: {
                patient: true,
                items: true,
                payments: true,
                appointment: true
            }
        });
        if (!invoice) return sendError(res, ErrorCodes.NOT_FOUND, 'Invoice not found', 404);
        sendSuccess(res, invoice);
    } catch (error) {
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch invoice', 500);
    }
});

// POST /api/v1/billing/checkout (POS style)
router.post('/checkout', authorize('billing:write'), auditMiddleware({ resource: 'invoice', action: 'CREATE' }), async (req: Request, res: Response) => {
    try {
        const data = checkoutSchema.parse(req.body);
        const tenantId = req.tenantId!;

        // Generate invoice number
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const count = await prisma.invoice.count({ where: { tenant_id: tenantId } });
        const invoice_number = `INV-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

        const subtotal = data.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
        const total = subtotal - data.discount + data.tax;
        const balance_due = total - data.advance_paid - data.insurance_amount_covered;

        const invoice = await prisma.$transaction(async (tx) => {
            const inv = await tx.invoice.create({
                data: {
                    tenant_id: tenantId,
                    patient_id: data.patient_id,
                    appointment_id: data.appointment_id,
                    invoice_number,
                    subtotal: new Decimal(subtotal),
                    discount: new Decimal(data.discount),
                    tax: new Decimal(data.tax),
                    total: new Decimal(total),
                    advance_paid: new Decimal(data.advance_paid),
                    insurance_provider: data.insurance_provider,
                    insurance_claim_id: data.insurance_claim_id,
                    insurance_amount_covered: new Decimal(data.insurance_amount_covered),
                    balance_due: new Decimal(balance_due),
                    status: balance_due <= 0 ? 'PAID' : 'PENDING',
                    created_by: req.user!.userId,
                    items: {
                        create: data.items.map(item => ({
                            description: item.description,
                            quantity: item.quantity,
                            unit_price: new Decimal(item.unit_price),
                            total: new Decimal(item.unit_price * item.quantity),
                            category: item.category
                        }))
                    }
                }
            });

            // Mark charges as invoiced
            const chargeIds = data.items.map(i => i.charge_id).filter(id => !!id) as string[];
            if (chargeIds.length > 0) {
                await tx.patientCharge.updateMany({
                    where: { id: { in: chargeIds } },
                    data: { status: 'INVOICED', invoice_id: inv.id }
                });
            }

            // Mark dispensing logs as invoiced (setting notes for now)
            const logIds = data.items.map(i => i.dispensing_log_id).filter(id => !!id) as string[];
            if (logIds.length > 0) {
                await tx.dispensingLog.updateMany({
                    where: { id: { in: logIds } },
                    data: { notes: `Invoiced: ${inv.id}` }
                });
            }

            return inv;
        });

        sendCreated(res, invoice);
    } catch (error: any) {
        if (error instanceof z.ZodError) return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
        logger.error('Checkout error', { error });
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to process checkout', 500);
    }
});

// GET /api/v1/billing/draft/:patientId (Aggregate Billing)
router.get('/draft/:patientId', authorize('billing:read'), async (req: Request, res: Response) => {
    try {
        const { patientId } = req.params;
        const tenantId = req.tenantId!;

        // 1. Get all unbilled admissions
        const admissions = await prisma.bedAdmission.findMany({
            where: { patient_id: patientId, tenant_id: tenantId },
            include: { bed: { include: { ward: true } } }
        });

        // 2. Get unbilled prescriptions (items with quantity_dispensed > 0 but not linked to invoice)
        // For simplicity, we'll just return the admissions for now as per the "transfer" requirement.

        // 2. Get unbilled charges (surgeries, x-rays, etc.)
        const charges = await prisma.patientCharge.findMany({
            where: { patient_id: patientId, tenant_id: tenantId, status: 'PENDING' }
        });

        // 3. Get unbilled dispensed medicines
        const prescriptions = await prisma.dispensingLog.findMany({
            where: { tenant_id: tenantId, prescription: { patient_id: patientId }, notes: null }, // Using notes: null as 'unbilled' flag for now, or we could add a field
            include: { inventory_item: true }
        });

        const draftItems: any[] = [];
        let totalStayAdvance = 0;

        // Stay Charges
        for (const adm of admissions) {
            const start = new Date(adm.admitted_at);
            const end = adm.discharged_at ? new Date(adm.discharged_at) : new Date();

            const diffMs = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) || 1;

            const rate = adm.bed.daily_rate_override || adm.bed.ward.daily_rate;

            draftItems.push({
                description: `Room Stay: ${adm.bed.ward.name} - Bed ${adm.bed.bed_number} (${diffDays} days)`,
                quantity: diffDays,
                unit_price: Number(rate),
                category: 'room',
                metadata: { admission_id: adm.id }
            });

            totalStayAdvance += Number(adm.advance_paid);
        }

        // Ad-hoc Charges
        for (const charge of charges) {
            draftItems.push({
                description: charge.description,
                quantity: charge.quantity,
                unit_price: Number(charge.amount),
                category: charge.category,
                charge_id: charge.id
            });
        }

        // Medicine Charges
        for (const log of prescriptions) {
            draftItems.push({
                description: `Medicine: ${log.inventory_item.drug_name}`,
                quantity: log.quantity_dispensed,
                unit_price: Number(log.inventory_item.selling_price),
                category: 'pharmacy',
                dispensing_log_id: log.id
            });
        }

        sendSuccess(res, { items: draftItems, total_advance: totalStayAdvance });
    } catch (error) {
        logger.error('Draft invoice error', { error });
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to generate draft', 500);
    }
});

// POST /api/v1/billing/invoices/:id/payments
router.post('/invoices/:id/payments', authorize('billing:write'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = paymentSchema.parse(req.body);
        const tenantId = req.tenantId!;

        const invoice = await prisma.invoice.findFirst({ where: { id, tenant_id: tenantId } });
        if (!invoice) return sendError(res, ErrorCodes.NOT_FOUND, 'Invoice not found', 404);

        const payment = await prisma.$transaction(async (tx) => {
            const p = await tx.payment.create({
                data: {
                    tenant_id: tenantId,
                    invoice_id: id,
                    amount: new Decimal(data.amount),
                    method: data.method,
                    transaction_id: data.transaction_id,
                    notes: data.notes,
                    received_by: req.user!.userId
                }
            });

            const updatedPaid = Number(invoice.paid_amount) + data.amount;
            const newBalance = Number(invoice.total) - updatedPaid - Number(invoice.insurance_amount_covered) - Number(invoice.advance_paid);

            await tx.invoice.update({
                where: { id },
                data: {
                    paid_amount: new Decimal(updatedPaid),
                    balance_due: new Decimal(Math.max(0, newBalance)),
                    status: newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID'
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


// GET /api/v1/billing/packages
router.get('/packages', authorize('billing:read'), async (req, res) => {
  const packages = await prisma.surgeryPackage.findMany({
    where: { tenant_id: req.tenantId!, is_active: true }
  });
  sendSuccess(res, packages);
});

// POST /api/v1/billing/packages
router.post('/packages', authorize('billing:write'), async (req, res) => {
  const pkg = await prisma.surgeryPackage.create({
    data: {
      tenant_id: req.tenantId!,
      ...req.body
    }
  });
  sendCreated(res, pkg);
});

// POST /api/v1/billing/checkout-package
router.post('/checkout-package', authorize('billing:write'), async (req, res) => {
  const { patient_id, package_id, discount } = req.body;

  const pkg = await prisma.surgeryPackage.findUnique({
    where: { id: package_id }
  });

  if (!pkg) {
    return sendError(res, ErrorCodes.NOT_FOUND, 'Package not found', 404);
  }

  // Create invoice with package details
  const invoice = await prisma.invoice.create({
    data: {
      tenant_id: req.tenantId!,
      patient_id,
      invoice_number: generateInvoiceNumber(),
      subtotal: pkg.base_price,
      discount: new Decimal(discount || 0),
      total: new Decimal(pkg.base_price).minus(discount || 0),
      status: 'PENDING',
      created_by: req.user!.userId,
      items: {
        create: [
          {
            description: `${pkg.name} Package`,
            quantity: 1,
            unit_price: pkg.base_price,
            total: pkg.base_price,
            category: 'SURGERY_PACKAGE'
          }
        ]
      }
    }
  });

  sendCreated(res, invoice);
});


export default router;
