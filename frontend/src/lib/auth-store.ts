import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar_url?: string;
  tenant_id: string;
  department_id?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User, tenant: Tenant) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      isAuthenticated: false,
      isLoading: false,
      setUser: (user, tenant) =>
        set({ user, tenant, isAuthenticated: true, isLoading: false }),
      clearAuth: () =>
        set({ user: null, tenant: null, isAuthenticated: false, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'hms-auth',
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Permission check helper
export const hasPermission = (userRole: string, permission: string): boolean => {
  const rolePermissions: Record<string, string[]> = {
    SUPER_ADMIN: ['*'],
    ADMIN: [
      'users:read', 'users:write', 'patients:read', 'patients:write',
      'appointments:read', 'appointments:write', 'prescriptions:read',
      'pharmacy:read', 'pharmacy:write', 'pharmacy:manage', 'pharmacy:dispense',
      'lab:read', 'lab:write', 'emr:read', 'admin:reports', 'billing:read', 'billing:write',
    ],
    DOCTOR: [
      'patients:read', 'patients:write', 'appointments:read', 'appointments:write',
      'prescriptions:read', 'prescriptions:write', 'emr:read', 'emr:write',
      'lab:read', 'lab:write', 'billing:read',
    ],
    PHARMACIST: [
      'patients:read', 'prescriptions:read', 'pharmacy:read', 'pharmacy:write',
      'pharmacy:dispense', 'pharmacy:manage', 'billing:read', 'billing:write',
    ],
    LAB_TECH: ['patients:read', 'lab:read', 'lab:write', 'lab:process', 'lab:upload'],
    NURSE: ['patients:read', 'patients:write', 'appointments:read', 'prescriptions:read', 'emr:read'],
    RECEPTIONIST: ['patients:read', 'patients:write', 'appointments:read', 'appointments:write'],
    PATIENT: ['patients:read', 'appointments:read', 'prescriptions:read', 'lab:read', 'emr:read'],
  };

  const perms = rolePermissions[userRole] || [];
  return perms.includes('*') || perms.includes(permission);
};
