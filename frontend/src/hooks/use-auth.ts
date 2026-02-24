'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { coreApi, ApiError } from '@/lib/api';

export function useAuth() {
  const { user, tenant, isAuthenticated, isLoading, setUser, clearAuth, setLoading } =
    useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Verify session on mount - WITH ERROR HANDLING
  const { data: meData, isLoading: meLoading, error: meError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => coreApi.get('/auth/me'),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // 🔧 FIX: Handle /auth/me failure to clear stale auth state
  useEffect(() => {
    if (meError && isAuthenticated) {
      // Session is invalid on the server, clear local state
      clearAuth();
      queryClient.clear();
      router.push('/login');
    }
  }, [meError, isAuthenticated, clearAuth, queryClient, router]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string; tenant_slug: string }) =>
      coreApi.post<{ user: any; tenant: any }>('/auth/login', data),
    onSuccess: (response) => {
      if (response.data) {
        setUser(response.data.user, response.data.tenant);
        router.push('/dashboard');
      }
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => coreApi.post('/auth/logout'),
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      router.push('/login');
    },
    onError: () => {
      // Clear local state even if server request fails
      clearAuth();
      queryClient.clear();
      router.push('/login');
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: any) =>
      coreApi.post<{ user: any; tenant: any }>('/auth/register', data),
    onSuccess: (response) => {
      if (response.data) {
        setUser(response.data.user, response.data.tenant);
        router.push('/dashboard');
      }
    },
  });

  const login = useCallback(
    (email: string, password: string, tenantSlug: string) =>
      loginMutation.mutateAsync({ email, password, tenant_slug: tenantSlug }),
    [loginMutation]
  );

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  const hasRole = useCallback(
    (...roles: string[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  return {
    user,
    tenant,
    isAuthenticated,
    isLoading: isLoading || meLoading,
    login,
    logout,
    register: registerMutation.mutateAsync,
    hasRole,
    loginError: loginMutation.error as ApiError | null,
    registerError: registerMutation.error as ApiError | null,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
  };
}