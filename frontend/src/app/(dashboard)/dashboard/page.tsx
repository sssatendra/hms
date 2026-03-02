'use client';

import { Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, CalendarDays, FlaskConical, Pill,
  TrendingUp, AlertTriangle, Clock, CheckCircle,
  Shield, Activity, Zap, ArrowRight, ArrowUpRight,
  Stethoscope, Microscope, Box,
  LogOut,
  Coffee,
  UserCheck
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { SkeletonDashboard } from '@/components/shared/skeleton';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { formatDate, cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { toast } from 'sonner';

const CHART_COLORS = ['#0891B2', '#06B6D4', '#22D3EE', '#7DD3FC'];

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  color: string;
}

function LiquidStatCard({ label, value, change, icon: Icon, trend, color }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-[32px] border border-cyan-100 p-6 shadow-xl shadow-cyan-500/5 hover:shadow-2xl transition-all hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-900/40 mb-1 font-fira-code">{label}</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter font-fira-sans">{value}</p>
        </div>
        <div className={cn("p-3 rounded-2xl text-white shadow-lg shadow-current/20", color)}>
          <Icon size={20} />
        </div>
      </div>

      {change && (
        <div className="flex items-center gap-1.5 mt-2">
          <div className={cn(
            "flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest font-fira-code",
            trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            {trend === 'up' ? <ArrowUpRight size={10} /> : <ArrowRight size={10} />}
            {change}
          </div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-fira-sans">vs last period</span>
        </div>
      )}

      {/* Ambient Pattern */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-current/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

function QuickAttendance() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: selfData } = useQuery({
    queryKey: ['user-me'],
    queryFn: () => coreApi.get<any>('/auth/me')
  });

  const { data: availabilityData } = useQuery({
    queryKey: ['staff-availability'],
    queryFn: () => coreApi.get<any[]>('/users/availability')
  });

  const status = selfData?.data?.user?.availability_status || 'OFF_DUTY';

  const mutation = useMutation({
    mutationFn: (newStatus: string) => coreApi.put(`/users/${user?.id}`, { availability_status: newStatus }),
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['user-me'] });
      queryClient.invalidateQueries({ queryKey: ['staff-availability'] });
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
    },
    onError: () => {
      toast.error("Failed to update status. Please try again.");
    }
  });

  const statusConfigs: any = {
    AVAILABLE: { label: 'On Duty', color: 'bg-emerald-500', icon: CheckCircle, pulse: 'bg-emerald-500' },
    ON_BREAK: { label: 'On Break', color: 'bg-amber-500', icon: Clock, pulse: 'bg-amber-500' },
    OFF_DUTY: { label: 'Off Duty', color: 'bg-slate-400', icon: Shield, pulse: 'bg-slate-400' },
  };

  const config = statusConfigs[status];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#164E63] to-[#0891B2] rounded-[48px] p-8 lg:p-10 shadow-2xl shadow-cyan-900/40 text-white min-h-[340px] flex flex-col justify-between group">
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[9px] font-black uppercase tracking-[0.2em]">Staff Status</div>
          <div className={cn("inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-widest")}>
            <div className={cn("w-2 h-2 rounded-full animate-pulse shadow-[0_0_12px_rgba(255,255,255,0.5)]", config.pulse)} />
            Updated
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2 font-fira-code">Current Status</p>
          <h3 className="text-4xl font-black tracking-tighter uppercase font-fira-sans mb-10 leading-none">
            {status.replace('_', ' ')}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'AVAILABLE', label: 'Clock In', icon: UserCheck, active: 'bg-white text-cyan-900 shadow-xl shadow-cyan-900/20' },
            { id: 'ON_BREAK', label: 'Break', icon: Coffee, active: 'bg-white text-cyan-900 shadow-xl shadow-cyan-900/20' },
            { id: 'OFF_DUTY', label: 'Clock Out', icon: LogOut, active: 'bg-white text-cyan-900 shadow-xl shadow-cyan-900/20' }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => mutation.mutate(btn.id)}
              disabled={mutation.isPending || status === btn.id}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-3xl transition-all active:scale-90 font-fira-code",
                status === btn.id
                  ? btn.active
                  : "bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white"
              )}
            >
              <btn.icon size={18} />
              <span className="text-[8px] font-black uppercase tracking-[0.2em]">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-cyan-400/20 rounded-full blur-[80px] group-hover:bg-cyan-300/30 transition-colors" />
      <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-emerald-400/10 rounded-full blur-[60px]" />
    </div>
  );
}

function DashboardContent() {
  const { user, tenant } = useAuthStore();

  const { data: availabilityData } = useQuery({
    queryKey: ['staff-availability'],
    queryFn: () => coreApi.get<any[]>('/users/availability')
  });

  const { data: pharmacyStats } = useQuery({
    queryKey: ['pharmacy', 'stats', tenant?.id],
    queryFn: () => coreApi.get<any>('/pharmacy/stats'),
  });

  const { data: labStats } = useQuery({
    queryKey: ['lab', 'stats', tenant?.id],
    queryFn: () => coreApi.get<any>('/lab/stats'),
  });

  const { data: todayAppointments } = useQuery({
    queryKey: ['appointments', 'today', tenant?.id],
    queryFn: () => coreApi.get<any[]>('/appointments/today'),
  });

  const appointmentTrend = [
    { day: 'Mon', count: 12 },
    { day: 'Tue', count: 18 },
    { day: 'Wed', count: 15 },
    { day: 'Thu', count: 22 },
    { day: 'Fri', count: 19 },
    { day: 'Sat', count: 8 },
    { day: 'Sun', count: 5 },
  ];

  const labDistribution = [
    { name: 'Hematology', value: 35 },
    { name: 'Biochemistry', value: 40 },
    { name: 'Microbiology', value: 15 },
    { name: 'Radiology', value: 10 },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-[1700px] mx-auto p-4 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-md text-[8px] font-black uppercase tracking-widest font-fira-code border border-cyan-200">All Systems Online</div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{formatDate(new Date())}</p>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight font-fira-sans">
            Welcome back, <br />
            <span className="text-cyan-600">{user?.first_name}</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tenant?.name}</p>
            <p className="text-xs font-bold text-slate-600">Management Dashboard</p>
          </div>
          <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-cyan-600 hover:border-cyan-200 transition-all cursor-pointer">
            <Zap size={20} />
          </div>
        </div>
      </div>

      {/* Main Grid: Stats & Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <LiquidStatCard
            label="Today's Appointments"
            value={todayAppointments?.data?.length ?? '0'}
            change="+12.5%"
            trend="up"
            icon={CalendarDays}
            color="bg-cyan-500"
          />
          <LiquidStatCard
            label="Pending Lab Tests"
            value={labStats?.data?.pending ?? '0'}
            change="-4.2%"
            trend="down"
            icon={FlaskConical}
            color="bg-indigo-500"
          />
          <LiquidStatCard
            label="Medicine Stock"
            value={pharmacyStats?.data?.lowStock ?? '0'}
            change="Low Stock"
            trend="down"
            icon={Box}
            color="bg-rose-500"
          />
          <LiquidStatCard
            label="Staff on Duty"
            value={availabilityData?.data?.filter((u: any) => u.availability_status === 'AVAILABLE').length ?? '0'}
            change={`Total: ${availabilityData?.data?.length ?? '0'}`}
            trend="up"
            icon={Users}
            color="bg-emerald-500"
          />
        </div>
        <div className="lg:col-span-4">
          <QuickAttendance />
        </div>
      </div>

      {/* Visual Data Layer */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Trend Graph */}
        <div className="xl:col-span-8 bg-white/80 backdrop-blur-xl rounded-[40px] border border-slate-100 p-8 shadow-xl shadow-slate-200/40 outline outline-1 outline-white/50">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight font-fira-sans mb-1">Weekly Activity</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-fira-code">Number of appointments per day</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Appointments</span>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={appointmentTrend}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0891B2" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#0891B2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#0891B2"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Clinical Distribution */}
        <div className="xl:col-span-4 bg-white/80 backdrop-blur-xl rounded-[40px] border border-slate-100 p-8 shadow-xl shadow-slate-200/40">
          <h3 className="text-xl font-black text-slate-900 tracking-tight font-fira-sans mb-1">Lab Test Types</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-fira-code mb-8">Distribution of test categories</p>

          <div className="h-[240px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={labDistribution}
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {labDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} className="outline-none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-2xl font-black text-slate-900 leading-none">100%</p>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Completed</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            {labDistribution.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: CHART_COLORS[i] }} />
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-tight">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Registry Preview Layer */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Appointments List */}
        <div className="xl:col-span-12 bg-white rounded-[40px] border border-slate-100 p-8 shadow-xl shadow-slate-200/10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight font-fira-sans mb-1">Today's Schedule</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-fira-code">Upcoming appointments for today</p>
            </div>
            <button className="px-6 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-cyan-600 transition-colors shadow-lg shadow-slate-900/10">
              View All
            </button>
          </div>

          {!todayAppointments?.data?.length ? (
            <div className="text-center py-20 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-200">
              <CalendarDays className="h-10 w-10 mx-auto mb-4 text-slate-300" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No appointments today</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {todayAppointments.data.slice(0, 6).map((appt: any) => (
                <div key={appt.id} className="group p-5 bg-white border border-slate-100 rounded-[32px] hover:border-cyan-200 hover:shadow-xl hover:shadow-cyan-500/5 transition-all flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-black group-hover:bg-cyan-600 group-hover:text-white transition-all">
                    {appt.patient?.first_name?.[0]}{appt.patient?.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate tracking-tight">{appt.patient?.first_name} {appt.patient?.last_name}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Dr. {appt.doctor?.last_name} · {appt.type}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-cyan-600">
                        <Clock size={12} strokeWidth={3} />
                        <span className="text-[10px] font-black font-fira-code">
                          {new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest",
                        appt.status === 'CONFIRMED' ? "bg-emerald-50 text-emerald-600" : "bg-cyan-50 text-cyan-600"
                      )}>
                        {appt.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <ErrorBoundary>
        <Suspense fallback={<SkeletonDashboard />}>
          <DashboardContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
