'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, User, X, Check, Loader2, Thermometer, Activity, Wind, Scale, Ruler, Plus } from 'lucide-react';
import { coreApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

interface AddEncounterModalProps {
    onClose: () => void;
}

export default function AddEncounterModal({ onClose }: AddEncounterModalProps) {
    const [search, setSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const debouncedSearch = useDebounce(search, 400);
    const queryClient = useQueryClient();

    const { data: patientResults, isLoading: searching } = useQuery({
        queryKey: ['patients', 'search', debouncedSearch],
        queryFn: () => coreApi.get<any[]>(`/patients?search=${debouncedSearch}&limit=5`),
        enabled: debouncedSearch.length > 2,
    });

    const { register, handleSubmit, reset } = useForm({
        defaultValues: {
            visit_date: new Date().toISOString().split('T')[0],
            chief_complaint: '',
            subjective: '',
            objective: '',
            assessment: '',
            plan: '',
            icd_codes: '',
            vitals: {
                temperature: undefined,
                blood_pressure_sys: undefined,
                blood_pressure_dia: undefined,
                pulse_rate: undefined,
                respiratory_rate: undefined,
                oxygen_saturation: undefined,
                weight: undefined,
                height: undefined,
            }
        }
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => coreApi.post('/emr/notes', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emr', 'notes'] });
            onClose();
        },
    });

    const onSubmit = (data: any) => {
        if (!selectedPatient) return;

        const formattedData = {
            ...data,
            patient_id: selectedPatient.id,
            icd_codes: data.icd_codes ? data.icd_codes.split(',').map((s: string) => s.trim()) : [],
            vitals: Object.fromEntries(
                Object.entries(data.vitals)
                    .filter(([_, v]) => v !== undefined && v !== '' && v !== null)
                    .map(([k, v]) => [k, parseFloat(v as string)])
            )
        };

        createMutation.mutate(formattedData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">New Clinical Encounter</h2>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">SOAP Method Documentation</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-100">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Patient Selection */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <User className="h-4 w-4" />
                            1. Patient Identification
                        </h3>

                        {!selectedPatient ? (
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search Patient by Name or MRN (min 3 chars)..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />

                                {searching && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                    </div>
                                )}

                                {debouncedSearch.length > 2 && patientResults?.data && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-10 overflow-hidden divide-y divide-gray-50">
                                        {patientResults.data.map((p: any) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => setSelectedPatient(p)}
                                                className="w-full p-4 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">
                                                    {p.first_name[0]}{p.last_name[0]}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-gray-900">{p.first_name} {p.last_name}</p>
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">MRN: {p.mrn}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-black ring-4 ring-white">
                                        {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">MRN: {selectedPatient.mrn}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedPatient(null)}
                                    className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest"
                                >
                                    Change Patient
                                </button>
                            </div>
                        )}
                    </section>

                    {/* Vitals Snapshot */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            2. Vitals Snapshot
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Temp', field: 'temperature', unit: '°C', icon: Thermometer },
                                { label: 'BP (Sys)', field: 'blood_pressure_sys', unit: 'mmHg', icon: Activity },
                                { label: 'BP (Dia)', field: 'blood_pressure_dia', unit: 'mmHg', icon: Activity },
                                { label: 'Pulse', field: 'pulse_rate', unit: 'BPM', icon: Activity },
                                { label: 'Resp', field: 'respiratory_rate', unit: '/min', icon: Wind },
                                { label: 'SPO2', field: 'oxygen_saturation', unit: '%', icon: Activity },
                                { label: 'Weight', field: 'weight', unit: 'kg', icon: Scale },
                                { label: 'Height', field: 'height', unit: 'cm', icon: Ruler },
                            ].map((v) => (
                                <div key={v.field} className="relative group">
                                    <span className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                        <v.icon className="h-3.5 w-3.5" />
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder={v.label}
                                        {...register(`vitals.${v.field}` as any)}
                                        className="w-full pl-9 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400 uppercase">{v.unit}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* SOAP Clinical Notes */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            3. Clinical SOAP Notes
                        </h3>

                        <div className="space-y-6">
                            <div className="col-span-2">
                                <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 mb-1.5 block">Chief Complaint</label>
                                <input
                                    {...register('chief_complaint', { required: true })}
                                    placeholder="Primary reason for the visit..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 mb-1.5 block">Subjective (S)</label>
                                    <textarea
                                        {...register('subjective')}
                                        rows={3}
                                        placeholder="Patient's description of symptoms..."
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 mb-1.5 block">Objective (O)</label>
                                    <textarea
                                        {...register('objective')}
                                        rows={3}
                                        placeholder="Clinician's findings and observations..."
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 mb-1.5 block">Assessment (A)</label>
                                    <textarea
                                        {...register('assessment', { required: true })}
                                        rows={3}
                                        placeholder="Diagnosis or diagnostic considerations..."
                                        className="w-full px-4 py-3 bg-orange-50/20 border border-orange-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 mb-1.5 block">Plan (P)</label>
                                    <textarea
                                        {...register('plan')}
                                        rows={3}
                                        placeholder="Next steps, treatment, follow-up..."
                                        className="w-full px-4 py-3 bg-emerald-50/20 border border-emerald-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ICD-10 & Meta */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                        <div>
                            <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 mb-1.5 block">ICD-10 Diagnosis Codes</label>
                            <input
                                {...register('icd_codes')}
                                placeholder="e.g. J06.9, I10 (comma separated)"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold font-mono outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 mb-1.5 block">Visit Date</label>
                            <input
                                type="date"
                                {...register('visit_date', { required: true })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                            />
                        </div>
                    </section>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-gray-900 transition-colors"
                    >
                        Discard Draft
                    </button>
                    <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={!selectedPatient || createMutation.isPending}
                        className="px-8 py-2.5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
                    >
                        {createMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Check className="h-4 w-4" />
                        )}
                        Authorize Record
                    </button>
                </div>
            </div>
        </div>
    );
}
