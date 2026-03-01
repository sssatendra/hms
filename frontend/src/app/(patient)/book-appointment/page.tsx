// /frontend/src/app/(patient)/book-appointment/page.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { coreApi } from '@/lib/api';
import { ClinicalDatePicker } from '@/components/shared/ClinicalDatePicker';

export default function BookAppointmentPage() {
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const { data: slots } = useQuery({
    queryKey: ['slots', selectedDoctor, selectedDate],
    queryFn: () => coreApi.get(`/appointments/available-slots?doctor_id=${selectedDoctor}&date=${selectedDate}`),
    enabled: !!selectedDoctor && !!selectedDate
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Book Appointment</h1>

      {/* Doctor selection */}
      <select onChange={(e) => setSelectedDoctor(e.target.value)}>
        <option value="">Select Doctor</option>
        {/* Fetch doctors list */}
      </select>

      {/* Date picker */}
      <ClinicalDatePicker
        label="Select Date"
        value={selectedDate}
        onChange={setSelectedDate}
        className="w-full max-w-xs"
      />

      {/* Available slots */}
      <div className="grid grid-cols-4 gap-2 mt-6">
        {slots?.data?.map((slot) => (
          <button
            key={slot.time}
            disabled={!slot.available}
            className={cn(
              'p-3 rounded border',
              slot.available
                ? 'border-blue-500 hover:bg-blue-50'
                : 'border-gray-300 bg-gray-100 cursor-not-allowed'
            )}
          >
            {new Date(slot.time).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </button>
        ))}
      </div>
    </div>
  );
}