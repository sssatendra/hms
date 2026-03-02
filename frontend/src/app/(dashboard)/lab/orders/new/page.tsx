'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Search, User, FlaskConical, AlertCircle,
  ChevronLeft, Plus, X, Check, Loader2,
  Clock, Archive, Info
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/shared/error-boundary';

export default function NewLabOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [priority, setPriority] = useState<'ROUTINE' | 'URGENT' | 'STAT'>('ROUTINE');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [showPatientList, setShowPatientList] = useState(false);

  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ['patients', 'search', patientSearch],
    queryFn: () => coreApi.get<any[]>(`/patients?search=${patientSearch}`),
    enabled: patientSearch.length > 2,
  });

  const { data: tests, isLoading: testsLoading } = useQuery({
    queryKey: ['lab', 'tests'],
    queryFn: () => coreApi.get<any[]>('/lab/tests'),
  });

  const createOrder = useMutation({
    mutationFn: (data: any) => coreApi.post('/lab/orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab', 'orders'] });
      toast.success("Lab order created successfully");
      router.push('/lab');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create lab order');
    }
  });

  const handleCreateOrder = () => {
    if (!selectedPatient || selectedTests.length === 0) return;

    createOrder.mutate({
      patient_id: selectedPatient.id,
      priority,
      clinical_notes: clinicalNotes,
      tests: selectedTests.map(id => ({ lab_test_id: id }))
    });
  };

  const toggleTest = (testId: string) => {
    setSelectedTests(prev =>
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    );
  };

  const testList = tests?.data || [];
  const patientResults = patients?.data || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">New Lab Order</h1>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-1">Diagnostic Investigation Request</p>
          </div>
        </div>
        <button
          onClick={handleCreateOrder}
          disabled={!selectedPatient || selectedTests.length === 0 || createOrder.isPending}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20"
        >
          {createOrder.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FlaskConical className="h-4 w-4" />
          )}
          Create Lab Order
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Selection */}
          <div className="bg-card rounded-2xl border border-border shadow-sm">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Recipient Information
              </h2>
              {selectedPatient && (
                <button
                  onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}
                  className="text-[10px] font-black uppercase text-red-500 hover:underline"
                >
                  Change Patient
                </button>
              )}
            </div>
            <div className="p-6">
              {!selectedPatient ? (
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search patient by MRN or Name (Min 3 chars)..."
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setShowPatientList(true);
                    }}
                    onFocus={() => setShowPatientList(true)}
                    className="w-full pl-12 pr-4 py-4 bg-muted/10 border-2 border-border rounded-2xl text-sm font-bold focus:border-primary outline-none transition-all"
                  />
                  {showPatientList && patientSearch.length >= 3 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
                      {patientsLoading ? (
                        <div className="p-8 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                        </div>
                      ) : patientResults.length === 0 ? (
                        <div className="p-8 text-center text-sm font-bold text-muted-foreground">
                          No patients matched your search
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {patientResults.map((p: any) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setSelectedPatient(p);
                                setShowPatientList(false);
                              }}
                              className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors text-left"
                            >
                              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                                {p.first_name[0]}
                              </div>
                              <div>
                                <p className="text-sm font-black">{p.first_name} {p.last_name}</p>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">MRN: {p.mrn}</p>
                              </div>
                              <div className="ml-auto flex items-center gap-2">
                                <span className="text-[9px] font-black px-2 py-0.5 bg-muted rounded uppercase">
                                  {p.gender}
                                </span>
                                <span className="text-[9px] font-black px-2 py-0.5 bg-muted rounded uppercase">
                                  {p.age} Y
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-6 p-4 bg-primary/5 border-2 border-primary/10 rounded-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-black">
                    {selectedPatient.first_name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-xl font-black tracking-tight">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                        <Archive className="h-3.5 w-3.5" />
                        MRN: {selectedPatient.mrn}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5" />
                        DOB: {new Date(selectedPatient.dob).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Test Selection */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-primary" />
                Select Laboratory Investigations
              </h2>
              <span className="text-[10px] font-black bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase tracking-tighter">
                {selectedTests.length} Items Selected
              </span>
            </div>
            <div className="p-6">
              {testsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {testList.map((test: any) => (
                    <button
                      key={test.id}
                      onClick={() => toggleTest(test.id)}
                      className={cn(
                        "p-4 flex flex-col items-start gap-1 rounded-2xl border-2 text-left transition-all relative overflow-hidden group",
                        selectedTests.includes(test.id)
                          ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                          : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                      )}
                    >
                      {selectedTests.includes(test.id) && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5 scale-100 transition-transform">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        {test.category}
                      </p>
                      <p className="text-sm font-black group-hover:text-primary transition-colors">{test.name}</p>
                      <div className="flex items-center justify-between w-full mt-2">
                        <span className="text-[10px] font-bold text-muted-foreground/60">{test.code}</span>
                        <span className="text-xs font-black text-primary">₹ {test.price}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Configuration Sidebar */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-muted/20">
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Order Configuration
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-3">Priority Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ROUTINE', label: 'Routine', color: 'bg-green-50 text-green-700' },
                    { id: 'URGENT', label: 'Urgent', color: 'bg-amber-50 text-amber-700' },
                    { id: 'STAT', label: 'Stat', color: 'bg-red-50 text-red-700' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPriority(p.id as any)}
                      className={cn(
                        "px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                        priority === p.id
                          ? `border-primary ${p.color} ring-2 ring-primary/20`
                          : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-3">Clinical Rationale</label>
                <textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Provide indications or clinical context for this investigation..."
                  className="w-full h-32 p-4 bg-muted/10 border-2 border-border rounded-xl text-xs font-bold outline-none focus:border-primary transition-all resize-none"
                />
              </div>

              <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 mt-6">
                <div className="flex gap-3">
                  <div className="mt-1"><AlertCircle className="h-4 w-4 text-blue-600" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-800 mb-1">Investigation Policy</p>
                    <p className="text-[10px] font-bold text-blue-600 leading-relaxed uppercase opacity-80">
                      Sample collection is usually performed within 60 minutes for STAT orders. Results will be notified to the ordering practitioner.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}