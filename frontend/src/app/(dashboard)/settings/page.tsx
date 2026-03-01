'use client';

import { User, Shield, Bell, Building, CheckCircle2, Loader2, Edit2, Settings } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { coreApi as api } from '@/lib/api';

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
                setUser(user, res.data); // Update global store with raw tenant data
            }
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
            {/* Ocean Breeze Header (Compact) */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#115E59] to-[#0D9488] px-8 py-10 rounded-[40px] shadow-2xl shadow-teal-900/10 text-white hover:shadow-teal-900/20 transition-all duration-500">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center shadow-inner">
                            <Building className="h-6 w-6 text-teal-100" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1.5 opacity-80">
                                <div className="px-2.5 py-0.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[7px] font-black uppercase tracking-widest">System Configuration</div>
                                <span className="text-[8px] font-black text-teal-200 uppercase tracking-widest border-l border-white/20 pl-2.5 font-fira-code">v2.4.0-Stable</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-black tracking-tighter leading-tight uppercase">
                                System <span className="text-teal-100/40 font-fira-sans">Settings</span>
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-emerald-400/20 rounded-full blur-[80px]" />
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-[40px] border border-teal-100 shadow-2xl shadow-teal-500/5 overflow-hidden flex flex-col md:flex-row min-h-[600px] transition-all hover:shadow-teal-500/10">
                {/* Tabs Sidebar */}
                <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-teal-50 bg-teal-50/20 p-6">
                    <div className="mb-6 px-4">
                        <p className="text-[8px] font-black text-teal-900/30 uppercase tracking-[0.3em] font-fira-code">Preference Hub</p>
                    </div>
                    <nav className="space-y-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all duration-300 font-fira-code group',
                                    activeTab === tab.id
                                        ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20 scale-105'
                                        : 'text-teal-900/50 hover:text-teal-900 hover:bg-white/50 border border-transparent hover:border-teal-100'
                                )}
                            >
                                <tab.icon className={cn("h-4 w-4 transition-transform duration-300", activeTab === tab.id ? "scale-110" : "group-hover:scale-110")} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 lg:p-12 bg-white/30 backdrop-blur-sm">
                    {activeTab === 'profile' && (
                        <div className="max-w-2xl space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-8 p-6 bg-teal-50/30 rounded-[32px] border border-teal-100/50 shadow-inner">
                                <div className="relative group">
                                    <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-[28px] flex items-center justify-center text-white text-3xl font-black border-4 border-white shadow-2xl transition-transform group-hover:rotate-3 duration-500 font-fira-sans">
                                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-xl shadow-lg border border-teal-50 flex items-center justify-center text-teal-600 cursor-pointer hover:bg-teal-50 transition-colors">
                                        <Edit2 className="h-4 w-4" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-teal-900 tracking-tight font-fira-sans uppercase mb-1">Account Persona</h3>
                                    <p className="text-[10px] font-black text-teal-600/60 uppercase tracking-widest font-fira-code mb-3">System Access: {user?.role?.name || 'Authorized'}</p>
                                    <button className="px-4 py-1.5 bg-white text-teal-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-teal-100 hover:bg-teal-50 hover:border-teal-300 transition-all shadow-sm">Update Avatar</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-teal-900/40 uppercase tracking-widest font-fira-code ml-1">First Name</label>
                                    <input
                                        type="text"
                                        value={profileForm.first_name}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                                        className="w-full px-5 py-4 bg-white/50 border border-teal-100 rounded-2xl text-[11px] font-black uppercase tracking-wider focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-400 transition-all shadow-sm font-fira-code"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-teal-900/40 uppercase tracking-widest font-fira-code ml-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={profileForm.last_name}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                                        className="w-full px-5 py-4 bg-white/50 border border-teal-100 rounded-2xl text-[11px] font-black uppercase tracking-wider focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-400 transition-all shadow-sm font-fira-code"
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-teal-900/40 uppercase tracking-widest font-fira-code ml-1">Verified Email Address</label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            defaultValue={user?.email}
                                            disabled
                                            className="w-full px-5 py-4 bg-teal-50/50 border border-teal-100 rounded-2xl text-[11px] font-black text-teal-900/40 uppercase tracking-wider cursor-not-allowed font-fira-code shadow-inner"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded text-[8px] font-black uppercase tracking-tighter">
                                            <Shield className="h-3 w-3" /> Secure
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end">
                                <button className="px-8 py-4 bg-teal-900 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-teal-800 transition-all shadow-xl shadow-teal-900/20 active:scale-95 font-fira-code">
                                    Finalize Profile Update
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'clinic' && (
                        <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-teal-900/40 uppercase tracking-widest font-fira-code ml-1">Official Hospital Designation</label>
                                <input
                                    type="text"
                                    value={settingsForm.name}
                                    onChange={(e) => setSettingsForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-5 py-4 bg-white/50 border border-teal-100 rounded-2xl text-[11px] font-black uppercase tracking-wider focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-400 transition-all shadow-sm font-fira-code"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-teal-900/40 uppercase tracking-widest font-fira-code ml-1">Permanent Access Slug</label>
                                <div className="flex items-center gap-4">
                                    <div className="px-5 py-4 bg-teal-50/50 border border-teal-100 rounded-2xl text-[11px] font-black text-teal-900/40 uppercase tracking-wider font-mono shadow-inner grayscale flex-1">
                                        hms.healthcare/<span className="text-teal-900">{tenant?.slug || 'hospital-id'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 border-t border-teal-50 pt-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-teal-900/40 uppercase tracking-widest font-fira-code ml-1">Country / Region</label>
                                    <div className="relative group">
                                        <select
                                            value={settingsForm.country}
                                            onChange={(e) => setSettingsForm(prev => ({ ...prev, country: e.target.value }))}
                                            className="w-full px-5 py-4 bg-white/50 border border-teal-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-400 transition-all shadow-sm appearance-none font-fira-code"
                                        >
                                            <option value="US">United States</option>
                                            <option value="IN">India</option>
                                            <option value="GB">United Kingdom</option>
                                            <option value="AE">United Arab Emirates</option>
                                            <option value="EU">European Union</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                            <Building size={12} className="text-teal-600" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-teal-900/40 uppercase tracking-widest font-fira-code ml-1">Default Currency</label>
                                    <div className="relative group">
                                        <select
                                            value={settingsForm.currency}
                                            onChange={(e) => setSettingsForm(prev => ({ ...prev, currency: e.target.value }))}
                                            className="w-full px-5 py-4 bg-white/50 border border-teal-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-400 transition-all shadow-sm appearance-none font-fira-code"
                                        >
                                            <option value="USD">USD ($)</option>
                                            <option value="INR">INR (₹)</option>
                                            <option value="GBP">GBP (£)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="AED">AED (د.إ)</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                            <Settings size={12} className="text-teal-600" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-teal-50 flex justify-end items-center gap-6">
                                {updateSettingsMutation.isSuccess && (
                                    <span className="text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-in fade-in slide-in-from-right-2 font-fira-code">
                                        <CheckCircle2 className="h-4 w-4" /> Sync Complete
                                    </span>
                                )}
                                <button
                                    onClick={() => updateSettingsMutation.mutate(settingsForm)}
                                    disabled={updateSettingsMutation.isPending}
                                    className="px-8 py-4 bg-teal-600 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-teal-700 transition-all shadow-xl shadow-teal-600/20 flex items-center gap-3 disabled:opacity-50 active:scale-95 font-fira-code"
                                >
                                    {updateSettingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                    Update Configuration
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="text-center py-20 animate-in fade-in duration-500">
                            <div className="w-24 h-24 bg-teal-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-inner border border-teal-100">
                                <Bell className="h-10 w-10 text-teal-200" />
                            </div>
                            <h3 className="text-lg font-black text-teal-900 tracking-tight uppercase mb-2">Notifications</h3>
                            <p className="text-[10px] font-black text-teal-600/40 uppercase tracking-[0.2em] font-fira-code">Coming Soon</p>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="text-center py-20 animate-in fade-in duration-500">
                            <div className="w-24 h-24 bg-rose-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-inner border border-rose-100">
                                <Shield className="h-10 w-10 text-rose-200" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase mb-2">Account Security</h3>
                            <p className="text-[10px] font-black text-rose-600/40 uppercase tracking-[0.2em] font-fira-code">Coming Soon</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
