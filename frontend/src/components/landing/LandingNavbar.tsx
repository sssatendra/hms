'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Menu, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LandingNavbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={cn(
            "fixed top-4 left-4 right-4 z-50 transition-all duration-500 rounded-2xl px-6 py-3 border transition-all",
            isScrolled
                ? "bg-white/70 backdrop-blur-2xl shadow-2xl shadow-emerald-500/10 border-emerald-100/50 py-2.5 scale-[0.98]"
                : "bg-white/10 backdrop-blur-md border-white/20 py-3"
        )}>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-cyan-700 rounded-xl flex items-center justify-center shadow-2xl shadow-emerald-500/20 group-hover:rotate-6 transition-all duration-500">
                        <Building2 className="text-emerald-50" size={22} />
                    </div>
                    <div>
                        <span className="text-lg font-black tracking-tighter text-slate-900 font-fira-sans uppercase">MedOrbit</span>
                        <span className="text-[8px] block font-black uppercase tracking-[0.25em] text-emerald-600 -mt-1 font-fira-code">v4.0 Protocol</span>
                    </div>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-6">
                    {['Features', 'Modules', 'Pricing', 'Contact'].map((item) => (
                        <Link
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-emerald-600 transition-colors font-fira-code"
                        >
                            {item}
                        </Link>
                    ))}
                    <div className="h-3 w-px bg-emerald-100 mx-1"></div>
                    <Link
                        href="/login"
                        className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-900 hover:text-emerald-600 transition-colors font-fira-code"
                    >
                        Login
                    </Link>
                    <Link
                        href="/register"
                        className="px-5 py-2.5 bg-emerald-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-emerald-800 transition-all hover:shadow-lg hover:shadow-emerald-900/10 active:scale-95 font-fira-code"
                    >
                        Register
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden p-2 text-slate-900"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 p-6 flex flex-col gap-4 md:hidden animate-in slide-in-from-top-4 duration-300">
                    {['Features', 'Modules', 'Pricing', 'Contact'].map((item) => (
                        <Link
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-lg font-bold text-slate-900 hover:text-primary"
                        >
                            {item}
                        </Link>
                    ))}
                    <Link
                        href="/login"
                        className="w-full py-4 border border-slate-200 text-slate-900 rounded-xl text-center font-bold text-lg"
                    >
                        Client Login
                    </Link>
                    <Link
                        href="/register"
                        className="w-full py-4 bg-primary text-white rounded-xl text-center font-bold text-lg shadow-lg shadow-primary/20"
                    >
                        Register Company
                    </Link>
                </div>
            )}
        </nav>
    );
}
