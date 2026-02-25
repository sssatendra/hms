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
    const { format } = useCurrency();

    const { data: wards, isLoading } = useQuery({
        queryKey: ['wards'],
        queryFn: async () => {
            const res = await api.get('/wards');
            return res.data;
        }
    });

    const { data: activeAdmissions } = useQuery({
        queryKey: ['active-admissions'],
        queryFn: async () => {
            const res = await api.get('/wards');
            const allBeds = res.data.flatMap((w: any) => w.beds);
            return allBeds.filter((b: any) => b.status === 'OCCUPIED');
        }
    });

    const { data: patients } = useQuery({
        queryKey: ['patients'],
        queryFn: async () => {
            const res = await api.get('/patients');
            return res.data;
        }
    });

    const deleteWardMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/wards/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wards'] });
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Failed to delete ward');
        }
    });

    const dischargeMutation = useMutation({
        mutationFn: async ({ id, notes }: { id: string, notes?: string }) => {
            await api.post(`/wards/admissions/${id}/discharge`, { notes });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wards'] });
            queryClient.invalidateQueries({ queryKey: ['active-admissions'] });
        }
    });

    const deleteChargeMutation = useMutation({
        mutationFn: async ({ admissionId, chargeId }: { admissionId: string, chargeId: string }) =>
            api.delete(`/wards/admissions/${admissionId}/charges/${chargeId}`),
        onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ['admission', variables.admissionId] })
    });

    if (isLoading) {
        return (
            <div className="p-20 text-center text-muted-foreground animate-pulse font-black tracking-widest uppercase">
                Synchronizing Ward Telemetry...
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen bg-background/50 animate-in fade-in duration-700">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[5%] left-[10%] w-[45%] h-[45%] bg-primary/5 rounded-full blur-[140px] animate-pulse"></div>
                <div className="absolute bottom-[10%] right-[5%] w-[35%] h-[35%] bg-accent/5 rounded-full blur-[120px]"></div>
            </div>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter flex items-center gap-3">
                        <HeartPulse className="h-10 w-10 text-primary" />
                        Inpatient Services
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium uppercase tracking-widest text-[10px]">Active Ward Management & Critical Care Logistics</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowCreateWardModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-card/80 backdrop-blur-md border border-border rounded-2xl hover:bg-card transition-all font-bold text-sm shadow-sm active:scale-95 cursor-pointer"
                    >
                        <Building2 className="h-4 w-4 text-primary" />
                        NEW WARD
                    </button>
                    <button
                        onClick={() => setShowAdmitModal(true)}
                        className="flex items-center gap-2 px-8 py-2.5 bg-primary text-primary-foreground rounded-2xl hover:opacity-90 transition-all font-bold shadow-xl shadow-primary/20 text-sm active:scale-95 cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        ADMIT PATIENT
                    </button>
                </div>
            </div>

            {/* Ward Stations Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
                {wards?.map((ward: any) => {
                    const occupiedCount = ward.beds.filter((b: any) => b.status === 'OCCUPIED').length;
                    const occupancyRate = (occupiedCount / ward.beds.length) * 100 || 0;

                    return (
                        <div key={ward.id} className="group relative bg-card/60 backdrop-blur-xl rounded-[32px] border border-border shadow-sm overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col min-h-[320px]">
                            {/* Medical Status Bar */}
                            <div className={cn(
                                "h-1.5 w-full",
                                occupancyRate > 90 ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" : occupancyRate > 70 ? "bg-amber-500" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            )} />

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black tracking-tighter text-foreground mb-1 font-mono uppercase">{ward.name}</h3>
                                            <div className="flex gap-1 items-center">
                                                <span className="px-2 py-0.5 bg-muted/40 text-[8px] font-black uppercase tracking-[0.2em] rounded-lg text-muted-foreground">{ward.type}</span>
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
                                <div className="flex-1 bg-muted/20 backdrop-blur-sm rounded-3xl p-4 border border-border/40 mb-4 group-hover:bg-muted/30 transition-colors flex flex-col min-h-[160px]">
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Bed Matrix</h4>
                                        <span className="text-[9px] font-bold text-primary/50 uppercase tracking-widest">{ward.beds.length} Assets</span>
                                    </div>
                                    <div className="grid grid-cols-[repeat(auto-fill,minmax(60px,1fr))] gap-2 overflow-y-auto pr-2 custom-scrollbar max-h-[180px] content-start">
                                        {ward.beds.map((bed: any) => (
                                            <div
                                                key={bed.id}
                                                onClick={() => {
                                                    if (bed.status === 'OCCUPIED' && bed.admissions?.[0]) {
                                                        setShowAdmissionDetail(bed.admissions[0].id);
                                                    }
                                                }}
                                                className={cn(
                                                    "relative group/bed h-12 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ring-offset-background active:scale-95",
                                                    bed.status === 'AVAILABLE'
                                                        ? "bg-white border-border/60 hover:border-primary hover:shadow-lg hover:shadow-primary/5"
                                                        : bed.status === 'OCCUPIED'
                                                            ? "bg-rose-50 border-rose-200 text-rose-600 shadow-sm"
                                                            : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                                                )}
                                            >
                                                <span className="text-[10px] font-black tracking-tighter leading-none mb-1">{bed.bed_number}</span>
                                                {bed.status === 'OCCUPIED' && bed.admissions?.[0] ? (
                                                    <div className="relative">
                                                        <Activity className="h-3 w-3 text-rose-500 animate-pulse" />
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
                                        <span className="text-[10px] font-black text-foreground leading-none uppercase tracking-widest mb-2">{occupiedCount} / {ward.beds.length} CAPACITY</span>
                                        <div className="w-32 h-2 bg-muted/40 rounded-full overflow-hidden border border-border/20">
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
                                        <p className="text-lg font-black text-foreground leading-none mb-1 font-mono tracking-tighter">
                                            {format(ward.daily_rate)}
                                            <span className="text-[9px] text-muted-foreground ml-1 font-sans font-bold uppercase">/ Day</span>
                                        </p>
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-widest",
                                            occupancyRate > 90 ? "text-rose-500" : "text-emerald-500"
                                        )}>{occupancyRate.toFixed(0)}% Utilized</span>
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
                        dischargeMutation.mutate({ id: confirmAction.id, notes: 'Standard discharge protocol followed.' });
                    } else if (confirmAction?.type === 'delete-charge') {
                        deleteChargeMutation.mutate({ admissionId: showAdmissionDetail!, chargeId: confirmAction.id });
                    }
                    setConfirmAction(null);
                }}
                title={confirmAction?.type === 'decommission' ? 'Station Decommission' : confirmAction?.type === 'discharge' ? 'Final Discharge Approval' : 'Remove Audit Charge'}
                description={confirmAction?.type === 'decommission'
                    ? `Initiate archival procedure for ${confirmAction?.extra}? All bed assets will be decommissioned.`
                    : confirmAction?.type === 'discharge'
                        ? 'Finalize clinical discharge for this patient stay? This action will formally clear the bed asset.'
                        : `Are you sure you want to remove the charge for "${confirmAction?.extra}"?`}
                confirmText={confirmAction?.type === 'decommission' ? 'Archive Station' : confirmAction?.type === 'discharge' ? 'Approve Discharge' : 'Remove Charge'}
                isLoading={deleteWardMutation.isPending || dischargeMutation.isPending || deleteChargeMutation.isPending}
            />
        </div>
    );
}



function AdmitModal({ onClose, patients, wards }: any) {
    const { register, handleSubmit, control } = useForm();
    const queryClient = useQueryClient();
    const [selectedWardId, setSelectedWardId] = useState('');
    const { format } = useCurrency();

    const admitMutation = useMutation({
        mutationFn: async (data: any) => {
            await api.post('/wards/admissions', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wards'] });
            onClose();
        }
    });

    const selectedWard = wards?.find((w: any) => w.id === selectedWardId);
    const availableBeds = selectedWard?.beds.filter((b: any) => b.status === 'AVAILABLE') || [];

    return (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-border animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-border bg-muted/20 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter text-foreground uppercase">Patient Induction</h2>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Ward Assignment & Resource Allocation</p>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-2xl hover:bg-muted transition-all text-2xl border border-border shadow-sm">×</button>
                </div>
                <form onSubmit={handleSubmit((data) => admitMutation.mutate(data))} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="relative">
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-2 ml-1">Identity Verification</label>
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
                                <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-2 ml-1">Target Ward Station</label>
                                <select
                                    value={selectedWardId}
                                    onChange={(e) => setSelectedWardId(e.target.value)}
                                    className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                    required
                                >
                                    <option value="">Select Station...</option>
                                    {wards?.map((w: any) => (
                                        <option key={w.id} value={w.id}>{w.name} ({format(w.daily_rate)})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-2 ml-1">Assigned Bed Asset</label>
                                <select
                                    {...register('bed_id')}
                                    className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                    required
                                    disabled={!selectedWardId}
                                >
                                    <option value="">Select Asset...</option>
                                    {availableBeds.map((b: any) => (
                                        <option key={b.id} value={b.id}>{b.bed_number} • {b.bed_type}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-2 ml-1">Clinical Induction Diagnosis</label>
                            <div className="relative group">
                                <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    {...register('diagnosis_on_admission')}
                                    className="w-full h-12 pl-12 pr-4 bg-muted/20 border border-border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                    placeholder="Enter primary medical observation..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-2 ml-1">Secured Advance Payment Amount</label>
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

                    <div className="pt-8 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-14 border-2 border-border rounded-[20px] hover:bg-muted transition-all text-xs font-black uppercase tracking-widest active:scale-95"
                        >
                            Abort
                        </button>
                        <button
                            type="submit"
                            disabled={admitMutation.isPending}
                            className="flex-1 h-14 bg-primary text-primary-foreground rounded-[20px] hover:opacity-90 transition-all text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 disabled:opacity-50 active:scale-95"
                        >
                            {admitMutation.isPending ? 'SYNCHRONIZING...' : 'FINALIZE INDUCTION'}
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
    const { format } = useCurrency();

    const { data: admission, isLoading } = useQuery({
        queryKey: ['admission', id],
        queryFn: async () => {
            const res = await api.get(`/wards/admissions/${id}`);
            return res.data;
        }
    });

    const addVitalsMutation = useMutation({
        mutationFn: async (data: any) => api.post(`/wards/admissions/${id}/vitals`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admission', id] });
        },
        onError: (err: any) => alert(err.response?.data?.message || 'Failed to save vitals')
    });

    const editChargeMutation = useMutation({
        mutationFn: async ({ chargeId, data }: { chargeId: string, data: any }) => api.patch(`/wards/admissions/${id}/charges/${chargeId}`, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admission', id] }),
        onError: (err: any) => alert(err.response?.data?.message || 'Failed to update charge')
    });

    const dischargeMutation = useMutation({
        mutationFn: async (notes: string) => api.post(`/wards/admissions/${id}/discharge`, { notes }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wards'] });
            onClose();
        }
    });

    const { data: medicines } = useQuery({
        queryKey: ['med-search', medSearch],
        queryFn: async () => {
            if (medSearch.length < 2) return [];
            const res = await api.get(`/pharmacy/inventory?search=${medSearch}`);
            return res.data;
        },
        enabled: medSearch.length >= 2
    });

    const addChargeMutation = useMutation({
        mutationFn: async (data: any) => api.post(`/wards/admissions/${id}/charges`, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admission', id] })
    });

    const approveChargeMutation = useMutation({
        mutationFn: async (chargeId: string) => api.post(`/wards/admissions/${id}/charges/${chargeId}/approve`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admission', id] })
    });

    const addNoteMutation = useMutation({
        mutationFn: async (data: any) => api.post(`/wards/admissions/${id}/notes`, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admission', id] })
    });

    if (isLoading || !admission) return null;

    return (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 font-sans text-foreground overflow-hidden animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-6xl rounded-[40px] shadow-2xl overflow-hidden border border-border flex flex-col my-auto animate-in zoom-in-95 duration-300 max-h-[95vh] relative">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

                <div className="p-8 border-b border-border bg-muted/20 flex justify-between items-center shrink-0 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-[24px] bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                            <Activity className="h-8 w-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-4 mb-1">
                                <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase">{admission.patient.first_name} {admission.patient.last_name}</h1>
                                <span className="px-3 py-1 bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase rounded-full tracking-widest shadow-sm">{admission.patient.mrn}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <Building2 size={14} className="text-primary" />
                                <span className="text-foreground">{admission.bed.ward.name}</span>
                                <span className="opacity-30">•</span>
                                <span className="text-foreground">Asset {admission.bed.bed_number}</span>
                                <span className="ml-3 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-md border border-emerald-500/20 text-[8px] tracking-widest">ACTIVE CLINICAL STAY</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-3xl font-black text-foreground tracking-tighter leading-none mb-1">{format(admission.running_total)}</p>
                            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.3em]">Accrued Liabilities</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => onTransfer(admission.id, admission.bed.bed_number)}
                                className="h-12 px-5 bg-card border border-border text-foreground text-[10px] font-black uppercase rounded-2xl hover:bg-muted transition-all shadow-sm flex items-center gap-2 active:scale-95"
                            >
                                <ArrowRightLeft className="h-4 w-4 text-primary" />
                                Transfer
                            </button>
                            <button
                                onClick={() => onConfirmAction('discharge', admission.id)}
                                className="h-12 px-5 bg-rose-500 text-white text-[10px] font-black uppercase rounded-2xl border border-rose-600 hover:opacity-90 transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2 active:scale-95"
                            >
                                <LogOut className="h-4 w-4" />
                                Discharge
                            </button>
                        </div>
                        <div className="h-12 w-[1px] bg-border mx-2" />
                        <button onClick={onClose} className="h-12 w-12 rounded-2xl hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all border border-border shadow-sm text-3xl">×</button>
                    </div>
                </div>

                <div className="flex px-8 bg-card border-b border-border gap-2">
                    {[
                        { id: 'vitals', label: 'Clinical Vitals', icon: Zap },
                        { id: 'notes', label: 'Progress Ledger', icon: FileStack },
                        { id: 'charges', label: 'Revenue Audit', icon: Wallet },
                        { id: 'payments', label: 'Financial Credits', icon: Landmark },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-6 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'}`} />
                            {tab.label}
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-4px_12px_rgba(202,138,4,0.3)]" />}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative z-10 bg-muted/5">
                    {activeTab === 'vitals' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                            }} className="bg-card/60 backdrop-blur-xl p-8 rounded-[32px] border border-border shadow-2xl flex flex-col gap-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-8 w-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                                        <History size={18} />
                                    </div>
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Clinical Parameter Entry</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Temp (°C)</label>
                                        <input name="temp" type="number" step="0.1" required className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-primary/10" placeholder="37.0" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">BP (Systolic)</label>
                                        <input name="sys" type="number" required className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-primary/10" placeholder="120" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">BP (Diastolic)</label>
                                        <input name="dia" type="number" required className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-primary/10" placeholder="80" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Pulse (BPM)</label>
                                        <input name="pulse" type="number" required className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-primary/10" placeholder="72" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">SpO2 (%)</label>
                                        <input name="spo2" type="number" required className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-primary/10" placeholder="98" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Observation Notes</label>
                                    <input name="notes" className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/10" placeholder="Enter clinical observations..." />
                                </div>
                                <button type="submit" className="h-14 w-full bg-primary text-primary-foreground rounded-2xl flex items-center justify-center hover:opacity-90 transition-all active:scale-[0.98] shadow-xl shadow-primary/20 text-[11px] font-black uppercase tracking-widest">
                                    Sync Vitals to Patient Ledger
                                </button>
                            </form>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: 'Thermal Index', val: admission.vitals[0]?.temperature, unit: '°C', color: 'bg-orange-500/10 text-orange-600', sub: 'Baseline 37.0' },
                                    { label: 'Circulatory Pressure', val: admission.vitals[0] ? `${admission.vitals[0].blood_pressure_systolic}/${admission.vitals[0].blood_pressure_diastolic}` : '--/--', unit: 'mmHg', color: 'bg-rose-500/10 text-rose-600', sub: 'Sys/Dia' },
                                    { label: 'Cardiac Tempo', val: admission.vitals[0]?.pulse_rate, unit: 'BPM', color: 'bg-emerald-500/10 text-emerald-600', sub: 'Rhythm: Regular' },
                                    { label: 'Oxygen Saturation', val: admission.vitals[0]?.oxygen_saturation, unit: '%', color: 'bg-blue-500/10 text-blue-600', sub: 'Atmospheric O2' },
                                ].map((v, i) => (
                                    <div key={i} className="group relative bg-card rounded-3xl p-6 border border-border shadow-sm hover:shadow-xl transition-all duration-300">
                                        <div className={cn("w-10 h-10 rounded-2xl mb-4 flex items-center justify-center", v.color)}>
                                            <Activity size={20} />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">{v.label}</p>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-3xl font-black text-foreground tracking-tighter">{v.val || '--'}</p>
                                            <span className="text-[10px] font-black text-muted-foreground uppercase">{v.unit}</span>
                                        </div>
                                        <p className="mt-4 text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">{v.sub}</p>
                                        <div className="absolute inset-0 rounded-3xl bg-primary opacity-0 group-hover:opacity-[0.02] transition-opacity pointer-events-none" />
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <h4 className="font-black flex items-center gap-3 text-[11px] text-foreground uppercase tracking-[0.2em]">
                                        <Clock className="h-4 w-4 text-primary" />
                                        Chronological Clinical Log
                                    </h4>
                                    <span className="px-2 py-0.5 bg-muted rounded-md text-[8px] font-black text-muted-foreground uppercase tracking-widest">{admission.vitals.length} ENTRIES FOUND</span>
                                </div>
                                <div className="bg-card/40 backdrop-blur-md rounded-[32px] border border-border shadow-sm overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-muted/30 text-muted-foreground text-[10px] uppercase tracking-widest font-black">
                                            <tr>
                                                <th className="px-8 py-5">Event Timestamp</th>
                                                <th className="px-8 py-5 text-center">Circulatory (BP)</th>
                                                <th className="px-8 py-5 text-center">Cardiac</th>
                                                <th className="px-8 py-5 text-center">Thermal</th>
                                                <th className="px-8 py-5 text-center">SpO2</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {admission.vitals?.map((v: any) => (
                                                <tr key={v.id} className="hover:bg-muted/10 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <p className="font-bold text-foreground text-xs">{format(new Date(v.recorded_at), 'MMM d, HH:mm')}</p>
                                                        <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">Automated Capture</p>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <span className="text-sm font-black text-rose-600">{v.blood_pressure_systolic}/{v.blood_pressure_diastolic}</span>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <span className="text-sm font-black text-emerald-600">{v.pulse_rate}</span>
                                                        <span className="text-[8px] font-black text-muted-foreground ml-1 uppercase">BPM</span>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <span className="text-sm font-black text-orange-600">{Number(v.temperature).toFixed(1)}°</span>
                                                    </td>
                                                    <td className="px-8 py-5 text-center font-black text-blue-600">
                                                        {Number(v.oxygen_saturation).toFixed(0)}%
                                                    </td>
                                                </tr>
                                            ))}
                                            {admission.vitals.length === 0 && (
                                                <tr><td colSpan={5} className="px-8 py-20 text-center text-muted-foreground font-black italic uppercase tracking-widest opacity-30 text-[10px]">No historical vitals found in clinical ledger</td></tr>
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
                            }} className="bg-card/60 backdrop-blur-xl p-8 rounded-[32px] border border-border shadow-lg space-y-6">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[11px] font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                        <FileStack className="h-4 w-4 text-primary" />
                                        Commit Clinical Observation
                                    </h4>
                                    <select name="category" className="h-10 px-4 bg-muted/20 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/10">
                                        <option value="GENERAL">General Progress</option>
                                        <option value="SOAP">SOAP Note</option>
                                        <option value="NURSING">Nursing Note</option>
                                        <option value="SURGICAL">Surgical Note</option>
                                    </select>
                                </div>
                                <textarea
                                    name="note"
                                    required
                                    rows={4}
                                    className="w-full px-6 py-4 bg-muted/10 border border-border rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none"
                                    placeholder="Enter encrypted clinical observations, treatment response, and diagnostic markers..."
                                />
                                <div className="flex justify-end">
                                    <button type="submit" className="h-12 px-8 bg-primary text-primary-foreground rounded-xl hover:opacity-90 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95">
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
                                        <div key={n.id} className="group relative p-6 bg-card border border-border rounded-[28px] shadow-sm hover:shadow-xl transition-all duration-300">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[9px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full bg-primary/10 text-primary border border-primary/20">{n.category}</span>
                                                    <span className="text-[10px] font-bold text-muted-foreground">{format(new Date(n.created_at), 'MMMM dd, HH:mm')}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] uppercase font-black text-foreground tracking-tighter">Attending: Dr. {n.doctor.last_name}</span>
                                                    <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">Verified Practitioner</p>
                                                </div>
                                            </div>
                                            <p className="text-sm leading-relaxed text-foreground/80 font-medium border-l-2 border-primary/20 pl-6 ml-1">{n.note}</p>
                                            <div className="absolute inset-0 rounded-[28px] bg-primary opacity-0 group-hover:opacity-[0.01] transition-opacity pointer-events-none" />
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
                            }} className="flex flex-wrap md:flex-nowrap gap-6 bg-card/60 backdrop-blur-xl p-8 rounded-[32px] border border-border items-end shadow-2xl">
                                <div className="flex-[3] min-w-[200px] space-y-2">
                                    <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1">Statutory Service/Consultation</label>
                                    <div className="relative group">
                                        <Scan className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input name="description" required className="w-full h-12 pl-12 pr-4 bg-muted/20 border border-border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-sm" placeholder="e.g. Brain MRI with Contrast" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-[140px] space-y-2">
                                    <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1">Base Amount</label>
                                    <input name="amount" type="number" step="0.01" required className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-sm font-mono font-black focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-sm" placeholder="0.00" />
                                </div>
                                <div className="flex-1 min-w-[160px] space-y-2">
                                    <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1">Department</label>
                                    <select name="category" className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer">
                                        <option value="SURGERY">Surgery</option>
                                        <option value="RADIOLOGY">Radiology</option>
                                        <option value="LAB">Laboratory</option>
                                        <option value="CONSULTATION">Specialist</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-3 h-12 px-4 border border-border rounded-2xl bg-muted/20">
                                    <input type="checkbox" name="is_emergency" id="is_emergency" className="w-4 h-4 rounded border-border text-red-600 focus:ring-red-500/10 cursor-pointer" />
                                    <label htmlFor="is_emergency" className="text-[10px] font-black text-red-600 uppercase tracking-widest cursor-pointer">CRITICAL (STAT)</label>
                                </div>
                                <button type="submit" className="h-12 px-8 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-primary/20 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                    POST TO LEDGER
                                </button>
                            </form>

                            <div className="bg-muted/10 p-8 rounded-[40px] border border-border space-y-6 relative overflow-hidden">
                                <div className="flex justify-between items-center relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                            <Pill size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-black text-foreground uppercase tracking-[0.2em]">Clinical Dispensary Stock</h4>
                                            <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">Real-time Pharmacy Inventory Audit</p>
                                        </div>
                                    </div>
                                    <div className="relative w-80 group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            placeholder="Search Dispensary Inventory..."
                                            className="w-full h-11 pl-12 pr-4 bg-card border border-border rounded-2xl text-xs font-bold shadow-sm focus:ring-2 focus:ring-primary/10 outline-none"
                                            value={medSearch}
                                            onChange={(e) => setMedSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {medSearch.length >= 2 && medicines && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                                        {medicines.map((m: any) => (
                                            <div key={m.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:border-primary/40 transition-all shadow-sm group">
                                                <div className="flex-1">
                                                    <p className="text-xs font-black text-foreground uppercase tracking-tight mb-1">{m.drug_name}</p>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Stock: {m.stock_quantity}</span>
                                                        <span className="opacity-20">•</span>
                                                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{format(m.selling_price)} / UNIT</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="number"
                                                        id={`qty-${m.id}`}
                                                        defaultValue={1}
                                                        min={1}
                                                        className="w-14 h-10 px-2 bg-muted/20 border border-border rounded-xl text-xs font-black text-center focus:ring-2 focus:ring-primary/10 outline-none"
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
                                                        className="h-10 px-4 bg-primary/10 text-primary text-[10px] font-black rounded-xl hover:bg-primary hover:text-white transition-all transform active:scale-95"
                                                    >
                                                        SYNC
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
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Dispensary Search Protocol Active</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center px-4">
                                    <h4 className="font-black text-[11px] text-foreground tracking-[0.2em] uppercase">Induction Audit Statement</h4>
                                    <span className="text-[9px] font-black text-muted-foreground tracking-widest uppercase opacity-40">Provisional Draft</span>
                                </div>
                                <div className="bg-card/40 backdrop-blur-md rounded-[40px] border border-border shadow-xl overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-muted/30 text-muted-foreground text-[10px] uppercase font-black tracking-widest">
                                            <tr>
                                                <th className="px-10 py-6">Ledger Date</th>
                                                <th className="px-10 py-6">Fiscal Description</th>
                                                <th className="px-10 py-6 text-center">Protocol Status</th>
                                                <th className="px-10 py-6 text-center">Unit/Day</th>
                                                <th className="px-10 py-6 text-right">Credit Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            <tr className="bg-primary/[0.02] group">
                                                <td className="px-10 py-6">
                                                    <p className="text-xs font-black text-foreground">{format(new Date(admission.admitted_at), 'MMM dd, yyyy')}</p>
                                                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">Induction Event</p>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <p className="text-xs font-black text-foreground uppercase tracking-tight">Stay: {admission.bed.ward.name}</p>
                                                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">{format(admission.stay_details.rate)} Daily Rate</p>
                                                </td>
                                                <td className="px-10 py-6 text-center">
                                                    <span className="px-3 py-1 bg-blue-500/10 text-blue-600 text-[9px] font-black uppercase rounded-lg border border-blue-500/20">RESIDENCY</span>
                                                </td>
                                                <td className="px-10 py-6 text-center font-black text-xs text-foreground/60">{admission.stay_details.days} <span className="text-[9px] uppercase ml-1">Days</span></td>
                                                <td className="px-10 py-6 text-right font-black text-lg text-foreground tracking-tighter">{format(admission.stay_details.stay_cost)}</td>
                                            </tr>
                                            {admission.charges?.map((c: any) => (
                                                <tr key={c.id} className="hover:bg-muted/5 transition-colors group">
                                                    <td className="px-10 py-6">
                                                        <p className="text-xs font-bold text-foreground">{format(new Date(c.date), 'MMM dd, yyyy')}</p>
                                                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">Service Log</p>
                                                    </td>
                                                    <td className="px-10 py-6 relative">
                                                        <div className="flex items-center justify-between group/cell">
                                                            <div>
                                                                <p className="text-xs font-black text-foreground uppercase tracking-tight leading-none">{c.description}</p>
                                                                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1.5">{c.category || 'Clinical service'}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => onConfirmAction('delete-charge', c.id, c.description)}
                                                                className="p-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 active:scale-95"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6 text-center">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <span className={cn(
                                                                'text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-sm',
                                                                c.service_status === 'APPROVED' || c.service_status === 'READY' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                                    c.service_status === 'PENDING_APPROVAL' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse' :
                                                                        'bg-muted text-muted-foreground border-border'
                                                            )}>
                                                                {c.service_status}
                                                            </span>
                                                            {c.service_status === 'PENDING_APPROVAL' && (
                                                                <button
                                                                    onClick={() => approveChargeMutation.mutate(c.id)}
                                                                    disabled={approveChargeMutation.isPending}
                                                                    className="h-7 w-7 bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:opacity-90 transition-all active:scale-95 shadow-md shadow-primary/20"
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <button
                                                                onClick={() => editChargeMutation.mutate({ chargeId: c.id, data: { quantity: Math.max(1, (c.quantity || 1) - 1) } })}
                                                                className="h-6 w-6 rounded-lg bg-muted/40 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-sm font-black active:scale-95"
                                                            >-</button>
                                                            <span className="text-xs font-black min-w-[1.5rem] text-center text-foreground">{c.quantity || 1}</span>
                                                            <button
                                                                onClick={() => editChargeMutation.mutate({ chargeId: c.id, data: { quantity: (c.quantity || 1) + 1 } })}
                                                                className="h-6 w-6 rounded-lg bg-muted/40 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-sm font-black active:scale-95"
                                                            >+</button>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6 text-right font-black text-foreground/70 text-base tracking-tighter">{format(Number(c.amount) * (c.quantity || 1))}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-muted/10 border-t border-border">
                                            <tr className="border-b border-border/30">
                                                <td colSpan={4} className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Internal Gross Estimate</td>
                                                <td className="px-10 py-6 text-right font-black text-3xl text-foreground tracking-tighter">{format(Number(admission.stay_details.stay_cost) + (admission.charges?.reduce((s: any, c: any) => s + (Number(c.amount) * (c.quantity || 1)), 0) || 0))}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan={4} className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Interim Financial Credits</td>
                                                <td className="px-10 py-6 text-right font-black text-2xl text-emerald-600 tracking-tighter">-{format(admission.advance_paid)}</td>
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
                            }} className="bg-emerald-500/[0.03] backdrop-blur-xl p-8 rounded-[32px] border border-emerald-500/20 grid grid-cols-12 gap-6 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                <div className="col-span-12 mb-2 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                                        <Landmark size={18} />
                                    </div>
                                    <h4 className="text-[11px] font-black text-emerald-700 uppercase tracking-[0.2em]">Record Interim Financial Credit</h4>
                                </div>
                                <div className="col-span-12 lg:col-span-4 space-y-2">
                                    <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-1">Credit Amount</label>
                                    <input name="amount" type="number" step="0.01" required className="w-full h-12 px-4 bg-card border border-emerald-500/20 rounded-2xl text-sm font-black focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" placeholder="0.00" />
                                </div>
                                <div className="col-span-12 lg:col-span-4 space-y-2">
                                    <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-1">Settlement Method</label>
                                    <select name="method" className="w-full h-12 px-4 bg-card border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-emerald-500/20">
                                        <option value="CASH">Cash Holdings</option>
                                        <option value="CARD">Debit/Credit Instrument</option>
                                        <option value="BANK_TRANSFER">Direct Registry Transfer</option>
                                        <option value="ONLINE">UPI Digital Gateway</option>
                                    </select>
                                </div>
                                <div className="col-span-12 lg:col-span-3 space-y-2">
                                    <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-1">Audit Reference</label>
                                    <input name="notes" className="w-full h-12 px-4 bg-card border border-emerald-500/20 rounded-2xl text-sm font-bold outline-none" placeholder="Receipt / Txn ID" />
                                </div>
                                <div className="col-span-12 lg:col-span-1 pt-6">
                                    <button type="submit" className="w-full h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center hover:opacity-90 transition-all active:scale-[0.98] shadow-xl shadow-emerald-600/20">
                                        <Plus className="h-6 w-6" />
                                    </button>
                                </div>
                            </form>

                            <div className="space-y-6">
                                <h4 className="font-black flex items-center gap-3 text-[11px] text-foreground tracking-[0.2em] uppercase px-2">
                                    <Clock className="h-4 w-4 text-primary" />
                                    Transaction Registry History
                                </h4>
                                <div className="bg-card/40 backdrop-blur-md rounded-[40px] border border-border shadow-xl overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-muted/30 text-muted-foreground text-[10px] uppercase font-black tracking-widest">
                                            <tr>
                                                <th className="px-10 py-6">Settlement Date</th>
                                                <th className="px-10 py-6">Instrument Type</th>
                                                <th className="px-10 py-6">Audit ID</th>
                                                <th className="px-10 py-6">Reference Notes</th>
                                                <th className="px-10 py-6 text-right">Credit Value</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {admission.payments?.map((p: any) => (
                                                <tr key={p.id} className="hover:bg-muted/5 transition-colors">
                                                    <td className="px-10 py-6 text-xs font-bold text-foreground">{format(new Date(p.payment_date), 'MMM d, HH:mm')}</td>
                                                    <td className="px-10 py-6">
                                                        <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg border border-emerald-500/20">{p.method}</span>
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <span className="text-[10px] font-mono font-black text-muted-foreground uppercase opacity-60">{p.id.slice(0, 12).toUpperCase()}</span>
                                                    </td>
                                                    <td className="px-10 py-6 text-xs font-medium text-muted-foreground">{p.notes || '-'}</td>
                                                    <td className="px-10 py-6 text-right font-black text-emerald-600 text-lg tracking-tighter">{format(p.amount)}</td>
                                                </tr>
                                            ))}
                                            {(!admission.payments || admission.payments.length === 0) && (
                                                <tr><td colSpan={5} className="px-10 py-24 text-center text-muted-foreground font-black italic uppercase tracking-[0.2em] opacity-30 text-[10px]">No finalized transactions recorded in ledger</td></tr>
                                            )}
                                        </tbody>
                                        <tfoot className="bg-emerald-500/[0.03] border-t border-emerald-500/20">
                                            <tr>
                                                <td colSpan={4} className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800">Aggregate Credited Capital</td>
                                                <td className="px-10 py-6 text-right font-black text-emerald-800 text-3xl tracking-tighter">{format(admission.advance_paid)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-8 border-t border-border bg-muted/30 flex justify-between items-center relative z-10">
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] italic opacity-40">
                        * Residency accrual snapshot: {formatDate(new Date(), 'MMM dd, HH:mm')}.
                    </p>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="h-12 px-10 bg-card border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all active:scale-95 shadow-sm">Dissolve Tray</button>
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
            onClose();
        }
    });

    return (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-border animate-in zoom-in-95 duration-300 relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />

                <div className="p-8 border-b border-border bg-muted/20 flex justify-between items-center relative z-10">
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter text-foreground uppercase">Initialize Ward Station</h2>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Deploy New Clinical Infrastructure</p>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-2xl hover:bg-muted transition-all text-2xl border border-border shadow-sm">×</button>
                </div>
                <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="p-8 space-y-6 relative z-10">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 space-y-2">
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1">Ward Designation</label>
                            <input
                                {...register('name', { required: true })}
                                className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                placeholder="e.g. Critical Care Complex"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1">Registry Code</label>
                            <input
                                {...register('code', { required: true })}
                                className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-sm font-mono font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                placeholder="e.g. CCC-01"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1">Classification</label>
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
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1">Daily Capitation Rate</label>
                            <input
                                type="number"
                                {...register('daily_rate', { valueAsNumber: true, required: true })}
                                className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-sm font-black focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1">Asset Capacity</label>
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
                            {mutation.isPending ? 'DEPLOYING...' : 'FINALIZE DEPLOYMENT'}
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
            onClose();
        }
    });

    return (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-border animate-in zoom-in-95 duration-300 relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />

                <div className="p-8 border-b border-border bg-muted/20 flex justify-between items-center relative z-10">
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter text-foreground uppercase">Modify Ward Station</h2>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Reconfiguring {ward.name}</p>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-2xl hover:bg-muted transition-all text-2xl border border-border shadow-sm">×</button>
                </div>

                <form onSubmit={handleSubmit((data) => editMutation.mutate({ ...data, daily_rate: Number(data.daily_rate) }))} className="p-8 space-y-6 relative z-10">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 space-y-2">
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1">Ward Designation</label>
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
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1">Internal Registry Code</label>
                            <input
                                {...register('code', { required: true })}
                                className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-sm font-mono font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="block text-[10px] font-black text-primary uppercase tracking-widest ml-1">Daily Capitation Rate</label>
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
                            {editMutation.isPending ? 'UPDATE PROPAGATING...' : 'FINALIZE RECONFIG'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function TransferModal({ admissionId, currentBed, onClose }: { admissionId: string, currentBed: string, onClose: () => void }) {
    const queryClient = useQueryClient();
    const { data: wards } = useQuery({ queryKey: ['wards'], queryFn: async () => (await api.get('/wards')).data });
    const { register, handleSubmit, watch } = useForm();
    const selectedWardId = watch('ward_id');
    const { format } = useCurrency();

    const transferMutation = useMutation({
        mutationFn: async (data: any) => {
            await api.post(`/wards/admissions/${admissionId}/transfer`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wards'] });
            onClose();
        },
        onError: (err: any) => alert(err.response?.data?.message || 'Transfer failed')
    });

    const targetWard = wards?.find((w: any) => w.id === selectedWardId);
    const availableBeds = targetWard?.beds.filter((b: any) => b.status === 'AVAILABLE') || [];

    return (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-xl rounded-[40px] shadow-2xl border border-border animate-in zoom-in-95 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />

                <div className="p-8 border-b border-border bg-muted/20 relative z-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter text-foreground flex items-center gap-3 uppercase">
                            <ArrowRightLeft className="h-6 w-6 text-primary" />
                            Clinical Relocation
                        </h2>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Reassigning patient from current asset: {currentBed}</p>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-2xl hover:bg-muted transition-all text-2xl border border-border shadow-sm">×</button>
                </div>

                <form onSubmit={handleSubmit((data) => transferMutation.mutate(data))} className="p-8 space-y-6 relative z-10">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase text-primary tracking-widest ml-1">Destination Ward</label>
                            <select {...register('ward_id', { required: true })} className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/10">
                                <option value="">Select Target Destination...</option>
                                {wards?.map((w: any) => (
                                    <option key={w.id} value={w.id}>{w.name} ({format(w.daily_rate)})</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase text-primary tracking-widest ml-1">Allocated Asset</label>
                            <select {...register('new_bed_id', { required: true })} disabled={!selectedWardId} className="w-full h-12 px-4 bg-muted/20 border border-border rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/10 transition-all">
                                <option value="">Select Bed...</option>
                                {availableBeds.map((b: any) => (
                                    <option key={b.id} value={b.id}>{b.bed_number} • {b.bed_type}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="block text-[10px] font-black uppercase text-primary tracking-widest ml-1">Clinical Rationale for Relocation</label>
                            <textarea {...register('reason')} className="w-full h-32 px-4 py-4 bg-muted/20 border border-border rounded-[24px] text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none" placeholder="Provide medical justification for asset reassignment..."></textarea>
                        </div>
                    </div>

                    <div className="pt-8 flex gap-4">
                        <button type="button" onClick={onClose} className="flex-1 h-14 border-2 border-border rounded-[20px] hover:bg-muted transition-all text-xs font-black uppercase tracking-widest active:scale-95">Cancel</button>
                        <button type="submit" disabled={transferMutation.isPending} className="flex-1 h-14 bg-primary text-primary-foreground rounded-[20px] text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50">
                            {transferMutation.isPending ? 'SYNCHRONIZING RELOCATION...' : 'AUTHORIZE RELOCATION'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
