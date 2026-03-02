'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FlaskConical, Upload, CheckCircle, Clock, AlertCircle,
  Search, Plus, FileText, Loader2, X, Microscope,
  RefreshCw, Shield, ChevronRight, BarChart3,
  Layers
} from 'lucide-react';
const LabIcon = FlaskConical;
import { coreApi, labApi } from '@/lib/api';
import { formatDateTime, getStatusColor, cn, formatDate } from '@/lib/utils';
import { SkeletonTable } from '@/components/shared/skeleton';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import LabOrderDetailModal from '@/components/lab/LabOrderDetailModal';
import Link from 'next/link';

function LabPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateRange, setDateRange] = useState('7');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [uploadOrderId, setUploadOrderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['lab', 'stats'],
    queryFn: () => coreApi.get<any>('/lab/stats'),
  });

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['lab', 'orders', page, search, statusFilter, priorityFilter, dateRange],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      if (search) params.set('patient_id', search);

      if (dateRange !== 'all') {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - parseInt(dateRange));
        params.set('fromDate', fromDate.toISOString());
      }

      return coreApi.get<any[]>(`/lab/orders?${params}`);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      coreApi.patch(`/lab/orders/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lab', 'orders'] }),
    onError: (error: any) => {
      alert(`Failed to update status: ${error.message || 'Unknown error'}`);
    }
  });

  const uploadFileMutation = useMutation({
    mutationFn: async ({ orderId, file }: { orderId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('lab_order_id', orderId);
      return labApi.uploadFile('/files/upload/lab-report', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab', 'orders'] });
      setUploadOrderId(null);
    },
  });

  const orders = ordersData?.data || [];
  const meta = ordersData?.meta;

  const statusMap = {
    PENDING: { label: 'Pending', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    IN_PROGRESS: { label: 'In Progress', icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-100' },
    COMPLETED: { label: 'Completed', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    CANCELLED: { label: 'Cancelled', icon: X, color: 'text-red-600', bg: 'bg-red-100' },
  };

  const handleFileUpload = (orderId: string) => {
    setUploadOrderId(orderId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadOrderId) {
      uploadFileMutation.mutate({ orderId: uploadOrderId, file });
    }
  };

  return (
    <div className="p-4 lg:p-5 space-y-4 max-w-[1700px] mx-auto min-h-screen bg-cyan-50/50 animate-in fade-in duration-700 font-fira-sans">
      {/* Ambient Ocean Breeze Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-100/40 rounded-full blur-[160px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-cyan-100/40 rounded-full blur-[140px]"></div>
      </div>

      {/* Premium Header Architecture */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-5">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-600 to-cyan-700 p-0.5 shadow-lg shadow-emerald-500/20 group hover:rotate-3 transition-transform duration-500">
            <div className="w-full h-full bg-emerald-900 rounded-[11px] flex items-center justify-center">
              <Microscope className="h-6 w-6 text-emerald-100 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter leading-none">Laboratory</h1>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-[0.2em] rounded-full border border-emerald-200 font-fira-code">Lab Management</span>
            </div>
            <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-[0.2em] font-fira-code flex items-center gap-1.5">
              <Shield size={9} className="text-emerald-500" /> Manage lab orders, samples, and results
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/lab/tests"
            className="flex items-center gap-2 px-5 py-2.5 bg-white/60 backdrop-blur-md border border-emerald-100/50 rounded-xl hover:bg-white transition-all font-black text-[8.5px] uppercase tracking-widest text-slate-600 shadow-md shadow-emerald-500/5 active:scale-95 cursor-pointer font-fira-code"
          >
            <Microscope className="h-3.5 w-3.5 text-emerald-600" />
            Available Tests
          </Link>
          <Link
            href="/lab/orders/new"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:opacity-95 transition-all font-black shadow-lg shadow-emerald-500/30 text-[9px] uppercase tracking-[0.2em] active:scale-95 cursor-pointer font-fira-code group"
          >
            <Plus size={14} className="group-hover:rotate-90 transition-transform" />
            New Lab Order
          </Link>
        </div>
      </div>

      {/* Lab Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {[
          { label: 'Pending Orders', value: stats?.data?.pending ?? '–', sub: 'Orders in Queue', color: 'text-amber-500', bg: 'bg-amber-50', icon: Clock },
          { label: 'In Progress', value: stats?.data?.inProgress ?? '–', sub: 'Tests in Progress', color: 'text-blue-500', bg: 'bg-blue-50', icon: Loader2 },
          { label: 'Completed', value: stats?.data?.completed ?? '–', sub: 'Results Available', color: 'text-emerald-500', bg: 'bg-emerald-50', icon: CheckCircle },
          { label: 'Total Today', value: stats?.data?.today ?? '–', sub: 'Total Orders Today', color: 'text-purple-500', bg: 'bg-purple-50', icon: LabIcon },
        ].map((stat, i) => (
          <div key={i} className="group relative bg-white/70 backdrop-blur-2xl p-5 rounded-2xl border border-emerald-100/50 shadow-md shadow-emerald-500/5 hover:border-emerald-300 transition-all duration-500 overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-xl shadow-inner transition-transform group-hover:rotate-6 duration-500", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div className="p-1 rounded-full text-slate-200 group-hover:text-emerald-500 transition-colors">
                  <BarChart3 size={16} />
                </div>
              </div>
              <div>
                <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-[0.2em] font-fira-code mb-0.5">{stat.label}</p>
                <div className="flex items-baseline gap-1.5">
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter font-fira-sans leading-none">{stat.value}</h3>
                  <span className="text-[7.5px] font-black text-slate-300 uppercase tracking-widest font-fira-code">{stat.sub}</span>
                </div>
              </div>
            </div>
            {/* Decorative Liquid Glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-emerald-100/60 transition-colors duration-500"></div>
          </div>
        ))}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
        <div className="flex flex-1 gap-4 flex-wrap">
          <div className="relative group flex-1 min-w-[300px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-900/20 group-focus-within:text-emerald-600 transition-colors" size={16} />
            <input
              type="text"
              placeholder="SEARCH BY PATIENT NAME OR ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all shadow-md shadow-emerald-500/5 font-fira-code h-[36px]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all appearance-none cursor-pointer shadow-sm shadow-emerald-500/5 font-fira-code min-w-[140px] h-[36px]"
          >
            <option value="">Filter by Status</option>
            <option value="PENDING">Pending</option>
            <option value="SAMPLE_COLLECTED">Sample Collected</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all appearance-none cursor-pointer shadow-sm shadow-emerald-500/5 font-fira-code min-w-[140px] h-[36px]"
          >
            <option value="">Filter by Priority</option>
            <option value="ROUTINE">Routine</option>
            <option value="URGENT">Urgent</option>
            <option value="STAT">Emergency (STAT)</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-white border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all appearance-none cursor-pointer shadow-sm shadow-emerald-500/5 font-fira-code min-w-[140px] h-[36px]"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="60">Last 60 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* File Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.dcm,.dicom,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Lab Orders List */}
      <div className="bg-white/60 backdrop-blur-2xl rounded-xl border border-emerald-100 shadow-lg shadow-emerald-500/5 overflow-hidden animate-in slide-in-from-bottom-2 duration-700 relative z-10">
        <div className="p-4 border-b border-emerald-50 bg-emerald-50/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-emerald-100">
              <Layers size={16} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase">Recent Lab Orders</h3>
              <p className="text-[8px] font-black text-emerald-600/60 uppercase tracking-widest font-fira-code mt-0.5">Track all active and past lab tests</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest font-fira-code">Real-time Updates</span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-20">
            <div className="flex flex-col items-center gap-6">
              <div className="h-16 w-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-[10px] font-black text-emerald-900/30 uppercase tracking-[0.3em] font-fira-code">Loading Lab Orders...</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-32 bg-emerald-50/10">
            <LabIcon className="h-20 w-20 text-emerald-100 mx-auto mb-6 animate-pulse" />
            <p className="text-sm font-black text-slate-300 uppercase tracking-[0.2em] font-fira-code">No lab orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[8.5px] font-black uppercase tracking-[0.2em] font-fira-code">
                  {['Order #', 'Patient', 'Tests', 'Doctor', 'Priority', 'Status', 'Date Ordered', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50 font-medium">
                {orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-emerald-50/50 transition-all duration-300 cursor-pointer group">
                    <td className="px-6 py-4">
                      <span className="font-fira-code text-xs font-black text-emerald-900 tracking-tighter bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                        {order.order_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-black text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors font-fira-sans">
                          {order.patient?.first_name} {order.patient?.last_name}
                        </p>
                        <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest mt-0.5 font-fira-code">{order.patient?.mrn}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {order.items?.slice(0, 2).map((item: any) => (
                          <span key={item.id} className="text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 bg-white border border-emerald-100 text-emerald-700 rounded-md shadow-sm font-fira-code">
                            {item.lab_test?.code}
                          </span>
                        ))}
                        {order.items?.length > 2 && (
                          <span className="text-[8.5px] font-black text-slate-300 font-fira-code">+{order.items.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8.5px] font-black text-slate-500 border border-slate-200 uppercase font-fira-code">
                          {order.doctor?.last_name?.[0] || 'D'}
                        </div>
                        <span className="text-[11px] font-black text-slate-600 font-fira-sans uppercase tracking-tight">
                          Dr. {order.doctor?.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border font-fira-code',
                        order.priority === 'STAT' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                          order.priority === 'URGENT' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-slate-50 text-slate-500 border-slate-100'
                      )}>
                        {order.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border font-fira-code',
                        order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          order.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-sky-50 text-sky-700 border-sky-100'
                      )}>
                        {order.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-black text-slate-400 font-fira-code uppercase tracking-tighter">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'SAMPLE_COLLECTED' })}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[8.5px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md active:scale-95 cursor-pointer font-fira-code"
                          >
                            Collect Sample
                          </button>
                        )}
                        {order.status === 'SAMPLE_COLLECTED' && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'IN_PROGRESS' })}
                            className="px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-[8.5px] font-black uppercase tracking-widest hover:bg-cyan-700 transition-all shadow-md active:scale-95 cursor-pointer font-fira-code"
                          >
                            Start Processing
                          </button>
                        )}
                        {order.status === 'COMPLETED' && (
                          <button
                            onClick={() => setSelectedOrder(order.id)}
                            className="h-8 w-8 flex items-center justify-center bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all shadow-sm active:scale-95 cursor-pointer"
                            title="View Final Report"
                          >
                            <FileText size={14} />
                          </button>
                        )}
                        {['IN_PROGRESS', 'SAMPLE_COLLECTED'].includes(order.status) && (
                          <button
                            onClick={() => handleFileUpload(order.id)}
                            disabled={uploadFileMutation.isPending && uploadOrderId === order.id}
                            className="h-8 w-8 flex items-center justify-center bg-white border border-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-all shadow-sm active:scale-95 cursor-pointer"
                            title="Upload Results"
                          >
                            {uploadFileMutation.isPending && uploadOrderId === order.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Upload className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedOrder(order.id)}
                          className="h-8 w-8 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 rounded-lg hover:bg-white hover:text-emerald-600 hover:border-emerald-300 transition-all shadow-sm active:scale-95 cursor-pointer"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta?.totalPages && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-emerald-50 bg-slate-50/30">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-fira-code">Page {page} <span className="text-emerald-300 mx-2">/</span> {meta.totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-[9px] font-black uppercase tracking-widest border border-emerald-100 rounded-lg disabled:opacity-40 hover:bg-white transition-all text-slate-600 font-fira-code shadow-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(meta?.totalPages || 1, p + 1))}
                disabled={page === meta?.totalPages}
                className="px-4 py-2 text-[9px] font-black uppercase tracking-widest bg-white border border-emerald-100 rounded-lg disabled:opacity-40 hover:bg-emerald-50 transition-all text-emerald-700 font-fira-code shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && (
        <LabOrderDetailModal
          orderId={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}

export default function LabPageWrapper() {
  return (
    <ErrorBoundary>
      <LabPage />
    </ErrorBoundary>
  );
}
