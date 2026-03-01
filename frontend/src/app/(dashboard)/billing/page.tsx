'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FileText, Plus, Search, Filter, X, Calendar,
    Download, Eye, CreditCard, CheckCircle, AlertCircle, Clock, User, LogOut
} from 'lucide-react';
import { coreApi as api } from '@/lib/api';
import { format as formatDate } from 'date-fns';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { Portal } from '@/components/shared/portal';
import { useCurrency } from '@/hooks/use-currency';

export default function BillingPage() {
    const [search, setSearch] = useState('');
    const [showNewInvoice, setShowNewInvoice] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const queryClient = useQueryClient();
    const { format } = useCurrency();

    const { data: invoices, isLoading } = useQuery({
        queryKey: ['invoices'],
        queryFn: async () => {
            const res = await api.get('/billing/invoices');
            return res.data;
        }
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'PARTIALLY_PAID': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'OVERDUE': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
        }
    };

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading invoices...</div>;

    return (
        <div className="p-4 lg:p-5 space-y-5 max-w-[1700px] mx-auto min-h-screen bg-cyan-50/50 animate-in fade-in duration-700 font-fira-sans">
            <div className="flex items-center justify-between px-2">
                <div>
                    <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-2.5">
                        <CreditCard className="h-8 w-8 text-emerald-600" />
                        Billing & Invoices
                    </h1>
                    <p className="text-slate-400 mt-1 font-black uppercase tracking-[0.2em] text-[8.5px] font-fira-code">Track payments and hospital revenue</p>
                </div>
                <button
                    onClick={() => setShowNewInvoice(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:opacity-95 transition-all font-black shadow-lg shadow-emerald-500/30 text-[9px] uppercase tracking-[0.2em] active:scale-95 cursor-pointer font-fira-code"
                >
                    <Plus className="h-4 w-4" />
                    Create Invoice
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Revenue', val: 42500, icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Outstanding', val: 12340, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
                    { label: 'Paid Today', val: 3200, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Pending Claims', val: 5800, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-emerald-50 shadow-sm hover:shadow-md transition-all">
                        <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest font-fira-code mb-2">{stat.label}</p>
                        <div className="flex items-baseline gap-2">
                            <p className={cn("text-xl font-black tracking-tighter tabular-nums", stat.color)}>{format(stat.val)}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white/60 backdrop-blur-xl border border-emerald-100 rounded-2xl shadow-lg shadow-emerald-500/5 overflow-hidden">
                <div className="p-3 border-b border-emerald-50 bg-emerald-50/20 flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="SEARCH INVOICE #, PATIENT NAME..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-emerald-100 transition-all h-[36px] font-fira-code"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="h-9 w-9 flex items-center justify-center border border-emerald-100 rounded-lg hover:bg-emerald-50 text-slate-400 transition-all active:scale-95 cursor-pointer">
                        <Filter className="h-4 w-4" />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] font-fira-code">
                                <th className="px-5 py-2.5">Invoice #</th>
                                <th className="px-5 py-2.5">Patient Detail</th>
                                <th className="px-5 py-2.5">Date</th>
                                <th className="px-5 py-2.5">Total</th>
                                <th className="px-5 py-2.5">Paid</th>
                                <th className="px-5 py-2.5">Due</th>
                                <th className="px-5 py-2.5">Status</th>
                                <th className="px-5 py-2.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {invoices?.filter((inv: any) =>
                                inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
                                inv.patient.first_name.toLowerCase().includes(search.toLowerCase()) ||
                                inv.patient.last_name.toLowerCase().includes(search.toLowerCase())
                            ).map((invoice: any) => (
                                <tr key={invoice.id} className="hover:bg-emerald-50/30 transition-colors border-b border-emerald-50/50 last:border-0 group">
                                    <td className="px-5 py-3 font-fira-code font-black text-[10px] text-emerald-700">{invoice.invoice_number}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex flex-col">
                                            <span className="font-black text-[11px] text-slate-900 uppercase tracking-tighter leading-none mb-1">{invoice.patient.first_name} {invoice.patient.last_name}</span>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-fira-code">{invoice.patient.mrn}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-[10px] font-bold text-slate-500 font-fira-code">{formatDate(new Date(invoice.created_at), 'MMM dd, yyyy')}</td>
                                    <td className="px-5 py-3 font-black text-[11px] text-slate-900 tabular-nums">{format(invoice.total)}</td>
                                    <td className="px-5 py-3 font-black text-[11px] text-emerald-600 tabular-nums">{format(invoice.paid_amount)}</td>
                                    <td className="px-5 py-3 font-black text-[11px] text-rose-500 tabular-nums">{format(invoice.balance_due)}</td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-widest font-fira-code ${getStatusColor(invoice.status)}`}>
                                            {invoice.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={() => setSelectedInvoice(invoice.id)}
                                                className="h-7 w-7 flex items-center justify-center hover:bg-emerald-100 rounded-lg transition-colors text-slate-400 hover:text-emerald-700 border border-transparent hover:border-emerald-200 active:scale-95 cursor-pointer"
                                                title="View Detail"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedInvoice(invoice.id);
                                                    setTimeout(() => window.print(), 500);
                                                }}
                                                className="h-7 w-7 flex items-center justify-center hover:bg-emerald-100 rounded-lg transition-colors text-slate-400 hover:text-emerald-700 border border-transparent hover:border-emerald-200 active:scale-95 cursor-pointer"
                                                title="Print Invoice"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showNewInvoice && (
                <Portal>
                    <NewInvoiceModal onClose={() => setShowNewInvoice(false)} />
                </Portal>
            )}

            {selectedInvoice && (
                <Portal>
                    <InvoiceDetailModal id={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
                </Portal>
            )}
        </div>
    );
}

function NewInvoiceModal({ onClose }: any) {
    const [patientId, setPatientId] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const queryClient = useQueryClient();
    const { format } = useCurrency();
    // Load patients for selection
    const { data: patients } = useQuery({ queryKey: ['patients'], queryFn: async () => (await api.get('/patients')).data });

    // Load draft for aggregate billing if patientId is selected
    const { data: draftData, isLoading: isLoadingDraft } = useQuery({
        queryKey: ['draft-invoice', patientId],
        queryFn: async () => {
            if (!patientId) return null;
            const res = await api.get(`/billing/draft/${patientId}`);
            return res.data;
        },
        enabled: !!patientId
    });

    const checkoutMutation = useMutation({
        mutationFn: async (data: any) => await api.post('/billing/checkout', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            onClose();
        }
    });

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unit_price: 0, category: 'other' }]);
    };

    const removeItem = (index: number) => {
        const draftCount = draftData?.items?.length || 0;
        if (index < draftCount) return; // Safety check
        const manualIndex = index - draftCount;
        setItems(items.filter((_, i) => i !== manualIndex));
    };

    const updateItem = (index: number, field: string, value: any) => {
        const draftCount = draftData?.items?.length || 0;
        if (index < draftCount) return; // Safety check
        const manualIndex = index - draftCount;
        const newItems = [...items];
        newItems[manualIndex] = { ...newItems[manualIndex], [field]: value };
        setItems(newItems);
    };

    const allItems = [...(draftData?.items || []), ...items];
    const subtotal = allItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/90 backdrop-blur-2xl w-full max-w-4xl rounded-2xl shadow-2xl border border-emerald-100 flex flex-col max-h-[90vh] overflow-hidden font-fira-sans animate-in zoom-in-95 duration-300">
                <div className="p-4 border-b border-emerald-50 bg-emerald-50/30 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg font-black tracking-tighter text-slate-900 uppercase">Create New Invoice</h2>
                        <p className="text-[8px] text-emerald-600 font-black uppercase tracking-widest mt-0.5 font-fira-code">Create a new bill for a patient</p>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-emerald-50 transition-all text-xs border border-emerald-100 shadow-sm active:scale-95 cursor-pointer">×</button>
                </div>

                <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <label className="block text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 ml-1 font-fira-code">Select Patient</label>
                            <select
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-emerald-100 rounded-lg text-[10px] uppercase font-black tracking-widest transition-all focus:ring-2 focus:ring-emerald-100 outline-none h-[38px] font-fira-code"
                            >
                                <option value="">CHOOSE PATIENT...</option>
                                {patients?.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.mrn})</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 font-fira-code">Invoice Items</p>
                                <button onClick={addItem} className="text-[8px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-1.5 hover:underline font-fira-code">
                                    <Plus className="h-3 w-3" /> Add Item
                                </button>
                            </div>

                            {isLoadingDraft && <p className="text-xs text-muted-foreground animate-pulse">Calculating stay costs...</p>}

                            <div className="space-y-1.5">
                                {allItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 items-start p-2 bg-white/50 rounded-lg border border-emerald-50 hover:border-emerald-100 transition-colors">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                className="w-full bg-transparent text-[11px] font-black uppercase tracking-tighter text-slate-700 focus:outline-none"
                                                placeholder="ITEM DESCRIPTION"
                                                value={item.description}
                                                onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                                disabled={idx < (draftData?.items?.length || 0)}
                                            />
                                        </div>
                                        <div className="w-16">
                                            <input
                                                type="number"
                                                className="w-full bg-transparent text-[11px] text-center focus:outline-none font-black text-emerald-600 tabular-nums"
                                                placeholder="Qty"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="w-24">
                                            <input
                                                type="number"
                                                className="w-full bg-transparent text-[11px] text-right focus:outline-none font-black tabular-nums"
                                                placeholder="Price"
                                                value={item.unit_price}
                                                onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value))}
                                                disabled={idx < (draftData?.items?.length || 0)}
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeItem(idx)}
                                            className="text-red-400 p-1 hover:bg-red-400/10 rounded"
                                            disabled={idx < (draftData?.items?.length || 0)}
                                        >
                                            <LogOut className="h-3 w-3 rotate-180" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-800 border-b border-emerald-100 pb-2 font-fira-code">Summary</h3>
                        <div className="space-y-2 text-[10px] font-black uppercase tracking-widest font-fira-code">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{format(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Insurance</span>
                                <span>-{format(0)}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Advance Paid</span>
                                <span>-{format(draftData?.total_advance || 0)}</span>
                            </div>
                            <div className="border-t border-emerald-100 pt-3 flex justify-between font-black text-base text-slate-900">
                                <span className="text-[8px] tracking-[0.2em] self-center">TOTAL DUE</span>
                                <span className="text-emerald-700 tabular-nums">{format(subtotal - (draftData?.total_advance || 0))}</span>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={() => checkoutMutation.mutate({
                                    patient_id: patientId,
                                    items: allItems,
                                    advance_paid: draftData?.total_advance || 0
                                })}
                                disabled={!patientId || allItems.length === 0 || checkoutMutation.isPending}
                                className="w-full py-3.5 bg-emerald-900 text-white rounded-xl font-black shadow-lg shadow-emerald-900/20 hover:opacity-95 transition-all disabled:opacity-50 text-[10px] uppercase tracking-widest font-fira-code active:scale-95"
                            >
                                {checkoutMutation.isPending ? 'PROCESSING...' : 'CONFIRM INVOICE'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InvoiceDetailModal({ id, onClose }: any) {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const queryClient = useQueryClient();
    const { format } = useCurrency();

    const { data: invoice, isLoading, refetch } = useQuery({
        queryKey: ['invoice', id],
        queryFn: async () => (await api.get(`/billing/invoices/${id}`)).data
    });

    if (isLoading) return null;

    return (
        <div className="fixed inset-0 bg-[#064E3B]/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-2xl w-full max-w-2xl rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] font-fira-sans">
                <div className="px-5 py-3.5 bg-emerald-50/30 border-b border-emerald-50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600/10 flex items-center justify-center border border-emerald-600/20 shadow-sm">
                            <FileText className="h-4.5 w-4.5 text-emerald-700" />
                        </div>
                        <div>
                            <h2 className="text-base font-black tracking-tighter uppercase text-slate-900 leading-none">Invoice Detail</h2>
                            <p className="text-[7.5px] text-emerald-600 font-black tracking-widest uppercase mt-1 font-fira-code">Patient Billing Statement</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-emerald-50 transition-all text-xs border border-emerald-100 shadow-sm active:scale-95 cursor-pointer">×</button>
                </div>

                <div className="p-5 space-y-5 overflow-y-auto">
                    <div className="flex flex-col md:flex-row justify-between gap-5">
                        <div>
                            <div className="flex items-center gap-2.5 mb-1">
                                <h3 className="text-lg font-black tracking-tighter text-slate-900 tabular-nums">{invoice.invoice_number}</h3>
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-widest border font-fira-code",
                                    invoice.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                                )}>
                                    {invoice.status}
                                </span>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1.5 font-fira-code">
                                <Calendar className="h-3 w-3" />
                                {formatDate(new Date(invoice.created_at), 'MMMM dd, yyyy • HH:mm')}
                            </p>
                        </div>
                        <div className="text-left md:text-right">
                            <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1 shadow-sm bg-emerald-50/50 inline-block px-2 py-0.5 rounded border border-emerald-100 font-fira-code">Issued By</p>
                            <p className="font-black text-base leading-tight text-slate-900">HMS CORE CENTER</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight font-fira-code">Emergency & General Ward</p>
                        </div>
                    </div>

                    <div className="bg-emerald-50/20 p-5 rounded-2xl border border-emerald-50/50 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-3 ml-1 font-fira-code">Billed To (Patient)</p>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-white border border-emerald-100 flex items-center justify-center font-black text-emerald-700 text-[10px] shadow-sm">
                                    {invoice.patient.first_name[0]}{invoice.patient.last_name[0]}
                                </div>
                                <div>
                                    <p className="font-black text-[13px] leading-none mb-1 text-slate-900 uppercase tracking-tighter">{invoice.patient.first_name} {invoice.patient.last_name}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-fira-code">{invoice.patient.mrn}</p>
                                </div>
                            </div>
                        </div>
                        <div className="md:text-right flex flex-col items-start md:items-end">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 font-fira-code">Payment Details</p>
                            <p className="font-black text-[10px] text-slate-900 uppercase tracking-widest">Medical Services</p>
                            <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest font-fira-code">Payment Method</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-emerald-50">
                                    <th className="pb-2 text-left text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] font-fira-code">Item Description</th>
                                    <th className="pb-2 text-center text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] font-fira-code">Qty</th>
                                    <th className="pb-2 text-right text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] font-fira-code">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-50/50">
                                {invoice.items.map((item: any) => (
                                    <tr key={item.id} className="group transition-colors">
                                        <td className="py-2.5 text-[10px] font-black text-slate-700 uppercase tracking-tight group-hover:text-emerald-700 transition-colors">{item.description}</td>
                                        <td className="py-2.5 text-center text-[10px] font-black text-slate-400 font-fira-code">{item.quantity}</td>
                                        <td className="py-2.5 text-right text-[10px] font-black text-slate-900 tabular-nums font-fira-code">{format(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pt-4 border-t border-emerald-50 flex flex-col md:flex-row justify-between items-start md:items-end gap-5 shrink-0">
                        {/* Left: Action Buttons */}
                        <div className="flex gap-2.5 print:hidden">
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                disabled={invoice.status === 'PAID'}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl font-black shadow-lg transition-all active:scale-95 flex items-center gap-2 text-[9px] uppercase tracking-widest font-fira-code",
                                    invoice.status === 'PAID'
                                        ? "bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200"
                                        : "bg-emerald-600 text-white shadow-emerald-500/20 hover:opacity-95"
                                )}
                            >
                                <CreditCard className="h-3.5 w-3.5" />
                                {invoice.status === 'PAID' ? 'FULLY PAID' : 'PAY NOW'}
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="px-5 py-2.5 border border-emerald-100 rounded-xl hover:bg-emerald-50 transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2 bg-white text-slate-400 font-fira-code active:scale-95 cursor-pointer shadow-sm"
                            >
                                <Download className="h-3.5 w-3.5 text-emerald-600" />
                                PRINT
                            </button>
                        </div>

                        {/* Right: Financial Summary */}
                        <div className="w-full md:w-56 space-y-1.5 bg-emerald-50/30 p-4 rounded-xl border border-emerald-50">
                            <div className="flex justify-between items-center text-[8px] font-black text-slate-400 uppercase tracking-widest font-fira-code">
                                <span>Subtotal</span>
                                <span className="text-slate-900 tabular-nums">{format(invoice.subtotal)}</span>
                            </div>
                            {Number(invoice.advance_paid) > 0 && (
                                <div className="flex justify-between items-center text-[8px] font-black text-emerald-600 uppercase tracking-widest font-fira-code">
                                    <span>Advance</span>
                                    <span className="tabular-nums">-{format(invoice.advance_paid)}</span>
                                </div>
                            )}
                            {Number(invoice.paid_amount) > 0 && (
                                <div className="flex justify-between items-center text-[8px] font-black text-emerald-600 uppercase tracking-widest font-fira-code">
                                    <span>Settled</span>
                                    <span className="tabular-nums">-{format(invoice.paid_amount)}</span>
                                </div>
                            )}
                            <div className="pt-2.5 mt-2 border-t border-emerald-100 flex justify-between items-baseline">
                                <span className="text-[7.5px] font-black uppercase text-emerald-700 tracking-[0.2em] font-fira-code">BALANCE DUE</span>
                                <span className="text-xl font-black text-emerald-700 tracking-tighter tabular-nums">{format(invoice.balance_due)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {showPaymentModal && (
                    <Portal>
                        <PaymentModal
                            invoice={invoice}
                            onClose={() => {
                                setShowPaymentModal(false);
                                refetch();
                                queryClient.invalidateQueries({ queryKey: ['invoices'] });
                            }}
                        />
                    </Portal>
                )}
            </div>
        </div>
    );
}

function PaymentModal({ invoice, onClose }: { invoice: any, onClose: () => void }) {
    const { register, handleSubmit } = useForm({
        defaultValues: {
            amount: Number(invoice.balance_due),
            method: 'CASH',
            notes: ''
        }
    });

    const { format, currency } = useCurrency();

    const paymentMutation = useMutation({
        mutationFn: (data: any) => api.post(`/billing/invoices/${invoice.id}/payments`, data),
        onSuccess: () => onClose()
    });

    return (
        <div className="fixed inset-0 bg-[#064E3B]/40 backdrop-blur-md flex items-center justify-center z-[60] p-4">
            <div className="bg-white/95 backdrop-blur-2xl w-full max-w-md rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden animate-in zoom-in-95 duration-200 font-fira-sans">
                <div className="p-5 border-b border-emerald-50 bg-emerald-50/30 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-base font-black tracking-tighter uppercase text-slate-900 leading-none">Record Payment</h2>
                        <p className="text-[7.5px] text-emerald-600 font-black tracking-widest uppercase mt-1 font-fira-code">Record payment reception</p>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-emerald-50 transition-all text-xs border border-emerald-100 shadow-sm active:scale-95 cursor-pointer">×</button>
                </div>
                <form onSubmit={handleSubmit((data) => paymentMutation.mutate({ ...data, amount: Number(data.amount) }))} className="p-6 lg:p-7 space-y-5">
                    <div>
                        <label className="block text-[8px] font-black uppercase tracking-widest text-emerald-600 mb-2 ml-1 font-fira-code">Amount to Pay ({currency})</label>
                        <input
                            type="number"
                            step="0.01"
                            {...register('amount', { required: true })}
                            className="w-full px-5 py-3.5 bg-white border border-emerald-100 rounded-xl text-xl font-black text-emerald-700 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-fira-sans shadow-sm"
                        />
                        <p className="text-[8px] text-slate-400 mt-2 font-black uppercase tracking-widest font-fira-code ml-1">Remaining: {format(invoice.balance_due)}</p>
                    </div>

                    <div>
                        <label className="block text-[8px] font-black uppercase tracking-widest text-emerald-600 mb-2 ml-1 font-fira-code">Payment Method</label>
                        <select {...register('method')} className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest font-fira-code h-[42px] appearance-none outline-none focus:ring-4 focus:ring-emerald-50 transition-all font-fira-code">
                            <option value="CASH">CASH</option>
                            <option value="CARD">CARD</option>
                            <option value="BANK_TRANSFER">BANK TRANSFER</option>
                            <option value="ONLINE">ONLINE PAYMENT</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1 font-fira-code">Payment Notes</label>
                        <textarea {...register('notes')} className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest font-fira-code outline-none focus:ring-4 focus:ring-emerald-50 transition-all" rows={2} placeholder="TXN REF, SUBJECT NOTES..." />
                    </div>

                    <div className="flex gap-3 pt-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-emerald-100 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-emerald-50 transition-all font-fira-code active:scale-95 cursor-pointer">Abandon</button>
                        <button type="submit" disabled={paymentMutation.isPending} className="flex-[2] py-3 bg-emerald-900 text-white rounded-xl font-black shadow-xl shadow-emerald-900/20 hover:opacity-95 transition-all active:scale-95 disabled:opacity-50 text-[9px] uppercase tracking-widest font-fira-code">
                            {paymentMutation.isPending ? 'PROCESSING...' : 'CONFIRM PAYMENT'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
