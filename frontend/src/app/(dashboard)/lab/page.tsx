'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FlaskConical, Upload, CheckCircle, Clock, AlertCircle,
  Search, Plus, FileText, Loader2, X, Microscope
} from 'lucide-react';
import { coreApi, labApi } from '@/lib/api';
import { formatDateTime, getStatusColor, cn } from '@/lib/utils';
import { SkeletonTable } from '@/components/shared/skeleton';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import LabOrderDetailModal from '@/components/lab/LabOrderDetailModal';
import Link from 'next/link';

function LabPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
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
    queryKey: ['lab', 'orders', page, search, statusFilter, priorityFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      if (search) params.set('patient_id', search);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laboratory</h1>
          <p className="text-sm text-gray-500">Lab orders and test results management</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/lab/tests"
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl hover:bg-muted transition-all font-bold text-xs uppercase tracking-wider"
          >
            <Microscope className="h-4 w-4" />
            Manage Tests
          </Link>
          <Link
            href="/lab/orders/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            New Order
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending', value: stats?.data?.pending ?? '–', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock },
          { label: 'In Progress', value: stats?.data?.inProgress ?? '–', color: 'text-blue-600', bg: 'bg-blue-100', icon: Loader2 },
          { label: 'Completed', value: stats?.data?.completed ?? '–', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle },
          { label: 'Today Total', value: stats?.data?.today ?? '–', color: 'text-purple-600', bg: 'bg-purple-100', icon: FlaskConical },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.dcm,.dicom,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Orders table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="SAMPLE_COLLECTED">Sample Collected</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priority</option>
            <option value="ROUTINE">Routine</option>
            <option value="URGENT">Urgent</option>
            <option value="STAT">STAT</option>
          </select>
        </div>

        {isLoading ? (
          <div className="p-4"><SkeletonTable rows={6} /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <FlaskConical className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No lab orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {['Order #', 'Patient', 'Tests', 'Doctor', 'Priority', 'Status', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-gray-700">{order.order_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {order.patient?.first_name} {order.patient?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{order.patient?.mrn}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {order.items?.slice(0, 2).map((item: any) => (
                          <span key={item.id} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            {item.lab_test?.code}
                          </span>
                        ))}
                        {order.items?.length > 2 && (
                          <span className="text-xs text-gray-400">+{order.items.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        Dr. {order.doctor?.last_name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full font-medium',
                        order.priority === 'STAT' ? 'bg-red-100 text-red-700' :
                          order.priority === 'URGENT' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-600'
                      )}>
                        {order.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-1 rounded-full font-medium', getStatusColor(order.status))}>
                        {order.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">
                        {formatDateTime(order.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Status progression */}
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'SAMPLE_COLLECTED' })}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                          >
                            Collect Sample
                          </button>
                        )}
                        {order.status === 'SAMPLE_COLLECTED' && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'IN_PROGRESS' })}
                            className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors"
                          >
                            Start Processing
                          </button>
                        )}
                        {['IN_PROGRESS', 'SAMPLE_COLLECTED'].includes(order.status) && (
                          <button
                            onClick={() => handleFileUpload(order.id)}
                            disabled={uploadFileMutation.isPending && uploadOrderId === order.id}
                            className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors flex items-center gap-1"
                          >
                            {uploadFileMutation.isPending && uploadOrderId === order.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Upload className="h-3 w-3" />
                            )}
                            Upload
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedOrder(order.id)}
                          className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
                        >
                          View Details
                        </button>
                        {/* Files indicator */}
                        {order.files?.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <FileText className="h-3 w-3" />
                            {order.files.length}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta?.totalPages && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">Page {page} of {meta.totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(meta?.totalPages || 1, p + 1))}
                disabled={page === meta?.totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
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
