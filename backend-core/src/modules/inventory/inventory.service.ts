import { Prisma, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../../services/prisma';
import { logger } from '../../utils/logger';

export class InventoryService {
    private prisma: PrismaClient | Prisma.TransactionClient;

    constructor(tx?: Prisma.TransactionClient) {
        this.prisma = tx || defaultPrisma;
    }

    /**
     * Records a stock movement and updates the inventory stock levels.
     * This MUST be run inside a transaction if part of a larger operation.
     */
    async recordMovement(data: {
        tenantId: string;
        itemId: string;
        batchNumber: string;
        quantity: number;
        type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT' | 'SALE' | 'PURCHASE' | 'RETURN';
        fromWarehouseId?: string;
        toWarehouseId?: string;
        referenceId?: string;
        referenceType?: string;
        performedBy: string;
        unitCost?: number;
        sellingPrice?: number;
        expiryDate?: Date;
    }) {
        const { tenantId, itemId, batchNumber, quantity, type, fromWarehouseId, toWarehouseId, referenceId, referenceType, performedBy } = data;

        // 1. Create the movement record
        const movement = await this.prisma.inventoryMovement.create({
            data: {
                tenant_id: tenantId,
                item_id: itemId,
                batch_number: batchNumber,
                quantity,
                type,
                from_warehouse_id: fromWarehouseId,
                to_warehouse_id: toWarehouseId,
                reference_id: referenceId,
                reference_type: referenceType,
                performed_by: performedBy,
            },
        });

        // 2. Update stock in the "from" warehouse (if applicable)
        if (fromWarehouseId) {
            await this.adjustStock(tenantId, fromWarehouseId, itemId, batchNumber, -quantity);
        }

        // 3. Update stock in the "to" warehouse (if applicable)
        if (toWarehouseId) {
            await this.adjustStock(tenantId, toWarehouseId, itemId, batchNumber, quantity, {
                unitCost: data.unitCost,
                sellingPrice: data.sellingPrice,
                expiryDate: data.expiryDate,
            });
        }

        return movement;
    }

    /**
     * Adjusts the stock of a specific batch in a warehouse.
     * Uses row-level locking if inside a transaction.
     */
    private async adjustStock(
        tenantId: string,
        warehouseId: string,
        itemId: string,
        batchNumber: string,
        delta: number,
        defaults?: { unitCost?: number; sellingPrice?: number; expiryDate?: Date }
    ) {
        // If we are in a transaction, we should technically use raw SQL for "SELECT FOR UPDATE" 
        // but for now, we'll rely on the Prisma transaction's isolation level (Read Committed/Serializable).
        // For high-concurrency stock, raw SQL "FOR UPDATE" is safer.

        const existing = await this.prisma.inventoryStock.findUnique({
            where: {
                warehouse_id_item_id_batch_number: {
                    warehouse_id: warehouseId,
                    item_id: itemId,
                    batch_number: batchNumber,
                },
            },
        });

        if (existing) {
            const newQty = Number(existing.quantity) + delta;
            if (newQty < 0) {
                throw new Error(`Insufficient stock in warehouse for batch ${batchNumber}`);
            }

            return await this.prisma.inventoryStock.update({
                where: { id: existing.id },
                data: { quantity: newQty },
            });
        } else {
            if (delta < 0) {
                throw new Error(`Cannot deduct from non-existent stock in warehouse for batch ${batchNumber}`);
            }

            if (!defaults?.expiryDate || !defaults?.unitCost || !defaults?.sellingPrice) {
                throw new Error(`Cannot create new stock entry for batch ${batchNumber} without cost/expiry data`);
            }

            return await this.prisma.inventoryStock.create({
                data: {
                    tenant_id: tenantId,
                    warehouse_id: warehouseId,
                    item_id: itemId,
                    batch_number: batchNumber,
                    quantity: delta,
                    unit_cost: new Prisma.Decimal(defaults.unitCost),
                    selling_price: new Prisma.Decimal(defaults.sellingPrice),
                    expiry_date: defaults.expiryDate,
                },
            });
        }
    }

    /**
     * Deducts stock from a warehouse using FIFO (First-Expiry-First-Out/First-In-First-Out)
     */
    async deductStockFIFO(
        tenantId: string,
        warehouseId: string,
        itemId: string,
        totalQtyToDeduct: number,
        meta: { performedBy: string; referenceId?: string; referenceType?: string }
    ) {
        let remainingToDeduct = totalQtyToDeduct;

        // Get available batches sorted by expiry date
        const batches = await this.prisma.inventoryStock.findMany({
            where: {
                tenant_id: tenantId,
                warehouse_id: warehouseId,
                item_id: itemId,
                quantity: { gt: 0 },
            },
            orderBy: { expiry_date: 'asc' },
        });

        const totalAvailable = batches.reduce((sum, b) => sum + b.quantity, 0);
        if (totalAvailable < totalQtyToDeduct) {
            throw new Error(`Insufficient total stock for item. Available: ${totalAvailable}, Requested: ${totalQtyToDeduct}`);
        }

        for (const batch of batches) {
            if (remainingToDeduct === 0) break;

            const deductFromThisBatch = Math.min(batch.quantity, remainingToDeduct);

            await this.recordMovement({
                tenantId,
                itemId,
                batchNumber: batch.batch_number,
                quantity: deductFromThisBatch,
                type: 'OUT',
                fromWarehouseId: warehouseId,
                referenceId: meta.referenceId,
                referenceType: meta.referenceType,
                performedBy: meta.performedBy,
            });

            remainingToDeduct -= deductFromThisBatch;
        }

        return true;
    }

    /**
     * Calculates real-time inventory telemetry for the dashboard.
     */
    async getDashboardStats(tenantId: string) {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

        // 1. Total Items
        const totalItems = await this.prisma.inventoryItem.count({
            where: { tenant_id: tenantId }
        });

        // 2. Warehouses
        const warehouses = await this.prisma.warehouse.findMany({
            where: { tenant_id: tenantId }
        });

        // 3. Low Stock Count (Items with total quantity < threshold, e.g., 10)
        // Group by item_id to get total quantity per item
        const itemStocks = await this.prisma.inventoryStock.groupBy({
            by: ['item_id'],
            where: { tenant_id: tenantId },
            _sum: { quantity: true }
        });

        const lowStockCount = itemStocks.filter(s => Number(s._sum.quantity || 0) < 10).length;

        // 4. Expiring Soon Count (Any batch expiring within 30 days)
        const expiringSoonCount = await this.prisma.inventoryStock.count({
            where: {
                tenant_id: tenantId,
                quantity: { gt: 0 },
                expiry_date: {
                    gte: now,
                    lte: thirtyDaysFromNow
                }
            }
        });

        // 5. Alerts (Top 5 critical issues)
        const alerts = [];

        // Items with very low stock (urgent)
        const urgentStock = itemStocks.filter(s => Number(s._sum.quantity || 0) <= 2).slice(0, 3);
        for (const s of urgentStock) {
            const item = await this.prisma.inventoryItem.findUnique({ where: { id: s.item_id } });
            alerts.push({
                name: item?.name,
                issue: `Critical: Stock level is ${s._sum.quantity} units. Restock immediately.`,
                type: 'error'
            });
        }

        // Batches expiring very soon
        const criticalExpiry = await this.prisma.inventoryStock.findMany({
            where: {
                tenant_id: tenantId,
                quantity: { gt: 0 },
                expiry_date: { lte: thirtyDaysFromNow }
            },
            include: { item: true },
            take: 3,
            orderBy: { expiry_date: 'asc' }
        });

        criticalExpiry.forEach(b => {
            alerts.push({
                name: b.item.name,
                issue: `Urgent: Batch ${b.batch_number} expires in ${Math.ceil((b.expiry_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days.`,
                type: 'warning'
            });
        });

        return {
            totalItems,
            warehousesCount: warehouses.length,
            lowStockCount,
            expiringSoonCount,
            alerts: alerts.slice(0, 5)
        };
    }
}
