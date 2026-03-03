import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../services/prisma';
import { sendSuccess, sendError, sendCreated, ErrorCodes } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { auditMiddleware } from '../../middleware/audit';
import { logger } from '../../utils/logger';
import { Decimal } from '@prisma/client/runtime/library';
import { InventoryService } from '../inventory/inventory.service';
import { AccountingService } from '../accounting/accounting.service';

const router = Router();
router.use(authenticate);

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const inventorySchema = z.object({
  drug_name: z.string().min(1),
  sku: z.string().min(1),
  batch_number: z.string().min(1),
  stock_quantity: z.number().min(0),
  unit_cost: z.number().min(0),
  selling_price: z.number().min(0),
  expiry_date: z.string(),
  hsn_code: z.string().optional(),
});

const saleSchema = z.object({
  patient_id: z.string().uuid().optional(),
  guest_name: z.string().optional(),
  guest_phone: z.string().optional(),
  items: z.array(z.object({
    inventory_item_id: z.string().uuid(),
    quantity: z.number().positive(),
  })),
});

const dispenseSchema = z.object({
  prescription_id: z.string().uuid(),
  items: z.array(z.object({
    prescription_item_id: z.string().uuid(),
    inventory_item_id: z.string().uuid(),
    quantity: z.number().positive(),
  })),
});

const adjustStockSchema = z.object({
  new_quantity: z.number().min(0),
  reason: z.string().min(1),
});

// POST /api/v1/pharmacy/inventory (Create/Add Item & Stock)
router.post('/inventory', authorize('pharmacy:manage'), async (req: any, res: any) => {
  try {
    const tenantId = req.tenantId!;
    const data = inventorySchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const invService = new InventoryService(tx);
      const accService = new AccountingService(tx);

      // 1. Ensure/Create basic Pharmacy Warehouse
      let warehouse = await tx.warehouse.findFirst({
        where: { tenant_id: tenantId, code: 'PH01' }
      });
      if (!warehouse) {
        warehouse = await tx.warehouse.create({
          data: { tenant_id: tenantId, name: 'Main Pharmacy', code: 'PH01', type: 'PHARMACY' }
        });
      }

      // 2. Ensure/Create the Inventory Item
      let item = await tx.inventoryItem.findFirst({
        where: { tenant_id: tenantId, sku: data.sku }
      });
      if (!item) {
        item = await tx.inventoryItem.create({
          data: {
            tenant_id: tenantId,
            name: data.drug_name,
            sku: data.sku,
            category: 'MEDICINE',
            hsn_code: data.hsn_code,
            description: data.drug_name
          }
        });
      }

      // 3. Record "PURCHASE" Movement (Inward to Pharmacy Warehouse)
      const movement = await invService.recordMovement({
        tenantId,
        itemId: item.id,
        batchNumber: data.batch_number,
        quantity: data.stock_quantity,
        type: 'PURCHASE',
        toWarehouseId: warehouse.id,
        performedBy: req.user!.userId,
        unitCost: data.unit_cost,
        sellingPrice: data.selling_price,
        expiryDate: new Date(data.expiry_date)
      });

      // 4. Accounting Entry (Purchase)
      const inventoryAcc = await accService.findOrCreateAccount(tenantId, '1300', 'Inventory Asset', 'ASSET');
      const cashAcc = await accService.findOrCreateAccount(tenantId, '1000', 'Cash/Bank', 'ASSET');

      const totalCost = data.unit_cost * data.stock_quantity;
      await accService.createJournalEntry({
        tenantId,
        referenceType: 'PURCHASE',
        referenceId: movement.id,
        performedBy: req.user!.userId,
        notes: `Purchased ${data.drug_name} batch ${data.batch_number}`,
        entries: [
          { accountId: inventoryAcc.id, debit: totalCost, credit: 0 },
          { accountId: cashAcc.id, debit: 0, credit: totalCost }
        ]
      });

      return { item, movement };
    });

    sendCreated(res, result);
  } catch (e: any) {
    logger.error('Inventory creation error', { error: e.message });
    sendError(res, ErrorCodes.BAD_REQUEST, e.message, 400);
  }
});

// POST /api/v1/pharmacy/sale (OTC Sale)
router.post('/sale', authorize('pharmacy:write'), async (req: Request, res: Response) => {
  try {
    const data = req.body; // { patient_id, items: [{ sku, quantity }] }
    const tenantId = req.tenantId!;

    const result = await prisma.$transaction(async (tx) => {
      const invService = new InventoryService(tx);
      const accService = new AccountingService(tx);

      let warehouse = await tx.warehouse.findFirst({ where: { tenant_id: tenantId, code: 'PH01' } });
      if (!warehouse) {
        warehouse = await tx.warehouse.create({
          data: {
            tenant_id: tenantId,
            name: 'Main Pharmacy',
            code: 'PH01',
            type: 'PHARMACY',
            is_active: true
          }
        });
      }

      let totalSaleAmount = 0;
      const saleItems = [];

      for (const sItem of data.items) {
        // Find item by ID instead of SKU (Frontend sends item.id as inventory_item_id)
        const item = await tx.inventoryItem.findFirst({ where: { tenant_id: tenantId, id: sItem.inventory_item_id } });
        if (!item) throw new Error(`Item ${sItem.inventory_item_id} not found`);

        // Deduct stock using FIFO
        await invService.deductStockFIFO(tenantId, warehouse.id, item.id, sItem.quantity, {
          performedBy: req.user!.userId,
          referenceType: 'SALE'
        });

        // Get selling price (from the latest batch with stock)
        const stock = await tx.inventoryStock.findFirst({
          where: { item_id: item.id, warehouse_id: warehouse.id, quantity: { gt: 0 } },
          orderBy: { expiry_date: 'asc' }
        });
        const price = Number(stock?.selling_price || 0);
        totalSaleAmount += price * sItem.quantity;

        saleItems.push({
          description: item.name,
          quantity: sItem.quantity,
          unit_price: price,
          total: price * sItem.quantity
        });
      }

      // Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          tenant: { connect: { id: tenantId } },
          ...(data.patient_id ? { patient: { connect: { id: data.patient_id } } } : {}),
          invoice_number: `SALE-${Date.now()}`,
          subtotal: new Decimal(totalSaleAmount),
          total: new Decimal(totalSaleAmount),
          balance_due: new Decimal(0),
          status: 'PAID',
          created_by: req.user!.userId,
          items: {
            create: saleItems.map(i => ({
              ...i,
              unit_price: new Decimal(i.unit_price),
              total: new Decimal(i.total),
              category: 'pharmacy'
            }))
          }
        }
      });

      // Accounting Logic
      const cashAcc = await accService.findOrCreateAccount(tenantId, '1000', 'Cash/Bank', 'ASSET');
      const salesAcc = await accService.findOrCreateAccount(tenantId, '4100', 'Pharmacy Sales', 'INCOME');

      await accService.createJournalEntry({
        tenantId,
        referenceType: 'SALE',
        referenceId: invoice.id,
        performedBy: req.user!.userId,
        notes: `Pharmacy OTC Sale ${invoice.invoice_number}`,
        entries: [
          { accountId: cashAcc.id, debit: totalSaleAmount, credit: 0 },
          { accountId: salesAcc.id, debit: 0, credit: totalSaleAmount }
        ]
      });

      return invoice;
    });

    sendCreated(res, result);
  } catch (e: any) {
    sendError(res, ErrorCodes.BAD_REQUEST, e.message, 400);
  }
});

// GET /api/v1/pharmacy/inventory
router.get('/inventory', authorize('pharmacy:read'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { page = 1, limit = 20, search, status, expiring_soon } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // 1. Get Pharmacy Warehouse
    const warehouse = await prisma.warehouse.findFirst({
      where: { tenant_id: tenantId, code: 'PH01' }
    });

    if (!warehouse) {
      sendSuccess(res, [], 200, { total: 0, page: Number(page), limit: Number(limit) });
      return;
    }

    // 2. Build Where Clause
    const whereClause: any = {
      tenant_id: tenantId,
      category: 'MEDICINE',
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { sku: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    // 3. Fetch Items
    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where: whereClause,
        include: {
          stocks: {
            where: { warehouse_id: warehouse.id },
            orderBy: { expiry_date: 'asc' }
          }
        },
        skip,
        take,
        orderBy: { name: 'asc' }
      }),
      prisma.inventoryItem.count({ where: whereClause })
    ]);

    // 4. Transform and Filter Data
    let processedItems = items.map(item => {
      const stocks = item.stocks || [];
      const totalQuantity = stocks.reduce((sum, s) => sum + Number(s.quantity), 0);
      const primaryStock = stocks[0] || null;

      let calculatedStatus = 'IN_STOCK';
      if (totalQuantity === 0) calculatedStatus = 'OUT_OF_STOCK';
      else if (totalQuantity < 20) calculatedStatus = 'LOW_STOCK';

      return {
        ...item,
        drug_name: item.name, // Map name to drug_name for frontend
        generic_name: item.description, // Use description as generic_name fallback
        total_quantity: totalQuantity,
        stock_status: calculatedStatus,
        // Flatten primary stock for frontend compatibility
        batch_number: primaryStock?.batch_number,
        expiry_date: primaryStock?.expiry_date,
        unit_cost: primaryStock?.unit_cost,
        selling_price: primaryStock?.selling_price,
        stock_quantity: totalQuantity, // alias for total_quantity
      };
    });

    // Handle additional filters if any
    if (status) {
      processedItems = processedItems.filter(item => item.stock_status === status);
    }

    if (expiring_soon === 'true') {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      processedItems = processedItems.filter(item => {
        return item.stocks.some(s => s.expiry_date && s.expiry_date <= thirtyDaysFromNow && s.expiry_date > now && Number(s.quantity) > 0);
      });
    }

    sendSuccess(res, processedItems, 200, {
      total,
      page: Number(page),
      limit: Number(limit)
    });

  } catch (e: any) {
    logger.error('Pharmacy Inventory Error:', { error: e.message });
    sendError(res, ErrorCodes.SERVER_ERROR, 'Failed to fetch pharmacy inventory', 500);
  }
});

// GET /api/v1/pharmacy/stats
router.get('/stats', authorize('pharmacy:read'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const warehouse = await prisma.warehouse.findFirst({ where: { tenant_id: tenantId, code: 'PH01' } });

    if (!warehouse) {
      sendSuccess(res, { totalItems: 0, lowStock: 0, outOfStock: 0, expiringSoon: 0 });
      return;
    }

    const items = await prisma.inventoryStock.findMany({
      where: { warehouse_id: warehouse.id },
      include: { item: true }
    });

    const totalItems = await prisma.inventoryItem.count({
      where: { tenant_id: tenantId, category: 'MEDICINE' }
    });

    let lowStock = 0;
    let outOfStock = 0;
    let expiringSoon = 0;

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    items.forEach(stock => {
      const q = Number(stock.quantity);
      if (q === 0) outOfStock++;
      else if (q < 20) lowStock++;

      if (stock.expiry_date && stock.expiry_date <= thirtyDaysFromNow && stock.expiry_date > now && q > 0) {
        expiringSoon++;
      }
    });

    sendSuccess(res, {
      totalItems,
      lowStock,
      outOfStock,
      expiringSoon
    });
  } catch (e: any) {
    sendError(res, ErrorCodes.SERVER_ERROR, 'Failed to fetch pharmacy stats', 500);
  }
});

// (Removed redundant/conflicting handlers - consolidated into core inventory/accounting)
export default router;
