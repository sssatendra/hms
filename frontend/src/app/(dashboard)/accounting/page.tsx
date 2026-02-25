'use client';

import React, { useState } from 'react';
import {
    BarChart3,
    BookOpen,
    CreditCard,
    DollarSign,
    FileText,
    History,
    PieChart,
    Plus,
    Search,
    Settings,
    TrendingUp,
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    ChevronRight,
    BadgeCent,
    Activity,
    Landmark,
    Receipt
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { coreApi as api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/use-currency';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

export default function AccountingDashboard() {
    const queryClient = useQueryClient();
    const { format, country } = useCurrency();
    const [activeView, setActiveView] = useState('summary');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showJournalModal, setShowJournalModal] = useState(false);
    const [showSeedConfirm, setShowSeedConfirm] = useState(false);

    // Fetch Accounts & Entries
    const { data: accountsRaw } = useQuery({
        queryKey: ['accounting', 'accounts'],
        queryFn: async () => {
            const res = await api.get('/accounting/accounts');
            // Backend returns { success: true, data: [...] }
            return res.data || [];
        }
    });
    // Defensive normalization: ensure we always have an array
    const accounts = Array.isArray(accountsRaw) ? accountsRaw : (accountsRaw as any)?.data || [];

    const { data: fiscalStatsRaw } = useQuery({
        queryKey: ['accounting', 'stats'],
        queryFn: async () => {
            const res = await api.get('/accounting/stats');
            return res.data;
        }
    });
    const fiscalStats = (fiscalStatsRaw as any);

    const { data: entriesRaw } = useQuery({
        queryKey: ['accounting', 'entries'],
        queryFn: async () => {
            const res = await api.get('/accounting/entries');
            return res.data || [];
        }
    });
    const entries = Array.isArray(entriesRaw) ? entriesRaw : (entriesRaw as any)?.data || [];

    const filteredEntries = entries.filter((entry: any) =>
        entry.reference_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const createAccountMutation = useMutation({
        mutationFn: (data) => api.post('/accounting/accounts', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounting', 'accounts'] });
            setShowAccountModal(false);
        }
    });

    const createEntryMutation = useMutation({
        mutationFn: (data) => api.post('/accounting/entries', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounting', 'entries'] });
            setShowJournalModal(false);
        },
        onError: (err: any) => alert(err.response?.data?.message || 'Manual entry failed')
    });

    const seedAccountsMutation = useMutation({
        mutationFn: () => api.post('/accounting/seed', { country }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounting', 'accounts'] });
            setShowSeedConfirm(false);
        },
        onError: (err: any) => alert(err.response?.data?.message || 'Seeding failed')
    });

    const stats = [
        {
            label: 'Asset Valuation',
            value: fiscalStats ? format(fiscalStats.totalAssets) : format(0),
            change: '+0.0%',
            icon: Landmark,
            color: 'text-primary',
            bg: 'bg-primary/5'
        },
        {
            label: 'Revenue (MTD)',
            value: fiscalStats ? format(fiscalStats.revenueMTD) : format(0),
            change: '+0.0%',
            icon: TrendingUp,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/5'
        },
        {
            label: 'Operational Expense',
            value: fiscalStats ? format(fiscalStats.expensesMTD) : format(0),
            change: '+0.0%',
            icon: Wallet,
            color: 'text-rose-500',
            bg: 'bg-rose-500/5'
        },
        {
            label: 'Patient Receivables',
            value: fiscalStats ? format(fiscalStats.receivables) : format(0),
            change: '+0.0%',
            icon: Receipt,
            color: 'text-accent',
            bg: 'bg-accent/5'
        },
    ];

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen bg-background/50 animate-in fade-in duration-700">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[10%] right-[10%] w-[35%] h-[35%] bg-accent/5 rounded-full blur-[120px]"></div>
                <div className="absolute -bottom-[5%] left-[5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]"></div>
            </div>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter flex items-center gap-3">
                        <Wallet className="h-10 w-10 text-primary" />
                        Treasury & Ledger
                        <span className="ml-2 px-3 py-1 bg-accent/10 border border-accent/20 text-accent rounded-full text-[10px] uppercase font-black tracking-widest shadow-sm">Enterprise</span>
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">Double-Entry Fiscal Controls & Real-Time Statutory Reporting</p>
                </div>
                <div className="flex items-center gap-4">
                    {accounts.length === 0 ? (
                        <button
                            onClick={() => setShowSeedConfirm(true)}
                            disabled={seedAccountsMutation.isPending}
                            className="flex items-center gap-2 px-6 py-2.5 bg-accent text-accent-foreground rounded-2xl hover:opacity-90 transition-all font-black shadow-xl shadow-accent/20 text-xs uppercase tracking-widest active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                            {seedAccountsMutation.isPending ? 'Initializing...' : 'Initialize Standards'}
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowAccountModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-card/80 backdrop-blur-md border border-border rounded-2xl hover:bg-card transition-all font-bold text-sm shadow-sm active:scale-95 cursor-pointer"
                        >
                            <Settings size={18} className="text-muted-foreground" />
                            COA Configuration
                        </button>
                    )}
                    <button
                        onClick={() => setShowJournalModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-2xl hover:opacity-90 transition-all font-bold shadow-xl shadow-primary/20 text-sm active:scale-95 cursor-pointer"
                    >
                        <Plus size={18} />
                        Manual Entry
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="group relative bg-card/60 backdrop-blur-xl p-6 rounded-3xl border border-border shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn("p-4 rounded-2xl transition-all group-hover:scale-110", stat.bg)}>
                                <stat.icon className={stat.color} size={28} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-black px-2.5 py-1 rounded-full",
                                stat.change.startsWith('+') ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                            )}>
                                {stat.change}
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
                            <h3 className="text-3xl font-black text-foreground mt-2 font-mono tabular-nums tracking-tighter">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left Column: Recent Ledger Entries */}
                <div className="xl:col-span-8 space-y-6">
                    <div className="bg-card/40 backdrop-blur-md rounded-[32px] border border-border shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                        <div className="p-6 border-b border-border/60 bg-muted/20 flex items-center justify-between">
                            <h3 className="font-black text-foreground flex items-center gap-2 uppercase tracking-tighter text-lg">
                                <History size={22} className="text-primary" /> Immutable Audit Trail
                            </h3>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Trace Reference ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-6 py-2 bg-card/60 border border-border rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all w-48 font-medium"
                                />
                            </div>
                        </div>
                        <div className="divide-y divide-border/40 font-medium">
                            {filteredEntries?.length === 0 ? (
                                <div className="p-20 text-center text-muted-foreground font-bold tracking-widest uppercase opacity-30 italic underline decoration-wavy decoration-primary">Waiting for initial ledger reconciliation...</div>
                            ) : filteredEntries?.map((entry: any) => (
                                <div key={entry.id} className="p-6 hover:bg-primary/[0.02] transition-colors cursor-pointer group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[9px] font-black text-primary uppercase bg-primary/10 px-3 py-1 rounded-lg border border-primary/20 tracking-widest">
                                                {entry.reference_type}
                                            </span>
                                            <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors font-mono tracking-tighter">REF: {entry.reference_id?.slice(-12).toUpperCase()}</span>
                                        </div>
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-4 rounded-2xl border border-border/40">
                                        {entry.ledger_details.map((detail: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center group/item hover:translate-x-1 transition-transform">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("h-1.5 w-1.5 rounded-full", Number(detail.debit) > 0 ? "bg-emerald-500" : "bg-primary/40")}></div>
                                                    <span className="text-xs font-bold text-muted-foreground group-hover/item:text-foreground transition-colors">
                                                        {detail.account.name}
                                                    </span>
                                                </div>
                                                <span className={cn(
                                                    "text-sm font-mono font-black tabular-nums tracking-tighter",
                                                    Number(detail.debit) > 0 ? "text-emerald-600" : "text-foreground"
                                                )}>
                                                    {Number(detail.debit) > 0 ? `+ ${format(detail.debit)}` : `- ${format(detail.credit)}`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-muted/30 border-t border-border/60 text-center">
                            <button className="text-xs font-black text-primary hover:text-accent transition-all uppercase tracking-widest flex items-center gap-2 mx-auto cursor-pointer active:scale-95">
                                Export Full Fiscal Repository <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Chart of Accounts Snippet */}
                <div className="xl:col-span-4 space-y-8 animate-in slide-in-from-right-4 duration-700">
                    <div className="bg-card/40 backdrop-blur-md p-8 rounded-[32px] border border-border shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-1.5 bg-primary/10 text-primary rounded-bl-2xl">
                            <BookOpen size={16} />
                        </div>
                        <h3 className="font-black text-foreground mb-6 uppercase tracking-tighter text-lg flex items-center gap-3">
                            <Activity size={22} className="text-accent" /> Liquidity Pool
                        </h3>
                        <div className="space-y-3">
                            {accounts.length === 0 ? (
                                <div className="p-8 text-center bg-muted/10 rounded-3xl border border-dashed border-border flex flex-col items-center gap-4">
                                    <div className="p-4 bg-accent/10 rounded-full">
                                        <Landmark size={32} className="text-accent" />
                                    </div>
                                    <div>
                                        <p className="font-black text-foreground uppercase tracking-tighter">No Accounts Found</p>
                                        <p className="text-[10px] text-muted-foreground font-medium mt-1">Initialize standard hospital ledger structure.</p>
                                    </div>
                                    <button
                                        onClick={() => seedAccountsMutation.mutate()}
                                        disabled={seedAccountsMutation.isPending}
                                        className="w-full py-3 bg-accent text-accent-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {seedAccountsMutation.isPending ? 'Deploying...' : 'Quick Initialize'}
                                    </button>
                                </div>
                            ) : accounts.map((acc: any, i: number) => (
                                <div key={i} className="group flex items-center justify-between p-4 bg-muted/20 hover:bg-primary/5 border border-border/40 rounded-2xl transition-all cursor-pointer">
                                    <div className="flex-1">
                                        <div className="text-xs font-black text-foreground group-hover:text-primary transition-colors tracking-tight">{acc.code} - {acc.name}</div>
                                        <div className="text-[9px] font-black text-muted-foreground uppercase mt-1 tracking-widest">{acc.type} • <span className="text-emerald-500">LIQUID</span></div>
                                    </div>
                                    <div className="text-sm font-mono font-black text-foreground tabular-nums tracking-tighter underline decoration-accent/30 decoration-2 underline-offset-4 font-mono">
                                        {format(acc.balance || 0)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="mt-8 w-full py-4 border-2 border-primary/10 rounded-2xl text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-95 shadow-sm">
                            System Chart of Accounts <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="group bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden transition-all duration-500 hover:shadow-slate-900/40">
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-accent/10 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-700"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-8">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <PieChart size={28} className="text-accent" />
                                </div>
                                <span className="text-[10px] font-black bg-accent/20 text-accent px-4 py-1.5 rounded-full tracking-[0.2em] uppercase border border-accent/30">Strategic AI Analysis</span>
                            </div>

                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Projected Fiscal Margin</p>
                            <h4 className="text-5xl font-black mb-6 font-mono tracking-tighter tabular-nums text-white group-hover:text-accent transition-colors">64.2%</h4>

                            <div className="flex items-center gap-3 text-emerald-400 text-sm font-black animate-pulse">
                                <TrendingUp size={18} /> +4.2% Growth Index vs Q3
                            </div>

                            <div className="mt-10 pt-10 border-t border-white/5 space-y-4">
                                <button className="w-full py-4 bg-accent text-accent-foreground hover:bg-white hover:text-slate-900 rounded-[20px] text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-accent/20 transition-all active:scale-95 cursor-pointer">
                                    Generate Executive P&L
                                </button>
                                <button className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer border border-white/5">
                                    Tax Compliance Export
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showAccountModal && (
                <AccountModal
                    accounts={accounts}
                    onClose={() => setShowAccountModal(false)}
                    onSubmit={(data) => createAccountMutation.mutate(data)}
                    isLoading={createAccountMutation.isPending}
                />
            )}

            {showJournalModal && (
                <JournalEntryModal
                    accounts={accounts}
                    onClose={() => setShowJournalModal(false)}
                    onSubmit={(data) => createEntryMutation.mutate(data)}
                    isLoading={createEntryMutation.isPending}
                />
            )}

            <ConfirmDialog
                isOpen={showSeedConfirm}
                onClose={() => setShowSeedConfirm(false)}
                onConfirm={() => seedAccountsMutation.mutate()}
                title="Initialize Standard Accounts"
                description={`This action cannot be undone. This will inject standard regional accounts for ${country} into your ledger. Are you absolutely sure you want to proceed?`}
                confirmText="Yes, Initialize Ledger"
                cancelText="Cancel"
                isDestructive={false}
            />
        </div>
    );
}

function AccountModal({ accounts, onClose, onSubmit, isLoading }: any) {
    const { register, handleSubmit } = useForm();
    return (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-border animate-in zoom-in-95 duration-300 relative">
                <div className="p-8 border-b border-border bg-muted/20 flex justify-between items-center text-foreground uppercase">
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter">COA Configuration</h2>
                        <p className="text-[10px] text-muted-foreground font-black tracking-widest mt-1">Initialize System Ledger Account</p>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-2xl hover:bg-muted transition-all text-2xl border border-border shadow-sm">×</button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6 lowercase">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Account Name</label>
                            <input {...register('name', { required: true })} className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 transition-all font-bold outline-none" placeholder="e.g. Petty Cash" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Account Code</label>
                            <input {...register('code', { required: true })} className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 transition-all font-bold outline-none font-mono uppercase" placeholder="1001" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nature</label>
                            <select {...register('type')} className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 transition-all font-bold outline-none uppercase text-xs">
                                <option value="ASSET">Asset (1xxx)</option>
                                <option value="LIABILITY">Liability (2xxx)</option>
                                <option value="EQUITY">Equity (3xxx)</option>
                                <option value="INCOME">Income (4xxx)</option>
                                <option value="EXPENSE">Expense (5xxx)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Parent Category</label>
                            <select {...register('parent_id')} className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 transition-all font-bold outline-none uppercase text-xs">
                                <option value="">Root Account</option>
                                {Array.isArray(accounts) && accounts.filter((a: any) => !a.parent_id).map((a: any) => (
                                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button disabled={isLoading} className="w-full py-5 bg-primary text-primary-foreground rounded-[24px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50">
                        {isLoading ? 'Processing...' : 'Provision Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function JournalEntryModal({ accounts, onClose, onSubmit, isLoading }: any) {
    const { register, control, handleSubmit, watch } = useForm({
        defaultValues: {
            entries: [{ accountId: '', debit: 0, credit: 0 }, { accountId: '', debit: 0, credit: 0 }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "entries"
    });

    const watchedEntries = watch("entries");
    const totalDebit = watchedEntries.reduce((sum, e) => sum + Number(e.debit || 0), 0);
    const totalCredit = watchedEntries.reduce((sum, e) => sum + Number(e.credit || 0), 0);
    const difference = Math.abs(totalDebit - totalCredit);

    return (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden border border-border animate-in zoom-in-95 duration-300 relative">
                <div className="p-8 border-b border-border bg-muted/20 flex justify-between items-center text-foreground uppercase">
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter">Manual Ledger Entry</h2>
                        <p className="text-[10px] text-accent font-black tracking-widest mt-1 italic">Double-Entry Verification System</p>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-2xl hover:bg-muted transition-all text-2xl border border-border shadow-sm">×</button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
                    <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-4 items-end bg-muted/10 p-4 rounded-[20px] border border-border/40">
                                <div className="col-span-6 space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Account</label>
                                    <select {...register(`entries.${index}.accountId` as const)} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-4 focus:ring-primary/10 transition-all font-bold outline-none text-xs uppercase">
                                        <option value="">Select Account</option>
                                        {Array.isArray(accounts) && accounts.map((a: any) => (
                                            <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 ml-1">Debit Amount</label>
                                    <input type="number" step="0.01" {...register(`entries.${index}.debit` as const)} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-4 focus:ring-primary/10 transition-all font-mono font-black text-xs" />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-rose-600 ml-1">Credit Amount</label>
                                    <input type="number" step="0.01" {...register(`entries.${index}.credit` as const)} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-4 focus:ring-primary/10 transition-all font-mono font-black text-xs" />
                                </div>
                                <div className="col-span-2 pb-2">
                                    <button type="button" onClick={() => remove(index)} className="w-full py-3 hover:bg-rose-500/10 text-rose-500 rounded-xl transition-all font-bold">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button type="button" onClick={() => append({ accountId: '', debit: 0, credit: 0 })} className="text-xs font-black text-primary uppercase tracking-widest border border-primary/20 px-4 py-2 rounded-xl hover:bg-primary/5">
                        Add Entry Line +
                    </button>

                    <div className="flex justify-between items-center p-6 bg-muted/30 rounded-[24px] border border-border/60">
                        <div className="flex gap-8">
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Debit</p>
                                <p className="text-xl font-black font-mono">{totalDebit.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Credit</p>
                                <p className="text-xl font-black font-mono">{totalCredit.toLocaleString()}</p>
                            </div>
                        </div>
                        {difference !== 0 ? (
                            <div className="text-rose-500 text-xs font-black uppercase tracking-widest animate-pulse">
                                Unbalanced: Δ {difference.toLocaleString()}
                            </div>
                        ) : (
                            <div className="text-emerald-500 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" /> Balanced
                            </div>
                        )}
                    </div>

                    <button
                        disabled={isLoading || difference !== 0}
                        className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-[0.2em] shadow-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? 'Reconciling...' : 'Commit Immutable Ledger'}
                    </button>
                </form>
            </div>
        </div>
    );
}
