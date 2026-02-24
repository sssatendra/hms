// /frontend/src/components/appointments/TokenQueue.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { coreApi } from '@/lib/api';

export function TokenQueue() {
  const { data } = useQuery({
    queryKey: ['appointments', 'queue'],
    queryFn: () => coreApi.get('/appointments/queue/today'),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Today's Queue</h2>
      <div className="space-y-3">
        {data?.data.map((apt) => (
          <div
            key={apt.id}
            className={cn(
              'p-4 rounded border',
              apt.status === 'IN_PROGRESS' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-2xl">Token #{apt.token_number}</div>
                <div>{apt.patient.first_name} {apt.patient.last_name}</div>
                <div className="text-sm text-gray-500">MRN: {apt.patient.mrn}</div>
              </div>
              <div className="text-right">
                <div className="text-sm">Dr. {apt.doctor.first_name}</div>
                <div className="text-xs text-gray-500">
                  Wait: ~{apt.estimated_wait_mins} mins
                </div>
                {apt.status === 'SCHEDULED' && (
                  <button
                    className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded"
                    onClick={() => callPatient(apt.id)}
                  >
                    Call Next
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}