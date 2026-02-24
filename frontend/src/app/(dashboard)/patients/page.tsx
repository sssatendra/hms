'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, User, Phone, Calendar, Droplets, ChevronRight, RefreshCw, FileText
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { formatAge, formatDate, getStatusColor, cn, generateMRN } from '@/lib/utils';
import { SkeletonTable } from '@/components/shared/skeleton';
import { ErrorBoundary, QueryError } from '@/components/shared/error-boundary';
import { useDebounce } from '@/hooks/use-debounce';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';


function PatientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['patients', page, debouncedSearch],
    queryFn: () =>
      coreApi.get<any[]>(`/patients?page=${page}&limit=20${debouncedSearch ? `&search=${debouncedSearch}` : ''}`),
  });

  const patients = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {meta?.total ? `${meta.total} patients registered` : 'Manage patient records'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Patient
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, MRN, email, phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Error */}
      <QueryError error={error as Error} onRetry={() => refetch()} />

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={8} />
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-16">
            <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-500 font-medium">No patients found</h3>
            <p className="text-sm text-gray-400 mt-1">
              {search ? 'Try a different search term' : 'Add your first patient'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {['Patient', 'MRN', 'Age / DOB', 'Blood Group', 'Contact', 'Allergies', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patients.map((patient: any) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0">
                          {patient.first_name?.[0]}{patient.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">{patient.gender?.toLowerCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-gray-600">{patient.mrn}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-900">{formatAge(patient.date_of_birth)}</p>
                        <p className="text-xs text-gray-500">{formatDate(patient.date_of_birth)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Droplets className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-sm text-gray-700">
                          {patient.blood_group?.replace('_', '+').replace('POSITIVE', '+').replace('NEGATIVE', '-')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        {patient.phone || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {patient.allergies?.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {patient.allergies.slice(0, 2).map((a: string) => (
                            <span key={a} className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                              {a}
                            </span>
                          ))}
                          {patient.allergies.length > 2 && (
                            <span className="text-xs text-gray-400">+{patient.allergies.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta?.totalPages && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, meta.total || 0)} of {meta.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(meta.totalPages || 0, page + 1))}
                disabled={page === meta.totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {showAddModal && <AddPatientModal onClose={() => setShowAddModal(false)} />}

      {/* Patient Detail Drawer */}
      {selectedPatient && (
        <PatientDetailDrawer
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </div>
  );
}

function AddPatientModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    defaultValues: { mrn: generateMRN() },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => coreApi.post('/patients', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Register New Patient</h2>
        </div>

        <form onSubmit={handleSubmit((data) => {
          const formattedData = {
            ...data,
            allergies: data.allergies_input ? data.allergies_input.split(',').map((s: string) => s.trim()) : []
          };
          createMutation.mutateAsync(formattedData);
        })} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'mrn', label: 'MRN', type: 'text' },
              { name: 'first_name', label: 'First Name', type: 'text' },
              { name: 'last_name', label: 'Last Name', type: 'text' },
              { name: 'date_of_birth', label: 'Date of Birth', type: 'date' },
              { name: 'phone', label: 'Phone', type: 'tel' },
              { name: 'email', label: 'Email', type: 'email' },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <input
                  {...register(field.name, { required: !['phone', 'email'].includes(field.name) })}
                  type={field.type}
                  className="w-full px-3 py-2 border border-gray-200 bg-white text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                {...register('gender', { required: true })}
                className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
              <select
                {...register('blood_group')}
                className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="UNKNOWN">Unknown</option>
                {['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'].map(bg => (
                  <option key={bg} value={bg}>{bg.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Allergies (comma separated)</label>
              <input
                {...register('allergies_input')}
                placeholder="e.g. Peanuts, Penicillin"
                className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {createMutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {(createMutation.error as any).message}
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {createMutation.isPending && <RefreshCw className="h-4 w-4 animate-spin" />}
              Register Patient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PatientDetailDrawer({ patient, onClose }: { patient: any; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ['patient', patient.id],
    queryFn: () => coreApi.get<any>(`/patients/${patient.id}`),
  });
  const router = useRouter();
  const fullPatient = data?.data || patient;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-lg bg-white shadow-xl overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Patient Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl">
              {patient.first_name?.[0]}{patient.last_name?.[0]}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {patient.first_name} {patient.last_name}
              </h3>
              <p className="text-gray-500 font-mono text-sm">{patient.mrn}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: 'Date of Birth', value: formatDate(patient.date_of_birth) },
              { label: 'Age', value: formatAge(patient.date_of_birth) },
              { label: 'Gender', value: patient.gender },
              { label: 'Blood Group', value: patient.blood_group?.replace('_', '+') },
              { label: 'Phone', value: patient.phone || '—' },
              { label: 'Email', value: patient.email || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="font-medium text-gray-900 mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {patient.allergies?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Allergies</p>
              <div className="flex gap-2 flex-wrap">
                {patient.allergies.map((a: string) => (
                  <span key={a} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">{a}</span>
                ))}
              </div>
            </div>
          )}

          {patient.chronic_conditions?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Chronic Conditions</p>
              <div className="flex gap-2 flex-wrap">
                {patient.chronic_conditions.map((c: string) => (
                  <span key={c} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
            <button
              onClick={() => router.push(`/patients/${patient.id}/records`)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
            >
              <FileText className="h-4 w-4" />
              View Full Clinical Records
            </button>
            <button className="w-full py-3 bg-gray-50 text-gray-700 rounded-xl font-bold border border-gray-200 hover:bg-gray-100 transition-all">
              Edit Patient Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PatientsPageWrapper() {
  return (
    <ErrorBoundary>
      <PatientsPage />
    </ErrorBoundary>
  );
}
