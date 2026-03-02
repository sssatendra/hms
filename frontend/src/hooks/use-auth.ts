'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore, User, Tenant } from '@/lib/auth-store';
import { coreApi, ApiError } from '@/lib/api';

export function useAuth() {
  const { user, tenant, isAuthenticated, isLoading, setUser, clearAuth, setLoading } =
    useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Verify session on mount - WITH ERROR HANDLING
  const { data: meData, isLoading: meLoading, error: meError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => coreApi.get<{ user: User; tenant: Tenant }>('/auth/me'),
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

  // Sync latest user and tenant data to store on load
  useEffect(() => {
    if (meData?.data?.user && meData?.data?.tenant && isAuthenticated) {
      setUser(meData.data.user, meData.data.tenant);
    }
  }, [meData, isAuthenticated, setUser]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string; tenant_slug: string }) =>
      coreApi.post<{ user: any; tenant: any; mfa_required?: boolean; mfa_token?: string }>('/auth/login', data),
    onSuccess: (response) => {
      if (response.data && !response.data.mfa_required) {
        setUser(response.data.user, response.data.tenant);
        toast.success(`Welcome back, ${response.data.user.first_name}!`);
        router.push('/dashboard');
      }
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Login failed');
    }
  });

  // Verify 2FA mutation (during login)
  const verify2FAMutation = useMutation({
    mutationFn: (data: { mfa_token: string; otp_code: string }) =>
      coreApi.post<{ user: any; tenant: any }>('/auth/login/2fa', data),
    onSuccess: (response) => {
      if (response.data) {
        setUser(response.data.user, response.data.tenant);
        toast.success("Identity verified successfully");
        router.push('/dashboard');
      }
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Verification failed');
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => coreApi.post('/auth/logout'),
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      toast.success("Successfully logged out");
      router.push('/login');
    },
    onError: () => {
      // Clear local state even if server request fails
      clearAuth();
      queryClient.clear();
      toast.info("Session ended");
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
        toast.success("Account created successfully!");
        router.push('/dashboard');
      }
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Registration failed');
    }
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
      const roleName = typeof user.role === 'string' ? user.role : user.role.name;
      return roles.includes(roleName);
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
    verify2FA: verify2FAMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    hasRole,
    loginError: loginMutation.error as ApiError | null,
    verify2FAError: verify2FAMutation.error as ApiError | null,
    registerError: registerMutation.error as ApiError | null,
    isLoginPending: loginMutation.isPending,
    isVerify2FAPending: verify2FAMutation.isPending,
    isRegisterPending: registerMutation.isPending,
  };
}