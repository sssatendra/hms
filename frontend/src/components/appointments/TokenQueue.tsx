'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coreApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { 
  Users, UserCheck, Clock, Activity, Zap, 
  ChevronRight, Volume2, Shield, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

export function TokenQueue() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['appointments', 'queue'],
    queryFn: () => coreApi.get<any[]>('/appointments/queue/today'),
    refetchInterval: 10000,
  });

  const callMutation = useMutation({
    mutationFn: (id: string) => coreApi.patch(`/appointments/${id}`, { status: 'IN_PROGRESS' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success("Patient protocol initiated. Public announcement active.");
    }
  });

  const callPatient = (id: string) => {
    callMutation.mutate(id);
  };

  const appointments = data?.data || [];

  if (isLoading) return (
    <div className="bg-white/50 backdrop-blur-xl rounded-[40px] border border-cyan-100 p-10 flex flex-col items-center justify-center gap-4 min-h-[300px]">
      <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-600 rounded-full animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-900/40 font-fira-code">Syncing Token Registry...</span>
    </div>
  );

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[48px] border border-cyan-100 p-8 lg:p-10 shadow-xl shadow-cyan-500/5 h-full">
      <div className="flex items-center justify-between mb-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-cyan-600 font-fira-code">Live Command</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter font-fira-sans">Clinical Queue</h2>
        </div>
        <div className="p-3 bg-cyan-50 rounded-2xl text-cyan-600 border border-cyan-100">
           <Activity size={20} />
        </div>
      </div>

      <div className="space-y-6">
        {appointments.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
             <Users className="h-10 w-10 mx-auto mb-4 text-slate-300" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-fira-code">Protocol Buffer Empty</p>
          </div>
        ) : (
          appointments.map((apt) => (
            <div
              key={apt.id}
              className={cn(
                'relative overflow-hidden p-6 rounded-[32px] border transition-all duration-500 group',
                apt.status === 'IN_PROGRESS' 
                  ? 'border-cyan-500 bg-cyan-50/50 shadow-lg shadow-cyan-500/10 scale-[1.02]' 
                  : 'border-slate-100 bg-white/50 hover:border-cyan-200 hover:shadow-xl hover:shadow-cyan-500/5'
              )}
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-6">
                  <div className={cn(
                     "w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black transition-all",
                     apt.status === 'IN_PROGRESS' ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-cyan-100 group-hover:text-cyan-600"
                  )}>
                    <span className="text-[8px] uppercase tracking-widest leading-none mb-1 font-fira-code">Token</span>
                    <span className="text-2xl font-fira-sans leading-none">{apt.token_number}</span>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-black text-slate-900 tracking-tight font-fira-sans group-hover:text-cyan-600 transition-colors">
                      {apt.patient.first_name} {apt.patient.last_name}
                    </h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-fira-code">MRN: {apt.patient.mrn}</span>
                      <div className="w-1 h-1 rounded-full bg-slate-200" />
                      <span className="text-[10px] font-black text-cyan-600/60 uppercase tracking-widest">Dr. {apt.doctor.last_name}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-3">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest font-fira-code">
                    <Clock size={12} className="text-cyan-500" />
                    Wait: ~{apt.estimated_wait_mins}m
                  </div>
                  
                  {apt.status === 'SCHEDULED' && (
                    <button
                      onClick={() => callPatient(apt.id)}
                      className="px-6 py-2.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-600 transition-all active:scale-95 shadow-lg flex items-center gap-2 group/btn font-fira-code"
                    >
                      <Volume2 size={12} className="group-hover/btn:animate-bounce" />
                      Initialize
                    </button>
                  )}

                  {apt.status === 'IN_PROGRESS' && (
                    <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2 animate-pulse font-fira-code">
                       <Zap size={10} />
                       Live Deployment
                    </div>
                  )}
                </div>
              </div>

              {/* Decorative Pulse for active token */}
              {apt.status === 'IN_PROGRESS' && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/20 rounded-full blur-[40px] -mr-16 -mt-16 animate-pulse" />
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-between">
         <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest font-fira-code">
            <Shield size={14} className="text-cyan-500" />
            Registry Guarded
         </div>
         <button className="text-[10px] font-black text-cyan-600 uppercase tracking-widest hover:underline flex items-center gap-1 group font-fira-code">
            Full Console Matrix
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
         </button>
      </div>
    </div>
  );
}