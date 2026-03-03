'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FlaskConical, Upload, CheckCircle, Clock, AlertCircle,
  Search, Plus, FileText, Loader2, X, Microscope,
  RefreshCw, Shield, ChevronRight, BarChart3,
  Layers
} from 'lucide-react';
import { coreApi, labApi } from '@/lib/api';
import { formatDateTime, getStatusColor, cn, formatDate } from '@/lib/utils';

import { SkeletonTable } from '@/components/shared/skeleton';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import LabOrderDetailModal from '@/components/lab/LabOrderDetailModal';
import { ReportService } from '@/lib/reports.service';
import { toast } from 'sonner';
import Link from 'next/link';

const LabIcon = FlaskConical;

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab', 'orders'] });
      toast.success("Order status updated");
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update status');
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
      toast.success("File uploaded successfully");
      setUploadOrderId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'File upload failed');
    }
  });

  const orders = ordersData?.data || [];
  const meta = ordersData?.meta;

  const statusMap = {
    PENDING: { label: 'Pending', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    IN_PROGRESS: { label: 'In Progress', icon: Loader2, color: 'text-primary', bg: 'bg-primary/10' },
    COMPLETED: { label: 'Completed', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    CANCELLED: { label: 'Cancelled', icon: X, color: 'text-destructive', bg: 'bg-destructive/10' },
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
    <div className="p-4 lg:p-5 space-y-4 max-w-[1700px] mx-auto min-h-screen bg-background animate-in fade-in duration-700 font-fira-sans text-foreground">
      {/* Ambient Ocean Breeze Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[160px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[140px]"></div>
      </div>

      {/* Premium Header Architecture */}
      <div className="relative overflow-hidden bg-card/60 backdrop-blur-2xl p-6 lg:p-8 rounded-3xl border border-border shadow-xl shadow-primary/5 group">
        {/* Animated Accent Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-1000"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent p-0.5 shadow-lg shadow-primary/20 group hover:rotate-3 transition-transform duration-500">
              <div className="w-full h-full bg-card rounded-[13px] flex items-center justify-center">
                <Microscope className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <h1 className="text-xl lg:text-3xl font-black text-foreground tracking-tighter leading-none">Laboratory</h1>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-[0.2em] rounded-full border border-primary/20 font-fira-code">Lab Management</span>
              </div>
              <p className="text-[8.5px] font-black text-muted-foreground uppercase tracking-[0.2em] font-fira-code flex items-center gap-1.5">
                <Shield size={9} className="text-primary" /> Manage lab orders, samples, and results
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/lab/tests"
              className="flex items-center gap-2.5 px-6 py-3 bg-card/60 backdrop-blur-md border border-border rounded-xl hover:bg-card transition-all font-black text-[9px] uppercase tracking-widest text-muted-foreground shadow-md shadow-black/5 active:scale-95 cursor-pointer font-fira-code"
            >
              <Microscope className="h-4 w-4 text-primary" />
              Available Tests
            </Link>
            <Link
              href="/lab/orders/new"
              className="flex items-center gap-2.5 px-7 py-3.5 bg-primary text-primary-foreground rounded-xl hover:opacity-95 transition-all font-black shadow-lg shadow-primary/25 text-[9.5px] uppercase tracking-[0.2em] active:scale-95 cursor-pointer font-fira-code group border border-primary/20"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-transform" />
              New Lab Order
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[10%] w-64 h-64 bg-accent/5 rounded-full blur-[80px]" />
      </div>

      {/* Lab Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {[
          { label: 'Pending Orders', value: stats?.data?.pending ?? '–', sub: 'Orders in Queue', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock },
          { label: 'In Progress', value: stats?.data?.inProgress ?? '–', sub: 'Tests in Progress', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Loader2 },
          { label: 'Completed', value: stats?.data?.completed ?? '–', sub: 'Results Available', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle },
          { label: 'Total Today', value: stats?.data?.today ?? '–', sub: 'Total Orders Today', color: 'text-primary', bg: 'bg-primary/10', icon: LabIcon },
        ].map((stat, i) => (
          <div key={i} className="group relative bg-card/70 backdrop-blur-2xl p-6 rounded-3xl border border-border shadow-lg shadow-primary/5 hover:border-primary/50 transition-all duration-500 overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-xl shadow-inner transition-transform group-hover:rotate-6 duration-500", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <div className="p-1 rounded-full text-muted-foreground/40 group-hover:text-primary transition-colors">
                  <BarChart3 size={18} />
                </div>
              </div>
              <div>
                <p className="text-[8.5px] font-black text-muted-foreground uppercase tracking-[0.2em] font-fira-code mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-foreground tracking-tighter font-fira-sans leading-none">{stat.value}</h3>
                  <span className="text-[7.5px] font-black text-muted-foreground/30 uppercase tracking-widest font-fira-code">{stat.sub}</span>
                </div>
              </div>
            </div>
            {/* Decorative Liquid Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors duration-500"></div>
          </div>
        ))}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
        <div className="flex flex-1 gap-4 flex-wrap">
          <div className="relative group flex-1 min-w-[300px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={16} />
            <input
              type="text"
              placeholder="SEARCH BY PATIENT NAME OR ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-[9px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-md shadow-black/5 font-fira-code h-[36px] text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-[9px] font-black uppercase tracking-widest text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer shadow-sm shadow-black/5 font-fira-code min-w-[140px] h-[36px] text-foreground"
          >
            <option value="" className="bg-card">Filter by Status</option>
            <option value="PENDING" className="bg-card">Pending</option>
            <option value="SAMPLE_COLLECTED" className="bg-card">Sample Collected</option>
            <option value="IN_PROGRESS" className="bg-card">In Progress</option>
            <option value="COMPLETED" className="bg-card">Completed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-[9px] font-black uppercase tracking-widest text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer shadow-sm shadow-black/5 font-fira-code min-w-[140px] h-[36px] text-foreground"
          >
            <option value="" className="bg-card">Filter by Priority</option>
            <option value="ROUTINE" className="bg-card">Routine</option>
            <option value="URGENT" className="bg-card">Urgent</option>
            <option value="STAT" className="bg-card">Emergency (STAT)</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-card border border-border rounded-lg text-[9px] font-black uppercase tracking-widest text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer shadow-sm shadow-black/5 font-fira-code min-w-[140px] h-[36px] text-foreground"
          >
            <option value="7" className="bg-card">Last 7 Days</option>
            <option value="30" className="bg-card">Last 30 Days</option>
            <option value="60" className="bg-card">Last 60 Days</option>
            <option value="90" className="bg-card">Last 90 Days</option>
            <option value="all" className="bg-card">All Time</option>
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
      <div className="bg-card/60 backdrop-blur-2xl rounded-xl border border-border shadow-lg shadow-black/5 overflow-hidden animate-in slide-in-from-bottom-2 duration-700 relative z-10">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-card rounded-lg shadow-sm border border-border">
              <Layers size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="text-xs font-black text-foreground tracking-tight uppercase">Recent Lab Orders</h3>
              <p className="text-[8px] font-black text-primary/60 uppercase tracking-widest font-fira-code mt-0.5">Track all active and past lab tests</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>
            <span className="text-[8.5px] font-black text-muted-foreground uppercase tracking-widest font-fira-code">Real-time Updates</span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-20">
            <div className="flex flex-col items-center gap-6">
              <div className="h-16 w-16 border-4 border-muted border-t-primary rounded-full animate-spin" />
              <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] font-fira-code">Loading Lab Orders...</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-32 bg-muted/10">
            <LabIcon className="h-20 w-20 text-muted-foreground/10 mx-auto mb-6 animate-pulse" />
            <p className="text-sm font-black text-muted-foreground/30 uppercase tracking-[0.2em] font-fira-code">No lab orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted text-muted-foreground text-[8.5px] font-black uppercase tracking-[0.2em] font-fira-code">
                  {['Order #', 'Patient', 'Tests', 'Doctor', 'Priority', 'Status', 'Date Ordered', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-muted/50 transition-all duration-300 cursor-pointer group">
                    <td className="px-6 py-4">
                      <span className="font-fira-code text-xs font-black text-primary tracking-tighter bg-primary/10 px-2 py-1 rounded-lg border border-primary/20">
                        {order.order_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-black text-foreground tracking-tight group-hover:text-primary transition-colors font-fira-sans">
                          {order.patient?.first_name} {order.patient?.last_name}
                        </p>
                        <p className="text-[8.5px] font-black text-muted-foreground/40 uppercase tracking-widest mt-0.5 font-fira-code">{order.patient?.mrn}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {order.items?.slice(0, 2).map((item: any) => (
                          <span key={item.id} className="text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 bg-card border border-border text-primary rounded-md shadow-sm font-fira-code">
                            {item.lab_test?.code}
                          </span>
                        ))}
                        {order.items?.length > 2 && (
                          <span className="text-[8.5px] font-black text-muted-foreground font-fira-code">+{order.items.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[8.5px] font-black text-muted-foreground border border-border uppercase font-fira-code">
                          {order.doctor?.last_name?.[0] || 'D'}
                        </div>
                        <span className="text-[11px] font-black text-foreground/80 font-fira-sans uppercase tracking-tight">
                          Dr. {order.doctor?.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border font-fira-code',
                        order.priority === 'STAT' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                          order.priority === 'URGENT' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            'bg-muted text-muted-foreground border-border'
                      )}>
                        {order.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border font-fira-code',
                        order.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          order.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            'bg-primary/10 text-primary border-primary/20'
                      )}>
                        {order.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-black text-muted-foreground font-fira-code uppercase tracking-tighter">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'SAMPLE_COLLECTED' })}
                            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[8.5px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-md active:scale-95 cursor-pointer font-fira-code"
                          >
                            Collect Sample
                          </button>
                        )}
                        {order.status === 'SAMPLE_COLLECTED' && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'IN_PROGRESS' })}
                            className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-[8.5px] font-black uppercase tracking-widest hover:bg-accent/90 transition-all shadow-md active:scale-95 cursor-pointer font-fira-code"
                          >
                            Start Processing
                          </button>
                        )}
                        {order.status === 'COMPLETED' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedOrder(order.id)}
                              className="h-8 w-8 flex items-center justify-center bg-primary/10 border border-primary/20 text-primary rounded-lg hover:bg-primary/20 transition-all shadow-sm active:scale-95 cursor-pointer"
                              title="View Details"
                            >
                              <FileText size={14} />
                            </button>
                            <button
                              onClick={() => ReportService.generateLabReport(order.patient, order)}
                              className="h-8 w-8 flex items-center justify-center bg-card border border-border text-foreground rounded-lg hover:border-primary hover:text-primary transition-all shadow-sm active:scale-95 cursor-pointer"
                              title="Download PDF Report"
                            >
                              <RefreshCw size={12} className="text-primary animate-pulse" />
                            </button>
                          </div>
                        )}
                        {['IN_PROGRESS', 'SAMPLE_COLLECTED'].includes(order.status) && (
                          <button
                            onClick={() => handleFileUpload(order.id)}
                            disabled={uploadFileMutation.isPending && uploadOrderId === order.id}
                            className="h-8 w-8 flex items-center justify-center bg-card border border-border text-primary rounded-lg hover:border-primary transition-all shadow-sm active:scale-95 cursor-pointer"
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
                          className="h-8 w-8 flex items-center justify-center bg-muted border border-border text-muted-foreground rounded-lg hover:bg-card hover:text-primary hover:border-primary transition-all shadow-sm active:scale-95 cursor-pointer"
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-fira-code">Page {page} <span className="text-primary/30 mx-2">/</span> {meta.totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-[9px] font-black uppercase tracking-widest border border-border rounded-lg disabled:opacity-40 bg-card hover:bg-muted transition-all text-muted-foreground font-fira-code shadow-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(meta?.totalPages || 1, p + 1))}
                disabled={page === meta?.totalPages}
                className="px-4 py-2 text-[9px] font-black uppercase tracking-widest bg-primary text-primary-foreground border border-primary/20 rounded-lg disabled:opacity-40 hover:opacity-90 transition-all font-fira-code shadow-sm"
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
