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
        <section id="features" className="py-32 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Unrivaled Power</h2>
                    <p className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter">Everything you need to run <br /> a modern medical facility.</p>
                    <p className="text-lg text-slate-600 font-medium">Native modules built from the ground up to talk to each other. No more silos.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((f, i) => (
                        <div
                            key={f.title}
                            className="group p-8 bg-slate-50 border border-slate-100 rounded-[32px] hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all hover:-translate-y-2 duration-300"
                        >
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-primary/10 transition-transform group-hover:scale-110 group-hover:rotate-3",
                                f.color
                            )}>
                                <f.icon size={28} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{f.title}</h3>
                            <p className="text-slate-600 font-medium leading-relaxed">{f.description}</p>
                        </div>
                    ))}
                </div>

                {/* Global Stats/Trust Bar */}
                <div className="mt-32 p-12 bg-slate-900 rounded-[48px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 text-white/5"><Building2 size={120} /></div>
                    <div className="grid md:grid-cols-4 gap-12 text-center">
                        {[
                            { l: 'Patient Records', v: '2M+' },
                            { l: 'Daily Appointments', v: '150k+' },
                            { l: 'Pharmacy Sales', v: '₹85Cr' },
                            { l: 'Hospitals Active', v: '120+' },
                        ].map(s => (
                            <div key={s.l} className="space-y-2">
                                <p className="text-4xl font-black text-white">{s.v}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.l}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}


