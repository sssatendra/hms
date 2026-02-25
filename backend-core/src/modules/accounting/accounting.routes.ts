import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../services/prisma';
import { sendSuccess, sendError, sendCreated, ErrorCodes } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { AccountingService } from './accounting.service';
import { logger } from '../../utils/logger';

const router = Router();
router.use(authenticate);

const accountSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    type: z.enum(['ASSET', 'LIABILITY', 'INCOME', 'EXPENSE', 'EQUITY']),
    parent_id: z.string().uuid().optional(),
    description: z.string().optional(),
});

const manualEntrySchema = z.object({
    date: z.string().transform(d => new Date(d)).optional(),
    notes: z.string().optional(),
    entries: z.array(z.object({
        accountId: z.string().uuid(),
        debit: z.number().min(0),
        credit: z.number().min(0),
    })).min(2)
});

// ─── Chart of Accounts ────────────────────────────────────────────────────────

router.get('/accounts', authorize('accounting:read'), async (req: any, res) => {
    const accounts = await prisma.account.findMany({
        where: { tenant_id: req.tenantId! },
        include: {
            children: true,
            ledger_details: true
        },
        orderBy: { code: 'asc' }
    });

    // Calculate balance for each account
    const accountsWithBalance = accounts.map(acc => {
        const debit = acc.ledger_details.reduce((sum, ld) => sum + Number(ld.debit), 0);
        const credit = acc.ledger_details.reduce((sum, ld) => sum + Number(ld.credit), 0);
        return {
            ...acc,
            balance: debit - credit,
            ledger_details: undefined // Strip details to keep payload lean
        };
    });

    sendSuccess(res, accountsWithBalance);
});

router.post('/accounts', authorize('accounting:manage'), async (req: any, res) => {
    try {
        const data = accountSchema.parse(req.body);
        const account = await prisma.account.create({
            data: { tenant_id: req.tenantId!, ...data }
        });
        sendCreated(res, account);
    } catch (e) {
        sendError(res, ErrorCodes.VALIDATION_ERROR, 'Invalid data', 400);
    }
});

router.get('/accounts/:id/balance', authorize('accounting:read'), async (req, res) => {
    const service = new AccountingService();
    const balance = await service.getAccountBalance(req.params.id);
    sendSuccess(res, { balance });
});

router.post('/seed', authorize('accounting:manage'), async (req: any, res) => {
    try {
        const { country } = req.body;
        const service = new AccountingService();
        const accounts = await service.seedChartOfAccounts(req.tenantId!, country);
        sendSuccess(res, accounts);
    } catch (e: any) {
        logger.error('COA Seeding error', { error: e.message });
        sendError(res, ErrorCodes.SERVER_ERROR, 'Failed to initialize accounts', 500);
    }
});

router.get('/stats', authorize('accounting:read'), async (req: any, res) => {
    try {
        const service = new AccountingService();
        const stats = await service.getDashboardStats(req.tenantId!);
        sendSuccess(res, stats);
    } catch (e: any) {
        logger.error('Accounting stats error', { error: e.message });
        sendError(res, ErrorCodes.SERVER_ERROR, 'Failed to fetch accounting stats', 500);
    }
});

// ─── Journal Entries ─────────────────────────────────────────────────────────

router.get('/entries', authorize('accounting:read'), async (req: any, res) => {
    const entries = await prisma.journalEntry.findMany({
        where: { tenant_id: req.tenantId! },
        include: { ledger_details: { include: { account: true } } },
        orderBy: { date: 'desc' },
        take: 50
    });
    sendSuccess(res, entries);
});

router.post('/entries', authorize('accounting:manage'), async (req: any, res) => {
    try {
        const data = manualEntrySchema.parse(req.body);
        const result = await prisma.$transaction(async (tx) => {
            const service = new AccountingService(tx);
            return await service.createJournalEntry({
                tenantId: req.tenantId!,
                date: data.date,
                notes: data.notes,
                entries: data.entries,
                referenceType: 'MANUAL',
                performedBy: req.user!.userId
            });
        });
        sendCreated(res, result);
    } catch (e: any) {
        logger.error('Accounting manual entry error', { error: e.message || 'Unknown error' });
        sendError(res, ErrorCodes.BAD_REQUEST, e.message || 'Manual entry failed', 400);
    }
});

// GET Entries for a specific reference (e.g., an invoice)
router.get('/entries/reference/:type/:id', authorize('accounting:read'), async (req: any, res) => {
    const entries = await prisma.journalEntry.findMany({
        where: {
            tenant_id: req.tenantId!,
            reference_type: req.params.type,
            reference_id: req.params.id
        },
        include: { ledger_details: { include: { account: true } } }
    });
    sendSuccess(res, entries);
});

export default router;
