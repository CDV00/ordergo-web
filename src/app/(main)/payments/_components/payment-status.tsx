import { Badge } from "@/components/ui/badge";
import { ApiException } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Payment } from "@/hooks/api/use-payments";

export type PaymentStatus = Payment["status"];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  succeeded: "Thành công",
  partially_refunded: "Hoàn một phần",
  refunded: "Đã hoàn",
  failed: "Thất bại",
  pending: "Chờ",
};

export const PAYMENT_STATUS_CLASS: Record<PaymentStatus, string> = {
  succeeded: "bg-success-soft text-success",
  partially_refunded: "bg-warning-soft text-[oklch(0.5_0.12_70)] dark:text-warning",
  refunded: "bg-destructive/10 text-destructive",
  failed: "bg-destructive/10 text-destructive",
  pending: "bg-muted text-muted-foreground",
};

export function PaymentStatusBadge({
  status,
  className,
}: {
  status: PaymentStatus;
  className?: string;
}) {
  return (
    <Badge className={cn("border-transparent", PAYMENT_STATUS_CLASS[status], className)}>
      {PAYMENT_STATUS_LABEL[status]}
    </Badge>
  );
}

/** Giao dịch có tính vào tiền đã thu không (thành công hoặc mới hoàn một phần). */
export function isCollected(p: Payment): boolean {
  return p.status === "succeeded" || p.status === "partially_refunded";
}

/** Số tiền đã hoàn của giao dịch. */
export function refundedOf(p: Payment): number {
  return p.refundedAmount?.amount ?? 0;
}

/** Tiền thực thu = số tiền − đã hoàn; 0 với giao dịch không tính vào doanh thu. */
export function netCollected(p: Payment): number {
  return isCollected(p) ? p.amount.amount - refundedOf(p) : 0;
}

/** Số tiền còn có thể hoàn. */
export function refundableAmount(p: Payment): number {
  return isCollected(p) ? Math.max(0, p.amount.amount - refundedOf(p)) : 0;
}

export function isForbidden(err: unknown): boolean {
  return err instanceof ApiException && err.status === 403;
}

export function isNotFound(err: unknown): boolean {
  return err instanceof ApiException && err.status === 404;
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiException) return err.error?.message ?? err.message;
  if (err instanceof Error) return err.message;
  return "Đã có lỗi xảy ra, vui lòng thử lại.";
}
