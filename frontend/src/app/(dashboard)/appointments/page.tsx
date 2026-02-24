'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Clock, Plus } from 'lucide-react';
import { coreApi } from '@/lib/api';
import { formatDateTime, getStatusColor, cn } from '@/lib/utils';
import { SkeletonTable } from '@/components/shared/skeleton';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { useForm } from 'react-hook-form';

// ✅ Types
type Appointment = {
  id: string;
  type: string;
  status: string;
  scheduled_at: string;
  duration_mins: number;
  patient?: {
    first_name: string;
    last_name: string;
    mrn: string;
  };
  doctor?: {
    first_name: string;
    last_name: string;
  };
};

type ApiResponse<T> = {
  data: T;
  meta?: {
    totalPages?: number;
  };
};

function AppointmentsPage() {
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ApiResponse<Appointment[]>>({
    queryKey: ['appointments', page, dateFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      });

      if (dateFilter) params.set('date', dateFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await coreApi.get<Appointment[]>(`/appointments?${params}`);

      // ✅ Normalize response (IMPORTANT FIX)
      return {
        data: res.data ?? [],   // fallback if undefined
        meta: res.meta ?? { totalPages: 1 },
      };
    },
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      coreApi.patch(`/appointments/${id}`, { status }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const appointments = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500">
            Schedule and manage patient appointments
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          New Appointment
        </button>
      </div>

      {/* Filters + Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 flex gap-3 flex-wrap">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {(dateFilter || statusFilter) && (
            <button
              onClick={() => {
                setDateFilter('');
                setStatusFilter('');
              }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg"
            >
              Clear
            </button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={8} />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-16">
            <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No appointments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {[
                    'Patient',
                    'Doctor',
                    'Type',
                    'Date & Time',
                    'Duration',
                    'Status',
                    'Actions',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {appointments.map((appt) => (
                  <tr
                    key={appt.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Patient */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">
                        {appt.patient?.first_name} {appt.patient?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {appt.patient?.mrn}
                      </p>
                    </td>

                    {/* Doctor */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      Dr. {appt.doctor?.first_name}{' '}
                      {appt.doctor?.last_name}
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {appt.type?.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        {formatDateTime(appt.scheduled_at)}
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {appt.duration_mins} min
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'text-xs px-2 py-1 rounded-full font-medium',
                          getStatusColor(appt.status)
                        )}
                      >
                        {appt.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {appt.status === 'SCHEDULED' && (
                          <button
                            onClick={() =>
                              patchMutation.mutate({
                                id: appt.id,
                                status: 'CONFIRMED',
                              })
                            }
                            className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100"
                          >
                            Confirm
                          </button>
                        )}

                        {appt.status === 'CONFIRMED' && (
                          <button
                            onClick={() =>
                              patchMutation.mutate({
                                id: appt.id,
                                status: 'IN_PROGRESS',
                              })
                            }
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                          >
                            Start
                          </button>
                        )}

                        {appt.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() =>
                              patchMutation.mutate({
                                id: appt.id,
                                status: 'COMPLETED',
                              })
                            }
                            className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>

              <button
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddAppointmentModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}

function AddAppointmentModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<any>();

  // Fetch doctors and patients for dropdowns
  const { data: doctorsData } = useQuery({
    queryKey: ['users', 'doctors'],
    queryFn: () => coreApi.get<any[]>('/users?role=DOCTOR'),
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients', 'list'],
    queryFn: () => coreApi.get<any[]>('/patients?limit=100'),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => coreApi.post('/appointments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onClose();
    },
  });

  const doctors = doctorsData?.data || [];
  const patients = patientsData?.data || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Schedule Appointment</h2>
        </div>

        <form onSubmit={handleSubmit((data) => createMutation.mutateAsync(data))} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
            <select
              {...register('patient_id', { required: true })}
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Patient</option>
              {patients.map((p: any) => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.mrn})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
            <select
              {...register('doctor_id', { required: true })}
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Doctor</option>
              {doctors.map((d: any) => (
                <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name} - {d.specialization}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
              <input
                type="datetime-local"
                {...register('scheduled_at', { required: true })}
                className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
              <select
                {...register('duration_mins', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
            <textarea
              {...register('chief_complaint')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Reason for visit..."
            />
          </div>

          {createMutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {(createMutation.error as any).message || 'Failed to schedule appointment'}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? 'Scheduling...' : 'Schedule Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AppointmentsPageWrapper() {
  return (
    <ErrorBoundary>
      <AppointmentsPage />
    </ErrorBoundary>
  );
}