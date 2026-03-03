'use client';

import { Check, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const tiers = [
    {
        name: 'Starter Clinic',
        price: '4,999',
        description: 'Perfect for small clinics and specialized practices.',
        features: [
            'Up to 10 Beds Management',
            'Basic Pharmacy OTC Sales',
            'Real-time Appointment Logs',
            'Commercial Usage License',
            'Standard Email Support',
        ],
        cta: 'Start 14-day Trial',
        popular: false,
    },
    {
        name: 'Professional Hospital',
        price: '9,999',
        description: 'Complete HIS for mid-sized multi-specialty hospitals.',
        features: [
            'Unlimited Bed Coordination',
            'Complete EMR & Clinical Notes',
            'Advanced Pharmacy Inventory',
            'Fiscal Ledger & Accounting',
            'Commercial Usage License',
            'Priority 24/7 Clinical Support',
        ],
        cta: 'Get Started Now',
        popular: true,
    },
    {
        name: 'Enterprise Network',
        price: 'Custom',
        description: 'Tailored solutions for medical chains and large networks.',
        features: [
            'Multi-Hospital Management',
            'Centralized Stock Control',
            'Advanced Financial Analytics',
            'Proprietary Enterprise License',
            'Dedicated Account Engineer',
        ],
        cta: 'Contact Sales',
        popular: false,
    },
];

export function LandingPricing() {
    return (
        <section id="pricing" className="py-16 bg-cyan-50/30 relative overflow-hidden font-fira-sans">
            {/* Ambient Depth Layer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-100/20 to-transparent blur-[160px]" />

            <div className="max-w-7xl mx-auto px-10 relative z-10">
                <div className="text-center max-w-5xl mx-auto mb-16 space-y-4">
                    <h2 className="text-[8px] font-black uppercase tracking-[0.4em] text-emerald-600 font-fira-code">Elastic Scalability</h2>
                    <p className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Architected for <span className="text-emerald-950">Growth</span></p>
                    <p className="text-base text-slate-400 font-bold tracking-tight">Transparent clinical licensing. Optimized for modern healthcare networks.</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6 items-end">
                    {tiers.map((t) => (
                        <div
                            key={t.name}
                            className={cn(
                                "relative p-6 rounded-2xl border transition-all duration-700 group",
                                t.popular
                                    ? "bg-emerald-950 border-emerald-800 shadow-xl lg:scale-105 z-20 pb-8"
                                    : "bg-white/70 backdrop-blur-2xl border-emerald-100/30 shadow-lg shadow-emerald-500/5 hover:border-emerald-300 hover:bg-white"
                            )}
                        >
                            {t.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-emerald-600 text-white text-[7.5px] font-black uppercase tracking-[0.25em] rounded-full shadow-xl shadow-emerald-500/40 font-fira-code whitespace-nowrap z-50 ring-4 ring-emerald-950">
                                    Primary Selection
                                </div>
                            )}

                            {/* Decorative Glow for Popular */}
                            {t.popular && (
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-emerald-500/20 transition-colors duration-500 pointer-events-none overflow-hidden"></div>
                            )}

                            <div className="mb-4 relative z-10">
                                <h3 className={cn("text-lg font-black mb-1 uppercase tracking-tight font-fira-sans", t.popular ? "text-white" : "text-slate-900")}>{t.name}</h3>
                                <p className={cn("text-[10px] font-semibold leading-relaxed tracking-tight", t.popular ? "text-emerald-400/60" : "text-slate-400")}>{t.description}</p>
                            </div>

                            <div className="mb-4 flex items-baseline gap-1 relative z-10">
                                <span className={cn("text-base font-black font-fira-code", t.popular ? "text-emerald-500" : "text-emerald-600")}>
                                    {t.price === 'Custom' ? '' : '₹'}
                                </span>
                                <span className={cn("text-3xl font-black tracking-tighter font-fira-sans leading-none", t.popular ? "text-white" : "text-slate-900")}>
                                    {t.price}
                                </span>
                                <span className={cn("text-[7.5px] font-black uppercase tracking-widest font-fira-code", t.popular ? "text-emerald-400/40" : "text-slate-300")}>
                                    {t.price === 'Custom' ? '' : '/node/month'}
                                </span>
                            </div>

                            <div className="space-y-3 mb-6 relative z-10">
                                {t.features.map((f) => (
                                    <div key={f} className="flex items-center gap-2.5">
                                        <div className={cn(
                                            "w-4 h-4 rounded-md flex items-center justify-center shrink-0 border",
                                            t.popular ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-600"
                                        )}>
                                            <Check size={10} strokeWidth={4} />
                                        </div>
                                        <span className={cn("text-[11px] font-semibold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis", t.popular ? "text-emerald-100" : "text-slate-600")}>{f}</span>
                                    </div>
                                ))}
                            </div>

                            <Link
                                href={t.name === 'Enterprise Network' ? '#contact' : '/register'}
                                className={cn(
                                    "block w-full py-3.5 rounded-xl text-center font-black text-[9px] uppercase tracking-[0.2em] transition-all duration-500 hover:-translate-y-1 active:scale-95 font-fira-code relative z-10",
                                    t.popular
                                        ? "bg-white text-emerald-950 shadow-lg shadow-white/10 hover:shadow-white/20"
                                        : "bg-emerald-900 text-white shadow-md shadow-emerald-900/10 hover:bg-emerald-800"
                                )}
                            >
                                {t.cta}
                            </Link>
                        </div>
                    ))}
                </div>

                <div className="mt-8 grid md:grid-cols-3 gap-6 py-6 border-y border-emerald-100/50">
                    <div className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/5 border border-emerald-50 group-hover:rotate-6 transition-transform">
                            <ShieldCheck className="text-emerald-600" size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-900 font-fira-code">Bank-Grade Ops</p>
                            <p className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">AES-256 Protocol Encryption</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/5 border border-emerald-50 group-hover:rotate-6 transition-transform">
                            <Check className="text-emerald-600" size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-900 font-fira-code">GST Ready</p>
                            <p className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">Clinical Invoicing</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-center md:justify-end gap-3 italic">
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest font-fira-code whitespace-nowrap">Excl. 18% Statutory GST</p>
                    </div>
                </div>

                {/* Custom Connect Section */}
                <div className="mt-12 p-8 lg:p-12 bg-white/40 backdrop-blur-3xl rounded-[40px] border border-emerald-100/50 shadow-2xl shadow-emerald-500/5 flex flex-col md:flex-row items-center justify-between gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="space-y-4 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-700 font-fira-code">Custom Clinical Requirements</span>
                        </div>
                        <h3 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Need a bespoke <span className="text-emerald-600">Configuration</span>?</h3>
                        <p className="text-sm text-slate-500 font-bold max-w-xl leading-relaxed tracking-tight">
                            From specialized medical branch nodes to custom diagnostic pipelines, our engineering team is ready to architect your unique hospital ecosystem.
                        </p>
                    </div>
                    <Link
                        href="#contact"
                        className="group flex items-center gap-3 px-10 py-5 bg-emerald-950 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-emerald-950/20 hover:bg-emerald-900 hover:-translate-y-1 transition-all duration-500 font-fira-code whitespace-nowrap shrink-0"
                    >
                        Connect With Us
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
