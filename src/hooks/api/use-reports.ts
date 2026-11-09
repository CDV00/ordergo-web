"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api, ApiException, apiGet, type ApiError } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { useLiveInterval } from "@/providers/realtime-provider";

export interface DailySalesSummary {
  date: string;
  venueId: string | null;
  orders: { count: number; cancelledCount: number };
  revenue: { gross: number; net: number; currency: "VND" };
  byPaymentStatus: { paid: number; pending: number };
  byHour: Array<{ hour: number; orderCount: number; revenue: number }>;
  topItems: Array<{ menuItemId: string; name: string; quantity: number; revenue: number }>;
}

export function useTodaySummary(venueId?: string | null) {
  const { isAuthenticated, activeVenueId } = useAuth();
  const interval = useLiveInterval(30_000);
  const v = venueId ?? activeVenueId;
  return useQuery({
    queryKey: ["reports", "today", v],
    enabled: isAuthenticated,
    queryFn: () => apiGet<DailySalesSummary>(`/reports/today${v ? `?venueId=${v}` : ""}`),
    refetchInterval: interval,
  });
}

/** `date` = YYYY-MM-DD theo giờ của cơ sở. */
export function useDailySummary(date: string) {
  const { isAuthenticated, activeVenueId } = useAuth();
  return useQuery({
    queryKey: ["reports", "daily", activeVenueId, date],
    enabled: isAuthenticated && !!activeVenueId,
    queryFn: () =>
      apiGet<DailySalesSummary>(`/reports/daily?venueId=${activeVenueId}&date=${date}`),
  });
}

// ─── Báo cáo bán hàng theo khoảng ngày (GET /reports/sales) ───

/** Báo cáo bán hàng `from`..`to` (YYYY-MM-DD, giờ cơ sở). Mọi số tiền là số nguyên VND. */
export interface SalesReport {
  venueId: string | null;
  timezone: string;
  from: string;
  to: string;
  currency: "VND";
  totals: {
    /** Tiền đã thu trong khoảng − tiền hoàn trong khoảng. */
    netRevenue: number;
    collected: number;
    refunds: number;
    /** Tổng giá trị đơn không bị huỷ. */
    grossOrderValue: number;
    orders: number;
    cancelledOrders: number;
    averageTicket: number;
    discountTotal: number;
    serviceChargeTotal: number;
  };
  daily: Array<{ date: string; revenue: number; orders: number }>;
  byPaymentMethod: Array<{ method: string; amount: number; refunded: number; count: number }>;
  topItems: Array<{ menuItemId: string; name: string; quantity: number; revenue: number }>;
  byHour: Array<{ hour: number; orders: number; revenue: number }>;
  byStaff: Array<{
    userId: string | null;
    displayName: string;
    paymentsCount: number;
    paymentsAmount: number;
    ordersCreated: number;
  }>;
}

export interface ReportRangeParams {
  from: string;
  to: string;
}

function rangeQuery(venueId: string | null, r: ReportRangeParams): string {
  const q = new URLSearchParams({ from: r.from, to: r.to });
  if (venueId) q.set("venueId", venueId);
  return q.toString();
}

export function useSalesReport(range: ReportRangeParams) {
  const { isAuthenticated, activeVenueId } = useAuth();
  return useQuery({
    queryKey: ["reports", "sales", activeVenueId, range.from, range.to],
    enabled: isAuthenticated && !!range.from && !!range.to,
    queryFn: () => apiGet<SalesReport>(`/reports/sales?${rangeQuery(activeVenueId, range)}`),
    // Lỗi quyền/khoảng ngày không nên thử lại
    retry: false,
  });
}

/**
 * Tải CSV báo cáo (blob) và kích hoạt tải xuống.
 * Với `responseType: "blob"` body lỗi `{ error }` cũng là Blob, nên nhận mọi status trừ 401
 * (401 vẫn đi qua interceptor để refresh token) rồi tự đọc lỗi → `ApiException` có code/message.
 */
export function useExportSalesReport() {
  const { activeVenueId } = useAuth();
  return useMutation({
    mutationFn: async (range: ReportRangeParams) => {
      const res = await api.get<Blob>(
        `/reports/sales/export?${rangeQuery(activeVenueId, range)}&format=csv`,
        { responseType: "blob", timeout: 60_000, validateStatus: (s) => s !== 401 },
      );
      if (res.status >= 400) throw await blobError(res.data, res.status);
      const filename = `bao-cao-${range.from}_${range.to}.csv`;
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1_000);
      return filename;
    },
  });
}

async function blobError(data: Blob, status: number): Promise<ApiException> {
  try {
    const body = JSON.parse(await data.text()) as { error?: ApiError };
    if (body.error?.code) return new ApiException(body.error, status);
  } catch {
    // body không phải JSON
  }
  return new ApiException({ code: "ERROR", message: "Không xuất được báo cáo." }, status);
}
