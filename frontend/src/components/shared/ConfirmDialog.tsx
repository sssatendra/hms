'use client';

import { X, AlertTriangle, Info, AlertOctagon, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Portal } from './portal';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info' | 'question';
    isLoading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger',
    isLoading = false,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const icons = {
        danger: <AlertOctagon className="h-6 w-6 text-red-600" />,
        warning: <AlertTriangle className="h-6 w-6 text-amber-600" />,
        info: <Info className="h-6 w-6 text-blue-600" />,
        question: <HelpCircle className="h-6 w-6 text-primary" />,
    };

    const colors = {
        danger: 'bg-red-50 border-red-100',
        warning: 'bg-amber-50 border-amber-100',
        info: 'bg-blue-50 border-blue-100',
        question: 'bg-primary/5 border-primary/10',
    };

    const buttonColors = {
        danger: 'bg-red-600 hover:bg-red-700 shadow-red-200',
        warning: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200',
        info: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
        question: 'bg-primary hover:bg-primary/90 shadow-primary/20',
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />

                {/* Modal */}
                <div className="relative bg-card w-full max-w-sm rounded-[2rem] border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-8">
                        <div className={cn("w-14 h-14 rounded-2xl border flex items-center justify-center mb-6", colors[type])}>
                            {icons[type]}
                        </div>

                        <h3 className="text-xl font-black text-foreground tracking-tight mb-2">
                            {title}
                        </h3>

                        <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                            {description}
                        </p>
                    </div>

                    <div className="p-6 bg-muted/30 border-t border-border flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border border-border bg-card hover:bg-muted transition-all disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={cn(
                                "flex-1 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2",
                                buttonColors[type]
                            )}
                        >
                            {isLoading && (
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            )}
                            {confirmText}
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>
            </div>
        </Portal>
    );
}
