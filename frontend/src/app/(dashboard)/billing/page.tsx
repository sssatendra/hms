'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FileText, Plus, Search, Filter, X, Calendar,
    Download, Eye, CreditCard, CheckCircle, AlertCircle, Clock, User, LogOut
} from 'lucide-react';
import { coreApi as api } from '@/lib/api';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { Portal } from '@/components/shared/portal';

export default function BillingPage() {
    const [search, setSearch] = useState('');
    const [showNewInvoice, setShowNewInvoice] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const queryClient = useQueryClient();

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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Billing & Invoices</h1>
                    <p className="text-muted-foreground">Manage patient billing, insurance claims, and payments.</p>
                </div>
                <button
                    onClick={() => setShowNewInvoice(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                    <Plus className="h-4 w-4" />
                    Create Invoice
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Revenue</p>
                    <p className="text-xl font-bold mt-1">$42,500.00</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Outstanding</p>
                    <p className="text-xl font-bold mt-1 text-red-500">$12,340.00</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Paid Today</p>
                    <p className="text-xl font-bold mt-1 text-green-500">$3,200.00</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Pending Claims</p>
                    <p className="text-xl font-bold mt-1">$5,800.00</p>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search invoice #, patient name or MRN..."
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="p-2 border border-border rounded-lg hover:bg-muted text-muted-foreground">
                        <Filter className="h-4 w-4" />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                <th className="px-6 py-3">Invoice #</th>
                                <th className="px-6 py-3">Patient</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Total</th>
                                <th className="px-6 py-3">Paid</th>
                                <th className="px-6 py-3">Balance</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {invoices?.filter((inv: any) =>
                                inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
                                inv.patient.first_name.toLowerCase().includes(search.toLowerCase()) ||
                                inv.patient.last_name.toLowerCase().includes(search.toLowerCase())
                            ).map((invoice: any) => (
                                <tr key={invoice.id} className="hover:bg-muted/30 transition-colors text-sm">
                                    <td className="px-6 py-4 font-mono font-bold text-primary">{invoice.invoice_number}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{invoice.patient.first_name} {invoice.patient.last_name}</span>
                                            <span className="text-xs text-muted-foreground">{invoice.patient.mrn}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">{format(new Date(invoice.created_at), 'MMM dd, yyyy')}</td>
                                    <td className="px-6 py-4 font-medium">${Number(invoice.total).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-green-600">${Number(invoice.paid_amount).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-red-500 font-bold">${Number(invoice.balance_due).toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(invoice.status)}`}>
                                            {invoice.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setSelectedInvoice(invoice.id)}
                                                className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                                                title="View Detail"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedInvoice(invoice.id);
                                                    setTimeout(() => window.print(), 500);
                                                }}
                                                className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                                                title="Print Invoice"
                                            >
                                                <Download className="h-4 w-4" />
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
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const allItems = [...(draftData?.items || []), ...items];
    const subtotal = allItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card w-full max-w-4xl rounded-xl shadow-xl border border-border flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h2 className="text-lg font-bold">Create New Invoice</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">×</button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Select Patient</label>
                            <select
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                            >
                                <option value="">Choose a patient...</option>
                                {patients?.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.mrn})</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Invoice Items</p>
                                <button onClick={addItem} className="text-xs text-primary font-bold flex items-center gap-1 hover:underline">
                                    <Plus className="h-3 w-3" /> Add Item
                                </button>
                            </div>

                            {isLoadingDraft && <p className="text-xs text-muted-foreground animate-pulse">Calculating stay costs...</p>}

                            <div className="space-y-2">
                                {allItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 items-start p-2 bg-muted/30 rounded-lg border border-border">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                className="w-full bg-transparent text-sm focus:outline-none"
                                                placeholder="Item description"
                                                value={item.description}
                                                onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                                disabled={idx < (draftData?.items?.length || 0)}
                                            />
                                        </div>
                                        <div className="w-16">
                                            <input
                                                type="number"
                                                className="w-full bg-transparent text-sm text-center focus:outline-none font-black text-primary"
                                                placeholder="Qty"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="w-24">
                                            <input
                                                type="number"
                                                className="w-full bg-transparent text-sm text-right focus:outline-none"
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

                    <div className="bg-muted/50 p-6 rounded-xl border border-border space-y-4">
                        <h3 className="font-bold border-b border-border pb-2">Summary</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Insurance Coverage</span>
                                <span>-$0.00</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Advance Paid</span>
                                <span>-${Number(draftData?.total_advance || 0).toFixed(2)}</span>
                            </div>
                            <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
                                <span>Grand Total</span>
                                <span className="text-primary">${(subtotal - (draftData?.total_advance || 0)).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={() => checkoutMutation.mutate({
                                    patient_id: patientId,
                                    items: allItems,
                                    advance_paid: draftData?.total_advance || 0
                                })}
                                disabled={!patientId || allItems.length === 0 || checkoutMutation.isPending}
                                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
                            >
                                {checkoutMutation.isPending ? 'Processing...' : 'Confirm & Generate'}
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

    const { data: invoice, isLoading, refetch } = useQuery({
        queryKey: ['invoice', id],
        queryFn: async () => (await api.get(`/billing/invoices/${id}`)).data
    });

    if (isLoading) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 bg-muted/20 border-b border-border flex justify-between items-center bg-gradient-to-r from-muted/50 to-transparent shrink-0">
                    <div className="flex items-center gap-3 text-primary">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-tight uppercase">Invoice Detail</h2>
                            <p className="text-[10px] text-muted-foreground font-black tracking-widest leading-none">OFFICIAL MEDICAL RECEIPT</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-all text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-xl font-black tracking-tighter">{invoice.invoice_number}</h3>
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                    invoice.status === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                                )}>
                                    {invoice.status}
                                </span>
                            </div>
                            <p className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(invoice.created_at), 'MMMM dd, yyyy • HH:mm')}
                            </p>
                        </div>
                        <div className="text-right md:text-right">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 shadow-sm bg-primary/5 inline-block px-2 py-1 rounded-lg">Hospital Authority</p>
                            <p className="font-black text-xl leading-tight">HMS CORE CENTER</p>
                            <p className="text-xs font-bold text-muted-foreground">Emergency & General Ward</p>
                        </div>
                    </div>

                    <div className="bg-muted/10 p-6 rounded-3xl border border-border/50 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Billed To (Patient)</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-xs">
                                    {invoice.patient.first_name[0]}{invoice.patient.last_name[0]}
                                </div>
                                <div>
                                    <p className="font-black text-lg leading-none mb-1">{invoice.patient.first_name} {invoice.patient.last_name}</p>
                                    <p className="text-xs font-mono text-muted-foreground">{invoice.patient.mrn}</p>
                                </div>
                            </div>
                        </div>
                        <div className="md:text-right flex flex-col items-start md:items-end">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Method & Reference</p>
                            <p className="font-bold text-xs">Direct Medical Bill</p>
                            <p className="text-[10px] text-muted-foreground">Cash/Online Payment</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="pb-2 text-left text-[9px] font-black text-muted-foreground uppercase tracking-widest">Description</th>
                                    <th className="pb-2 text-center text-[9px] font-black text-muted-foreground uppercase tracking-widest">Qty</th>
                                    <th className="pb-2 text-right text-[9px] font-black text-muted-foreground uppercase tracking-widest">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {invoice.items.map((item: any) => (
                                    <tr key={item.id} className="group transition-colors">
                                        <td className="py-2 text-xs font-bold text-foreground/80 group-hover:text-primary transition-colors">{item.description}</td>
                                        <td className="py-2 text-center text-[10px] font-black">{item.quantity}</td>
                                        <td className="py-2 text-right text-xs font-black text-foreground">${Number(item.total).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pt-6 border-t border-border flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0">
                        {/* Left: Action Buttons */}
                        <div className="flex gap-3 print:hidden">
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                disabled={invoice.status === 'PAID'}
                                className={cn(
                                    "px-6 py-2 rounded-xl font-black shadow-lg transition-all active:scale-95 flex items-center gap-2 text-xs",
                                    invoice.status === 'PAID'
                                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                                        : "bg-green-600 text-white shadow-green-200 hover:bg-green-700"
                                )}
                            >
                                <CreditCard className="h-3.5 w-3.5" />
                                {invoice.status === 'PAID' ? 'FULLY PAID' : 'PAY'}
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="px-5 py-2 border border-border rounded-xl hover:bg-muted transition-all text-[10px] font-bold flex items-center gap-2 bg-card shadow-sm"
                            >
                                <Download className="h-3.5 w-3.5 text-primary" />
                                PRINT
                            </button>
                        </div>

                        {/* Right: Financial Summary */}
                        <div className="w-full md:w-64 space-y-2 bg-muted/20 p-4 rounded-xl border border-border/50">
                            <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                <span>Subtotal</span>
                                <span className="text-foreground">${Number(invoice.subtotal).toFixed(2)}</span>
                            </div>
                            {Number(invoice.advance_paid) > 0 && (
                                <div className="flex justify-between items-center text-xs font-bold text-blue-600 uppercase tracking-widest">
                                    <span>Advance Paid</span>
                                    <span>-${Number(invoice.advance_paid).toFixed(2)}</span>
                                </div>
                            )}
                            {Number(invoice.paid_amount) > 0 && (
                                <div className="flex justify-between items-center text-xs font-bold text-green-600 uppercase tracking-widest">
                                    <span>Paid Amount</span>
                                    <span>-${Number(invoice.paid_amount).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="pt-3 mt-3 border-t border-border flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-primary tracking-tighter">BALANCE DUE</span>
                                <span className="text-2xl font-black text-primary">${Number(invoice.balance_due).toFixed(2)}</span>
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

    const paymentMutation = useMutation({
        mutationFn: (data: any) => api.post(`/billing/invoices/${invoice.id}/payments`, data),
        onSuccess: () => onClose()
    });

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in duration-200">
                <div className="p-6 border-b border-border bg-muted/30">
                    <h2 className="text-xl font-bold">Record Payment</h2>
                    <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mt-1">Invoice {invoice.invoice_number}</p>
                </div>
                <form onSubmit={handleSubmit((data) => paymentMutation.mutate({ ...data, amount: Number(data.amount) }))} className="p-8 space-y-6">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Amount to Pay ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            {...register('amount', { required: true })}
                            className="w-full px-5 py-3 bg-background border border-border rounded-xl text-xl font-black text-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        />
                        <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-tighter">Remaining: ${Number(invoice.balance_due).toFixed(2)}</p>
                    </div>

                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Payment Method</label>
                        <select {...register('method')} className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm font-bold">
                            <option value="CASH">Cash</option>
                            <option value="CARD">Debit/Credit Card</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                            <option value="ONLINE">UPI / Online</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Notes (Optional)</label>
                        <textarea {...register('notes')} className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm" rows={2} placeholder="Transaction ID, customer info, etc..." />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-border font-bold hover:bg-muted transition-all">Cancel</button>
                        <button type="submit" disabled={paymentMutation.isPending} className="flex-[2] py-3 bg-primary text-primary-foreground rounded-xl font-black shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50">
                            {paymentMutation.isPending ? 'Processing...' : 'Confirm Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
