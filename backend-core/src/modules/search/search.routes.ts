import { Router, Request, Response } from 'express';
import { prisma } from '../../services/prisma';
import { sendSuccess, sendError, ErrorCodes } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { logger } from '../../utils/logger';

const router = Router();
router.use(authenticate);

/**
 * GET /api/v1/search
 * Global search across Patients, Wards (Beds/Admissions), and Inventory
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenantId!;
        const query = req.query.q as string;

        if (!query || query.length < 2) {
            return sendSuccess(res, { results: [] });
        }

        const [patients, inventory, wards] = await Promise.all([
            // 1. Search Patients
            prisma.patient.findMany({
                where: {
                    tenant_id: tenantId,
                    is_active: true,
                    OR: [
                        { first_name: { contains: query, mode: 'insensitive' } },
                        { last_name: { contains: query, mode: 'insensitive' } },
                        { mrn: { contains: query, mode: 'insensitive' } },
                        { phone: { contains: query } }
                    ]
                },
                take: 5,
                select: { id: true, first_name: true, last_name: true, mrn: true, type: true } as any
            }),
            // 2. Search Inventory/Pharmacy
            prisma.inventoryItem.findMany({
                where: {
                    tenant_id: tenantId,
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { sku: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 5,
                select: { id: true, name: true, sku: true, category: true }
            }),
            // 3. Search Wards
            prisma.ward.findMany({
                where: {
                    tenant_id: tenantId,
                    is_active: true,
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { code: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 5
            })
        ]);

        const formattedResults = [
            ...patients.map(p => ({ id: p.id, title: `${p.first_name} ${p.last_name}`, subtitle: p.mrn, type: 'PATIENT', url: `/patients/${p.id}` })),
            ...inventory.map(i => ({ id: i.id, title: i.name, subtitle: i.sku, type: i.category === 'PHARMACY' ? 'PHARMACY' : 'INVENTORY', url: i.category === 'PHARMACY' ? '/pharmacy' : '/inventory' })),
            ...wards.map(w => ({ id: w.id, title: w.name, subtitle: w.code, type: 'WARD', url: '/wards' }))
        ];

        sendSuccess(res, formattedResults);
    } catch (error) {
        logger.error('Global search error', { error });
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to perform search', 500);
    }
});

export default router;
