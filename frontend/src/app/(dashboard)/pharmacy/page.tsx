'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Pill, AlertTriangle, Clock, Package,
  Search, Plus, TrendingDown, Filter, CreditCard, LogOut,
  Shield, Activity, Zap, ChevronRight, BarChart3, Database,
  ArrowUpRight, ShoppingCart, CheckCircle2, X,
  RefreshCw,
  Trash2,
  User
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { formatDate, getStatusColor, cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/use-currency';
import { SkeletonTable } from '@/components/shared/skeleton';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { useForm, Controller } from 'react-hook-form';
import { ClinicalDatePicker } from '@/components/shared/ClinicalDatePicker';
import { toast } from 'sonner';

function PharmacyPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tab, setTab] = useState<'inventory' | 'expiring' | 'low-stock'>('inventory');
  const [page, setPage] = useState(1);
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [showOTCSaleModal, setShowOTCSaleModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const queryClient = useQueryClient();
  const { format: currencyFormat } = useCurrency();

  const { data: stats } = useQuery({
    queryKey: ['pharmacy', 'stats'],
    queryFn: () => coreApi.get<any>('/pharmacy/stats'),
  });

  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['pharmacy', 'inventory', page, search, statusFilter, tab],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(tab === 'expiring' && { expiring_soon: 'true' }),
        ...(tab === 'low-stock' && { status: 'LOW_STOCK' }),
      });
      return coreApi.get<any[]>(`/pharmacy/inventory?${params}`);
    },
  });

  const inventory = inventoryData?.data || [];
  const meta = inventoryData?.meta;

  const statCards = [
    { label: 'Total Medicines', value: stats?.data?.totalItems ?? '0', icon: Database, color: 'text-white', gradient: 'from-[#0891B2] to-[#0E7490]', sub: 'Active Items' },
    { label: 'Low Stock', value: stats?.data?.lowStock ?? '0', icon: TrendingDown, color: 'text-white', gradient: 'from-[#B45309] to-[#92400E]', sub: 'Restock Soon' },
    { label: 'Out of Stock', value: stats?.data?.outOfStock ?? '0', icon: AlertTriangle, color: 'text-white', gradient: 'from-[#BE123C] to-[#9F1239]', sub: 'Zero Units' },
    { label: 'Expiring Soon', value: stats?.data?.expiringSoon ?? '0', icon: Clock, color: 'text-white', gradient: 'from-[#047857] to-[#065F46]', sub: 'Safety Check' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-[1700px] mx-auto p-4 lg:p-6 font-fira-sans">
      {/* Ocean Breeze Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#064E3B] to-[#059669] p-6 lg:p-7 rounded-2xl shadow-xl shadow-emerald-900/20 text-white">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="px-2 py-0.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[7.5px] font-black uppercase tracking-[0.2em] font-fira-code">Pharmacy Inventory</div>
              <div className="flex items-center gap-1.5 text-[7px] font-black uppercase tracking-widest text-emerald-200/60 font-fira-code">
                <Shield size={9} />
                System Active
              </div>
            </div>
            <h1 className="text-xl lg:text-2xl font-black tracking-tighter leading-none font-fira-sans">
              Pharmacy <span className="text-emerald-100/60 font-fira-code">Management</span>
            </h1>
            <p className="text-emerald-50/70 text-[9px] font-black uppercase tracking-widest mt-2 max-w-sm font-fira-code">Manage drugs, stock levels, and prescriptions</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setShowOTCSaleModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-white/20 transition-all font-fira-code active:scale-95 cursor-pointer"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              New Sale (OTC)
            </button>
            <button
              onClick={() => setShowDispenseModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-emerald-900 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg hover:opacity-95 active:scale-95 transition-all group font-fira-code cursor-pointer"
            >
              <Pill className="h-3.5 w-3.5 group-hover:rotate-12 transition-transform" />
              Give Medicine (Rx)
            </button>
            <button
              onClick={() => setShowAddItemModal(true)}
              className="h-10 w-10 flex items-center justify-center bg-emerald-400 text-white rounded-xl shadow-lg hover:bg-emerald-300 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[10%] w-64 h-64 bg-emerald-400/20 rounded-full blur-[80px]" />
      </div>

      {/* "Liquid Stat Cards" */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className={cn(
            "group relative p-5 rounded-2xl shadow-lg shadow-emerald-900/5 transition-all duration-500 overflow-hidden border border-white/10 bg-gradient-to-br",
            stat.gradient
          )}>
            <div className="relative z-10 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/20 group-hover:scale-110 transition-transform duration-500">
                  <stat.icon size={18} />
                </div>
                <div className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40 font-fira-code">{stat.sub}</div>
              </div>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60 mb-1.5 font-fira-code">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tighter font-fira-sans leading-none">{stat.value}</span>
                <span className="text-[7.5px] font-black opacity-30 uppercase font-fira-code tracking-widest">Units</span>
              </div>
            </div>
            {/* Decorative Glass Reflection */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/10 transition-colors duration-500"></div>
          </div>
        ))}
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-emerald-100 shadow-xl shadow-emerald-500/5 overflow-hidden">
        {/* Navigation & Search Hub */}
        <div className="flex flex-col md:flex-row items-stretch border-b border-emerald-100 bg-emerald-50/20 px-1 py-1">
          <div className="flex p-1 gap-1 flex-wrap sm:flex-nowrap">
            {[
              { key: 'inventory', label: 'All Medicines', icon: Database },
              { key: 'low-stock', label: 'Low Stock', icon: TrendingDown },
              { key: 'expiring', label: 'Expiring Soon', icon: Clock },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key as any); setPage(1); }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-[8.5px] font-black uppercase tracking-widest transition-all rounded-xl font-fira-code active:scale-95 cursor-pointer',
                  tab === t.key
                    ? 'bg-white text-emerald-900 shadow-lg shadow-emerald-500/5 border border-emerald-50'
                    : 'text-slate-400 hover:text-emerald-600 hover:bg-white/30'
                )}
              >
                <t.icon size={11} className={tab === t.key ? "text-emerald-500" : "opacity-40"} />
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 flex items-center px-3 gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-900/30 group-focus-within:text-emerald-600 transition-colors" />
              <input
                type="text"
                placeholder="SEARCH MEDICINES (NAME, SKU, BATCH)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-50 transition-all outline-none h-[34px] font-fira-code shadow-sm"
              />
            </div>
            <div className="hidden lg:flex items-center gap-2.5 px-1">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-[8px] font-black uppercase tracking-widest text-emerald-900/40 outline-none cursor-pointer font-fira-code hover:text-emerald-600 transition-colors"
              >
                <option value="">Status: All</option>
                <option value="ACTIVE">Active</option>
                <option value="LOW_STOCK">Alert</option>
                <option value="OUT_OF_STOCK">Depleted</option>
              </select>
              <div className="w-0.5 h-3 bg-emerald-100" />
              <button className="text-[8px] font-black uppercase tracking-widest text-emerald-900/40 hover:text-emerald-600 font-fira-code flex items-center gap-1.5 active:scale-95 cursor-pointer">
                <Filter size={11} />
                Sort
              </button>
            </div>
          </div>
        </div>

        {/* Content Matrix */}
        <div className="p-6 lg:p-8">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-[9px] font-black text-emerald-900/30 uppercase tracking-[0.3em] font-fira-code">Syncing Medicine Inventory...</p>
            </div>
          ) : inventory.length === 0 ? (
            <div className="text-center py-24">
              <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner group transition-transform hover:scale-110">
                <Pill className="h-8 w-8 text-emerald-200 group-hover:rotate-12 transition-transform" />
              </div>
              <h3 className="text-xl font-black text-emerald-900/20 uppercase tracking-[0.4em]">Inventory Is Empty</h3>
              <p className="text-xs font-medium text-emerald-900/30 mt-3 max-w-sm mx-auto font-fira-sans">No medicine records found in the system.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-emerald-100 bg-white shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-50/50 border-b border-emerald-100">
                    <th className="px-4 py-3 text-[10px] font-black text-emerald-900/60 uppercase tracking-widest font-fira-code w-[30%]">Medicine Name</th>
                    <th className="px-4 py-3 text-[10px] font-black text-emerald-900/60 uppercase tracking-widest font-fira-code w-[15%]">Codes (SKU/Batch)</th>
                    <th className="px-4 py-3 text-[10px] font-black text-emerald-900/60 uppercase tracking-widest font-fira-code w-[10%] text-center">Form</th>
                    <th className="px-4 py-3 text-[10px] font-black text-emerald-900/60 uppercase tracking-widest font-fira-code w-[15%] text-center">Current Stock</th>
                    <th className="px-4 py-3 text-[10px] font-black text-emerald-900/60 uppercase tracking-widest font-fira-code w-[15%]">Expiry Date</th>
                    <th className="px-4 py-3 text-[10px] font-black text-emerald-900/60 uppercase tracking-widest font-fira-code w-[10%]">Price Info</th>
                    <th className="px-4 py-3 text-[10px] font-black text-emerald-900/60 uppercase tracking-widest font-fira-code text-right w-[5%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {inventory.map((item: any) => (
                    <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors group">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                            <Pill size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-black text-slate-900 font-fira-sans tracking-tight uppercase leading-none mb-1 truncate">{item.drug_name}</p>
                            {item.generic_name && (
                              <p className="text-[7.5px] font-black text-emerald-600/40 uppercase tracking-widest font-fira-code truncate">{item.generic_name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="text-[9px] font-black text-slate-700 tracking-widest uppercase font-fira-code">{item.sku}</p>
                        <p className="text-[7.5px] font-black text-slate-300 mt-1 uppercase tracking-tighter font-fira-code">Batch: {item.batch_number}</p>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="text-[7.5px] font-black px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md border border-slate-100 uppercase tracking-widest font-fira-code">{item.category}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex flex-col items-center">
                          <span className={cn(
                            'text-sm font-black font-fira-sans tracking-tighter tabular-nums leading-none',
                            item.total_quantity === 0 ? 'text-rose-600' :
                              item.total_quantity <= item.reorder_level ? 'text-amber-600' : 'text-slate-900'
                          )}>
                            {item.total_quantity || 0}
                          </span>
                          <span className="text-[7.5px] font-black text-slate-300 uppercase font-fira-code tracking-widest mt-1">/ {item.reorder_level} Limit</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Clock size={10} className={cn(
                            new Date(item.expiry_date) < new Date() ? 'text-rose-500' : 'text-emerald-500/40'
                          )} />
                          <span className={cn(
                            'text-[9px] font-black tracking-widest uppercase font-fira-code',
                            new Date(item.expiry_date) < new Date() ? 'text-rose-600' :
                              new Date(item.expiry_date) < new Date(Date.now() + 30 * 86400000) ? 'text-amber-600' :
                                'text-slate-500'
                          )}>
                            {formatDate(item.expiry_date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="text-[10px] font-black text-emerald-600 tabular-nums font-fira-code">{currencyFormat(item.selling_price)}</p>
                        <p className="text-[7.5px] font-black text-slate-300 uppercase tracking-tighter font-fira-code">Acq: {currencyFormat(item.unit_cost)}</p>
                      </td>
                      <td className="px-4 py-2.5 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedItem(item); setShowAddStockModal(true); }}
                          className="h-7 px-2.5 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center gap-1.5 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer text-[8px] font-black uppercase tracking-widest font-fira-code"
                        >
                          <Plus size={12} />
                          Stock
                        </button>
                        <button
                          onClick={() => {
                            toast.info(`Detail view for ${item.drug_name} coming soon!`);
                          }}
                          className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm active:scale-95 cursor-pointer"
                        >
                          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Global Pagination */}
        {meta?.totalPages && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-5 border-t border-emerald-100 bg-emerald-50/20">
            <div className="flex items-center gap-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] font-fira-code">
              <span className="px-2 py-0.5 bg-white border border-emerald-100 rounded-lg text-emerald-600 shadow-sm">{page}</span>
              <span>of</span>
              <span>{meta.totalPages} Pages</span>
              <div className="w-1 h-1 rounded-full bg-emerald-200" />
              <span>{meta.total} Medicines</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-6 py-2 text-[9px] font-black bg-white text-slate-400 border border-emerald-100 rounded-xl disabled:opacity-40 hover:text-emerald-600 hover:shadow-lg transition-all uppercase tracking-widest font-fira-code shadow-sm"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(Math.min(meta.totalPages || 0, page + 1))}
                disabled={page === meta.totalPages}
                className="px-6 py-2 text-[9px] font-black bg-white text-slate-400 border border-emerald-100 rounded-xl disabled:opacity-40 hover:text-emerald-600 hover:shadow-lg transition-all uppercase tracking-widest font-fira-code shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showDispenseModal && (
        <DispenseModal onClose={() => setShowDispenseModal(false)} />
      )}

      {showOTCSaleModal && (
        <OTCSaleModal
          onClose={() => setShowOTCSaleModal(false)}
          inventory={inventory}
        />
      )}

      {showAddItemModal && (
        <AddItemModal onClose={() => setShowAddItemModal(false)} />
      )}

      {showAddStockModal && selectedItem && (
        <ReceiveStockModal
          item={selectedItem}
          onClose={() => { setShowAddStockModal(false); setSelectedItem(null); }}
        />
      )}
    </div>
  );
}

// Internal Modals with Ocean Breeze redesign
function OTCSaleModal({ onClose, inventory }: { onClose: () => void, inventory: any[] }) {
  const [patientId, setPatientId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [items, setItems] = useState<{ inventory_item_id: string, drug_name: string, quantity: number, price: number }[]>([]);
  const queryClient = useQueryClient();
  const { format: currencyFormat } = useCurrency();

  const { data: patients } = useQuery({ queryKey: ['patients'], queryFn: async () => (await coreApi.get<any[]>('/patients')).data });

  const saleMutation = useMutation({
    mutationFn: (data: any) => coreApi.post('/pharmacy/sale', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy'] });
      toast.success("Transaction localized and registry updated.");
      onClose();
    },
  });

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const addItem = (invItem: any) => {
    if (items.some(i => i.inventory_item_id === invItem.id)) return;
    setItems([...items, {
      inventory_item_id: invItem.id,
      drug_name: invItem.drug_name,
      quantity: 1,
      price: Number(invItem.selling_price)
    }]);
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.inventory_item_id !== id));
  const updateQty = (id: string, qty: number) => {
    setItems(items.map(i => i.inventory_item_id === id ? { ...i, quantity: qty } : i));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#064E3B]/40 backdrop-blur-md" onClick={onClose} />
      <div className="bg-white/95 backdrop-blur-2xl w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-emerald-100 animate-in zoom-in-95 duration-300 font-fira-sans">
        <div className="bg-emerald-50/30 border-b border-emerald-50 px-5 py-3 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center shadow-sm">
              <ShoppingCart className="h-4.5 w-4.5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tighter uppercase text-slate-900 leading-none">New Medicine Sale</h2>
              <p className="text-[7.5px] text-emerald-600 font-black uppercase tracking-widest mt-1 font-fira-code">Sell medicine over the counter</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-emerald-50 transition-all text-xs border border-emerald-100 shadow-sm active:scale-95 cursor-pointer">×</button>
        </div>

        <div className="p-4 overflow-hidden flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 bg-slate-50/10">
          <div className="lg:col-span-6 flex flex-col gap-3 overflow-hidden">
            <div className="flex items-center gap-2 ml-1">
              <Database size={11} className="text-emerald-500" />
              <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] font-fira-code">Select Medicine</h3>
            </div>
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-900/30 group-focus-within:text-emerald-600 transition-colors" />
              <input
                type="text"
                placeholder="SEARCH FOR MEDICINE..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-emerald-100 rounded-xl text-[9px] font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-50 outline-none transition-all shadow-sm font-fira-code h-[36px]"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {inventory.filter(i => i.stock_quantity > 0).map(item => (
                <div key={item.id} className="p-3 bg-white border border-emerald-50 rounded-xl flex justify-between items-center hover:border-emerald-200 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50">
                      <Pill size={14} />
                    </div>
                    <div>
                      <p className="text-[10.5px] font-black text-slate-900 font-fira-sans tracking-tight uppercase leading-none mb-1">{item.drug_name}</p>
                      <p className="text-[7.5px] text-emerald-600 font-black font-fira-code tracking-widest uppercase">{item.batch_number} • {item.stock_quantity} units</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black text-emerald-700 leading-none mb-1.5 font-fira-code">{currencyFormat(item.selling_price)}</p>
                    <button
                      onClick={() => addItem(item)}
                      className="text-[7.5px] font-black uppercase tracking-widest py-1.5 px-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-fira-code active:scale-95 cursor-pointer"
                    >
                      Add to List
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 bg-white border border-emerald-100 rounded-2xl p-5 flex flex-col shadow-sm overflow-hidden">
            <div className="mb-5 space-y-4">
              <div className="flex items-center gap-2 ml-1">
                <User size={11} className="text-emerald-500" />
                <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] font-fira-code">Customer Info</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-emerald-50/20 p-3.5 rounded-xl border border-emerald-50">
                <div className="col-span-2">
                  <label className="block text-[7.5px] font-black uppercase text-emerald-600 mb-1 tracking-widest font-fira-code ml-1">Customer Type</label>
                  <select
                    value={patientId ? 'patient' : 'guest'}
                    onChange={(e) => {
                      if (e.target.value === 'guest') setPatientId('');
                      else if (patients && patients.length > 0) setPatientId(patients[0].id);
                    }}
                    className="w-full px-3 py-2 bg-white border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-2 focus:ring-emerald-50 transition-all font-fira-code h-[36px]"
                  >
                    <option value="guest">Temporal Guest Mode</option>
                    <option value="patient">Registered Entity Link</option>
                  </select>
                </div>

                {patientId ? (
                  <div className="col-span-2">
                    <label className="block text-[7.5px] font-black uppercase text-emerald-600 mb-1 tracking-widest font-fira-code ml-1">Select Patient</label>
                    <select
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-[9px] font-black tracking-widest uppercase text-emerald-900 appearance-none outline-none focus:ring-2 focus:ring-emerald-50 font-fira-code h-[36px]"
                    >
                      {patients?.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.mrn})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-[7.5px] font-black uppercase text-slate-400 mb-1 tracking-widest font-fira-code ml-1">Guest Name</label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="IDENTIFIER..."
                        className="w-full px-3 py-2 bg-white border border-emerald-100 rounded-lg text-[9px] font-black uppercase outline-none focus:ring-2 focus:ring-emerald-50 transition-all font-fira-code h-[36px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[7.5px) font-black uppercase text-slate-400 mb-1 tracking-widest font-fira-code ml-1">Phone Number</label>
                      <input
                        type="text"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="PHONE..."
                        className="w-full px-3 py-2 bg-white border border-emerald-100 rounded-lg text-[9px] font-black outline-none focus:ring-2 focus:ring-emerald-50 transition-all font-fira-code h-[36px]"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mb-5 pr-1 custom-scrollbar">
              <p className="text-[7.5px] font-black uppercase text-slate-400 tracking-[0.2em] font-fira-code ml-1">Items to Sell</p>
              {items.length === 0 && (
                <div className="py-8 flex flex-col items-center justify-center border border-dashed border-emerald-100 rounded-2xl opacity-40">
                  <ShoppingCart size={16} className="text-slate-200 mb-2" />
                  <p className="text-[8px] font-black uppercase tracking-widest font-fira-code">No items added</p>
                </div>
              )}
              {items.map(item => (
                <div key={item.inventory_item_id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center group/cart hover:bg-white transition-all shadow-sm">
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-900 font-fira-sans tracking-tight uppercase leading-none mb-1">{item.drug_name}</p>
                    <p className="text-[7.5px] text-emerald-600 font-black font-fira-code tracking-widest uppercase">{currencyFormat(item.price)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={item.quantity}
                      min="1"
                      onChange={(e) => updateQty(item.inventory_item_id, parseInt(e.target.value))}
                      className="w-11 px-1 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-center focus:ring-2 focus:ring-emerald-50 outline-none font-fira-code tabular-nums"
                    />
                    <button onClick={() => removeItem(item.inventory_item_id)} className="w-7 h-7 rounded-lg bg-rose-50 text-rose-400 hover:text-rose-600 border border-rose-100 transition-all flex items-center justify-center active:scale-95">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-emerald-50 mt-auto">
              <div className="flex justify-between items-end mb-5">
                <div>
                  <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest font-fira-code block mb-0.5 ml-0.5">Total Amount</span>
                  <span className="text-[6.5px] font-black text-emerald-600 uppercase tracking-[0.2em] font-fira-code px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100">Safe Transaction</span>
                </div>
                <span className="text-2xl font-black text-emerald-900 tracking-tighter font-fira-sans tabular-nums">{currencyFormat(subtotal)}</span>
              </div>
              <button
                onClick={() => saleMutation.mutate({
                  patient_id: patientId || undefined,
                  guest_name: !patientId ? guestName : undefined,
                  guest_phone: !patientId ? guestPhone : undefined,
                  items: items.map(i => ({ inventory_item_id: i.inventory_item_id, quantity: i.quantity }))
                })}
                disabled={items.length === 0 || saleMutation.isPending}
                className="w-full py-3.5 bg-emerald-900 text-white rounded-xl font-black text-[9.5px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-900/10 hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 font-fira-code"
              >
                {saleMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                Process Sale
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DispenseModal({ onClose }: { onClose: () => void }) {
  const [rxSearch, setRxSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: prescriptionsData, isLoading } = useQuery({
    queryKey: ['prescriptions', 'search', rxSearch],
    queryFn: () => coreApi.get<any[]>(`/emr/prescriptions?status=ACTIVE&search=${rxSearch}`),
    enabled: rxSearch.length > 2,
  });

  const dispenseMutation = useMutation({
    mutationFn: (data: any) => coreApi.post('/pharmacy/dispense', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy'] });
      toast.success("Prescription fulfilled and registry updated.");
      onClose();
    },
  });

  const prescriptions = prescriptionsData?.data || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#064E3B]/40 backdrop-blur-md" onClick={onClose} />
      <div className="bg-white/95 backdrop-blur-2xl w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-emerald-100 animate-in zoom-in-95 duration-300 font-fira-sans">
        <div className="bg-emerald-50/30 border-b border-emerald-50 px-5 py-3.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center shadow-sm">
              <Pill className="h-4.5 w-4.5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tighter uppercase text-slate-900 leading-none">Give Medicine (Rx)</h2>
              <p className="text-[7.5px] text-emerald-600 font-black uppercase tracking-widest mt-1 font-fira-code">Process doctor's prescriptions</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-emerald-50 transition-all text-xs border border-emerald-100 shadow-sm active:scale-95 cursor-pointer">×</button>
        </div>

        <div className="p-5 space-y-5 bg-slate-50/10 overflow-y-auto custom-scrollbar">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-900/30 group-focus-within:text-emerald-600 transition-colors" />
            <input
              type="text"
              autoFocus
              value={rxSearch}
              onChange={(e) => setRxSearch(e.target.value)}
              placeholder="SEARCH PRESCRIPTIONS (NAME, MRN OR ID)..."
              className="w-full pl-12 pr-6 py-2.5 bg-white border border-emerald-100 rounded-xl text-[9px] font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-50 outline-none transition-all shadow-sm font-fira-code h-[40px]"
            />
            {isLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-500" />
              </div>
            )}
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="py-10 flex flex-col items-center justify-center gap-2 opacity-30">
                <BarChart3 size={24} className="animate-pulse" />
                <p className="text-[8px] font-black uppercase tracking-[0.2em] font-fira-code">Searching Records...</p>
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="py-12 border border-dashed border-emerald-100 rounded-2xl flex flex-col items-center justify-center text-center px-10 bg-white">
                <Clock className="h-8 w-8 text-emerald-100 mb-3 animate-pulse" />
                <p className="text-base font-black text-slate-900 tracking-tight font-fira-sans leading-none uppercase">{rxSearch.length > 2 ? 'No prescriptions found' : 'Start typing to search'}</p>
                <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest mt-2 font-fira-code">Verify patient identity before giving medicine</p>
              </div>
            ) : (
              prescriptions.map((rx: any) => (
                <div key={rx.id} className="group p-5 bg-white border border-emerald-50 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all duration-300 overflow-hidden relative">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-5 relative z-10">
                    <div className="flex gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                        <span className="text-[6.5px] font-black text-emerald-400 group-hover:text-emerald-200 uppercase leading-none mb-0.5 font-fira-code">Agent</span>
                        <span className="text-[9px] font-black tracking-widest font-fira-code">#{rx.id.slice(-4).toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-black text-slate-900 tracking-tighter font-fira-sans uppercase leading-none">{rx.patient?.first_name} {rx.patient?.last_name}</p>
                          <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 text-[7px] font-black uppercase rounded text-slate-400 tracking-widest font-fira-code">{rx.patient?.mrn}</span>
                        </div>
                        <p className="text-[7.5px] text-emerald-600 font-black mt-1 uppercase tracking-widest font-fira-code">Authorized by Dr. {rx.doctor?.last_name || 'Registry'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const dispenseData = {
                          prescription_id: rx.id,
                          items: rx.items.map((item: any) => ({
                            prescription_item_id: item.id,
                            inventory_item_id: item.inventory_item_id,
                            quantity: item.quantity_prescribed
                          }))
                        };
                        dispenseMutation.mutate(dispenseData);
                      }}
                      disabled={dispenseMutation.isPending}
                      className="px-6 py-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-emerald-700 disabled:opacity-50 shadow-xl shadow-emerald-500/10 active:scale-95 transition-all font-fira-code group/btn flex items-center gap-2.5"
                    >
                      {dispenseMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-200" /> : <Zap size={12} className="text-emerald-200 group-hover/btn:animate-bounce" />}
                      Complete Dispense
                    </button>
                  </div>
                  <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 divide-y divide-slate-100 relative z-10">
                    {rx.items.map((item: any) => (
                      <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-white border border-emerald-100 flex items-center justify-center shadow-sm">
                            <Pill className="h-4 w-4 text-emerald-600/40" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 font-fira-sans tracking-tight">{item.drug_name}</p>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.1em] font-fira-code mt-0.5">{item.dosage} • {item.frequency} • {item.duration}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-baseline gap-1 text-emerald-600">
                            <span className="text-xl font-black font-fira-sans tracking-tighter">{item.quantity_prescribed}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest font-fira-code opacity-60 ml-0.5">Units</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-emerald-400/10 transition-colors" />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-6 bg-white border-t border-emerald-50 flex justify-end gap-4 items-center">
          <div className="flex items-center gap-2.5 opacity-30 mr-auto">
            <Shield size={14} className="text-emerald-500" />
            <span className="text-[8.5px] font-black uppercase tracking-[0.2em] font-fira-code">Secure Link Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-all font-fira-code"
          >
            Abandon Fulfillment
          </button>
        </div>
      </div>
    </div>
  );
}

function AddItemModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, control } = useForm();
  const { currency: currencyCode } = useCurrency();

  const addMutation = useMutation({
    mutationFn: (data: any) => coreApi.post('/pharmacy/inventory', {
      ...data,
      stock_quantity: Number(data.stock_quantity),
      unit_cost: Number(data.unit_cost),
      selling_price: Number(data.selling_price),
      reorder_level: Number(data.reorder_level),
      controlled_drug: data.controlled_drug === 'true',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy'] });
      toast.success("New medicine added to inventory.");
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#064E3B]/40 backdrop-blur-md" onClick={onClose} />
      <div className="bg-white/95 backdrop-blur-2xl w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-emerald-100 animate-in zoom-in-95 duration-300 font-fira-sans">
        <div className="bg-emerald-50/30 border-b border-emerald-50 px-5 py-3.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center shadow-sm">
              <Package className="h-4.5 w-4.5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tighter uppercase text-slate-900 leading-none">Add New Medicine</h2>
              <p className="text-[7.5px] text-emerald-600 font-black uppercase tracking-widest mt-1 font-fira-code">Register a new drug into inventory</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-emerald-50 transition-all text-xs border border-emerald-100 shadow-sm active:scale-95 cursor-pointer">×</button>
        </div>

        <form onSubmit={handleSubmit((data) => addMutation.mutate(data))} className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/10 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[8px] font-black uppercase tracking-widest text-emerald-600 mb-1.5 ml-1 font-fira-code">Medicine Name</label>
              <input {...register('drug_name', { required: true })} className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-lg text-[10px] font-black uppercase focus:ring-2 focus:ring-emerald-50 outline-none transition-all font-fira-code h-[36px]" placeholder="E.G. PARACETAMOL 500MG" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1 font-fira-code">Generic Name</label>
              <input {...register('generic_name')} className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-lg text-[10px] font-black uppercase focus:ring-2 focus:ring-emerald-50 outline-none transition-all font-fira-code opacity-60 h-[36px]" placeholder="E.G. PARACETAMOL" />
            </div>
            <div className="group">
              <label className="block text-[8px] font-black uppercase tracking-widest text-emerald-600 mb-1.5 ml-1 font-fira-code ">Item SKU / Code</label>
              <input {...register('sku', { required: true })} className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-lg text-[10px] font-black font-fira-code uppercase tracking-widest outline-none focus:ring-2 focus:ring-emerald-50 h-[36px]" placeholder="PH-XYZ-123" />
            </div>
            <div className="group">
              <label className="block text-[8px] font-black uppercase tracking-widest text-emerald-600 mb-1.5 ml-1 font-fira-code">Batch Number</label>
              <input {...register('batch_number', { required: true })} className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-lg text-[10px] font-black font-fira-code uppercase tracking-widest outline-none focus:ring-2 focus:ring-emerald-50 h-[36px]" placeholder="BAT-XX-001" />
            </div>
            <div>
              <label className="block text-[8px] font-black uppercase tracking-widest text-emerald-600 mb-1 ml-1 font-fira-code">Form Category</label>
              <select {...register('category', { required: true })} className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-widest font-fira-code appearance-none outline-none focus:ring-2 focus:ring-emerald-50 transition-all h-[36px]">
                <option value="TABLET">Tablet / Solid</option>
                <option value="SYRUP">Syrup / Liquid</option>
                <option value="INJECTION">Injection / Vial</option>
                <option value="CAPSULE">Capsule</option>
                <option value="OINTMENT">Ointment / Topical</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <Controller
                control={control}
                name="expiry_date"
                rules={{ required: true }}
                render={({ field }) => (
                  <ClinicalDatePicker
                    label="Expiry Date"
                    value={field.value}
                    onChange={field.onChange}
                    className="h-[36px] rounded-lg px-3 bg-white border-emerald-100 shadow-sm font-fira-code text-[10px]"
                  />
                )}
              />
            </div>
            <div className="group">
              <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1 font-fira-code">Initial Stock</label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-300" />
                <input type="number" {...register('stock_quantity', { required: true })} className="w-full pl-9 pr-4 py-2 bg-white border border-emerald-100 rounded-lg text-[10px] font-black focus:ring-2 focus:ring-emerald-50 outline-none font-fira-code h-[36px]" />
              </div>
            </div>
            <div className="group">
              <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1 font-fira-code">Reorder Threshold</label>
              <input type="number" {...register('reorder_level')} defaultValue={10} className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-lg text-[10px] font-black outline-none focus:ring-2 focus:ring-emerald-50 font-fira-code h-[36px]" />
            </div>
            <div className="group">
              <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1 font-fira-code font-bold">Unit Cost ({currencyCode})</label>
              <input type="number" step="0.01" {...register('unit_cost', { required: true })} className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-lg text-[10px] font-black focus:ring-2 focus:ring-emerald-50 outline-none font-fira-code h-[36px]" />
            </div>
            <div className="group">
              <label className="block text-[8px] font-black uppercase tracking-widest text-emerald-600 mb-1.5 ml-1 font-fira-code font-bold">Selling Price ({currencyCode})</label>
              <input type="number" step="0.01" {...register('selling_price', { required: true })} className="w-full px-4 py-2 bg-emerald-50/50 border border-emerald-500/20 rounded-lg text-sm font-black text-emerald-700 focus:ring-2 focus:ring-emerald-50 outline-none font-fira-code shadow-inner h-[40px]" />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 items-center">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-all font-fira-code active:scale-95 cursor-pointer">Cancel</button>
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="px-8 py-3 bg-emerald-900 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-900/10 hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2.5 font-fira-code"
            >
              {addMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
              Save Medicine
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReceiveStockModal({ item, onClose }: { item: any, onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, control } = useForm({
    defaultValues: {
      type: 'IN',
      quantity: 1,
      unitCost: item.unit_cost || 0,
      sellingPrice: item.selling_price || 0,
      batchNumber: item.batch_number || '',
      expiryDate: item.expiry_date || null
    }
  });
  const { currency: currencyCode } = useCurrency();

  const { data: warehouses } = useQuery({
    queryKey: ['inventory', 'warehouses'],
    queryFn: async () => (await coreApi.get<any[]>('/inventory/warehouses')).data || []
  });

  const mutation = useMutation({
    mutationFn: (data: any) => coreApi.post('/inventory/movements', {
      itemId: item.id,
      type: data.type,
      quantity: Number(data.quantity),
      toWarehouseId: data.toWarehouseId,
      batchNumber: data.batchNumber,
      unitCost: Number(data.unitCost),
      sellingPrice: Number(data.sellingPrice),
      expiryDate: data.expiryDate
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy'] });
      toast.success("Stock updated successfully.");
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Movement failed")
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#064E3B]/40 backdrop-blur-md" onClick={onClose} />
      <div className="bg-white/95 backdrop-blur-2xl w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-emerald-100 animate-in zoom-in-95 duration-300 font-fira-sans">
        <div className="bg-emerald-50/30 border-b border-emerald-50 px-5 py-3.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center">
              <Plus className="h-4.5 w-4.5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tighter uppercase text-slate-900 leading-none">Record Stock</h2>
              <p className="text-[7.5px] text-emerald-600 font-black uppercase tracking-widest mt-1 font-fira-code">Update stock level: {item.drug_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-emerald-50 transition-all text-xs border border-emerald-100 shadow-sm active:scale-95 cursor-pointer">×</button>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[8px] font-black uppercase tracking-widest text-emerald-600 mb-1.5 font-fira-code">Type</label>
              <select {...register('type')} className="w-full px-3 py-2 bg-slate-50 border border-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-emerald-50 h-[36px] font-fira-code">
                <option value="IN">Add Stock (IN)</option>
                <option value="OUT">Remove Stock (OUT)</option>
                <option value="ADJUSTMENT">Inventory Adjustment</option>
              </select>
            </div>
            <div>
              <label className="block text-[8px] font-black uppercase tracking-widest text-emerald-600 mb-1.5 font-fira-code">Target Store / Warehouse</label>
              <select {...register('toWarehouseId', { required: true })} className="w-full px-3 py-2 bg-slate-50 border border-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-emerald-50 h-[36px] font-fira-code cursor-pointer">
                {warehouses?.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5 font-fira-code">Batch / Lot Number</label>
              <input {...register('batchNumber', { required: true })} className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-lg text-[10px] font-black font-fira-code uppercase tracking-widest outline-none focus:ring-2 focus:ring-emerald-50 h-[36px]" />
            </div>
            <div>
              <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5 font-fira-code">Quantity</label>
              <input type="number" {...register('quantity', { required: true })} className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-lg text-[10px] font-black font-fira-code outline-none focus:ring-2 focus:ring-emerald-50 h-[36px]" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div>
              <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5 font-fira-code">Acquisition Cost ({currencyCode})</label>
              <input type="number" step="0.01" {...register('unitCost')} className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-lg text-[10px] font-black font-fira-code outline-none focus:ring-2 focus:ring-emerald-50 h-[36px]" />
            </div>
            <div>
              <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5 font-fira-code">Selling Price ({currencyCode})</label>
              <input type="number" step="0.01" {...register('sellingPrice')} className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-lg text-[10px] font-black font-fira-code outline-none focus:ring-2 focus:ring-emerald-50 h-[36px]" />
            </div>
            <div>
              <Controller
                control={control}
                name="expiryDate"
                render={({ field }) => (
                  <ClinicalDatePicker
                    label="Expiry Date"
                    value={field.value}
                    onChange={field.onChange}
                    className="h-[36px] bg-white border-emerald-100 rounded-lg px-3 font-fira-code text-[10px]"
                  />
                )}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-3.5 bg-emerald-900 text-white rounded-xl font-black text-[9.5px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-900/10 hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 font-fira-code mt-4"
          >
            {mutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap size={12} className="text-emerald-400" />}
            Save Stock Entry
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PharmacyPageWrapper() {
  return (
    <ErrorBoundary>
      <PharmacyPage />
    </ErrorBoundary>
  );
}
