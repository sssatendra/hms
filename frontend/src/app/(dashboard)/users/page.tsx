'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Users, Search, Shield, UserCheck, Clock, Plus,
  MoreVertical, Edit2, KeyRound, UserMinus, ShieldAlert
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { formatDateTime, getRoleColor, getStatusColor, cn } from '@/lib/utils';
import { SkeletonTable } from '@/components/shared/skeleton';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { useAuthStore } from '@/lib/auth-store';
import UserFormModal from '@/components/users/UserFormModal';
import ResetPasswordModal from '@/components/users/ResetPasswordModal';
import { Portal } from '@/components/shared/portal';

// Simplified Action Menu component to replace missing Radix UI Dropdown
function ActionMenu({ user, onEdit, onReset }: { user: any, onEdit: (u: any) => void, onReset: (u: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          setOpenUpwards(spaceBelow < 250);
          setCoords({
            top: spaceBelow < 250 ? rect.top : rect.bottom,
            left: rect.right - 224 // 224px is w-56
          });
          setIsOpen(!isOpen);
        }}
        className={cn(
          "p-2.5 rounded-[18px] transition-all outline-none border border-transparent shadow-sm",
          isOpen ? "bg-cyan-600 text-white shadow-cyan-600/20" : "bg-white hover:bg-cyan-50 text-cyan-900 border-cyan-100 hover:border-cyan-200"
        )}
      >
        <MoreVertical className="h-4.5 w-4.5" />
      </button>

      {isOpen && (
        <Portal>
          <div className="fixed inset-0 z-[999]" onClick={() => setIsOpen(false)} />
          <div
            style={{
              top: openUpwards ? 'auto' : coords.top + 8,
              bottom: openUpwards ? (window.innerHeight - coords.top) + 8 : 'auto',
              left: coords.left
            }}
            className={cn(
              "fixed w-56 bg-white/70 backdrop-blur-2xl border border-cyan-100/50 rounded-[30px] shadow-[0_30px_70px_rgba(8,145,178,0.15)] z-[1000] py-2 animate-in zoom-in-95 fade-in duration-300 font-fira-sans",
              openUpwards ? "origin-bottom" : "origin-top"
            )}
          >
            <div className="px-5 py-3 text-[8px] font-black uppercase text-cyan-900/30 tracking-[0.25em] flex items-center gap-2 font-fira-code border-b border-cyan-50/50 mb-1.5">
              <Shield size={10} className="text-cyan-600/30" />
              Staff Authority
            </div>
            <div className="px-2 space-y-1">
              <button
                onClick={() => { onEdit(user); setIsOpen(false); }}
                className="w-full flex items-center gap-3.5 px-4 py-3 text-[11px] font-black uppercase tracking-wider hover:bg-cyan-600 hover:text-white rounded-[22px] transition-all text-left group"
              >
                <div className="w-8 h-8 bg-cyan-100 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Edit2 size={14} className="text-cyan-600 group-hover:text-white" />
                </div>
                Edit Profile
              </button>
              <button
                onClick={() => { onReset(user); setIsOpen(false); }}
                className="w-full flex items-center gap-3.5 px-4 py-3 text-[11px] font-black uppercase tracking-wider hover:bg-amber-500 hover:text-white rounded-[22px] transition-all text-left group"
              >
                <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <KeyRound size={14} className="text-amber-500 group-hover:text-white" />
                </div>
                Reset Password
              </button>
              <div className="h-px bg-cyan-50/50 my-1 mx-3" />
              <button className="w-full flex items-center gap-3.5 px-4 py-3 text-[11px] font-black uppercase tracking-wider hover:bg-rose-600 hover:text-white rounded-[22px] transition-all text-left group">
                <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <UserMinus size={14} className="text-rose-600 group-hover:text-white" />
                </div>
                Terminate User
              </button>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

function UsersPage() {
  const { user: currentUser, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [resettingPasswordUser, setResettingPasswordUser] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Security Gate: Only ADMIN can access this page
  useEffect(() => {
    if (_hasHydrated && currentUser && currentUser.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [_hasHydrated, currentUser, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, roleFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      return coreApi.get<any[]>(`/users?${params}`);
    },
    enabled: !!currentUser && currentUser.role === 'ADMIN'
  });

  const users = data?.data || [];

  if (!_hasHydrated || (currentUser && currentUser.role !== 'ADMIN')) {
    return null;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-[1700px] mx-auto p-4 lg:p-6 font-fira-sans">
      {/* Ocean Breeze Header (Compact) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#164E63] to-[#0891B2] px-8 py-10 rounded-[40px] shadow-2xl shadow-cyan-900/10 text-white hover:shadow-cyan-900/20 transition-all duration-500">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center shadow-inner">
              <Users className="h-6 w-6 text-cyan-100" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5 opacity-80">
                <div className="px-2.5 py-0.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[7.5px] font-black uppercase tracking-widest">Medical Personnel</div>
                <span className="text-[8px] font-black text-cyan-200 uppercase tracking-widest border-l border-white/20 pl-2.5 font-fira-code">Active Staff: {users.length}</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tighter leading-tight font-fira-sans uppercase">
                Staff <span className="text-cyan-100/40">Management</span>
              </h1>
            </div>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2.5 px-8 py-4 bg-white text-cyan-900 rounded-[28px] font-black uppercase tracking-widest text-[9.5px] shadow-xl hover:bg-cyan-50 active:scale-95 transition-all font-fira-code group"
          >
            <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
            ADD NEW STAFF
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-cyan-400/20 rounded-full blur-[80px]" />
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-cyan-100 overflow-hidden shadow-xl shadow-cyan-500/5 transition-all hover:shadow-cyan-500/10">
        <div className="p-6 border-b border-cyan-50 bg-cyan-50/20 flex gap-4 flex-wrap items-center">
          <div className="relative flex-1 min-w-[300px] group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-600/40 group-focus-within:text-cyan-600 transition-colors" />
            <input
              type="text"
              placeholder="SEARCH STAFF BY NAME, EMAIL, OR ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-cyan-100 rounded-[20px] text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-300 transition-all font-fira-code"
            />
          </div>
          <div className="relative group">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-5 pr-10 py-3.5 bg-white/50 border border-cyan-100 rounded-[20px] text-[9px] font-black uppercase tracking-[0.15em] focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-300 outline-none cursor-pointer appearance-none font-fira-code min-w-[200px]"
            >
              <option value="">ALL STAFF ROLES</option>
              {['ADMIN', 'DOCTOR', 'PHARMACIST', 'LAB_TECH', 'NURSE', 'RECEPTIONIST'].map(r => (
                <option key={r} value={r}>{r.replace('_', ' ')}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
              <Shield size={12} className="text-cyan-600" />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center gap-4 bg-white/50 backdrop-blur-md">
            <div className="w-12 h-12 border-4 border-cyan-500/20 rounded-full animate-pulse" />
            <p className="text-[10px] font-black uppercase text-cyan-600 tracking-widest font-fira-code">Syncing Personnel Data...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-24 bg-cyan-50/10 backdrop-blur-sm">
            <div className="h-24 w-24 bg-white border border-cyan-100 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-cyan-500/5 transition-transform hover:scale-110 duration-500">
              <Users className="h-10 w-10 text-cyan-200" />
            </div>
            <p className="text-[10px] font-black text-cyan-900/40 uppercase tracking-[0.3em] font-fira-code">No Personnel Records Found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-fira-sans border-collapse">
              <thead>
                <tr className="border-b border-cyan-50 bg-cyan-50/20">
                  {['Staff Name', 'Role & Specialization', 'Department', 'Duty Status', 'Last Activity', ''].map(h => (
                    <th key={h} className="px-8 py-5 text-left text-[9px] font-black text-cyan-900/40 uppercase tracking-[0.2em] font-fira-code">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-50">
                {users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-cyan-50/40 transition-all duration-300 group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white text-cyan-900 rounded-2xl flex items-center justify-center font-black text-xs border border-cyan-100 shadow-md transition-transform group-hover:scale-105 duration-300">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 leading-none mb-1.5 flex items-center gap-2 group-hover:text-cyan-700 transition-colors">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-[9px] font-black text-cyan-600/60 uppercase tracking-widest font-fira-code">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2">
                        <span className={cn('text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border w-fit shadow-sm font-fira-code', getRoleColor(user.role?.name))}>
                          {user.role?.name?.replace('_', ' ')}
                        </span>
                        {user.specialization && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded-md w-fit font-fira-code">
                            {user.specialization}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[10px] font-black uppercase text-slate-700 tracking-tight mb-1">
                        {user.department?.name || 'Unassigned'}
                      </p>
                      <p className="text-[8px] font-black text-cyan-600/40 font-fira-code uppercase tracking-widest">ID: {user.employee_id || 'UNKNOWN'}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2.5">
                        <span className={cn('text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-current w-fit shadow-inner transition-colors font-fira-code',
                          user.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                        )}>
                          {user.status}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", user.is_checked_in ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-300")} />
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 font-fira-code">
                            {user.is_checked_in ? 'On Duty' : 'Off Duty'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {user.last_login_at ? (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-cyan-50 rounded-xl text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-all duration-300">
                            <Clock className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-slate-900 font-fira-code tracking-tighter uppercase">{formatDateTime(user.last_login_at)}</p>
                            <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-[0.2em] font-fira-code">System Access</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[9px] font-black uppercase text-slate-300 tracking-[0.15em] font-fira-code italic">No access logs</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <ActionMenu
                        user={user}
                        onEdit={setEditingUser}
                        onReset={setResettingPasswordUser}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {
        (isCreateModalOpen || editingUser) && (
          <UserFormModal
            user={editingUser}
            onClose={() => {
              setIsCreateModalOpen(false);
              setEditingUser(null);
            }}
          />
        )
      }

      {
        resettingPasswordUser && (
          <ResetPasswordModal
            user={resettingPasswordUser}
            onClose={() => setResettingPasswordUser(null)}
          />
        )
      }
    </div >
  );
}

export default function UsersPageWrapper() {
  return <ErrorBoundary><UsersPage /></ErrorBoundary>;
}
