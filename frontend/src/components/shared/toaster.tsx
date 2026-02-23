'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'bg-white border border-gray-200 shadow-lg rounded-xl text-sm',
          title: 'font-semibold text-gray-900',
          description: 'text-gray-500',
          error: 'border-red-200 bg-red-50',
          success: 'border-green-200 bg-green-50',
          warning: 'border-yellow-200 bg-yellow-50',
        },
      }}
    />
  );
}
