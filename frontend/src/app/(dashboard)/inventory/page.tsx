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
    Thermometer,
    RefreshCw,
    Shield,
    BarChart3,
    ChevronRight
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { coreApi as api } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import { ClinicalDatePicker } from '@/components/shared/ClinicalDatePicker';
import { ErrorBoundary } from '@/components/shared/error-boundary';

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
            label: 'Total Items',
            value: inventoryStats?.totalItems || 0,
            sub: 'In Stock',
            icon: Package,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50'
        },
        {
            label: 'Warehouses',
            value: inventoryStats?.warehousesCount || 0,
            sub: 'Storage Locations',
            icon: Warehouse,
            color: 'text-cyan-500',
            bg: 'bg-cyan-50'
        },
        {
            label: 'Low Stock',
            value: inventoryStats?.lowStockCount || 0,
            sub: 'Restock Soon',
            icon: AlertTriangle,
            color: 'text-rose-500',
            bg: 'bg-rose-50'
        },
        {
            label: 'Expiring Soon',
            value: inventoryStats?.expiringSoonCount || 0,
            sub: 'Safety Check',
            icon: Thermometer,
            color: 'text-amber-500',
            bg: 'bg-amber-50'
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
        <div className="p-4 lg:p-5 space-y-4 max-w-[1700px] mx-auto min-h-screen bg-cyan-50/50 animate-in fade-in duration-700 font-fira-sans">
            {/* Ambient Ocean Breeze Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-100/40 rounded-full blur-[160px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-cyan-100/40 rounded-full blur-[140px]"></div>
            </div>

            {/* Premium Header Architecture */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-600 to-cyan-700 p-0.5 shadow-lg shadow-emerald-500/20 group hover:rotate-3 transition-transform duration-500">
                        <div className="w-full h-full bg-emerald-900 rounded-[11px] flex items-center justify-center">
                            <Package className="h-6 w-6 text-emerald-100 group-hover:scale-110 transition-transform" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter leading-none">Inventory Management</h1>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-[0.2em] rounded-full border border-emerald-200 font-fira-code">System Active</span>
                        </div>
                        <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-[0.2em] font-fira-code flex items-center gap-1.5">
                            <Shield size={9} className="text-emerald-500" /> Manage medical supplies and stock levels
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2 mr-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-lg bg-white border-2 border-cyan-50 flex items-center justify-center shadow-md overflow-hidden">
                                <div className="w-full h-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-[8px] font-fira-code">A{i}</div>
                            </div>
                        ))}
                    </div>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-emerald-100 rounded-xl hover:bg-emerald-50 transition-all font-black text-[8.5px] uppercase tracking-widest text-slate-600 shadow-md shadow-emerald-500/5 active:scale-95 cursor-pointer font-fira-code">
                        <Filter size={12} />
                        Filter
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:opacity-95 transition-all font-black shadow-lg shadow-emerald-500/30 text-[9px] uppercase tracking-[0.2em] active:scale-95 cursor-pointer font-fira-code group"
                    >
                        <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                        Add New Item
                    </button>
                </div>
            </div>

            {/* Premium Stat Architecture */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                {stats.map((stat) => (
                    <div key={stat.label} className="group relative bg-white/70 backdrop-blur-2xl p-6 rounded-3xl border border-emerald-100/50 shadow-lg shadow-emerald-500/5 hover:border-emerald-300 transition-all duration-500 overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn("p-3 rounded-xl shadow-inner transition-transform group-hover:scale-110 duration-500", stat.bg)}>
                                    <stat.icon className={stat.color} size={22} />
                                </div>
                                <div className="p-1 rounded-full text-slate-200 group-hover:text-emerald-500 transition-colors">
                                    <ArrowUpRight size={16} />
                                </div>
                            </div>
                            <div>
                                <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-[0.2em] font-fira-code mb-0.5">{stat.label}</p>
                                <div className="flex items-baseline gap-1.5">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tighter font-fira-sans tabular-nums leading-none">{stat.value}</h3>
                                    <span className="text-[7.5px] font-black text-slate-300 uppercase tracking-widest font-fira-code">{stat.sub}</span>
                                </div>
                            </div>
                        </div>
                        {/* Decorative Background Glow */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-emerald-100/60 transition-colors duration-500"></div>
                    </div>
                ))}
            </div>

            {/* High-Fidelity Interaction Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex p-1 bg-emerald-100/30 backdrop-blur-md rounded-lg border border-emerald-100/40 shadow-inner w-fit">
                    {['overview', 'warehouses', 'movements', 'history'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-5 py-2 text-[8.5px] font-black uppercase tracking-[0.15em] transition-all relative cursor-pointer font-fira-code rounded-md",
                                activeTab === tab
                                    ? "text-emerald-900 bg-white shadow-sm"
                                    : "text-slate-400 hover:text-emerald-600 hover:bg-white/40"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="relative group w-full md:w-[400px]">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-900/20 group-focus-within:text-emerald-600 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="SEARCH ITEMS (NAME OR SKU)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all w-full shadow-md shadow-emerald-500/5 font-fira-code h-[36px]"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Main Registry Flow */}
                <div className="xl:col-span-8 space-y-6 relative z-10">
                    <div className="bg-white/60 backdrop-blur-2xl rounded-2xl border border-emerald-100 shadow-xl shadow-emerald-500/5 overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
                        <div className="p-4 px-6 border-b border-emerald-50 bg-emerald-50/20 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-emerald-100">
                                    <Layers size={18} className="text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">Current Inventory</h3>
                                    <p className="text-[8px] font-black text-emerald-600/60 uppercase tracking-widest font-fira-code mt-0.5">List of all medical supplies</p>
                                </div>
                            </div>
                            <button className="h-9 w-9 bg-white rounded-xl border border-emerald-100 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-300 transition-all shadow-sm active:rotate-180 duration-500 cursor-pointer">
                                <RefreshCw size={16} />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-400 text-[8.5px] font-black uppercase tracking-[0.2em] font-fira-code">
                                        <th className="px-5 py-3">Item Name / SKU</th>
                                        <th className="px-4 py-3">Storage Locations</th>
                                        <th className="px-4 py-3 text-center">Total Quantity</th>
                                        <th className="px-4 py-3">Expiry Info</th>
                                        <th className="px-5 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-50 font-medium">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-10 py-32 text-center">
                                                <div className="flex flex-col items-center gap-6">
                                                    <div className="h-12 w-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                                                    <p className="text-[10px] font-black text-emerald-900/30 uppercase tracking-[0.3em] font-fira-code">Loading Inventory List...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredItems?.map((item: any) => (
                                        <tr
                                            key={item.id}
                                            onClick={() => { setSelectedItem(item); setShowMovementModal(true); }}
                                            className="hover:bg-emerald-50/50 transition-all duration-300 cursor-pointer group"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="font-black text-slate-900 text-[13px] tracking-tight group-hover:text-emerald-600 transition-colors font-fira-sans leading-tight">{item.name}</div>
                                                <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-0.5 opacity-70 font-fira-code">{item.sku}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {item.stocks?.map((s: any) => (
                                                        <span key={s.id} className="px-1.5 py-0.5 bg-white border border-emerald-100 rounded text-[7.5px] font-black uppercase tracking-widest text-emerald-600 shadow-sm font-fira-code">
                                                            {s.warehouse.code}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="text-base font-black text-slate-900 font-fira-code tracking-tighter leading-none">
                                                    {item.stocks?.reduce((acc: number, s: any) => acc + s.quantity, 0)}
                                                    <span className="text-[8px] text-slate-300 ml-1 font-black uppercase tracking-widest">Units</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Calendar size={11} className="opacity-60 text-emerald-500" />
                                                    <span className="text-[9px] font-black font-fira-code uppercase tracking-tight">
                                                        {item.stocks?.[0]?.expiry_date ? formatDate(item.stocks[0].expiry_date) : 'NO EXPIRY'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
                                                    <span className="text-[8px] font-black uppercase tracking-[0.1em] text-emerald-600 font-fira-code">Sync OK</span>
                                                </div>
                                                    <ChevronRight size={14} className="text-slate-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Lateral Intelligence Corridor */}
                <div className="xl:col-span-4 space-y-6 relative z-10 animate-in slide-in-from-right-12 duration-1000">
                    <div className="bg-white/60 backdrop-blur-xl p-5 rounded-2xl border border-emerald-100 shadow-lg shadow-emerald-500/5">
                        <h3 className="text-[9px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em] font-fira-code flex items-center gap-2.5 px-1">
                            <Zap size={12} className="text-emerald-500 animate-pulse" /> Alerts & Insights
                        </h3>
                        <div className="space-y-4">
                            {inventoryStats?.data?.alerts?.map((alert: any, i: number) => (
                                <div key={i} className={cn(
                                    "p-4 rounded-2xl border flex gap-4 transition-all cursor-pointer hover:border-emerald-300 group duration-300",
                                    alert.type === 'error' ? "bg-rose-50/50 border-rose-100" : "bg-amber-50/50 border-amber-100"
                                )}>
                                    <div className={cn(
                                        "h-2.5 w-2.5 rounded-full mt-1 shrink-0",
                                        alert.type === 'error' ? "bg-rose-500" : "bg-amber-500"
                                    )}></div>
                                    <div>
                                        <div className="text-xs font-black text-slate-900 uppercase tracking-tight font-fira-sans leading-none">{alert.name}</div>
                                        <div className="text-[9px] text-slate-400 mt-1.5 font-black font-fira-code uppercase tracking-widest leading-relaxed opacity-60">{alert.issue}</div>
                                    </div>
                                </div>
                            ))}
                            {(!inventoryStats?.data?.alerts || inventoryStats?.data?.alerts?.length === 0) && (
                                <div className="p-8 text-center border-2 border-dashed border-emerald-50 rounded-2xl bg-emerald-50/20">
                                    <Shield size={24} className="text-emerald-100 mx-auto mb-3" />
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] font-fira-code">All Systems Normal</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="group bg-emerald-900 p-8 rounded-[40px] text-white shadow-2xl shadow-emerald-900/40 relative overflow-hidden transition-all duration-700 hover:scale-[1.02]">
                        <div className="absolute -right-16 -top-16 w-56 h-56 bg-emerald-400/20 rounded-full blur-[80px] group-hover:scale-125 transition-transform duration-1000"></div>
                        <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-cyan-400/10 rounded-full blur-[60px]"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-1.5 px-1">
                                <Container size={22} className="text-emerald-400" />
                                <h3 className="text-[11px] font-black text-emerald-100 uppercase tracking-[0.2em] font-fira-code">Warehouse Capacity</h3>
                            </div>
                            <p className="text-4xl font-black mb-6 tracking-tighter font-fira-sans px-1">84<span className="text-lg text-emerald-400 ml-1">%</span></p>

                            <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden border border-white/5 p-0.5 mb-8 shadow-inner">
                                <div className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-400 h-full w-[84%] rounded-full shadow-[0_0_15px_rgba(52,211,153,0.4)]"></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    <p className="text-[8px] font-black uppercase text-emerald-400/60 tracking-widest font-fira-code">Stock Status</p>
                                    <p className="text-base font-black mt-1 font-fira-sans tracking-tight">Optimal</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    <p className="text-[8px] font-black uppercase text-emerald-400/60 tracking-widest font-fira-code">Weekly Change</p>
                                    <p className="text-base font-black mt-1 font-fira-sans tracking-tight text-emerald-400">+12.4%</p>
                                </div>
                            </div>

                            <button className="mt-8 w-full py-4 bg-emerald-100 text-emerald-900 hover:bg-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 cursor-pointer font-fira-code">
                                View Detailed Report
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
        <div className="fixed inset-0 bg-emerald-900/10 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-500">
            <div className="bg-white/90 backdrop-blur-2xl w-full max-w-xl rounded-2xl shadow-2xl border border-emerald-100/50 animate-in zoom-in-95 duration-500 relative overflow-hidden">
                <div className="p-5 border-b border-emerald-50 bg-emerald-50/30 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-black tracking-tighter text-slate-900 uppercase font-fira-sans">Add New Item</h2>
                        <p className="text-[8px] text-emerald-600 font-black uppercase tracking-[0.2em] mt-0.5 font-fira-code">Register a new medical item</p>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-emerald-100 text-slate-400 hover:text-rose-500 transition-all text-xl shadow-sm active:scale-95 cursor-pointer">×</button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 font-fira-sans">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 font-fira-code">Item Name</label>
                            <input {...register('name', { required: true })} className="w-full bg-slate-50 border border-emerald-50 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-emerald-100/50 transition-all font-black text-slate-700 outline-none text-xs placeholder:text-slate-300 shadow-inner" placeholder="e.g. Paracetamol" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 font-fira-code">Item SKU</label>
                            <input {...register('sku', { required: true })} className="w-full bg-slate-50 border border-emerald-50 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-emerald-100/50 transition-all font-black text-slate-700 outline-none font-fira-code text-xs placeholder:text-slate-300 shadow-inner" placeholder="PAR-500-MG" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 font-fira-code">Classification</label>
                            <select {...register('category')} className="w-full bg-slate-50 border border-emerald-50 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-emerald-100/50 transition-all font-black text-slate-700 outline-none appearance-none shadow-inner text-xs cursor-pointer">
                                <option value="PHARMACY">Medicines</option>
                                <option value="CONSUMABLE">Consumables</option>
                                <option value="EQUIPMENT">Equipment</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 font-fira-code">HSN Global Code</label>
                            <input {...register('hsn_code')} className="w-full bg-slate-50 border border-emerald-50 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-emerald-100/50 transition-all font-black text-slate-700 outline-none text-xs placeholder:text-slate-300 shadow-inner font-fira-code" placeholder="300490" />
                        </div>
                    </div>
                    <button disabled={isLoading} className="w-full py-3 bg-emerald-900 text-white rounded-xl font-black uppercase tracking-[0.3em] shadow-lg shadow-emerald-900/20 hover:bg-emerald-800 transition-all active:scale-95 disabled:opacity-50 text-[9px] font-fira-code">
                        {isLoading ? 'Saving Item...' : 'Save to Inventory'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function RecordMovementModal({ item, warehouses, onClose, onSubmit, isLoading }: any) {
    const { register, handleSubmit, control } = useForm({
        defaultValues: {
            itemId: item.id,
            type: 'IN',
            quantity: 1,
            unitCost: item.unit_cost || 0,
            sellingPrice: item.selling_price || 0,
            batchNumber: '',
            expiryDate: null
        }
    });

    return (
        <div className="fixed inset-0 bg-emerald-900/10 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-500">
            <div className="bg-white/90 backdrop-blur-2xl w-full max-w-xl rounded-2xl shadow-2xl border border-emerald-100/50 animate-in zoom-in-95 duration-500 relative overflow-hidden">
                <div className="p-5 border-b border-emerald-50 bg-emerald-50/30 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-black tracking-tighter text-slate-900 uppercase font-fira-sans">Stock Movement</h2>
                        <p className="text-[8px] text-emerald-600 font-black uppercase tracking-[0.2em] mt-0.5 font-fira-code">Update Stock: {item.name}</p>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-emerald-100 text-slate-400 hover:text-rose-500 transition-all text-xs shadow-sm active:scale-95 cursor-pointer">×</button>
                </div>
                <form 
                    onSubmit={handleSubmit((data) => {
                        const payload = {
                            itemId: item.id,
                            type: data.type,
                            quantity: Number(data.quantity),
                            toWarehouseId: data.toWarehouseId,
                            batchNumber: data.batchNumber,
                            unitCost: Number(data.unitCost || 0),
                            sellingPrice: Number(data.sellingPrice || 0),
                            expiryDate: data.expiryDate
                        };
                        onSubmit(payload);
                    })} 
                    className="p-5 space-y-4 font-fira-sans"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 font-fira-code">Movement Type</label>
                            <select {...register('type')} className="w-full bg-slate-50 border border-emerald-50 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-100 transition-all font-black text-slate-700 outline-none appearance-none shadow-inner text-[10px] cursor-pointer h-[36px]">
                                <option value="IN">Stock In (Restock)</option>
                                <option value="OUT">Stock Out (Usage)</option>
                                <option value="ADJUSTMENT">Adjustment</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 font-fira-code">Target Warehouse</label>
                            <select {...register('toWarehouseId')} className="w-full bg-slate-50 border border-emerald-50 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-100 transition-all font-black text-slate-700 outline-none appearance-none shadow-inner text-[10px] cursor-pointer h-[36px]">
                                {warehouses?.map((w: any) => (
                                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 font-fira-code">Batch Number</label>
                            <input {...register('batchNumber', { required: true })} className="w-full bg-slate-50 border border-emerald-50 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-100 transition-all font-black text-slate-700 outline-none text-[10px] placeholder:text-slate-300 shadow-inner font-fira-code h-[36px]" placeholder="BN-2024-001" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 font-fira-code">Quantity</label>
                            <input type="number" {...register('quantity', { required: true })} className="w-full bg-slate-50 border border-emerald-50 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-100 transition-all font-black text-slate-700 outline-none text-[10px] shadow-inner font-fira-code h-[36px]" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 font-fira-code">Unit Cost ($)</label>
                            <input type="number" step="0.01" {...register('unitCost')} className="w-full bg-slate-50 border border-emerald-50 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-100 transition-all font-black text-slate-700 outline-none text-[10px] shadow-inner font-fira-code h-[36px]" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 font-fira-code">Selling Price ($)</label>
                            <input type="number" step="0.01" {...register('sellingPrice')} className="w-full bg-slate-50 border border-emerald-50 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-100 transition-all font-black text-slate-700 outline-none text-[10px] shadow-inner font-fira-code h-[36px]" />
                        </div>
                        <div className="space-y-2">
                            <Controller
                                control={control}
                                name="expiryDate"
                                render={({ field }) => (
                                    <ClinicalDatePicker
                                        label="Expiry Date"
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                        </div>
                    </div>
                    <button disabled={isLoading} className="w-full py-3 bg-emerald-900 text-white rounded-xl font-black uppercase tracking-[0.3em] shadow-lg shadow-emerald-900/20 hover:bg-emerald-800 transition-all active:scale-95 disabled:opacity-50 text-[9px] font-fira-code">
                        {isLoading ? 'Processing...' : 'Save Stock Movement'}
                    </button>
                </form>
            </div>
        </div>
    );
}
