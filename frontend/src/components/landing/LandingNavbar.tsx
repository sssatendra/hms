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
            "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
            isScrolled ? "bg-white/80 backdrop-blur-md shadow-lg border-b border-slate-200 py-3" : "bg-transparent"
        )}>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                        <Building2 className="text-white" size={24} />
                    </div>
                    <div>
                        <span className="text-xl font-black tracking-tighter text-slate-900">HMS</span>
                        <span className="text-[10px] block font-black uppercase tracking-[0.2em] text-primary -mt-1">Cloud SaaS</span>
                    </div>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    {['Features', 'Modules', 'Pricing', 'Contact'].map((item) => (
                        <Link
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className="text-sm font-bold text-slate-600 hover:text-primary transition-colors"
                        >
                            {item}
                        </Link>
                    ))}
                    <Link
                        href="/login"
                        className="text-sm font-bold text-slate-600 hover:text-primary transition-colors"
                    >
                        Login
                    </Link>
                    <Link
                        href="/register"
                        className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-900/10"
                    >
                        Register Company
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
