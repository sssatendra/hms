'use client';

import Link from 'next/link';
import { Building2, Mail, Phone, MapPin, Twitter, Linkedin, Facebook } from 'lucide-react';

export function LandingFooter() {
    return (
        <footer className="bg-white border-t border-slate-100 pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                                <Building2 className="text-white" size={24} />
                            </div>
                            <div>
                                <span className="text-xl font-black tracking-tighter text-slate-900">HMS</span>
                                <span className="text-[10px] block font-black uppercase tracking-[0.2em] text-primary -mt-1">Cloud SaaS</span>
                            </div>
                        </Link>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">
                            Leading the digital transformation of healthcare in India. Secure, intuitive, and built for scale.
                        </p>
                        <div className="flex gap-4">
                            {[Twitter, Linkedin, Facebook].map((Icon, idx) => (
                                <Link key={idx} href="#" className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-primary/10 hover:text-primary transition-all">
                                    <Icon size={18} />
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-6">Product</h4>
                        <ul className="space-y-4">
                            {['Features', 'Modules', 'Pricing', 'Security', 'Webinars'].map(item => (
                                <li key={item}>
                                    <Link href="#" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">{item}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-6">Company</h4>
                        <ul className="space-y-4">
                            {['About Us', 'Contact', 'Careers', 'Privacy Policy', 'Terms'].map(item => (
                                <li key={item}>
                                    <Link href="#" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">{item}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-6">Contact Us</h4>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0"><Phone size={14} /></div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Sales Hotline</p>
                                    <p className="text-sm font-bold text-slate-700">+91 1800-HMS-CORP</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"><Mail size={14} /></div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Email Support</p>
                                    <p className="text-sm font-bold text-slate-700">hello@hmscloud.io</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0"><MapPin size={14} /></div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Headquarters</p>
                                    <p className="text-sm font-bold text-slate-700">Tech Park II, Whitefield, Bangalore, India</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        © 2026 HMS CLOUD SAAS. ALL RIGHTS RESERVED.
                    </p>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 grayscale group-hover:grayscale-0 transition-all opacity-50">
                            <div className="h-4 w-12 bg-slate-200 rounded" />
                            <div className="h-4 w-12 bg-slate-200 rounded" />
                            <div className="h-4 w-12 bg-slate-200 rounded" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            System Operational
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
