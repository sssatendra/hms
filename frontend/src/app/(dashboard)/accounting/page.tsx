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
    Receipt,
    Loader2
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

    const handleExportPL = async () => {
        try {
            const resp = await api.get('/accounting/reports/pl');
            const report = resp.data;
            
            // Simple text-based "export" for demonstration
            let content = `PROFIT & LOSS STATEMENT\n`;
            content += `Period: ${new Date(report.period.start).toLocaleDateString()} - ${new Date(report.period.end).toLocaleDateString()}\n`;
            content += `-----------------------------------\n\n`;
            content += `INCOME:\n`;
            Object.entries(report.income).forEach(([name, amt]: any) => {
                content += `  ${name.padEnd(25)}: ${amt.toLocaleString()}\n`;
            });
            content += `TOTAL INCOME: ${report.totalIncome.toLocaleString()}\n\n`;
            content += `EXPENSES:\n`;
            Object.entries(report.expense).forEach(([name, amt]: any) => {
                content += `  ${name.padEnd(25)}: ${amt.toLocaleString()}\n`;
            });
            content += `TOTAL EXPENSE: ${report.totalExpense.toLocaleString()}\n\n`;
            content += `-----------------------------------\n`;
            content += `NET PROFIT: ${report.netProfit.toLocaleString()}\n`;

            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `PL_Statement_${new Date().toISOString().split('T')[0]}.txt`;
            a.click();
        } catch (error) {
            console.error('Failed to export P&L', error);
        }
    };

    const handleExportTax = async () => {
        try {
            const resp = await api.get('/accounting/reports/tax');
            const report = resp.data;

            let content = `TAX MATRIX REPORT\n`;
            content += `Generated: ${new Date().toLocaleString()}\n`;
            content += `-----------------------------------\n\n`;
            content += `${'Code'.padEnd(8)} ${'Account Name'.padEnd(25)} ${'Net Balance'.padStart(15)}\n`;
            content += `-`.repeat(50) + `\n`;
            
            report.forEach((acc: any) => {
                content += `${acc.code.padEnd(8)} ${acc.name.padEnd(25)} ${acc.netBalance.toLocaleString().padStart(15)}\n`;
            });

            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Tax_Matrix_${new Date().toISOString().split('T')[0]}.txt`;
            a.click();
        } catch (error) {
            console.error('Failed to export Tax Matrix', error);
        }
    };

    const stats = [
        {
            label: 'Total Assets',
            value: fiscalStats ? format(fiscalStats.totalAssets) : format(0),
            change: '+0.0%',
            icon: Landmark,
            color: 'text-primary',
            bg: 'bg-primary/5'
        },
        {
            label: 'Monthly Revenue',
            value: fiscalStats ? format(fiscalStats.revenueMTD) : format(0),
            change: '+0.0%',
            icon: TrendingUp,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/5'
        },
        {
            label: 'Total Expenses',
            value: fiscalStats ? format(fiscalStats.expensesMTD) : format(0),
            change: '+0.0%',
            icon: Wallet,
            color: 'text-rose-500',
            bg: 'bg-rose-500/5'
        },
        {
            label: 'Outstanding Payments',
            value: fiscalStats ? format(fiscalStats.receivables) : format(0),
            change: '+0.0%',
            icon: Receipt,
            color: 'text-accent',
            bg: 'bg-accent/5'
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-[1600px] mx-auto p-4 lg:p-8 font-fira-sans">
            {/* Ocean Breeze Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#115E59] to-[#0D9488] px-10 py-12 rounded-[40px] shadow-2xl shadow-teal-900/10 text-white hover:shadow-teal-900/20 transition-all duration-500">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex items-center justify-center shadow-inner group">
                            <Wallet className="h-10 w-10 text-teal-100 transition-transform group-hover:scale-110 duration-500" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2 opacity-80">
                                <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[8px] font-black uppercase tracking-widest">Fiscal Management</div>
                                <span className="text-[9px] font-black text-teal-200 uppercase tracking-widest border-l border-white/20 pl-3 font-fira-code">Currency: {country}</span>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter leading-tight uppercase">
                                Accounting <span className="text-teal-100/40 font-fira-sans">&</span> Finance
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {accounts.length === 0 ? (
                            <button
                                onClick={() => setShowSeedConfirm(true)}
                                disabled={seedAccountsMutation.isPending}
                                className="px-8 py-4 bg-white text-teal-900 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-teal-50 transition-all shadow-xl shadow-teal-900/20 active:scale-95 flex items-center gap-3 disabled:opacity-50"
                            >
                                {seedAccountsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
                                Initial System Setup
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowAccountModal(true)}
                                className="px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-[24px] hover:bg-white/20 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-3 active:scale-95"
                            >
                                <Settings size={16} />
                                Manage Accounts
                            </button>
                        )}
                        <button
                            onClick={() => setShowJournalModal(true)}
                            className="px-8 py-4 bg-teal-900 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-teal-800 transition-all shadow-2xl shadow-teal-900/40 flex items-center gap-3 active:scale-95"
                        >
                            <Plus size={18} />
                            Record Transaction
                        </button>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[-20%] left-[-10%] w-80 h-80 bg-emerald-400/20 rounded-full blur-[100px]" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="group relative bg-white/70 backdrop-blur-xl p-8 rounded-[40px] border border-teal-100 shadow-xl shadow-teal-500/5 hover:shadow-teal-500/10 hover:-translate-y-1 transition-all duration-500">
                        <div className="flex justify-between items-start mb-6">
                            <div className={cn("p-5 rounded-[24px] transition-all group-hover:scale-110 shadow-inner border border-white/50", stat.bg)}>
                                <stat.icon className={stat.color} size={32} />
                            </div>
                            <span className={cn(
                                "text-[9px] font-black px-3 py-1.5 rounded-full border shadow-sm font-fira-code",
                                stat.change.startsWith('+') ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                            )}>
                                {stat.change}
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-teal-900/30 uppercase tracking-[0.3em] font-fira-code ml-1">{stat.label}</p>
                            <h3 className="text-3xl font-black text-teal-900 mt-2 font-fira-sans tracking-tighter tabular-nums">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left Column: Recent Ledger Entries */}
                <div className="xl:col-span-8 space-y-6 animate-in slide-in-from-left-4 duration-700">
                    <div className="bg-white/70 backdrop-blur-xl rounded-[40px] border border-teal-100 shadow-xl shadow-teal-500/5 overflow-hidden">
                        <div className="p-8 border-b border-teal-50 bg-teal-50/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className="font-black text-teal-900 flex items-center gap-3 uppercase tracking-tighter text-xl font-fira-sans">
                                    <History size={24} className="text-teal-600" /> Fiscal Log
                                </h3>
                                <p className="text-[9px] font-black text-teal-600/40 uppercase tracking-widest mt-1 font-fira-code">Recent Transactions & Movements</p>
                            </div>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600/30 group-focus-within:text-teal-600 transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="SEARCH ENTRIES..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 pr-6 py-4 bg-white/50 border border-teal-100 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-400 transition-all w-full md:w-64 font-fira-code"
                                />
                            </div>
                        </div>
                        <div className="divide-y divide-teal-50">
                            {filteredEntries?.length === 0 ? (
                                <div className="p-24 text-center">
                                    <div className="w-20 h-20 bg-teal-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-teal-100 shadow-inner">
                                        <History className="h-10 w-10 text-teal-200" />
                                    </div>
                                    <p className="text-[10px] font-black text-teal-900/30 uppercase tracking-[0.3em] font-fira-code">No Fiscal Records Identified</p>
                                </div>
                            ) : filteredEntries?.map((entry: any) => (
                                <div key={entry.id} className="p-8 hover:bg-teal-50/40 transition-all duration-300 cursor-pointer group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[8px] font-black text-teal-600 uppercase bg-white px-3 py-1 rounded-lg border border-teal-100 tracking-[0.2em] font-fira-code shadow-sm">
                                                {entry.reference_type}
                                            </span>
                                            <span className="text-xs font-black text-teal-900 group-hover:text-teal-700 transition-colors font-fira-code tracking-tight">LOG ID: {entry.reference_id?.slice(-12).toUpperCase()}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] font-black text-teal-900/40 uppercase tracking-widest font-fira-code">{new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {entry.ledger_details.map((detail: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center p-4 bg-white/50 rounded-2xl border border-teal-50 group-hover:border-teal-100 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-2 h-2 rounded-full", Number(detail.debit) > 0 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-teal-200")}></div>
                                                    <span className="text-[10px] font-black text-teal-900 uppercase tracking-tight font-fira-sans">
                                                        {detail.account.name}
                                                    </span>
                                                </div>
                                                <span className={cn(
                                                    "text-sm font-black tabular-nums tracking-tighter font-fira-code",
                                                    Number(detail.debit) > 0 ? "text-emerald-600" : "text-teal-900"
                                                )}>
                                                    {Number(detail.debit) > 0 ? `+ ${format(detail.debit)}` : `- ${format(detail.credit)}`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-8 bg-teal-50/20 border-t border-teal-50 text-center">
                            <button className="text-[10px] font-black text-teal-600 hover:text-teal-900 transition-all uppercase tracking-[0.2em] font-fira-code flex items-center gap-3 mx-auto group">
                                Generate Full Financial Report <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Chart of Accounts Snippet */}
                <div className="xl:col-span-4 space-y-8 animate-in slide-in-from-right-4 duration-700">
                    <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[40px] border border-teal-100 shadow-xl shadow-teal-500/5 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-3 bg-teal-600 text-white rounded-bl-3xl shadow-lg">
                            <BookOpen size={20} />
                        </div>
                        <div className="mb-8">
                            <h3 className="font-black text-teal-900 uppercase tracking-tighter text-xl font-fira-sans flex items-center gap-3">
                                <Activity size={24} className="text-emerald-500" /> Account Status
                            </h3>
                            <p className="text-[9px] font-black text-teal-600/40 uppercase tracking-widest mt-1 font-fira-code">Current Ledger Balances</p>
                        </div>

                        {/* Fixed Height Scrollable Area */}
                        <div className="h-[450px] overflow-y-auto pr-4 space-y-3 custom-scrollbar">
                            {accounts.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-teal-50/30 rounded-[32px] border border-dashed border-teal-100">
                                    <div className="p-6 bg-white rounded-full shadow-lg border border-teal-50 mb-6 group-hover:scale-110 transition-transform duration-500">
                                        <Landmark size={40} className="text-teal-100" />
                                    </div>
                                    <p className="text-xs font-black text-teal-900 uppercase tracking-tighter mb-2">No Accounts Initialized</p>
                                    <button
                                        onClick={() => seedAccountsMutation.mutate()}
                                        disabled={seedAccountsMutation.isPending}
                                        className="w-full py-4 bg-teal-600 text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-teal-700 transition-all shadow-xl shadow-teal-600/20 disabled:opacity-50"
                                    >
                                        {seedAccountsMutation.isPending ? 'Syncing...' : 'Quick Deploy Accounts'}
                                    </button>
                                </div>
                            ) : accounts.map((acc: any, i: number) => (
                                <div key={i} className="group flex items-center justify-between p-5 bg-white border border-teal-50 rounded-[28px] hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/10 transition-all duration-300 cursor-pointer">
                                    <div className="flex-1">
                                        <div className="text-[11px] font-black text-teal-900 group-hover:text-teal-600 transition-colors tracking-tight font-fira-sans leading-none mb-2">{acc.code} • {acc.name}</div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[8px] font-black text-teal-600/40 uppercase tracking-widest font-fira-code">{acc.type}</span>
                                            <div className="w-1 h-1 bg-teal-100 rounded-full" />
                                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest font-fira-code">Active</span>
                                        </div>
                                    </div>
                                    <div className="text-sm font-black text-teal-900 tabular-nums tracking-tighter font-fira-code">
                                        {format(acc.balance || 0)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="mt-8 w-full py-5 bg-white border border-teal-100 rounded-[24px] text-[9px] font-black text-teal-600 uppercase tracking-[0.25em] font-fira-code hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all duration-500 shadow-sm active:scale-95 group flex items-center justify-center gap-3">
                            View Full Chart Hierarchy <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="group bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-12 rounded-[40px] text-white shadow-2xl relative overflow-hidden transition-all duration-500 hover:shadow-teal-900/40 hover:-translate-y-1">
                        <div className="absolute -right-24 -top-24 w-72 h-72 bg-emerald-400/10 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-1000"></div>
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-400/5 rounded-full blur-[80px]"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-10">
                                <div className="p-5 bg-white/5 rounded-[24px] border border-white/10 shadow-inner">
                                    <PieChart size={32} className="text-emerald-400" />
                                </div>
                                <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-400 px-5 py-2 rounded-full tracking-[0.2em] uppercase border border-emerald-500/20 font-fira-code">Advanced Analytics</span>
                            </div>

                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3 font-fira-code">Yield Benchmark</p>
                            <h4 className="text-6xl font-black mb-8 font-fira-sans tracking-tighter tabular-nums text-white group-hover:text-emerald-400 transition-colors">64.2%</h4>

                            <div className="flex items-center gap-4 text-emerald-400 text-sm font-black p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 animate-pulse">
                                <TrendingUp size={20} /> <span className="font-fira-sans tracking-tight">+4.2% Optimization vs Baseline</span>
                            </div>

                            <div className="mt-12 pt-10 border-t border-white/5 space-y-4">
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleExportPL}
                                        className="px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                                    >
                                        Export P&L Statement
                                    </button>
                                    <button
                                        onClick={handleExportTax}
                                        className="px-6 py-4 bg-teal-950 text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:shadow-xl hover:shadow-teal-900/40 transition-all active:scale-95 border border-emerald-500/20"
                                    >
                                        Tax Matrix Synthesis
                                    </button>
                                </div>
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
                confirmText="Yes, Initialize Accounts"
                cancelText="Cancel"
                isDestructive={false}
            />
        </div>
    );
}

function AccountModal({ accounts, onClose, onSubmit, isLoading }: any) {
    const { register, handleSubmit } = useForm();
    return (
        <div className="fixed inset-0 bg-teal-900/20 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-teal-100 animate-in zoom-in-95 duration-300 relative">
                <div className="p-8 border-b border-teal-50 bg-teal-50/20 flex justify-between items-center text-teal-900 uppercase font-fira-sans">
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter">Manage Accounts</h2>
                        <p className="text-[10px] text-teal-600/40 font-black tracking-widest mt-1 font-fira-code">Create or edit ledger accounts</p>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-2xl hover:bg-teal-50 transition-all text-2xl border border-teal-100 shadow-sm text-teal-400">×</button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="p-10 space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-teal-900/40 ml-1 font-fira-code">Account Name</label>
                            <input {...register('name', { required: true })} className="w-full bg-teal-50/30 border border-teal-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-400 transition-all font-black outline-none font-fira-sans text-teal-900" placeholder="e.g. Petty Cash" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-teal-900/40 ml-1 font-fira-code">Account Code</label>
                            <input {...register('code', { required: true })} className="w-full bg-teal-50/30 border border-teal-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-400 transition-all font-black outline-none font-fira-code uppercase text-teal-900" placeholder="1001" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-teal-900/40 ml-1 font-fira-code">Account Category</label>
                            <select {...register('type')} className="w-full bg-teal-50/30 border border-teal-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-400 transition-all font-black outline-none uppercase text-[10px] text-teal-900">
                                <option value="ASSET">Asset (1xxx)</option>
                                <option value="LIABILITY">Liability (2xxx)</option>
                                <option value="EQUITY">Equity (3xxx)</option>
                                <option value="INCOME">Income (4xxx)</option>
                                <option value="EXPENSE">Expense (5xxx)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-teal-900/40 ml-1 font-fira-code">Parent Structure</label>
                            <select {...register('parent_id')} className="w-full bg-teal-50/30 border border-teal-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-400 transition-all font-black outline-none uppercase text-[10px] text-teal-900">
                                <option value="">Independent Root</option>
                                {Array.isArray(accounts) && accounts.filter((a: any) => !a.parent_id).map((a: any) => (
                                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button disabled={isLoading} className="w-full py-5 bg-teal-900 text-white rounded-[24px] font-black uppercase tracking-[0.25em] shadow-xl shadow-teal-900/20 hover:bg-teal-800 transition-all active:scale-95 disabled:opacity-50 text-[10px] flex items-center justify-center gap-3">
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-teal-400" />}
                        {isLoading ? 'Processing Account...' : 'Initialize New Account'}
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
        <div className="fixed inset-0 bg-teal-900/20 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden border border-teal-100 animate-in zoom-in-95 duration-300 relative">
                <div className="p-8 border-b border-teal-50 bg-teal-50/20 flex justify-between items-center text-teal-900 uppercase font-fira-sans">
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter">Record Transaction</h2>
                        <p className="text-[10px] text-teal-600 font-black tracking-widest mt-1 italic font-fira-code">Manual Ledger Submission</p>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-2xl hover:bg-teal-50 transition-all text-2xl border border-teal-100 shadow-sm text-teal-400">×</button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="p-10 space-y-8">
                    <div className="max-h-[450px] overflow-y-auto pr-4 space-y-6 custom-scrollbar">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-6 items-end bg-teal-50/30 p-6 rounded-[32px] border border-teal-100/50 hover:border-teal-300 transition-all group">
                                <div className="col-span-6 space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-teal-900/40 ml-1 font-fira-code">Target Account</label>
                                    <select {...register(`entries.${index}.accountId` as const)} className="w-full bg-white border border-teal-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-400 transition-all font-black outline-none text-[10px] uppercase text-teal-900 font-fira-sans">
                                        <option value="">Select Account</option>
                                        {Array.isArray(accounts) && accounts.map((a: any) => (
                                            <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 ml-1 font-fira-code">Debit</label>
                                    <input type="number" step="0.01" {...register(`entries.${index}.debit` as const)} className="w-full bg-white border border-teal-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-teal-500/10 focus:border-emerald-400 transition-all font-fira-code font-black text-xs text-emerald-600" />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-rose-600 ml-1 font-fira-code">Credit</label>
                                    <input type="number" step="0.01" {...register(`entries.${index}.credit` as const)} className="w-full bg-white border border-teal-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-teal-500/10 focus:border-rose-400 transition-all font-fira-code font-black text-xs text-rose-600" />
                                </div>
                                <div className="col-span-2 pb-1.5 text-right">
                                    <button type="button" onClick={() => remove(index)} className="p-3 hover:bg-rose-500/10 text-rose-300 hover:text-rose-500 rounded-xl transition-all font-bold">
                                        <History className="h-5 w-5 rotate-45" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
                        <button type="button" onClick={() => append({ accountId: '', debit: 0, credit: 0 })} className="text-[10px] font-black text-teal-600 uppercase tracking-widest border border-teal-100 px-6 py-3 rounded-[18px] hover:bg-teal-50 transition-all font-fira-code">
                            Add Line Item +
                        </button>

                        <div className="flex gap-10 p-6 bg-teal-50/50 rounded-[32px] border border-teal-100 font-fira-sans w-full md:w-auto shadow-inner">
                            <div>
                                <p className="text-[9px] font-black uppercase text-teal-900/40 tracking-widest mb-1 font-fira-code">Ledger Debit</p>
                                <p className="text-xl font-black text-emerald-600">{totalDebit.toLocaleString()}</p>
                            </div>
                            <div className="w-px bg-teal-100 h-10" />
                            <div>
                                <p className="text-[9px] font-black uppercase text-teal-900/40 tracking-widest mb-1 font-fira-code">Ledger Credit</p>
                                <p className="text-xl font-black text-rose-600">{totalCredit.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-slate-900 rounded-[32px] shadow-2xl">
                        {difference !== 0 ? (
                            <div className="flex items-center gap-3 text-rose-400 text-[10px] font-black uppercase tracking-widest animate-pulse font-fira-code">
                                <ShieldAlert className="h-4 w-4" /> Unbalanced Delta: {difference.toLocaleString()}
                            </div>
                        ) : (
                            <div className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 font-fira-code">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> Ledger In Equilibrium
                            </div>
                        )}

                        <button
                            disabled={isLoading || difference !== 0}
                            className="px-10 py-5 bg-teal-500 text-teal-950 rounded-[24px] font-black uppercase tracking-[0.25em] shadow-xl shadow-teal-500/20 hover:bg-teal-400 transition-all active:scale-95 disabled:opacity-30 text-[10px] font-fira-code"
                        >
                            {isLoading ? 'Finalizing...' : 'Settle Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
