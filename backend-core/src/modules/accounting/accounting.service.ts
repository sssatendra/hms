import { Prisma, PrismaClient, AccountType } from '@prisma/client';
import { prisma as defaultPrisma } from '../../services/prisma';
import { logger } from '../../utils/logger';

export interface LedgerEntryRequest {
    accountId: string;
    debit: number;
    credit: number;
}

export class AccountingService {
    private prisma: PrismaClient | Prisma.TransactionClient;

    constructor(tx?: Prisma.TransactionClient) {
        this.prisma = tx || defaultPrisma;
    }

    /**
     * Creates a balanced journal entry with multiple ledger details.
     * MUST be run inside a transaction to ensure atomic double-entry.
     */
    async createJournalEntry(data: {
        tenantId: string;
        date?: Date;
        referenceType?: string;
        referenceId?: string;
        notes?: string;
        entries: LedgerEntryRequest[];
        performedBy: string;
    }) {
        const { tenantId, date, referenceType, referenceId, notes, entries, performedBy } = data;

        // 1. Validation: Ensure entries sum to zero (Total Debit = Total Credit)
        const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
        const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

        // Allow for minor floating point rounding differences if using Number, 
        // but since we use Decimal in DB, we should be exact.
        if (Math.abs(totalDebit - totalCredit) > 0.001) {
            throw new Error(`Unbalanced Journal Entry: Debits (${totalDebit}) do not match Credits (${totalCredit})`);
        }

        if (entries.length < 2) {
            throw new Error('A journal entry must have at least two lines (double-entry).');
        }

        // 2. Create the Journal Header
        const journal = await this.prisma.journalEntry.create({
            data: {
                tenant_id: tenantId,
                date: date || new Date(),
                reference_type: referenceType,
                reference_id: referenceId,
                notes,
                created_by: performedBy,
                ledger_details: {
                    create: entries.map(e => ({
                        account_id: e.accountId,
                        debit: new Prisma.Decimal(e.debit),
                        credit: new Prisma.Decimal(e.credit),
                    })),
                },
            },
            include: {
                ledger_details: true,
            },
        });

        return journal;
    }

    /**
     * Helper to find or create a default system account (e.g., "Cash", "Sales").
     * In a real system, these would be seeded or managed via UI.
     */
    async findOrCreateAccount(tenantId: string, code: string, name: string, type: AccountType) {
        let account = await this.prisma.account.findUnique({
            where: {
                tenant_id_code: {
                    tenant_id: tenantId,
                    code: code,
                },
            },
        });

        if (!account) {
            account = await this.prisma.account.create({
                data: {
                    tenant_id: tenantId,
                    name,
                    code,
                    type,
                },
            });
        }

        return account;
    }

    /**
     * Calculates the balance for a specific account.
     */
    async getAccountBalance(accountId: string) {
        const result = await this.prisma.ledgerDetail.aggregate({
            where: { account_id: accountId },
            _sum: {
                debit: true,
                credit: true,
            },
        });

        const debit = Number(result._sum.debit || 0);
        const credit = Number(result._sum.credit || 0);

        return debit - credit;
    }

    /**
     * Seeds a standard Chart of Accounts for clinical/hospital institutions.
     */
    async seedChartOfAccounts(tenantId: string, country?: string) {
        const standardAccounts = [
            // ASSETS
            { code: '1000', name: 'Cash in Hand', type: AccountType.ASSET },
            { code: '1010', name: 'Bank Operating Account', type: AccountType.ASSET },
            { code: '1100', name: 'Patient Receivables', type: AccountType.ASSET },
            { code: '1200', name: 'Pharmacy Inventory', type: AccountType.ASSET },
            { code: '1210', name: 'Clinical Supplies Inventory', type: AccountType.ASSET },

            // LIABILITIES
            { code: '2000', name: 'Trade Payables (Suppliers)', type: AccountType.LIABILITY },
            { code: '2100', name: 'Salaries & Wages Payable', type: AccountType.LIABILITY },
            { code: '2200', name: 'Sales Tax Payable', type: AccountType.LIABILITY },

            // EQUITY
            { code: '3000', name: 'Capital Account', type: AccountType.EQUITY },
            { code: '3100', name: 'Retained Earnings', type: AccountType.EQUITY },

            // INCOME
            { code: '4000', name: 'OPD Consultation Revenue', type: AccountType.INCOME },
            { code: '4010', name: 'Pharmacy Sales Revenue', type: AccountType.INCOME },
            { code: '4020', name: 'Diagnostic & Lab Revenue', type: AccountType.INCOME },
            { code: '4030', name: 'IPD / Admission Charges', type: AccountType.INCOME },

            // EXPENSES
            { code: '5000', name: 'Medical Staff Compensation', type: AccountType.EXPENSE },
            { code: '5100', name: 'Utility & Facility Maintenance', type: AccountType.EXPENSE },
            { code: '5200', name: 'Cost of Medical Supplies', type: AccountType.EXPENSE },
            { code: '5300', name: 'Rent & Lease Obligations', type: AccountType.EXPENSE },
        ];

        if (country === 'IN') {
            standardAccounts.push(
                { code: '1150', name: 'TDS Receivable', type: AccountType.ASSET },
                { code: '2210', name: 'CGST Payable', type: AccountType.LIABILITY },
                { code: '2220', name: 'SGST Payable', type: AccountType.LIABILITY },
                { code: '2230', name: 'IGST Payable', type: AccountType.LIABILITY }
            );
            // Remove generic tax
            const taxIdx = standardAccounts.findIndex(a => a.code === '2200');
            if (taxIdx > -1) standardAccounts.splice(taxIdx, 1);
        } else if (country === 'US') {
            standardAccounts.push(
                { code: '2210', name: 'State Sales Tax Payable', type: AccountType.LIABILITY },
                { code: '2220', name: 'Federal Income Tax Payable', type: AccountType.LIABILITY }
            );
            const taxIdx = standardAccounts.findIndex(a => a.code === '2200');
            if (taxIdx > -1) standardAccounts.splice(taxIdx, 1);
        }

        const results = [];
        for (const acc of standardAccounts) {
            const created = await this.findOrCreateAccount(tenantId, acc.code, acc.name, acc.type);
            results.push(created);
        }

        return results;
    }

    /**
     * Calculates real-time financial stats for the dashboard.
     */
    async getDashboardStats(tenantId: string) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get all accounts for this tenant
        const accounts = await this.prisma.account.findMany({
            where: { tenant_id: tenantId },
            include: { ledger_details: { where: { journal_entry: { date: { gte: startOfMonth } } } } }
        });

        // Calculate balances
        // Total Assets: All Asset account balances
        // Revenue (MTD): Sum of all credit entries in Income accounts this month
        // Expenses (MTD): Sum of all debit entries in Expense accounts this month
        // Receivables: Specifically Account code '1100' or accounts of type ASSET with name containing 'Receivable'

        let totalAssets = 0;
        let revenueMTD = 0;
        let expensesMTD = 0;
        let receivables = 0;

        // For total assets we need lifetime balance
        const allLedgerDetails = await this.prisma.ledgerDetail.findMany({
            where: { account: { tenant_id: tenantId } },
            include: { account: true }
        });

        allLedgerDetails.forEach(ld => {
            const debit = Number(ld.debit);
            const credit = Number(ld.credit);
            const balance = debit - credit;

            if (ld.account.type === AccountType.ASSET) {
                totalAssets += balance;
                if (ld.account.code === '1100' || ld.account.name.toLowerCase().includes('receivable')) {
                    receivables += balance;
                }
            } else if (ld.account.type === AccountType.LIABILITY || ld.account.type === AccountType.EQUITY) {
                // Liabilities/Equity increase with Credit. But Assets = Liabilities + Equity.
                // We typically just show total liquid assets or total valuation.
            }
        });

        // Revenue/Expenses for MTD
        const mtdLedgerDetails = await this.prisma.ledgerDetail.findMany({
            where: {
                account: { tenant_id: tenantId },
                journal_entry: { date: { gte: startOfMonth } }
            },
            include: { account: true }
        });

        mtdLedgerDetails.forEach(ld => {
            const debit = Number(ld.debit);
            const credit = Number(ld.credit);

            if (ld.account.type === AccountType.INCOME) {
                // Income increases with Credit
                revenueMTD += (credit - debit);
            } else if (ld.account.type === AccountType.EXPENSE) {
                // Expenses increase with Debit
                expensesMTD += (debit - credit);
            }
        });

        return {
            totalAssets,
            revenueMTD,
            expensesMTD,
            receivables,
            currency: 'INR'
        };
    }

    /**
     * Generates a Profit & Loss report for a specified date range.
     */
    async getProfitAndLossReport(tenantId: string, startDate: Date, endDate: Date) {
        const ledgerDetails = await this.prisma.ledgerDetail.findMany({
            where: {
                account: { 
                    tenant_id: tenantId,
                    type: { in: [AccountType.INCOME, AccountType.EXPENSE] }
                },
                journal_entry: {
                    date: { gte: startDate, lte: endDate }
                }
            },
            include: { account: true }
        });

        const report: any = {
            income: {},
            expense: {},
            totalIncome: 0,
            totalExpense: 0,
            netProfit: 0,
            period: { start: startDate, end: endDate }
        };

        ledgerDetails.forEach(ld => {
            const amount = Number(ld.debit) - Number(ld.credit);
            const target = ld.account.type === AccountType.INCOME ? report.income : report.expense;
            
            if (!target[ld.account.name]) target[ld.account.name] = 0;
            
            // Income increases with Credit, Expenses with Debit
            if (ld.account.type === AccountType.INCOME) {
                const balance = Number(ld.credit) - Number(ld.debit);
                target[ld.account.name] += balance;
                report.totalIncome += balance;
            } else {
                const balance = Number(ld.debit) - Number(ld.credit);
                target[ld.account.name] += balance;
                report.totalExpense += balance;
            }
        });

        report.netProfit = report.totalIncome - report.totalExpense;
        return report;
    }

    /**
     * Generates a Tax Matrix report aggregating balances of tax-related accounts.
     */
    async getTaxMatrixReport(tenantId: string) {
        // Find accounts with "Tax", "GST", "VAT", or "TDS" in them
        const taxAccounts = await this.prisma.account.findMany({
            where: {
                tenant_id: tenantId,
                OR: [
                    { name: { contains: 'Tax', mode: 'insensitive' } },
                    { name: { contains: 'GST', mode: 'insensitive' } },
                    { name: { contains: 'VAT', mode: 'insensitive' } },
                    { name: { contains: 'TDS', mode: 'insensitive' } },
                    { code: { startsWith: '22' } } // Common tax code prefix in our seed
                ]
            },
            include: {
                ledger_details: true
            }
        });

        return taxAccounts.map(acc => {
            const debit = acc.ledger_details.reduce((sum, ld) => sum + Number(ld.debit), 0);
            const credit = acc.ledger_details.reduce((sum, ld) => sum + Number(ld.credit), 0);
            return {
                id: acc.id,
                code: acc.code,
                name: acc.name,
                type: acc.type,
                totalDebit: debit,
                totalCredit: credit,
                netBalance: acc.type === AccountType.ASSET ? (debit - credit) : (credit - debit)
            };
        });
    }
}
