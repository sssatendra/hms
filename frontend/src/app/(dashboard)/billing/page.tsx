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

interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    category: string;
}

interface Patient {
    id: string;
    first_name: string;
    last_name: string;
    mrn: string;
}

interface Invoice {
    id: string;
    invoice_number: string;
    status: string;
    created_at: string;
    total: number;
    subtotal: number;
    discount: number;
    paid_amount: number;
    balance_due: number;
    advance_paid: number;
    patient: Patient;
    items: InvoiceItem[];
}

export default function BillingPage() {
    const [search, setSearch] = useState('');
    const [showNewInvoice, setShowNewInvoice] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const { format } = useCurrency();

    const { data: invoices, isLoading } = useQuery({
        queryKey: ['invoices'],
        queryFn: async () => {
            const res = await api.get('/billing/invoices');
            return res.data;
        },
        staleTime: 0
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
            case 'PARTIALLY_PAID': return 'bg-primary/10 text-primary border border-primary/20';
            case 'OVERDUE': return 'bg-destructive/10 text-destructive border border-destructive/20';
            default: return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
        }
    };

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading invoices...</div>;

    return (
        <div className="p-4 lg:p-5 space-y-5 max-w-[1700px] mx-auto min-h-screen bg-muted/5 animate-in fade-in duration-700 font-fira-sans">
            <div className="flex items-center justify-between px-2 text-foreground">
                <div>
                    <h1 className="text-xl lg:text-2xl font-black text-foreground tracking-tighter flex items-center gap-2.5">
                        <CreditCard className="h-8 w-8 text-primary" />
                        Billing & Invoices
                    </h1>
                    <p className="text-muted-foreground mt-1 font-black uppercase tracking-[0.2em] text-[8.5px] font-fira-code">Track payments and hospital revenue</p>
                </div>
                <button
                    onClick={() => setShowNewInvoice(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-95 transition-all font-black shadow-lg shadow-black/10 text-[9px] uppercase tracking-[0.2em] active:scale-95 cursor-pointer font-fira-code"
                >
                    <Plus className="h-4 w-4" />
                    Create Invoice
                </button>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 10mm;
                        size: auto;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    body * {
                        visibility: hidden !important;
                    }
                    #printable-invoice, #printable-invoice * {
                        visibility: visible !important;
                    }
                    #printable-invoice {
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        max-width: 210mm !important;
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-sizing: border-box !important;
                        z-index: 9999 !important;
                    }
                    html, body {
                        overflow: visible !important;
                        height: auto !important;
                    }
                    .print-hidden, .print\:hidden {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Revenue', val: 42500, icon: CreditCard, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Outstanding', val: 12340, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                    { label: 'Paid Today', val: 3200, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Pending Claims', val: 5800, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                ].map((stat, i) => (
                    <div key={i} className="bg-card/70 backdrop-blur-md p-5 rounded-3xl border border-border shadow-md hover:shadow-lg transition-all group overflow-hidden relative">
                        <div className="relative z-10">
                            <p className="text-[8.5px] font-black text-muted-foreground uppercase tracking-widest font-fira-code mb-4">{stat.label}</p>
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black tracking-tighter tabular-nums text-foreground">{format(stat.val)}</h3>
                                <div className={cn("p-2 rounded-xl", stat.bg)}>
                                    <stat.icon size={18} className={stat.color} />
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors"></div>
                    </div>
                ))}
            </div>

            <div className="bg-card backdrop-blur-xl border border-border rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
                <div className="p-3 border-b border-border bg-muted/30 flex items-center gap-3">
                    <div className="relative flex-1 text-foreground">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="SEARCH INVOICE #, PATIENT NAME..."
                            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-[9px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/10 transition-all h-[36px] font-fira-code text-foreground placeholder:text-muted-foreground/40"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="h-9 w-9 flex items-center justify-center border border-border rounded-lg hover:bg-muted text-muted-foreground transition-all active:scale-95 cursor-pointer">
                        <Filter className="h-4 w-4" />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-muted/50 text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] font-fira-code border-b border-border">
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
                            {invoices?.filter((inv: Invoice) =>
                                inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
                                inv.patient.first_name.toLowerCase().includes(search.toLowerCase()) ||
                                inv.patient.last_name.toLowerCase().includes(search.toLowerCase())
                            ).map((invoice: Invoice) => (
                                <tr key={invoice.id} className="hover:bg-muted/30 transition-colors border-b border-border last:border-0 group">
                                    <td className="px-5 py-3 font-fira-code font-black text-[10px] text-primary">{invoice.invoice_number}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex flex-col">
                                            <span className="font-black text-[11px] text-foreground uppercase tracking-tighter leading-none mb-1">{invoice.patient.first_name} {invoice.patient.last_name}</span>
                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest font-fira-code">{invoice.patient.mrn}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-[10px] font-bold text-muted-foreground/70 font-fira-code">{formatDate(new Date(invoice.created_at), 'MMM dd, yyyy')}</td>
                                    <td className="px-5 py-3 font-black text-[11px] text-foreground tabular-nums">{format(invoice.total)}</td>
                                    <td className="px-5 py-3 font-black text-[11px] text-emerald-500 tabular-nums">{format(invoice.paid_amount)}</td>
                                    <td className="px-5 py-3 font-black text-[11px] text-destructive tabular-nums">{format(invoice.balance_due)}</td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-widest font-fira-code ${getStatusColor(invoice.status)}`}>
                                            {invoice.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={() => setSelectedInvoice(invoice.id)}
                                                className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-primary border border-transparent hover:border-border active:scale-95 cursor-pointer"
                                                title="View Detail"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedInvoice(invoice.id);
                                                    setTimeout(() => window.print(), 500);
                                                }}
                                                className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-primary border border-transparent hover:border-border active:scale-95 cursor-pointer"
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

function NewInvoiceModal({ onClose }: { onClose: () => void }) {
    const [patientId, setPatientId] = useState('');
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const queryClient = useQueryClient();
    const { format } = useCurrency();
    // Load patients for selection
    const { data: patients } = useQuery({ queryKey: ['patients'], queryFn: async () => (await api.get('/patients')).data as Patient[] });

    // Load draft for aggregate billing if patientId is selected
    const { data: draftData, isLoading: isLoadingDraft } = useQuery({
        queryKey: ['draft-invoice', patientId],
        queryFn: async () => {
            if (!patientId) return null;
            const res = await api.get(`/billing/draft/${patientId}`);
            return res.data;
        },
        enabled: !!patientId,
        staleTime: 0
    });

    const checkoutMutation = useMutation({
        mutationFn: async (data: { patient_id: string; items: InvoiceItem[]; advance_paid: number }) => await api.post('/billing/checkout', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['draft-invoice'] });
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card w-full max-w-4xl rounded-2xl shadow-2xl border border-border flex flex-col max-h-[90vh] overflow-hidden font-fira-sans animate-in zoom-in-95 duration-300">
                <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg font-black tracking-tighter text-foreground uppercase">Create New Invoice</h2>
                        <p className="text-[8px] text-primary font-black uppercase tracking-widest mt-0.5 font-fira-code">Create a new bill for a patient</p>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-all text-xs border border-border shadow-sm active:scale-95 cursor-pointer text-muted-foreground hover:text-foreground">×</button>
                </div>

                <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 bg-muted/5">
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <label className="block text-[8px] font-black text-primary uppercase tracking-widest mb-1.5 ml-1 font-fira-code">Select Patient</label>
                            <select
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                                className="w-full px-3 py-2 bg-card border border-border rounded-lg text-[10px] uppercase font-black tracking-widest transition-all focus:ring-2 focus:ring-primary/10 outline-none h-[38px] font-fira-code text-foreground"
                            >
                                <option value="" className="bg-card">CHOOSE PATIENT...</option>
                                {patients?.map((p: Patient) => (
                                    <option key={p.id} value={p.id} className="bg-card">{p.first_name} {p.last_name} ({p.mrn})</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground font-fira-code">Invoice Items</p>
                                <button onClick={addItem} className="text-[8px] text-primary font-black uppercase tracking-widest flex items-center gap-1.5 hover:underline font-fira-code">
                                    <Plus className="h-3 w-3" /> Add Item
                                </button>
                            </div>

                            {isLoadingDraft && <p className="text-xs text-muted-foreground animate-pulse">Calculating stay costs...</p>}

                            <div className="space-y-1.5">
                                {allItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 items-start p-2 bg-card rounded-lg border border-border hover:border-primary/20 transition-colors">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                className="w-full bg-transparent text-[11px] font-black uppercase tracking-tighter text-foreground focus:outline-none"
                                                placeholder="ITEM DESCRIPTION"
                                                value={item.description}
                                                onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                                disabled={idx < (draftData?.items?.length || 0)}
                                            />
                                        </div>
                                        <div className="w-16">
                                            <input
                                                type="number"
                                                className="w-full bg-transparent text-[11px] text-center focus:outline-none font-black text-primary tabular-nums"
                                                placeholder="Qty"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="w-24">
                                            <input
                                                type="number"
                                                className="w-full bg-transparent text-[11px] text-right focus:outline-none font-black tabular-nums text-foreground"
                                                placeholder="Price"
                                                value={item.unit_price}
                                                onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value))}
                                                disabled={idx < (draftData?.items?.length || 0)}
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeItem(idx)}
                                            className="text-rose-500 p-1 hover:bg-rose-500/10 rounded transition-colors"
                                            disabled={idx < (draftData?.items?.length || 0)}
                                        >
                                            <LogOut className="h-3 w-3 rotate-180" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-primary/10 pb-2 font-fira-code">Summary</h3>
                        <div className="space-y-2 text-[10px] font-black uppercase tracking-widest font-fira-code">
                            <div className="flex justify-between text-foreground">
                                <span>Subtotal</span>
                                <span className="tabular-nums">{format(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Insurance</span>
                                <span className="tabular-nums">-{format(0)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground/60">
                                <span>Advance Paid</span>
                                <span className="tabular-nums">-{format(draftData?.total_advance || 0)}</span>
                            </div>
                            <div className="border-t border-primary/10 pt-3 flex justify-between font-black text-base text-foreground">
                                <span className="text-[8px] tracking-[0.2em] self-center">TOTAL DUE</span>
                                <span className="text-primary tabular-nums">{format(subtotal - (draftData?.total_advance || 0))}</span>
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
                                className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-black shadow-lg shadow-black/10 hover:opacity-95 transition-all disabled:opacity-50 text-[10px] uppercase tracking-widest font-fira-code active:scale-95"
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

function InvoiceDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const queryClient = useQueryClient();
    const { format } = useCurrency();

    const { data: invoice, isLoading, refetch } = useQuery({
        queryKey: ['invoice', id],
        queryFn: async () => (await api.get(`/billing/invoices/${id}`)).data as Invoice,
        staleTime: 0
    });

    if (isLoading) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] font-fira-sans">
                <div className="px-5 py-3.5 bg-muted/30 border-b border-border flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                            <FileText className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-base font-black tracking-tighter uppercase text-foreground leading-none">Invoice Detail</h2>
                            <p className="text-[7.5px] text-primary font-black tracking-widest uppercase mt-1 font-fira-code">Patient Billing Statement</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-all text-xs border border-border shadow-sm active:scale-95 cursor-pointer text-muted-foreground hover:text-foreground">×</button>
                </div>

                <div className="p-5 space-y-5 overflow-y-auto bg-muted/5">
                    <div className="flex flex-col md:flex-row justify-between gap-5">
                        <div>
                            <div className="flex items-center gap-2.5 mb-1">
                                <h3 className="text-lg font-black tracking-tighter text-foreground tabular-nums">{invoice.invoice_number}</h3>
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-widest border font-fira-code",
                                    invoice.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                )}>
                                    {invoice.status}
                                </span>
                            </div>
                            <p className="text-[9px] font-bold text-muted-foreground flex items-center gap-1.5 font-fira-code">
                                <Calendar className="h-3 w-3" />
                                {formatDate(new Date(invoice.created_at), 'MMMM dd, yyyy • HH:mm')}
                            </p>
                        </div>
                        <div className="text-left md:text-right">
                            <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1 shadow-sm bg-primary/10 inline-block px-2 py-0.5 rounded border border-primary/20 font-fira-code">Issued By</p>
                            <p className="font-black text-base leading-tight text-foreground">MedOrbit CORE CENTER</p>
                            <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-tight font-fira-code">Emergency & General Ward</p>
                        </div>
                    </div>

                    <div className="bg-card p-5 rounded-2xl border border-border grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-3 ml-1 font-fira-code">Billed To (Patient)</p>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center font-black text-primary text-[10px] shadow-sm uppercase tracking-tighter">
                                    {invoice.patient.first_name[0]}{invoice.patient.last_name[0]}
                                </div>
                                <div>
                                    <p className="font-black text-[13px] leading-none mb-1 text-foreground uppercase tracking-tighter">{invoice.patient.first_name} {invoice.patient.last_name}</p>
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest font-fira-code">{invoice.patient.mrn}</p>
                                </div>
                            </div>
                        </div>
                        <div className="md:text-right flex flex-col items-start md:items-end">
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1.5 font-fira-code">Payment Details</p>
                            <p className="font-black text-[10px] text-foreground uppercase tracking-widest">Medical Services</p>
                            <p className="text-[8px] font-black text-primary uppercase tracking-widest font-fira-code">Payment Method</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="pb-2 text-left text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] font-fira-code">Item Description</th>
                                    <th className="pb-2 text-center text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] font-fira-code">Qty</th>
                                    <th className="pb-2 text-right text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] font-fira-code">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {invoice?.items.map((item: InvoiceItem) => (
                                    <tr key={item.id} className="group transition-colors">
                                        <td className="py-2.5 text-[10px] font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">{item.description}</td>
                                        <td className="py-2.5 text-center text-[10px] font-black text-muted-foreground font-fira-code">{item.quantity}</td>
                                        <td className="py-2.5 text-right text-[10px] font-black text-foreground tabular-nums font-fira-code">{format(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pt-4 border-t border-border flex flex-col md:flex-row justify-between items-start md:items-end gap-5 shrink-0">
                        {/* Left: Action Buttons */}
                        <div className="flex gap-2.5 print:hidden">
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                disabled={invoice.status === 'PAID'}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl font-black shadow-lg transition-all active:scale-95 flex items-center gap-2 text-[9px] uppercase tracking-widest font-fira-code",
                                    invoice.status === 'PAID'
                                        ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                                        : "bg-primary text-primary-foreground shadow-black/10 hover:opacity-95"
                                )}
                            >
                                <CreditCard className="h-3.5 w-3.5" />
                                {invoice.status === 'PAID' ? 'FULLY PAID' : 'PAY NOW'}
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="px-5 py-2.5 border border-border rounded-xl hover:bg-muted transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2 bg-card text-muted-foreground font-fira-code active:scale-95 cursor-pointer shadow-sm"
                            >
                                <Download className="h-3.5 w-3.5 text-primary" />
                                PRINT
                            </button>
                        </div>

                        {/* Right: Financial Summary */}
                        <div className="w-full md:w-56 space-y-1.5 bg-muted/50 p-4 rounded-xl border border-border">
                            <div className="flex justify-between items-center text-[8px] font-black text-muted-foreground uppercase tracking-widest font-fira-code">
                                <span>Subtotal</span>
                                <span className="text-foreground tabular-nums">{format(invoice.subtotal)}</span>
                            </div>
                            {Number(invoice.advance_paid) > 0 && (
                                <div className="flex justify-between items-center text-[8px] font-black text-primary uppercase tracking-widest font-fira-code">
                                    <span>Advance</span>
                                    <span className="tabular-nums">-{format(invoice.advance_paid)}</span>
                                </div>
                            )}
                            {Number(invoice.paid_amount) > 0 && (
                                <div className="flex justify-between items-center text-[8px] font-black text-primary uppercase tracking-widest font-fira-code">
                                    <span>Settled</span>
                                    <span className="tabular-nums">-{format(invoice.paid_amount)}</span>
                                </div>
                            )}
                            <div className="pt-2.5 mt-2 border-t border-border flex justify-between items-baseline">
                                <span className="text-[7.5px] font-black uppercase text-primary tracking-[0.2em] font-fira-code">BALANCE DUE</span>
                                <span className="text-xl font-black text-primary tracking-tighter tabular-nums">{format(invoice.balance_due)}</span>
                            </div>

                            <Portal>
                                <PrintableInvoice invoice={invoice} />
                            </Portal>
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
            </div>
        </div>
    );
}

function PaymentModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
    const queryClient = useQueryClient();
    const { register, handleSubmit } = useForm({
        defaultValues: {
            amount: Number(invoice.balance_due),
            method: 'CASH',
            notes: ''
        }
    });

    const { format, currency } = useCurrency();

    const paymentMutation = useMutation({
        mutationFn: (data: { amount: number; method: string; notes: string }) => api.post(`/billing/invoices/${invoice.id}/payments`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['draft-invoice'] });
            onClose();
        }
    });

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-[60] p-4">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200 font-fira-sans">
                <div className="p-5 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-base font-black tracking-tighter uppercase text-foreground leading-none">Record Payment</h2>
                        <p className="text-[7.5px] text-primary font-black tracking-widest uppercase mt-1 font-fira-code">Record payment reception</p>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-all text-xs border border-border shadow-sm active:scale-95 cursor-pointer text-muted-foreground hover:text-foreground">×</button>
                </div>
                <form onSubmit={handleSubmit((data) => paymentMutation.mutate({ ...data, amount: Number(data.amount) }))} className="p-6 lg:p-7 space-y-5 bg-muted/5">
                    <div>
                        <label className="block text-[8px] font-black uppercase tracking-widest text-primary mb-2 ml-1 font-fira-code">Amount to Pay ({currency})</label>
                        <input
                            type="number"
                            step="0.01"
                            {...register('amount', { required: true })}
                            className="w-full px-5 py-3.5 bg-card border border-border rounded-xl text-xl font-black text-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-fira-sans shadow-sm text-foreground"
                        />
                        <p className="text-[8px] text-muted-foreground mt-2 font-black uppercase tracking-widest font-fira-code ml-1">Remaining: {format(invoice.balance_due)}</p>
                    </div>

                    <div>
                        <label className="block text-[8px] font-black uppercase tracking-widest text-primary mb-2 ml-1 font-fira-code">Payment Method</label>
                        <select {...register('method')} className="w-full px-4 py-3 bg-card border border-border rounded-xl text-[10px] font-black uppercase tracking-widest font-fira-code h-[42px] appearance-none outline-none focus:ring-4 focus:ring-primary/10 transition-all font-fira-code text-foreground">
                            <option value="CASH" className="bg-card">CASH</option>
                            <option value="CARD" className="bg-card">CARD</option>
                            <option value="BANK_TRANSFER" className="bg-card">BANK TRANSFER</option>
                            <option value="ONLINE" className="bg-card">ONLINE PAYMENT</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1 font-fira-code">Payment Notes</label>
                        <textarea {...register('notes')} className="w-full px-4 py-3 bg-card border border-border rounded-xl text-[10px] font-black uppercase tracking-widest font-fira-code outline-none focus:ring-4 focus:ring-primary/10 transition-all text-foreground" rows={2} placeholder="TXN REF, SUBJECT NOTES..." />
                    </div>

                    <div className="flex gap-3 pt-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-border text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all font-fira-code active:scale-95 cursor-pointer">Abandon</button>
                        <button type="submit" disabled={paymentMutation.isPending} className="flex-[2] py-3 bg-primary text-primary-foreground rounded-xl font-black shadow-xl shadow-black/10 hover:opacity-95 transition-all active:scale-95 disabled:opacity-50 text-[9px] uppercase tracking-widest font-fira-code">
                            {paymentMutation.isPending ? 'PROCESSING...' : 'CONFIRM PAYMENT'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function PrintableInvoice({ invoice }: { invoice: Invoice }) {
    const { format } = useCurrency();

    return (
        <div id="printable-invoice" className="hidden print:block bg-white text-slate-900 font-sans p-8 w-full max-w-[210mm] mx-auto">
            {/* Letterhead */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                <div className="flex-1">
                    <h1 className="text-2xl font-black tracking-tighter text-slate-900 mb-1 leading-none uppercase">MedOrbit CORE CENTER</h1>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Healthcare Excellence & Research</p>
                    <div className="mt-6 text-[9px] text-slate-600 space-y-1 font-bold uppercase tracking-tight">
                        <p>123 Medical Avenue, Health City</p>
                        <p>Phone: +1 (555) 000-1111 | Email: billing@hmscore.com</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-4xl font-black text-slate-200 tracking-tighter mb-6 leading-none uppercase">Invoice</h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Invoice Number</p>
                            <p className="text-xs font-black text-slate-900">{invoice.invoice_number}</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Date Issued</p>
                            <p className="text-[9px] font-black text-slate-900">{formatDate(new Date(invoice.created_at), 'MMMM dd, yyyy')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bill To & Summary */}
            <div className="grid grid-cols-2 gap-12 mb-12">
                <div className="bg-slate-50 p-7 rounded-2xl border border-slate-100">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Patient Statement For</h3>
                    <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">{invoice.patient.first_name} {invoice.patient.last_name}</p>
                    <div className="flex items-center gap-6 text-[10px]">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-400 uppercase tracking-widest">Patient MRN:</span>
                            <span className="font-black text-slate-900">{invoice.patient.mrn}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col justify-center px-4">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Financial Status</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Status</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${invoice.status === 'PAID' ? 'text-emerald-600' : 'text-rose-600'}`}>{invoice.status}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Issuing Authority</span>
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Accounts Dept.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Itemized Table */}
            <div className="mb-6">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-900 text-white">
                            <th className="py-3 px-4 text-left text-[9px] font-black uppercase tracking-widest border border-slate-900">Service Description</th>
                            <th className="py-3 px-4 text-center text-[9px] font-black uppercase tracking-widest border border-slate-900 w-20">Qty</th>
                            <th className="py-3 px-4 text-right text-[9px] font-black uppercase tracking-widest border border-slate-900 w-28">Unit Price</th>
                            <th className="py-3 px-4 text-right text-[9px] font-black uppercase tracking-widest border border-slate-900 w-28">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 border-b-2 border-slate-900">
                        {invoice.items.map((item: InvoiceItem) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                                <td className="py-2 px-4 text-[10px] text-slate-700 uppercase tracking-tight border-x border-slate-50">{item.description}</td>
                                <td className="py-2 px-4 text-center text-[10px] text-slate-900 border-x border-slate-50">{item.quantity}</td>
                                <td className="py-2 px-4 text-right text-[10px] text-slate-900 border-x border-slate-50">{format(item.unit_price)}</td>
                                <td className="py-2 px-4 text-right text-[10px] text-slate-900 border-x border-slate-50">{format(item.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-between items-start mb-10 px-2">
                <div className="max-w-[120px]">
                    <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Terms & Notes</h4>
                    <p className="text-[7px] text-slate-400 leading-relaxed uppercase font-bold">Standard hospital billing terms apply. Claims must be settled as per policy. This is an electronic record.</p>
                </div>
                <div className="w-72 space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center text-[9px]">
                        <span className="font-bold text-slate-400 uppercase tracking-widest">Gross Subtotal</span>
                        <span className="font-black text-slate-900">{format(invoice.subtotal)}</span>
                    </div>
                    {Number(invoice.discount) > 0 && (
                        <div className="flex justify-between items-center text-[9px] text-rose-600 font-bold">
                            <span className="uppercase tracking-widest">Discount Applied</span>
                            <span>-{format(invoice.discount)}</span>
                        </div>
                    )}
                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] font-black">
                        <span className="uppercase tracking-widest text-slate-900">Total Invoice Amount</span>
                        <span className="text-slate-900">{format(invoice.total)}</span>
                    </div>
                    {(Number(invoice.advance_paid) > 0 || Number(invoice.paid_amount) > 0) && (
                        <div className="flex justify-between items-center text-[10px] text-emerald-600 font-bold">
                            <span className="uppercase tracking-widest">Total Paid Amount</span>
                            <span>-{format(Number(invoice.advance_paid) + Number(invoice.paid_amount))}</span>
                        </div>
                    )}
                    <div className="pt-4 mt-2 border-t-2 border-slate-900 flex justify-between items-baseline">
                        <span className="text-[12px] font-black uppercase text-slate-900 tracking-[0.2em] leading-none">Remaining Balance</span>
                        <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none whitespace-nowrap">{format(invoice.balance_due)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 pt-10 text-center">
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] mb-4">Official Hospital Document</p>
                <div className="flex justify-center gap-12 mb-10 opacity-50">
                    <div className="w-32 border-b border-slate-900/20 pt-10">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Cashier Sign</p>
                    </div>
                    <div className="w-32 border-b border-slate-900/20 pt-10">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Hospital Seal</p>
                    </div>
                </div>
                <p className="text-[8px] text-slate-400 font-bold max-w-lg mx-auto leading-relaxed uppercase tracking-tight">
                    Thank you for choosing MedOrbit CORE CENTER. This is a computer-generated billing statement. For any discrepancies, please reach out to our help desk within 7 working days.
                </p>
            </div>
        </div>
    );
}
