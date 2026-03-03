'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, User, X, Check, Loader2, Thermometer, Activity,
  Wind, Scale, Ruler, Plus, ShieldAlert, Sparkles, BookOpen,
  ChevronDown, RefreshCw, Zap, Shield, Microscope,
  HeartPulse
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { useForm, Controller } from 'react-hook-form';
import { ClinicalDatePicker } from '../shared/ClinicalDatePicker';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AddEncounterModalProps {
  onClose: () => void;
}

export default function AddEncounterModal({ onClose }: AddEncounterModalProps) {
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [specialty, setSpecialty] = useState<'GEN' | 'PED' | 'OBG' | 'CARD' | 'ONCO'>('GEN');
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();

  const { data: patientResults, isLoading: searching } = useQuery({
    queryKey: ['patients', 'search', debouncedSearch],
    queryFn: () => coreApi.get<any[]>(`/patients?search=${debouncedSearch}&limit=5`),
    enabled: debouncedSearch.length > 2,
  });

  const { register, handleSubmit, reset, watch, control } = useForm({
    defaultValues: {
      visit_date: new Date().toISOString().split('T')[0],
      chief_complaint: '',
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
      icd_codes: '',
      specialty: 'GEN',
      vitals: {
        temperature: undefined,
        blood_pressure_sys: undefined,
        blood_pressure_dia: undefined,
        pulse_rate: undefined,
        respiratory_rate: undefined,
        oxygen_saturation: undefined,
        weight: undefined,
        height: undefined,
      } as any,
      pediatric: {
        birth_weight: '',
        head_circumference: '',
        immunization_status: '',
        developmental_milestones: '',
      },
      obg: {
        lmp: '',
        edd: '',
        gravida: '',
        para: '',
        fetal_heart_rate: '',
      },
      cardio: {
        rhythm: '',
        murmurs: '',
        edema: '',
        ecg_summary: '',
      },
      onco: {
        staging: '',
        cycle_number: '',
        toxicity_notes: '',
        next_chemo_date: '',
      }
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => coreApi.post('/emr/notes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emr', 'notes'] });
      toast.success("Clinical protocol authenticated and registry updated.");
      onClose();
    },
  });

  const onSubmit = (data: any) => {
    if (!selectedPatient) {
      toast.error("Temporal identification failed: Patient entity required.");
      return;
    }

    const formattedData = {
      ...data,
      patient_id: selectedPatient.id,
      specialty,
      icd_codes: data.icd_codes ? data.icd_codes.split(',').map((s: string) => s.trim()) : [],
      vitals: Object.fromEntries(
        Object.entries(data.vitals)
          .filter(([_, v]) => v !== undefined && v !== '' && v !== null)
          .map(([k, v]) => [k, parseFloat(v as string)])
      ),
      specialty_data: specialty === 'PED' ? data.pediatric :
        specialty === 'OBG' ? data.obg :
          specialty === 'CARD' ? data.cardio :
            specialty === 'ONCO' ? data.onco : null
    };

    createMutation.mutate(formattedData);
  };

  const specialties = [
    { value: 'GEN', label: 'General Protocol', icon: Activity },
    { value: 'PED', label: 'Pediatric Module', icon: User },
    { value: 'OBG', label: 'Gynae System', icon: Sparkles },
    { value: 'CARD', label: 'Cardio Matrix', icon: HeartPulse },
    { value: 'ONCO', label: 'Oncology Hub', icon: Zap },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-[120] bg-card w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-border animate-in zoom-in-95 duration-300 font-fira-sans">

        {/* Ocean Breeze Header */}
        <div className="bg-gradient-to-r from-[#164E63] to-[#0891B2] px-6 py-5 text-white shrink-0 relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                <Microscope className="h-5 w-5 text-cyan-200" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tighter leading-none mb-1">Clinical Encounter</h2>
                <div className="flex items-center gap-2">
                  <span className="text-[7.5px] font-black uppercase tracking-widest text-cyan-200/60 font-fira-code">SOAP ARCHITECTURE</span>
                  <div className="w-0.5 h-0.5 rounded-full bg-white/20" />
                  <span className="text-[7.5px] font-black uppercase tracking-widest text-cyan-200/60 font-fira-code">BIO-SYNC ACTIVE</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 flex items-center gap-3">
                <p className="text-[7px] font-black uppercase tracking-widest text-cyan-100/40 font-fira-code">Module</p>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value as any)}
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer text-white font-fira-code appearance-none pr-4"
                >
                  {specialties.map(s => <option key={s.value} value={s.value} className="text-slate-900 dark:bg-slate-900 dark:text-slate-100">{s.label}</option>)}
                </select>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-rose-500/20 transition-all flex items-center justify-center border border-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-cyan-400/20 rounded-full blur-[60px]" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-10 lg:p-12 space-y-12 custom-scrollbar bg-card">

          {/* Patient Identification */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 ml-1">
              <User size={14} className="text-cyan-600" />
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] font-fira-code">Subject Identification</h3>
            </div>

            {!selectedPatient ? (
              <div className="relative max-w-xl group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-900/30 group-focus-within:text-cyan-600 transition-colors" />
                <input
                  type="text"
                  placeholder="LOCATE PATIENT CLUSTER (NAME OR MRN)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-6 py-3.5 bg-background border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-sm font-fira-code text-foreground"
                />

                {searching && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2">
                    <RefreshCw className="h-5 w-5 animate-spin text-cyan-500" />
                  </div>
                )}

                {debouncedSearch.length > 2 && patientResults?.data && (
                  <div className="absolute top-full left-0 right-0 mt-4 bg-card border border-border rounded-[32px] shadow-2xl z-50 overflow-hidden divide-y divide-border animate-in slide-in-from-top-4 duration-300">
                    {patientResults.data.map((p: any) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPatient(p)}
                        className="w-full p-6 flex items-center justify-between hover:bg-cyan-50 transition-all text-left group"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-muted to-card text-primary border border-border flex items-center justify-center text-lg font-black group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm">
                            {p.first_name[0]}{p.last_name[0]}
                          </div>
                          <div>
                            <p className="text-base font-black text-slate-900 tracking-tight font-fira-sans">{p.first_name} {p.last_name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-fira-code">MRN ID: {p.mrn}</p>
                          </div>
                        </div>
                        <ChevronDown className="text-slate-200 group-hover:text-cyan-500 transition-all -rotate-90" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border shadow-sm max-w-xl group transition-all hover:bg-muted/30">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-cyan-600 text-white flex items-center justify-center text-sm font-black shadow-lg shadow-cyan-600/10">
                    {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-black text-slate-900 leading-none mb-1 tracking-tight font-fira-sans uppercase">{selectedPatient.first_name} {selectedPatient.last_name}</h4>
                    <p className="text-[8px] font-black text-cyan-600 uppercase tracking-widest font-fira-code">MRN: {selectedPatient.mrn}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="px-4 py-2 text-[8px] font-black text-rose-500 hover:bg-rose-50 rounded-lg uppercase tracking-widest transition-all border border-rose-100 font-fira-code active:scale-95"
                >
                  Switch Entity
                </button>
              </div>
            )}
          </section>

          {/* Vitals Hub */}
          <section className="p-6 bg-card rounded-3xl border border-border shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-fira-code">
                <Activity size={14} className="text-emerald-500" />
                <h3 className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Bio-Metric Vector frames</h3>
              </div>
              <span className="text-[7.5px] font-black text-emerald-500/40 uppercase tracking-widest font-fira-code">Active Capture</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Thermal Index', field: 'temperature', unit: '°C', icon: Thermometer },
                { label: 'Pressure (S)', field: 'blood_pressure_sys', unit: 'mmHg', icon: Zap },
                { label: 'Pressure (D)', field: 'blood_pressure_dia', unit: 'mmHg', icon: Zap },
                { label: 'Pulse Frequency', field: 'pulse_rate', unit: 'BPM', icon: Activity },
                { label: 'Respi Frame', field: 'respiratory_rate', unit: '/MIN', icon: Wind },
                { label: 'Bio-Saturation', field: 'oxygen_saturation', unit: '%', icon: Shield },
                { label: 'Mass Aggregate', field: 'weight', unit: 'KG', icon: Scale },
                { label: 'Spatial Vector', field: 'height', unit: 'CM', icon: Ruler },
              ].map((v) => (
                <div key={v.field} className="relative group/vital">
                  <label className="text-[7.5px] font-black uppercase text-slate-400 ml-1 mb-1 block tracking-widest font-fira-code group-focus-within/vital:text-emerald-600 transition-colors">{v.label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within/vital:text-emerald-500 transition-colors">
                      <v.icon size={12} />
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.0"
                      {...register(`vitals.${v.field}` as any)}
                      className="w-full pl-9 pr-10 py-2.5 bg-muted/20 border border-border rounded-xl text-[10px] font-black focus:ring-2 focus:ring-emerald-50 focus:border-emerald-200 focus:bg-card outline-none transition-all font-fira-code shadow-inner h-[36px] text-foreground"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-300 uppercase font-fira-code">{v.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Specialty Matrix */}
          {specialty !== 'GEN' && (
            <section className="bg-cyan-50/30 p-10 rounded-[40px] border border-cyan-100 animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden group">
              <div className="flex items-center gap-4 mb-10 relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-black text-xs shadow-xl shadow-cyan-500/20">
                  {specialty}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight font-fira-sans">
                    {specialty === 'PED' ? 'Pediatric Module' : specialty === 'OBG' ? 'Obstetrics & Gynae Matrix' : specialty === 'CARD' ? 'Cardio Analysis' : 'Oncology Command'}
                  </h3>
                  <p className="text-[9px] font-black text-cyan-600 uppercase tracking-widest font-fira-code">Extended Specialty Metadata</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                {specialty === 'PED' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest font-fira-code">Genesis Weight (KG)</label>
                      <input {...register('pediatric.birth_weight')} className="w-full px-6 py-4 bg-background border border-border rounded-[20px] text-xs font-black shadow-sm outline-none focus:ring-4 focus:ring-primary/10 text-foreground" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest font-fira-code">Head Vector (CM)</label>
                      <input {...register('pediatric.head_circumference')} className="w-full px-6 py-4 bg-white border border-cyan-100 rounded-[20px] text-xs font-black shadow-sm outline-none focus:ring-4 focus:ring-cyan-100" />
                    </div>
                  </>
                )}
                {/* Other specialty fields following same UI pattern... */}
                {specialty === 'OBG' && (
                  <>
                    <Controller
                      control={control}
                      name="obg.lmp"
                      render={({ field }) => (
                        <ClinicalDatePicker label="Temporal LMP" value={field.value} onChange={field.onChange} />
                      )}
                    />
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest font-fira-code">Gravida/Para Protocol</label>
                      <input {...register('obg.gravida')} placeholder="G_ P_" className="w-full px-6 py-4 bg-background border border-border rounded-[20px] text-xs font-black shadow-sm outline-none focus:ring-4 focus:ring-primary/10 text-foreground" />
                    </div>
                  </>
                )}
                {specialty === 'CARD' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest font-fira-code">Bio-Rhythm</label>
                      <select {...register('cardio.rhythm')} className="w-full px-6 py-4 bg-background border border-border rounded-[20px] text-xs font-black appearance-none outline-none focus:ring-4 focus:ring-primary/10 text-foreground">
                        <option value="SINUS" className="bg-card">Regular Sinus</option>
                        <option value="AFIB" className="bg-card">Atrial Fibrillation</option>
                        <option value="BRADY" className="bg-card">Bradycardia</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest font-fira-code">Audit Summary</label>
                      <textarea {...register('cardio.ecg_summary')} rows={2} className="w-full px-6 py-4 bg-white border border-cyan-100 rounded-[20px] text-xs font-medium resize-none shadow-sm outline-none focus:ring-4 focus:ring-cyan-100" />
                    </div>
                  </>
                )}
                {specialty === 'ONCO' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest font-fira-code">Clinical Staging (TNM)</label>
                      <input {...register('onco.staging')} className="w-full px-6 py-4 bg-background border border-border rounded-[20px] text-xs font-black shadow-sm outline-none focus:ring-4 focus:ring-primary/10 text-foreground" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest font-fira-code">Cycle Protocol</label>
                      <input type="number" {...register('onco.cycle_number')} className="w-full px-6 py-4 bg-white border border-cyan-100 rounded-[20px] text-xs font-black shadow-sm outline-none focus:ring-4 focus:ring-cyan-100" />
                    </div>
                  </>
                )}
              </div>
              <div className="absolute bottom-[-10%] right-[-10%] w-32 h-32 bg-cyan-400/10 rounded-full blur-[40px]" />
            </section>
          )}

          {/* Narrative SOAP */}
          <section className="space-y-6">
            <div className="flex items-center justify-between ml-1">
              <div className="flex items-center gap-2.5">
                <BookOpen size={14} className="text-amber-500" />
                <h3 className="text-[9px] font-black text-amber-600 uppercase tracking-widest font-fira-code">Clinical SOAP Narrative</h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[7.5px] font-black text-amber-600 uppercase tracking-widest font-fira-code">Sync Active</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative group">
                <label className="text-[8px] font-black tracking-widest uppercase text-slate-400 mb-1.5 block ml-1 font-fira-code group-focus-within:text-cyan-600">Chief Indication</label>
                <input
                  {...register('chief_complaint', { required: true })}
                  placeholder="PRIMARY CLINICAL DRIVER..."
                  className="w-full px-5 py-3 bg-background border border-border rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-sm font-fira-code text-foreground"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Subjective Discovery (S)', field: 'subjective', bg: 'bg-white', focus: 'focus:ring-cyan-50', color: 'text-slate-400' },
                  { label: 'Objective Examination (O)', field: 'objective', bg: 'bg-white', focus: 'focus:ring-cyan-50', color: 'text-slate-400' },
                  { label: 'Clinical Assessment (A)', field: 'assessment', bg: 'bg-amber-50/10', focus: 'focus:ring-amber-50', color: 'text-amber-600', required: true },
                  { label: 'Management Plan (P)', field: 'plan', bg: 'bg-emerald-50/10', focus: 'focus:ring-emerald-50', color: 'text-emerald-600' },
                ].map((s) => (
                  <div key={s.field} className="space-y-2 group">
                    <label className={cn("text-[8px] font-black tracking-widest uppercase block ml-1 font-fira-code", s.color)}>{s.label}</label>
                    <textarea
                      {...register(s.field as any, { required: s.required })}
                      rows={4}
                      placeholder={`Protocol for ${s.label.split(' ')[0]}...`}
                      className={cn(
                        "w-full px-5 py-4 border rounded-2xl text-[10.5px] font-medium leading-relaxed outline-none transition-all shadow-sm font-fira-sans resize-none text-foreground",
                        s.bg === 'bg-white' ? 'bg-background' : 'bg-muted/10',
                        s.focus.replace('cyan-50', 'primary/10').replace('amber-50', 'amber-500/10').replace('emerald-50', 'emerald-500/10'),
                        s.required ? "italic border-amber-500/20" : "border-border"
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ICD-10 & Temporality */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
            <div className="space-y-2 group">
              <label className="text-[8px] font-black tracking-widest uppercase text-slate-400 block ml-1 font-fira-code">Standard Diagnosis (ICD-10)</label>
              <input
                {...register('icd_codes')}
                placeholder="COINCIDENT CODES (J06.9, K29.7)..."
                className="w-full px-5 py-2.5 bg-background border border-border rounded-xl text-[9px] font-black font-fira-code uppercase tracking-widest outline-none shadow-sm focus:ring-2 focus:ring-primary/10 transition-all h-[36px] text-foreground"
              />
            </div>
            <div>
              <Controller
                control={control}
                name="visit_date"
                rules={{ required: true }}
                render={({ field }) => (
                  <ClinicalDatePicker
                    label="SYNC TIMESTAMP"
                    value={field.value}
                    onChange={field.onChange}
                    className="h-[36px] rounded-xl px-4 bg-background border-border shadow-sm font-fira-code text-[9px] text-foreground"
                  />
                )}
              />
            </div>
          </section>
        </form>

        {/* Action Footer */}
        <div className="px-8 py-5 border-t border-border bg-card flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <Shield size={14} className="text-cyan-500/30" />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 font-fira-code">Registry Guard: Authenticated</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-all font-fira-code active:scale-95"
            >
              Abort Protocol
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={!selectedPatient || createMutation.isPending}
              className="px-10 py-3 bg-emerald-900 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-950/10 hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3 font-fira-code"
            >
              {createMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-4 w-4 text-emerald-400" />}
              Commit to Registry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
