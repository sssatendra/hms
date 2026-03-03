'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, User, Phone, Calendar, Droplets, ChevronRight, RefreshCw, FileText,
  Activity, Shield, Zap, Filter, MoreVertical, HeartPulse, Microscope, AlertCircle
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { formatAge, formatDate, getStatusColor, cn, generateMRN } from '@/lib/utils';
import { SkeletonDashboard } from '@/components/shared/skeleton';
import { ErrorBoundary, QueryError } from '@/components/shared/error-boundary';
import { useDebounce } from '@/hooks/use-debounce';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

function PatientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['patients', page, debouncedSearch],
    queryFn: () =>
      coreApi.get<any[]>(`/patients?page=${page}&limit=20${debouncedSearch ? `&search=${debouncedSearch}` : ''}`),
  });

  const patients = data?.data || [];
  const meta = data?.meta;

  if (isLoading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
        <div className="absolute top-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 font-fira-code">Loading Patient Records...</p>
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-[1700px] mx-auto p-4 lg:p-5 font-fira-sans">
      {/* Ocean Breeze Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/90 to-primary p-6 rounded-2xl shadow-lg shadow-black/10 text-white font-fira-sans">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="px-2 py-0.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[7px] font-black uppercase tracking-[0.2em] font-fira-code">Patient Records</div>
              <div className="flex items-center gap-1.5 text-[7px] font-black uppercase tracking-widest text-primary-foreground/60 font-fira-code">
                <Activity size={9} />
                Live Updates
              </div>
            </div>
            <h1 className="text-xl lg:text-2xl font-black tracking-tighter leading-none">
              Patients & <span className="text-primary-foreground/60 font-fira-code text-lg">History</span>
            </h1>
            <p className="text-primary-foreground/70 text-[9px] font-black uppercase tracking-widest mt-2 max-w-sm font-fira-code">Manage patient information and medical history</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 flex flex-col justify-center min-w-[100px]">
              <p className="text-[7px] font-black uppercase tracking-widest text-primary-foreground/60 mb-0.5 font-fira-code">Total Records</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black tracking-tighter tabular-nums">{meta?.total || 0}</span>
                <span className="text-[7px] font-black uppercase tracking-widest text-primary-foreground/40 font-fira-code">Patients</span>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-primary rounded-xl font-black uppercase tracking-widest text-[9px] shadow-md hover:bg-primary-foreground transition-all group font-fira-code cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 group-hover:rotate-90 transition-transform" />
              Add New Patient
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-40 h-40 bg-cyan-400/20 rounded-full blur-2xl animate-pulse" />
      </div>

      {/* Filter & Search Hub */}
      <div className="flex flex-col md:flex-row items-stretch border-b border-border bg-muted/30 px-1 py-1 rounded-xl shadow-sm">
        <div className="flex-1 flex items-center px-3 gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="SEARCH BY NAME, ID, OR PHONE..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-[9px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/5 transition-all outline-none h-[34px] font-fira-code shadow-sm text-foreground placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="hidden lg:flex items-center gap-2.5 px-1">
            <select className="bg-transparent text-[8px] font-black uppercase tracking-widest text-muted-foreground outline-none cursor-pointer font-fira-code hover:text-primary transition-colors">
              <option value="" className="bg-card text-foreground">Filter by Status</option>
              <option value="URGENT" className="bg-card text-foreground">Urgent Care</option>
              <option value="ROUTINE" className="bg-card text-foreground">Routine Checkup</option>
              <option value="FOLLOWUP" className="bg-card text-foreground">Follow-up</option>
            </select>
            <div className="w-0.5 h-3 bg-border" />
            <button className="text-[8px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary font-fira-code flex items-center gap-1.5 active:scale-95 cursor-pointer">
              <Filter size={11} />
              Sort
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      <QueryError error={error as Error} onRetry={() => refetch()} />

      {/* Patient Grid / Cards */}
      {patients.length === 0 ? (
        <div className="text-center py-24 bg-card/50 rounded-3xl border-2 border-dashed border-border">
          <Activity className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <h2 className="text-xl font-black text-muted-foreground/30 uppercase tracking-[0.3em] font-fira-code">No Patients Found</h2>
          <p className="text-xs text-muted-foreground/40 font-medium mt-2 font-fira-sans tracking-tight">Search for a patient or add a new one to the system.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest font-fira-code w-[30%]">Patient Name / ID</th>
                <th className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest font-fira-code w-[20%]">Birth & Blood Group</th>
                <th className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest font-fira-code w-[20%]">Phone Number</th>
                <th className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest font-fira-code w-[20%]">Allergies</th>
                <th className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest font-fira-code text-right w-[10%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {patients.map((patient) => (
                <tr
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-center font-black text-[12px] group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm font-fira-sans">
                        {patient.first_name?.[0]}{patient.last_name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-black text-foreground tracking-tight leading-none truncate uppercase font-fira-sans">
                          {patient.first_name} {patient.last_name}
                        </p>
                        <p className="text-[7.5px] font-black text-muted-foreground/30 font-fira-code uppercase mt-1">MRN: {patient.mrn || 'PENDING'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <Calendar size={10} className="text-primary" />
                        <span className="text-[10px] font-black text-foreground/80 font-fira-code">
                          {formatAge(patient.date_of_birth)} / {formatDate(patient.date_of_birth)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-60 ml-0.5">
                        <Droplets size={8} className="text-rose-500" />
                        <span className="text-[7.5px] font-black text-muted-foreground capitalize font-fira-code">
                          {patient.blood_group?.replace('_', '+').replace('POSITIVE', '+').replace('NEGATIVE', '-')}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Phone size={11} className="text-muted-foreground" />
                      <span className="text-[10px] font-black text-muted-foreground font-fira-code">
                        {patient.phone || 'No phone'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    {patient.allergies?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {patient.allergies.slice(0, 2).map((a: string) => (
                          <span key={a} className="px-1.5 py-0.5 bg-destructive/10 text-destructive rounded-md text-[7px] font-black uppercase tracking-tighter border border-destructive/20 leading-tight block">
                            {a}
                          </span>
                        ))}
                        {patient.allergies.length > 2 && (
                          <span className="text-[7px] font-black text-muted-foreground">+{patient.allergies.length - 2}</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Zap size={9} className="text-emerald-500" />
                        <span className="text-[7.5px] font-black text-muted-foreground/40 uppercase tracking-widest font-fira-code">None</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPatient(patient);
                        }}
                        className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all shadow-sm"
                      >
                        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Page Navigation */}
      {meta?.totalPages && meta.totalPages > 1 && (
        <div className="flex items-center justify-between p-3 bg-card/50 backdrop-blur-md rounded-xl border border-border">
          <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest font-fira-code">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, meta.total || 0)} of {meta.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-card border border-border rounded-lg text-[8px] font-black uppercase tracking-widest text-muted-foreground disabled:opacity-30 hover:shadow-md transition-all active:scale-95"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(Math.min(meta.totalPages || 0, page + 1))}
              disabled={page === meta.totalPages}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-[8px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals & Drawers */}
      {showAddModal && <AddPatientModal onClose={() => setShowAddModal(false)} />}

      {selectedPatient && (
        <PatientDetailDrawer
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onEdit={(patient) => {
            setSelectedPatient(null);
            setEditingPatient(patient);
          }}
        />
      )}

      {editingPatient && (
        <EditPatientModal
          patient={editingPatient}
          onClose={() => setEditingPatient(null)}
        />
      )}
    </div>
  );
}

// Redesigned Modals using same style (Simplified for length)
function AddPatientModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    defaultValues: { mrn: generateMRN() },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => coreApi.post('/patients', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      onClose();
      toast.success("Patient added successfully.");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-border animate-in zoom-in-95 duration-300">
        <div className="px-5 py-4 border-b border-border bg-muted/30">
          <h2 className="text-base font-black text-foreground tracking-tighter font-fira-sans uppercase">New Patient Registration</h2>
          <p className="text-[7px] font-black text-primary uppercase tracking-widest mt-0.5 font-fira-code">Enter patient details</p>
        </div>

        <form onSubmit={handleSubmit((data) => {
          const formattedData = {
            ...data,
            allergies: data.allergies_input ? data.allergies_input.split(',').map((s: string) => s.trim()) : []
          };
          createMutation.mutateAsync(formattedData);
        })} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'mrn', label: 'Patient ID (MRN)', type: 'text' },
              { name: 'first_name', label: 'First Name', type: 'text' },
              { name: 'last_name', label: 'Last Name', type: 'text' },
              { name: 'date_of_birth', label: 'Date of Birth', type: 'date' },
              { name: 'phone', label: 'Phone Number', type: 'tel' },
              { name: 'email', label: 'Email Address', type: 'email' },
            ].map((field) => (
              <div key={field.name} className="flex flex-col gap-1.5">
                <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1 font-fira-code">{field.label}</label>
                <input
                  {...register(field.name, { required: !['phone', 'email'].includes(field.name) })}
                  type={field.type}
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-[10px] font-bold focus:ring-2 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all font-fira-sans h-[34px] text-foreground" />
              </div>
            ))}

            <div className="flex flex-col gap-1.5">
              <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1 font-fira-code">Gender</label>
              <select
                {...register('gender', { required: true })}
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-[10px] font-bold focus:ring-2 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all font-fira-sans appearance-none h-[34px] text-foreground"
              >
                <option value="" className="bg-card text-foreground">Select Gender</option>
                <option value="MALE" className="bg-card text-foreground">Male</option>
                <option value="FEMALE" className="bg-card text-foreground">Female</option>
                <option value="OTHER" className="bg-card text-foreground">Other</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1 font-fira-code">Blood Group</label>
              <select
                {...register('blood_group')}
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-[10px] font-bold focus:ring-2 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all font-fira-sans appearance-none h-[34px] text-foreground"
              >
                <option value="UNKNOWN" className="bg-card text-foreground">Unknown</option>
                {['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'].map(bg => (
                  <option key={bg} value={bg} className="bg-card text-foreground">{bg.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
              <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1 font-fira-code">Allergies</label>
              <input
                {...register('allergies_input')}
                placeholder="List allergies (Comma separated)..."
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-[10px] font-bold focus:ring-2 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all font-fira-sans h-[34px] text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-muted text-muted-foreground rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-muted/80 transition-all font-fira-code active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50 font-fira-code"
            >
              {createMutation.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Shield size={12} />}
              Save Patient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Modal and Drawer would follow identical high-fidelity glass styling
function EditPatientModal({ patient, onClose }: { patient: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    defaultValues: {
      first_name: patient.first_name,
      last_name: patient.last_name,
      date_of_birth: new Date(patient.date_of_birth).toISOString().substring(0, 10),
      phone: patient.phone || '',
      email: patient.email || '',
      gender: patient.gender,
      blood_group: patient.blood_group,
      allergies_input: patient.allergies?.join(', ') || ''
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => coreApi.put(`/patients/${patient.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient', patient.id] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-border animate-in zoom-in-95 duration-300">
        <div className="px-5 py-4 border-b border-border bg-muted/30">
          <h2 className="text-base font-black text-foreground tracking-tighter font-fira-sans uppercase">Edit Patient Information</h2>
          <p className="text-[7px] font-black text-primary uppercase tracking-widest mt-0.5 font-fira-code">Update patient details</p>
        </div>

        <form onSubmit={handleSubmit((data) => {
          const formattedData = {
            ...data,
            allergies: data.allergies_input ? data.allergies_input.split(',').map((s: string) => s.trim()) : []
          };
          delete formattedData.allergies_input;
          updateMutation.mutateAsync(formattedData);
        })} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'first_name', label: 'First Name', type: 'text' },
              { name: 'last_name', label: 'Last Name', type: 'text' },
              { name: 'date_of_birth', label: 'Date of Birth', type: 'date' },
              { name: 'phone', label: 'Phone Number', type: 'tel' },
              { name: 'email', label: 'Email Address', type: 'email' },
            ].map((field) => (
              <div key={field.name} className="flex flex-col gap-1.5">
                <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1 font-fira-code">{field.label}</label>
                <input
                  {...register(field.name, { required: !['phone', 'email'].includes(field.name) })}
                  type={field.type}
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-[10px] font-bold focus:ring-2 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all font-fira-sans h-[34px] text-foreground" />
              </div>
            ))}

            <div className="flex flex-col gap-1.5">
              <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1 font-fira-code">Gender</label>
              <select
                {...register('gender', { required: true })}
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-[10px] font-bold focus:ring-2 focus:ring-primary/10 transition-all font-fira-sans appearance-none h-[34px] text-foreground"
              >
                <option value="MALE" className="bg-card">Male</option>
                <option value="FEMALE" className="bg-card">Female</option>
                <option value="OTHER" className="bg-card">Other</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2 bg-muted text-muted-foreground rounded-lg text-[9px] font-black tracking-widest uppercase font-fira-code active:scale-95">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-[9px] font-black tracking-widest uppercase hover:bg-primary/90 transition-all shadow-sm active:scale-95 font-fira-code">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PatientDetailDrawer({ patient, onClose, onEdit }: { patient: any; onClose: () => void, onEdit: (patient: any) => void }) {
  const { data } = useQuery({
    queryKey: ['patient', patient.id],
    queryFn: () => coreApi.get<any>(`/patients/${patient.id}`),
  });
  const router = useRouter();
  const fullPatient = data?.data || patient;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-lg bg-card shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500 border-l border-border">
        <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tighter font-fira-sans leading-none mb-1">Patient Profile</h2>
            <p className="text-[8px] font-black text-primary uppercase tracking-widest font-fira-code">Patient medical summary</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-muted hover:bg-muted/80 rounded-xl flex items-center justify-center text-foreground transition-all font-black">✕</button>
        </div>

        <div className="p-6 space-y-8">
          {/* Basic info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">
              {patient.first_name?.[0]}{patient.last_name?.[0]}
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground tracking-tighter leading-none mb-1.5 font-fira-sans">
                {patient.first_name} {patient.last_name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[8px] font-black uppercase tracking-widest border border-primary/20 font-fira-code">{patient.mrn}</span>
                <div className="flex items-center gap-1 text-emerald-500">
                  <Activity size={12} />
                  <span className="text-[8px] font-black uppercase tracking-widest">Stable</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {[
              { label: 'Birth Date', value: formatDate(patient.date_of_birth), icon: Calendar },
              { label: 'Age', value: formatAge(patient.date_of_birth), icon: Zap },
              { label: 'Gender', value: patient.gender, icon: User },
              { label: 'Blood Type', value: patient.blood_group?.replace('_', '+'), icon: Droplets },
              { label: 'Phone', value: patient.phone || 'Not provided', icon: Phone },
              { label: 'Email', value: patient.email || 'Not provided', icon: Microscope },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex flex-col gap-1 group">
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest font-fira-code flex items-center gap-1.5">
                  <Icon size={10} className="text-primary/50 group-hover:text-primary transition-colors" />
                  {label}
                </p>
                <p className="font-black text-foreground tracking-tight text-[13px] font-fira-sans group-hover:text-primary transition-colors uppercase">{value}</p>
              </div>
            ))}
          </div>

          {patient.allergies?.length > 0 && (
            <div className="p-5 bg-destructive/5 rounded-2xl border border-destructive/20">
              <p className="text-[9px] font-black text-destructive/60 uppercase tracking-widest mb-3 font-fira-code flex items-center gap-2">
                <AlertCircle size={10} />
                Allergies
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {patient.allergies.map((a: string) => (
                  <span key={a} className="px-3 py-1 bg-card text-destructive text-[9px] font-black uppercase tracking-tighter rounded-lg border border-destructive/20 shadow-sm">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-6 border-t border-border flex flex-col gap-3">
            <button
              onClick={() => router.push(`/patients/${patient.id}/records`)}
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2.5 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 group font-fira-code"
            >
              <FileText className="h-3.5 w-3.5 text-primary-foreground/70 group-hover:text-white transition-colors" />
              View Medical Records
            </button>
            <button
              onClick={() => onEdit(fullPatient)}
              className="w-full py-4 bg-card text-foreground rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] border border-border hover:border-primary/50 hover:text-primary transition-all font-fira-code"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PatientsPageWrapper() {
  return (
    <ErrorBoundary>
      <PatientsPage />
    </ErrorBoundary>
  );
}
