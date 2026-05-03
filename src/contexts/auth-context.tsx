"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authStorage } from "@/lib/auth-storage";
import type { Membership, PublicUser, TenantSummary } from "@/types/api";

interface AuthState {
  user: PublicUser | null;
  memberships: Membership[];
  tenants: TenantSummary[];
  activeTenantId: string | null;
  activeVenueId: string | null;
  permissions: string[];
  isAuthenticated: boolean;
  isReady: boolean;
}

interface AuthContextValue extends AuthState {
  applyAuth: (params: {
    user: PublicUser;
    accessToken: string;
    refreshToken: string;
    membership: { tenantId: string | null; venueId: string | null; permissions: string[] };
  }) => void;
  setMemberships: (m: Membership[]) => void;
  setTenants: (t: TenantSummary[]) => void;
  setUser: (u: PublicUser | null) => void;
  switchTenant: (tenantId: string) => void;
  switchVenue: (venueId: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    memberships: [],
    tenants: [],
    activeTenantId: null,
    activeVenueId: null,
    permissions: [],
    isAuthenticated: false,
    isReady: false,
  });

  // Hydrate from storage on mount
  useEffect(() => {
    const access = authStorage.getAccess();
    const tenantId = authStorage.getActiveTenantId();
    const venueId = authStorage.getActiveVenueId();
    setState((s) => ({
      ...s,
      isAuthenticated: !!access,
      activeTenantId: tenantId,
      activeVenueId: venueId,
      isReady: true,
    }));
  }, []);

  const applyAuth: AuthContextValue["applyAuth"] = useCallback(
    ({ user, accessToken, refreshToken, membership }) => {
      authStorage.setTokens(accessToken, refreshToken);
      authStorage.setActiveTenantId(membership.tenantId);
      authStorage.setActiveVenueId(membership.venueId);
      setState((s) => ({
        ...s,
        user,
        activeTenantId: membership.tenantId,
        activeVenueId: membership.venueId,
        permissions: membership.permissions,
        isAuthenticated: true,
        isReady: true,
      }));
    },
    [],
  );

  const setMemberships = useCallback((memberships: Membership[]) => {
    setState((s) => ({ ...s, memberships }));
  }, []);

  const setTenants = useCallback((tenants: TenantSummary[]) => {
    setState((s) => ({ ...s, tenants }));
  }, []);

  const setUser = useCallback((user: PublicUser | null) => {
    setState((s) => ({ ...s, user }));
  }, []);

  const switchTenant = useCallback((tenantId: string) => {
    authStorage.setActiveTenantId(tenantId);
    setState((s) => {
      const m = s.memberships.find((x) => x.tenantId === tenantId);
      return {
        ...s,
        activeTenantId: tenantId,
        activeVenueId: m?.venueId ?? null,
        permissions: m?.permissions ?? [],
      };
    });
  }, []);

  const switchVenue = useCallback((venueId: string | null) => {
    authStorage.setActiveVenueId(venueId);
    setState((s) => ({ ...s, activeVenueId: venueId }));
  }, []);

  const logout = useCallback(() => {
    authStorage.clear();
    setState({
      user: null,
      memberships: [],
      tenants: [],
      activeTenantId: null,
      activeVenueId: null,
      permissions: [],
      isAuthenticated: false,
      isReady: true,
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      applyAuth,
      setMemberships,
      setTenants,
      setUser,
      switchTenant,
      switchVenue,
      logout,
    }),
    [state, applyAuth, setMemberships, setTenants, setUser, switchTenant, switchVenue, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside <AuthProvider>");
  return ctx;
}
