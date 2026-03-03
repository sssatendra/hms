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
        doctorsActive: staff.filter(u => {
            const role = typeof u.role === 'string' ? u.role : u.role?.name;
            return role === 'DOCTOR' && u.availability_status === 'AVAILABLE';
        }).length,
    };

    const filteredStaff = staff.filter(u => {
        const name = `${u.first_name} ${u.last_name}`.toLowerCase();
        const matchesSearch = name.includes(search.toLowerCase()) ||
            (u.specialization || '').toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || u.availability_status === statusFilter;
        const role = typeof u.role === 'string' ? u.role : u.role?.name;
        const matchesRole = roleFilter === 'ALL' || role === roleFilter;
        return matchesSearch && matchesStatus && matchesRole;
    });

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return {
                label: 'On Duty',
                color: 'bg-emerald-500',
                text: 'text-emerald-500',
                icon: UserCheck,
                bg: 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5',
                accent: 'bg-emerald-500'
            };
            case 'ON_BREAK': return {
                label: 'On Break',
                color: 'bg-amber-500',
                text: 'text-amber-500',
                icon: Coffee,
                bg: 'bg-amber-500/10 border-amber-500/20 shadow-amber-500/5',
                accent: 'bg-amber-500'
            };
            case 'OFF_DUTY': return {
                label: 'Off Duty',
                color: 'bg-muted-foreground',
                text: 'text-muted-foreground',
                icon: LogOut,
                bg: 'bg-muted border-border shadow-black/5',
                accent: 'bg-muted-foreground'
            };
            default: return {
                label: 'Unknown',
                color: 'bg-muted-foreground/30',
                text: 'text-muted-foreground/50',
                icon: Info,
                bg: 'bg-card border-border',
                accent: 'bg-muted-foreground/30'
            };
        }
    };

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Loading staff list...</p>
            </div>
        </div>
    );

    return (
        <div className="p-4 lg:p-5 space-y-5 max-w-[1700px] mx-auto min-h-screen bg-background animate-in fade-in duration-700 font-fira-sans text-foreground">
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
                    { label: 'Total Staff', val: stats.total, sub: 'Personnel', icon: Users, color: 'bg-primary' },
                    { label: 'Available', val: stats.available, sub: 'On Duty', icon: UserCheck, color: 'bg-emerald-500' },
                    { label: 'Active Doctors', val: stats.doctorsActive, sub: 'Doctors Ready', icon: Stethoscope, color: 'bg-cyan-600' },
                    { label: 'On Break', val: stats.onBreak, sub: 'Offline', icon: Coffee, color: 'bg-amber-500' },
                    { label: 'Off Duty', val: stats.offDuty, sub: 'Signed Out', icon: Shield, color: 'bg-muted-foreground' },
                ].map((s, i) => (
                    <div key={i} className="bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all group overflow-hidden relative font-fira-sans">
                        <div className={cn("inline-flex p-2 rounded-lg text-white mb-4 shadow-md", s.color)}>
                            <s.icon size={18} />
                        </div>
                        <p className="text-[8.5px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-2 font-fira-code">{s.label}</p>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-foreground tracking-tighter tabular-nums leading-none">{s.val}</span>
                            <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest font-fira-code">{s.val === 1 ? 'Person' : 'People'}</span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-transparent group-hover:bg-primary/20 transition-colors" />
                    </div>
                ))}
            </div>

            {/* Filter Hub & Search Area (Movable Search) */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm font-fira-sans">
                <div className="flex flex-wrap items-center gap-6 w-full">
                    <div className="flex flex-col gap-1.5 flex-grow max-w-sm">
                        <label className="text-[7.5px] font-black uppercase tracking-widest text-muted-foreground ml-1 font-fira-code">Search Staff</label>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="SEARCH BY NAME..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-[9px] font-black w-full uppercase tracking-widest focus:ring-2 focus:ring-primary/10 transition-all outline-none h-[36px] font-fira-code text-foreground placeholder:text-muted-foreground/30"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[7.5px] font-black uppercase tracking-widest text-muted-foreground ml-1 font-fira-code">Filter by Status</label>
                        <div className="flex gap-0.5 p-0.5 bg-muted rounded-lg border border-border">
                            {['ALL', 'AVAILABLE', 'ON_BREAK', 'OFF_DUTY'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setStatusFilter(f)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all font-fira-code",
                                        statusFilter === f ? "bg-card text-primary shadow-sm" : "text-muted-foreground/60 hover:text-primary"
                                    )}
                                >
                                    {f.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1">Staff Role</label>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="bg-background border border-border rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer h-[42px] text-foreground"
                        >
                            <option value="ALL" className="bg-card">All Roles</option>
                            <option value="DOCTOR" className="bg-card">Doctors</option>
                            <option value="NURSE" className="bg-card">Nurses</option>
                            <option value="LAB_TECH" className="bg-card">Lab Techs</option>
                            <option value="RECEPTIONIST" className="bg-card">Reception</option>
                        </select>
                    </div>
                </div>

                <div className="hidden xl:flex items-center gap-4 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
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
                                        <div className="w-12 h-12 bg-muted/50 backdrop-blur-sm border border-border rounded-xl flex items-center justify-center font-black text-base text-muted-foreground">
                                            {u.first_name?.[0]}{u.last_name?.[0]}
                                        </div>
                                        <div className={cn(
                                            "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center text-white shadow-md",
                                            st.color
                                        )}>
                                            <st.icon size={9} />
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-widest border transition-colors bg-card/80 backdrop-blur-sm shadow-sm font-fira-code",
                                            st.text,
                                            "border-border"
                                        )}>
                                            {st.label}
                                        </span>
                                        <p className="text-[9px] font-black uppercase text-primary tracking-[0.15em] mt-1.5 font-fira-code">
                                            {(typeof u.role === 'string' ? u.role : u.role?.name || '').replace('_', ' ')}
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-base font-black text-foreground tracking-tighter leading-none mb-1.5">
                                        {u.first_name} {u.last_name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-muted-foreground/60 font-fira-code">
                                        <Activity size={10} className="text-emerald-500" />
                                        <span className="text-[8.5px] font-black uppercase tracking-widest">{u.specialization || 'Clinical Staff'}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {u.skills && u.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {u.skills.slice(0, 3).map((skill: string, idx: number) => (
                                                <span key={idx} className="px-2 py-0.5 bg-muted/40 backdrop-blur-sm rounded-lg text-[8px] font-black uppercase tracking-widest text-muted-foreground border border-border font-fira-code">
                                                    {skill.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[7px] font-black text-muted-foreground/40 uppercase tracking-widest leading-none font-fira-code">Location</span>
                                            <div className="flex items-center gap-1">
                                                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                                <span className="text-[9px] font-black text-foreground uppercase font-fira-code opacity-70">Main Hospital</span>
                                            </div>
                                        </div>

                                        {(() => {
                                            const role = typeof currentUser?.role === 'string' ? currentUser.role : currentUser?.role?.name;
                                            return (role === 'ADMIN' || currentUser?.id === u.id) && (
                                                <button
                                                    onClick={() => {
                                                        const nextStatus = u.availability_status === 'AVAILABLE' ? 'ON_BREAK' :
                                                            u.availability_status === 'ON_BREAK' ? 'OFF_DUTY' : 'AVAILABLE';
                                                        updateStatusMutation.mutate({ userId: u.id, status: nextStatus });
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded-lg hover:bg-primary hover:text-primary-foreground transition-all active:scale-90 shadow-sm"
                                                >
                                                    <MoreVertical size={14} />
                                                </button>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredStaff.length === 0 && (
                <div className="text-center py-40 bg-card rounded-[60px] border-2 border-dashed border-border">
                    <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <AlertCircle className="h-10 w-10 text-muted-foreground/20" />
                    </div>
                    <h2 className="text-2xl font-black text-muted-foreground/40 uppercase tracking-[0.3em]">No Staff Found</h2>
                    <p className="text-sm text-muted-foreground/30 font-medium mt-3 font-fira-code">Try adjusting your search filters.</p>
                </div>
            )}
        </div>
    );
}
