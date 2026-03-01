'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, setYear, setMonth, getYear, getMonth, getDaysInMonth, startOfMonth, startOfWeek, addDays, isSameDay, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface ClinicalDatePickerProps {
    value?: string;
    onChange: (date: string) => void;
    label?: string;
    mode?: 'demographic' | 'clinical';
    required?: boolean;
    className?: string;
}

export function ClinicalDatePicker({
    value,
    onChange,
    label,
    mode = 'clinical',
    required = false,
    className
}: ClinicalDatePickerProps) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
        if (!value) return null;
        const d = parseISO(value);
        return isValid(d) ? d : null;
    });

    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [openUpwards, setOpenUpwards] = useState(false);
    const [viewDate, setViewDate] = useState(() => selectedDate || new Date());
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const containerRef = useMemo(() => ({ current: null as HTMLDivElement | null }), []);
    const calendarRef = useMemo(() => ({ current: null as HTMLDivElement | null }), []);

    // Intelligent positioning logic
    const updatePosition = () => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            // Prefer downward unless space is very tight below AND better above
            const shouldOpenUp = spaceBelow < 420 && spaceAbove > spaceBelow;
            setOpenUpwards(shouldOpenUp);

            setCoords({
                top: rect.top,
                left: Math.max(10, Math.min(rect.left, window.innerWidth - 330)), // horizontal clamp
                width: rect.width
            });
        }
    };

    useEffect(() => {
        if (isCalendarOpen) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isCalendarOpen]);

    useEffect(() => {
        if (value) {
            const d = parseISO(value);
            if (isValid(d)) setSelectedDate(d);
        } else {
            setSelectedDate(null);
        }
    }, [value]);

    const handleDateChange = (date: Date) => {
        setSelectedDate(date);
        onChange(format(date, 'yyyy-MM-dd'));
        setIsCalendarOpen(false);
    };

    // Demographic Mode (DOB) - 3 Segmented Selects
    if (mode === 'demographic') {
        const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 110 }, (_, i) => (currentYear - i).toString());

        const dayValue = selectedDate ? format(selectedDate, 'dd') : '';
        const monthValue = selectedDate ? format(selectedDate, 'MM') : '';
        const yearValue = selectedDate ? format(selectedDate, 'yyyy') : '';

        const updateSegment = (segment: 'd' | 'm' | 'y', val: string) => {
            const d = dayValue || '01';
            const m = monthValue || '01';
            const y = yearValue || currentYear.toString();

            let newDateStr = '';
            if (segment === 'd') newDateStr = `${y}-${m}-${val.padStart(2, '0')}`;
            if (segment === 'm') newDateStr = `${y}-${val.padStart(2, '0')}-${d}`;
            if (segment === 'y') newDateStr = `${val}-${m}-${d}`;

            const nextDate = parseISO(newDateStr);
            if (isValid(nextDate)) {
                handleDateChange(nextDate);
            }
        };

        return (
            <div className={cn("space-y-1.5", className)}>
                {label && <label className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">{label}</label>}
                <div className="flex gap-2">
                    <select
                        value={dayValue}
                        onChange={(e) => updateSegment('d', e.target.value)}
                        className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer appearance-none text-center"
                    >
                        <option value="">Day</option>
                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select
                        value={monthValue}
                        onChange={(e) => updateSegment('m', e.target.value)}
                        className="flex-[2] px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer appearance-none px-4"
                    >
                        <option value="">Month</option>
                        {months.map((m, i) => <option key={m} value={(i + 1).toString().padStart(2, '0')}>{m}</option>)}
                    </select>
                    <select
                        value={yearValue}
                        onChange={(e) => updateSegment('y', e.target.value)}
                        className="flex-[1.5] px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer appearance-none px-4"
                    >
                        <option value="">Year</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>
        );
    }

    // Standard Mode - Enhanced Calendar with Jump-to-Year/Month
    return (
        <div
            className="relative"
        >
            {label && <label className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1 mb-1.5 block font-fira-code">{label}</label>}
            <div
                ref={(el) => { if (el) containerRef.current = el; }}
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className={cn(
                    "group relative flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-all",
                    isCalendarOpen ? "ring-2 ring-primary/20 border-primary" : "hover:border-primary/50 shadow-sm shadow-slate-200/50",
                    className
                )}
            >
                <div className="flex items-center gap-3">
                    <CalendarIcon size={14} className="text-slate-400 group-hover:text-primary transition-colors" />
                    <span className="font-fira-sans">{selectedDate ? format(selectedDate, 'PPP') : 'Select Date...'}</span>
                </div>
                {selectedDate && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setSelectedDate(null); onChange(''); }}
                        className="p-1 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            {isCalendarOpen && typeof document !== 'undefined' && createPortal(
                <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setIsCalendarOpen(false)} />
                    <div
                        ref={(el) => { if (el) calendarRef.current = el; }}
                        className={cn(
                            "fixed p-4 bg-white border border-slate-100 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[9999] w-80 animate-in fade-in zoom-in-95 duration-200 font-fira-sans",
                            openUpwards ? "slide-in-from-bottom-2" : "slide-in-from-top-2"
                        )}
                        style={{
                            top: (() => {
                                const height = 380; // Standard calendar height
                                if (openUpwards) {
                                    return Math.max(10, coords.top - height - 12);
                                }
                                return Math.min(window.innerHeight - height - 10, coords.top + 45);
                            })(),
                            left: coords.left
                        }}
                    >
                        <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
                            <div className="flex gap-2">
                                <select
                                    value={getMonth(viewDate)}
                                    onChange={(e) => setViewDate(setMonth(viewDate, parseInt(e.target.value)))}
                                    className="text-[11px] font-black uppercase tracking-widest bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer text-slate-900 shadow-sm hover:border-primary/30 transition-all font-fira-code"
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i} value={i}>{format(new Date(2024, i, 1), 'MMMM')}</option>
                                    ))}
                                </select>
                                <select
                                    value={getYear(viewDate)}
                                    onChange={(e) => setViewDate(setYear(viewDate, parseInt(e.target.value)))}
                                    className="text-[11px] font-black uppercase tracking-widest bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer text-slate-900 shadow-sm hover:border-primary/30 transition-all font-fira-code"
                                >
                                    {Array.from({ length: 130 }, (_, i) => {
                                        const year = getYear(new Date()) + 10 - i;
                                        return <option key={year} value={year}>{year}</option>;
                                    })}
                                </select>
                            </div>
                            <div className="flex gap-1.5">
                                <button onClick={() => setViewDate(addDays(startOfMonth(viewDate), -1))} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors border border-transparent hover:border-slate-200"><ChevronLeft size={16} /></button>
                                <button onClick={() => setViewDate(addDays(addDays(startOfMonth(viewDate), getDaysInMonth(viewDate)), 0))} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors border border-transparent hover:border-slate-200"><ChevronRight size={16} /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                <div key={d} className="text-[9px] font-black text-slate-300 uppercase text-center py-1">{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {(() => {
                                const start = startOfWeek(startOfMonth(viewDate));
                                return Array.from({ length: 42 }, (_, i) => {
                                    const date = addDays(start, i);
                                    const isCurrentMonth = getMonth(date) === getMonth(viewDate);
                                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => handleDateChange(date)}
                                            className={cn(
                                                "aspect-square flex items-center justify-center text-[10px] font-bold rounded-lg transition-all",
                                                !isCurrentMonth && "text-slate-200",
                                                isCurrentMonth && "text-slate-600 hover:bg-slate-100",
                                                isSelected && "bg-primary text-white hover:bg-primary shadow-lg shadow-primary/20 scale-110"
                                            )}
                                        >
                                            {format(date, 'd')}
                                        </button>
                                    );
                                });
                            })()}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between">
                            <button
                                onClick={() => handleDateChange(new Date())}
                                className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline"
                            >
                                Select Today
                            </button>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
}
