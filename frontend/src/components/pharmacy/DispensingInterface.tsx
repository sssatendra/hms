// /frontend/src/components/pharmacy/DispensingInterface.tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { coreApi } from '@/lib/api';

export function DispensingInterface() {
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  const { data: prescriptions } = useQuery({
    queryKey: ['pharmacy', 'pending'],
    queryFn: () => coreApi.get('/pharmacy/pending-prescriptions')
  });

  const dispenseMutation = useMutation({
    mutationFn: (data) => coreApi.post('/pharmacy/dispense', data),
    onSuccess: () => {
      // Refresh list
      queryClient.invalidateQueries(['pharmacy', 'pending']);
    }
  });

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Prescription List */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold">Pending Prescriptions</h2>
        {prescriptions?.data?.map((rx) => (
          <div
            key={rx.id}
            onClick={() => setSelectedPrescription(rx)}
            className="p-4 border rounded cursor-pointer hover:border-blue-500"
          >
            <div className="font-semibold">{rx.patient.first_name} {rx.patient.last_name}</div>
            <div className="text-sm text-gray-500">MRN: {rx.patient.mrn}</div>
            <div className="text-sm">Items: {rx.items.length}</div>
          </div>
        ))}
      </div>

      {/* Dispensing Form */}
      {selectedPrescription && (
        <div className="border rounded p-6">
          <h3 className="text-lg font-bold mb-4">Dispense Prescription</h3>
          {selectedPrescription.items.map((item) => (
            <div key={item.id} className="mb-4 p-3 bg-gray-50 rounded">
              <div className="font-semibold">{item.medication.name}</div>
              <div className="text-sm">Quantity: {item.quantity}</div>
              <div className="text-sm">Instructions: {item.instructions}</div>
              
              {/* Inventory selection */}
              <select className="mt-2 w-full border rounded p-2">
                <option>Select Batch</option>
                {/* Fetch available batches */}
              </select>
            </div>
          ))}

          <button
            className="w-full mt-4 bg-blue-500 text-white py-2 rounded"
            onClick={() => dispenseMutation.mutate({
              prescription_id: selectedPrescription.id,
              items: /* mapped items */
            })}
          >
            Dispense All
          </button>
        </div>
      )}
    </div>
  );
}