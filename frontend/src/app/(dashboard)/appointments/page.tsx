'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays, Clock, Plus, Search, Filter, Activity, Shield, Zap,
  MoreVertical, ChevronRight, User, Stethoscope, RefreshCw, CheckCircle,
  AlertCircle, ArrowRight, ArrowUpRight
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { formatDateTime, getStatusColor, cn } from '@/lib/utils';
import { SkeletonDashboard } from '@/components/shared/skeleton';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { useForm, Controller } from 'react-hook-form';
import { PatientSearchSelect } from '@/components/shared/PatientSearchSelect';
import { ClinicalDatePicker } from '@/components/shared/ClinicalDatePicker';
import { toast } from 'sonner';

// ✅ Types
type Appointment = {
  id: string;
  type: string;
  status: string;
  scheduled_at: string;
  duration_mins: number;
  patient?: {
    first_name: string;
    last_name: string;
    mrn: string;
  };
  doctor?: {
    first_name: string;
    last_name: string;
    specialization?: string;
  };
};

type ApiResponse<T> = {
  data: T;
  meta?: {
    totalPages?: number;
    total?: number;
  };
};

function AppointmentsPage() {
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<ApiResponse<Appointment[]>>({
    queryKey: ['appointments', page, dateFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      });

      if (dateFilter) params.set('date', dateFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await coreApi.get<Appointment[]>(`/appointments?${params}`);
      return {
        data: res.data ?? [],
        meta: res.meta ?? { totalPages: 1, total: 0 },
      };
    },
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      coreApi.patch(`/appointments/${id}`, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(`Appointment status updated to ${variables.status.toLowerCase()}.`);
    },
  });

  const appointments = data?.data ?? [];
  const meta = data?.meta;

  if (isLoading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
        <div className="absolute top-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 font-fira-code">Loading Appointment Schedule...</p>
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-[1700px] mx-auto p-4 lg:p-5 font-fira-sans">
      {/* Ocean Breeze Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/90 to-primary p-6 rounded-2xl shadow-lg shadow-black/10 text-white font-fira-sans">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="px-2 py-0.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[7px] font-black uppercase tracking-[0.2em] font-fira-code">Appointment Scheduling</div>
              <div className="flex items-center gap-1.5 text-[7px] font-black uppercase tracking-widest text-primary-foreground/60 font-fira-code">
                <Clock size={9} />
                Manage daily schedules
              </div>
            </div>
            <h1 className="text-xl lg:text-2xl font-black tracking-tighter leading-none">
              Appointments & <span className="text-primary-foreground/60 font-fira-code text-lg">Schedule</span>
            </h1>
            <p className="text-primary-foreground/70 text-[9px] font-black uppercase tracking-widest mt-2 max-w-sm font-fira-code">Daily appointment and patient queue overview</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 flex flex-col justify-center min-w-[100px]">
              <p className="text-[7px] font-black uppercase tracking-widest text-primary-foreground/60 mb-0.5 font-fira-code">Total Today</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black tracking-tighter tabular-nums">{meta?.total || 0}</span>
                <span className="text-[7px] font-black uppercase tracking-widest text-primary-foreground/40 font-fira-code">Appts</span>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-primary rounded-xl font-black uppercase tracking-widest text-[9px] shadow-md hover:bg-primary-foreground hover:text-primary transition-all group font-fira-code cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 group-hover:rotate-90 transition-transform" />
              Book Appointment
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-cyan-400/20 rounded-full blur-[80px]" />
      </div>

      {/* Filter Hub */}
      <div className="flex flex-col md:flex-row items-stretch border-b border-border bg-muted/20 px-1 py-1 rounded-xl shadow-sm">
        <div className="flex-1 flex items-center px-3 gap-3">
          <div className="flex flex-col gap-0.5 min-w-[140px]">
            <ClinicalDatePicker
              value={dateFilter}
              onChange={(val) => { setDateFilter(val); setPage(1); }}
              className="h-[34px] bg-card border border-border rounded-lg px-3 text-[9px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/5 transition-all outline-none font-fira-code shadow-sm text-foreground"
            />
          </div>

          <div className="flex flex-col gap-0.5 flex-grow max-w-[200px]">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-[34px] bg-card border border-border rounded-lg px-3 text-[9px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/5 transition-all outline-none appearance-none font-fira-code cursor-pointer shadow-sm text-foreground"
            >
              <option value="" className="bg-card">Filter by Status</option>
              <option value="SCHEDULED" className="bg-card">Scheduled</option>
              <option value="CONFIRMED" className="bg-card">Confirmed</option>
              <option value="IN_PROGRESS" className="bg-card">In Progress</option>
              <option value="COMPLETED" className="bg-card">Completed</option>
              <option value="CANCELLED" className="bg-card">Cancelled</option>
            </select>
          </div>

          {(dateFilter || statusFilter) && (
            <button
              onClick={() => { setDateFilter(''); setStatusFilter(''); setPage(1); }}
              className="px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 rounded-lg transition-all font-fira-code active:scale-95 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="hidden xl:flex items-center px-4 border-l border-border bg-card/50">
          <div className="flex items-center gap-2 text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest font-fira-code">
            <Activity size={10} className="text-emerald-500" />
            Live Sync
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {appointments.length === 0 ? (
        <div className="text-center py-24 bg-card/50 rounded-3xl border-2 border-dashed border-border">
          <CalendarDays className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
          <h2 className="text-xl font-black text-muted-foreground/30 uppercase tracking-[0.3em]">No Appointments Found</h2>
          <p className="text-xs text-muted-foreground/40 font-medium mt-2 font-fira-sans">No appointments match your selected filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest font-fira-code w-[30%]">Patient Name / ID</th>
                <th className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest font-fira-code w-[15%]">Status</th>
                <th className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest font-fira-code w-[20%]">Doctor</th>
                <th className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest font-fira-code w-[25%]">Date & Time</th>
                <th className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest font-fira-code w-[5%]">Mins</th>
                <th className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest font-fira-code text-right w-[10%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {appointments.map((appt) => (
                <tr key={appt.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-center font-black text-[12px] group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm font-fira-sans">
                        {appt.patient?.first_name?.[0]}{appt.patient?.last_name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-black text-foreground tracking-tight leading-none truncate uppercase font-fira-sans">
                          {appt.patient?.first_name} {appt.patient?.last_name}
                        </p>
                        <p className="text-[7.5px] font-black text-muted-foreground/30 font-fira-code uppercase mt-1">ID: {appt.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border transition-all font-fira-code inline-block",
                      appt.status === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                        appt.status === 'IN_PROGRESS' ? "bg-primary/10 text-primary border-primary/20" :
                          appt.status === 'CANCELLED' ? "bg-destructive/10 text-destructive border-destructive/20" :
                            "bg-muted text-muted-foreground border-border"
                    )}>
                      {appt.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center border border-border">
                        <Stethoscope size={10} className="text-primary" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground font-fira-sans truncate">
                        Dr. {appt.doctor?.first_name} {appt.doctor?.last_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Clock size={11} className="text-primary" />
                      <span className="text-[10px] font-black text-foreground font-fira-code bg-muted px-2 py-0.5 rounded border border-border">
                        {formatDateTime(appt.scheduled_at)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-[10px] font-black text-slate-500 font-fira-code">{appt.duration_mins}m</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex justify-end items-center gap-2">
                      {appt.status === 'SCHEDULED' && (
                        <button
                          onClick={() => patchMutation.mutate({ id: appt.id, status: 'CONFIRMED' })}
                          className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 shadow-sm"
                        >
                          Confirm
                        </button>
                      )}

                      {appt.status === 'CONFIRMED' && (
                        <button
                          onClick={() => patchMutation.mutate({ id: appt.id, status: 'IN_PROGRESS' })}
                          className="px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-cyan-700 transition-all active:scale-95 shadow-sm"
                        >
                          Start
                        </button>
                      )}

                      {appt.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => patchMutation.mutate({ id: appt.id, status: 'COMPLETED' })}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-sm"
                        >
                          End Session
                        </button>
                      )}

                      {appt.status === 'COMPLETED' ? (
                        <div className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-lg border border-border">
                          <span className="text-[7.5px] font-black text-muted-foreground/40 uppercase tracking-widest font-fira-code">Done</span>
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 bg-muted text-muted-foreground border border-border rounded-lg flex items-center justify-center hover:bg-muted/80 cursor-pointer">
                          <MoreVertical size={12} />
                        </div>
                      )}
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
            Page {page} of {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-card border border-border rounded-lg text-[8px] font-black uppercase tracking-widest text-muted-foreground disabled:opacity-30 hover:shadow-md transition-all active:scale-95 text-foreground"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages || 1, p + 1))}
              disabled={page === meta.totalPages}
              className="px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-cyan-700 transition-all active:scale-95 shadow-md shadow-cyan-500/20"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddAppointmentModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}

function AddAppointmentModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, control, formState: { errors } } = useForm<any>();

  const { data: doctorsData } = useQuery({
    queryKey: ['users', 'doctors'],
    queryFn: () => coreApi.get<any[]>('/users?role=DOCTOR'),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => coreApi.post('/appointments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onClose();
      toast.success("Appointment scheduled successfully.");
    },
  });

  const doctors = doctorsData?.data || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-border animate-in zoom-in-95 duration-300 font-fira-sans">
        <div className="px-5 py-3 border-b border-border bg-muted/30">
          <h2 className="text-base font-black text-foreground tracking-tighter font-fira-sans uppercase">Schedule Appointment</h2>
          <p className="text-[7px] font-black text-primary uppercase tracking-widest mt-0.5 font-fira-code">Schedule a new appointment</p>
        </div>

        <form onSubmit={handleSubmit((data) => createMutation.mutateAsync(data))} className="p-6 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1 font-fira-code">Select Patient</label>
            <Controller
              control={control}
              name="patient_id"
              rules={{ required: true }}
              render={({ field }) => (
                <PatientSearchSelect
                  onSelect={field.onChange}
                  className={cn(
                    "w-full px-4 py-3 bg-background border border-border rounded-xl transition-all shadow-sm text-foreground",
                    errors.patient_id ? "ring-2 ring-destructive" : ""
                  )}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1 font-fira-code">Select Doctor</label>
            <select
              {...register('doctor_id', { required: true })}
              className="w-full px-3 py-2 bg-background dark:bg-slate-950 border border-border rounded-lg text-[10px] font-bold focus:ring-2 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all font-fira-sans appearance-none cursor-pointer h-[34px] text-foreground dark:text-slate-100"
            >
              <option value="" className="bg-background dark:bg-slate-900 text-foreground dark:text-slate-100">Select Doctor</option>
              {doctors.map((d: any) => (
                <option key={d.id} value={d.id} className="bg-background dark:bg-slate-900 text-foreground dark:text-slate-100">Dr. {d.last_name} - {d.specialization}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1 font-fira-code">Appointment Date & Time</label>
              <input
                type="datetime-local"
                {...register('scheduled_at', { required: true })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-[10px] font-bold focus:ring-2 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all font-fira-sans h-[34px] text-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1 font-fira-code">Duration</label>
              <select
                {...register('duration_mins', { valueAsNumber: true })}
                className="w-full px-4 py-3 bg-background dark:bg-slate-950 border border-border rounded-xl text-[11px] font-bold focus:ring-2 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all font-fira-sans appearance-none cursor-pointer text-foreground dark:text-slate-100"
              >
                <option value="15" className="bg-background dark:bg-slate-900 text-foreground dark:text-slate-100">15 mins</option>
                <option value="30" className="bg-background dark:bg-slate-900 text-foreground dark:text-slate-100">30 mins</option>
                <option value="45" className="bg-background dark:bg-slate-900 text-foreground dark:text-slate-100">45 mins</option>
                <option value="60" className="bg-background dark:bg-slate-900 text-foreground dark:text-slate-100">60 mins</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1 font-fira-code">Reason for Visit</label>
            <textarea
              {...register('chief_complaint')}
              rows={2}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-[11px] font-bold focus:ring-2 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all font-fira-sans resize-none text-foreground placeholder:text-muted-foreground/30"
              placeholder="Note the reason for visit..."
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
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
              Book Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AppointmentsPageWrapper() {
  return (
    <ErrorBoundary>
      <AppointmentsPage />
    </ErrorBoundary>
  );
}