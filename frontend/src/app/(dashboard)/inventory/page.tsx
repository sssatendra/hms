'use client';

import React, { useState } from 'react';
import {
    Package,
    Warehouse,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    Plus,
    Filter,
    Activity,
    Calendar,
    Layers,
    Container,
    Boxes,
    RefreshCcw,
    Zap,
    Thermometer
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { coreApi as api } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function InventoryDashboard() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showMovementModal, setShowMovementModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    // Fetch Inventory Data
    const { data: items, isLoading } = useQuery({
        queryKey: ['inventory', 'items'],
        queryFn: async () => {
            const res = await api.get('/inventory/items');
            return res.data || [];
        }
    });

    const { data: inventoryStats } = useQuery({
        queryKey: ['inventory', 'stats'],
        queryFn: async () => {
            const res = await api.get('/inventory/stats');
            return res.data;
        }
    });

    const { data: warehouses } = useQuery({
        queryKey: ['inventory', 'warehouses'],
        queryFn: async () => {
            const res = await api.get('/inventory/warehouses');
            return res.data || [];
        }
    });

    const filteredItems = items?.filter((item: any) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = [
        {
            label: 'Total Stocked Items',
            value: inventoryStats?.totalItems || 0,
            change: '+0',
            icon: Package,
            color: 'text-primary',
            bg: 'bg-primary/5'
        },
        {
            label: 'Active Warehouses',
            value: inventoryStats?.warehousesCount || 0,
            change: '+1',
            icon: Warehouse,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/5'
        },
        {
            label: 'Low Stock SKU',
            value: inventoryStats?.lowStockCount || 0,
            change: 'Alert',
            icon: AlertTriangle,
            color: 'text-rose-500',
            bg: 'bg-rose-500/5'
        },
        {
            label: 'Expiring Soon',
            value: inventoryStats?.expiringSoonCount || 0,
            change: '30d',
            icon: Thermometer,
            color: 'text-amber-500',
            bg: 'bg-amber-500/5'
        },
    ];

    const createItemMutation = useMutation({
        mutationFn: (data) => api.post('/inventory/items', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', 'items'] });
            setShowCreateModal(false);
        }
    });

    const movementMutation = useMutation({
        mutationFn: (data: any) => api.post('/inventory/movements', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', 'items'] });
            setShowMovementModal(false);
        },
        onError: (err: any) => alert(err.response?.data?.message || 'Movement failed')
    });

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen bg-background/50 animate-in fade-in duration-700">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-accent/5 rounded-full blur-[100px]"></div>
            </div>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter flex items-center gap-3">
                        <Package className="h-10 w-10 text-primary" />
                        Unified Inventory
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">Precision Stock Intelligence & Warehouse Coordination</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-card/80 backdrop-blur-md border border-border rounded-2xl hover:bg-card transition-all font-bold text-sm shadow-sm active:scale-95 cursor-pointer">
                        <Filter size={18} className="text-muted-foreground" />
                        Advanced Filter
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-2xl hover:opacity-90 transition-all font-bold shadow-xl shadow-primary/20 text-sm active:scale-95 cursor-pointer"
                    >
                        <Plus size={18} />
                        Initialize Asset
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="group relative bg-card/60 backdrop-blur-xl p-6 rounded-3xl border border-border shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn("p-4 rounded-2xl transition-all group-hover:scale-110", stat.bg)}>
                                <stat.icon className={stat.color} size={28} />
                            </div>
                            <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-600">
                                <ArrowUpRight size={16} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                            <h3 className="text-3xl font-black text-foreground mt-2 font-mono tabular-nums">{stat.value}</h3>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                ))}
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/60">
                <div className="flex gap-1">
                    {['overview', 'warehouses', 'movements', 'history'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-6 py-4 text-sm font-bold capitalize transition-all relative cursor-pointer",
                                activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-t-2xl"
                            )}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-full animate-in slide-in-from-bottom-1" />
                            )}
                        </button>
                    ))}
                </div>
                <div className="relative group mb-2 md:mb-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search Intelligence Matrix..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-6 py-3 bg-card/60 backdrop-blur-md border border-border rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all w-full md:w-80 font-medium"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Main List */}
                <div className="xl:col-span-8 space-y-6">
                    <div className="bg-card/40 backdrop-blur-md rounded-[32px] border border-border shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                        <div className="p-6 border-b border-border/60 bg-muted/20 flex items-center justify-between">
                            <h3 className="font-black text-foreground flex items-center gap-2 uppercase tracking-tighter text-lg">
                                <Layers size={22} className="text-primary" /> Active Inventory Assets
                            </h3>
                            <button className="p-2 hover:bg-muted rounded-xl transition-all cursor-pointer">
                                <RefreshCcw size={18} className="text-muted-foreground" />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-muted/30 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                                        <th className="px-8 py-5">Global Identifier</th>
                                        <th className="px-8 py-5">Logistics Hub</th>
                                        <th className="px-8 py-5">Current Volume</th>
                                        <th className="px-8 py-5">Lifecycle</th>
                                        <th className="px-8 py-5">Verification</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40 font-medium">
                                    {isLoading ? (
                                        <tr><td colSpan={5} className="px-8 py-20 text-center text-muted-foreground animate-pulse font-bold tracking-widest underline decoration-wavy decoration-primary">SYNCHRONIZING GLOBAL DATA...</td></tr>
                                    ) : filteredItems?.map((item: any) => (
                                        <tr
                                            key={item.id}
                                            onClick={() => { setSelectedItem(item); setShowMovementModal(true); }}
                                            className="hover:bg-primary/[0.02] transition-colors cursor-pointer group"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="font-black text-foreground text-sm group-hover:text-primary transition-colors">{item.name}</div>
                                                <div className="text-[10px] text-muted-foreground font-mono mt-1 opacity-70 tracking-tighter">{item.sku}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-wrap gap-2">
                                                    {item.stocks?.map((s: any) => (
                                                        <span key={s.id} className="px-3 py-1 bg-white/10 dark:bg-black/20 backdrop-blur-md border border-border rounded-lg text-[9px] font-black uppercase tracking-tighter text-muted-foreground">
                                                            {s.warehouse.code}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-base font-black text-foreground font-mono">
                                                    {item.stocks?.reduce((acc: number, s: any) => acc + s.quantity, 0)}
                                                    <span className="text-[10px] text-muted-foreground ml-1 font-sans font-bold">UNITS</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-amber-500" />
                                                    {item.stocks?.[0]?.expiry_date ? new Date(item.stocks[0].expiry_date).toLocaleDateString() : 'INDETERMINATE'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Verified Stock</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Alerts / Warehouses */}
                <div className="xl:col-span-4 space-y-8 animate-in slide-in-from-right-4 duration-700">
                    <div className="bg-card/60 backdrop-blur-xl p-6 rounded-[32px] border border-border shadow-sm">
                        <h3 className="font-black text-foreground mb-6 uppercase tracking-widest text-xs flex items-center gap-2">
                            <Zap size={16} className="text-primary" /> Optimization Alerts
                        </h3>
                        <div className="space-y-4">
                            {inventoryStats?.data?.alerts?.map((alert: any, i: number) => (
                                <div key={i} className={cn(
                                    "p-4 rounded-2xl border flex gap-3 transition-all cursor-pointer hover:scale-[1.02]",
                                    alert.type === 'error' ? "bg-rose-500/5 border-rose-500/20" : "bg-amber-500/5 border-amber-500/20"
                                )}>
                                    <div className={cn(
                                        "h-2 w-2 rounded-full mt-1.5 shrink-0",
                                        alert.type === 'error' ? "bg-rose-500" : "bg-amber-500"
                                    )}></div>
                                    <div>
                                        <div className="text-xs font-black text-foreground uppercase tracking-tight">{alert.name}</div>
                                        <div className="text-[10px] text-muted-foreground mt-1 font-medium">{alert.issue}</div>
                                    </div>
                                </div>
                            ))}
                            {(!inventoryStats?.data?.alerts || inventoryStats?.data?.alerts?.length === 0) && (
                                <div className="p-8 text-center text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-30 italic">
                                    All systems nominal. No stock anomalies detected.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="group bg-primary p-10 rounded-[40px] text-primary-foreground shadow-2xl relative overflow-hidden transition-all duration-500 hover:shadow-primary/40">
                        <div className="absolute -right-16 -top-16 w-48 h-48 bg-accent/20 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-background/5 rounded-full blur-[60px]"></div>

                        <div className="relative z-10">
                            <h3 className="font-black text-accent mb-2 flex items-center gap-3 text-lg uppercase tracking-widest">
                                <Container size={24} /> Central Store Alpha
                            </h3>
                            <p className="text-4xl font-black mb-6 font-mono tracking-tighter">84% Capacity</p>

                            <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden border border-white/5 p-0.5">
                                <div className="bg-gradient-to-r from-accent to-amber-300 h-full w-[84%] rounded-full shadow-[0_0_15px_rgba(202,138,4,0.6)] animate-pulse"></div>
                            </div>

                            <div className="mt-8 grid grid-cols-2 gap-4">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Utilization</p>
                                    <p className="text-lg font-black mt-1">Optimal</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Efficiency</p>
                                    <p className="text-lg font-black mt-1">+12.4%</p>
                                </div>
                            </div>

                            <button className="mt-8 w-full py-4 bg-accent text-accent-foreground hover:bg-white hover:text-primary rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 cursor-pointer">
                                Audit Logistics Hub
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showCreateModal && (
                <CreateItemModal
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={(data) => createItemMutation.mutate(data)}
                    isLoading={createItemMutation.isPending}
                />
            )}

            {showMovementModal && selectedItem && (
                <RecordMovementModal
                    item={selectedItem}
                    warehouses={warehouses}
                    onClose={() => setShowMovementModal(false)}
                    onSubmit={(data) => movementMutation.mutate(data)}
                    isLoading={movementMutation.isPending}
                />
            )}
        </div>
    );
}

function CreateItemModal({ onClose, onSubmit, isLoading }: any) {
    const { register, handleSubmit } = useForm();
    return (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-border animate-in zoom-in-95 duration-300 relative">
                <div className="p-8 border-b border-border bg-muted/20 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter text-foreground uppercase">Initialize Asset</h2>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Deploy New Clinical Infrastructure Item</p>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-2xl hover:bg-muted transition-all text-2xl border border-border shadow-sm">×</button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Asset Name</label>
                            <input {...register('name', { required: true })} className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 transition-all font-bold outline-none" placeholder="e.g. Paracetamol" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">SKU / Identifier</label>
                            <input {...register('sku', { required: true })} className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 transition-all font-bold outline-none font-mono" placeholder="PAR-500-MG" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Category</label>
                            <select {...register('category')} className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 transition-all font-bold outline-none">
                                <option value="PHARMACY">Pharmacy Stock</option>
                                <option value="CONSUMABLE">General Consumables</option>
                                <option value="EQUIPMENT">Medical Equipment</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">HSN Code</label>
                            <input {...register('hsn_code')} className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 transition-all font-bold outline-none" placeholder="300490" />
                        </div>
                    </div>
                    <button disabled={isLoading} className="w-full py-5 bg-primary text-primary-foreground rounded-[24px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50">
                        {isLoading ? 'Processing...' : 'Commit to Registry'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function RecordMovementModal({ item, warehouses, onClose, onSubmit, isLoading }: any) {
    const { register, handleSubmit } = useForm({
        defaultValues: {
            itemId: item.id,
            type: 'IN',
            quantity: 1
        }
    });

    return (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-border animate-in zoom-in-95 duration-300 relative">
                <div className="p-8 border-b border-border bg-muted/20 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter text-foreground uppercase">Logistics Movement</h2>
                        <p className="text-[10px] text-accent font-black uppercase tracking-widest mt-1">Adjusting Stock: {item.name}</p>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-2xl hover:bg-muted transition-all text-2xl border border-border shadow-sm">×</button>
                </div>
                <form onSubmit={handleSubmit((data) => onSubmit({ ...data, quantity: Number(data.quantity), unitCost: Number(data.unitCost || 0) }))} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Movement Type</label>
                            <select {...register('type')} className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 transition-all font-bold outline-none">
                                <option value="IN">Stock Intake (IN)</option>
                                <option value="OUT">Stock Release (OUT)</option>
                                <option value="ADJUSTMENT">Inventory Adjustment</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Destination Warehouse</label>
                            <select {...register('toWarehouseId')} className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 transition-all font-bold outline-none">
                                {warehouses?.map((w: any) => (
                                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Batch Number</label>
                            <input {...register('batchNumber', { required: true })} className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 transition-all font-bold outline-none" placeholder="BN-2024-001" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Quantity</label>
                            <input type="number" {...register('quantity', { required: true })} className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 transition-all font-bold outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Unit Cost (₹)</label>
                            <input type="number" step="0.01" {...register('unitCost')} className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 transition-all font-bold outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Expiry Date</label>
                            <input type="date" {...register('expiryDate')} className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 transition-all font-bold outline-none" />
                        </div>
                    </div>
                    <button disabled={isLoading} className="w-full py-5 bg-accent text-accent-foreground rounded-[24px] font-black uppercase tracking-[0.2em] shadow-xl shadow-accent/20 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50">
                        {isLoading ? 'Processing...' : 'Authorize Movement'}
                    </button>
                </form>
            </div>
        </div>
    );
}
