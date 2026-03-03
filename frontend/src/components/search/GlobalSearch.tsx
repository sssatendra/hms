'use client';

import * as React from 'react';
import { Command } from 'cmdk';
import {
    Search, User, Package, Building2,
    Settings, LayoutDashboard, Microscope,
    Activity, ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { coreApi } from '@/lib/api';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

export function GlobalSearch() {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [results, setResults] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);
    const debouncedSearch = useDebounce(search, 300);
    const router = useRouter();

    // Toggle the menu when ⌘K is pressed
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    React.useEffect(() => {
        if (!debouncedSearch || debouncedSearch.length < 2) {
            setResults([]);
            return;
        }

        const performSearch = async () => {
            setLoading(true);
            try {
                const res = await coreApi.get<any[]>(`/search?q=${encodeURIComponent(debouncedSearch)}`);
                setResults(res.data || []);
            } catch (error) {
                console.error('Search failed', error);
            } finally {
                setLoading(false);
            }
        };

        performSearch();
    }, [debouncedSearch]);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Global Command Menu"
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4 sm:p-6"
        >
            <div className="absolute inset-0 bg-background/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setOpen(false)} />

            <div className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 font-fira-sans ring-1 ring-primary/10">
                <div className="flex items-center border-b border-border px-6 py-5 gap-4">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <Search className="h-5 w-5 text-primary" />
                    </div>
                    <Command.Input
                        autoFocus
                        placeholder="Search patients, inventory, or navigate..."
                        className="flex-1 bg-transparent border-none outline-none text-base font-black text-foreground placeholder:text-muted-foreground placeholder:font-black uppercase tracking-widest font-fira-code"
                        value={search}
                        onValueChange={setSearch}
                    />
                    {loading && <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                    <div className="px-2 py-1 bg-muted border border-border rounded-lg text-[10px] font-black text-muted-foreground uppercase tracking-widest font-fira-code">ESC</div>
                </div>

                <Command.List className="max-h-[60vh] overflow-y-auto p-3 scrollbar-hide space-y-4">
                    <Command.Empty className="py-20 text-center animate-pulse">
                        <div className="h-16 w-16 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-border">
                            <Search className="h-7 w-7 text-muted-foreground/30" />
                        </div>
                        <p className="text-xs font-black text-muted-foreground/40 uppercase tracking-[0.3em] font-fira-code">Matrix Unresponsive: No matches found</p>
                    </Command.Empty>

                    {results.length > 0 && (
                        <Command.Group heading={<span className="px-3 py-1 text-[10px] font-black text-primary uppercase tracking-[0.2em] font-fira-code ml-1 mb-2 inline-block">Investigation Matches</span>}>
                            {results.map((item) => (
                                <Command.Item
                                    key={item.id}
                                    onSelect={() => runCommand(() => router.push(item.url))}
                                    className="flex items-center justify-between px-4 py-4 rounded-2xl hover:bg-muted/50 aria-selected:bg-primary/10 group cursor-pointer transition-all border border-transparent aria-selected:border-primary/20 mb-1"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-11 h-11 rounded-xl flex items-center justify-center shadow-lg border-2",
                                            item.type === 'PATIENT' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                                item.type === 'PHARMACY' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                    "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                        )}>
                                            {item.type === 'PATIENT' ? <User size={20} /> :
                                                item.type === 'PHARMACY' ? <Package size={20} /> : <Building2 size={20} />}
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-black text-foreground tracking-tight leading-none mb-1.5 uppercase font-fira-sans">{item.title}</p>
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest font-fira-code opacity-60">{item.type} • {item.subtitle}</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={16} className="text-primary opacity-0 group-aria-selected:opacity-100 group-aria-selected:translate-x-1 transition-all" />
                                </Command.Item>
                            ))}
                        </Command.Group>
                    )}

                    <Command.Separator className="h-px bg-border/50 my-4" />

                    <Command.Group heading={<span className="px-3 py-1 text-[10px] font-black text-primary uppercase tracking-[0.2em] font-fira-code ml-1 mb-2 inline-block">System Navigation Hub</span>}>
                        {[
                            { label: 'Dashboard', icon: LayoutDashboard, url: '/dashboard', shortcut: 'D' },
                            { label: 'Patients', icon: User, url: '/patients', shortcut: 'P' },
                            { label: 'Ward Management', icon: Building2, url: '/wards', shortcut: 'W' },
                            { label: 'Laboratory', icon: Microscope, url: '/lab', shortcut: 'L' },
                            { label: 'Staff Availability', icon: Activity, url: '/staff-availability', shortcut: 'S' },
                            { label: 'Settings', icon: Settings, url: '/settings', shortcut: 'O' },
                        ].map((nav) => (
                            <Command.Item
                                key={nav.url}
                                onSelect={() => runCommand(() => router.push(nav.url))}
                                className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-muted/50 aria-selected:bg-primary/5 group cursor-pointer transition-all border border-transparent aria-selected:border-primary/10 mb-0.5"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground group-aria-selected:text-primary group-aria-selected:bg-primary/10 transition-colors">
                                        <nav.icon size={16} />
                                    </div>
                                    <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest group-aria-selected:text-foreground font-fira-code">{nav.label}</span>
                                </div>
                                <div className="px-2 py-0.5 bg-muted border border-border rounded-md text-[9px] font-black text-muted-foreground uppercase tracking-widest font-fira-code">{nav.shortcut}</div>
                            </Command.Item>
                        ))}
                    </Command.Group>
                </Command.List>

                <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/20">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 grayscale-0">
                            <div className="px-2 py-0.5 bg-card border border-border rounded text-[9px] font-black shadow-sm font-fira-code leading-none">↑↓</div>
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest opacity-60">NAVIGATE</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="px-2 py-0.5 bg-card border border-border rounded text-[9px] font-black shadow-sm font-fira-code">ENTER</div>
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest opacity-60">SELECT</span>
                        </div>
                    </div>
                    <div className="text-[9px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                        <Activity size={10} className="animate-pulse" />
                        MedOrbit Einstein Predictive Search
                    </div>
                </div>
            </div>
        </Command.Dialog>
    );
}
