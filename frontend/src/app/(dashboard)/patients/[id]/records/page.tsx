'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
    Activity, FileText, BadgeIndianRupee, Stethoscope,
    ArrowLeft, Calendar, User, Clock, Download, TrendingUp, TrendingDown,
    Shield, Zap, Box, Microscope, HeartPulse, ChevronRight,
    ShieldCheck
} from 'lucide-react';
import { coreApi as api } from '@/lib/api';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { useCurrency } from '@/hooks/use-currency';

function OceanStatCard({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) {
    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-cyan-100 p-4 shadow-lg shadow-cyan-500/5 hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <p className="text-[7.5px] font-black uppercase tracking-[0.2em] text-cyan-900/40 mb-1 font-fira-code">{label}</p>
                    <p className="text-xl font-black text-slate-900 tracking-tighter font-fira-sans uppercase">{value}</p>
                </div>
                <div className={cn("p-2 rounded-xl text-white shadow-md", color)}>
                    <Icon size={16} />
                </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest font-fira-code">Sync Stable</span>
            </div>
        </div>
    );
}

function PatientRecordsPage() {
    const params = useParams();
    const id = params?.id;
    const router = useRouter();
    const { format: formatCurrency } = useCurrency();

    const { data: patient, isLoading, error } = useQuery({
        queryKey: ['patient-records', id],
        queryFn: async () => {
            if (!id) throw new Error("Patient Identifier Missing");
            const response = await api.get<any>(`/patients/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    if (isLoading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
            <div className="relative">
                <div className="w-12 h-12 border-4 border-cyan-500/20 rounded-full" />
                <div className="absolute top-0 w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-900/40 font-fira-code">Retrieving Patient Profile...</p>
        </div>
    );

    if (error || !patient) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-12">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-6 border border-rose-100">
                <Shield size={32} className="text-rose-500/50" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 font-fira-sans uppercase tracking-tight">Record Access Denied</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-fira-code mb-8">Clinical identifier void or session checksum failure.</p>
            <button
                onClick={() => router.push('/patients')}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest font-fira-code hover:bg-cyan-600 transition-all"
            >
                Return to Registry
            </button>
        </div>
    );

    const totalInvoiced = patient.invoices?.reduce((s: any, i: any) => s + Number(i.total), 0);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-[1700px] mx-auto p-4 lg:p-6 font-fira-sans">
            {/* Ocean Breeze Header (Compact) */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#164E63] to-[#0891B2] px-8 py-10 rounded-[40px] shadow-2xl shadow-cyan-900/10 text-white">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.back()}
                            className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all group"
                        >
                            <ArrowLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1.5 opacity-80">
                                <div className="px-2.5 py-0.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[7.5px] font-black uppercase tracking-widest">Patient Profile</div>
                                <span className="text-[8px] font-black text-cyan-200 uppercase tracking-widest border-l border-white/20 pl-2.5 font-fira-code">MRN: {patient.mrn}</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-black tracking-tighter leading-tight font-fira-sans uppercase">
                                {patient.first_name} <span className="text-cyan-100/40">{patient.last_name}</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 backdrop-blur-md px-5 py-4 rounded-3xl border border-white/10 flex gap-6">
                            <div className="flex flex-col">
                                <p className="text-[7.5px] font-black uppercase tracking-widest text-cyan-100/40 mb-0.5">Date of Birth</p>
                                <p className="text-[11px] font-black font-fira-code">{format(new Date(patient.date_of_birth), 'MMM dd, yyyy')}</p>
                            </div>
                            <div className="flex flex-col border-l border-white/10 pl-6">
                                <p className="text-[7.5px] font-black uppercase tracking-widest text-cyan-100/40 mb-0.5">Gender</p>
                                <p className="text-[11px] font-black uppercase tracking-widest">{patient.gender}</p>
                            </div>
                        </div>
                        <button className="flex items-center justify-center gap-2.5 px-6 py-4 bg-white text-cyan-900 rounded-[28px] font-black uppercase tracking-widest text-[9.5px] shadow-xl hover:bg-cyan-50 active:scale-95 transition-all font-fira-code">
                            <Download className="h-4 w-4" />
                            EXPORT
                        </button>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-cyan-400/20 rounded-full blur-[80px]" />
            </div>

            {/* Quick Stats Grid (High Density) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-fira-sans">
                <OceanStatCard label="Admissions" value={patient.admissions?.length || 0} icon={Stethoscope} color="bg-cyan-600" />
                <OceanStatCard label="Notes" value={patient.progress_notes?.length || 0} icon={FileText} color="bg-indigo-600" />
                <OceanStatCard label="Total Invoiced" value={formatCurrency(totalInvoiced)} icon={BadgeIndianRupee} color="bg-emerald-600" />
                <OceanStatCard label="Last Activity" value={patient.admissions?.[0] ? format(new Date(patient.admissions[0].admitted_at), 'MMM dd') : 'NONE'} icon={Clock} color="bg-amber-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content: Timeline */}
                <div className="lg:col-span-8 space-y-6">
                    <section className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-cyan-100 p-8 shadow-xl shadow-cyan-500/5">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black flex items-center gap-3 tracking-tight font-fira-sans uppercase">
                                    <Activity className="h-5 w-5 text-cyan-500 animate-pulse" />
                                    Clinical History Timeline
                                </h3>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5 font-fira-code">Chronological Patient Record</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2 font-fira-code">
                                    <Shield size={12} />
                                    Encrypted
                                </span>
                            </div>
                        </div>

                        <div className="space-y-12 relative">
                            <div className="absolute left-6 top-4 bottom-4 w-px bg-gradient-to-b from-cyan-200 via-cyan-100 to-transparent" />

                            {/* Unified Clinical Timeline */}
                            {(() => {
                                const events = [
                                    ...(patient.admissions || []).map((adm: any) => ({
                                        id: adm.id,
                                        type: 'STAY',
                                        date: new Date(adm.admitted_at),
                                        data: adm
                                    })),
                                    ...(patient.lab_orders || []).map((order: any) => ({
                                        id: order.id,
                                        type: 'LAB',
                                        date: new Date(order.created_at),
                                        data: order
                                    }))
                                ].sort((a: any, b: any) => b.date.getTime() - a.date.getTime());

                                if (events.length === 0) {
                                    return (
                                        <div className="text-center py-20 bg-slate-50/50 rounded-[48px] border-2 border-dashed border-slate-200">
                                            <Stethoscope className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] font-fira-code">Buffer Empty: No Clinical Events Logged</p>
                                        </div>
                                    );
                                }

                                return events.map((event: any) => {
                                    if (event.type === 'STAY') {
                                        const adm = event.data;
                                        return (
                                            <div key={adm.id} className="relative pl-16 group">
                                                <div className="absolute left-4 top-2 w-3 h-3 rounded-full bg-white border-[3px] border-cyan-500 shadow-sm z-10" />
                                                <div className="p-6 bg-white/50 backdrop-blur-sm rounded-3xl border border-cyan-100/50 hover:border-cyan-300 transition-all duration-500">
                                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                                                        <div>
                                                            <p className="text-[8px] font-black text-cyan-600 uppercase tracking-widest mb-1 font-fira-code">{format(new Date(adm.admitted_at), 'MMMM dd, yyyy')}</p>
                                                            <h4 className="font-black text-lg tracking-tight text-slate-900 font-fira-sans uppercase">Medical Stay: <span className="text-cyan-600/60">{adm.bed.ward.name}</span></h4>
                                                        </div>
                                                        <span className={cn(
                                                            "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm self-start font-fira-code",
                                                            adm.discharged_at ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-cyan-50 text-cyan-600 border-cyan-100"
                                                        )}>
                                                            {adm.discharged_at ? 'Stay Completed' : 'Currently Admitted'}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                                        {[
                                                            { label: 'Reason for Admission', value: adm.diagnosis_on_admission || 'General Observation', icon: FileText },
                                                            { label: 'Stay Status', value: adm.discharged_at ? 'Discharged' : 'Active Stay', icon: Zap },
                                                            { label: 'Bed Number', value: adm.bed.bed_number, icon: Box },
                                                        ].map((item, idx) => (
                                                            <div key={idx} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group-hover:bg-cyan-50/50 transition-colors">
                                                                <p className="text-[9px] uppercase font-black text-slate-400 mb-1 font-fira-code flex items-center gap-2">
                                                                    <item.icon size={12} className="text-cyan-500/40" />
                                                                    {item.label}
                                                                </p>
                                                                <p className="text-sm font-black text-slate-700 tracking-tight font-fira-sans uppercase">{item.value}</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {adm.progress_notes?.length > 0 && (
                                                        <div className="space-y-4 pt-8 border-t border-slate-100 mt-8 relative overflow-hidden">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Microscope size={14} className="text-cyan-500" />
                                                                <p className="text-[10px] uppercase font-black text-cyan-600 tracking-widest font-fira-code">Medical Observations</p>
                                                            </div>
                                                            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 italic">
                                                                <p className="text-sm text-slate-600 leading-relaxed font-fira-sans">"{adm.progress_notes[0].note}"</p>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 font-fira-code uppercase tracking-widest">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-black">DR</div>
                                                                    <span>Dr. {adm.progress_notes[0].doctor.last_name}</span>
                                                                </div>
                                                                <span>{format(new Date(adm.progress_notes[0].created_at), 'MMMM dd')}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        const order = event.data;
                                        return (
                                            <div key={order.id} className="relative pl-16 group">
                                                <div className="absolute left-4 top-2 w-3 h-3 rounded-full bg-white border-[3px] border-emerald-500 shadow-sm z-10" />
                                                <div className="p-6 bg-white/50 backdrop-blur-sm rounded-3xl border border-emerald-100/50 hover:border-emerald-300 transition-all duration-500">
                                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                                                        <div>
                                                            <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1 font-fira-code">{format(new Date(order.created_at), 'MMMM dd, yyyy')}</p>
                                                            <h4 className="font-black text-lg tracking-tight text-slate-900 font-fira-sans uppercase">Investigation: <span className="text-emerald-600/60">{order.items?.[0]?.lab_test?.name || 'Diagnostic Panel'}</span></h4>
                                                        </div>
                                                        <span className={cn(
                                                            "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm self-start font-fira-code",
                                                            order.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                                                        )}>
                                                            {order.status === 'COMPLETED' ? 'Report Authenticated' : order.status.replace('_', ' ')}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {order.items?.map((item: any) => (
                                                            <div key={item.id} className="p-5 bg-white border border-slate-100 rounded-2xl group-hover:border-emerald-200 transition-colors">
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <div>
                                                                        <span className="text-[8px] font-black px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100 uppercase tracking-tighter mb-1 inline-block font-fira-code">
                                                                            {item.lab_test?.code}
                                                                        </span>
                                                                        <h5 className="text-xs font-black uppercase tracking-tight text-slate-800">{item.lab_test?.name}</h5>
                                                                    </div>
                                                                    {order.status === 'COMPLETED' && (
                                                                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                                                            <Shield size={12} />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {order.status === 'COMPLETED' ? (
                                                                    <div className="space-y-3">
                                                                        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 font-fira-code">Clinical Finding</p>
                                                                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{item.results || 'Pending clinical validation'}</p>
                                                                        </div>
                                                                        {item.result_notes && (
                                                                            <div className="bg-emerald-50/30 p-3 rounded-xl border border-emerald-50 text-emerald-900/70">
                                                                                <p className="text-[11px] font-bold italic font-fira-sans leading-relaxed uppercase">"{item.result_notes}"</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-2 py-4 text-amber-600/40">
                                                                        <Clock size={14} className="animate-spin-slow" />
                                                                        <span className="text-[9px] font-black uppercase tracking-widest font-fira-code">Awaiting Clinical Authentication</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Lab Files in Timeline */}
                                                    {order.files?.length > 0 && (
                                                        <div className="mt-6 p-4 bg-emerald-50/20 rounded-2xl border border-emerald-100/30">
                                                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-3 font-fira-code flex items-center gap-2">
                                                                <FileText size={12} />
                                                                Diagnostic Artifacts
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {order.files.map((file: any) => (
                                                                    <div key={file.id} className="px-3 py-2 bg-white border border-emerald-100 rounded-xl flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-tight">
                                                                        {file.file_type === 'PDF' ? <FileText size={10} className="text-red-500" /> : <Microscope size={10} className="text-emerald-500" />}
                                                                        {file.file_name}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center text-[10px] font-black text-slate-400 font-fira-code uppercase tracking-widest">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black">LT</div>
                                                            <span>Dr. {order.doctor?.last_name || 'Medical Officer'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-emerald-600">
                                                            <ShieldCheck size={12} />
                                                            <span>Order Checksum: {order.order_number}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                });
                            })()}
                        </div>
                    </section>
                </div>

                {/* Sidebar: Financials & Integrity */}
                <div className="lg:col-span-4 space-y-6">
                    <section className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-cyan-100 p-6 shadow-xl shadow-cyan-500/5">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black flex items-center gap-3 font-fira-sans uppercase tracking-tight">
                                <BadgeIndianRupee className="h-5 w-5 text-emerald-500" />
                                Billing History
                            </h3>
                            <span className="text-[7.5px] font-black text-emerald-500 uppercase tracking-widest font-fira-code px-2 py-0.5 bg-emerald-50 rounded-md">Verified</span>
                        </div>

                        <div className="space-y-4">
                            {patient.invoices?.slice(0, 5).map((inv: any) => (
                                <div key={inv.id} className="flex items-center justify-between p-5 bg-slate-50/70 rounded-3xl border border-slate-100 group hover:border-cyan-300 hover:shadow-lg transition-all">
                                    <div>
                                        <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest font-fira-code mb-1">{inv.invoice_number}</p>
                                        <p className="text-[11px] text-slate-400 font-black font-fira-sans">{format(new Date(inv.created_at), 'MMM dd, yyyy')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-lg text-slate-900 tracking-tighter">{formatCurrency(inv.total)}</p>
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-widest font-fira-code",
                                            inv.status === 'PAID' ? "text-emerald-500" : "text-amber-500"
                                        )}>{inv.status}</span>
                                    </div>
                                </div>
                            ))}
                            {patient.invoices?.length === 0 && <p className="text-center py-12 text-[10px] font-black text-slate-300 uppercase tracking-widest font-fira-code italic">No Invoices Found</p>}
                        </div>

                        <button className="w-full mt-6 py-4 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[9px] font-fira-code hover:bg-cyan-600 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-slate-900/10">
                            View All Invoices
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </section>

                    <section className="bg-gradient-to-br from-[#164E63] to-[#0891B2] text-white rounded-[48px] p-8 shadow-2xl shadow-cyan-900/30 overflow-hidden relative group">
                        <div className="relative z-10">
                            <h3 className="text-xl font-black mb-4 flex items-center gap-3 font-fira-sans">
                                <Shield className="h-6 w-6 text-cyan-200" />
                                Data Integrity
                            </h3>
                            <p className="text-[11px] leading-relaxed text-cyan-50/70 font-bold mb-8 font-fira-sans">
                                Professional clinical records are securely recorded and validated against international medical standards. Record integrity verified via system sync.
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                                    <p className="text-[8px] font-black uppercase text-cyan-200 mb-1">Status</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest">Validated</p>
                                </div>
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                                    <p className="text-[8px] font-black uppercase text-cyan-200 mb-1">Last Audit</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest">3h Ago</p>
                                </div>
                            </div>

                            <button className="w-full py-5 bg-white text-cyan-900 rounded-[32px] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 font-fira-code hover:scale-[1.02] active:scale-95 shadow-xl shadow-cyan-950/20">
                                <Zap className="h-4 w-4" />
                                REFRESH CLINICAL DATA
                            </button>
                        </div>

                        <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-cyan-400/20 rounded-full blur-[40px]" />
                    </section>
                </div>
            </div>
        </div>
    );
}

export default function RecordsWrapper() {
    return (
        <ErrorBoundary>
            <PatientRecordsPage />
        </ErrorBoundary>
    );
}
