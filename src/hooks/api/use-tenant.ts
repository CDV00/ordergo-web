"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import type { BusinessType, Membership, Venue } from "@/types/api";
import { authStorage } from "@/lib/auth-storage";

export interface SetupWizardInput {
  tenantName: string;
  taxCode?: string;
  venueName: string;
  venueCode: string;
  businessType: BusinessType;
  address?: string;
  city?: string;
}

export function useSetupWizard() {
  const qc = useQueryClient();
  const { applyAuth, user } = useAuth();
  return useMutation({
    mutationFn: (body: SetupWizardInput) =>
      apiPost<{
        tenant: { id: string };
        venue: Venue;
        membership: Membership;
      }>("/setup-wizard", body),
    onSuccess: (res) => {
      // Update active tenant/venue + permissions ngay (chưa có refresh token mới)
      authStorage.setActiveTenantId(res.tenant.id);
      authStorage.setActiveVenueId(res.venue.id);
      if (user) {
        applyAuth({
          user,
          accessToken: authStorage.getAccess() ?? "",
          refreshToken: authStorage.getRefresh() ?? "",
          membership: {
            tenantId: res.tenant.id,
            venueId: res.venue.id,
            permissions: res.membership.permissions,
          },
        });
      }
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["venues"] });
    },
  });
}

export function useVenues() {
  const { isAuthenticated, activeTenantId } = useAuth();
  return useQuery({
    queryKey: ["venues", activeTenantId],
    enabled: isAuthenticated && !!activeTenantId,
    queryFn: () => apiGet<Venue[]>("/venues"),
  });
}

export function useCreateVenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      code: string;
      businessType: BusinessType;
      addressLine1?: string;
      city?: string;
      phone?: string;
    }) => apiPost<Venue>("/venues", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["venues"] }),
  });
}

export function useUpdateVenue(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<{ name: string; addressLine1: string; city: string; phone: string }>) =>
      apiPatch<Venue>(`/venues/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["venues"] }),
  });
}
