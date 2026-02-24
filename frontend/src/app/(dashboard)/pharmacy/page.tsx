'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Pill, AlertTriangle, Clock, Package,
  Search, Plus, TrendingDown, Filter, CreditCard, LogOut
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { formatDate, formatCurrency, getStatusColor, cn } from '@/lib/utils';
import { SkeletonCard, SkeletonTable } from '@/components/shared/skeleton';
import { ErrorBoundary, QueryError } from '@/components/shared/error-boundary';
import { useForm } from 'react-hook-form';

function PharmacyPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tab, setTab] = useState<'inventory' | 'expiring' | 'low-stock'>('inventory');
  const [page, setPage] = useState(1);
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [showOTCSaleModal, setShowOTCSaleModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['pharmacy', 'stats'],
    queryFn: () => coreApi.get<any>('/pharmacy/stats'),
  });

  const { data: inventoryData, isLoading, error, refetch } = useQuery({
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
    { label: 'Total Items', value: stats?.data?.totalItems ?? '–', icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Low Stock', value: stats?.data?.lowStock ?? '–', icon: TrendingDown, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Out of Stock', value: stats?.data?.outOfStock ?? '–', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Expiring Soon', value: stats?.data?.expiringSoon ?? '–', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pharmacy</h1>
          <p className="text-sm text-muted-foreground">Inventory management & dispensing</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowOTCSaleModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <CreditCard className="h-4 w-4" />
            OTC Sale
          </button>
          <button
            onClick={() => setShowDispenseModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Pill className="h-4 w-4" />
            Dispense (Rx)
          </button>
          <button
            onClick={() => setShowAddItemModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{stat.label}</p>
              <div className={`w-8 h-8 ${stat.bg} dark:bg-opacity-20 rounded-lg flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="flex border-b border-border bg-muted/20">
          {[
            { key: 'inventory', label: 'All Inventory' },
            { key: 'low-stock', label: 'Low Stock' },
            { key: 'expiring', label: 'Expiring Soon' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key as any); setPage(1); }}
              className={cn(
                'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {t.label}
              {t.key === 'low-stock' && stats?.data?.lowStock > 0 && (
                <span className="ml-2 text-xs bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded-full">
                  {stats!.data.lowStock}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-border flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search drugs, SKU, batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-4"><SkeletonTable rows={8} /></div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-16">
            <Pill className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No inventory items found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {['Drug Name', 'SKU / Batch', 'Category', 'Stock', 'Expiry', 'Price', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inventory.map((item: any) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-bold text-foreground text-sm">{item.drug_name}</p>
                        {item.generic_name && (
                          <p className="text-xs text-muted-foreground">{item.generic_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-mono text-muted-foreground">{item.sku}</p>
                        <p className="text-[10px] text-muted-foreground font-bold">{item.batch_number}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 bg-muted rounded uppercase">{item.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className={cn(
                          'text-sm font-black',
                          item.stock_quantity === 0 ? 'text-red-600' :
                            item.stock_quantity <= item.reorder_level ? 'text-orange-600' : 'text-foreground'
                        )}>
                          {item.stock_quantity}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Limit {item.reorder_level}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className={cn(
                        'text-sm font-medium',
                        new Date(item.expiry_date) < new Date() ? 'text-red-600' :
                          new Date(item.expiry_date) < new Date(Date.now() + 30 * 86400000) ? 'text-orange-600' :
                            'text-muted-foreground'
                      )}>
                        {formatDate(item.expiry_date)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-foreground">{formatCurrency(item.selling_price)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Cost {formatCurrency(item.unit_cost)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-[10px] px-2 py-1 rounded-full font-black uppercase', getStatusColor(item.status))}>
                        {item.status?.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta?.totalPages && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Page {page} of {meta.totalPages} ({meta.total} items)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-1.5 text-xs font-bold border border-border rounded-lg disabled:opacity-40 hover:bg-background transition-colors uppercase"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(meta.totalPages || 0, page + 1))}
                disabled={page === meta.totalPages}
                className="px-4 py-1.5 text-xs font-bold border border-border rounded-lg disabled:opacity-40 hover:bg-background transition-colors uppercase"
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
    </div>
  );
}

function OTCSaleModal({ onClose, inventory }: { onClose: () => void, inventory: any[] }) {
  const [patientId, setPatientId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [items, setItems] = useState<{ inventory_item_id: string, drug_name: string, quantity: number, price: number }[]>([]);
  const queryClient = useQueryClient();

  const { data: patients } = useQuery({ queryKey: ['patients'], queryFn: async () => (await coreApi.get<any[]>('/patients')).data });

  const saleMutation = useMutation({
    mutationFn: (data: any) => coreApi.post('/pharmacy/sale', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy'] });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-border flex flex-col">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground">OTC Sale (Point of Sale)</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">×</button>
        </div>

        <div className="p-6 overflow-hidden flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Side: Inventory Search */}
          <div className="flex flex-col gap-4 overflow-hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search medicine to add..."
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm"
                onChange={(e) => { }} // We'll use the inventory passed from parent
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {inventory.filter(i => i.stock_quantity > 0).map(item => (
                <div key={item.id} className="p-3 border border-border rounded-xl flex justify-between items-center bg-muted/20">
                  <div>
                    <p className="font-bold text-sm">{item.drug_name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black">{item.batch_number} • {item.stock_quantity} in stock</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-primary mb-1">${Number(item.selling_price).toFixed(2)}</p>
                    <button
                      onClick={() => addItem(item)}
                      className="text-[10px] font-bold uppercase py-1 px-3 bg-primary text-primary-foreground rounded-lg"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Cart & Checkout */}
          <div className="bg-muted/30 rounded-xl p-6 border border-border flex flex-col">
            <div className="mb-4 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1">Customer Type</label>
                <select
                  value={patientId ? 'patient' : 'guest'}
                  onChange={(e) => {
                    if (e.target.value === 'guest') setPatientId('');
                    else if (patients && patients.length > 0) setPatientId(patients[0].id);
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-bold"
                >
                  <option value="guest">Guest Checkout (Direct Sale)</option>
                  <option value="patient">Registered Patient (Bill to Account)</option>
                </select>
              </div>

              {patientId ? (
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1">Select Patient</label>
                  <select
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-bold text-primary"
                  >
                    {patients?.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.mrn})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1">Guest Name</label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1">Guest Phone</label>
                    <input
                      type="text"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="e.g. 9988776655"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-6">
              <p className="text-[10px] font-black uppercase text-muted-foreground">Items in Cart</p>
              {items.length === 0 && <p className="text-center py-8 text-xs text-muted-foreground italic">Cart is empty</p>}
              {items.map(item => (
                <div key={item.inventory_item_id} className="p-2 bg-card border border-border rounded-lg flex justify-between items-center">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold truncate">{item.drug_name}</p>
                    <p className="text-[9px] text-muted-foreground">${item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={item.quantity}
                      min="1"
                      onChange={(e) => updateQty(item.inventory_item_id, parseInt(e.target.value))}
                      className="w-12 text-center bg-background border border-border rounded p-1 text-xs"
                    />
                    <button onClick={() => removeItem(item.inventory_item_id)} className="text-red-400 p-1">
                      <LogOut className="h-4 w-4 rotate-180" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 mt-auto">
              <div className="flex justify-between items-end mb-4">
                <span className="text-xs font-bold text-muted-foreground uppercase">Total Amount</span>
                <span className="text-2xl font-black text-primary">${subtotal.toFixed(2)}</span>
              </div>
              <button
                onClick={() => saleMutation.mutate({
                  patient_id: patientId || undefined,
                  guest_name: !patientId ? guestName : undefined,
                  guest_phone: !patientId ? guestPhone : undefined,
                  items: items.map(i => ({ inventory_item_id: i.inventory_item_id, quantity: i.quantity }))
                })}
                disabled={items.length === 0 || saleMutation.isPending}
                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform disabled:opacity-50"
              >
                {saleMutation.isPending ? 'Processing...' : 'Complete Sale & Exit'}
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
      onClose();
    },
  });

  const prescriptions = prescriptionsData?.data || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40">
      <div className="relative bg-card rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-border animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-border bg-muted/30 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-foreground leading-none">Dispense Medication</h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Clinical Prescription Fulfillment</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-all">×</button>
        </div>

        <div className="p-6 space-y-5">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              autoFocus
              value={rxSearch}
              onChange={(e) => setRxSearch(e.target.value)}
              placeholder="Search by Patient Name, MRN or Rx ID..."
              className="w-full pl-11 pr-4 py-3 bg-muted/20 border border-border rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
            />
            {isLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="max-h-[40vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 opacity-50">
                <Search className="h-8 w-8 text-muted-foreground animate-bounce" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Searching clinical database...</p>
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-center px-6">
                <Clock className="h-10 w-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm font-bold text-muted-foreground">{rxSearch.length > 2 ? 'No active prescriptions found for this query' : 'Enter at least 3 characters to begin clinical search'}</p>
                <p className="text-[10px] text-muted-foreground/60 uppercase font-black tracking-widest mt-1">Search is required for patient safety</p>
              </div>
            ) : (
              prescriptions.map((rx: any) => (
                <div key={rx.id} className="group p-4 bg-muted/5 border border-border rounded-2xl hover:border-green-500/30 hover:bg-green-500/[0.02] transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-xl bg-background border border-border flex flex-col items-center justify-center shadow-sm">
                        <span className="text-[8px] font-black text-muted-foreground uppercase leading-none mb-0.5">Rx</span>
                        <span className="text-xs font-black text-primary leading-none">#{rx.id.slice(0, 4).toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-foreground">{rx.patient?.first_name} {rx.patient?.last_name}</p>
                          <span className="px-1.5 py-0.5 bg-background border border-border text-[8px] font-black uppercase rounded text-muted-foreground tracking-tighter">{rx.patient?.mrn}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">Prescribed by Dr. {rx.doctor?.last_name}</p>
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
                      className="px-5 py-2 bg-green-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-green-700 disabled:opacity-50 shadow-lg shadow-green-600/20 active:scale-95 transition-all"
                    >
                      {dispenseMutation.isPending ? 'PROCESSING...' : 'FULFILL RX'}
                    </button>
                  </div>
                  <div className="bg-background/50 rounded-xl p-3 border border-border/50 divide-y divide-border/30">
                    {rx.items.map((item: any) => (
                      <div key={item.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-6 w-6 rounded-lg bg-green-50 flex items-center justify-center">
                            <Pill className="h-3 w-3 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-foreground">{item.drug_name}</p>
                            <p className="text-[9px] text-muted-foreground font-bold uppercase">{item.dosage} • {item.frequency} • {item.duration}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-primary tracking-tighter">{item.quantity_prescribed}</p>
                          <p className="text-[8px] text-muted-foreground font-bold uppercase leading-none mt-0.5">UNITS</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {dispenseMutation.error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-shake">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              <p className="text-[10px] text-red-600 font-black uppercase tracking-widest leading-none">
                {(dispenseMutation.error as any).response?.data?.message || (dispenseMutation.error as any).message || 'Stock allocation failure'}
              </p>
            </div>
          )}
        </div>

        <div className="p-5 bg-muted/30 border-t border-border flex justify-end gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-border text-muted-foreground rounded-xl text-[10px] font-black uppercase hover:bg-muted transition-all tracking-widest"
          >
            Cancel Fulfillment
          </button>
        </div>
      </div>
    </div>
  );
}

function AddItemModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm();

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
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Add Inventory Item</h2>
              <p className="text-xs text-muted-foreground">Register new stock into pharmacy</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors">×</button>
        </div>

        <form onSubmit={handleSubmit((data) => addMutation.mutate(data))} className="p-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Drug Name *</label>
              <input {...register('drug_name', { required: true })} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm" placeholder="e.g. Paracetamol 500mg" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Generic Name</label>
              <input {...register('generic_name')} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm" placeholder="e.g. Acetaminophen" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">SKU / Code *</label>
              <input {...register('sku', { required: true })} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-mono" placeholder="PH-XYZ-123" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Batch Number *</label>
              <input {...register('batch_number', { required: true })} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-mono" placeholder="BAT-9988" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Category *</label>
              <select {...register('category', { required: true })} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm">
                <option value="TABLET">Tablet</option>
                <option value="SYRUP">Syrup</option>
                <option value="INJECTION">Injection</option>
                <option value="CAPSULE">Capsule</option>
                <option value="OINTMENT">Ointment</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Expiry Date *</label>
              <input type="date" {...register('expiry_date', { required: true })} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Stock Quantity *</label>
              <input type="number" {...register('stock_quantity', { required: true })} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Reorder Level</label>
              <input type="number" {...register('reorder_level')} defaultValue={10} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Unit Cost ($) *</label>
              <input type="number" step="0.01" {...register('unit_cost', { required: true })} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-bold" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Selling Price ($) *</label>
              <input type="number" step="0.01" {...register('selling_price', { required: true })} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-bold text-primary" />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl border border-border hover:bg-muted font-bold text-sm transition-all">Cancel</button>
            <button type="submit" disabled={addMutation.isPending} className="px-8 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-bold text-sm shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50">
              {addMutation.isPending ? 'Processing...' : 'Register Stock'}
            </button>
          </div>
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
