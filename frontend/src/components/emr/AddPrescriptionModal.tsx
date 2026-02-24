'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, User, X, Check, Loader2, Plus, Trash2, Pill, Clock, Calendar, Info, RefreshCw } from 'lucide-react';
import { coreApi } from '@/lib/api';
import { useForm, useFieldArray } from 'react-hook-form';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

interface AddPrescriptionModalProps {
    onClose: () => void;
}

export default function AddPrescriptionModal({ onClose }: AddPrescriptionModalProps) {
    const [search, setSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const debouncedSearch = useDebounce(search, 400);
    const queryClient = useQueryClient();

    const { data: patientResults, isLoading: searching } = useQuery({
        queryKey: ['patients', 'search', debouncedSearch],
        queryFn: () => coreApi.get<any[]>(`/patients?search=${debouncedSearch}&limit=5`),
        enabled: debouncedSearch.length > 2,
    });

    const { register, control, handleSubmit, watch } = useForm({
        defaultValues: {
            diagnosis: '',
            notes: '',
            valid_until: '',
            items: [{
                drug_name: '',
                dosage: '',
                dosage_unit: 'mg',
                frequency: 'Daily',
                duration: '7 days',
                quantity_prescribed: 7,
                refills: 0,
                route: 'Oral',
                instructions: '',
                is_substitutable: false
            }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => coreApi.post('/emr/prescriptions', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emr', 'prescriptions'] });
            onClose();
        },
    });

    const onSubmit = (data: any) => {
        if (!selectedPatient) return;

        const formattedData = {
            ...data,
            patient_id: selectedPatient.id,
            items: data.items.map((item: any) => ({
                ...item,
                quantity_prescribed: parseInt(item.quantity_prescribed),
                refills: parseInt(item.refills),
                days_supply: item.days_supply ? parseInt(item.days_supply) : undefined
            }))
        };

        createMutation.mutate(formattedData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Generate Prescription</h2>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Clinical Order & Medication Ledger</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-100">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Sidebar: Patient & Info */}
                        <div className="lg:col-span-4 space-y-6">
                            <section className="space-y-4">
                                <label className="text-[10px] font-black tracking-widest uppercase text-blue-600 flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Clinical Recipient
                                </label>

                                {!selectedPatient ? (
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search Patient Name/MRN..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                                        />
                                        {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />}

                                        {debouncedSearch.length > 2 && patientResults?.data && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 overflow-hidden divide-y divide-gray-50">
                                                {patientResults.data.map((p: any) => (
                                                    <button key={p.id} type="button" onClick={() => setSelectedPatient(p)} className="w-full p-3 flex items-center gap-3 hover:bg-blue-50 text-left">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">
                                                            {p.first_name[0]}{p.last_name[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-gray-900">{p.first_name} {p.last_name}</p>
                                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{p.mrn}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between shadow-sm shadow-blue-500/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-black ring-4 ring-white shadow-lg shadow-blue-500/20">
                                                {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{selectedPatient.mrn}</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => setSelectedPatient(null)} className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest bg-white px-2 py-1 rounded-lg border border-blue-100 shadow-sm">
                                            X
                                        </button>
                                    </div>
                                )}
                            </section>

                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                <div>
                                    <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 mb-1.5 block">Clinical Indication / Diagnosis</label>
                                    <input {...register('diagnosis')} placeholder="Primary Reason..." className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 mb-1.5 block">External Order Notes</label>
                                    <textarea {...register('notes')} rows={3} placeholder="Pharmacy instructions, etc..." className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 mb-1.5 block">Validity Until</label>
                                    <input type="date" {...register('valid_until')} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Medication Items */}
                        <div className="lg:col-span-8 space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-[10px] font-black tracking-widest uppercase text-emerald-600 flex items-center gap-2">
                                    <Pill className="h-4 w-4" />
                                    Medication Ledger ({fields.length})
                                </label>
                                <button
                                    type="button"
                                    onClick={() => append({
                                        drug_name: '', dosage: '', dosage_unit: 'mg', frequency: 'Daily', duration: '7 days',
                                        quantity_prescribed: 7, refills: 0, route: 'Oral', instructions: '', is_substitutable: false
                                    })}
                                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-colors"
                                >
                                    <Plus className="h-3 w-3 inline mr-1" /> Add Agent
                                </button>
                            </div>

                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="p-5 bg-card/40 border border-border/50 rounded-2xl relative group/item hover:border-blue-200/50 transition-all">
                                        {fields.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => remove(index)}
                                                className="absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-600 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity shadow-lg shadow-red-500/10 border border-red-200"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                            <div className="md:col-span-6">
                                                <label className="text-[9px] font-black text-muted-foreground uppercase mb-1 block">Drug Selection</label>
                                                <input
                                                    {...register(`items.${index}.drug_name` as const, { required: true })}
                                                    placeholder="Search or enter drug name..."
                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-blue-500/10 outline-none"
                                                />
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="text-[9px] font-black text-muted-foreground uppercase mb-1 block">Strength</label>
                                                <div className="flex gap-1">
                                                    <input {...register(`items.${index}.dosage` as const)} placeholder="500" className="flex-1 w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-black outline-none" />
                                                    <input {...register(`items.${index}.dosage_unit` as const)} className="w-16 px-2 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black outline-none" />
                                                </div>
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="text-[9px] font-black text-muted-foreground uppercase mb-1 block">Regimen</label>
                                                <input {...register(`items.${index}.frequency` as const)} placeholder="Twice Daily" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-black outline-none" />
                                            </div>

                                            <div className="md:col-span-3">
                                                <label className="text-[9px] font-black text-muted-foreground uppercase mb-1 block">Duration</label>
                                                <div className="relative">
                                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
                                                    <input {...register(`items.${index}.duration` as const)} className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none" />
                                                </div>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-[9px] font-black text-muted-foreground uppercase mb-1 block">Total Qty</label>
                                                <input type="number" {...register(`items.${index}.quantity_prescribed` as const)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-[9px] font-black text-muted-foreground uppercase mb-1 block">Refills</label>
                                                <input type="number" {...register(`items.${index}.refills` as const)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none" />
                                            </div>
                                            <div className="md:col-span-5">
                                                <label className="text-[9px] font-black text-muted-foreground uppercase mb-1 block">Route & Special Directives</label>
                                                <input {...register(`items.${index}.instructions` as const)} placeholder="Take with food, Oral, IV, etc..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-gray-900 transition-colors"
                    >
                        Cancel Order
                    </button>
                    <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={!selectedPatient || createMutation.isPending}
                        className="px-8 py-2.5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Submit Clinical Order
                    </button>
                </div>
            </div>
        </div>
    );
}
