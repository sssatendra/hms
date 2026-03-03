'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Clock, Trash2, Filter, Search, Loader2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { coreApi as api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    status: string;
    read_at: string | null;
    created_at: string;
}

export default function NotificationsPage() {
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/users/notifications', {
                params: { unread_only: filter === 'UNREAD' }
            });
            setNotifications(res.data);
        } catch (err) {
            toast.error('Failed to load notifications');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [filter]);

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/users/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'READ', read_at: new Date().toISOString() } : n));
        } catch (err) {
            toast.error('Action failed');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-[1200px] mx-auto p-4 lg:p-6 font-fira-sans">
            {/* Minimalist Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-teal-600 rounded-3xl flex items-center justify-center shadow-xl shadow-teal-600/20">
                        <Bell className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">Notifications</h1>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-fira-code">System Broadcast & Alerts</p>
                    </div>
                </div>

                <div className="flex bg-muted p-1.5 rounded-2xl border border-border">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            filter === 'ALL' ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Total Activity
                    </button>
                    <button
                        onClick={() => setFilter('UNREAD')}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            filter === 'UNREAD' ? "bg-card text-primary shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Unread Only
                    </button>
                </div>
            </div>

            {/* Notification List Container */}
            <div className="bg-card rounded-[40px] border border-border shadow-2xl shadow-black/5 overflow-hidden min-h-[500px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[500px]">
                        <Loader2 className="h-10 w-10 text-teal-600 animate-spin mb-4" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-fira-code">Syncing Stream...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[500px] opacity-20">
                        <Bell className="h-24 w-24 mb-6" />
                        <h3 className="text-xl font-black uppercase">No New Alerts</h3>
                        <p className="text-[10px] font-black font-fira-code tracking-widest">Environment is Secure</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={cn(
                                    "p-8 transition-all duration-500 flex items-start gap-8 group relative",
                                    n.status === 'PENDING' ? "bg-primary/5" : "hover:bg-muted/30"
                                )}
                            >
                                {n.status === 'PENDING' && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-teal-600 rounded-r-full" />
                                )}

                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm shrink-0 transition-transform group-hover:scale-105",
                                    n.status === 'PENDING' ? "bg-card border-primary/20 text-primary" : "bg-muted/50 border-border text-muted-foreground"
                                )}>
                                    <Bell className="h-5 w-5" />
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className={cn(
                                                "text-sm font-black uppercase tracking-tight",
                                                n.status === 'PENDING' ? "text-foreground" : "text-muted-foreground"
                                            )}>
                                                {n.title}
                                            </h3>
                                            <span className="px-2 py-0.5 bg-muted text-[8px] font-black text-muted-foreground rounded uppercase tracking-tighter border border-border">
                                                {n.type}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest font-fira-code">
                                            <Clock className="h-3 w-3" />
                                            {formatDistanceToNow(new Date(n.created_at))} ago
                                        </div>
                                    </div>
                                    <p className={cn(
                                        "text-[11px] leading-relaxed max-w-2xl mb-4",
                                        n.status === 'PENDING' ? "text-foreground/80 font-medium" : "text-muted-foreground"
                                    )}>
                                        {n.message}
                                    </p>

                                    {n.status === 'PENDING' && (
                                        <button
                                            onClick={() => markAsRead(n.id)}
                                            className="flex items-center gap-2 text-[9px] font-black text-teal-600 uppercase tracking-widest group/btn"
                                        >
                                            Mark as Complete
                                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
