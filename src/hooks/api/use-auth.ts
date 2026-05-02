"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import type { AuthResult, MeResult } from "@/types/api";
import { useAuth } from "@/contexts/auth-context";

export function useLogin() {
  const { applyAuth } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { phone: string; password: string }) =>
      apiPost<AuthResult>("/auth/login", body),
    onSuccess: (res) => {
      applyAuth({
        user: res.user,
        accessToken: res.tokens.accessToken,
        refreshToken: res.tokens.refreshToken,
        membership: {
          tenantId: res.membership.tenantId,
          venueId: res.membership.venueId,
          permissions: res.membership.permissions,
        },
      });
      qc.invalidateQueries();
    },
  });
}

export function useRegister() {
  const { applyAuth } = useAuth();
  return useMutation({
    mutationFn: (body: {
      phone: string;
      password: string;
      displayName: string;
      email?: string;
    }) => apiPost<AuthResult>("/auth/register", body),
    onSuccess: (res) => {
      applyAuth({
        user: res.user,
        accessToken: res.tokens.accessToken,
        refreshToken: res.tokens.refreshToken,
        membership: {
          tenantId: res.membership.tenantId,
          venueId: res.membership.venueId,
          permissions: res.membership.permissions,
        },
      });
    },
  });
}

export function useMe() {
  const { isAuthenticated, isReady, setUser, setMemberships } = useAuth();
  return useQuery({
    queryKey: ["me"],
    enabled: isReady && isAuthenticated,
    queryFn: async () => {
      const res = await apiGet<MeResult>("/me");
      setUser(res.user);
      setMemberships(res.memberships);
      return res;
    },
  });
}

export function useLogout() {
  const { logout } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await apiPost("/auth/logout", {});
      } catch {
        // ignore — clear client side anyway
      }
    },
    onSuccess: () => {
      logout();
      qc.clear();
    },
  });
}
