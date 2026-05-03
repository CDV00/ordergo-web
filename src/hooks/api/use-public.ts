"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pubGet, pubPost } from "@/lib/public-api-client";
import type { MenuCategory, MenuItem, Order } from "@/types/api";

export interface PublicSessionInfo {
  id: string;
  tableName: string;
  venueId: string;
  status: "open" | "paying" | "closed";
  orderCount: number;
  totalAmount: { amount: number; currency: string };
  paidAmount?: { amount: number; currency: string };
}

export interface PublicScanResponse {
  session: PublicSessionInfo;
  customer: {
    id: string;
    status: "anonymous" | "verified" | "full";
    name: string | null;
  };
  isNewSession: boolean;
  isNewCustomer: boolean;
}

export interface PublicMenuResponse {
  venue: { id: string; name: string; currency: string };
  categories: MenuCategory[];
  items: MenuItem[];
}

/** POST scan QR — gọi 1 lần khi vào trang t/[tableId] */
export function useScanQr() {
  return useMutation({
    mutationFn: ({ tenantSlug, tableId }: { tenantSlug: string; tableId: string }) =>
      pubPost<PublicScanResponse>(`/public/qr/${tenantSlug}/${tableId}`),
  });
}

export function usePublicSession(sessionId: string | null) {
  return useQuery({
    queryKey: ["public-session", sessionId],
    enabled: !!sessionId,
    queryFn: () => pubGet<PublicSessionInfo>(`/public/sessions/${sessionId}`),
    refetchInterval: 30_000,
  });
}

export function usePublicMenu(sessionId: string | null) {
  return useQuery({
    queryKey: ["public-menu", sessionId],
    enabled: !!sessionId,
    queryFn: () => pubGet<PublicMenuResponse>(`/public/sessions/${sessionId}/menu`),
    staleTime: 60_000,
  });
}

export interface PublicCreateOrderInput {
  lines: Array<{
    menuItemId: string;
    variantId?: string;
    toppingOptionIds?: string[];
    quantity: number;
    note?: string;
  }>;
  guestName?: string;
}

export function useCreatePublicOrder(sessionId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PublicCreateOrderInput) => {
      if (!sessionId) throw new Error("Missing sessionId");
      return pubPost<Order>(`/public/sessions/${sessionId}/orders`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["public-session", sessionId] });
      qc.invalidateQueries({ queryKey: ["public-orders", sessionId] });
    },
  });
}

export function usePublicSessionOrders(sessionId: string | null) {
  return useQuery({
    queryKey: ["public-orders", sessionId],
    enabled: !!sessionId,
    queryFn: () => pubGet<Order[]>(`/public/sessions/${sessionId}/orders`),
    refetchInterval: 4_000, // realtime track polling
  });
}

// ─── Customer claim (OTP) ─────────────────────────────────────────────

export function useRequestOtp() {
  return useMutation({
    mutationFn: ({ phone }: { phone: string }) =>
      pubPost<{ phone: string; expiresAt: string }>(`/public/auth/otp/request`, {
        phone,
      }),
  });
}

export interface ClaimResult {
  customerId: string;
  userId: string;
  merged: boolean;
  name: string | null;
}

export function useClaimWithOtp(sessionId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { phone: string; code: string; name?: string }) => {
      if (!sessionId) throw new Error("No session");
      return pubPost<ClaimResult>(`/public/sessions/${sessionId}/claim`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["public-me", sessionId] });
      qc.invalidateQueries({ queryKey: ["public-session", sessionId] });
    },
  });
}

export interface PublicCustomerSelf {
  id: string;
  status: "anonymous" | "verified" | "full";
  name: string | null;
  phone: string | null;
  stats: {
    totalSpent: { amount: number; currency: string };
    orderCount: number;
    firstOrderAt: string | null;
    lastOrderAt: string | null;
  };
}

export function usePublicMe(sessionId: string | null) {
  return useQuery({
    queryKey: ["public-me", sessionId],
    enabled: !!sessionId,
    queryFn: () => pubGet<PublicCustomerSelf | null>(`/public/sessions/${sessionId}/me`),
  });
}

// ─── VietQR self-pay ──────────────────────────────────────────────────

export interface PaymentQrResponse {
  orderId: string;
  orderNumber: string;
  amount: number;
  qrPayload: string;
  bank: { bin: string; name: string; accountNumber: string; accountName: string };
  memo: string;
}

export function useGeneratePaymentQr(sessionId: string | null) {
  return useMutation({
    mutationFn: ({ orderId }: { orderId: string }) => {
      if (!sessionId) throw new Error("No session");
      return pubPost<PaymentQrResponse>(
        `/public/sessions/${sessionId}/orders/${orderId}/payment-qr`,
      );
    },
  });
}
