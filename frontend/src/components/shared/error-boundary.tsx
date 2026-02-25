// /frontend/src/components/shared/error-boundary.tsx
'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded"
              onClick={() => this.setState({ hasError: false })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function QueryError({ error, onRetry }: { error: any; onRetry: () => void }) {
  if (!error) return null;

  return (
    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-3 text-red-700">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold">Failed to load data</p>
          <p className="text-xs opacity-80">{error?.message || 'Check your connection and try again'}</p>
        </div>
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-white hover:bg-red-50 text-red-700 text-xs font-black uppercase tracking-widest rounded-lg border border-red-200 transition-all active:scale-95 flex items-center gap-2 shadow-sm"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </button>
    </div>
  );
}