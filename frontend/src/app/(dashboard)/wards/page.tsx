'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Building2, Plus, Users, Bed, User,
    ArrowRightLeft, LogOut, CheckCircle, AlertCircle, Clock,
    Activity, FileText, BadgeIndianRupee, Stethoscope, CreditCard,
    Search, Pill, Trash2, MoreVertical, Settings, ShieldAlert,
    Zap,
    TrendingUp,
    HeartPulse,
    Landmark,
    FileStack,
    Wallet,
    History,
    Scan
} from 'lucide-react';
import { coreApi as api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { format as formatDate } from 'date-fns';
import { cn } from '@/lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { PatientSearchSelect } from '@/components/shared/PatientSearchSelect';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { toast } from 'sonner';
import { Portal } from '@/components/shared/portal';
import { useCurrency } from '@/hooks/use-currency';

export default function WardsPage() {
    const [selectedWard, setSelectedWard] = useState<string | null>(null);
    const [showAdmitModal, setShowAdmitModal] = useState(false);
    const [showCreateWardModal, setShowCreateWardModal] = useState(false);
    const [showEditWardModal, setShowEditWardModal] = useState<any>(null);
    const [showTransferModal, setShowTransferModal] = useState<{ admissionId: string, currentBed: string } | null>(null);
    const [showAdmissionDetail, setShowAdmissionDetail] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ type: 'decommission' | 'discharge' | 'delete-charge', id: string, extra?: any } | null>(null);
    const queryClient = useQueryClient();
    const { format: currencyFormat } = useCurrency();

    const { data: wards, isLoading } = useQuery({
        queryKey: ['wards'],
        queryFn: async () => {
            const res = await api.get<any[]>('/wards');
            return res.data || [];
        }
    });

    const { data: activeAdmissions } = useQuery({
        queryKey: ['active-admissions'],
        queryFn: async () => {
            const res = await api.get<any[]>('/wards');
            const allBeds = res.data?.flatMap((w: any) => w.beds) || [];
            return allBeds.filter((b: any) => b.status === 'OCCUPIED');
        }
    });

    const { data: patients } = useQuery({
        queryKey: ['patients'],
        queryFn: async () => {
            const res = await api.get<any[]>('/patients');
            return res.data || [];
        }
    });

    const deleteWardMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/wards/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wards'] });
            toast.success("Ward deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete ward');
        }
    });

    const dischargeMutation = useMutation({
        mutationFn: async ({ id, notes }: { id: string, notes?: string }) => {
            await api.post(`/wards/admissions/${id}/discharge`, { notes });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wards'] });
            queryClient.invalidateQueries({ queryKey: ['active-admissions'] });
            toast.success("Patient discharged successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Discharge failed");
        }
    });

    const deleteChargeMutation = useMutation({
        mutationFn: async ({ admissionId, chargeId }: { admissionId: string, chargeId: string }) =>
            api.delete(`/wards/admissions/${admissionId}/charges/${chargeId}`),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admission', variables.admissionId] });
            toast.success("Charge deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete charge");
        }
    });

    if (isLoading) {
        return (
            <div className="p-20 text-center text-muted-foreground animate-pulse font-black tracking-widest uppercase">
                Loading Ward Data...
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-5 space-y-5 max-w-[1700px] mx-auto min-h-screen bg-muted/5 animate-in fade-in duration-700 font-fira-sans">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[5%] left-[10%] w-[45%] h-[45%] bg-primary/5 rounded-full blur-[140px] animate-pulse"></div>
                <div className="absolute bottom-[10%] right-[5%] w-[35%] h-[35%] bg-accent/5 rounded-full blur-[120px]"></div>
            </div>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2 text-foreground">
                <div>
                    <h1 className="text-xl lg:text-2xl font-black text-foreground tracking-tighter flex items-center gap-2.5">
                        <HeartPulse className="h-8 w-8 text-primary" />
                        Inpatient Services
                    </h1>
                    <p className="text-muted-foreground mt-1 font-black uppercase tracking-[0.2em] text-[8.5px] font-fira-code">Manage wards, beds, and patient admissions</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowCreateWardModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-card/50 backdrop-blur-md border border-border rounded-xl hover:bg-muted transition-all font-black text-[8.5px] uppercase tracking-widest text-muted-foreground shadow-md shadow-black/5 active:scale-95 cursor-pointer font-fira-code group"
                    >
                        <Building2 className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
                        New Ward
                    </button>
                    <button
                        onClick={() => setShowAdmitModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-95 transition-all font-black shadow-lg shadow-black/10 text-[9px] uppercase tracking-[0.2em] active:scale-95 cursor-pointer font-fira-code group"
                    >
                        <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                        Admit Patient
                    </button>
                </div>
            </div>

            {/* Ward Stations Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
                {wards?.map((ward: any) => {
                    const occupiedCount = ward.beds.filter((b: any) => b.status === 'OCCUPIED').length;
                    const occupancyRate = (occupiedCount / ward.beds.length) * 100 || 0;

                    return (
                        <div key={ward.id} className="group relative bg-card backdrop-blur-xl rounded-2xl border border-border shadow-lg shadow-black/5 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col min-h-[280px]">
                            {/* Medical Status Bar */}
                            <div className={cn(
                                "h-1 w-full",
                                occupancyRate > 90 ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" : occupancyRate > 70 ? "bg-amber-500" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            )} />

                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-2.5 text-foreground">
                                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                            <Building2 className="h-4.5 w-4.5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black tracking-tighter text-foreground mb-0.5 font-fira-sans uppercase">{ward.name}</h3>
                                            <div className="flex gap-1 items-center">
                                                <span className="px-1.5 py-0.5 bg-primary/10 text-[7px] font-black uppercase tracking-[0.1em] rounded-[4px] text-primary font-fira-code">{ward.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setShowEditWardModal(ward)}
                                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                        >
                                            <Settings className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setConfirmAction({ type: 'decommission', id: ward.id, extra: ward.name })}
                                            className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 rounded-xl transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Bed Occupancy Matrix */}
                                <div className="flex-1 bg-muted/30 rounded-2xl p-3 border border-border mb-3 group-hover:bg-card/80 transition-colors flex flex-col min-h-[140px]">
                                    <div className="flex items-center justify-between mb-2 px-1">
                                        <h4 className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] font-fira-code">Beds</h4>
                                        <span className="text-[8px] font-bold text-primary/50 uppercase tracking-widest font-fira-code">{ward.beds.length} Total</span>
                                    </div>
                                    <div className="grid grid-cols-[repeat(auto-fill,minmax(50px,1fr))] gap-1.5 overflow-y-auto pr-1 custom-scrollbar max-h-[150px] content-start">
                                        {ward.beds.map((bed: any) => (
                                            <div
                                                key={bed.id}
                                                onClick={() => {
                                                    if (bed.status === 'OCCUPIED' && bed.admissions?.[0]) {
                                                        setShowAdmissionDetail(bed.admissions[0].id);
                                                    }
                                                }}
                                                className={cn(
                                                    "relative group/bed h-10 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden active:scale-95",
                                                    bed.status === 'AVAILABLE'
                                                        ? "bg-card border-border hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
                                                        : bed.status === 'OCCUPIED'
                                                            ? "bg-rose-500/10 border-rose-500/20 text-rose-500 shadow-sm"
                                                            : "bg-muted border-border text-muted-foreground opacity-60"
                                                )}
                                            >
                                                <span className="text-[9px] font-black tracking-tighter leading-none mb-0.5">{bed.bed_number}</span>
                                                {bed.status === 'OCCUPIED' && bed.admissions?.[0] ? (
                                                    <div className="relative">
                                                        <Activity className="h-2.5 w-2.5 text-rose-500 animate-pulse" />
                                                        <div className="absolute inset-0 bg-rose-400 blur-sm opacity-30 animate-pulse rounded-full" />
                                                    </div>
                                                ) : bed.status === 'AVAILABLE' ? (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                                                ) : (
                                                    <Settings className="h-2 w-2" />
                                                )}

                                                {/* Selection Indicator on Hover */}
                                                <div className="absolute inset-0 bg-primary opacity-0 group-hover/bed:opacity-[0.03] transition-opacity pointer-events-none" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-muted-foreground leading-none uppercase tracking-[0.1em] mb-1.5 font-fira-code">{occupiedCount} / {ward.beds.length} BEDS OCCUPIED</span>
                                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden border border-border">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-1000",
                                                    occupancyRate > 90 ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" : "bg-primary"
                                                )}
                                                style={{ width: `${occupancyRate}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-base font-black text-foreground leading-none mb-0.5">
                                            {currencyFormat(ward.daily_rate)}
                                            <span className="text-[8px] text-muted-foreground ml-1 font-black uppercase tracking-widest font-fira-code">/ Day</span>
                                        </p>
                                        <span className={cn(
                                            "text-[8px] font-black uppercase tracking-widest font-fira-code",
                                            occupancyRate > 90 ? "text-rose-500" : "text-emerald-500"
                                        )}>{occupancyRate.toFixed(0)}% OCCUPIED</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Decorative Footer */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    );
                })}
            </div>

            {showCreateWardModal && (
                <Portal>
                    <CreateWardModal onClose={() => setShowCreateWardModal(false)} />
                </Portal>
            )}

            {showEditWardModal && (
                <Portal>
                    <EditWardModal ward={showEditWardModal} onClose={() => setShowEditWardModal(null)} />
                </Portal>
            )}

            {showAdmitModal && (
                <Portal>
                    <AdmitModal
                        onClose={() => setShowAdmitModal(false)}
                        patients={patients}
                        wards={wards}
                    />
                </Portal>
            )}

            {showAdmissionDetail && (
                <Portal>
                    <AdmissionDetailModal
                        id={showAdmissionDetail}
                        onClose={() => setShowAdmissionDetail(null)}
                        onTransfer={(admissionId, currentBed) => setShowTransferModal({ admissionId, currentBed })}
                        onConfirmAction={(type, id, extra) => setConfirmAction({ type, id, extra })}
                    />
                </Portal>
            )}

            {showTransferModal && (
                <Portal>
                    <TransferModal
                        admissionId={showTransferModal.admissionId}
                        currentBed={showTransferModal.currentBed}
                        onClose={() => setShowTransferModal(null)}
                    />
                </Portal>
            )}

            <ConfirmDialog
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={() => {
                    if (confirmAction?.type === 'decommission') {
                        deleteWardMutation.mutate(confirmAction.id);
                    } else if (confirmAction?.type === 'discharge') {
                        dischargeMutation.mutate({ id: confirmAction.id, notes: 'Standard discharge process followed.' });
                    } else if (confirmAction?.type === 'delete-charge') {
                        deleteChargeMutation.mutate({ admissionId: showAdmissionDetail!, chargeId: confirmAction.id });
                    }
                    setConfirmAction(null);
                }}
                title={confirmAction?.type === 'decommission' ? 'Delete Ward' : confirmAction?.type === 'discharge' ? 'Confirm Discharge' : 'Remove Charge'}
                description={confirmAction?.type === 'decommission'
                    ? `Are you sure you want to delete ${confirmAction?.extra}? All beds in this ward will be removed.`
                    : confirmAction?.type === 'discharge'
                        ? 'Are you sure you want to discharge this patient? This will make the bed available.'
                        : `Are you sure you want to remove the charge for "${confirmAction?.extra}"?`}
                confirmText={confirmAction?.type === 'decommission' ? 'Delete Ward' : confirmAction?.type === 'discharge' ? 'Discharge Patient' : 'Remove Charge'}
                isLoading={deleteWardMutation.isPending || dischargeMutation.isPending || deleteChargeMutation.isPending}
            />
        </div>
    );
}



function AdmitModal({ onClose, patients, wards }: any) {
    const { register, handleSubmit, control } = useForm();
    const queryClient = useQueryClient();
    const [selectedWardId, setSelectedWardId] = useState('');
    const { format: currencyFormat } = useCurrency();

    const admitMutation = useMutation({
        mutationFn: async (data: any) => {
            await api.post('/wards/admissions', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wards'] });
            toast.success("Patient admitted successfully");
            onClose();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Admission failed");
        }
    });

    const selectedWard = wards?.find((w: any) => w.id === selectedWardId);
    const availableBeds = selectedWard?.beds.filter((b: any) => b.status === 'AVAILABLE') || [];

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-border animate-in zoom-in-95 duration-300 relative">
                {/* Decorative Overlay */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                <div className="p-5 border-b border-border bg-muted/30 flex justify-between items-center font-fira-sans">
                    <div>
                        <h2 className="text-lg font-black tracking-tighter text-foreground uppercase">Admit Patient</h2>
                        <p className="text-[8px] text-primary font-black uppercase tracking-widest mt-0.5 font-fira-code">Select a ward and bed for the patient</p>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-all text-xs border border-border shadow-sm active:scale-95 cursor-pointer text-foreground">×</button>
                </div>
                <form onSubmit={handleSubmit((data) => admitMutation.mutate(data))} className="p-6 space-y-5 font-fira-sans">
                    <div className="space-y-4">
                        <div className="relative">
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-2 ml-1">Select Patient</label>
                            <Controller
                                control={control}
                                name="patient_id"
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <PatientSearchSelect
                                        onSelect={field.onChange}
                                    />
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-2 ml-1">Select Ward</label>
                                <select
                                    value={selectedWardId}
                                    onChange={(e) => setSelectedWardId(e.target.value)}
                                    className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none text-foreground dark:bg-slate-950"
                                    required
                                >
                                    <option value="" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Select Ward...</option>
                                    {wards?.map((w: any) => (
                                        <option key={w.id} value={w.id} className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">{w.name} ({currencyFormat(w.daily_rate)})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-2 ml-1">Select Bed</label>
                                <select
                                    {...register('bed_id')}
                                    className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none text-foreground dark:bg-slate-950"
                                    required
                                    disabled={!selectedWardId}
                                >
                                    <option value="" className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">Select Bed...</option>
                                    {availableBeds.map((b: any) => (
                                        <option key={b.id} value={b.id} className="bg-card dark:bg-slate-900 text-foreground dark:text-slate-100">{b.bed_number} • {b.bed_type}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-2 ml-1">Diagnosis</label>
                            <div className="relative group">
                                <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    {...register('diagnosis_on_admission')}
                                    className="w-full h-12 pl-12 pr-4 bg-muted/20 border border-border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                    placeholder="Enter diagnosis or reason for admission..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-2 ml-1">Advance Payment</label>
                            <div className="relative group">
                                <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="number"
                                    {...register('advance_paid', { valueAsNumber: true })}
                                    className="w-full h-12 pl-12 pr-4 bg-muted/20 border border-border rounded-2xl text-sm font-mono font-black focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                    defaultValue={0}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-12 border border-border rounded-xl hover:bg-muted transition-all text-[10px] font-black uppercase tracking-widest active:scale-95 font-fira-code text-muted-foreground"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={admitMutation.isPending}
                            className="flex-1 h-12 bg-primary text-primary-foreground rounded-xl hover:opacity-95 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95 font-fira-code"
                        >
                            {admitMutation.isPending ? 'SAVING...' : 'ADMIT PATIENT'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AdmissionDetailModal({ id, onClose, onTransfer, onConfirmAction }: { id: string, onClose: () => void, onTransfer: (id: string, bed: string) => void, onConfirmAction: (type: any, id: string, extra?: any) => void }) {
    const [activeTab, setActiveTab] = useState<'vitals' | 'notes' | 'charges' | 'payments'>('vitals');
    const [medSearch, setMedSearch] = useState('');
    const [vitalsDate, setVitalsDate] = useState(new Date().toISOString());
    const queryClient = useQueryClient();
    const { format: currencyFormat } = useCurrency();

    const { data: admission, isLoading } = useQuery({
        queryKey: ['admission', id],
        queryFn: async () => {
            const res = await api.get<any>(`/wards/admissions/${id}`);
            return res.data;
        }
    });

    const addVitalsMutation = useMutation({
        mutationFn: async (data: any) => api.post(`/wards/admissions/${id}/vitals`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admission', id] });
            toast.success("Vitals recorded successfully");
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save vitals')
    });

    const editChargeMutation = useMutation({
        mutationFn: async ({ chargeId, data }: { chargeId: string, data: any }) => api.patch(`/wards/admissions/${id}/charges/${chargeId}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admission', id] });
            toast.success("Charge updated successfully");
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update charge')
    });

    const dischargeMutation = useMutation({
        mutationFn: async (notes: string) => api.post(`/wards/admissions/${id}/discharge`, { notes }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wards'] });
            toast.success("Patient discharged successfully");
            onClose();
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Discharge failed')
    });

    const { data: medicines } = useQuery({
        queryKey: ['med-search', medSearch],
        queryFn: async () => {
            if (medSearch.length < 2) return [];
            const res = await api.get<any[]>(`/pharmacy/inventory?search=${medSearch}`);
            return res.data || [];
        },
        enabled: medSearch.length >= 2
    });

    const addChargeMutation = useMutation({
        mutationFn: async (data: any) => api.post(`/wards/admissions/${id}/charges`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admission', id] });
            toast.success("Charge added successfully");
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add charge')
    });

    const approveChargeMutation = useMutation({
        mutationFn: async (chargeId: string) => api.post(`/wards/admissions/${id}/charges/${chargeId}/approve`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admission', id] });
            toast.success("Charge approved");
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Approval failed')
    });

    const addNoteMutation = useMutation({
        mutationFn: async (data: any) => api.post(`/wards/admissions/${id}/notes`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admission', id] });
            toast.success("Clinical note added");
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add note')
    });

    if (isLoading || !admission) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 font-sans text-foreground overflow-hidden animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-6xl rounded-[24px] shadow-2xl overflow-hidden border border-border flex flex-col my-auto animate-in zoom-in-95 duration-300 max-h-[95vh] relative">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

                <div className="p-5 px-8 border-b border-border bg-muted/20 flex justify-between items-center shrink-0 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                            <Activity className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 mb-0.5">
                                <h1 className="text-xl font-black tracking-tighter text-foreground uppercase font-fira-sans leading-none">{admission.patient.first_name} {admission.patient.last_name}</h1>
                                <span className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[8px] font-black uppercase rounded-full tracking-widest font-fira-code">{admission.patient.mrn}</span>
                            </div>
                            <p className="text-[8px] text-muted-foreground font-black uppercase tracking-[0.15em] flex items-center gap-1.5 font-fira-code">
                                <Building2 size={10} className="text-primary" />
                                <span>{admission.bed.ward.name}</span>
                                <span className="opacity-30">•</span>
                                <span>Bed {admission.bed.bed_number}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xl font-black text-foreground tracking-tighter leading-none mb-0.5">{currencyFormat(admission.running_total)}</p>
                            <p className="text-[7.5px] text-muted-foreground uppercase font-black tracking-[0.2em] font-fira-code">Total Charges</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onTransfer(admission.id, admission.bed.bed_number)}
                                className="h-8 px-3 bg-card border border-border text-muted-foreground text-[8px] font-black uppercase rounded-lg hover:bg-muted transition-all shadow-sm flex items-center gap-1.5 active:scale-95 font-fira-code"
                            >
                                <ArrowRightLeft className="h-3 w-3 text-primary" />
                                Transfer
                            </button>
                            <button
                                onClick={() => onConfirmAction('discharge', admission.id)}
                                className="h-8 px-3 bg-rose-500 text-white text-[8px] font-black uppercase rounded-lg border border-rose-600 hover:opacity-90 transition-all shadow-md shadow-rose-500/20 flex items-center gap-1.5 active:scale-95 font-fira-code"
                            >
                                <LogOut className="h-3 w-3" />
                                Discharge
                            </button>
                        </div>
                        <div className="h-8 w-[1px] bg-border mx-1" />
                        <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-rose-500 transition-all border border-border shadow-sm text-lg active:scale-95 cursor-pointer">×</button>
                    </div>
                </div>

                <div className="flex px-8 bg-card/50 border-b border-border gap-1 overflow-x-auto custom-scrollbar">
                    {[
                        { id: 'vitals', label: 'Vitals', icon: Zap },
                        { id: 'notes', label: 'Progress Notes', icon: FileStack },
                        { id: 'charges', label: 'Charges', icon: Wallet },
                        { id: 'payments', label: 'Payments', icon: Landmark },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-3 text-[8.5px] font-black uppercase tracking-[0.1em] transition-all relative font-fira-code whitespace-nowrap ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                        >
                            <tab.icon className={`h-3 w-3 ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground/50'}`} />
                            {tab.label}
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative z-10 bg-muted/5">
                    {activeTab === 'vitals' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <form onSubmit={(e: any) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                addVitalsMutation.mutate({
                                    temperature: Number(formData.get('temp')),
                                    blood_pressure_systolic: Number(formData.get('sys')),
                                    blood_pressure_diastolic: Number(formData.get('dia')),
                                    pulse_rate: Number(formData.get('pulse')),
                                    oxygen_saturation: Number(formData.get('spo2')),
                                    notes: formData.get('notes')?.toString() || ''
                                });
                                e.target.reset();
                            }} className="bg-card/40 backdrop-blur-xl p-5 rounded-[24px] border border-border shadow-xl flex flex-col gap-5">
                                <div className="flex items-center gap-2.5 mb-1">
                                    <div className="h-7 w-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600">
                                        <History size={16} />
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Clinical Parameter Entry</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1">Temp (°C)</label>
                                        <input name="temp" type="number" step="0.1" required className="w-full h-10 px-3 bg-muted/20 border border-border rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-primary/10" placeholder="37.0" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1">BP (Systolic)</label>
                                        <input name="sys" type="number" required className="w-full h-10 px-3 bg-muted/20 border border-border rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-primary/10" placeholder="120" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1">BP (Diastolic)</label>
                                        <input name="dia" type="number" required className="w-full h-10 px-3 bg-muted/20 border border-border rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-primary/10" placeholder="80" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1">Pulse (BPM)</label>
                                        <input name="pulse" type="number" required className="w-full h-10 px-3 bg-muted/20 border border-border rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-primary/10" placeholder="72" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1">SpO2 (%)</label>
                                        <input name="spo2" type="number" required className="w-full h-10 px-3 bg-muted/20 border border-border rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-primary/10" placeholder="98" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1">Observation Notes</label>
                                    <input name="notes" className="w-full h-10 px-3 bg-muted/20 border border-border rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10" placeholder="Enter clinical observations..." />
                                </div>
                                <button type="submit" className="h-12 w-full bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:opacity-90 transition-all active:scale-[0.98] shadow-xl shadow-primary/20 text-[10px] font-black uppercase tracking-widest">
                                    Sync Vitals to Patient Ledger
                                </button>
                            </form>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                                {[
                                    { label: 'Thermal Index', val: admission.vitals[0]?.temperature, unit: '°C', color: 'bg-orange-500/10 text-orange-600', sub: 'Baseline 37.0' },
                                    { label: 'Circulatory Pressure', val: admission.vitals[0] ? `${admission.vitals[0].blood_pressure_systolic}/${admission.vitals[0].blood_pressure_diastolic}` : '--/--', unit: 'mmHg', color: 'bg-rose-500/10 text-rose-600', sub: 'Sys/Dia' },
                                    { label: 'Cardiac Tempo', val: admission.vitals[0]?.pulse_rate, unit: 'BPM', color: 'bg-emerald-500/10 text-emerald-600', sub: 'Rhythm: Regular' },
                                    { label: 'Oxygen Saturation', val: admission.vitals[0]?.oxygen_saturation, unit: '%', color: 'bg-blue-500/10 text-blue-600', sub: 'Atmospheric O2' },
                                ].map((v, i) => (
                                    <div key={i} className="group relative bg-card rounded-2xl p-4 border border-border shadow-sm hover:shadow-lg transition-all duration-300">
                                        <div className={cn("w-9 h-9 rounded-xl mb-3 flex items-center justify-center", v.color)}>
                                            <Activity size={18} />
                                        </div>
                                        <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1">{v.label}</p>
                                        <div className="flex items-baseline gap-1.5">
                                            <p className="text-2xl font-black text-foreground tracking-tighter">{v.val || '--'}</p>
                                            <span className="text-[9px] font-black text-muted-foreground uppercase">{v.unit}</span>
                                        </div>
                                        <p className="mt-3 text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">{v.sub}</p>
                                        <div className="absolute inset-0 rounded-2xl bg-primary opacity-0 group-hover:opacity-[0.02] transition-opacity pointer-events-none" />
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <h4 className="font-black flex items-center gap-2 text-[10px] text-foreground uppercase tracking-[0.2em]">
                                        <Clock className="h-3.5 w-3.5 text-primary" />
                                        Chronological Clinical Log
                                    </h4>
                                    <span className="px-1.5 py-0.5 bg-muted rounded-md text-[7px] font-black text-muted-foreground uppercase tracking-widest">{admission.vitals.length} ENTRIES FOUND</span>
                                </div>
                                <div className="bg-card/40 backdrop-blur-md rounded-[20px] border border-border shadow-sm overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-muted/30 text-muted-foreground text-[9px] uppercase tracking-widest font-black">
                                            <tr>
                                                <th className="px-6 py-4">Event Timestamp</th>
                                                <th className="px-6 py-4 text-center">Circulatory (BP)</th>
                                                <th className="px-6 py-4 text-center">Cardiac</th>
                                                <th className="px-6 py-4 text-center">Thermal</th>
                                                <th className="px-6 py-4 text-center">SpO2</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {admission.vitals?.map((v: any) => (
                                                <tr key={v.id} className="hover:bg-muted/10 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-foreground text-[11px]">{formatDate(new Date(v.recorded_at), 'MMM d, HH:mm')}</p>
                                                        <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">Automated Capture</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-xs font-black text-rose-600">{v.blood_pressure_systolic}/{v.blood_pressure_diastolic}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-xs font-black text-emerald-600">{v.pulse_rate}</span>
                                                        <span className="text-[7px] font-black text-muted-foreground ml-1 uppercase">BPM</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-xs font-black text-orange-600">{Number(v.temperature).toFixed(1)}°</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-black text-blue-600 text-xs">
                                                        {Number(v.oxygen_saturation).toFixed(0)}%
                                                    </td>
                                                </tr>
                                            ))}
                                            {admission.vitals.length === 0 && (
                                                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-black italic uppercase tracking-widest opacity-30 text-[9px]">No historical vitals found in clinical ledger</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <form onSubmit={(e: any) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                addNoteMutation.mutate({
                                    note: formData.get('note'),
                                    category: formData.get('category')
                                });
                                e.target.reset();
                            }} className="bg-card/60 backdrop-blur-xl p-5 rounded-[24px] border border-border shadow-lg space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                        <FileStack className="h-3.5 w-3.5 text-primary" />
                                        Commit Clinical Observation
                                    </h4>
                                    <select name="category" className="h-9 px-3 bg-muted/20 border border-border rounded-xl text-[9px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/10">
                                        <option value="GENERAL">General Progress</option>
                                        <option value="SOAP">SOAP Note</option>
                                        <option value="NURSING">Nursing Note</option>
                                        <option value="SURGICAL">Surgical Note</option>
                                    </select>
                                </div>
                                <textarea
                                    name="note"
                                    required
                                    rows={3}
                                    className="w-full px-4 py-3 bg-muted/10 border border-border rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none"
                                    placeholder="Enter encrypted clinical observations, treatment response, and diagnostic markers..."
                                />
                                <div className="flex justify-end">
                                    <button type="submit" className="h-9 px-6 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-[9px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95">
                                        Secure Post to Ledger
                                    </button>
                                </div>
                            </form>

                            <div className="space-y-6">
                                <h4 className="font-black flex items-center gap-3 text-[11px] text-foreground uppercase tracking-[0.2em] px-2">
                                    <History className="h-4 w-4 text-primary" />
                                    Clinical Event Stream
                                </h4>
                                <div className="space-y-4">
                                    {admission.progress_notes?.map((n: any) => (
                                        <div key={n.id} className="group relative p-4 bg-card border border-border rounded-[20px] shadow-sm hover:shadow-lg transition-all duration-300">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[8px] font-black uppercase tracking-widest py-1 px-3 rounded-full bg-primary/10 text-primary border border-primary/20">{n.category}</span>
                                                    <span className="text-[9px] font-bold text-muted-foreground">{formatDate(new Date(n.created_at), 'MMM d, HH:mm')}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[9px] uppercase font-black text-foreground tracking-tighter">Attending: Dr. {n.doctor.last_name}</span>
                                                    <p className="text-[7px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">Verified Practitioner</p>
                                                </div>
                                            </div>
                                            <p className="text-xs leading-relaxed text-foreground/80 font-medium border-l-[1.5px] border-primary/20 pl-4 ml-0.5">{n.note}</p>
                                            <div className="absolute inset-0 rounded-[20px] bg-primary opacity-0 group-hover:opacity-[0.01] transition-opacity pointer-events-none" />
                                        </div>
                                    ))}
                                    {admission.progress_notes.length === 0 && (
                                        <div className="text-center py-20 border-2 border-dashed border-border rounded-[40px] bg-muted/5">
                                            <FileStack className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
                                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest">No clinical progress entries found for this induction</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'charges' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <form onSubmit={(e: any) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                addChargeMutation.mutate({
                                    description: formData.get('description'),
                                    amount: Number(formData.get('amount')),
                                    category: formData.get('category'),
                                    is_emergency: formData.get('is_emergency') === 'on',
                                    notes: formData.get('notes')?.toString() || ''
                                });
                                e.target.reset();
                            }} className="flex flex-wrap lg:flex-nowrap gap-4 bg-card/60 backdrop-blur-xl p-5 rounded-[24px] border border-border items-end shadow-xl">
                                <div className="flex-[3] min-w-[200px] space-y-1.5">
                                    <label className="block text-[9px] font-black text-primary uppercase tracking-widest ml-1">Statutory Service</label>
                                    <div className="relative group">
                                        <Scan className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input name="description" required className="w-full h-10 pl-10 pr-3 bg-muted/20 border border-border rounded-xl text-[13px] font-bold focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-sm" placeholder="e.g. Brain MRI" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-[120px] space-y-1.5">
                                    <label className="block text-[9px] font-black text-primary uppercase tracking-widest ml-1">Amount</label>
                                    <input name="amount" type="number" step="0.01" required className="w-full h-10 px-3 bg-muted/20 border border-border rounded-xl text-[13px] font-mono font-black focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-sm" placeholder="0.00" />
                                </div>
                                <div className="flex-1 min-w-[140px] space-y-1.5">
                                    <label className="block text-[9px] font-black text-primary uppercase tracking-widest ml-1">Dept</label>
                                    <select name="category" className="w-full h-10 px-3 bg-muted/20 border border-border rounded-xl text-[9px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer">
                                        <option value="SURGERY">Surgery</option>
                                        <option value="RADIOLOGY">Radiology</option>
                                        <option value="LAB">Lab</option>
                                        <option value="CONSULTATION">Specialist</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2.5 h-10 px-3 border border-border rounded-xl bg-muted/20">
                                    <input type="checkbox" name="is_emergency" id="is_emergency" className="w-3.5 h-3.5 rounded border-border text-red-600 focus:ring-red-500/10 cursor-pointer" />
                                    <label htmlFor="is_emergency" className="text-[8px] font-black text-red-600 uppercase tracking-widest cursor-pointer">STAT</label>
                                </div>
                                <button type="submit" className="h-10 px-6 bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-primary/20 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                                    ADD
                                </button>
                            </form>

                            <div className="bg-muted/10 p-5 rounded-[24px] border border-border space-y-4 relative overflow-hidden">
                                <div className="flex justify-between items-center relative z-10">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                            <Pill size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Pharmacy Inventory</h4>
                                            <p className="text-[7px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">Check current stock</p>
                                        </div>
                                    </div>
                                    <div className="relative w-64 group">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            placeholder="Search Inventory..."
                                            className="w-full h-9 pl-10 pr-3 bg-card border border-border rounded-xl text-[11px] font-bold shadow-sm focus:ring-2 focus:ring-primary/10 outline-none"
                                            value={medSearch}
                                            onChange={(e) => setMedSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {medSearch.length >= 2 && medicines && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                                        {medicines.map((m: any) => (
                                            <div key={m.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-xl hover:border-primary/40 transition-all shadow-sm group">
                                                <div className="flex-1">
                                                    <p className="text-[11px] font-black text-foreground uppercase tracking-tight mb-0.5">{m.drug_name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Stock: {m.stock_quantity}</span>
                                                        <span className="opacity-20">•</span>
                                                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">{currencyFormat(m.selling_price)} / UNIT</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="number"
                                                        id={`qty-${m.id}`}
                                                        defaultValue={1}
                                                        min={1}
                                                        className="w-12 h-8 px-2 bg-muted/20 border border-border rounded-lg text-[11px] font-black text-center focus:ring-2 focus:ring-primary/10 outline-none"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const qty = Number((document.getElementById(`qty-${m.id}`) as HTMLInputElement).value);
                                                            addChargeMutation.mutate({
                                                                description: `Medicine: ${m.drug_name}`,
                                                                amount: Number(m.selling_price),
                                                                quantity: qty,
                                                                category: 'PHARMACY',
                                                                is_emergency: true,
                                                                notes: `Batch: ${m.batch_number || 'N/A'}`
                                                            });
                                                        }}
                                                        className="h-8 px-3 bg-primary/10 text-primary text-[9px] font-black rounded-lg hover:bg-primary hover:text-white transition-all transform active:scale-95"
                                                    >
                                                        ADD
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {medicines.length === 0 && <p className="text-center py-8 text-xs text-muted-foreground italic font-bold">No dispensary stock matching "{medSearch}"</p>}
                                    </div>
                                )}
                                {medSearch.length > 0 && medSearch.length < 2 && (
                                    <p className="text-[10px] text-muted-foreground italic font-black uppercase tracking-widest px-2">Awaiting identifying characters...</p>
                                )}
                                {!medSearch && (
                                    <div className="text-center py-12 text-muted-foreground/30 border border-dashed border-border rounded-[32px] bg-card/40">
                                        <Pill className="h-10 w-10 mx-auto mb-4 opacity-10" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Search for medicines in pharmacy</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <h4 className="font-black text-[10px] text-foreground tracking-[0.2em] uppercase">Billing Summary</h4>
                                    <span className="text-[8px] font-black text-muted-foreground tracking-widest uppercase opacity-40">Current Charges</span>
                                </div>
                                <div className="bg-card/40 backdrop-blur-md rounded-[24px] border border-border shadow-xl overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-muted/30 text-muted-foreground text-[9px] uppercase font-black tracking-widest">
                                            <tr>
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4">Description</th>
                                                <th className="px-6 py-4 text-center">Status</th>
                                                <th className="px-6 py-4 text-center">Unit/Day</th>
                                                <th className="px-6 py-4 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            <tr className="bg-primary/[0.02] group">
                                                <td className="px-6 py-4">
                                                    <p className="text-[11px] font-black text-foreground">{formatDate(new Date(admission.admitted_at), 'MMM dd, yyyy')}</p>
                                                    <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">Patient Admitted</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-[11px] font-black text-foreground uppercase tracking-tight">Stay: {admission.bed.ward.name}</p>
                                                    <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">{currencyFormat(admission.stay_details.rate)} Daily Rate</p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 text-[8px] font-black uppercase rounded-lg border border-blue-500/20">RESIDENCY</span>
                                                </td>
                                                <td className="px-6 py-4 text-center font-black text-[11px] text-foreground/60">{admission.stay_details.days} <span className="text-[8px] uppercase ml-1">Days</span></td>
                                                <td className="px-6 py-4 text-right font-black text-[14px] text-foreground tracking-tighter">{currencyFormat(admission.stay_details.stay_cost)}</td>
                                            </tr>
                                            {admission.charges?.map((c: any) => (
                                                <tr key={c.id} className="hover:bg-muted/5 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <p className="text-[11px] font-bold text-foreground">{formatDate(new Date(c.date), 'MMM dd, yyyy')}</p>
                                                        <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">Clinical Service</p>
                                                    </td>
                                                    <td className="px-6 py-4 relative">
                                                        <div className="flex items-center justify-between group/cell">
                                                            <div>
                                                                <p className="text-[11px] font-black text-foreground uppercase tracking-tight leading-none">{c.description}</p>
                                                                <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mt-1">{c.category || 'Clinical service'}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => onConfirmAction('delete-charge', c.id, c.description)}
                                                                className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 active:scale-95"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span className={cn(
                                                                'text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border shadow-sm',
                                                                c.service_status === 'APPROVED' || c.service_status === 'READY' ? 'bg-primary/10 text-primary border-primary/20' :
                                                                    c.service_status === 'PENDING_APPROVAL' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse' :
                                                                        'bg-muted text-muted-foreground border-border'
                                                            )}>
                                                                {c.service_status}
                                                            </span>
                                                            {c.service_status === 'PENDING_APPROVAL' && (
                                                                <button
                                                                    onClick={() => approveChargeMutation.mutate(c.id)}
                                                                    disabled={approveChargeMutation.isPending}
                                                                    className="h-6 w-6 bg-primary text-primary-foreground rounded-md flex items-center justify-center hover:opacity-90 transition-all active:scale-95 shadow-md shadow-primary/20"
                                                                >
                                                                    <CheckCircle className="h-3 w-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => editChargeMutation.mutate({ chargeId: c.id, data: { quantity: Math.max(1, (c.quantity || 1) - 1) } })}
                                                                className="h-5 w-5 rounded-md bg-muted/40 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-xs font-black active:scale-95"
                                                            >-</button>
                                                            <span className="text-[11px] font-black min-w-[1rem] text-center text-foreground">{c.quantity || 1}</span>
                                                            <button
                                                                onClick={() => editChargeMutation.mutate({ chargeId: c.id, data: { quantity: (c.quantity || 1) + 1 } })}
                                                                className="h-5 w-5 rounded-md bg-muted/40 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-xs font-black active:scale-95"
                                                            >+</button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black text-foreground/70 text-[13px] tracking-tighter">{currencyFormat(Number(c.amount) * (c.quantity || 1))}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-muted/10 border-t border-border">
                                            <tr className="border-b border-border/30">
                                                <td colSpan={4} className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Subtotal</td>
                                                <td className="px-6 py-4 text-right font-black text-2xl text-foreground tracking-tighter">{currencyFormat(Number(admission.stay_details.stay_cost) + (admission.charges?.reduce((s: any, c: any) => s + (Number(c.amount) * (c.quantity || 1)), 0) || 0))}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan={4} className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-[0.2em] text-primary">Advance Paid</td>
                                                <td className="px-6 py-4 text-right font-black text-xl text-primary tracking-tighter">-{currencyFormat(admission.advance_paid)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <form onSubmit={async (e: any) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                await api.post(`/wards/admissions/${id}/payments`, {
                                    amount: Number(formData.get('amount')),
                                    method: formData.get('method'),
                                    notes: formData.get('notes')?.toString() || ''
                                });
                                queryClient.invalidateQueries({ queryKey: ['admission', id] });
                                e.target.reset();
                            }} className="bg-primary/5 backdrop-blur-xl p-5 rounded-[24px] border border-primary/20 grid grid-cols-12 gap-4 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
                                <div className="col-span-12 mb-1 flex items-center gap-2.5">
                                    <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                        <Landmark size={14} />
                                    </div>
                                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Add Payment</h4>
                                </div>
                                <div className="col-span-12 lg:col-span-4 space-y-1.5">
                                    <label className="block text-[9px] font-black text-primary uppercase tracking-widest ml-1">Amount</label>
                                    <input name="amount" type="number" step="0.01" required className="w-full h-10 px-3 bg-card border border-primary/20 rounded-xl text-[13px] font-black focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm" placeholder="0.00" />
                                </div>
                                <div className="col-span-12 lg:col-span-4 space-y-1.5">
                                    <label className="block text-[9px] font-black text-primary uppercase tracking-widest ml-1">Method</label>
                                    <select name="method" className="w-full h-10 px-3 bg-card border border-primary/20 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
                                        <option value="CASH">Cash</option>
                                        <option value="CARD">Card</option>
                                        <option value="BANK_TRANSFER">Bank Transfer</option>
                                        <option value="ONLINE">UPI/Online</option>
                                    </select>
                                </div>
                                <div className="col-span-12 lg:col-span-3 space-y-1.5">
                                    <label className="block text-[9px] font-black text-primary uppercase tracking-widest ml-1">Reference/Notes</label>
                                    <input name="notes" className="w-full h-10 px-3 bg-card border border-primary/20 rounded-xl text-[13px] font-bold outline-none shadow-sm" placeholder="Receipt / Txn ID" />
                                </div>
                                <div className="col-span-12 lg:col-span-1 pt-[21px]">
                                    <button type="submit" className="w-full h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-primary/20">
                                        <Plus className="h-5 w-5" />
                                    </button>
                                </div>
                            </form>

                            <div className="space-y-4">
                                <h4 className="font-black flex items-center gap-2.5 text-[10px] text-foreground tracking-[0.2em] uppercase px-1">
                                    <Clock className="h-3.5 w-3.5 text-primary" />
                                    Payment History
                                </h4>
                                <div className="bg-card/40 backdrop-blur-md rounded-[24px] border border-border shadow-xl overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-muted/30 text-muted-foreground text-[9px] uppercase font-black tracking-widest">
                                            <tr>
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4">Method</th>
                                                <th className="px-6 py-4">Transaction ID</th>
                                                <th className="px-6 py-4 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {admission.payments?.map((p: any) => (
                                                <tr key={p.id} className="hover:bg-muted/5 transition-colors">
                                                    <td className="px-6 py-4 text-[11px] font-bold text-foreground">{formatDate(new Date(p.payment_date), 'MMM d, HH:mm')}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-primary/10 text-primary rounded-md border border-primary/20">{p.method}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[10px] font-mono font-black text-muted-foreground uppercase opacity-60 tracking-tighter">{p.id.slice(0, 8).toUpperCase()}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black text-primary text-[15px] tracking-tighter">{currencyFormat(p.amount)}</td>
                                                </tr>
                                            ))}
                                            {(!admission.payments || admission.payments.length === 0) && (
                                                <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground font-black italic uppercase tracking-[0.2em] opacity-30 text-[9px]">No historical credits found</td></tr>
                                            )}
                                        </tbody>
                                        <tfoot className="bg-primary/5 border-t border-primary/20">
                                            <tr>
                                                <td colSpan={3} className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-[0.2em] text-primary">Total Paid</td>
                                                <td className="px-6 py-4 text-right font-black text-primary text-2xl tracking-tighter">{currencyFormat(admission.advance_paid)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-5 border-t border-border bg-muted/10 flex justify-between items-center relative z-10">
                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] italic opacity-40">
                        * Clinical Snapshot: {formatDate(new Date(), 'MMM dd, HH:mm')}. Authorized access only.
                    </p>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="h-12 px-10 bg-card border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all active:scale-95 shadow-sm">Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CreateWardModal({ onClose }: { onClose: () => void }) {
    const queryClient = useQueryClient();
    const { register, handleSubmit } = useForm();

    const mutation = useMutation({
        mutationFn: async (data: any) => api.post('/wards', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wards'] });
            toast.success("Ward created successfully");
            onClose();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to create ward");
        }
    });

    return (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-border animate-in zoom-in-95 duration-300 relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />

                <div className="p-8 border-b border-border bg-muted/20 flex justify-between items-center relative z-10 text-foreground">
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter text-foreground uppercase">Create New Ward</h2>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Add a new ward to the system</p>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-2xl hover:bg-muted transition-all text-2xl border border-border shadow-sm text-foreground">×</button>
                </div>
                <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="p-8 space-y-6 relative z-10">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 space-y-2">
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1">Ward Name</label>
                            <input
                                {...register('name', { required: true })}
                                className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                placeholder="e.g. Critical Care Complex"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1">Ward Code</label>
                            <input
                                {...register('code', { required: true })}
                                className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-sm font-mono font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                placeholder="e.g. CCC-01"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1">Ward Type</label>
                            <select
                                {...register('type', { required: true })}
                                className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/10"
                            >
                                <option value="GENERAL">General Care</option>
                                <option value="ICU">Intensive Care</option>
                                <option value="EMERGENCY">Emergency Response</option>
                                <option value="MATERNITY">Maternal Health</option>
                                <option value="PEDIATRIC">Pediatric Care</option>
                                <option value="PRIVATE">Private Suite</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1">Daily Rate</label>
                            <input
                                type="number"
                                {...register('daily_rate', { valueAsNumber: true, required: true })}
                                className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-sm font-black focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1">Number of Beds</label>
                            <input
                                type="number"
                                {...register('total_beds', { valueAsNumber: true, required: true })}
                                className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                placeholder="10"
                            />
                        </div>
                    </div>

                    <div className="pt-8 flex gap-4">
                        <button type="button" onClick={onClose} className="flex-1 h-14 border-2 border-border rounded-[20px] hover:bg-muted transition-all text-xs font-black uppercase tracking-widest active:scale-95">Cancel</button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex-1 h-14 bg-primary text-primary-foreground rounded-[20px] hover:opacity-90 transition-all text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 disabled:opacity-50 active:scale-95"
                        >
                            {mutation.isPending ? 'CREATING...' : 'CREATE WARD'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function EditWardModal({ ward, onClose }: { ward: any, onClose: () => void }) {
    const queryClient = useQueryClient();
    const { register, handleSubmit } = useForm({
        defaultValues: {
            name: ward.name,
            type: ward.type,
            code: ward.code,
            daily_rate: ward.daily_rate,
        }
    });

    const editMutation = useMutation({
        mutationFn: async (data: any) => {
            await api.patch(`/wards/${ward.id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wards'] });
            toast.success("Ward updated successfully");
            onClose();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Update failed");
        }
    });

    return (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-border animate-in zoom-in-95 duration-300 relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />

                <div className="p-8 border-b border-border bg-muted/20 flex justify-between items-center relative z-10 text-foreground">
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter text-foreground uppercase">Edit Ward</h2>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Updating {ward.name}</p>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-2xl hover:bg-muted transition-all text-2xl border border-border shadow-sm text-foreground">×</button>
                </div>

                <form onSubmit={handleSubmit((data) => editMutation.mutate({ ...data, daily_rate: Number(data.daily_rate) }))} className="p-8 space-y-6 relative z-10">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 space-y-2">
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1">Ward Name</label>
                            <input
                                {...register('name', { required: true })}
                                className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1">Classification</label>
                            <select
                                {...register('type', { required: true })}
                                className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none"
                            >
                                <option value="GENERAL">General Care</option>
                                <option value="ICU">Intensive Care</option>
                                <option value="EMERGENCY">Emergency Response</option>
                                <option value="PEDIATRIC">Pediatric Care</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1">Ward Code</label>
                            <input
                                {...register('code', { required: true })}
                                className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-sm font-mono font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1">Daily Rate</label>
                            <input
                                type="number"
                                {...register('daily_rate', { required: true })}
                                className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-lg font-black text-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-8 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-14 border-2 border-border rounded-[20px] hover:bg-muted transition-all text-xs font-black uppercase tracking-widest active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={editMutation.isPending}
                            className="flex-1 h-14 bg-primary text-primary-foreground rounded-[20px] hover:opacity-90 transition-all text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {editMutation.isPending ? 'SAVING...' : 'SAVE CHANGES'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function TransferModal({ admissionId, currentBed, onClose }: { admissionId: string, currentBed: string, onClose: () => void }) {
    const queryClient = useQueryClient();
    const { data: wards } = useQuery({ queryKey: ['wards'], queryFn: async () => (await api.get<any[]>('/wards')).data || [] });
    const { register, handleSubmit, watch } = useForm();
    const selectedWardId = watch('ward_id');
    const { format: currencyFormat } = useCurrency();

    const transferMutation = useMutation({
        mutationFn: async (data: any) => {
            await api.post(`/wards/admissions/${admissionId}/transfer`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wards'] });
            toast.success("Patient transferred successfully");
            onClose();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Transfer failed");
        }
    });

    const targetWard = wards?.find((w: any) => w.id === selectedWardId);
    const availableBeds = targetWard?.beds.filter((b: any) => b.status === 'AVAILABLE') || [];

    return (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-xl rounded-[40px] shadow-2xl border border-border animate-in zoom-in-95 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />

                <div className="p-8 border-b border-border bg-muted/20 relative z-10 flex justify-between items-center text-foreground">
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter text-foreground flex items-center gap-3 uppercase">
                            <ArrowRightLeft className="h-6 w-6 text-primary" />
                            Transfer Patient
                        </h2>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Transferring patient from bed: {currentBed}</p>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-2xl hover:bg-muted transition-all text-2xl border border-border shadow-sm text-foreground">×</button>
                </div>

                <form onSubmit={handleSubmit((data) => transferMutation.mutate(data))} className="p-8 space-y-6 relative z-10">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase text-primary tracking-widest ml-1">Destination Ward</label>
                            <select {...register('ward_id', { required: true })} className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/10">
                                <option value="">Select Destination Ward...</option>
                                {wards?.map((w: any) => (
                                    <option key={w.id} value={w.id}>{w.name} ({currencyFormat(w.daily_rate)})</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase text-primary tracking-widest ml-1">Select New Bed</label>
                            <select {...register('new_bed_id', { required: true })} disabled={!selectedWardId} className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/10 transition-all">
                                <option value="">Select Bed...</option>
                                {availableBeds.map((b: any) => (
                                    <option key={b.id} value={b.id}>{b.bed_number} • {b.bed_type}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="block text-[10px] font-black uppercase text-primary tracking-widest ml-1">Reason for Transfer</label>
                            <textarea {...register('reason')} className="w-full h-32 px-4 py-4 bg-muted/20 border border-border rounded-[24px] text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none" placeholder="Enter reason for patient transfer..."></textarea>
                        </div>
                    </div>

                    <div className="pt-8 flex gap-4">
                        <button type="button" onClick={onClose} className="flex-1 h-14 border-2 border-border rounded-[20px] hover:bg-muted transition-all text-xs font-black uppercase tracking-widest active:scale-95">Cancel</button>
                        <button type="submit" disabled={transferMutation.isPending} className="flex-1 h-14 bg-primary text-primary-foreground rounded-[20px] text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50">
                            {transferMutation.isPending ? 'TRANSFERRING...' : 'CONFIRM TRANSFER'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
