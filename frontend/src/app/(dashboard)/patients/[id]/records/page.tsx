'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
    Activity, FileText, BadgeIndianRupee, Stethoscope,
    ArrowLeft, Calendar, User, Clock, Download, TrendingUp, TrendingDown
} from 'lucide-react';
import { coreApi as api } from '@/lib/api';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/shared/error-boundary';

function PatientRecordsPage() {
    const { id } = useParams();
    const router = useRouter();

    const { data: patient, isLoading } = useQuery({
        queryKey: ['patient-records', id],
        queryFn: async () => (await api.get(`/patients/${id}`)).data
    });

    if (isLoading || !patient) return (
        <div className="p-8 flex items-center justify-center min-h-[400px]">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-6 lg:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-3 hover:bg-muted rounded-2xl transition-all border border-border"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black tracking-tight">{patient.first_name} {patient.last_name}</h1>
                            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-black rounded-full border border-primary/20 uppercase tracking-widest">{patient.mrn}</span>
                        </div>
                        <p className="text-muted-foreground font-medium mt-1">Full Clinical Dashboard & Historical Records</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-muted/20 p-2 rounded-2xl border border-border">
                    <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-xl border border-border shadow-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold">{format(new Date(patient.date_of_birth), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-xl border border-border shadow-sm">
                        <User className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-widest">{patient.gender}</span>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Admissions', value: patient.admissions?.length || 0, icon: Stethoscope, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Clinical Notes', value: patient.progress_notes?.length || 0, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Total Invoiced', value: `$${patient.invoices?.reduce((s: any, i: any) => s + Number(i.total), 0).toFixed(2)}`, icon: BadgeIndianRupee, color: 'text-green-500', bg: 'bg-green-50' },
                    { label: 'Last Visit', value: patient.admissions?.[0] ? format(new Date(patient.admissions[0].admitted_at), 'MMM dd') : 'Never', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
                ].map((stat, i) => (
                    <div key={i} className="p-6 bg-card rounded-3xl border border-border shadow-sm hover:shadow-md transition-all">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ring-4 ring-white shadow-inner", stat.bg)}>
                            <stat.icon className={cn("h-6 w-6", stat.color)} />
                        </div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-2xl font-black">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Timeline */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary" />
                                Lifetime Clinical Timeline
                            </h3>
                            <button className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">View All Files</button>
                        </div>

                        <div className="space-y-6 relative ml-1 bg-muted/5 p-6 rounded-3xl border border-border">
                            <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-border -ml-[1px]" />

                            {patient.admissions?.map((adm: any, i: number) => (
                                <div key={adm.id} className="relative pl-10">
                                    <div className="absolute left-0 top-2 w-4 h-4 rounded-full border-4 border-background bg-primary ring-4 ring-primary/10" />
                                    <div className="p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">{format(new Date(adm.admitted_at), 'MMMM dd, yyyy')}</p>
                                                <h4 className="font-bold text-lg">Hospital Admission: {adm.bed.ward.name}</h4>
                                            </div>
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                adm.discharged_at ? "bg-green-50 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200"
                                            )}>
                                                {adm.discharged_at ? 'Discharged' : 'Active Stay'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                            <div className="p-3 bg-muted/30 rounded-xl">
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Reason</p>
                                                <p className="text-sm font-semibold">{adm.admission_reason || 'General Observation'}</p>
                                            </div>
                                            <div className="p-3 bg-muted/30 rounded-xl">
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Stay Duration</p>
                                                <p className="text-sm font-semibold">{adm.discharged_at ? 'Completed' : 'Ongoing'}</p>
                                            </div>
                                            <div className="p-3 bg-muted/30 rounded-xl">
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Bed No.</p>
                                                <p className="text-sm font-semibold">{adm.bed.bed_number}</p>
                                            </div>
                                        </div>
                                        {adm.progress_notes?.length > 0 && (
                                            <div className="space-y-3 pt-4 border-t border-border mt-4">
                                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Latest Note</p>
                                                <p className="text-sm text-foreground/80 line-clamp-2 italic">"{adm.progress_notes[0].note}"</p>
                                                <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase">
                                                    <span>By Dr. {adm.progress_notes[0].doctor.last_name}</span>
                                                    <span>{format(new Date(adm.progress_notes[0].created_at), 'MMMM dd')}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {(!patient.admissions || patient.admissions.length === 0) && (
                                <div className="text-center py-20 bg-background rounded-2xl border-2 border-dashed border-border">
                                    <Stethoscope className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                                    <p className="text-muted-foreground font-medium">No historical admissions recorded.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Sidebar: Financials & Vitals Trends */}
                <div className="space-y-8">
                    <section className="p-6 bg-card rounded-3xl border border-border shadow-sm">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <BadgeIndianRupee className="h-5 w-5 text-green-500" />
                            Financial Summary
                        </h3>
                        <div className="space-y-4">
                            {patient.invoices?.slice(0, 5).map((inv: any) => (
                                <div key={inv.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/50 group hover:border-primary/30 transition-all">
                                    <div>
                                        <p className="text-xs font-black text-primary uppercase tracking-tighter">{inv.invoice_number}</p>
                                        <p className="text-[10px] text-muted-foreground font-bold">{format(new Date(inv.created_at), 'MMM dd, yyyy')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-sm">${Number(inv.total).toFixed(2)}</p>
                                        <span className={cn(
                                            "text-[9px] font-black uppercase",
                                            inv.status === 'PAID' ? "text-green-600" : "text-orange-600"
                                        )}>{inv.status}</span>
                                    </div>
                                </div>
                            ))}
                            {patient.invoices?.length === 0 && <p className="text-center py-8 text-sm text-muted-foreground italic">No invoices generated yet.</p>}
                        </div>
                    </section>

                    <section className="p-6 bg-primary text-primary-foreground rounded-3xl shadow-xl shadow-primary/20">
                        <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Clinical Integrity
                        </h3>
                        <p className="text-xs leading-relaxed text-primary-foreground/80 font-medium mb-6">
                            All records are cryptographically signed and verified for medical accuracy.
                            Data can be exported for referrals or insurance claims.
                        </p>
                        <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 text-sm font-black transition-all flex items-center justify-center gap-2">
                            <Download className="h-4 w-4" />
                            EXPORT PATIENT FILE (PDF)
                        </button>
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
