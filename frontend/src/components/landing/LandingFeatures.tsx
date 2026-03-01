'use client';

import {
    Building2, Pill, Activity, BadgeIndianRupee,
    Stethoscope, Clock, ShieldCheck, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
    {
        title: 'Ward & Bed Management',
        description: 'Real-time occupancy tracking, bed transfers, and automated admission workflows.',
        icon: Building2,
        color: 'bg-blue-500',
    },
    {
        title: 'Hyper-Pharmacy',
        description: 'AI-assisted inventory, batch tracking, expiry alerts, and seamless billing integration.',
        icon: Pill,
        color: 'bg-emerald-500',
    },
    {
        title: 'Laboratory 360',
        description: 'Digital ordering, sample collection tracking, and automated result delivery.',
        icon: Activity,
        color: 'bg-purple-500',
    },
    {
        title: 'Precision Billing',
        description: 'TPA/Insurance support, Itemized charging, and integrated digital payments.',
        icon: BadgeIndianRupee,
        color: 'bg-amber-500',
    },
    {
        title: 'Electronic Med Records',
        description: 'Voice-to-text notes, historical clinical data, and longitudinal patient health views.',
        icon: Stethoscope,
        color: 'bg-rose-500',
    },
    {
        title: 'Smart Scheduling',
        description: 'Patient self-booking, doctor availability calendar, and automated SMS reminders.',
        icon: Clock,
        color: 'bg-indigo-500',
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
                            className="group p-5 bg-white/70 backdrop-blur-2xl border border-emerald-100/30 rounded-2xl hover:bg-white transition-all duration-500 hover:-translate-y-1 shadow-lg shadow-emerald-500/5"
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg transition-all duration-500 group-hover:rotate-6 group-hover:scale-105",
                                f.color.replace('bg-', 'bg-gradient-to-br from-').replace('500', '600') + " to-" + f.color.replace('bg-', '').replace('500', '800')
                            )}>
                                <f.icon size={20} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-1.5 tracking-tight uppercase font-fira-sans">{f.title}</h3>
                            <p className="text-xs text-slate-500 font-semibold leading-relaxed tracking-tight">{f.description}</p>
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


