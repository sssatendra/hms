import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../services/prisma';
import { sendSuccess, sendError, ErrorCodes } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';

const router = Router();
router.use(authenticate);

const updateSettingsSchema = z.object({
    currency: z.string().optional(),
    country: z.string().optional(),
    name: z.string().optional(),
    settings: z.object({
        currency: z.string().optional(),
        country: z.string().optional(),
    }).optional(),
});

// PATCH /api/v1/tenants/settings
router.patch('/settings', authorize('admin:reports'), async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = req.tenantId!;
        const data = updateSettingsSchema.parse(req.body);

        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) {
            sendError(res, ErrorCodes.NOT_FOUND, 'Tenant not found', 404);
            return;
        }

        const currentSettings = (tenant.settings as Record<string, any>) || {};
        
        const { name, settings: nestedSettings, ...flatSettings } = data;
        const newSettings = { 
            ...currentSettings, 
            ...flatSettings, 
            ...(nestedSettings || {}) 
        };

        const updateData: any = { settings: newSettings };
        if (name) updateData.name = name;

        const updatedTenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: updateData,
        });

        sendSuccess(res, {
            id: updatedTenant.id,
            name: updatedTenant.name,
            slug: updatedTenant.slug,
            logo_url: updatedTenant.logo_url,
            settings: updatedTenant.settings,
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
            return;
        }
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to update tenant settings', 500);
    }
});

export default router;
