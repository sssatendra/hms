'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, KeyRound, ShieldAlert, RefreshCw } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { coreApi } from '@/lib/api';
import { toast } from 'sonner';

const resetSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(6, 'Please confirm the password'),
}).refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
});

type ResetFormData = z.infer<typeof resetSchema>;

interface ResetPasswordModalProps {
    user: any;
    onClose: () => void;
}

export default function ResetPasswordModal({ user, onClose }: ResetPasswordModalProps) {
    const { register, handleSubmit, formState: { errors } } = useForm<ResetFormData>({
        resolver: zodResolver(resetSchema),
    });

    const mutation = useMutation({
        mutationFn: (data: ResetFormData) => {
            return coreApi.patch(`/users/${user.id}/reset-password`, { password: data.password });
        },
        onSuccess: () => {
            toast.success(`Password reset successful for ${user.first_name}`);
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to reset password');
        }
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-border bg-rose-500/[0.03] flex justify-between items-center text-foreground">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <KeyRound size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-xs uppercase tracking-widest text-foreground">
                                Reset Password
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter mt-0.5">
                                Set a new password for {user.first_name}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
                        <X size={18} className="text-muted-foreground" />
                    </button>
                </div>

                <div className="p-6 bg-amber-500/5 flex gap-3">
                    <ShieldAlert size={20} className="text-amber-500 shrink-0" />
                    <p className="text-[10px] font-bold text-amber-500 leading-relaxed uppercase tracking-tighter opacity-80">
                        Important: You are resetting the login password for this staff member. Please make sure the staff member is verified.
                    </p>
                </div>

                <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="p-6 space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">New System Password</label>
                        <input
                            {...register('password')}
                            type="password"
                            className="w-full h-10 px-4 bg-background border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                            placeholder="••••••••"
                        />
                        {errors.password && <p className="text-[9px] font-black text-destructive uppercase tracking-tighter px-1">{errors.password.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm Credentials</label>
                        <input
                            {...register('confirm_password')}
                            type="password"
                            className="w-full h-10 px-4 bg-background border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                            placeholder="••••••••"
                        />
                        {errors.confirm_password && <p className="text-[9px] font-black text-destructive uppercase tracking-tighter px-1">{errors.confirm_password.message}</p>}
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
                            className="h-10 px-8 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all flex items-center gap-2 shadow-lg shadow-amber-600/20 disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={mutation.isPending ? 'animate-spin' : ''} />
                            {mutation.isPending ? 'Processing...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
