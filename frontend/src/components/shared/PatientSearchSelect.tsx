'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, X, Check, Loader2, Calendar, Phone, User } from 'lucide-react';
import { coreApi as api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { ClinicalDatePicker } from './ClinicalDatePicker';

interface Patient {
    id: string;
    mrn: string;
    first_name: string;
    last_name: string;
    phone: string;
    date_of_birth: string;
}

interface PatientSearchSelectProps {
    onSelect: (patientId: string) => void;
    defaultValue?: string;
    className?: string;
}

export function PatientSearchSelect({ onSelect, defaultValue, className }: PatientSearchSelectProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm();

    // Search patients
    const { data: results, isLoading: isSearching } = useQuery({
        queryKey: ['patients', 'search', searchTerm],
        queryFn: async () => {
            if (searchTerm.length < 2) return [];
            const res = await api.get<Patient[]>(`/patients?search=${encodeURIComponent(searchTerm)}&limit=5`);
            return res.data || [];
        },
        enabled: searchTerm.length >= 2,
    });

    // Create patient mutation
    const createMutation = useMutation({
        mutationFn: (data: any) => api.post<Patient>('/patients', data),
        onSuccess: (res) => {
            const newPatient = res.data!;
            handleSelect(newPatient);
            setIsCreating(false);
            reset();
            queryClient.invalidateQueries({ queryKey: ['patients'] });
        }
    });

    const handleSelect = (patient: Patient) => {
        setSelectedPatient(patient);
        onSelect(patient.id);
        setIsOpen(false);
        setSearchTerm('');
    };

    const clearSelection = () => {
        setSelectedPatient(null);
        onSelect('');
    };

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (selectedPatient) {
        return (
            <div className={cn("relative flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl animate-in fade-in zoom-in-95 duration-200", className)}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <User size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-blue-900">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">{selectedPatient.mrn}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={clearSelection}
                    className="p-1 hover:bg-blue-100 rounded-full transition-colors text-blue-400 hover:text-blue-600"
                >
                    <X size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className={cn("relative", className)} ref={dropdownRef}>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search size={16} />
                </span>
                <input
                    type="text"
                    placeholder="Search by name, MRN, or phone..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                        setIsCreating(false);
                    }}
                    onFocus={() => setIsOpen(true)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:font-medium"
                />
                {isSearching && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin">
                        <Loader2 size={16} />
                    </span>
                )}
            </div>

            {isOpen && (searchTerm.length >= 2 || isCreating) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200">
                    {!isCreating ? (
                        <div className="p-2">
                            {results && results.length > 0 ? (
                                <>
                                    <div className="p-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Search Results</div>
                                    {results.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => handleSelect(p)}
                                            className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors text-left group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary">
                                                    <User size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700">{p.first_name} {p.last_name}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{p.mrn} • {p.phone}</p>
                                                </div>
                                            </div>
                                            <Check size={16} className="text-primary opacity-0 group-hover:opacity-100" />
                                        </button>
                                    ))}
                                </>
                            ) : !isSearching && (
                                <div className="p-8 text-center italic text-slate-400 text-sm">
                                    No patient found.
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => setIsCreating(true)}
                                className="w-full mt-2 flex items-center justify-center gap-2 p-3 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl transition-all font-bold text-xs uppercase tracking-widest border border-primary/10"
                            >
                                <UserPlus size={16} />
                                Quick Create New Patient
                            </button>
                        </div>
                    ) : (
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Quick Register Patient</h3>
                                <button type="button" onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-1">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1 ml-1">First Name</label>
                                    <input
                                        {...register('first_name', { required: true })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
                                        placeholder="Enter first name"
                                    />
                                    {errors.first_name && <p className="text-[9px] text-red-500 mt-1 ml-1">Required</p>}
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1 ml-1">Last Name</label>
                                    <input
                                        {...register('last_name', { required: true })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
                                        placeholder="Enter last name"
                                    />
                                    {errors.last_name && <p className="text-[9px] text-red-500 mt-1 ml-1">Required</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1 ml-1">Phone Number</label>
                                <div className="relative">
                                    <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        {...register('phone', { required: true })}
                                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
                                        placeholder="+91 XXXXX XXXXX"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Controller
                                        control={control}
                                        name="date_of_birth"
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <ClinicalDatePicker
                                                label="Date of Birth"
                                                mode="demographic"
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        )}
                                    />
                                    {errors.date_of_birth && <p className="text-[9px] text-red-500 mt-1 ml-1">Required</p>}
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1 ml-1">Gender</label>
                                    <select
                                        {...register('gender', { required: true })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
                                    >
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleSubmit((data) => createMutation.mutate(data))(e);
                                    }}
                                    disabled={createMutation.isPending}
                                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {createMutation.isPending ? 'Activating Profile...' : 'Complete Registration & Select'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
