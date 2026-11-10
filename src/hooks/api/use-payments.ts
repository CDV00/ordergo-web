"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { useLiveInterval } from "@/providers/realtime-provider";

export type PaymentMethod =
  | "cash"
  | "vietqr"
  | "momo"
  | "vnpay"
  | "zalopay"
  | "card"
  | "bank_transfer";

export interface Payment {
  id: string;
  orderId: string;
  orderNumber: string;
  method: PaymentMethod;
  amount: { amount: number; currency: string };
  /** Tiền mặt khách đưa (null với phương thức khác) */
  tenderedAmount: number | null;
  externalRef: string | null;
  receivedAt: string;
  receivedBy: string;
  status: "pending" | "succeeded" | "failed" | "refunded" | "partially_refunded";
  refundedAmount: { amount: number; currency: string };
  refunds: Array<{
    amount: { amount: number; currency: string };
    reason: string | null;
    refundedAt: string;
  }>;
  venueId: string;
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Tiền mặt",
  vietqr: "Chuyển khoản QR",
  momo: "Momo",
  vnpay: "VNPay",
  zalopay: "ZaloPay",
  card: "Thẻ",
  bank_transfer: "Chuyển khoản",
};

/** Danh sách payment theo ngày (YYYY-MM-DD, giờ của cơ sở). Mặc định hôm nay. */
export function usePayments(filter?: { from?: string; to?: string; method?: PaymentMethod }) {
  const { isAuthenticated, activeVenueId } = useAuth();
  const params = new URLSearchParams();
  if (activeVenueId) params.set("venueId", activeVenueId);
  if (filter?.from) params.set("from", filter.from);
  if (filter?.to) params.set("to", filter.to);
  if (filter?.method) params.set("method", filter.method);
  return useQuery({
    queryKey: ["payments", "list", activeVenueId, filter?.from, filter?.to, filter?.method],
    enabled: isAuthenticated && !!activeVenueId,
    queryFn: () => apiGet<Payment[]>(`/payments?${params.toString()}`),
  });
}

export function usePayment(id: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["payments", "one", id],
    enabled: isAuthenticated && !!id,
    queryFn: () => apiGet<Payment>(`/payments/${id}`),
  });
}

export interface PaymentQr {
  orderId: string;
  orderNumber: string;
  amount: number;
  memo: string;
  qrPayload: string;
  bank: { bin: string; name: string; accountNumber: string; accountName: string };
}

/** VietQR cho phần còn phải thu. Lỗi NO_BANK_ACCOUNT khi quán chưa cấu hình tài khoản. */
export function usePaymentQr(orderId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["payment-qr", orderId],
    enabled: !!orderId && enabled,
    queryFn: () => apiGet<PaymentQr>(`/orders/${orderId}/payment-qr`),
    retry: false,
  });
}

export function usePaymentsForOrder(orderId: string | null) {
  return useQuery({
    queryKey: ["payments", orderId],
    enabled: !!orderId,
    queryFn: () => apiGet<Payment[]>(`/orders/${orderId}/payments`),
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      method,
      amount,
      tenderedAmount,
      externalRef,
    }: {
      orderId: string;
      method: PaymentMethod;
      amount: number;
      tenderedAmount?: number;
      externalRef?: string;
    }) =>
      apiPost<{
        payment: Payment;
        order: { id: string; status: string };
        paidTotal: number;
        totalDue: number;
      }>(`/orders/${orderId}/payments`, { method, amount, tenderedAmount, externalRef }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["tables"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["payment-qr", vars.orderId] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useRefundPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount, reason }: { id: string; amount: number; reason?: string }) =>
      apiPost<Payment>(`/payments/${id}/refund`, { amount, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

// ─── Khách báo thanh toán từ trang QR (chờ nhân viên xác nhận) ─────────────

export type PaymentRequestMethod = "vietqr" | "cash" | "card";

export const PAYMENT_REQUEST_LABEL: Record<PaymentRequestMethod, string> = {
  vietqr: "Báo đã chuyển khoản",
  cash: "Muốn trả tiền mặt",
  card: "Muốn quẹt thẻ",
};

export interface PendingPaymentRequest {
  orderId: string;
  orderNumber: string;
  venueId: string;
  tableName: string | null;
  source: string;
  status: string;
  total: number;
  paidAmount: number;
  amountDue: number;
  method: PaymentRequestMethod;
  requestedAt: string;
}

/**
 * Đơn khách đã báo thanh toán nhưng chưa ai xác nhận. Key nằm dưới ["orders"] nên sự kiện
 * realtime order.changed tự làm mới; poll dự phòng khi mất kết nối socket.
 */
export function usePendingPaymentRequests() {
  const { isAuthenticated, activeVenueId } = useAuth();
  const interval = useLiveInterval(10_000);
  return useQuery({
    queryKey: ["orders", "payment-requests", activeVenueId],
    enabled: isAuthenticated && !!activeVenueId,
    refetchInterval: interval,
    queryFn: () =>
      apiGet<PendingPaymentRequest[]>(`/payments/pending?venueId=${activeVenueId ?? ""}`),
  });
}
