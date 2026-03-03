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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden font-body transition-colors duration-500">
      {/* Immersive Background */}
      <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] bg-primary/20 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-accent/10 rounded-full blur-[100px] pointer-events-none"></div>



      {/* Main Centered Card */}
      <div className="w-full max-w-[460px] relative z-10 animate-in fade-in zoom-in-95 duration-700">

        {/* Branding header outside the main card curve */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-card shadow-xl rounded-[20px] mb-4 border border-primary/30">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-inner">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight font-heading uppercase italic">
            MedOrbit <span className="text-primary not-italic">PRIME</span>
          </h1>
          <p className="text-muted-foreground mt-1 font-bold tracking-widest uppercase text-[9px]">
            Advanced Clinical Intelligence
          </p>
        </div>

        {/* The Glassmorphic Container */}
        <div className="bg-card/70 backdrop-blur-xl rounded-[32px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)] p-8 sm:p-10 border border-border overflow-hidden relative">

          {mfaData.required ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-sm relative group">
                  <div className="absolute inset-0 bg-primary/20 rounded-2xl scale-0 group-hover:scale-100 transition-transform duration-500" />
                  <Smartphone className="h-8 w-8 text-primary relative z-10" />
                </div>
                <h2 className="text-2xl font-black text-foreground font-heading uppercase tracking-tight">Two-Factor Auth</h2>
                <p className="text-muted-foreground text-[10px] mt-2 font-black tracking-[0.2em] uppercase leading-relaxed">Identity verification required to complete <br /> the secure handshake.</p>
              </div>

              <form onSubmit={onVerifyMFA} className="space-y-6">
                <div className="space-y-3 text-center">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-fira-code">6-Digit Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full text-center py-5 bg-muted/50 border-2 border-border rounded-[24px] text-4xl font-black tracking-[0.4em] outline-none focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all font-fira-code placeholder:opacity-20 text-foreground"
                    autoFocus
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={otpCode.length !== 6 || isVerify2FAPending}
                    className="w-full py-5 bg-primary text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3 font-fira-code group"
                  >
                    {isVerify2FAPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Shield className="h-5 w-5 group-hover:scale-110 transition-transform" />}
                    Confirm Identity
                  </button>

                  <button
                    type="button"
                    onClick={() => setMfaData({ required: false, token: '' })}
                    className="w-full mt-4 py-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors flex items-center justify-center gap-2 group"
                  >
                    <div className="h-px w-4 bg-muted group-hover:w-8 transition-all" />
                    Cancel & Restart Login
                    <div className="h-px w-4 bg-muted group-hover:w-8 transition-all" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-black text-foreground font-heading uppercase">
                  Secure Sign In
                </h2>
                <p className="text-muted-foreground text-xs mt-1 font-medium italic tracking-widest uppercase">
                  Enter credentials to access portal
                </p>
              </div>

              {/* Error Feedback */}
              {loginError && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-[11px] font-bold animate-in stretch-in-y duration-300 flex items-center justify-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse"></div>
                  {loginError.message}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Hospital Identifier */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                    Workspace ID
                  </label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary group-focus-within:scale-110 group-focus-within:text-accent transition-all" />
                    <input
                      {...register('tenant_slug')}
                      type="text"
                      placeholder="demo-hospital"
                      className={cn(
                        'w-full pl-11 pr-4 py-3.5 bg-background border rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/15 transition-all outline-none border-border hover:bg-muted/30 focus:bg-background text-foreground placeholder:text-muted-foreground/30',
                        'autofill:bg-muted autofill:text-foreground',
                        errors.tenant_slug && 'border-destructive bg-destructive/5'
                      )}
                    />
                  </div>
                </div>

                {/* Email Contact */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary group-focus-within:scale-110 group-focus-within:text-accent transition-all" />
                    <input
                      {...register('email')}
                      type="email"
                      autoComplete="email"
                      placeholder="user@hospital.com"
                      className={cn(
                        'w-full pl-11 pr-4 py-3.5 bg-background border rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/15 transition-all outline-none border-border hover:bg-muted/30 focus:bg-background text-foreground placeholder:text-muted-foreground/30',
                        'autofill:bg-muted autofill:text-foreground',
                        errors.email && 'border-destructive bg-destructive/5'
                      )}
                    />
                  </div>
                </div>

                {/* Security Pin */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      Password
                    </label>
                    <button type="button" className="text-[10px] font-bold text-primary hover:text-accent transition-colors hover:underline">
                      Reset?
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary group-focus-within:scale-110 group-focus-within:text-accent transition-all" />
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className={cn(
                        'w-full pl-11 pr-12 py-3.5 bg-background border rounded-2xl text-sm font-black focus:outline-none focus:ring-4 focus:ring-primary/15 transition-all outline-none border-border hover:bg-muted/30 focus:bg-background text-foreground tracking-widest placeholder:tracking-normal placeholder:text-muted-foreground/30',
                        'autofill:bg-muted autofill:text-foreground',
                        errors.password && 'border-destructive bg-destructive/5'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-primary transition-colors"
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
                    className="w-full py-4 px-6 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-2xl hover:shadow-[0_8px_16px_rgba(0,0,0,0.2)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 text-sm group uppercase tracking-[0.15em]"
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
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-center mb-3">
                  Simulation Profiles
                </p>
                <div className="flex flex-col gap-2">
                  {/* Simulation Profiles */}
                  {[
                    { r: 'ADMIN', u: 'admin@demo-hospital.com', bg: 'bg-primary/10', t: 'text-primary' },
                    { r: 'DOCTOR', u: 'doctor@demo-hospital.com', bg: 'bg-accent/10', t: 'text-accent' },
                    { r: 'PHARMA', u: 'pharmacist@demo-hospital.com', bg: 'bg-indigo-500/10', t: 'text-indigo-600' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-row items-center justify-between p-2.5 rounded-xl bg-muted/20 hover:bg-muted/40 border border-border transition-all cursor-copy group">
                      <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md", item.bg, item.t)}>
                        {item.r}
                      </span>
                      <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground">
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
        <div className="mt-8 text-center text-muted-foreground/40">
          <div className="flex justify-center gap-6 text-[9px] font-bold uppercase tracking-widest">
            <button className="hover:text-primary transition-colors">Help</button>
            <button className="hover:text-primary transition-colors">Privacy</button>
            <button className="hover:text-primary transition-colors">Terms</button>
          </div>
        </div>
      </div>
    </div>
  );
}
