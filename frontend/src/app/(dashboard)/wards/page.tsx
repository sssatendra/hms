'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Building2, Plus, Users, Bed, User,
    ArrowRightLeft, LogOut, CheckCircle, AlertCircle, Clock,
    Activity, FileText, BadgeIndianRupee, Stethoscope, CreditCard,
    Search, Pill, Trash2, MoreVertical, Settings, ShieldAlert
} from 'lucide-react';
import { coreApi as api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Portal } from '@/components/shared/portal';

export default function WardsPage() {
    const [selectedWard, setSelectedWard] = useState<string | null>(null);
    const [showAdmitModal, setShowAdmitModal] = useState(false);
    const [showCreateWardModal, setShowCreateWardModal] = useState(false);
    const [showEditWardModal, setShowEditWardModal] = useState<any>(null);
    const [showTransferModal, setShowTransferModal] = useState<{ admissionId: string, currentBed: string } | null>(null);
    const [showAdmissionDetail, setShowAdmissionDetail] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ type: 'decommission' | 'discharge' | 'delete-charge', id: string, extra?: any } | null>(null);
    const queryClient = useQueryClient();

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
            // We'll need to add an endpoint or filter for active admissions
            // For now we'll assume the /wards endpoint returns beds with their current admission
            const res = await api.get('/wards');
            const allBeds = res.data.flatMap((w: any) => w.beds);
            return allBeds.filter((b: any) => b.status === 'OCCUPIED');
        }
    });

    // Separate query for patients to admit
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
        return <div className="p-8 text-center text-muted-foreground">Loading wards...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-2">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">Ward & Occupancy Station</h1>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] mt-2">Real-time hospital admission monitoring</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowCreateWardModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 transition-all text-sm font-black shadow-sm"
                    >
                        <Building2 className="h-4 w-4 text-primary" />
                        NEW WARD STATION
                    </button>
                    <button
                        onClick={() => setShowAdmitModal(true)}
                        className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-all text-sm font-black shadow-lg shadow-primary/20 active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        ADMIT PATIENT
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-2">
                {wards?.map((ward: any) => {
                    const occupiedCount = ward.beds.filter((b: any) => b.status === 'OCCUPIED').length;
                    const occupancyRate = (occupiedCount / ward.beds.length) * 100 || 0;

                    return (
                        <div key={ward.id} className="relative group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col min-h-[280px]">
                            {/* Medical Status Bar */}
                            <div className={cn(
                                "h-1.5 w-full",
                                occupancyRate > 90 ? "bg-red-500" : occupancyRate > 70 ? "bg-orange-400" : "bg-blue-500"
                            )} />

                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                            <Building2 className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white leading-none mb-1">{ward.name}</h3>
                                            <div className="flex gap-1 items-center">
                                                <span className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 text-[8px] font-black uppercase tracking-widest rounded text-slate-500">{ward.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setShowEditWardModal(ward)}
                                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Settings className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() => setConfirmAction({ type: 'decommission', id: ward.id, extra: ward.name })}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Bed Occupancy Matrix - More Compact */}
                                <div className="flex-1 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800/50 mb-3">
                                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 gap-1.5">
                                        {ward.beds.map((bed: any) => (
                                            <div
                                                key={bed.id}
                                                onClick={() => {
                                                    if (bed.status === 'OCCUPIED' && bed.admissions?.[0]) {
                                                        setShowAdmissionDetail(bed.admissions[0].id);
                                                    }
                                                }}
                                                className={cn(
                                                    "relative group/bed h-9 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer",
                                                    bed.status === 'AVAILABLE'
                                                        ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-blue-500 hover:text-blue-600 shadow-sm"
                                                        : "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-600 shadow-inner"
                                                )}
                                            >
                                                <span className="text-[8px] font-black tracking-tighter leading-none">{bed.bed_number}</span>
                                                {bed.status === 'OCCUPIED' && bed.admissions?.[0] ? (
                                                    <span className="text-[6px] font-black uppercase truncate w-full px-1 text-center opacity-70">
                                                        {bed.admissions[0].patient.last_name}
                                                    </span>
                                                ) : (
                                                    <span className="text-[6px] opacity-30 font-bold uppercase tracking-tighter">Ready</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-900 dark:text-white leading-none uppercase tracking-tighter">{occupiedCount} / {ward.beds.length} PATIENTS</span>
                                        <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                            <div className={cn("h-full rounded-full", occupancyRate > 90 ? "bg-red-500" : "bg-primary")} style={{ width: `${occupancyRate}%` }} />
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-primary leading-none mb-0.5">${Number(ward.daily_rate).toFixed(0)}<span className="text-[8px] text-slate-400 ml-0.5">/D</span></p>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{occupancyRate.toFixed(0)}% FULL</span>
                                    </div>
                                </div>
                            </div>
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
                title={confirmAction?.type === 'decommission' ? 'Decommission Ward' : confirmAction?.type === 'discharge' ? 'Patient Discharge' : 'Remove Charge'}
                description={confirmAction?.type === 'decommission'
                    ? `Are you sure you want to decommission ${confirmAction?.extra}? All associated beds will be removed.`
                    : confirmAction?.type === 'discharge'
                        ? 'Are you sure you want to discharge this patient? This will finalize their stay and clear the bed.'
                        : `Are you sure you want to remove the charge for "${confirmAction?.extra}"?`}
                confirmText={confirmAction?.type === 'decommission' ? 'Decommission' : confirmAction?.type === 'discharge' ? 'Discharge' : 'Remove Charge'}
                isLoading={deleteWardMutation.isPending || dischargeMutation.isPending || deleteChargeMutation.isPending}
            />
        </div>
    );
}



function AdmitModal({ onClose, patients, wards }: any) {
    const { register, handleSubmit } = useForm();
    const queryClient = useQueryClient();
    const [selectedWardId, setSelectedWardId] = useState('');

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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card w-full max-w-lg rounded-xl shadow-xl overflow-hidden border border-border">
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h2 className="text-lg font-bold">Patient Admission</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">×</button>
                </div>
                <form onSubmit={handleSubmit((data) => admitMutation.mutate(data))} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Select Patient</label>
                        <select
                            {...register('patient_id')}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                            required
                        >
                            <option value="">Select a patient...</option>
                            {patients?.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.mrn})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Ward</label>
                            <select
                                value={selectedWardId}
                                onChange={(e) => setSelectedWardId(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                                required
                            >
                                <option value="">Select ward...</option>
                                {wards?.map((w: any) => (
                                    <option key={w.id} value={w.id}>{w.name} (${Number(w.daily_rate)})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Bed</label>
                            <select
                                {...register('bed_id')}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                                required
                                disabled={!selectedWardId}
                            >
                                <option value="">Select bed...</option>
                                {availableBeds.map((b: any) => (
                                    <option key={b.id} value={b.id}>{b.bed_number} ({b.bed_type})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Diagnosis</label>
                        <input
                            {...register('diagnosis_on_admission')}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                            placeholder="Primary diagnosis"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Advance Payment</label>
                        <input
                            type="number"
                            {...register('advance_paid', { valueAsNumber: true })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                            defaultValue={0}
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={admitMutation.isPending}
                            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                        >
                            {admitMutation.isPending ? 'Admitting...' : 'Confirm Admission'}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 font-sans text-foreground overflow-hidden">
            <div className="bg-card w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-border flex flex-col my-auto animate-in fade-in zoom-in duration-200 max-h-[95vh]">
                <div className="p-6 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary ring-1 ring-primary/20">
                            <Stethoscope className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-black tracking-tight leading-none">{admission.patient.first_name} {admission.patient.last_name}</h2>
                                <span className="px-2 py-0.5 bg-background border border-border text-[9px] font-black uppercase rounded-lg tracking-widest">{admission.patient.mrn}</span>
                            </div>
                            <p className="text-xs text-muted-foreground font-bold mt-1.5 uppercase tracking-widest">
                                <span className="text-foreground">{admission.bed.ward.name}</span> • Bed <span className="text-foreground">{admission.bed.bed_number}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-2xl font-black text-primary leading-none mb-1">${Number(admission.running_total).toFixed(2)}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">Running Balance</p>
                        </div>
                        <div className="flex gap-2 mr-3">
                            <button
                                onClick={() => onTransfer(admission.id, admission.bed.bed_number)}
                                className="px-4 py-2 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-xl border border-blue-100 hover:bg-blue-500 hover:text-white transition-all shadow-sm flex items-center gap-2"
                            >
                                <ArrowRightLeft className="h-3.5 w-3.5" />
                                TRANSFER
                            </button>
                            <button
                                onClick={() => onConfirmAction('discharge', admission.id)}
                                className="px-4 py-2 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-xl border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center gap-2"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                DISCHARGE
                            </button>
                        </div>
                        <div className="h-10 w-[1px] bg-border mx-2" />
                        <button onClick={onClose} className="h-10 w-10 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all border border-border shadow-sm text-2xl">×</button>
                    </div>
                </div>

                <div className="flex px-6 bg-muted/10 border-b border-border">
                    {[
                        { id: 'vitals', label: 'Vitals', icon: Activity },
                        { id: 'notes', label: 'Clinical Notes', icon: FileText },
                        { id: 'charges', label: 'Itemized Charges', icon: BadgeIndianRupee },
                        { id: 'payments', label: 'Payment History', icon: CreditCard },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all relative ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'animate-pulse' : ''}`} />
                            {tab.label}
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {activeTab === 'vitals' && (
                        <div className="space-y-6">
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
                            }} className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex gap-4 items-end shadow-sm">
                                <div className="flex-1 grid grid-cols-6 gap-3">
                                    <div>
                                        <label className="block text-[9px] font-black text-blue-700 uppercase mb-1 ml-1">Temp (°C)</label>
                                        <input name="temp" type="number" step="0.1" required className="w-full px-3 py-1.5 bg-background border border-blue-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="37.0" />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-blue-700 uppercase mb-1 ml-1">BP (SYS)</label>
                                        <input name="sys" type="number" required className="w-full px-3 py-1.5 bg-background border border-blue-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="120" />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-blue-700 uppercase mb-1 ml-1">BP (DIA)</label>
                                        <input name="dia" type="number" required className="w-full px-3 py-1.5 bg-background border border-blue-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="80" />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-blue-700 uppercase mb-1 ml-1">Pulse</label>
                                        <input name="pulse" type="number" required className="w-full px-3 py-1.5 bg-background border border-blue-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="72" />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-blue-700 uppercase mb-1 ml-1">SpO2 (%)</label>
                                        <input name="spo2" type="number" required className="w-full px-3 py-1.5 bg-background border border-blue-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="98" />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-blue-700 uppercase mb-1 ml-1">Notes</label>
                                        <input name="notes" className="w-full px-3 py-1.5 bg-background border border-blue-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Notes..." />
                                    </div>
                                </div>
                                <button type="submit" className="h-9 px-6 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-500/20 text-[10px] font-black uppercase">
                                    SAVE VITALS
                                </button>
                            </form>

                            <div className="grid grid-cols-4 gap-4">
                                {[
                                    { label: 'Temp', val: admission.vitals[0]?.temperature, unit: '°C', color: 'text-orange-600' },
                                    { label: 'BP', val: admission.vitals[0] ? `${admission.vitals[0].blood_pressure_systolic}/${admission.vitals[0].blood_pressure_diastolic}` : '--/--', unit: 'mmHg', color: 'text-red-600' },
                                    { label: 'Pulse', val: admission.vitals[0]?.pulse_rate, unit: 'bpm', color: 'text-green-600' },
                                    { label: 'SpO2', val: admission.vitals[0]?.oxygen_saturation, unit: '%', color: 'text-blue-600' },
                                ].map((v, i) => (
                                    <div key={i} className="p-4 bg-muted/20 rounded-2xl border border-border/50">
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1.5">{v.label}</p>
                                        <div className="flex items-baseline gap-1">
                                            <p className={cn("text-2xl font-black", v.color)}>{v.val || '--'}</p>
                                            <span className="text-[10px] font-bold text-muted-foreground">{v.unit}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-black flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
                                    <Clock className="h-3.5 w-3.5" />
                                    Vitals History Log
                                </h4>
                                <div className="border border-border rounded-2xl overflow-hidden shadow-sm bg-card">
                                    <table className="w-full text-xs">
                                        <thead className="bg-muted/50 text-muted-foreground text-[9px] uppercase tracking-widest font-black">
                                            <tr>
                                                <th className="px-6 py-3 text-left">Timestamp</th>
                                                <th className="px-6 py-3 text-left">BP (mmHg)</th>
                                                <th className="px-6 py-3 text-left">Pulse</th>
                                                <th className="px-6 py-3 text-left">Temp</th>
                                                <th className="px-6 py-3 text-left">Oxygen</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {admission.vitals?.map((v: any) => (
                                                <tr key={v.id} className="hover:bg-muted/10 font-medium">
                                                    <td className="px-6 py-3 text-muted-foreground">{format(new Date(v.recorded_at), 'MMM d, HH:mm')}</td>
                                                    <td className="px-6 py-3 font-black">{v.blood_pressure_systolic}/{v.blood_pressure_diastolic}</td>
                                                    <td className="px-6 py-3 font-black text-green-600">{v.pulse_rate} <span className="text-[9px] font-normal uppercase">bpm</span></td>
                                                    <td className="px-6 py-3 font-black text-orange-600">{Number(v.temperature).toFixed(1)}°C</td>
                                                    <td className="px-6 py-3 font-black text-blue-600">{Number(v.oxygen_saturation).toFixed(0)}%</td>
                                                </tr>
                                            ))}
                                            {admission.vitals.length === 0 && (
                                                <tr><td colSpan={5} className="px-6 py-10 text-center text-muted-foreground font-bold italic uppercase tracking-widest opacity-30">No clinical vitals recorded</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div className="space-y-8">
                            <form onSubmit={(e: any) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                addNoteMutation.mutate({
                                    note: formData.get('note'),
                                    category: formData.get('category')
                                });
                                e.target.reset();
                            }} className="bg-muted/10 p-6 rounded-2xl border border-dashed border-border space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-bold text-primary">Add New Clinical Note</h4>
                                    <select name="category" className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-bold">
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
                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="Enter detailed observations, patient response to treatment, etc..."
                                />
                                <div className="flex justify-end">
                                    <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95">
                                        Post Note
                                    </button>
                                </div>
                            </form>

                            <div className="space-y-4">
                                <h4 className="font-bold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-widest">Clinical History</h4>
                                <div className="grid gap-4">
                                    {admission.progress_notes?.map((n: any) => (
                                        <div key={n.id} className="p-5 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-full bg-primary/10 text-primary border border-primary/20">{n.category}</span>
                                                    <span className="text-[10px] font-bold text-muted-foreground">{format(new Date(n.created_at), 'MMMM dd, p')}</span>
                                                </div>
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground">By Dr. {n.doctor.last_name}</span>
                                            </div>
                                            <p className="text-sm leading-relaxed text-foreground/80 font-medium">{n.note}</p>
                                        </div>
                                    ))}
                                    {admission.progress_notes.length === 0 && (
                                        <div className="text-center py-16 border-2 border-dashed border-border rounded-3xl">
                                            <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                            <p className="text-sm text-muted-foreground font-medium">No progress notes recorded for this stay.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'charges' && (
                        <div className="space-y-8">
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
                            }} className="flex flex-wrap md:flex-nowrap gap-2 bg-primary/[0.03] p-3 rounded-xl border border-primary/10 items-end shadow-sm">
                                <div className="flex-[3] min-w-[200px]">
                                    <label className="block text-[8px] font-black text-primary uppercase tracking-widest mb-1 ml-1 opacity-60">Service Description</label>
                                    <input name="description" required className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-[11px] font-bold outline-none focus:ring-1 focus:ring-primary shadow-sm" placeholder="e.g. Brain MRI with contrast" />
                                </div>
                                <div className="flex-1 min-w-[100px]">
                                    <label className="block text-[8px] font-black text-primary uppercase tracking-widest mb-1 ml-1 opacity-60">Amount ($)</label>
                                    <input name="amount" type="number" step="0.01" required className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-[11px] font-black outline-none focus:ring-1 focus:ring-primary shadow-sm" placeholder="0.00" />
                                </div>
                                <div className="flex-1 min-w-[120px]">
                                    <label className="block text-[8px] font-black text-primary uppercase tracking-widest mb-1 ml-1 opacity-60">Department</label>
                                    <select name="category" className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-[9px] font-black uppercase outline-none shadow-sm cursor-pointer h-[26px]">
                                        <option value="SURGERY">Surgery</option>
                                        <option value="RADIOLOGY">Radiology</option>
                                        <option value="LAB">Laboratory</option>
                                        <option value="CONSULTATION">Specialist</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-1.5 mb-1 px-2 border-l border-primary/10 ml-1">
                                    <input type="checkbox" name="is_emergency" id="is_emergency" className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary" />
                                    <label htmlFor="is_emergency" className="text-[9px] font-black text-red-600 uppercase tracking-widest cursor-pointer">STAT</label>
                                </div>
                                <button type="submit" className="h-[26px] px-4 bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20 text-[9px] font-black uppercase whitespace-nowrap">
                                    BILL SERVICE
                                </button>
                            </form>

                            <div className="bg-muted/10 p-6 rounded-2xl border border-border space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-xs font-black text-primary uppercase tracking-widest">Add Medications (Pharmacy Stock)</h4>
                                    <div className="relative w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                        <input
                                            placeholder="Search medicine name..."
                                            className="w-full pl-9 pr-4 py-1.5 bg-background border border-border rounded-lg text-xs"
                                            value={medSearch}
                                            onChange={(e) => setMedSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {medSearch.length >= 2 && medicines && (
                                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                                        {medicines.map((m: any) => (
                                            <div key={m.id} className="flex items-center justify-between p-2 bg-background border border-border rounded-xl hover:border-primary/30 transition-all group">
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold">{m.drug_name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Stock: {m.stock_quantity} • ${Number(m.selling_price).toFixed(2)}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        id={`qty-${m.id}`}
                                                        defaultValue={1}
                                                        min={1}
                                                        className="w-12 px-2 py-1 border border-border rounded-lg text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
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
                                                        className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg hover:bg-primary hover:text-white transition-all transform group-active:scale-95"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {medicines.length === 0 && <p className="text-center py-4 text-xs text-muted-foreground italic">No medicines found matching "{medSearch}"</p>}
                                    </div>
                                )}
                                {medSearch.length > 0 && medSearch.length < 2 && (
                                    <p className="text-[10px] text-muted-foreground italic">Type at least 2 characters to search...</p>
                                )}
                                {!medSearch && (
                                    <div className="text-center py-4 text-muted-foreground/40">
                                        <Pill className="h-8 w-8 mx-auto mb-2" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Search medicines above to add</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-bold text-sm text-muted-foreground tracking-widest uppercase">Itemized Invoice Draft</h4>
                                <div className="border border-border rounded-2xl overflow-hidden shadow-sm">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase font-black tracking-widest">
                                            <tr>
                                                <th className="px-6 py-4 text-left">Dated</th>
                                                <th className="px-6 py-4 text-left">Description</th>
                                                <th className="px-6 py-4 text-left">Status</th>
                                                <th className="px-6 py-4 text-left text-center">Qty</th>
                                                <th className="px-6 py-4 text-right">Total Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            <tr className="bg-primary/[0.03]">
                                                <td className="px-6 py-4 text-xs font-bold text-muted-foreground">{format(new Date(admission.admitted_at), 'MMM dd')}</td>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold">Accommodation: {admission.bed.ward.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Per Day Rate: ${Number(admission.stay_details.rate).toFixed(2)}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold">{admission.stay_details.days} Days</td>
                                                <td className="px-6 py-4 text-right font-black text-primary">${Number(admission.stay_details.stay_cost).toFixed(2)}</td>
                                            </tr>
                                            {admission.charges?.map((c: any) => (
                                                <tr key={c.id} className="hover:bg-muted/5 group/row">
                                                    <td className="px-6 py-4 text-xs font-bold text-muted-foreground">{format(new Date(c.date), 'MMM dd')}</td>
                                                    <td className="px-6 py-4 flex items-center justify-between pr-10">
                                                        <p className="font-semibold">{c.description}</p>
                                                        <button
                                                            onClick={() => onConfirmAction('delete-charge', c.id, c.description)}
                                                            className="p-1 px-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-all opacity-0 group-hover/row:opacity-100"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn(
                                                                'text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-lg border',
                                                                c.service_status === 'APPROVED' || c.service_status === 'READY' ? 'bg-green-100 text-green-700 border-green-200' :
                                                                    c.service_status === 'PENDING_APPROVAL' ? 'bg-orange-100 text-orange-700 border-orange-200 animate-pulse' :
                                                                        'bg-muted text-muted-foreground border-border'
                                                            )}>
                                                                {c.service_status}
                                                            </span>
                                                            {c.service_status === 'PENDING_APPROVAL' && (
                                                                <button
                                                                    onClick={() => approveChargeMutation.mutate(c.id)}
                                                                    disabled={approveChargeMutation.isPending}
                                                                    className="p-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-all"
                                                                    title="Approve Procedure"
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
                                                                className="h-5 w-5 rounded bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-all text-[10px]"
                                                            >-</button>
                                                            <span className="text-xs font-black min-w-[1rem] text-center">{c.quantity || 1}</span>
                                                            <button
                                                                onClick={() => editChargeMutation.mutate({ chargeId: c.id, data: { quantity: (c.quantity || 1) + 1 } })}
                                                                className="h-5 w-5 rounded bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-all text-[10px]"
                                                            >+</button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-foreground/80">${(Number(c.amount) * (c.quantity || 1)).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-muted/30 border-t border-border">
                                            <tr className="border-b border-border/50">
                                                <td colSpan={3} className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gross Admission Total</td>
                                                <td className="px-6 py-3 text-right font-black text-lg">${(Number(admission.stay_details.stay_cost) + (admission.charges?.reduce((s: any, c: any) => s + (Number(c.amount) * (c.quantity || 1)), 0) || 0)).toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan={3} className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-green-600">Advance/Interim Payments</td>
                                                <td className="px-6 py-3 text-right font-black text-green-600">-${Number(admission.advance_paid).toFixed(2)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="space-y-8">
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
                            }} className="bg-green-50/50 p-6 rounded-2xl border border-green-200 grid grid-cols-12 gap-4">
                                <div className="col-span-12 mb-2">
                                    <h4 className="text-xs font-black text-green-700 uppercase tracking-widest">Record Interim Payment</h4>
                                </div>
                                <div className="col-span-4">
                                    <label className="block text-[10px] font-bold text-green-700 mb-1 uppercase">Amount ($)</label>
                                    <input name="amount" type="number" step="0.01" required className="w-full px-4 py-2.5 bg-background border border-green-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/20" placeholder="0.00" />
                                </div>
                                <div className="col-span-4">
                                    <label className="block text-[10px] font-bold text-green-700 mb-1 uppercase">Method</label>
                                    <select name="method" className="w-full px-4 py-2.5 bg-background border border-green-200 rounded-xl text-sm font-bold outline-none">
                                        <option value="CASH">Cash</option>
                                        <option value="CARD">Card</option>
                                        <option value="BANK_TRANSFER">Bank Transfer</option>
                                        <option value="ONLINE">UPI / Online</option>
                                    </select>
                                </div>
                                <div className="col-span-3">
                                    <label className="block text-[10px] font-bold text-green-700 mb-1 uppercase">Notes</label>
                                    <input name="notes" className="w-full px-4 py-2.5 bg-background border border-green-200 rounded-xl text-sm outline-none" placeholder="Recpt #" />
                                </div>
                                <div className="col-span-1 pt-5">
                                    <button type="submit" className="w-full h-11 bg-green-600 text-white rounded-xl flex items-center justify-center hover:bg-green-700 transition-all active:scale-95 shadow-lg shadow-green-600/20">
                                        <Plus className="h-5 w-5" />
                                    </button>
                                </div>
                            </form>

                            <div className="space-y-4">
                                <h4 className="font-bold text-sm text-muted-foreground tracking-widest uppercase">Transaction History</h4>
                                <div className="border border-border rounded-2xl overflow-hidden shadow-sm">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase font-black tracking-widest">
                                            <tr>
                                                <th className="px-6 py-4 text-left">Date</th>
                                                <th className="px-6 py-4 text-left">Method</th>
                                                <th className="px-6 py-4 text-left">Notes</th>
                                                <th className="px-6 py-4 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {admission.payments?.map((p: any) => (
                                                <tr key={p.id} className="hover:bg-muted/5 font-medium">
                                                    <td className="px-6 py-3 text-muted-foreground">{format(new Date(p.payment_date), 'MMM d, HH:mm')}</td>
                                                    <td className="px-6 py-3">
                                                        <p className="font-bold text-green-700">${Number(p.amount).toFixed(2)}</p>
                                                        <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">{p.method}</p>
                                                    </td>
                                                    <td className="px-6 py-3 text-xs font-mono font-bold text-slate-500 uppercase tracking-tighter">{p.id.slice(0, 8)}-RX</td>
                                                    <td className="px-6 py-3 text-muted-foreground">{p.notes || '-'}</td>
                                                </tr>
                                            ))}
                                            {(!admission.payments || admission.payments.length === 0) && (
                                                <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground font-medium italic">No payments recorded for this admission yet.</td></tr>
                                            )}
                                        </tbody>
                                        <tfoot className="bg-green-50 border-t border-border">
                                            <tr>
                                                <td colSpan={3} className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-green-800">Total Amount Paid</td>
                                                <td className="px-6 py-3 text-right font-black text-green-800 text-lg">${Number(admission.advance_paid).toFixed(2)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-border bg-muted/20 flex justify-between items-center">
                    <p className="text-xs text-muted-foreground font-medium italic">
                        * All charges in USD. Stay calculated until {format(new Date(), 'MMM dd, HH:mm')}.
                    </p>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-6 py-2 border border-border rounded-xl text-sm font-bold hover:bg-muted transition-all">Close Tray</button>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card w-full max-w-lg rounded-xl shadow-xl border border-border animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                    <h2 className="text-lg font-bold">Create New Ward</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">×</button>
                </div>
                <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Ward Name</label>
                            <input
                                {...register('name', { required: true })}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                                placeholder="e.g. Intensive Care Unit"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Ward Code</label>
                            <input
                                {...register('code', { required: true })}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                                placeholder="e.g. ICU-A"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Ward Type</label>
                            <select
                                {...register('type', { required: true })}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                            >
                                <option value="GENERAL">General</option>
                                <option value="ICU">ICU</option>
                                <option value="EMERGENCY">Emergency</option>
                                <option value="MATERNITY">Maternity</option>
                                <option value="PEDIATRIC">Pediatric</option>
                                <option value="PRIVATE">Private</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Daily Rate ($)</label>
                            <input
                                type="number"
                                {...register('daily_rate', { valueAsNumber: true, required: true })}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Total Beds</label>
                            <input
                                type="number"
                                {...register('total_beds', { valueAsNumber: true, required: true })}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                                placeholder="10"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold disabled:opacity-50 hover:bg-primary/90 transition-all"
                        >
                            {mutation.isPending ? 'Saving...' : 'Create Ward'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function EditWardModal({ ward, onClose }: { ward: any, onClose: () => void }) {
    const queryClient = useQueryClient();
    const { register, handleSubmit, formState: { errors } } = useForm({
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-none">Modify Ward Station</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Update configuration for {ward.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors font-bold text-slate-400 hover:text-slate-900">×</button>
                </div>

                <form onSubmit={handleSubmit((data) => editMutation.mutate({ ...data, daily_rate: Number(data.daily_rate) }))} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Ward Name</label>
                            <input
                                {...register('name', { required: true })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Type</label>
                            <select
                                {...register('type', { required: true })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold"
                            >
                                <option value="GENERAL">General</option>
                                <option value="ICU">ICU</option>
                                <option value="EMERGENCY">Emergency</option>
                                <option value="PEDIATRIC">Pediatric</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Internal Code</label>
                            <input
                                {...register('code', { required: true })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Daily Rate ($)</label>
                            <input
                                type="number"
                                {...register('daily_rate', { required: true })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black text-primary focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all dark:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={editMutation.isPending}
                            className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {editMutation.isPending ? 'Propagating...' : 'Update Station'}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <ArrowRightLeft className="h-5 w-5 text-primary" />
                        PATIENT TRANSFER
                    </h2>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Reassigning patient from {currentBed}</p>
                </div>

                <form onSubmit={handleSubmit((data) => transferMutation.mutate(data))} className="p-8 space-y-6">
                    <div>
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-2">Target Ward Station</label>
                        <select {...register('ward_id', { required: true })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold">
                            <option value="">Select Destination Ward</option>
                            {wards?.map((w: any) => (
                                <option key={w.id} value={w.id}>{w.name} (${Number(w.daily_rate)})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-2">Available Beds</label>
                        <select {...register('new_bed_id', { required: true })} disabled={!selectedWardId} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold">
                            <option value="">Select Target Bed</option>
                            {availableBeds.map((b: any) => (
                                <option key={b.id} value={b.id}>{b.bed_number}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-2">Clinical Reason for Transfer</label>
                        <textarea {...register('reason')} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium min-h-[100px]" placeholder="e.g. Requiring intensive care monitoring..."></textarea>
                    </div>

                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-xs font-black uppercase">Cancel</button>
                        <button type="submit" disabled={transferMutation.isPending} className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase shadow-lg shadow-primary/20">
                            {transferMutation.isPending ? 'Relocating...' : 'Authorize Relocation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
