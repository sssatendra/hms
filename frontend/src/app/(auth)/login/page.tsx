'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Lock, Mail, Building2, ArrowUpRight, Shield, Smartphone } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const loginSchema = z.object({
  tenant_slug: z.string().min(1, 'Hospital ID is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [mfaData, setMfaData] = useState<{ required: boolean; token: string }>({ required: false, token: '' });
  const [otpCode, setOtpCode] = useState('');

  const { login, verify2FA, isLoginPending, isVerify2FAPending, loginError, verify2FAError } = useAuth();

  useEffect(() => {
    if (verify2FAError) {
      toast.error(verify2FAError.message || 'Invalid verification code');
    }
  }, [verify2FAError]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      tenant_slug: 'demo-hospital',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await login(data.email, data.password, data.tenant_slug);
      if (res.data?.mfa_required) {
        setMfaData({ required: true, token: res.data.mfa_token! });
      }
    } catch {
      // Error handled by mutation
    }
  };

  const onVerifyMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return;
    try {
      await verify2FA({ mfa_token: mfaData.token, otp_code: otpCode });
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
      <div className="w-full max-w-[460px] relative z-10 animate-in fade-in zoom-in-95 duration-700">

        {/* Branding header outside the main card curve */}
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
            Advanced Clinical Intelligence
          </p>
        </div>

        {/* The Glassmorphic Container */}
        <div className="bg-white/70 backdrop-blur-xl rounded-[32px] shadow-[0_24px_48px_-12px_rgba(8,145,178,0.15)] p-8 sm:p-10 border border-white/80 overflow-hidden relative">

          {mfaData.required ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-teal-100 shadow-sm relative group">
                  <div className="absolute inset-0 bg-teal-500/10 rounded-2xl scale-0 group-hover:scale-100 transition-transform duration-500" />
                  <Smartphone className="h-8 w-8 text-teal-600 relative z-10" />
                </div>
                <h2 className="text-2xl font-black text-[#164E63] font-heading uppercase tracking-tight">Two-Factor Auth</h2>
                <p className="text-[#164E63]/60 text-[10px] mt-2 font-black tracking-[0.2em] uppercase leading-relaxed">Identity verification required to complete <br /> the secure handshake.</p>
              </div>

              <form onSubmit={onVerifyMFA} className="space-y-6">
                <div className="space-y-3 text-center">
                  <label className="text-[10px] font-black text-[#164E63]/40 uppercase tracking-widest font-fira-code">6-Digit Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full text-center py-5 bg-teal-50/50 border-2 border-teal-100 rounded-[24px] text-4xl font-black tracking-[0.4em] outline-none focus:border-teal-500 focus:ring-8 focus:ring-teal-500/5 transition-all font-fira-code placeholder:opacity-20 text-teal-900"
                    autoFocus
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={otpCode.length !== 6 || isVerify2FAPending}
                    className="w-full py-5 bg-teal-900 text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-teal-900/40 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3 font-fira-code group"
                  >
                    {isVerify2FAPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Shield className="h-5 w-5 group-hover:scale-110 transition-transform" />}
                    Confirm Identity
                  </button>

                  <button
                    type="button"
                    onClick={() => setMfaData({ required: false, token: '' })}
                    className="w-full mt-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-teal-600 transition-colors flex items-center justify-center gap-2 group"
                  >
                    <div className="h-px w-4 bg-slate-200 group-hover:w-8 transition-all" />
                    Cancel & Restart Login
                    <div className="h-px w-4 bg-slate-200 group-hover:w-8 transition-all" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-black text-[#164E63] font-heading uppercase">
                  Secure Sign In
                </h2>
                <p className="text-[#164E63]/60 text-xs mt-1 font-medium italic tracking-widest uppercase">
                  Enter credentials to access portal
                </p>
              </div>

              {/* Error Feedback */}
              {loginError && (
                <div className="mb-6 p-4 bg-rose-50/80 border border-rose-100 rounded-2xl text-rose-600 text-[11px] font-bold animate-in stretch-in-y duration-300 flex items-center justify-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                  {loginError.message}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Hospital Identifier */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#164E63]/50 uppercase tracking-widest ml-1">
                    Workspace ID
                  </label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0891B2] group-focus-within:scale-110 group-focus-within:text-[#059669] transition-all" />
                    <input
                      {...register('tenant_slug')}
                      type="text"
                      placeholder="demo-hospital"
                      className={cn(
                        'w-full pl-11 pr-4 py-3.5 bg-white/60 border rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[#0891B2]/15 transition-all outline-none border-[#0891B2]/10 hover:bg-white focus:bg-white',
                        errors.tenant_slug && 'border-rose-300 bg-rose-50/50'
                      )}
                    />
                  </div>
                </div>

                {/* Email Contact */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#164E63]/50 uppercase tracking-widest ml-1">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0891B2] group-focus-within:scale-110 group-focus-within:text-[#059669] transition-all" />
                    <input
                      {...register('email')}
                      type="email"
                      autoComplete="email"
                      placeholder="user@hospital.com"
                      className={cn(
                        'w-full pl-11 pr-4 py-3.5 bg-white/60 border rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[#0891B2]/15 transition-all outline-none border-[#0891B2]/10 hover:bg-white focus:bg-white',
                        errors.email && 'border-rose-300 bg-rose-50/50'
                      )}
                    />
                  </div>
                </div>

                {/* Security Pin */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-[#164E63]/50 uppercase tracking-widest">
                      Password
                    </label>
                    <button type="button" className="text-[10px] font-bold text-[#0891B2] hover:text-[#059669] transition-colors hover:underline">
                      Reset?
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0891B2] group-focus-within:scale-110 group-focus-within:text-[#059669] transition-all" />
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className={cn(
                        'w-full pl-11 pr-12 py-3.5 bg-white/60 border rounded-2xl text-sm font-black focus:outline-none focus:ring-4 focus:ring-[#0891B2]/15 transition-all outline-none border-[#0891B2]/10 hover:bg-white focus:bg-white tracking-widest placeholder:tracking-normal',
                        errors.password && 'border-rose-300 bg-rose-50/50'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#164E63]/30 hover:text-[#0891B2] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Sign In Trigger */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoginPending}
                    className="w-full py-4 px-6 bg-gradient-to-r from-[#0891B2] to-[#059669] text-white font-bold rounded-2xl hover:shadow-[0_8px_16px_rgba(8,145,178,0.25)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 text-sm group uppercase tracking-[0.15em]"
                  >
                    {isLoginPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowUpRight className="h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Compact Diagnostic Access */}
              <div className="mt-8 pt-6 border-t border-[#164E63]/10">
                <p className="text-[9px] font-bold text-[#164E63]/50 uppercase tracking-widest text-center mb-3">
                  Simulation Profiles
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    { r: 'ADMIN', u: 'admin@demo-hospital.com', bg: 'bg-[#0891B2]/10', t: 'text-[#0891B2]' },
                    { r: 'DOCTOR', u: 'doctor@demo-hospital.com', bg: 'bg-[#059669]/10', t: 'text-[#059669]' },
                    { r: 'PHARMA', u: 'pharmacist@demo-hospital.com', bg: 'bg-indigo-500/10', t: 'text-indigo-600' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-row items-center justify-between p-2.5 rounded-xl bg-white/50 border border-white hover:bg-white hover:shadow-sm hover:border-[#0891B2]/10 transition-all cursor-copy group">
                      <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md", item.bg, item.t)}>
                        {item.r}
                      </span>
                      <span className="text-[10px] font-semibold text-[#164E63]/70 group-hover:text-[#164E63]">
                        {item.u}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer Audit */}
        <div className="mt-8 text-center text-[#164E63]/40">
          <div className="flex justify-center gap-6 text-[9px] font-bold uppercase tracking-widest">
            <button className="hover:text-[#0891B2] transition-colors">Help</button>
            <button className="hover:text-[#0891B2] transition-colors">Privacy</button>
            <button className="hover:text-[#0891B2] transition-colors">Terms</button>
          </div>
        </div>
      </div>
    </div>
  );
}
