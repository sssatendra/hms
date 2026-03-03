import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../services/prisma';
import { sendSuccess, sendError, sendCreated, ErrorCodes } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { InventoryService } from './inventory.service';
import { logger } from '../../utils/logger';

const router = Router();
router.use(authenticate);

const warehouseSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    type: z.enum(['CENTRAL', 'PHARMACY', 'LAB', 'WARD']),
});

const itemSchema = z.object({
    name: z.string().min(1),
    sku: z.string().min(1),
    category: z.string(),
    hsn_code: z.string().optional(),
    description: z.string().optional(),
});

const movementSchema = z.object({
    itemId: z.string().uuid(),
    batchNumber: z.string(),
    quantity: z.number().positive(),
    type: z.enum(['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT', 'SALE', 'PURCHASE', 'RETURN']),
    fromWarehouseId: z.string().uuid().optional(),
    toWarehouseId: z.string().uuid().optional(),
    unitCost: z.number().optional(),
    sellingPrice: z.number().optional(),
    expiryDate: z.string().transform(d => new Date(d)).optional(),
});

// ─── Warehouses ───────────────────────────────────────────────────────────────

router.get('/warehouses', authorize('inventory:read'), async (req: any, res) => {
    const warehouses = await prisma.warehouse.findMany({
        where: { tenant_id: req.tenantId! }
    });
    sendSuccess(res, warehouses);
});

router.post('/warehouses', authorize('inventory:manage'), async (req: any, res) => {
    try {
        const data = warehouseSchema.parse(req.body);
        const warehouse = await prisma.warehouse.create({
            data: { tenant_id: req.tenantId!, ...data }
        });
        sendCreated(res, warehouse);
    } catch (e) {
        sendError(res, ErrorCodes.VALIDATION_ERROR, 'Invalid data', 400);
    }
});

// ─── Inventory Items ──────────────────────────────────────────────────────────

router.get('/items', authorize('inventory:read'), async (req: any, res) => {
    const items = await prisma.inventoryItem.findMany({
        where: { tenant_id: req.tenantId! },
        include: { stocks: { include: { warehouse: true } } }
    });
    sendSuccess(res, items);
});

router.post('/items', authorize('inventory:manage'), async (req: any, res) => {
    try {
        const data = itemSchema.parse(req.body);
        const item = await prisma.inventoryItem.create({
            data: { tenant_id: req.tenantId!, ...data }
        });
        sendCreated(res, item);
    } catch (e) {
        sendError(res, ErrorCodes.VALIDATION_ERROR, 'Invalid data', 400);
    }
});

// ─── Stock Movements ──────────────────────────────────────────────────────────

router.post('/movements', authorize('inventory:manage'), async (req: any, res) => {
    try {
        const data = movementSchema.parse(req.body);
        const inventoryService = new InventoryService();

        const result = await prisma.$transaction(async (tx) => {
            const service = new InventoryService(tx);
            return await service.recordMovement({
                tenantId: req.tenantId!,
                ...data,
                performedBy: req.user!.userId
            });
        });

        sendCreated(res, result);
    } catch (e: any) {
        logger.error('Inventory movement error', { error: e.message || 'Unknown error' });
        sendError(res, ErrorCodes.BAD_REQUEST, e.message || 'Movement failed', 400);
    }
});

router.get('/stats', authorize('inventory:read'), async (req: any, res) => {
    try {
        const service = new InventoryService();
        const stats = await service.getDashboardStats(req.tenantId!);
        sendSuccess(res, stats);
    } catch (e: any) {
        logger.error('Inventory stats error', { error: e.message });
        sendError(res, ErrorCodes.SERVER_ERROR, 'Failed to fetch inventory stats', 500);
    }
});

/**
 * GET /api/v1/inventory/forecast
 * Forecasts stock depletion based on consumption.
 */
router.get('/forecast', async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenantId!;
        const service = new InventoryService();
        const forecast = await service.getStockForecasting(tenantId);
        sendSuccess(res, forecast);
    } catch (error) {
        logger.error('Inventory forecast error', { error });
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to fetch forecastData', 500);
    }
});

export default router;
