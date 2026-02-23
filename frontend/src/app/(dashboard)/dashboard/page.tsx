'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, CalendarDays, FlaskConical, Pill,
  TrendingUp, AlertTriangle, Clock, CheckCircle
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { SkeletonDashboard } from '@/components/shared/skeleton';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { formatDate } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

interface StatCard {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

function StatCardComponent({ stat }: { stat: StatCard }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-500">{stat.label}</p>
        <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
          <stat.icon className={`h-5 w-5 ${stat.color}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
      {stat.change && (
        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          {stat.change}
        </p>
      )}
    </div>
  );
}

function DashboardContent() {
  const { user, tenant } = useAuthStore();

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

  const stats: StatCard[] = [
    {
      label: "Today's Appointments",
      value: todayAppointments?.data?.length ?? '–',
      icon: CalendarDays,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: 'vs yesterday',
    },
    {
      label: 'Lab Orders Pending',
      value: labStats?.data?.pending ?? '–',
      icon: FlaskConical,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Lab Completed Today',
      value: labStats?.data?.today ?? '–',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Low Stock Items',
      value: pharmacyStats?.data?.lowStock ?? '–',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  // Mock chart data (replace with real API data)
  const appointmentTrend = [
    { day: 'Mon', appointments: 12 },
    { day: 'Tue', appointments: 18 },
    { day: 'Wed', appointments: 15 },
    { day: 'Thu', appointments: 22 },
    { day: 'Fri', appointments: 19 },
    { day: 'Sat', appointments: 8 },
    { day: 'Sun', appointments: 5 },
  ];

  const labDistribution = [
    { name: 'Hematology', value: 35 },
    { name: 'Biochemistry', value: 40 },
    { name: 'Microbiology', value: 15 },
    { name: 'Radiology', value: 10 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.first_name}! 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">{formatDate(new Date())} — {tenant?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCardComponent key={i} stat={stat} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Appointment Trend (This Week)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={appointmentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="appointments"
                stroke="#3b82f6"
                fill="#eff6ff"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Lab distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Lab Test Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={labDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {labDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {labDistribution.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[i] }}
                />
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Today's Appointments</h3>
          <a href="/appointments" className="text-sm text-blue-600 hover:text-blue-700">
            View all
          </a>
        </div>

        {!todayAppointments?.data?.length ? (
          <div className="text-center py-8 text-gray-400">
            <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No appointments today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayAppointments.data.slice(0, 5).map((appt: any) => (
              <div
                key={appt.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {appt.patient?.first_name} {appt.patient?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Dr. {appt.doctor?.last_name} · {appt.type}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-gray-900">
                    {new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    appt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                    appt.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {appt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pharmacy Alerts */}
      {pharmacyStats?.data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Out of Stock', value: pharmacyStats.data.outOfStock, color: 'red', icon: AlertTriangle },
            { label: 'Expiring in 30 days', value: pharmacyStats.data.expiringSoon, color: 'yellow', icon: Clock },
            { label: 'Expired Items', value: pharmacyStats.data.expired, color: 'red', icon: AlertTriangle },
          ].map((alert, i) => (
            <div
              key={i}
              className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${
                alert.value > 0
                  ? alert.color === 'red'
                    ? 'border-red-200'
                    : 'border-yellow-200'
                  : 'border-gray-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                alert.value > 0
                  ? alert.color === 'red' ? 'bg-red-100' : 'bg-yellow-100'
                  : 'bg-green-100'
              }`}>
                <alert.icon className={`h-5 w-5 ${
                  alert.value > 0
                    ? alert.color === 'red' ? 'text-red-600' : 'text-yellow-600'
                    : 'text-green-600'
                }`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{alert.value}</p>
                <p className="text-xs text-gray-500">{alert.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SkeletonDashboard />}>
        <DashboardContent />
      </Suspense>
    </ErrorBoundary>
  );
}
