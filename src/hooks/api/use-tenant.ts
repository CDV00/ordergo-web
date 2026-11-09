"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import type { Bank, BankAccount, BusinessType, Membership, Venue } from "@/types/api";
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

export interface UpdateVenueInput {
  name?: string;
  addressLine1?: string;
  city?: string;
  phone?: string;
  logoUrl?: string;
  /** 0–0.2 */
  serviceChargeRate?: number;
  vatRate?: 0 | 0.05 | 0.08 | 0.1;
  receiptFooter?: string;
  /** null = xoá tài khoản nhận tiền */
  bankAccount?:
    | (Omit<BankAccount, "bankName" | "accountName"> & {
        bankName?: string;
        accountName: string;
      })
    | null;
}

export function useUpdateVenue(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateVenueInput) => apiPatch<Venue>(`/venues/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["venues"] });
      qc.invalidateQueries({ queryKey: ["venue"] });
      qc.invalidateQueries({ queryKey: ["payment-qr"] });
    },
  });
}

/**
 * Cơ sở user được vào ở tenant đang chọn: membership toàn tenant (owner/quản trị/kế toán) → mọi cơ sở
 * chưa lưu trữ; còn lại → các cơ sở có membership gắn riêng. `tenantWide` dùng để mở báo cáo
 * toàn chuỗi / trang Chi nhánh (UI chỉ ẩn hiện — API vẫn tự kiểm).
 */
export function useAccessibleVenues() {
  const { memberships, activeTenantId, activeVenueId } = useAuth();
  const venues = useVenues();
  return useMemo(() => {
    const mine = memberships.filter((m) => m.tenantId === activeTenantId && m.status === "active");
    const tenantWide = mine.some((m) => m.venueId === null);
    const bound = new Set(mine.map((m) => m.venueId).filter(Boolean));
    const all = venues.data ?? [];
    const list = tenantWide
      ? all.filter((v) => v.status !== "archived" || v.id === activeVenueId)
      : all.filter((v) => bound.has(v.id));
    return {
      venues: list,
      allVenues: all,
      tenantWide,
      activeVenue: all.find((v) => v.id === activeVenueId) ?? null,
      isLoading: venues.isLoading,
    };
  }, [memberships, activeTenantId, activeVenueId, venues.data, venues.isLoading]);
}

/** Cơ sở đang hoạt động (theo activeVenueId). */
export function useCurrentVenue() {
  const { isAuthenticated, activeVenueId } = useAuth();
  return useQuery({
    queryKey: ["venue", activeVenueId],
    enabled: isAuthenticated && !!activeVenueId,
    queryFn: () => apiGet<Venue>(`/venues/${activeVenueId}`),
  });
}

/** Ngân hàng hỗ trợ VietQR (BIN → tên). */
export function useBanks() {
  return useQuery({
    queryKey: ["banks"],
    queryFn: () => apiGet<Bank[]>("/banks"),
    staleTime: Infinity,
  });
}
