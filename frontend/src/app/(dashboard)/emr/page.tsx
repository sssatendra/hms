'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Search, PenSquare, Clock, CheckCircle, Trash2, Plus, Filter, User, ChevronRight, AlertCircle } from 'lucide-react';
import { coreApi } from '@/lib/api';
import { formatDateTime, cn } from '@/lib/utils';
import { SkeletonTable } from '@/components/shared/skeleton';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import AddEncounterModal from '@/components/emr/AddEncounterModal';
import AddPrescriptionModal from '@/components/emr/AddPrescriptionModal';

function EMRPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'notes' | 'prescriptions'>('notes');
  const [page, setPage] = useState(1);
  const [showEncounterModal, setShowEncounterModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emr', 'notes'] }),
  });

  const deleteRXMutation = useMutation({
    mutationFn: (id: string) => coreApi.delete(`/emr/prescriptions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emr', 'prescriptions'] }),
  });

  const notes = notesData?.data || [];
  const prescriptions = rxData?.data || [];
  const isLoading = tab === 'notes' ? notesLoading : rxLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Electronic Medical Records</h1>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-1">Clinical Archive & Prescription Ledger</p>
        </div>
        <div className="flex gap-2">
          {tab === 'notes' ? (
            <button
              onClick={() => setShowEncounterModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20"
            >
              <Plus className="h-4 w-4" />
              New Encounter
            </button>
          ) : (
            <button
              onClick={() => setShowPrescriptionModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20"
            >
              <Plus className="h-4 w-4" />
              Add Prescription
            </button>
          )}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        {/* Tabs */}
        <div className="flex border-b border-border bg-muted/20">
          {[
            { key: 'notes', label: 'Clinical Encounters', icon: FileText },
            { key: 'prescriptions', label: 'Prescription Ledger', icon: PenSquare },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key as any); setPage(1); }}
              className={cn(
                'flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all',
                tab === t.key
                  ? 'border-primary text-primary bg-background shadow-[inset_0_-2px_0_0_#3b82f6]'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-border flex gap-3 bg-muted/10">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={tab === 'notes' ? "Search by Patient ID..." : "Search Patient Name or MRN..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-background transition-colors">
            <Filter className="h-3.5 w-3.5" />
            Filter Status
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-4"><SkeletonTable rows={10} /></div>
        ) : tab === 'notes' ? (
          notes.length === 0 ? (
            <div className="text-center py-20">
              <div className="h-16 w-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-border">
                <FileText className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">No clinical documentation found</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notes.map((note: any) => (
                <div key={note.id || note._id} className="p-5 hover:bg-muted/10 transition-colors group/item">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-100">
                          <User className="h-3.5 w-3.5" />
                          <span className="text-[11px] font-black uppercase">{note.patient?.first_name || 'PATIENT'} (ID: {note.patient_id.slice(-6)})</span>
                        </div>
                        {note.is_signed ? (
                          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 shadow-sm shadow-emerald-500/10">
                            <CheckCircle className="h-3 w-3" />
                            Authenticated
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
                            <AlertCircle className="h-3 w-3" />
                            Record Draft
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">Visit #{note._id.slice(-8)}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pr-10">
                        <div className="space-y-3">
                          <div className="bg-card/50 p-3 rounded-xl border border-border/50">
                            <span className="font-black text-muted-foreground uppercase text-[9px] tracking-widest block mb-1.5 opacity-50">CLINICAL ASSESSMENT</span>
                            <p className="text-xs font-bold text-foreground leading-relaxed">
                              {note.assessment}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {note.plan && (
                            <div className="bg-blue-50/20 p-3 rounded-xl border border-blue-100/30">
                              <span className="font-black text-blue-600 uppercase text-[9px] tracking-widest block mb-1.5 opacity-70">CARE PLAN & DIRECTIVES</span>
                              <p className="text-xs font-bold text-foreground leading-relaxed">
                                {note.plan}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        {note.icd_codes?.length > 0 && note.icd_codes.map((code: string) => (
                          <span key={code} className="text-[9px] font-black px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200 uppercase tracking-tighter">
                            ICD-10: {code}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center justify-end gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDateTime(note.visit_date || note.created_at)}
                        </p>
                        <p className="text-[9px] font-bold text-muted-foreground mt-1 opacity-40">Recorded by Dr. SYSTEM</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground"><ChevronRight className="h-4 w-4" /></button>
                        <button
                          onClick={() => { if (confirm('Delete this record Permanentely?')) deleteNoteMutation.mutate(note.id || note._id); }}
                          className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          prescriptions.length === 0 ? (
            <div className="text-center py-20">
              <div className="h-16 w-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-border">
                <Plus className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">No prescription history found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Clinical Recipient', 'Practitioner', 'Diagnosis / Indications', 'Therapy Items', 'Control Status', 'Timestamp', ''].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {prescriptions.map((rx: any) => (
                    <tr key={rx.id} className="hover:bg-muted/10 transition-colors group/row">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">
                            {rx.patient?.first_name?.[0]}
                          </div>
                          <div>
                            <p className="text-xs font-black text-foreground">{rx.patient?.first_name} {rx.patient?.last_name}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">ID: {rx.patient?.mrn || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-muted-foreground italic">Dr. {rx.doctor?.last_name || 'System'}</p>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-xs font-medium text-foreground truncate">{rx.diagnosis || 'General Clinical Need'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black bg-muted px-2 py-0.5 rounded-lg border border-border">{rx.items?.length || 0}</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">Agents</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest', {
                          'bg-emerald-100 text-emerald-700 border-emerald-200': rx.status === 'ACTIVE',
                          'bg-blue-100 text-blue-700 border-blue-200': rx.status === 'DISPENSED',
                          'bg-amber-100 text-amber-700 border-amber-200': rx.status === 'DRAFT',
                          'bg-rose-100 text-rose-700 border-rose-200': rx.status === 'CANCELLED' || rx.status === 'EXPIRED',
                        })}>
                          {rx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tabular-nums">
                        {formatDateTime(rx.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => { if (confirm('Voids this prescription Record?')) deleteRXMutation.mutate(rx.id); }}
                          className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-all opacity-0 group-hover/row:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {showEncounterModal && (
        <AddEncounterModal onClose={() => setShowEncounterModal(false)} />
      )}

      {showPrescriptionModal && (
        <AddPrescriptionModal onClose={() => setShowPrescriptionModal(false)} />
      )}
    </div>
  );
}

export default function EMRPageWrapper() {
  return <ErrorBoundary><EMRPage /></ErrorBoundary>;
}
