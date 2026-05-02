"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";

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
  receivedAt: string;
  receivedBy: string;
  status: "pending" | "succeeded" | "failed" | "refunded" | "partially_refunded";
  refundedAmount: { amount: number; currency: string };
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
      externalRef,
    }: {
      orderId: string;
      method: PaymentMethod;
      amount: number;
      externalRef?: string;
    }) =>
      apiPost<{
        payment: Payment;
        order: { id: string; status: string };
        paidTotal: number;
        totalDue: number;
      }>(`/orders/${orderId}/payments`, { method, amount, externalRef }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["payments", vars.orderId] });
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
