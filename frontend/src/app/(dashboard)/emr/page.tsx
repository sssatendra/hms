'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, Search, PenSquare, Clock, CheckCircle, Trash2, Plus, 
  Filter, User, ChevronRight, AlertCircle, Shield, Activity, Zap, 
  ArrowRight, BookOpen, Microscope, Pill
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { formatDateTime, cn } from '@/lib/utils';
import { SkeletonDashboard } from '@/components/shared/skeleton';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Portal } from '@/components/shared/portal';
import AddEncounterModal from '@/components/emr/AddEncounterModal';
import AddPrescriptionModal from '@/components/emr/AddPrescriptionModal';
import { toast } from 'sonner';

function EMRPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'notes' | 'prescriptions'>('notes');
  const [page, setPage] = useState(1);
  const [showEncounterModal, setShowEncounterModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, type: 'note' | 'rx' } | null>(null);
  const queryClient = useQueryClient();

  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: ['emr', 'notes', page, search],
    queryFn: () => coreApi.get<any[]>(`/emr/notes?page=${page}&limit=15${search ? `&patient_id=${search}` : ''}`),
    enabled: tab === 'notes',
  });

  const { data: rxData, isLoading: rxLoading } = useQuery({
    queryKey: ['emr', 'prescriptions', page, search],
    queryFn: () => coreApi.get<any[]>(`/emr/prescriptions?page=${page}&limit=15${search ? `&search=${search}` : ''}`),
    enabled: tab === 'prescriptions',
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => coreApi.delete(`/emr/notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emr', 'notes'] });
      toast.success("Medical record deleted.");
    },
  });

  const deleteRXMutation = useMutation({
    mutationFn: (id: string) => coreApi.delete(`/emr/prescriptions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emr', 'prescriptions'] });
      toast.success("Prescription cancelled.");
    },
  });

  const notes = notesData?.data || [];
  const prescriptions = rxData?.data || [];
  const isLoading = tab === 'notes' ? notesLoading : rxLoading;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-[1700px] mx-auto p-4 lg:p-6 font-fira-sans">
      {/* Ocean Breeze Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#164E63] to-[#0891B2] p-8 lg:p-10 rounded-[32px] shadow-xl shadow-cyan-900/20 text-white">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="px-2.5 py-0.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[8.5px] font-black uppercase tracking-widest">Medical Records</div>
              <div className="flex items-center gap-2 text-[7.5px] font-black uppercase tracking-widest text-white/60 font-fira-code">
                <Shield size={10} className="text-cyan-200" />
                Secure Access
              </div>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tighter leading-tight font-fira-sans">
              Patient Records & <br />
              <span className="text-cyan-100/60 font-fira-code">Prescriptions</span>
            </h1>
            <p className="text-cyan-50/80 text-xs font-medium mt-3 max-w-sm">Manage and track all patient medical history, clinical notes, and treatment plans.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col justify-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-cyan-100/60 mb-0.5">Total Records</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tighter">{(tab === 'notes' ? notesData?.meta?.total : rxData?.meta?.total) || 0}</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-cyan-100/40 font-fira-code">Items</span>
              </div>
            </div>
            {tab === 'notes' ? (
                <button
                    onClick={() => setShowEncounterModal(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-cyan-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all group font-fira-code"
                >
                    <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                    Add Note
                </button>
            ) : (
                <button
                    onClick={() => setShowPrescriptionModal(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-emerald-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all group font-fira-code"
                >
                    <PenSquare className="h-4 w-4 group-hover:-translate-y-1 transition-transform" />
                    New Prescription
                </button>
            )}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[10%] w-64 h-64 bg-cyan-400/20 rounded-full blur-[80px]" />
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-cyan-100 shadow-xl shadow-cyan-500/5 overflow-hidden">
        {/* Tabs Hub */}
        <div className="flex flex-col md:flex-row items-stretch border-b border-cyan-100 bg-cyan-50/20 p-2">
          {[
            { key: 'notes', label: "Doctor's Notes", icon: FileText, color: 'text-cyan-500' },
            { key: 'prescriptions', label: 'Prescriptions', icon: Pill, color: 'text-emerald-500' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key as any); setPage(1); }}
              className={cn(
                'flex items-center gap-2.5 px-6 py-3.5 text-[9px] font-black uppercase tracking-[0.2em] transition-all rounded-2xl font-fira-code',
                tab === t.key
                  ? 'bg-white text-slate-900 shadow-lg shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-cyan-600 hover:bg-white/50'
              )}
            >
              <t.icon className={cn("h-3.5 w-3.5", tab === t.key ? t.color : "opacity-40")} />
              {t.label}
            </button>
          ))}

          <div className="flex-1 flex items-center px-4 gap-4 mt-4 md:mt-0">
             <div className="relative flex-1 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cyan-900/30 group-focus-within:text-cyan-600 transition-colors" />
                <input
                    type="text"
                    placeholder={tab === 'notes' ? "Search patient name or ID..." : "Search patient or MRN..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-5 py-2.5 bg-white border border-cyan-100 rounded-xl text-[10px] font-bold focus:ring-4 focus:ring-cyan-50 transition-all outline-none h-[40px] font-fira-sans shadow-sm"
                />
             </div>
             <button className="hidden lg:flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-cyan-900/40 font-fira-code px-3 py-1.5 hover:text-cyan-600 transition-colors">
                <Filter size={12} />
                Filters
             </button>
          </div>
        </div>

        {/* Content Matrix */}
        <div className="p-6 lg:p-8">
          {isLoading ? (
            <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-24 bg-slate-50 animate-pulse rounded-2xl" />
                ))}
            </div>
          ) : tab === 'notes' ? (
            notes.length === 0 ? (
              <div className="text-center py-24">
                <div className="h-16 w-16 bg-cyan-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <BookOpen className="h-8 w-8 text-cyan-200" />
                </div>
                <h3 className="text-xl font-black text-cyan-900/20 uppercase tracking-[0.3em]">No Records Found</h3>
                <p className="text-xs font-medium text-cyan-900/30 mt-3 font-fira-sans">No clinical notes found in the system.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {notes.map((note: any) => (
                  <div key={note.id || note._id} className="relative group p-6 bg-white/50 backdrop-blur-sm rounded-3xl border border-cyan-100/50 hover:border-cyan-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 font-fira-sans">
                    <div className="flex flex-col xl:flex-row justify-between gap-6 relative z-10">
                      <div className="flex-1 space-y-5">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2.5 bg-cyan-50/50 text-cyan-700 px-4 py-1.5 rounded-xl border border-cyan-100 shadow-sm">
                            <User className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest font-fira-code">
                                {note.patient?.first_name || 'NO NAME'} (ID: {note.patient_id.slice(-6)})
                            </span>
                          </div>
                          
                          {note.is_signed ? (
                            <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm shadow-emerald-500/10 font-fira-code">
                              <Shield className="h-3.5 w-3.5" />
                              Signed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 font-fira-code">
                              <Zap className="h-3.5 w-3.5" />
                              Draft
                            </span>
                          )}
                          <span className="hidden sm:inline-block text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] font-fira-code ml-auto">ID: {note._id.slice(-12)}</span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-100 group-hover:bg-white transition-all">
                             <div className="flex items-center gap-2 mb-3">
                                <Activity size={12} className="text-cyan-500/40" />
                                <span className="font-black text-cyan-600/60 uppercase text-[8px] tracking-widest font-fira-code">Patient Assessment</span>
                             </div>
                             <p className="text-xs font-bold text-slate-700 leading-relaxed font-fira-sans">
                                {note.assessment}
                             </p>
                          </div>
                          <div className="p-5 bg-emerald-50/30 rounded-2xl border border-emerald-100 group-hover:bg-white transition-all">
                             <div className="flex items-center gap-2 mb-3">
                                <Zap size={12} className="text-emerald-500/40" />
                                <span className="font-black text-emerald-600/60 uppercase text-[8px] tracking-widest font-fira-code">Treatment Plan</span>
                             </div>
                             <p className="text-xs font-bold text-slate-600 leading-relaxed font-fira-sans italic">
                                "{note.plan || 'No plan defined.'}"
                             </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                          {note.icd_codes?.length > 0 && note.icd_codes.map((code: string) => (
                            <span key={code} className="text-[9px] font-black px-3 py-1 bg-white text-slate-400 rounded-lg border border-slate-100 uppercase tracking-tighter shadow-sm font-fira-code group-hover:text-cyan-600 group-hover:border-cyan-100 transition-all">
                              ICD: {code}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex xl:flex-col items-center xl:items-end justify-between xl:justify-start gap-5 border-l border-slate-100 pl-0 xl:pl-6">
                         <div className="text-right">
                            <div className="flex items-center justify-end gap-1.5 text-[9px] font-black text-slate-900 tracking-tight font-fira-code">
                                <Clock className="h-3.5 w-3.5 text-cyan-500" />
                                {formatDateTime(note.visit_date || note.created_at)}
                            </div>
                            <p className="text-[8px] font-black text-slate-400 mt-1.5 uppercase tracking-widest font-fira-code">Reviewed by Doctor</p>
                         </div>

                         <div className="flex gap-2">
                            <button className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-cyan-600 hover:border-cyan-200 hover:shadow-lg transition-all">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setConfirmDelete({ id: note.id || note._id, type: 'note' })}
                                className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-100 transition-all shadow-sm"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                         </div>
                      </div>
                    </div>

                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/5 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-cyan-400/10 transition-colors" />
                  </div>
                ))}
              </div>
            )
          ) : (
            prescriptions.length === 0 ? (
              <div className="text-center py-24">
                <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Pill className="h-8 w-8 text-emerald-200" />
                </div>
                <h3 className="text-xl font-black text-emerald-900/20 uppercase tracking-[0.3em]">No Prescriptions Found</h3>
                <p className="text-xs font-medium text-emerald-900/30 mt-3 font-fira-sans">No prescriptions found in the system.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-4">
                  <thead>
                    <tr>
                      {['Patient', 'Doctor', 'Diagnosis', 'Items', 'Status', 'Date & Time', ''].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest font-fira-code">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.map((rx: any) => (
                      <tr key={rx.id} className="group hover:-translate-y-1 transition-all duration-300">
                        <td className="bg-white group-hover:bg-cyan-50/50 p-4 rounded-l-2xl border-y border-l border-cyan-50 transition-colors shadow-sm first-letter:capitalize">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-50 to-white text-cyan-600 border border-cyan-100 flex items-center justify-center text-xs font-black shadow-inner">
                              {rx.patient?.first_name?.[0]}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900 font-fira-sans tracking-tight">{rx.patient?.first_name} {rx.patient?.last_name}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-fira-code">MRN: {rx.patient?.mrn || 'VOID'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="bg-white group-hover:bg-cyan-50/50 p-4 border-y border-cyan-50 transition-colors shadow-sm">
                          <div className="flex items-center gap-2">
                             <Microscope size={12} className="text-slate-300" />
                             <p className="text-[10px] font-black text-slate-600 font-fira-sans">Dr. {rx.doctor?.last_name || 'Staff'}</p>
                          </div>
                        </td>
                        <td className="bg-white group-hover:bg-cyan-50/50 p-4 border-y border-cyan-50 transition-colors shadow-sm max-w-[180px]">
                          <p className="text-[10px] font-bold text-slate-600 truncate font-fira-sans">{rx.diagnosis || 'No specific diagnosis'}</p>
                        </td>
                        <td className="bg-white group-hover:bg-cyan-50/50 p-4 border-y border-cyan-50 transition-colors shadow-sm">
                          <div className="flex items-center gap-2.5">
                            <div className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black rounded-lg border border-slate-200 group-hover:bg-white group-hover:border-cyan-200 transition-colors font-fira-code">
                                {rx.items?.length || 0}
                            </div>
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest font-fira-code">Items</span>
                          </div>
                        </td>
                        <td className="bg-white group-hover:bg-cyan-50/50 p-4 border-y border-cyan-50 transition-colors shadow-sm">
                          <span className={cn('text-[8px] font-black px-3 py-1 rounded-full border border-opacity-50 uppercase tracking-widest font-fira-code shadow-sm', {
                            'bg-emerald-50 text-emerald-600 border-emerald-500 shadow-emerald-500/10': rx.status === 'ACTIVE',
                            'bg-cyan-50 text-cyan-600 border-cyan-500 shadow-cyan-500/10': rx.status === 'DISPENSED',
                            'bg-amber-50 text-amber-600 border-amber-500 shadow-amber-500/10': rx.status === 'DRAFT',
                            'bg-rose-50 text-rose-600 border-rose-500 shadow-rose-500/10': ['CANCELLED', 'EXPIRED'].includes(rx.status),
                          })}>
                            {rx.status}
                          </span>
                        </td>
                        <td className="bg-white group-hover:bg-cyan-50/50 p-4 border-y border-cyan-50 transition-colors shadow-sm tabular-nums">
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-900 font-fira-code">
                                <Clock size={10} className="text-cyan-500/40" />
                                {formatDateTime(rx.created_at)}
                            </div>
                        </td>
                        <td className="bg-white group-hover:bg-cyan-50/50 p-4 rounded-r-2xl border-y border-r border-cyan-50 transition-colors shadow-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                             <button className="p-2.5 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-cyan-600 hover:shadow-lg hover:-translate-y-0.5 transition-all group-hover:border-cyan-200">
                                <ArrowRight size={14} />
                             </button>
                             <button
                                onClick={() => setConfirmDelete({ id: rx.id, type: 'rx' })}
                                className="p-2.5 bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg border border-rose-100 transition-all shadow-sm"
                             >
                                <Trash2 size={14} />
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>

      {showEncounterModal && (
        <Portal>
          <AddEncounterModal onClose={() => setShowEncounterModal(false)} />
        </Portal>
      )}

      {showPrescriptionModal && (
        <Portal>
          <AddPrescriptionModal onClose={() => setShowPrescriptionModal(false)} />
        </Portal>
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete?.type === 'note') {
            deleteNoteMutation.mutate(confirmDelete.id);
          } else if (confirmDelete?.type === 'rx') {
            deleteRXMutation.mutate(confirmDelete.id);
          }
          setConfirmDelete(null);
        }}
        title={confirmDelete?.type === 'note' ? 'Delete Medical Record' : 'Cancel Prescription'}
        description={confirmDelete?.type === 'note'
          ? 'Are you sure you want to delete this medical record permanently?'
          : 'Are you sure you want to cancel this prescription? This action cannot be undone.'}
        confirmText={confirmDelete?.type === 'note' ? 'Delete Record' : 'Cancel Prescription'}
        isLoading={deleteNoteMutation.isPending || deleteRXMutation.isPending}
      />
    </div>
  );
}

export default function EMRPageWrapper() {
  return <ErrorBoundary><EMRPage /></ErrorBoundary>;
}
