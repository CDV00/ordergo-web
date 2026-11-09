"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { useLiveInterval } from "@/providers/realtime-provider";
import type { Payment, PaymentMethod } from "./use-payments";

export type ShiftStatus = "open" | "closed";

/** Tổng hợp ca (tiền = số nguyên VND). Ca đang mở: số liệu tạm tính đến hiện tại. */
export interface ShiftSummary {
  byMethod: Array<{ method: PaymentMethod; count: number; amount: number }>;
  totalReceived: number;
  paymentCount: number;
  paidOrderCount: number;
  cashReceived: number;
  cashRefunds: number;
  refundTotal: number;
  refundCount: number;
}

export interface Shift {
  id: string;
  venueId: string;
  status: ShiftStatus;
  openedBy: string;
  openedByName: string | null;
  openedAt: string;
  openingCash: number;
  closedBy: string | null;
  closedByName: string | null;
  closedAt: string | null;
  countedCash: number | null;
  /** Ca đang mở: tiền mặt dự kiến tạm tính; ca đã đóng: chốt lúc đóng. */
  expectedCash: number | null;
  difference: number | null;
  note: string | null;
  summary: ShiftSummary | null;
}

export interface ShiftDetail extends Shift {
  payments: Payment[];
}

/*
 * Query key bắt đầu bằng "payments" để realtime (payment.changed) và các mutation thu/hoàn tiền
 * — vốn invalidate ["payments"] — tự làm mới số liệu ca.
 */
const shiftKeys = {
  all: ["payments", "shifts"] as const,
  current: (venueId: string | null) => ["payments", "shifts", "current", venueId] as const,
  list: (venueId: string | null, from?: string, to?: string) =>
    ["payments", "shifts", "list", venueId, from, to] as const,
  one: (id: string) => ["payments", "shifts", "one", id] as const,
};

/** Ca đang mở của cơ sở đang chọn (null nếu chưa mở ca). */
export function useCurrentShift(enabled = true) {
  const { isAuthenticated, activeVenueId } = useAuth();
  const interval = useLiveInterval(30_000);
  return useQuery({
    queryKey: shiftKeys.current(activeVenueId),
    enabled: enabled && isAuthenticated && !!activeVenueId,
    queryFn: () => apiGet<Shift | null>(`/shifts/current?venueId=${activeVenueId}`),
    refetchInterval: interval,
    retry: false,
  });
}

/** Danh sách ca theo ngày mở ca (YYYY-MM-DD, giờ của cơ sở). */
export function useShifts(filter: { from?: string; to?: string }) {
  const { isAuthenticated, activeVenueId } = useAuth();
  const params = new URLSearchParams();
  if (activeVenueId) params.set("venueId", activeVenueId);
  if (filter.from) params.set("from", filter.from);
  if (filter.to) params.set("to", filter.to);
  return useQuery({
    queryKey: shiftKeys.list(activeVenueId, filter.from, filter.to),
    enabled: isAuthenticated && !!activeVenueId,
    queryFn: () => apiGet<Shift[]>(`/shifts?${params.toString()}`),
  });
}

export function useShift(id: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: shiftKeys.one(id),
    enabled: isAuthenticated && !!id,
    queryFn: () => apiGet<ShiftDetail>(`/shifts/${id}`),
  });
}

export function useOpenShift() {
  const qc = useQueryClient();
  const { activeVenueId } = useAuth();
  return useMutation({
    mutationFn: ({ openingCash, note }: { openingCash: number; note?: string }) =>
      apiPost<Shift>("/shifts/open", { venueId: activeVenueId, openingCash, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shiftKeys.all });
    },
  });
}

export function useCloseShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, countedCash, note }: { id: string; countedCash: number; note?: string }) =>
      apiPost<Shift>(`/shifts/${id}/close`, { countedCash, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shiftKeys.all });
    },
  });
}

/** Người dùng có quyền mở/đóng ca không (`shift.manage` ⊇ `shift.*`, `*` = chủ quán). */
export function canUseShift(permissions: string[], action: "open" | "close" | "manage"): boolean {
  return (
    permissions.includes("*") ||
    permissions.includes("shift.manage") ||
    permissions.includes(`shift.${action}`)
  );
}
