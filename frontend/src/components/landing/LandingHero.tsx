'use client';

import { ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react';
import Link from 'next/link';

export function LandingHero() {
    return (
        <section className="relative pt-32 pb-20 overflow-hidden bg-slate-50">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl opacity-50" />

            <div className="max-w-7xl mx-auto px-6 relative">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8 text-center lg:text-left animate-in slide-in-from-left-8 duration-700">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Trusted by 100+ Hospitals in India
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tighter">
                            Patient Care <br />
                            <span className="text-primary italic">Reimagined</span> for <br />
                            Modern Hospitals.
                        </h1>

                        <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                            The only all-in-one HIS that unifies Pharmacy, Wards, Lab, and Billing into a single, lightning-fast platform. Built for Indian clinicians.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link
                                href="/register"
                                className="group flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/30 hover:bg-primary/90 hover:-translate-y-1 transition-all"
                            >
                                Experience Live Demo
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="#pricing"
                                className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 hover:-translate-y-1 transition-all shadow-xl shadow-slate-200/20 text-center"
                            >
                                View Pricing
                            </Link>
                        </div>

                        <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200">
                            {[
                                { label: 'Uptime', value: '99.9%', icon: Zap },
                                { label: 'Data Secure', value: 'HIPAA', icon: ShieldCheck },
                                { label: 'Latency', value: '<50ms', icon: Globe },
                            ].map((stat) => (
                                <div key={stat.label} className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <stat.icon size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{stat.label}</span>
                                    </div>
                                    <p className="text-xl font-black text-slate-900">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative animate-in zoom-in-95 duration-700">
                        {/* Abstract Dashboard Visual */}
                        <div className="bg-white p-4 rounded-[40px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.1)] border border-slate-100 relative group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[40px]" />
                            <div className="bg-slate-50/50 rounded-[32px] w-full aspect-[4/3] flex flex-col p-6 space-y-4 border border-slate-100/50">
                                {/* Header Bar */}
                                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600"><Zap size={16} /></div>
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600"><Globe size={16} /></div>
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        <div className="h-4 w-32 bg-slate-200/50 rounded-full" />
                                        <div className="h-10 w-10 bg-slate-200 rounded-full" />
                                    </div>
                                </div>
                                {/* Content Grid */}
                                <div className="grid grid-cols-3 gap-4 flex-1">
                                    <div className="col-span-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                        <div className="h-3 w-16 bg-slate-200/60 rounded-full" />
                                        <div className="h-20 w-full bg-slate-50 rounded-xl border border-slate-100/50" />
                                        <div className="space-y-2">
                                            <div className="h-2 w-full bg-slate-200/40 rounded-full" />
                                            <div className="h-2 w-2/3 bg-slate-200/40 rounded-full" />
                                        </div>
                                    </div>
                                    <div className="col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="flex justify-between mb-6">
                                            <div className="h-4 w-40 bg-slate-200/50 rounded-full" />
                                            <div className="h-4 w-12 bg-primary/20 rounded-full border border-primary/10" />
                                        </div>
                                        <div className="space-y-4">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="flex gap-4 items-center">
                                                    <div className="h-8 w-8 bg-slate-100 rounded-lg border border-slate-200/50" />
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-2 w-full bg-slate-200/40 rounded-full" />
                                                        <div className="h-2 w-1/2 bg-slate-200/40 rounded-full" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Floating Card */}
                            <div className="absolute -bottom-6 -left-6 bg-slate-900 p-6 rounded-3xl shadow-2xl animate-bounce-slow border border-white/10 z-20">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ward Status</p>
                                <p className="text-2xl font-black text-white">92% <span className="text-[10px] text-emerald-400 underline underline-offset-4 decoration-emerald-400/50">Occupancy</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
