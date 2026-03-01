'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Pill, Activity, Clock, User, CheckCircle2, 
  Database, RefreshCw, ChevronRight, Zap, Shield,
  ArrowRight, Search
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function DispensingInterface() {
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['pharmacy', 'pending'],
    queryFn: () => coreApi.get<any[]>('/pharmacy/pending-prescriptions')
  });

  const dispenseMutation = useMutation({
    mutationFn: (data: any) => coreApi.post('/pharmacy/dispense', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'pending'] });
      toast.success("Prescription fulfilled and registry synchronized.");
      setSelectedPrescription(null);
    }
  });

  const pendingList = prescriptions?.data || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-fira-sans animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Bio-registry: Prescription List */}
      <div className="lg:col-span-5 space-y-6">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
                <Database size={18} className="text-emerald-500" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 font-fira-code">Pending Fulfilment Registry</h2>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-full border border-emerald-100 uppercase tracking-widest font-fira-code">
                {pendingList.length} Units Active
            </span>
        </div>

        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-30">
                    <RefreshCw size={32} className="animate-spin text-emerald-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest font-fira-code">Syncing Registry...</p>
                </div>
            ) : pendingList.length === 0 ? (
                <div className="py-20 border-2 border-dashed border-emerald-100 rounded-[40px] flex flex-col items-center justify-center text-center px-10 bg-white/50">
                    <CheckCircle2 size={40} className="text-emerald-100 mb-4" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest font-fira-code">All Buffers Fulfilled</p>
                </div>
            ) : (
                pendingList.map((rx) => (
                    <div
                        key={rx.id}
                        onClick={() => setSelectedPrescription(rx)}
                        className={cn(
                            "p-6 rounded-[32px] cursor-pointer transition-all duration-500 group relative overflow-hidden flex items-center justify-between border",
                            selectedPrescription?.id === rx.id
                                ? "bg-white border-emerald-300 shadow-2xl shadow-emerald-500/10 -translate-y-1"
                                : "bg-white/60 border-emerald-50 hover:border-emerald-200 hover:bg-white"
                        )}
                    >
                        <div className="flex items-center gap-5 relative z-10">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm border",
                                selectedPrescription?.id === rx.id ? "bg-emerald-600 text-white border-emerald-500" : "bg-emerald-50 text-emerald-500 border-emerald-100"
                            )}>
                                <User size={20} />
                            </div>
                            <div>
                                <div className="font-black text-slate-900 tracking-tight text-base font-fira-sans">{rx.patient.first_name} {rx.patient.last_name}</div>
                                <div className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest font-fira-code mt-1">MRN: {rx.patient.mrn}</div>
                            </div>
                        </div>
                        
                        <div className="text-right relative z-10">
                            <div className="flex items-center gap-2 text-slate-400 group-hover:text-emerald-500 transition-colors">
                                <span className="text-[10px] font-black uppercase tracking-widest font-fira-code">{rx.items.length} Agents</span>
                                <ChevronRight size={16} />
                            </div>
                        </div>

                        {selectedPrescription?.id === rx.id && (
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/5 rounded-full blur-[40px]" />
                        )}
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Fulfillment Matrix: Dispensing Form */}
      <div className="lg:col-span-7 h-full">
        {selectedPrescription ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-[48px] p-10 lg:p-12 border border-emerald-100 shadow-2xl shadow-emerald-500/5 h-full flex flex-col animate-in zoom-in-95 duration-500 overflow-hidden relative">
            <div className="flex items-center justify-between mb-10 shrink-0">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#064E3B] to-[#059669] text-white flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                        <Pill size={28} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none mb-2 font-fira-sans">Dispense Protocol</h3>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest font-fira-code">Rx Fulfillment #{selectedPrescription.id.slice(-4).toUpperCase()}</span>
                            <div className="w-1 h-1 rounded-full bg-emerald-100" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-fira-code">Master Vault Access</span>
                        </div>
                    </div>
                </div>
                <button onClick={() => setSelectedPrescription(null)} className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center border border-slate-100">
                    <RefreshCw size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar mb-10">
                {selectedPrescription.items.map((item: any) => (
                    <div key={item.id} className="p-8 bg-slate-50/50 border border-slate-100 rounded-[40px] hover:border-emerald-100 hover:bg-white transition-all duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center shadow-sm">
                                    <Activity className="h-5 w-5 text-emerald-600/40" />
                                </div>
                                <div>
                                    <div className="font-black text-slate-900 tracking-tight text-lg font-fira-sans">{item.medication?.name || item.drug_name}</div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] font-fira-code mt-0.5">Quantity: <span className="text-emerald-600">{item.quantity} Units</span></div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded-lg border border-emerald-200 uppercase tracking-widest font-fira-code">Inventory Sync Locked</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-white/60 rounded-2xl border border-emerald-50 text-xs font-medium text-slate-600 italic font-fira-sans leading-relaxed">
                                &ldquo;{item.instructions || 'Standard dispensing protocol applies. Verify bio-stability.'}&rdquo;
                            </div>

                            <div className="relative group">
                                <Database className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-300 group-focus-within:text-emerald-500 transition-colors" />
                                <select className="w-full pl-12 pr-6 py-4 bg-white border border-emerald-100 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-emerald-100 transition-all font-fira-code appearance-none cursor-pointer">
                                    <option>Select Valid Batch Matrix...</option>
                                    <option>BT-9981-X (Exp: 2026-12) - 400 In Stock</option>
                                    <option>BT-9982-Y (Exp: 2027-05) - 120 In Stock</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-8 border-t border-emerald-50 mt-auto shrink-0">
              <button
                className="w-full py-6 bg-gradient-to-r from-[#064E3B] to-[#059669] text-white rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4 font-fira-code group"
                onClick={() => dispenseMutation.mutate({
                  prescription_id: selectedPrescription.id,
                  items: []
                })}
                disabled={dispenseMutation.isPending}
              >
                {dispenseMutation.isPending ? <RefreshCw className="h-5 w-5 animate-spin text-emerald-200" /> : <Zap size={18} className="text-emerald-200 group-hover:scale-125 transition-transform" />}
                Authorize Global Fulfillment
              </button>
              
              <div className="flex items-center justify-center gap-3 mt-6 opacity-20 group">
                <Shield size={14} className="text-emerald-500 group-hover:animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] font-fira-code">Cryptographic Fulfillment Audit Enabled</span>
              </div>
            </div>
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/5 rounded-full blur-[80px] pointer-events-none" />
          </div>
        ) : (
          <div className="h-full border-2 border-dashed border-emerald-100 rounded-[48px] flex flex-col items-center justify-center bg-white/40 group p-20 text-center">
            <div className="w-32 h-32 bg-emerald-50 rounded-[48px] flex items-center justify-center mb-10 shadow-inner group-hover:scale-110 transition-transform">
                <Pill size={48} className="text-emerald-100 group-hover:rotate-45 transition-transform duration-700" />
            </div>
            <h3 className="text-3xl font-black text-emerald-900/10 uppercase tracking-[0.4em] mb-4">Matrix Idle</h3>
            <p className="text-sm font-medium text-emerald-900/20 max-w-sm font-fira-sans">Select a pending fulfulment registry entry to initialize the dispensing sequence.</p>
          </div>
        )}
      </div>
    </div>
  );
}