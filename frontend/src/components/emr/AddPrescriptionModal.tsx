'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, User, X, Check, Loader2, Plus, Trash2, Pill, Clock, 
  Calendar, Info, RefreshCw, ChevronDown, Shield, Microscope,
  ArrowRight, Activity, Zap
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { ClinicalDatePicker } from '../shared/ClinicalDatePicker';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

    const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
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
            toast.success("Pharmacological protocol deployed to registry.");
            onClose();
        },
    });

    const onSubmit = (data: any) => {
        if (!selectedPatient) {
            toast.error("Subject ID missing: Patient selection required.");
            return;
        }

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-emerald-100 animate-in zoom-in-95 duration-300 font-fira-sans">
                
                {/* Pharmacy/Emerald Header */}
                <div className="bg-gradient-to-r from-[#065F46] to-[#059669] px-6 py-4 text-white shrink-0 relative overflow-hidden">
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                                <Pill className="h-5 w-5 text-emerald-200" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tighter leading-none mb-1 uppercase">Prescription Protocol</h2>
                                <div className="flex items-center gap-3">
                                    <span className="text-[7px] font-black uppercase tracking-widest text-emerald-200/60 font-fira-code">MATRIX v4.0</span>
                                    <div className="w-0.5 h-0.5 rounded-full bg-white/20" />
                                    <span className="text-[7px] font-black uppercase tracking-widest text-emerald-200/60 font-fira-code">DISPENSING GUARD</span>
                                </div>
                            </div>
                        </div>
                        
                        <button 
                            onClick={onClose} 
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/20 transition-all flex items-center justify-center border border-white/10"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-emerald-400/20 rounded-full blur-[60px]" />
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 bg-slate-50/30 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* Clinical Context Sidebar */}
                        <div className="lg:col-span-4 space-y-6">
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 ml-1">
                                    <User size={12} className="text-emerald-600" />
                                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] font-fira-code">Subject Identification</h3>
                                </div>

                                {!selectedPatient ? (
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-900/30 group-focus-within:text-emerald-600 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Audit Registry (Name/MRN)..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-emerald-100 rounded-xl text-[11px] font-bold focus:ring-4 focus:ring-emerald-50 outline-none transition-all shadow-lg shadow-emerald-500/5 font-fira-sans h-[40px]"
                                        />
                                        {searching && <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-emerald-500" />}
                                        
                                        {debouncedSearch.length > 2 && patientResults?.data && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-emerald-100 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-emerald-50 animate-in slide-in-from-top-2 duration-300">
                                                {patientResults.data.map((p: any) => (
                                                    <button key={p.id} type="button" onClick={() => setSelectedPatient(p)} className="w-full p-4 flex items-center justify-between hover:bg-emerald-50 transition-all text-left group">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-[11px] font-black group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                                                                {p.first_name[0]}{p.last_name[0]}
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] font-black text-slate-900 tracking-tight font-fira-sans uppercase">{p.first_name} {p.last_name}</p>
                                                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest font-fira-code">MRN: {p.mrn}</p>
                                                            </div>
                                                        </div>
                                                        <ChevronDown className="-rotate-90 text-slate-200 group-hover:text-emerald-600 transition-all h-3 w-3" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-3 bg-white rounded-2xl border border-emerald-200 shadow-lg shadow-emerald-500/5 flex items-center justify-between group transition-all hover:bg-emerald-50/30 h-[54px]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#065F46] to-[#059669] text-white flex items-center justify-center text-sm font-black shadow-lg shadow-emerald-500/20">
                                                {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-900 leading-none mb-0.5 tracking-tight font-fira-sans uppercase">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                                                <p className="text-[7px] font-black text-emerald-600 uppercase tracking-widest font-fira-code">MRN: {selectedPatient.mrn}</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => setSelectedPatient(null)} className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 border border-emerald-100 transition-all">
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}
                            </section>

                            <section className="space-y-4 pt-6 border-t border-slate-100">
                                <div className="space-y-1.5 group">
                                    <label className="text-[8px] font-black tracking-widest uppercase text-slate-400 mb-0.5 block ml-1 font-fira-code group-focus-within:text-emerald-600 transition-colors">Diagnosis Index</label>
                                    <input {...register('diagnosis')} placeholder="Diagnosis code or description..." className="w-full px-4 py-2.5 bg-white border border-emerald-100 rounded-xl text-[11px] font-bold focus:ring-4 focus:ring-emerald-50 outline-none shadow-lg shadow-emerald-500/5 transition-all font-fira-sans h-[40px]" />
                                </div>
                                <div className="space-y-1.5 group">
                                    <label className="text-[8px] font-black tracking-widest uppercase text-slate-400 mb-0.5 block ml-1 font-fira-code group-focus-within:text-emerald-600 transition-colors">Directives</label>
                                    <textarea {...register('notes')} rows={3} placeholder="Pharmacy directives..." className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-xl text-[10px] font-medium focus:ring-4 focus:ring-emerald-50 outline-none shadow-lg shadow-emerald-500/5 transition-all font-fira-sans resize-none" />
                                </div>
                                <div className="group">
                                    <Controller
                                        control={control}
                                        name="valid_until"
                                        render={({ field }) => (
                                            <ClinicalDatePicker
                                                label="VALIDITY"
                                                value={field.value}
                                                onChange={field.onChange}
                                                className="h-[40px] rounded-xl px-4 bg-white border-emerald-100 shadow-lg shadow-emerald-500/5 font-fira-code text-[8px]"
                                            />
                                        )}
                                    />
                                </div>
                                
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-2 shadow-inner">
                                   <div className="flex items-center gap-1.5 text-amber-600">
                                      <Info size={12} />
                                      <span className="text-[7.5px] font-black uppercase tracking-widest font-fira-code">Directive</span>
                                   </div>
                                   <p className="text-[9.5px] font-bold text-amber-700/70 leading-relaxed font-fira-sans uppercase">AUTHENTICATION REQUIRED. VOIDING REQUIRES TIMESTAMP.</p>
                                </div>
                            </section>
                        </div>

                        {/* Therapy Ledger Index */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                     <div className="flex items-center gap-2 ml-1">
                                        <Microscope size={14} className="text-emerald-600" />
                                        <h3 className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] font-fira-code">Therapy Ledger ({fields.length})</h3>
                                    </div>
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[7px] font-black rounded-full border border-emerald-200 uppercase tracking-widest font-fira-code">AUDIT ACTIVE</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => append({
                                        drug_name: '', dosage: '', dosage_unit: 'mg', frequency: 'Daily', duration: '7 days',
                                        quantity_prescribed: 7, refills: 0, route: 'Oral', instructions: '', is_substitutable: false
                                    })}
                                    className="px-5 py-2 bg-white text-emerald-700 rounded-xl text-[8px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-50 transition-all flex items-center gap-2 font-fira-code shadow-sm group active:scale-95"
                                >
                                    <Plus className="h-3.5 w-3.5 group-hover:rotate-90 transition-transform" />
                                    Add Agent
                                </button>
                            </div>

                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="p-5 bg-white/70 backdrop-blur-sm border border-emerald-100 rounded-2xl relative group/item hover:border-emerald-300 transition-all duration-300 shadow-lg shadow-emerald-500/5">
                                        {fields.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => remove(index)}
                                                className="absolute top-4 right-4 w-8 h-8 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all shadow-lg shadow-rose-500/10 border border-rose-100 hover:bg-rose-100"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 relative z-10">
                                            <div className="md:col-span-12 lg:col-span-6">
                                                <label className="text-[7.5px] font-black text-slate-400 tracking-widest uppercase mb-1.5 block ml-1 font-fira-code group-focus-within/item:text-emerald-600">Pharmacological Agent Selection</label>
                                                <div className="relative group/agent">
                                                     <Pill className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-300 group-focus-within/agent:text-emerald-500 transition-colors" />
                                                     <input
                                                        {...register(`items.${index}.drug_name` as const, { required: true })}
                                                        placeholder="Locate therapy agent..."
                                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-fira-sans h-[36px]"
                                                     />
                                                </div>
                                            </div>
                                            <div className="md:col-span-6 lg:col-span-3">
                                                <label className="text-[7.5px] font-black text-slate-400 tracking-widest uppercase mb-1.5 block ml-1 font-fira-code">Strength</label>
                                                <div className="flex gap-1.5">
                                                    <input {...register(`items.${index}.dosage` as const)} placeholder="500" className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold outline-none font-fira-sans h-[36px]" />
                                                    <input {...register(`items.${index}.dosage_unit` as const)} className="w-16 px-2.5 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none font-fira-code h-[36px]" />
                                                </div>
                                            </div>
                                            <div className="md:col-span-6 lg:col-span-3">
                                                <label className="text-[7.5px] font-black text-slate-400 tracking-widest uppercase mb-1.5 block ml-1 font-fira-code">Frequency</label>
                                                <input {...register(`items.${index}.frequency` as const)} placeholder="TID" className="w-full px-3.5 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold outline-none font-fira-sans h-[36px]" />
                                            </div>

                                            <div className="md:col-span-4 lg:col-span-3">
                                                <label className="text-[7.5px] font-black text-slate-400 tracking-widest uppercase mb-1.5 block ml-1 font-fira-code">Duration</label>
                                                <div className="relative group/field">
                                                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-300 group-focus-within/field:text-emerald-500 transition-colors" />
                                                    <input {...register(`items.${index}.duration` as const)} className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black outline-none font-fira-code tracking-widest h-[36px]" />
                                                </div>
                                            </div>
                                            <div className="md:col-span-4 lg:col-span-3">
                                                <label className="text-[7.5px] font-black text-slate-400 tracking-widest uppercase mb-1.5 block ml-1 font-fira-code">QTY</label>
                                                <div className="relative group/field">
                                                    <Zap className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-300 group-focus-within/field:text-emerald-500 transition-colors" />
                                                    <input type="number" {...register(`items.${index}.quantity_prescribed` as const)} className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold outline-none font-fira-sans h-[36px]" />
                                                </div>
                                            </div>
                                            <div className="md:col-span-4 lg:col-span-6">
                                                <label className="text-[7.5px] font-black text-slate-400 tracking-widest uppercase mb-1.5 block ml-1 font-fira-code">Directives</label>
                                                <div className="relative group/field">
                                                    <ArrowRight className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-300 group-focus-within/field:text-emerald-500 transition-colors" />
                                                    <input {...register(`items.${index}.instructions` as const)} placeholder="Route & Precautions..." className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black tracking-tight outline-none font-fira-sans placeholder:italic h-[36px]" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-[-10%] right-[-5%] w-40 h-40 bg-emerald-400/5 rounded-full blur-[40px] group-hover/item:bg-emerald-400/10 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </form>

                {/* Secure Action Footer */}
                <div className="px-6 py-4 border-t border-emerald-100 bg-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                        <Shield size={14} className="text-emerald-500/40" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-300 font-fira-code uppercase leading-none">Secure Encryption Active</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-fira-code active:scale-95"
                        >
                            Abort
                        </button>
                        <button
                            onClick={handleSubmit(onSubmit)}
                            disabled={!selectedPatient || createMutation.isPending}
                            className="px-8 py-2.5 bg-gradient-to-r from-[#065F46] to-[#059669] text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center gap-3 font-fira-code group"
                        >
                            {createMutation.isPending ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-200" />
                            ) : (
                                <Check className="h-4 w-4 text-emerald-200 group-hover:scale-125 transition-transform" />
                            )}
                            Initialize Dispatch
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
