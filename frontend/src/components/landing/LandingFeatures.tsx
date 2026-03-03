'use client';

import {
    Building2, Pill, Activity, BadgeIndianRupee,
    Stethoscope, Clock, ShieldCheck, Zap,
    BookOpen, Layers, Microscope, LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
    {
        title: 'Ward & Bed Orchestration',
        description: 'Real-time occupancy tracking, seamless bed transfers, and automated admission workflows with bed-level billing.',
        icon: Building2,
        gradient: 'bg-gradient-to-br from-blue-500 to-blue-700',
    },
    {
        title: 'Hyper-Pharmacy POS',
        description: 'AI-assisted inventory, batch tracking, expiry alerts, and integrated OTC/Prescription sales flow.',
        icon: Pill,
        gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
    },
    {
        title: 'Fiscal Ledger Accounting',
        description: 'Double-entry bookkeeping, automated ledger synthesis, and real-time P&L reporting for absolute fiscal transparency.',
        icon: BadgeIndianRupee,
        gradient: 'bg-gradient-to-br from-amber-500 to-amber-700',
    },
    {
        title: 'Specialty EMR Matrices',
        description: 'High-resolution clinical data for Pediatry, OBG, Cardio, and Oncology with specialty-specific logic.',
        icon: Stethoscope,
        gradient: 'bg-gradient-to-br from-rose-500 to-rose-700',
    },
    {
        title: 'Laboratory 360',
        description: 'Digital ordering, sample collection tracking, and automated result delivery across hospital nodes.',
        icon: Activity,
        gradient: 'bg-gradient-to-br from-purple-500 to-purple-700',
    },
    {
        title: 'Smart Scheduling',
        description: 'Doctor availability calendars, patient self-booking, and automated reminder protocols.',
        icon: Clock,
        gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
    },
];

export function LandingFeatures() {
    return (
        <section id="features" className="py-16 bg-white font-fira-sans relative overflow-hidden text-slate-900">
            {/* Ambient Depth Elements */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-50/50 rounded-full blur-[100px] -ml-40" />

            <div className="max-w-7xl mx-auto px-10 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                    <h2 className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-600 font-fira-code">Unrivaled Clinical Power</h2>
                    <p className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tighter uppercase leading-[1.1]">Orchestrate Every <span className="text-emerald-950">Medical</span> Node.</p>
                    <p className="text-base text-slate-400 font-semibold tracking-tight">Native modules built on a high-resolution data fabric. No more clinical silos.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((f, i) => (
                        <div
                            key={f.title}
                            className="group p-8 bg-white/70 backdrop-blur-2xl border border-emerald-100/30 rounded-3xl hover:bg-white transition-all duration-500 hover:-translate-y-2 shadow-lg shadow-emerald-500/5"
                        >
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl transition-all duration-500 group-hover:rotate-6 group-hover:scale-110",
                                f.gradient
                            )}>
                                <f.icon size={24} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight uppercase font-fira-sans leading-tight">{f.title}</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed tracking-tight">{f.description}</p>
                        </div>
                    ))}
                </div>

                {/* Global Intelligence Bar */}
                <div className="mt-16 p-6 bg-emerald-950 rounded-2xl relative overflow-hidden shadow-xl shadow-emerald-900/30">
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900 to-transparent opacity-50" />
                    <div className="absolute top-0 right-0 p-8 text-emerald-800/5"><Building2 size={120} /></div>

                    <div className="relative z-10 grid md:grid-cols-4 gap-6 text-center">
                        {[
                            { l: 'Patient Records', v: '2.4M+', sub: 'Verified Data' },
                            { l: 'Daily Analysis', v: '180k+', sub: 'Active Queries' },
                            { l: 'Diagnostic Sales', v: '₹95Cr', sub: 'Revenue Processed' },
                            { l: 'Hospitals Active', v: '140+', sub: 'Clinical Nodes' },
                        ].map(s => (
                            <div key={s.l} className="space-y-1">
                                <p className="text-2xl font-black text-white tracking-tighter">{s.v}</p>
                                <div>
                                    <p className="text-[7px] font-black uppercase tracking-[0.2em] text-emerald-400 font-fira-code">{s.l}</p>
                                    <p className="text-[7px] font-black uppercase tracking-widest text-emerald-600/50 mt-0.5 font-fira-code">{s.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}


