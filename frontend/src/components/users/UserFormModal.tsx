'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Save, UserPlus, Shield, Building2, BadgeInfo } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { coreApi } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const userSchema = z.object({
    first_name: z.string().min(2, 'First name is too short'),
    last_name: z.string().min(2, 'Last name is too short'),
    email: z.string().email('Invalid email address'),
    role: z.string().min(1, 'Please select a role'),
    department_id: z.string().optional(),
    employee_id: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
    specialization: z.string().optional(),
    skills: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormModalProps {
    user?: any;
    onClose: () => void;
}

export default function UserFormModal({ user, onClose }: UserFormModalProps) {
    const queryClient = useQueryClient();
    const isEditing = !!user;

    const { register, handleSubmit, watch, formState: { errors } } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: user ? {
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role?.name || user.role,
            department_id: user.department?.id || user.department_id,
            employee_id: user.employee_id,
            status: user.status || 'ACTIVE',
            specialization: user.specialization || '',
            skills: user.skills ? (Array.isArray(user.skills) ? user.skills.join(', ') : user.skills) : '',
        } : {
            status: 'ACTIVE',
            specialization: '',
            skills: '',
        }
    });

    const selectedRole = watch('role');

    const mutation = useMutation({
        mutationFn: (data: UserFormData) => {
            if (isEditing) {
                return coreApi.put(`/users/${user.id}`, data);
            }
            return coreApi.post('/users', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(isEditing ? 'Staff details updated' : 'New staff member registered');
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Operation failed');
        }
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            {isEditing ? <BadgeInfo size={20} /> : <UserPlus size={20} />}
                        </div>
                        <div>
                            <h3 className="font-black text-xs uppercase tracking-widest text-foreground">
                                {isEditing ? 'Edit Staff Profile' : 'Add New Staff'}
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter mt-0.5">
                                {isEditing ? `Updating details for ${user.first_name}` : 'Creating a new staff account'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
                        <X size={18} className="text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">First Name</label>
                            <input
                                {...register('first_name')}
                                className="w-full h-10 px-4 bg-background border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="Ex: John"
                            />
                            {errors.first_name && <p className="text-[9px] font-black text-destructive uppercase tracking-tighter px-1">{errors.first_name.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Last Name</label>
                            <input
                                {...register('last_name')}
                                className="w-full h-10 px-4 bg-background border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="Ex: Doe"
                            />
                            {errors.last_name && <p className="text-[9px] font-black text-destructive uppercase tracking-tighter px-1">{errors.last_name.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                        <input
                            {...register('email')}
                            type="email"
                            className="w-full h-10 px-4 bg-background border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="staff@hospital.com"
                        />
                        {errors.email && <p className="text-[9px] font-black text-destructive uppercase tracking-tighter px-1">{errors.email.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Role</label>
                            <select
                                {...register('role')}
                                className="w-full h-10 px-4 bg-background border border-border rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            >
                                <option value="">Select Role</option>
                                <option value="ADMIN">Administrator</option>
                                <option value="DOCTOR">Medical Doctor</option>
                                <option value="NURSE">Nursing Staff</option>
                                <option value="PHARMACIST">Pharmacist</option>
                                <option value="LAB_TECH">Lab Technician</option>
                                <option value="RECEPTIONIST">Front Desk</option>
                            </select>
                            {errors.role && <p className="text-[9px] font-black text-destructive uppercase tracking-tighter px-1">{errors.role.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Staff ID</label>
                            <input
                                {...register('employee_id')}
                                className="w-full h-10 px-4 bg-background border border-border rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="EMP-000"
                            />
                        </div>
                    </div>

                    {selectedRole === 'DOCTOR' && (
                        <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                            <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1 flex items-center gap-2">
                                <Shield size={10} />
                                Medical Specialization
                            </label>
                            <input
                                {...register('specialization')}
                                className="w-full h-10 px-4 bg-primary/5 border border-primary/20 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400"
                                placeholder="Ex: Orthopedics, Pediatrics, Cardiology"
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Skills / Expertise</label>
                        <input
                            {...register('skills')}
                            className="w-full h-10 px-4 bg-background border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="Ex: Emergency Care, Surgery, Patient Counseling (Comma separated)"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="h-10 px-8 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            <Save size={14} />
                            {mutation.isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Staff'}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
