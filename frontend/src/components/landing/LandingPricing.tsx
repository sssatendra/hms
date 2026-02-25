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
            'Up to 10 Beds',
            'Basic Pharmacy Support',
            'Appointment Scheduling',
            'Digital Billing',
            'Standard Support',
        ],
        cta: 'Start 14-day Trial',
        popular: false,
    },
    {
        name: 'Professional Hospital',
        price: '9,999',
        description: 'Complete HIS for mid-sized multi-specialty hospitals.',
        features: [
            'Unlimited Beds',
            'Advanced Pharmacy Inventory',
            'Full Laboratory Suite',
            'EMR & Progress Notes',
            'Pharmacy POS Integration',
            '24/7 Priority Support',
        ],
        cta: 'Get Started Now',
        popular: true,
    },
    {
        name: 'Enterprise Network',
        price: 'Custom',
        description: 'Tailored solutions for medical chains and large networks.',
        features: [
            'Multiple Branch Management',
            'Centralized Inventory',
            'Advanced BI & Analytics',
            'Custom Deployment (Cloud/On-prem)',
            'Dedicated Account Manager',
        ],
        cta: 'Contact Sales',
        popular: false,
    },
];

export function LandingPricing() {
    return (
        <section id="pricing" className="py-32 bg-slate-50 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 to-transparent blur-3xl" />

            <div className="max-w-7xl mx-auto px-6 relative">
                <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Simple Pricing</h2>
                    <p className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter">Accelerate your facility <br /> without breaking the bank.</p>
                    <p className="text-lg text-slate-600 font-medium">No hidden fees. Transparent, per-branch pricing tailored for the Indian market.</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {tiers.map((t) => (
                        <div
                            key={t.name}
                            className={cn(
                                "relative p-10 rounded-[40px] border transition-all duration-300",
                                t.popular
                                    ? "bg-slate-900 border-slate-800 shadow-2xl scale-105 z-10"
                                    : "bg-white border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200"
                            )}
                        >
                            {t.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-primary/30">
                                    Most Preferred
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className={cn("text-xl font-black mb-2", t.popular ? "text-white" : "text-slate-900")}>{t.name}</h3>
                                <p className={cn("text-sm font-medium leading-relaxed", t.popular ? "text-slate-400" : "text-slate-500")}>{t.description}</p>
                            </div>

                            <div className="mb-8 flex items-baseline gap-1">
                                <span className={cn("text-lg font-bold", t.popular ? "text-slate-400" : "text-slate-500")}>
                                    {t.price === 'Custom' ? '' : '₹'}
                                </span>
                                <span className={cn("text-5xl font-black tracking-tighter", t.popular ? "text-white" : "text-slate-900")}>
                                    {t.price}
                                </span>
                                <span className={cn("text-sm font-bold", t.popular ? "text-slate-400" : "text-slate-500")}>
                                    {t.price === 'Custom' ? '' : '/month'}
                                </span>
                            </div>

                            <div className="space-y-4 mb-10">
                                {t.features.map((f) => (
                                    <div key={f} className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                                            t.popular ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
                                        )}>
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                        <span className={cn("text-sm font-bold", t.popular ? "text-slate-300" : "text-slate-600")}>{f}</span>
                                    </div>
                                ))}
                            </div>

                            <Link
                                href={t.name === 'Enterprise Network' ? '#contact' : '/register'}
                                className={cn(
                                    "block w-full py-4 rounded-2xl text-center font-black text-xs uppercase tracking-[0.2em] transition-all hover:-translate-y-1 active:scale-95",
                                    t.popular
                                        ? "bg-primary text-white shadow-xl shadow-primary/20 hover:bg-primary/90"
                                        : "bg-slate-50 text-slate-900 border border-slate-200 hover:bg-slate-100"
                                )}
                            >
                                {t.cta}
                            </Link>
                        </div>
                    ))}
                </div>

                <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 py-8 border-y border-slate-200">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="text-emerald-500" size={24} />
                        <span className="text-sm font-bold text-slate-600">Secure 256-bit AES Encryption</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Check className="text-primary" size={24} />
                        <span className="text-sm font-bold text-slate-600">TDS Compliant Invoicing</span>
                    </div>
                    <p className="text-xs font-medium text-slate-400 italic">Prices exclude 18% GST where applicable.</p>
                </div>
            </div>
        </section>
    );
}
