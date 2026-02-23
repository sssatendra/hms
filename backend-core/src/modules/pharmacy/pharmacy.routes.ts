import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../services/prisma';
import { sendSuccess, sendError, sendCreated, ErrorCodes } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { auditMiddleware } from '../../middleware/audit';
import { cacheDel, cacheGet, cacheSet, CacheKeys, cacheDelPattern } from '../../services/redis';
import { addPharmacySyncJob, addNotificationJob } from '../../services/queue';
import { logger } from '../../utils/logger';

const router = Router();
router.use(authenticate);

// ─── Schemas ──────────────────────────────────────────────────────────────────

const inventorySchema = z.object({
  supplier_id: z.string().uuid().optional(),
  drug_name: z.string().min(1),
  generic_name: z.string().optional(),
  brand_name: z.string().optional(),
  sku: z.string().min(1),
  batch_number: z.string().min(1),
  barcode: z.string().optional(),
  category: z.string().min(1),
  formulation: z.string().optional(),
  manufacturer: z.string().optional(),
  expiry_date: z.string().transform((d) => new Date(d)),
  manufacture_date: z.string().transform((d) => new Date(d)).optional(),
  stock_quantity: z.number().int().min(0),
  reorder_level: z.number().int().min(0).default(10),
  max_stock_level: z.number().int().optional(),
  unit_cost: z.number().positive(),
  selling_price: z.number().positive(),
  mrp: z.number().positive().optional(),
  storage_condition: z.string().optional(),
  controlled_drug: z.boolean().default(false),
  location: z.string().optional(),
});

const dispenseSchema = z.object({
  prescription_id: z.string().uuid(),
  items: z.array(z.object({
    prescription_item_id: z.string().uuid(),
    inventory_item_id: z.string().uuid(),
    quantity: z.number().int().positive(),
  })),
});

const adjustStockSchema = z.object({
  new_quantity: z.number().int().min(0),
  reason: z.string().min(5),
});

// ─── Inventory CRUD ───────────────────────────────────────────────────────────

// GET /api/v1/pharmacy/inventory
router.get('/inventory', authorize('pharmacy:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const expiring_soon = req.query.expiring_soon === 'true';

    const where: any = { tenant_id: tenantId, is_active: true };

    if (search) {
      where.OR = [
        { drug_name: { contains: search, mode: 'insensitive' } },
        { generic_name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { batch_number: { contains: search } },
      ];
    }

    if (status) where.status = status;

    if (expiring_soon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      where.expiry_date = { lte: thirtyDaysFromNow, gte: new Date() };
    }

    const [items, total] = await Promise.all([
      prisma.pharmacyInventory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { supplier: { select: { name: true } } },
      }),
      prisma.pharmacyInventory.count({ where }),
    ]);

    sendSuccess(res, items, 200, {
      page, limit, total, totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error('Get inventory error', { error });
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch inventory', 500);
  }
});

// GET /api/v1/pharmacy/inventory/:id
router.get('/inventory/:id', authorize('pharmacy:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;

    const item = await prisma.pharmacyInventory.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        supplier: true,
        transactions: { take: 20, orderBy: { created_at: 'desc' } },
        stock_adjustments: { take: 10, orderBy: { created_at: 'desc' } },
      },
    });

    if (!item) {
      sendError(res, ErrorCodes.NOT_FOUND, 'Inventory item not found', 404);
      return;
    }

    sendSuccess(res, item);
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch item', 500);
  }
});

// POST /api/v1/pharmacy/inventory
router.post(
  '/inventory',
  authorize('pharmacy:manage'),
  auditMiddleware({ resource: 'pharmacy_inventory', action: 'CREATE' }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = inventorySchema.parse(req.body);
      const tenantId = req.tenantId!;

      // Check expiry
      if (data.expiry_date <= new Date()) {
        sendError(res, ErrorCodes.EXPIRED_ITEM, 'Cannot add already expired item', 400);
        return;
      }

      // Check unique batch + SKU per tenant
      const existing = await prisma.pharmacyInventory.findFirst({
        where: { tenant_id: tenantId, batch_number: data.batch_number, sku: data.sku },
      });

      if (existing) {
        sendError(res, ErrorCodes.CONFLICT, 'Batch number + SKU combination already exists', 409);
        return;
      }

      const item = await prisma.pharmacyInventory.create({
        data: { tenant_id: tenantId, ...data },
      });

      // Log transaction
      await prisma.pharmacyTransaction.create({
        data: {
          tenant_id: tenantId,
          inventory_item_id: item.id,
          type: 'PURCHASE',
          quantity: data.stock_quantity,
          unit_cost: data.unit_cost,
          total_amount: data.unit_cost * data.stock_quantity,
          performed_by: req.user!.userId,
        },
      });

      await cacheDelPattern(`tenant:${tenantId}:inventory*`);

      sendCreated(res, item);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
        return;
      }
      logger.error('Create inventory error', { error });
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to create inventory item', 500);
    }
  }
);

// PATCH /api/v1/pharmacy/inventory/:id/adjust-stock
// Uses PostgreSQL transaction + SELECT FOR UPDATE (row-level locking)
router.patch(
  '/inventory/:id/adjust-stock',
  authorize('pharmacy:manage'),
  auditMiddleware({ resource: 'pharmacy_inventory', action: 'UPDATE' }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;
      const { new_quantity, reason } = adjustStockSchema.parse(req.body);

      const result = await prisma.$transaction(async (tx) => {
        // SELECT FOR UPDATE to prevent concurrent modifications
        const item = await tx.$queryRaw<any[]>`
          SELECT id, stock_quantity, tenant_id
          FROM pharmacy_inventory
          WHERE id = ${id} AND tenant_id = ${tenantId}
          FOR UPDATE
        `;

        if (!item.length) {
          throw new Error('NOT_FOUND');
        }

        const previousQty = item[0].stock_quantity;

        // Update stock
        const updated = await tx.pharmacyInventory.update({
          where: { id },
          data: {
            stock_quantity: new_quantity,
            status: new_quantity === 0
              ? 'OUT_OF_STOCK'
              : new_quantity <= 10
              ? 'LOW_STOCK'
              : 'ACTIVE',
          },
        });

        // Record adjustment
        await tx.stockAdjustment.create({
          data: {
            tenant_id: tenantId,
            inventory_item_id: id,
            previous_quantity: previousQty,
            new_quantity,
            adjustment_reason: reason,
            adjusted_by: req.user!.userId,
          },
        });

        // Log transaction
        const qty_diff = new_quantity - previousQty;
        await tx.pharmacyTransaction.create({
          data: {
            tenant_id: tenantId,
            inventory_item_id: id,
            type: 'ADJUSTMENT',
            quantity: Math.abs(qty_diff),
            unit_cost: updated.unit_cost,
            total_amount: Math.abs(qty_diff) * Number(updated.unit_cost),
            notes: reason,
            performed_by: req.user!.userId,
          },
        });

        return { updated, previousQty };
      });

      // Trigger stock alert check if low
      if (new_quantity <= 10) {
        await addPharmacySyncJob({
          tenantId,
          action: 'STOCK_ALERT',
        });
      }

      await cacheDelPattern(`tenant:${tenantId}:inventory*`);

      sendSuccess(res, result.updated);
    } catch (error: any) {
      if (error.message === 'NOT_FOUND') {
        sendError(res, ErrorCodes.NOT_FOUND, 'Inventory item not found', 404);
        return;
      }
      if (error instanceof z.ZodError) {
        sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
        return;
      }
      logger.error('Adjust stock error', { error });
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to adjust stock', 500);
    }
  }
);

// POST /api/v1/pharmacy/dispense
// Dispense prescription items with row-level locking to prevent overselling
router.post(
  '/dispense',
  authorize('pharmacy:dispense'),
  auditMiddleware({ resource: 'dispensing', action: 'CREATE' }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { prescription_id, items } = dispenseSchema.parse(req.body);
      const tenantId = req.tenantId!;

      const result = await prisma.$transaction(async (tx) => {
        // Lock prescription
        const prescription = await tx.$queryRaw<any[]>`
          SELECT id, status, tenant_id
          FROM prescriptions
          WHERE id = ${prescription_id} AND tenant_id = ${tenantId}
          FOR UPDATE
        `;

        if (!prescription.length) throw new Error('PRESCRIPTION_NOT_FOUND');
        if (!['ACTIVE', 'PARTIALLY_DISPENSED'].includes(prescription[0].status)) {
          throw new Error('INVALID_PRESCRIPTION_STATUS');
        }

        const dispensingLogs: any[] = [];

        for (const item of items) {
          // Lock inventory item for this dispensing
          const inventoryItems = await tx.$queryRaw<any[]>`
            SELECT id, stock_quantity, drug_name, expiry_date, status
            FROM pharmacy_inventory
            WHERE id = ${item.inventory_item_id} AND tenant_id = ${tenantId}
            FOR UPDATE
          `;

          if (!inventoryItems.length) throw new Error(`ITEM_NOT_FOUND:${item.inventory_item_id}`);

          const invItem = inventoryItems[0];

          if (new Date(invItem.expiry_date) <= new Date()) {
            throw new Error(`ITEM_EXPIRED:${invItem.drug_name}`);
          }

          if (invItem.stock_quantity < item.quantity) {
            throw new Error(`INSUFFICIENT_STOCK:${invItem.drug_name}:${invItem.stock_quantity}`);
          }

          // Deduct stock
          const newQty = invItem.stock_quantity - item.quantity;
          await tx.pharmacyInventory.update({
            where: { id: item.inventory_item_id },
            data: {
              stock_quantity: newQty,
              status: newQty === 0 ? 'OUT_OF_STOCK' : newQty <= 10 ? 'LOW_STOCK' : 'ACTIVE',
            },
          });

          // Update prescription item dispensed quantity
          await tx.prescriptionItem.update({
            where: { id: item.prescription_item_id },
            data: {
              quantity_dispensed: { increment: item.quantity },
            },
          });

          // Log transaction
          await tx.pharmacyTransaction.create({
            data: {
              tenant_id: tenantId,
              inventory_item_id: item.inventory_item_id,
              type: 'SALE',
              quantity: item.quantity,
              unit_cost: invItem.unit_cost || 0,
              total_amount: (invItem.unit_cost || 0) * item.quantity,
              reference_id: prescription_id,
              reference_type: 'PRESCRIPTION',
              performed_by: req.user!.userId,
            },
          });

          const log = await tx.dispensingLog.create({
            data: {
              tenant_id: tenantId,
              prescription_id,
              inventory_item_id: item.inventory_item_id,
              quantity_dispensed: item.quantity,
              dispensed_by: req.user!.userId,
            },
          });

          dispensingLogs.push(log);
        }

        // Update prescription status
        await tx.prescription.update({
          where: { id: prescription_id },
          data: {
            status: 'DISPENSED',
            dispensed_at: new Date(),
            dispensed_by: req.user!.userId,
          },
        });

        return dispensingLogs;
      });

      await cacheDelPattern(`tenant:${tenantId}:inventory*`);

      sendCreated(res, { dispensing_logs: result, message: 'Prescription dispensed successfully' });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
        return;
      }

      const errorMap: Record<string, [string, string, number]> = {
        'PRESCRIPTION_NOT_FOUND': [ErrorCodes.NOT_FOUND, 'Prescription not found', 404],
        'INVALID_PRESCRIPTION_STATUS': [ErrorCodes.CONFLICT, 'Prescription cannot be dispensed', 409],
      };

      for (const [key, [code, message, status]] of Object.entries(errorMap)) {
        if (error.message === key) {
          sendError(res, code, message, status);
          return;
        }
      }

      if (error.message?.startsWith('INSUFFICIENT_STOCK:')) {
        const [, drug, qty] = error.message.split(':');
        sendError(res, ErrorCodes.INSUFFICIENT_STOCK, `Insufficient stock for ${drug}. Available: ${qty}`, 409);
        return;
      }

      if (error.message?.startsWith('ITEM_EXPIRED:')) {
        sendError(res, ErrorCodes.EXPIRED_ITEM, `Item ${error.message.split(':')[1]} is expired`, 409);
        return;
      }

      logger.error('Dispense error', { error });
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to dispense prescription', 500);
    }
  }
);

// GET /api/v1/pharmacy/stats
router.get('/stats', authorize('pharmacy:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalItems,
      outOfStock,
      lowStock,
      expiringSoon,
      expired,
    ] = await Promise.all([
      prisma.pharmacyInventory.count({ where: { tenant_id: tenantId, is_active: true } }),
      prisma.pharmacyInventory.count({ where: { tenant_id: tenantId, status: 'OUT_OF_STOCK' } }),
      prisma.pharmacyInventory.count({ where: { tenant_id: tenantId, status: 'LOW_STOCK' } }),
      prisma.pharmacyInventory.count({
        where: { tenant_id: tenantId, expiry_date: { lte: thirtyDays, gte: now } },
      }),
      prisma.pharmacyInventory.count({
        where: { tenant_id: tenantId, expiry_date: { lt: now } },
      }),
    ]);

    sendSuccess(res, { totalItems, outOfStock, lowStock, expiringSoon, expired });
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch stats', 500);
  }
});

// GET /api/v1/pharmacy/suppliers
router.get('/suppliers', authorize('pharmacy:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const suppliers = await prisma.supplier.findMany({
      where: { tenant_id: tenantId, is_active: true },
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, suppliers);
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch suppliers', 500);
  }
});

// POST /api/v1/pharmacy/suppliers
router.post('/suppliers', authorize('pharmacy:manage'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const supplier = await prisma.supplier.create({
      data: { tenant_id: tenantId, ...req.body },
    });
    sendCreated(res, supplier);
  } catch (error) {
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to create supplier', 500);
  }
});

export default router;
