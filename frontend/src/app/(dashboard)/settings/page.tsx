'use client';

import { User, Shield, Bell, Building, CheckCircle2, Loader2, Edit2, Settings, Lock, Key, Smartphone, Mail, AlertTriangle, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { coreApi as api } from '@/lib/api';
import { toast } from 'sonner';

export default function SettingsPage() {
    const { user, tenant, setUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState('profile');

    const [profileForm, setProfileForm] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
    });

    const [settingsForm, setSettingsForm] = useState({
        name: tenant?.name || '',
        currency: tenant?.settings?.currency || 'USD',
        country: tenant?.settings?.country || 'US',
    });

    const [securityForm, setSecurityForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    const [showPassword, setShowPassword] = useState(false);

    const [notificationPrefs, setNotificationPrefs] = useState({
        email_appointments: user?.settings?.email_appointments ?? true,
        email_lab_results: user?.settings?.email_lab_results ?? true,
        email_billing: user?.settings?.email_billing ?? true,
        in_app_system: user?.settings?.in_app_system ?? true,
    });

    const updateProfileMutation = useMutation({
        mutationFn: async (data: any) => {
            return api.put(`/users/${user?.id}`, data);
        },
        onSuccess: (res: any) => {
            if (tenant) {
                setUser(res.data, tenant);
                toast.success('Profile identification updated');
            }
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        }
    });

    useEffect(() => {
        if (tenant) {
            setSettingsForm({
                name: tenant.name || '',
                currency: tenant.settings?.currency || 'USD',
                country: tenant.settings?.country || 'US',
            });
        }
        if (user) {
            setProfileForm({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
            });
            setNotificationPrefs({
                email_appointments: user.settings?.email_appointments ?? true,
                email_lab_results: user.settings?.email_lab_results ?? true,
                email_billing: user.settings?.email_billing ?? true,
                in_app_system: user.settings?.in_app_system ?? true,
            });
        }
    }, [tenant, user]);

    const updateSettingsMutation = useMutation({
        mutationFn: async (data: any) => {
            const payload = {
                name: data.name,
                settings: {
                    currency: data.currency,
                    country: data.country
                }
            };
            return api.patch('/tenants/settings', payload);
        },
        onSuccess: (res: any) => {
            if (user && res.data) {
                setUser(user, res.data);
                toast.success('Hospital settings updated');
            }
        }
    });

    const changePasswordMutation = useMutation({
        mutationFn: async (data: any) => {
            return api.post('/auth/change-password', {
                current_password: data.current_password,
                new_password: data.new_password,
            });
        },
        onSuccess: () => {
            setSecurityForm({ current_password: '', new_password: '', confirm_password: '' });
            toast.success('Password updated successfully');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to change password');
        }
    });

    const updatePreferencesMutation = useMutation({
        mutationFn: async (data: any) => {
            return api.put(`/users/${user?.id}`, {
                settings: data
            });
        },
        onSuccess: (res: any) => {
            if (tenant) {
                setUser(res.data, tenant);
                toast.success('Notification preferences saved');
            }
        }
    });

    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
    const [mfaSetup, setMfaSetup] = useState<{ secret: string; qrCode: string } | null>(null);
    const [otpCode, setOtpCode] = useState('');

    const setup2FAMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post<{ secret: string; otpauth_url: string }>('/auth/2fa/setup');
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(res.data.otpauth_url)}`;
            return { secret: res.data.secret, qrCode: qrUrl };
        },
        onSuccess: (data) => {
            setMfaSetup(data);
            setIs2FAModalOpen(true);
        },
        onError: () => {
            toast.error('Failed to generate 2FA secret');
        }
    });

    const verify2FASetupMutation = useMutation({
        mutationFn: async (token: string) => {
            return api.post('/auth/2fa/verify', { token });
        },
        onSuccess: (res: any) => {
            if (tenant) {
                setUser(res.data.user || user, tenant);
                setIs2FAModalOpen(false);
                setMfaSetup(null);
                setOtpCode('');
                toast.success('2FA enabled successfully');
                // Refresh user data
                api.get('/auth/me').then(meRes => setUser(meRes.data.user, meRes.data.tenant));
            }
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Invalid verification code');
        }
    });

    const disable2FAMutation = useMutation({
        mutationFn: async (token: string) => {
            return api.post('/auth/2fa/disable', { token });
        },
        onSuccess: (res: any) => {
            if (tenant) {
                setUser(res.data.user || user, tenant);
                setIs2FAModalOpen(false);
                setOtpCode('');
                toast.success('2FA disabled');
                // Refresh user data
                api.get('/auth/me').then(meRes => setUser(meRes.data.user, meRes.data.tenant));
            }
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Invalid verification code');
        }
    });

    const tabs = [
        { id: 'profile', label: 'User Profile', icon: User },
        { id: 'clinic', label: 'Hospital Details', icon: Building },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-[1400px] mx-auto p-4 lg:p-6 font-fira-sans">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#115E59] to-[#0D9488] px-8 py-10 rounded-[40px] shadow-2xl shadow-teal-900/10 text-white hover:shadow-teal-900/20 transition-all duration-500">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center shadow-inner">
                            <Settings className="h-6 w-6 text-teal-100" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1.5 opacity-80">
                                <div className="px-2.5 py-0.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[7px] font-black uppercase tracking-widest">Configuration Center</div>
                                <span className="text-[8px] font-black text-teal-200 uppercase tracking-widest border-l border-white/20 pl-2.5 font-fira-code">Secure Node</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-black tracking-tighter leading-tight uppercase">
                                Account <span className="text-teal-100/40 font-fira-sans">& Dashboard</span>
                            </h1>
                        </div>
                    </div>
                </div>
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
            </div>

            <div className="bg-card rounded-[40px] border border-border shadow-2xl shadow-black/5 overflow-hidden flex flex-col md:flex-row min-h-[650px]">
                {/* Sidebar */}
                <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-border bg-muted/20 p-6">
                    <nav className="space-y-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all duration-300 font-fira-code group',
                                    activeTab === tab.id
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                )}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 lg:p-12 bg-card/10">
                    {activeTab === 'profile' && (
                        <div className="max-w-2xl space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-8 p-6 bg-muted/30 rounded-[32px] border border-border">
                                <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-[28px] flex items-center justify-center text-primary-foreground text-3xl font-black border-4 border-background shadow-2xl uppercase">
                                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-foreground uppercase">Account Persona</h3>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-fira-code">{(typeof user?.role === 'string' ? user.role : user?.role?.name || '').replace('_', ' ')}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-fira-code ml-1">First Name</label>
                                    <input type="text" value={profileForm.first_name} onChange={e => setProfileForm(p => ({ ...p, first_name: e.target.value }))} className="w-full px-5 py-4 bg-background border border-border rounded-2xl text-[11px] font-black uppercase tracking-wider outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-foreground" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-fira-code ml-1">Last Name</label>
                                    <input type="text" value={profileForm.last_name} onChange={e => setProfileForm(p => ({ ...p, last_name: e.target.value }))} className="w-full px-5 py-4 bg-background border border-border rounded-2xl text-[11px] font-black uppercase tracking-wider outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-foreground" />
                                </div>
                            </div>

                            <button
                                onClick={() => updateProfileMutation.mutate(profileForm)}
                                disabled={updateProfileMutation.isPending}
                                className="px-8 py-4 bg-primary text-primary-foreground rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 font-fira-code flex items-center gap-2"
                            >
                                {updateProfileMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                Update Identification
                            </button>
                        </div>
                    )}

                    {activeTab === 'clinic' && (
                        <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-fira-code ml-1">Hospital Designation</label>
                                <input type="text" value={settingsForm.name} onChange={e => setSettingsForm(p => ({ ...p, name: e.target.value }))} className="w-full px-5 py-4 bg-background border border-border rounded-2xl text-[11px] font-black uppercase tracking-wider outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-foreground" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-fira-code ml-1">Currency</label>
                                    <select value={settingsForm.currency} onChange={e => setSettingsForm(p => ({ ...p, currency: e.target.value }))} className="w-full px-5 py-4 bg-background border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-foreground">
                                        <option value="USD">USD ($)</option>
                                        <option value="INR">INR (₹)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="EUR">EUR (€)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-fira-code ml-1">Region</label>
                                    <select value={settingsForm.country} onChange={e => setSettingsForm(p => ({ ...p, country: e.target.value }))} className="w-full px-5 py-4 bg-background border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-foreground">
                                        <option value="US">United States</option>
                                        <option value="IN">India</option>
                                        <option value="GB">United Kingdom</option>
                                    </select>
                                </div>
                            </div>
                            <button onClick={() => updateSettingsMutation.mutate(settingsForm)} disabled={updateSettingsMutation.isPending} className="px-8 py-4 bg-primary text-primary-foreground rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-3 disabled:opacity-50 active:scale-95 font-fira-code">
                                {updateSettingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
                                Sync Configuration
                            </button>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="max-w-2xl space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="bg-muted/10 p-8 rounded-[32px] border border-border shadow-inner">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-card rounded-2xl border border-border flex items-center justify-center text-primary shadow-sm">
                                        <Mail className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-foreground uppercase">Email Transmissions</h3>
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest font-fira-code">Primary Channel: {user?.email}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { id: 'email_appointments', label: 'Appointment Confirmations', desc: 'Alerts for new or rescheduled patient visits' },
                                        { id: 'email_lab_results', label: 'Critical Lab Results', desc: 'Secure alerts for completed diagnostic reports' },
                                        { id: 'email_billing', label: 'Financial Statements', desc: 'Invoices and payment confirmations' },
                                    ].map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-4 bg-background border border-border hover:border-primary/50 transition-all group rounded-2xl">
                                            <div>
                                                <p className="text-[10px] font-black text-foreground uppercase tracking-wider">{item.label}</p>
                                                <p className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest font-fira-code leading-relaxed">{item.desc}</p>
                                            </div>
                                            <button
                                                onClick={() => setNotificationPrefs(p => ({ ...p, [item.id as any]: !(p as any)[item.id] }))}
                                                className={cn(
                                                    "w-12 h-6 rounded-full transition-all duration-300 relative border-2",
                                                    (notificationPrefs as any)[item.id] ? "bg-teal-600 border-teal-700 shadow-lg shadow-teal-600/20" : "bg-slate-200 border-slate-300"
                                                )}
                                            >
                                                <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm", (notificationPrefs as any)[item.id] ? "left-6" : "left-1")} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 shadow-inner">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm">
                                            <Bell className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 uppercase">In-App System Alerts</h3>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-fira-code">Navigation Bar Notifications</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setNotificationPrefs(p => ({ ...p, in_app_system: !p.in_app_system }))}
                                        className={cn(
                                            "w-12 h-6 rounded-full transition-all duration-300 relative border-2",
                                            notificationPrefs.in_app_system ? "bg-slate-700 border-slate-800 shadow-lg shadow-slate-600/20" : "bg-slate-200 border-slate-300"
                                        )}
                                    >
                                        <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm", notificationPrefs.in_app_system ? "left-6" : "left-1")} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => updatePreferencesMutation.mutate(notificationPrefs)}
                                    disabled={updatePreferencesMutation.isPending}
                                    className="px-8 py-4 bg-primary text-primary-foreground rounded-[24px] text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-3 active:scale-95 font-fira-code"
                                >
                                    {updatePreferencesMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                                    Save Preference Matrix
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="max-w-2xl space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="bg-rose-500/5 p-8 rounded-[32px] border border-rose-500/20 shadow-inner">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-card rounded-2xl border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-sm">
                                        <Lock className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-foreground uppercase">Authentication Upgrade</h3>
                                        <p className="text-[9px] font-black text-rose-500/60 uppercase tracking-widest font-fira-code">Periodic resets are recommended</p>
                                    </div>
                                </div>
                                <div className="space-y-5">
                                    <div className="relative group">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Current Access Credential"
                                            value={securityForm.current_password}
                                            onChange={e => setSecurityForm(p => ({ ...p, current_password: e.target.value }))}
                                            className="w-full px-5 py-4 bg-background border border-border rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-300 transition-all font-fira-code text-foreground"
                                        />
                                        <Lock className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-500/30" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative group">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="New Security Key"
                                                value={securityForm.new_password}
                                                onChange={e => setSecurityForm(p => ({ ...p, new_password: e.target.value }))}
                                                className="w-full px-5 py-4 bg-background border border-border rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-300 transition-all font-fira-code text-foreground"
                                            />
                                            <Key className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-500/30" />
                                        </div>
                                        <div className="relative group">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Confirm New Key"
                                                value={securityForm.confirm_password}
                                                onChange={e => setSecurityForm(p => ({ ...p, confirm_password: e.target.value }))}
                                                className="w-full px-5 py-4 bg-background border border-border rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-300 transition-all font-fira-code text-foreground"
                                            />
                                            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-rose-500/40 hover:text-rose-500 transition-colors">
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => changePasswordMutation.mutate(securityForm)}
                                        disabled={changePasswordMutation.isPending || !securityForm.new_password || securityForm.new_password !== securityForm.confirm_password}
                                        className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20 active:scale-[0.98] transition-all disabled:opacity-50 font-fira-code flex items-center justify-center gap-3"
                                    >
                                        {changePasswordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                                        Initialize Protocol Reset
                                    </button>
                                    {securityForm.new_password && securityForm.confirm_password && securityForm.new_password !== securityForm.confirm_password && (
                                        <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest text-center animate-bounce">Keys do not match</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[38px] shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                                    <Smartphone className="w-32 h-32 -rotate-12" />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="px-3 py-1 bg-teal-500/10 text-teal-500 rounded-full text-[8px] font-black uppercase tracking-widest border border-teal-500/20">Industrial Grade</div>
                                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Multi-Factor (2FA)</h3>
                                        </div>
                                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest font-fira-code leading-relaxed mb-6">Secures your account with a mobile authentication layer. Prevents unauthorized node access even if credentials are compromised.</p>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 rounded-xl border border-rose-500/20 w-fit">
                                            <AlertTriangle className="h-3 w-3 text-rose-500" />
                                            <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Recommended Defense</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => user?.two_factor_enabled ? setIs2FAModalOpen(true) : setup2FAMutation.mutate()}
                                        disabled={setup2FAMutation.isPending}
                                        className={cn(
                                            "px-10 py-6 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl font-fira-code flex flex-col items-center gap-2 border-2",
                                            user?.two_factor_enabled
                                                ? "bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20"
                                                : "bg-white text-slate-900 border-slate-100 shadow-white/10 hover:bg-slate-50"
                                        )}
                                    >
                                        {setup2FAMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Smartphone className="h-5 w-5 mb-1" />}
                                        {user?.two_factor_enabled ? 'Active Protect' : 'Enable 2FA'}
                                        <span className="text-[7px] opacity-40 -mt-1">{user?.two_factor_enabled ? 'Tap to Manage' : 'Mobile Verify Required'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 2FA Setup/Disable Modal */}
            {is2FAModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => { setIs2FAModalOpen(false); setMfaSetup(null); setOtpCode(''); }} />
                    <div className="relative bg-white rounded-[40px] shadow-2xl border border-teal-100 w-full max-w-[480px] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-10">
                            {user?.two_factor_enabled ? (
                                <div className="space-y-8">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-rose-50 rounded-[24px] flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm relative group">
                                            <div className="absolute inset-0 bg-rose-500/10 rounded-[24px] scale-0 group-hover:scale-100 transition-transform duration-500" />
                                            <Shield className="h-8 w-8 text-rose-600 relative z-10" />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-fira-sans leading-none">Deactivate Security</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3 font-fira-code">Enter code to disable 2FA protection</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-fira-code text-center block">Verification Layer</label>
                                            <input
                                                type="text"
                                                maxLength={6}
                                                value={otpCode}
                                                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                                placeholder="000000"
                                                className="w-full text-center py-5 bg-slate-50 border-2 border-slate-100 rounded-[28px] text-4xl font-black tracking-[0.4em] outline-none focus:border-rose-500 focus:ring-8 focus:ring-rose-500/5 transition-all font-fira-code text-slate-900"
                                                autoFocus
                                            />
                                        </div>
                                        <button
                                            onClick={() => disable2FAMutation.mutate(otpCode)}
                                            disabled={otpCode.length !== 6 || disable2FAMutation.isPending}
                                            className="w-full py-5 bg-rose-600 text-white rounded-[28px] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-900/20 active:scale-95 disabled:opacity-50 transition-all font-fira-code flex items-center justify-center gap-3"
                                        >
                                            {disable2FAMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Shield className="h-5 w-5" />}
                                            Confirm Deactivation
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8 text-center">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-center gap-3 opacity-20 mb-2">
                                            <Shield className="h-4 w-4" />
                                            <div className="h-px w-20 bg-teal-900" />
                                            <Smartphone className="h-4 w-4" />
                                        </div>
                                        <h3 className="text-2xl font-black text-teal-900 uppercase tracking-tight font-fira-sans leading-none">Configure 2FA</h3>
                                        <p className="text-[10px] font-black text-teal-600/60 uppercase tracking-[0.15em] leading-relaxed font-fira-code">Scan this QR code with your <br /> Authenticator App (Google/Authy)</p>
                                    </div>

                                    {mfaSetup?.qrCode && (
                                        <div className="p-6 bg-teal-50/30 rounded-[32px] border-2 border-teal-50 shadow-inner flex justify-center relative group">
                                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px] border-2 border-teal-100" />
                                            <img src={mfaSetup.qrCode} alt="2FA QR Code" className="w-48 h-48 rounded-2xl relative z-10 shadow-2xl" />
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-teal-50"></div></div>
                                            <div className="relative flex justify-center text-[8px] font-black uppercase tracking-widest text-teal-400 bg-white px-4 font-fira-code">Verification Input</div>
                                        </div>

                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                maxLength={6}
                                                value={otpCode}
                                                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                                placeholder="000000"
                                                className="w-full text-center py-5 bg-teal-50 border-2 border-teal-100 rounded-[28px] text-4xl font-black tracking-[0.4em] outline-none focus:border-teal-600 focus:ring-8 focus:ring-teal-500/5 transition-all font-fira-code text-teal-900"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => verify2FASetupMutation.mutate(otpCode)}
                                                disabled={otpCode.length !== 6 || verify2FASetupMutation.isPending}
                                                className="w-full py-5 bg-teal-900 text-white rounded-[28px] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-teal-900/20 active:scale-95 disabled:opacity-50 transition-all font-fira-code flex items-center justify-center gap-3 hover:bg-black"
                                            >
                                                {verify2FASetupMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                                                Initialize Protocol
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => { setIs2FAModalOpen(false); setMfaSetup(null); setOtpCode(''); }}
                            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors p-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
