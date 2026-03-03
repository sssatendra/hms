'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ShortcutGuide() {
    const [isOpen, setIsOpen] = useState(false);
    const guideRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (guideRef.current && !guideRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const shortcuts = [
        { key: 'Ctrl + K', label: 'Open Global Search' },
        { divider: true, label: 'Inside Search' },
        { key: 'D', label: 'Navigate to Dashboard' },
        { key: 'P', label: 'Navigate to Patients' },
        { key: 'W', label: 'Navigate to Wards' },
        { key: 'L', label: 'Navigate to Laboratory' },
        { key: 'S', label: 'Navigate to Staff' },
        { key: 'O', label: 'Navigate to Settings' },
        { divider: true, label: 'General' },
        { key: 'Enter', label: 'Select / Confirm' },
        { key: 'Esc', label: 'Close Search / Modal' },
        { key: '↑↓', label: 'Move Selection' },
    ];

    return (
        <div className="relative" ref={guideRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "p-2 rounded-lg transition-all duration-300",
                    isOpen ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                title="Keyboard Shortcuts"
            >
                <Keyboard className="h-4 w-4" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-card border border-border rounded-2xl shadow-2xl p-4 z-[110] animate-in fade-in zoom-in-95 duration-200 ring-1 ring-primary/10">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Shortcut Guide</p>
                        <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                            <X size={14} />
                        </button>
                    </div>

                    <div className="space-y-2.5">
                        {shortcuts.map((s, i) => (
                            s.divider ? (
                                <div key={i} className="pt-2 pb-1">
                                    <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest border-b border-border/50 pb-1">{s.label}</p>
                                </div>
                            ) : (
                                <div key={i} className="flex items-center justify-between group">
                                    <span className="text-[10px] font-black text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-tight">{s.label}</span>
                                    <kbd className="px-2 py-0.5 bg-muted border border-border rounded text-[9px] font-black shadow-sm font-fira-code text-foreground">{s.key}</kbd>
                                </div>
                            )
                        ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-border/50 text-center">
                        <p className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">Matrix Navigation Protocol v1.0</p>
                    </div>
                </div>
            )}
        </div>
    );
}
