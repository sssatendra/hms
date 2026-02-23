'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Search, PenSquare, Clock, CheckCircle } from 'lucide-react';
import { coreApi } from '@/lib/api';
import { formatDateTime, cn } from '@/lib/utils';
import { SkeletonTable } from '@/components/shared/skeleton';
import { ErrorBoundary } from '@/components/shared/error-boundary';

function EMRPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'notes' | 'prescriptions'>('notes');
  const [page, setPage] = useState(1);

  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: ['emr', 'notes', page],
    queryFn: () => coreApi.get<any[]>(`/emr/notes?page=${page}&limit=15`),
    enabled: tab === 'notes',
  });

  const { data: rxData, isLoading: rxLoading } = useQuery({
    queryKey: ['emr', 'prescriptions', page],
    queryFn: () => coreApi.get<any[]>(`/emr/prescriptions?page=${page}&limit=15`),
    enabled: tab === 'prescriptions',
  });

  const notes = notesData?.data || [];
  const prescriptions = rxData?.data || [];
  const isLoading = tab === 'notes' ? notesLoading : rxLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Electronic Medical Records</h1>
        <p className="text-sm text-gray-500">Clinical notes and prescriptions</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { key: 'notes', label: 'Clinical Notes' },
            { key: 'prescriptions', label: 'Prescriptions' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key as any); setPage(1); }}
              className={cn(
                'px-5 py-3.5 text-sm font-medium border-b-2 transition-colors',
                tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-4"><SkeletonTable rows={6} /></div>
        ) : tab === 'notes' ? (
          notes.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No clinical notes found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notes.map((note: any) => (
                <div key={note._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          Patient ID: {note.patient_id}
                        </span>
                        {note.is_signed && (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            Signed
                          </span>
                        )}
                        {note.is_amended && (
                          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                            Amended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        <strong>Assessment:</strong> {note.assessment}
                      </p>
                      {note.icd_codes?.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {note.icd_codes.map((code: string) => (
                            <span key={code} className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-mono">
                              {code}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(note.visit_date || note.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          prescriptions.length === 0 ? (
            <div className="text-center py-16">
              <PenSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No prescriptions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {['Patient', 'Doctor', 'Diagnosis', 'Items', 'Status', 'Date'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {prescriptions.map((rx: any) => (
                    <tr key={rx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {rx.patient?.first_name} {rx.patient?.last_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        Dr. {rx.doctor?.last_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                        {rx.diagnosis || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{rx.items?.length} items</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs px-2 py-1 rounded-full font-medium', {
                          'bg-green-100 text-green-700': rx.status === 'ACTIVE',
                          'bg-blue-100 text-blue-700': rx.status === 'DISPENSED',
                          'bg-gray-100 text-gray-600': rx.status === 'DRAFT',
                          'bg-red-100 text-red-700': rx.status === 'CANCELLED',
                        })}>
                          {rx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDateTime(rx.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default function EMRPageWrapper() {
  return <ErrorBoundary><EMRPage /></ErrorBoundary>;
}
