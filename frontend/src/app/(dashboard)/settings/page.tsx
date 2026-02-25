'use client';

import { User, Shield, Bell, Building, CheckCircle2, Loader2 } from 'lucide-react';
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
        mutationFn: async (data: any) => api.patch('/tenants/settings', data),
        onSuccess: (updatedTenant: any) => {
            if (user) {
                setUser(user, updatedTenant); // Update global store
            }
        }
    });

    const tabs = [
        { id: 'profile', label: 'User Profile', icon: User },
        { id: 'clinic', label: 'Clinic Information', icon: Building },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500">Manage your account and clinic preferences</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[500px]">
                {/* Tabs Sidebar */}
                <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50 p-4">
                    <nav className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                                    activeTab === tab.id
                                        ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                                )}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 md:p-8">
                    {activeTab === 'profile' && (
                        <div className="max-w-xl space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-2xl font-bold border-4 border-white shadow-sm">
                                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Profile Picture</h3>
                                    <button className="text-sm text-blue-600 font-medium hover:underline">Change Photo</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">First Name</label>
                                    <input
                                        type="text"
                                        value={profileForm.first_name}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Last Name</label>
                                    <input
                                        type="text"
                                        value={profileForm.last_name}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                                    <input
                                        type="email"
                                        defaultValue={user?.email}
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-100 bg-gray-50 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-end">
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'clinic' && (
                        <div className="max-w-xl space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Clinic Name</label>
                                <input
                                    type="text"
                                    value={settingsForm.name}
                                    onChange={(e) => setSettingsForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Slug</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-400 font-mono">hms.com/</span>
                                    <input
                                        type="text"
                                        defaultValue={tenant?.slug}
                                        disabled
                                        className="flex-1 px-3 py-2 border border-gray-100 bg-gray-50 rounded-lg text-sm text-gray-500 cursor-not-allowed font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Operating Country</label>
                                    <select
                                        value={settingsForm.country}
                                        onChange={(e) => setSettingsForm(prev => ({ ...prev, country: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="US">United States</option>
                                        <option value="IN">India</option>
                                        <option value="GB">United Kingdom</option>
                                        <option value="AE">United Arab Emirates</option>
                                        <option value="EU">European Union</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Primary Currency</label>
                                    <select
                                        value={settingsForm.currency}
                                        onChange={(e) => setSettingsForm(prev => ({ ...prev, currency: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="INR">INR (₹)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="AED">AED (د.إ)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-end items-center gap-4">
                                {updateSettingsMutation.isSuccess && (
                                    <span className="text-emerald-600 text-sm flex items-center gap-1.5 animate-in fade-in">
                                        <CheckCircle2 className="h-4 w-4" /> Saved Successfully
                                    </span>
                                )}
                                <button
                                    onClick={() => updateSettingsMutation.mutate(settingsForm)}
                                    disabled={updateSettingsMutation.isPending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {updateSettingsMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Update Clinic
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="text-center py-12">
                            <Bell className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-500">Notification preferences coming soon</p>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="text-center py-12">
                            <Shield className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-500">Security settings coming soon</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
