'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Lock, Mail, Building2, ArrowUpRight, User, Phone, Globe } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const registerSchema = z.object({
    tenant_name: z.string().min(2, 'Company name is required'),
    tenant_slug: z.string().min(2, 'Workspace ID is required').regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and a number'),
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    phone: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const { register: registerCompany, isRegisterPending, registerError } = useAuth();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    // Auto-generate slug from name
    const companyName = watch('tenant_name');
    const onCompanyNameBlur = () => {
        if (companyName && !watch('tenant_slug')) {
            const slug = companyName
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            setValue('tenant_slug', slug);
        }
    };

    const onSubmit = async (data: RegisterForm) => {
        try {
            await registerCompany(data);
        } catch {
            // Error handled by mutation
        }
    };

    return (
        <div className="min-h-screen bg-[#F0FDF4] flex items-center justify-center p-4 relative overflow-hidden font-body">
            {/* Immersive Background */}
            <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] bg-[#22D3EE]/20 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-[#059669]/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Subtle Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z' fill='%230891b2' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }}>
            </div>

            {/* Main Centered Card */}
            <div className="w-full max-w-[600px] relative z-10 animate-in fade-in zoom-in-95 duration-700">

                {/* Branding header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white shadow-xl rounded-[20px] mb-4 border border-[#22D3EE]/30">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#0891B2] to-[#059669] rounded-xl flex items-center justify-center shadow-inner">
                            <Building2 className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-[#164E63] tracking-tight font-heading uppercase italic">
                        HMS <span className="text-[#0891B2] not-italic">PRIME</span>
                    </h1>
                    <p className="text-[#164E63]/60 mt-1 font-bold tracking-widest uppercase text-[9px]">
                        Launch Your Clinical Workspace
                    </p>
                </div>

                {/* The Glassmorphic Container */}
                <div className="bg-white/70 backdrop-blur-xl rounded-[32px] shadow-[0_24px_48px_-12px_rgba(8,145,178,0.15)] p-8 sm:p-10 border border-white/80">

                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-black text-[#164E63] font-heading uppercase">
                            Company Registration
                        </h2>
                        <p className="text-[#164E63]/60 text-xs mt-1 font-medium italic tracking-widest uppercase">
                            Create your tenant-isolated environment
                        </p>
                    </div>

                    {/* Error Feedback */}
                    {registerError && (
                        <div className="mb-6 p-4 bg-rose-50/80 border border-rose-100 rounded-2xl text-rose-600 text-[11px] font-bold animate-in stretch-in-y duration-300 flex items-center justify-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                            {registerError.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Section: Company Details */}
                        <div className="bg-[#0891B2]/5 p-6 rounded-[24px] border border-[#0891B2]/10 space-y-4">
                            <h3 className="text-[10px] font-black text-[#0891B2] uppercase tracking-[0.2em] mb-4">Workspace Identity</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-[#164E63]/50 uppercase tracking-widest ml-1">
                                        Company Name
                                    </label>
                                    <div className="relative group">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0891B2] group-focus-within:scale-110 group-focus-within:text-[#059669] transition-all" />
                                        <input
                                            {...register('tenant_name')}
                                            onBlur={onCompanyNameBlur}
                                            type="text"
                                            placeholder="St. Mary Hospital"
                                            className={cn(
                                                'w-full pl-11 pr-4 py-3 bg-white/60 border rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[#0891B2]/15 transition-all outline-none border-[#0891B2]/10 hover:bg-white focus:bg-white',
                                                errors.tenant_name && 'border-rose-300 bg-rose-50/50'
                                            )}
                                        />
                                    </div>
                                    {errors.tenant_name && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.tenant_name.message}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-[#164E63]/50 uppercase tracking-widest ml-1">
                                        Workspace ID (Slug)
                                    </label>
                                    <div className="relative group">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0891B2] group-focus-within:scale-110 group-focus-within:text-[#059669] transition-all" />
                                        <input
                                            {...register('tenant_slug')}
                                            type="text"
                                            placeholder="st-mary-hospital"
                                            className={cn(
                                                'w-full pl-11 pr-4 py-3 bg-white/60 border rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#0891B2]/15 transition-all outline-none border-[#0891B2]/10 hover:bg-white focus:bg-white text-[#0891B2]',
                                                errors.tenant_slug && 'border-rose-300 bg-rose-50/50'
                                            )}
                                        />
                                    </div>
                                    {errors.tenant_slug && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.tenant_slug.message}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section: Admin Account */}
                        <div className="bg-[#059669]/5 p-6 rounded-[24px] border border-[#059669]/10 space-y-4">
                            <h3 className="text-[10px] font-black text-[#059669] uppercase tracking-[0.2em] mb-4">Primary Administrator</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-[#164E63]/50 uppercase tracking-widest ml-1">
                                        First Name
                                    </label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#059669] transition-all" />
                                        <input
                                            {...register('first_name')}
                                            type="text"
                                            placeholder="John"
                                            className={cn(
                                                'w-full pl-11 pr-4 py-3 bg-white/60 border rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[#059669]/15 transition-all outline-none border-[#059669]/10 hover:bg-white focus:bg-white',
                                                errors.first_name && 'border-rose-300 bg-rose-50/50'
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-[#164E63]/50 uppercase tracking-widest ml-1">
                                        Last Name
                                    </label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#059669] transition-all" />
                                        <input
                                            {...register('last_name')}
                                            type="text"
                                            placeholder="Doe"
                                            className={cn(
                                                'w-full pl-11 pr-4 py-3 bg-white/60 border rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[#059669]/15 transition-all outline-none border-[#059669]/10 hover:bg-white focus:bg-white',
                                                errors.last_name && 'border-rose-300 bg-rose-50/50'
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-[#164E63]/50 uppercase tracking-widest ml-1">
                                        Email Address
                                    </label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#059669] transition-all" />
                                        <input
                                            {...register('email')}
                                            type="email"
                                            placeholder="admin@hospital.com"
                                            className={cn(
                                                'w-full pl-11 pr-4 py-3 bg-white/60 border rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[#059669]/15 transition-all outline-none border-[#059669]/10 hover:bg-white focus:bg-white',
                                                errors.email && 'border-rose-300 bg-rose-50/50'
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-[#164E63]/50 uppercase tracking-widest ml-1">
                                        Contact Phone
                                    </label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#059669] transition-all" />
                                        <input
                                            {...register('phone')}
                                            type="tel"
                                            placeholder="+1 (555) 000-0000"
                                            className={cn(
                                                'w-full pl-11 pr-4 py-3 bg-white/60 border rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[#059669]/15 transition-all outline-none border-[#059669]/10 hover:bg-white focus:bg-white',
                                                errors.phone && 'border-rose-300 bg-rose-50/50'
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-[#164E63]/50 uppercase tracking-widest ml-1">
                                    Admin Password
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#059669] transition-all" />
                                    <input
                                        {...register('password')}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className={cn(
                                            'w-full pl-11 pr-12 py-3 bg-white/60 border rounded-2xl text-sm font-black focus:outline-none focus:ring-4 focus:ring-[#059669]/15 transition-all outline-none border-[#059669]/10 hover:bg-white focus:bg-white tracking-widest placeholder:tracking-normal',
                                            errors.password && 'border-rose-300 bg-rose-50/50'
                                        )}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#164E63]/30 hover:text-[#059669] transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.password.message}</p>}
                            </div>
                        </div>

                        {/* Register Trigger */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isRegisterPending}
                                className="w-full py-4 px-6 bg-gradient-to-r from-[#0891B2] to-[#059669] text-white font-bold rounded-2xl hover:shadow-[0_8px_16px_rgba(8,145,178,0.25)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 text-sm group uppercase tracking-[0.15em]"
                            >
                                {isRegisterPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Provisioning Workspace...
                                    </>
                                ) : (
                                    <>
                                        Register Company
                                        <ArrowUpRight className="h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-xs font-medium text-[#164E63]/60">
                            Already have an account?{' '}
                            <Link href="/login" className="text-[#0891B2] font-bold hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </div>

                </div>

                {/* Footer Credits */}
                <div className="mt-8 text-center text-[#164E63]/40">
                    <p className="text-[9px] font-bold uppercase tracking-widest">
                        By registering, you agree to our <button className="hover:text-[#0891B2] transition-colors underline">Terms of Service</button> and <button className="hover:text-[#0891B2] transition-colors underline">Privacy Policy</button>
                    </p>
                </div>
            </div>
        </div>
    );
}
