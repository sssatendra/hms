'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Pill, AlertTriangle, Clock, Package,
  Search, Plus, TrendingDown, Filter
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { formatDate, formatCurrency, getStatusColor, cn } from '@/lib/utils';
import { SkeletonCard, SkeletonTable } from '@/components/shared/skeleton';
import { ErrorBoundary, QueryError } from '@/components/shared/error-boundary';

function PharmacyPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tab, setTab] = useState<'inventory' | 'expiring' | 'low-stock'>('inventory');
  const [page, setPage] = useState(1);

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
          <h1 className="text-2xl font-bold text-gray-900">Pharmacy</h1>
          <p className="text-sm text-gray-500">Inventory management & dispensing</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'inventory', label: 'All Inventory' },
            { key: 'low-stock', label: 'Low Stock' },
            { key: 'expiring', label: 'Expiring Soon' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key as any); setPage(1); }}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {t.label}
              {t.key === 'low-stock' && stats?.data?.lowStock > 0 && (
                <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">
                  {stats.data.lowStock}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search drugs, SKU, batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <Pill className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No inventory items found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {['Drug Name', 'SKU / Batch', 'Category', 'Stock', 'Expiry', 'Price', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventory.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{item.drug_name}</p>
                        {item.generic_name && (
                          <p className="text-xs text-gray-500">{item.generic_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-mono text-gray-700">{item.sku}</p>
                        <p className="text-xs text-gray-500">{item.batch_number}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 capitalize">{item.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className={cn(
                          'text-sm font-bold',
                          item.stock_quantity === 0 ? 'text-red-600' :
                          item.stock_quantity <= item.reorder_level ? 'text-orange-600' : 'text-gray-900'
                        )}>
                          {item.stock_quantity}
                        </p>
                        <p className="text-xs text-gray-400">reorder at {item.reorder_level}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className={cn(
                        'text-sm',
                        new Date(item.expiry_date) < new Date() ? 'text-red-600 font-medium' :
                        new Date(item.expiry_date) < new Date(Date.now() + 30 * 86400000) ? 'text-orange-600' :
                        'text-gray-600'
                      )}>
                        {formatDate(item.expiry_date)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">{formatCurrency(item.selling_price)}</p>
                      <p className="text-xs text-gray-400">cost {formatCurrency(item.unit_cost)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-1 rounded-full font-medium', getStatusColor(item.status))}>
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
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Page {page} of {meta.totalPages} ({meta.total} items)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
                disabled={page === meta.totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
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
