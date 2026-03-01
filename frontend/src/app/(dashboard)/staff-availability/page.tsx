'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Users, UserCheck, Clock, Shield, Search,
    Stethoscope, Activity, Zap, AlertCircle,
    MoreVertical, HeartPulse, Microscope, Baby, Bone, Brain,
    Coffee, LogOut, ChevronDown, Filter, Info, CheckCircle
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function StaffAvailabilityPage() {
    const { user: currentUser } = useAuthStore();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [roleFilter, setRoleFilter] = useState('ALL');

    const { data: usersData, isLoading } = useQuery({
        queryKey: ['staff-availability'],
        queryFn: () => coreApi.get<any[]>('/users?limit=200')
    });

    const staff = usersData?.data || [];

    const updateStatusMutation = useMutation({
        mutationFn: async ({ userId, status }: { userId: string, status: string }) => {
            return coreApi.put(`/users/${userId}`, { availability_status: status });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['staff-availability'] });
            toast.success(`Status updated: ${variables.status.replace('_', ' ')} active`);
        },
        onError: () => {
            toast.error("Status update failed. Check system connection.");
        }
    });

    const stats = {
        total: staff.length,
        available: staff.filter(u => u.availability_status === 'AVAILABLE').length,
        onBreak: staff.filter(u => u.availability_status === 'ON_BREAK').length,
        offDuty: staff.filter(u => u.availability_status === 'OFF_DUTY').length,
        doctorsActive: staff.filter(u => u.role?.name === 'DOCTOR' && u.availability_status === 'AVAILABLE').length,
    };

    const filteredStaff = staff.filter(u => {
        const name = `${u.first_name} ${u.last_name}`.toLowerCase();
        const matchesSearch = name.includes(search.toLowerCase()) || 
                             (u.specialization || '').toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || u.availability_status === statusFilter;
        const matchesRole = roleFilter === 'ALL' || u.role?.name === roleFilter;
        return matchesSearch && matchesStatus && matchesRole;
    });

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return { 
                label: 'On Duty', 
                color: 'bg-emerald-500', 
                text: 'text-emerald-600', 
                icon: UserCheck, 
                bg: 'bg-emerald-50/50 border-emerald-100 shadow-emerald-100/20',
                accent: 'bg-emerald-500'
            };
            case 'ON_BREAK': return { 
                label: 'On Break', 
                color: 'bg-amber-500', 
                text: 'text-amber-600', 
                icon: Coffee, 
                bg: 'bg-amber-50/50 border-amber-100 shadow-amber-100/20',
                accent: 'bg-amber-500'
            };
            case 'OFF_DUTY': return { 
                label: 'Off Duty', 
                color: 'bg-slate-400', 
                text: 'text-slate-500', 
                icon: LogOut, 
                bg: 'bg-slate-50 border-slate-200 shadow-slate-100/20',
                accent: 'bg-slate-400'
            };
            default: return { 
                label: 'Unknown', 
                color: 'bg-slate-200', 
                text: 'text-slate-400', 
                icon: Info, 
                bg: 'bg-white border-slate-100',
                accent: 'bg-slate-200'
            };
        }
    };

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading staff list...</p>
            </div>
        </div>
    );

    return (
        <div className="p-4 lg:p-5 space-y-5 max-w-[1700px] mx-auto min-h-screen bg-cyan-50/50 animate-in fade-in duration-700 font-fira-sans">
            {/* Premium Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-cyan-700 p-6 lg:p-8 rounded-2xl shadow-xl shadow-emerald-500/20">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2.5 mb-2.5">
                            <div className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-[8px] font-black uppercase tracking-widest text-white font-fira-code">Live Operations</div>
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tighter leading-tight">
                            Staff Availability & <br />
                            <span className="text-emerald-100/60">Specializations</span>
                        </h1>
                        <p className="text-emerald-50/80 text-[11px] font-black uppercase tracking-[0.1em] mt-2 font-fira-code">Monitor staff status and current duties</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        {currentUser && (
                            <div className="bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/20 flex gap-1">
                                {[
                                    { id: 'AVAILABLE', label: 'Clock In', icon: UserCheck, color: 'hover:bg-emerald-500' },
                                    { id: 'ON_BREAK', label: 'Break', icon: Coffee, color: 'hover:bg-amber-500' },
                                    { id: 'OFF_DUTY', label: 'Clock Out', icon: LogOut, color: 'hover:bg-rose-500' }
                                ].map(st => (
                                    <button
                                        key={st.id}
                                        onClick={() => updateStatusMutation.mutate({ userId: currentUser.id, status: st.id })}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-lg transition-all active:scale-95 group relative",
                                            staff.find(u => u.id === currentUser.id)?.availability_status === st.id 
                                                ? "bg-white text-emerald-700 shadow-md" 
                                                : `text-white/60 ${st.color} hover:text-white`
                                        )}
                                    >
                                        <st.icon size={14} />
                                        <span className="text-[8px] font-black uppercase tracking-widest hidden xl:block font-fira-code">{st.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute top-40 right-20 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl animate-pulse" />
            </div>

            {/* Admin Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {[
                    { label: 'Total Staff', val: stats.total, sub: 'Personnel', icon: Users, color: 'bg-emerald-600' },
                    { label: 'Available', val: stats.available, sub: 'On Duty', icon: UserCheck, color: 'bg-emerald-500' },
                    { label: 'Active Doctors', val: stats.doctorsActive, sub: 'Doctors Ready', icon: Stethoscope, color: 'bg-cyan-600' },
                    { label: 'On Break', val: stats.onBreak, sub: 'Offline', icon: Coffee, color: 'bg-amber-500' },
                    { label: 'Off Duty', val: stats.offDuty, sub: 'Signed Out', icon: Shield, color: 'bg-slate-500' },
                ].map((s, i) => (
                    <div key={i} className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-emerald-50 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all group overflow-hidden relative font-fira-sans">
                        <div className={cn("inline-flex p-2 rounded-lg text-white mb-4 shadow-md", s.color)}>
                            <s.icon size={18} />
                        </div>
                        <p className="text-[8.5px] font-black uppercase text-slate-400 tracking-widest leading-none mb-2 font-fira-code">{s.label}</p>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">{s.val}</span>
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest font-fira-code">{s.val === 1 ? 'Person' : 'People'}</span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-transparent group-hover:bg-emerald-100 transition-colors" />
                    </div>
                ))}
            </div>

            {/* Filter Hub & Search Area (Movable Search) */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-emerald-50 shadow-sm font-fira-sans">
                <div className="flex flex-wrap items-center gap-6 w-full">
                    <div className="flex flex-col gap-1.5 flex-grow max-w-sm">
                        <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 ml-1 font-fira-code">Search Staff</label>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="SEARCH BY NAME..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-white border border-emerald-50 rounded-lg text-[9px] font-black w-full uppercase tracking-widest focus:ring-2 focus:ring-emerald-100 transition-all outline-none h-[36px] font-fira-code"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 ml-1 font-fira-code">Filter by Status</label>
                        <div className="flex gap-0.5 p-0.5 bg-slate-100/50 rounded-lg border border-emerald-50">
                            {['ALL', 'AVAILABLE', 'ON_BREAK', 'OFF_DUTY'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setStatusFilter(f)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all font-fira-code",
                                        statusFilter === f ? "bg-white text-emerald-700 shadow-sm" : "text-slate-400 hover:text-emerald-600"
                                    )}
                                >
                                    {f.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">Staff Role</label>
                        <select 
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer h-[42px]"
                        >
                            <option value="ALL">All Roles</option>
                            <option value="DOCTOR">Doctors</option>
                            <option value="NURSE">Nurses</option>
                            <option value="LAB_TECH">Lab Techs</option>
                            <option value="RECEPTIONIST">Reception</option>
                        </select>
                    </div>
                </div>

                <div className="hidden xl:flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Activity size={14} className="text-emerald-500 animate-pulse" />
                    All Systems Active
                </div>
            </div>

            {/* Clinical Assets Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredStaff.map((u: any) => {
                    const st = getStatusConfig(u.availability_status);
                    return (
                        <div key={u.id} className={cn(
                             "rounded-2xl border p-5 relative group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden font-fira-sans",
                             st.bg
                        )}>
                            {/* Role specialized background accents */}
                            <div className={cn(
                                "absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-700",
                                u.role?.name === 'DOCTOR' ? "bg-emerald-500" : "bg-cyan-500"
                            )} />

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-5">
                                    <div className="relative">
                                        <div className="w-12 h-12 bg-white/80 backdrop-blur-sm border border-emerald-50 rounded-xl flex items-center justify-center font-black text-base text-slate-300">
                                            {u.first_name?.[0]}{u.last_name?.[0]}
                                        </div>
                                        <div className={cn(
                                            "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white shadow-md",
                                            st.color
                                        )}>
                                            <st.icon size={9} />
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-widest border transition-colors bg-white/80 backdrop-blur-sm shadow-sm font-fira-code",
                                            st.text,
                                            "border-emerald-50"
                                        )}>
                                            {st.label}
                                        </span>
                                        <p className="text-[9px] font-black uppercase text-emerald-600 tracking-[0.15em] mt-1.5 font-fira-code">
                                            {u.role?.name?.replace('_', ' ')}
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-base font-black text-slate-900 tracking-tighter leading-none mb-1.5">
                                        {u.first_name} {u.last_name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <Activity size={10} className="text-emerald-500" />
                                        <span className="text-[8.5px] font-black uppercase tracking-widest font-fira-code">{u.specialization || 'Clinical Staff'}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {u.skills && u.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {u.skills.slice(0, 3).map((skill: string, idx: number) => (
                                                <span key={idx} className="px-2 py-0.5 bg-white/60 backdrop-blur-sm rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-500 border border-emerald-50 font-fira-code">
                                                    {skill.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-emerald-50/50 flex items-center justify-between">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none font-fira-code">Location</span>
                                            <div className="flex items-center gap-1">
                                                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                                <span className="text-[9px] font-black text-slate-700 uppercase font-fira-code">Main Hospital</span>
                                            </div>
                                        </div>

                                        {(currentUser?.role?.name === 'ADMIN' || currentUser?.id === u.id) && (
                                            <button 
                                                onClick={() => {
                                                    const nextStatus = u.availability_status === 'AVAILABLE' ? 'ON_BREAK' : 
                                                                     u.availability_status === 'ON_BREAK' ? 'OFF_DUTY' : 'AVAILABLE';
                                                    updateStatusMutation.mutate({ userId: u.id, status: nextStatus });
                                                }}
                                                className="w-8 h-8 flex items-center justify-center bg-white border border-emerald-50 rounded-lg hover:bg-emerald-900 hover:text-white transition-all active:scale-90 shadow-sm"
                                            >
                                                <MoreVertical size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredStaff.length === 0 && (
                <div className="text-center py-40 bg-white rounded-[60px] border-2 border-dashed border-slate-100">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <AlertCircle className="h-10 w-10 text-slate-200" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-400 uppercase tracking-[0.3em]">No Staff Found</h2>
                    <p className="text-sm text-slate-300 font-medium mt-3">Try adjusting your search filters.</p>
                </div>
            )}
        </div>
    );
}
