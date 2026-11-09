"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";

/**
 * Khách hàng + thẻ thành viên. Server LUÔN trả PII đã che (tên, SĐT, email, ngày sinh);
 * bản đầy đủ chỉ qua `useRevealCustomer` (chủ quán, có audit) và KHÔNG được lưu vào cache query.
 * Không đưa PII vào URL / query key — ngoại lệ duy nhất là chuỗi tìm kiếm người dùng gõ.
 */

export type CustomerStatus = "anonymous" | "verified" | "full";
export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";
export type LoyaltyTxType = "earn" | "redeem" | "adjust" | "expire";

export interface Money {
  amount: number;
  currency: string;
}

export interface CustomerListItem {
  id: string;
  status: CustomerStatus;
  /** Đã che, vd "Trần T** L**" */
  name: string | null;
  /** Đã che, vd "090****567" */
  phone: string | null;
  visits: number;
  totalSpent: Money;
  lastVisitAt: string | null;
  loyalty: { tier: LoyaltyTier; points: number } | null;
  anonymizedAt: string | null;
}

export interface CustomerPage {
  data: CustomerListItem[];
  pagination: { page: number; pageSize: number; total: number };
}

export interface CustomerDetail {
  id: string;
  status: CustomerStatus;
  name: string | null;
  phone: string | null;
  email: string | null;
  /** Đã che, vd "**\/**\/1990" */
  birthday: string | null;
  tags: string[];
  note: string | null;
  stats: {
    visits: number;
    totalSpent: Money;
    firstVisitAt: string | null;
    lastVisitAt: string | null;
  };
  marketingConsent: boolean;
  createdAt: string;
  anonymizedAt: string | null;
  loyalty: {
    tier: LoyaltyTier;
    points: number;
    pointsLifetime: number;
    spentLifetime: number;
  } | null;
  transactions: Array<{
    id: string;
    type: LoyaltyTxType;
    points: number;
    reason: string;
    referenceType: "order" | "manual" | "system";
    referenceId: string | null;
    balanceAfter: number;
    createdAt: string;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    total: Money;
    status: string;
    createdAt: string;
  }>;
}

/** Thông tin đầy đủ (chưa che) — chỉ giữ trong state cục bộ, có hạn. */
export interface RevealedCustomer {
  name: string | null;
  phone: string | null;
  email: string | null;
  /** YYYY-MM-DD */
  birthday: string | null;
}

/** `undefined` = giữ nguyên, `null` = xoá. */
export interface UpdateCustomerInput {
  name?: string | null;
  email?: string | null;
  birthday?: string | null;
  tags?: string[];
  note?: string | null;
}

export const CUSTOMER_STATUS_LABEL: Record<CustomerStatus, string> = {
  anonymous: "Vãng lai",
  verified: "Đã xác thực",
  full: "Thành viên",
};

export const LOYALTY_TIER_LABEL: Record<LoyaltyTier, string> = {
  bronze: "Đồng",
  silver: "Bạc",
  gold: "Vàng",
  platinum: "Bạch kim",
};

export const LOYALTY_TIER_CLASS: Record<LoyaltyTier, string> = {
  bronze: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  silver: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
  gold: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  platinum: "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300",
};

export const LOYALTY_TX_LABEL: Record<LoyaltyTxType, string> = {
  earn: "Tích điểm",
  redeem: "Đổi điểm",
  adjust: "Điều chỉnh",
  expire: "Hết hạn",
};

export interface CustomerFilter {
  q?: string;
  status?: CustomerStatus;
  page?: number;
  pageSize?: number;
}

export function useCustomers(filter: CustomerFilter) {
  const { isAuthenticated } = useAuth();
  const q = filter.q?.trim() || undefined;
  const page = filter.page ?? 1;
  const pageSize = filter.pageSize ?? 20;
  return useQuery({
    // Chuỗi tìm kiếm là PII duy nhất được phép trong key (người dùng tự gõ).
    queryKey: ["customers", "list", { q, status: filter.status, page, pageSize }],
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      // Gửi qua `params` (axios) — không tự ghép vào chuỗi URL ở client.
      const res = await api.get<CustomerPage>("/customers", {
        params: { q, status: filter.status, page, pageSize },
      });
      return res.data;
    },
  });
}

export function useCustomer(id: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["customers", "one", id],
    enabled: isAuthenticated && !!id,
    queryFn: () => apiGet<CustomerDetail>(`/customers/${id}`),
    retry: (count, err) => {
      const status = (err as { status?: number }).status;
      return status !== 403 && status !== 404 && count < 2;
    },
  });
}

/** Xem thông tin đầy đủ — không cache, không retry (mỗi lần gọi = 1 dòng audit). */
export function useRevealCustomer() {
  return useMutation({
    mutationFn: (id: string) => apiPost<RevealedCustomer>(`/customers/${id}/reveal`),
    retry: false,
    gcTime: 0,
  });
}

export function useUpdateCustomer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCustomerInput) => apiPatch<CustomerDetail>(`/customers/${id}`, input),
    onSuccess: (data) => {
      qc.setQueryData(["customers", "one", id], data);
      qc.invalidateQueries({ queryKey: ["customers", "list"] });
    },
  });
}

export function useAnonymizeCustomer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<CustomerDetail>(`/customers/${id}/anonymize`),
    onSuccess: (data) => {
      qc.setQueryData(["customers", "one", id], data);
      qc.invalidateQueries({ queryKey: ["customers", "list"] });
    },
  });
}
