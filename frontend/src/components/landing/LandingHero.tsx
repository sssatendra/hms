'use client';

import { ArrowRight, ShieldCheck, Zap, Globe, Plus, Users } from 'lucide-react';
import Link from 'next/link';

export function LandingHero() {
    return (
        <section className="relative pt-24 pb-16 overflow-hidden bg-white/50 font-fira-sans">
            {/* Premium Ambient Architecture */}
            <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px] bg-emerald-100/20 rounded-full blur-[120px] animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[400px] h-[400px] bg-cyan-100/20 rounded-full blur-[100px]" />

            <div className="max-w-7xl mx-auto px-10 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-10 text-center lg:text-left animate-in slide-in-from-left-12 duration-1000">
                        <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-white/70 backdrop-blur-md text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-[0.25em] border border-emerald-100/50 shadow-xl shadow-emerald-500/5 font-fira-code">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            Clinical OS v4.0 Active
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[0.9] tracking-tighter uppercase mb-2">
                            The Next-Gen <br />
                            <span className="text-emerald-600">Hospital</span> Data Fabric
                        </h1>

                        <p className="text-lg lg:text-xl text-slate-500 font-bold max-w-2xl mx-auto lg:mx-0 leading-relaxed tracking-tight">
                            Orchestrate <span className="text-emerald-950">Wards</span>, <span className="text-emerald-950">Pharmacy POS</span>, and <span className="text-emerald-950">Fiscal Accounting</span> with a deep clinical operating system for precision medicine.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link
                                href="/register"
                                className="group flex items-center justify-center gap-3 px-8 py-4 bg-emerald-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] shadow-2xl shadow-emerald-950/20 hover:bg-emerald-900 hover:-translate-y-1 transition-all duration-500 font-fira-code"
                            >
                                Initiate Protocol
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="#features"
                                className="px-8 py-4 bg-white/70 backdrop-blur-md border border-emerald-100 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] hover:bg-white hover:-translate-y-1 transition-all duration-500 shadow-lg shadow-emerald-500/5 text-center font-fira-code"
                            >
                                Explore Modules
                            </Link>
                        </div>

                        <div className="grid grid-cols-3 gap-8 pt-10 border-t border-emerald-100/50">
                            {[
                                { label: 'Query Latency', value: '<12ms', icon: Zap },
                                { label: 'Data Encryption', value: 'ECC-521', icon: ShieldCheck },
                                { label: 'Node Uptime', value: '99.99%', icon: Globe },
                            ].map((stat) => (
                                <div key={stat.label} className="space-y-1">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <stat.icon size={14} className="text-emerald-500" />
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] font-fira-code">{stat.label}</span>
                                    </div>
                                    <p className="text-2xl font-black text-slate-950 tracking-tighter font-fira-sans leading-none">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative animate-in zoom-in-95 duration-1000">
                        {/* High-Fidelity Mockup Architecture */}
                        <div className="bg-white/80 backdrop-blur-3xl p-4 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(16,185,129,0.1)] border border-emerald-100 relative group overflow-hidden max-w-[540px] ml-auto">
                            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-[40px]" />

                            {/* Inner Dashboard Core */}
                            <div className="bg-slate-50/50 rounded-[32px] w-full aspect-[4/3.2] flex flex-col p-6 space-y-4 border border-emerald-50 shadow-inner">
                                {/* Synthetic Header */}
                                <div className="flex justify-between items-center bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-emerald-100 shadow-lg shadow-emerald-500/5">
                                    <div className="flex gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600"><Zap size={16} /></div>
                                        <div className="w-8 h-8 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-600"><Globe size={16} /></div>
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        <div className="h-3 w-24 bg-slate-100 rounded-full" />
                                        <div className="h-8 w-8 bg-emerald-900 rounded-full shadow-md shadow-emerald-900/20" />
                                    </div>
                                </div>

                                {/* Synthetic Grid */}
                                <div className="grid grid-cols-12 gap-4 flex-1">
                                    <div className="col-span-4 bg-white/90 p-4 rounded-2xl border border-emerald-50 shadow-lg shadow-emerald-500/5 space-y-4">
                                        <div className="h-3 w-16 bg-emerald-100 rounded-full" />
                                        <div className="aspect-video w-full bg-emerald-900/10 rounded-xl flex items-center justify-center">
                                            <ShieldCheck size={24} className="text-emerald-900/20" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-2 w-full bg-slate-100 rounded-full" />
                                            <div className="h-2 w-2/3 bg-slate-100 rounded-full" />
                                        </div>
                                    </div>
                                    <div className="col-span-8 bg-white/90 p-5 rounded-2xl border border-emerald-50 shadow-lg shadow-emerald-500/5">
                                        <div className="flex justify-between mb-4">
                                            <div className="h-3 w-32 bg-slate-100 rounded-full" />
                                            <div className="h-4 w-10 bg-emerald-100 rounded-full border border-emerald-200" />
                                        </div>
                                        <div className="space-y-3">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="flex gap-3 items-center">
                                                    <div className="h-8 w-8 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center text-emerald-600">
                                                        <Plus size={14} />
                                                    </div>
                                                    <div className="flex-1 space-y-1.5">
                                                        <div className="h-1.5 w-full bg-slate-100 rounded-full" />
                                                        <div className="h-1.5 w-1/2 bg-slate-100 rounded-full" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating intelligence Node */}
                            <div className="absolute -bottom-6 -right-6 bg-emerald-900 p-5 rounded-[24px] shadow-2xl shadow-emerald-900/30 animate-bounce-slow border border-emerald-800 z-20">
                                <p className="text-[7.5px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1 font-fira-code">Throughput</p>
                                <p className="text-xl font-black text-white tracking-tighter">98% <span className="text-[9px] text-emerald-400/50 block mt-0.5 tracking-normal font-medium">Efficiency</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
