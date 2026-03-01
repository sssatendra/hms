'use client';

import Link from 'next/link';
import { Building2, Mail, Phone, MapPin, Twitter, Linkedin, Facebook } from 'lucide-react';

export function LandingFooter() {
    return (
        <footer className="bg-white pt-16 pb-8 font-fira-sans border-t border-emerald-50 text-slate-900">
            <div className="max-w-7xl mx-auto px-10">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-emerald-900 rounded-xl flex items-center justify-center shadow-2xl shadow-emerald-900/20 group-hover:rotate-6 transition-transform duration-500">
                                <Building2 className="text-emerald-50" size={22} />
                            </div>
                            <div>
                                <span className="text-lg font-black tracking-tighter text-slate-900 uppercase">HMS</span>
                                <span className="text-[8px] block font-black uppercase tracking-[0.3em] text-emerald-600 -mt-1 font-fira-code">Protocol v4.0</span>
                            </div>
                        </Link>
                        <p className="text-[11px] font-semibold text-slate-400 leading-relaxed tracking-tight max-w-xs">
                            Leading the high-resolution digital transformation of clinical ecosystems. Secure, unified, and architected for exponential scale.
                        </p>
                        <div className="flex gap-3">
                            {[Twitter, Linkedin, Facebook].map((Icon, idx) => (
                                <Link key={idx} href="#" className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white hover:rotate-6 transition-all duration-300 border border-slate-100">
                                    <Icon size={18} />
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-5 font-fira-code">Clinical Stack</h4>
                        <ul className="space-y-2.5">
                            {['Diagnostic Node', 'Logistics Hub', 'Patient Matrix', 'Security Core', 'AI Synthesis'].map(item => (
                                <li key={item}>
                                    <Link href="#" className="text-[12px] font-semibold text-slate-500 hover:text-emerald-600 transition-colors tracking-tight">{item}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-5 font-fira-code">Ecosystem</h4>
                        <ul className="space-y-2.5">
                            {['About HMS', 'Interrogations', 'Careers', 'Privacy Layer', 'Compliance'].map(item => (
                                <li key={item}>
                                    <Link href="#" className="text-[12px] font-semibold text-slate-500 hover:text-emerald-600 transition-colors tracking-tight">{item}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-5 font-fira-code">Contact Nodes</h4>
                        <div className="space-y-3.5">
                            <div className="flex items-start gap-3 group">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all"><Phone size={14} /></div>
                                <div>
                                    <p className="text-[7.5px] font-black uppercase tracking-widest text-slate-300 mb-0.5 font-fira-code">Central Exchange</p>
                                    <p className="text-[12px] font-black text-slate-700 tracking-tight font-fira-sans">+91 1800-HMS-CORE</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 group">
                                <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600 shrink-0 border border-cyan-100 group-hover:bg-cyan-600 group-hover:text-white transition-all"><Mail size={14} /></div>
                                <div>
                                    <p className="text-[7.5px] font-black uppercase tracking-widest text-slate-300 mb-0.5 font-fira-code">Intelligence Feed</p>
                                    <p className="text-[12px] font-black text-slate-700 tracking-tight font-fira-sans">protocol@hms.io</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-emerald-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-300 font-fira-code">
                        © 2026 HMS CLINICAL SYSTEMS. ALL NODES OPERATIONAL.
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 opacity-20 grayscale hover:grayscale-0 transition-all cursor-crosshair">
                            <div className="h-3 w-10 bg-slate-200 rounded-md" />
                            <div className="h-3 w-10 bg-slate-200 rounded-md" />
                            <div className="h-3 w-10 bg-slate-200 rounded-md" />
                        </div>
                        <div className="px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[7.5px] font-black uppercase tracking-widest text-emerald-700 font-fira-code">Live Diagnostic Sync</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
