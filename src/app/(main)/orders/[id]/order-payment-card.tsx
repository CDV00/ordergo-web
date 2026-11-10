"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/animated-number";
import { PAYMENT_METHOD_LABEL, usePaymentsForOrder, type Payment } from "@/hooks/api/use-payments";
import { formatDateTime, formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order } from "@/types/api";

const PAYMENT_STATUS_NOTE: Partial<Record<Payment["status"], string>> = {
  pending: "Đang chờ",
  failed: "Thất bại",
  refunded: "Đã hoàn",
  partially_refunded: "Hoàn một phần",
};

/** Payment đã nhận tiền (tính vào số đã thu) */
const COUNTED: Payment["status"][] = ["succeeded", "partially_refunded", "refunded"];

function MoneyRow({
  label,
  value,
  className,
}: {
  label: ReactNode;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 text-sm", className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular font-medium">{value}</span>
    </div>
  );
}

function discountLabel(order: Order) {
  const info = order.discountInfo;
  if (!info) return "Giảm giá";
  const head = info.type === "percent" ? `Giảm ${info.value}%` : `Giảm ${formatVnd(info.value)}`;
  return info.reason ? `${head} · ${info.reason}` : head;
}

export function OrderPaymentCard({ order }: { order: Order }) {
  const payments = usePaymentsForOrder(order.id);
  const { pricing } = order;
  const list = payments.data ?? [];
  const paidTotal = list
    .filter((p) => COUNTED.includes(p.status))
    .reduce((sum, p) => sum + p.amount.amount, 0);
  const remaining = Math.max(0, pricing.total.amount - paidTotal);
  const showRemaining = order.status !== "cancelled";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Thanh toán</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <MoneyRow label="Tạm tính" value={formatVnd(pricing.subtotal.amount)} />
        {pricing.discount.amount > 0 && (
          <MoneyRow
            label={discountLabel(order)}
            value={`−${formatVnd(pricing.discount.amount)}`}
            className="text-success"
          />
        )}
        {pricing.serviceCharge.amount > 0 && (
          <MoneyRow label="Phí phục vụ" value={formatVnd(pricing.serviceCharge.amount)} />
        )}
        {pricing.tax.amount > 0 && <MoneyRow label="Thuế" value={formatVnd(pricing.tax.amount)} />}
        <div className="bg-primary/5 -mx-2 flex items-center justify-between rounded-xl px-3 py-3">
          <span className="font-semibold">Tổng cộng</span>
          <AnimatedNumber
            value={pricing.total.amount}
            format="vnd"
            className="text-primary text-2xl font-bold tracking-tight"
          />
        </div>

        <div className="space-y-2 border-t pt-3">
          <p className="text-sm font-medium">Các lần thu tiền</p>
          {payments.isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : payments.isError ? (
            <p className="text-destructive text-sm">Không tải được danh sách thanh toán.</p>
          ) : list.length === 0 ? (
            <p className="text-muted-foreground text-sm">Chưa thu tiền.</p>
          ) : (
            <ul className="space-y-2">
              {list.map((p) => {
                const note = PAYMENT_STATUS_NOTE[p.status];
                return (
                  <li key={p.id} className="bg-muted/50 rounded-xl px-3 py-2.5 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {PAYMENT_METHOD_LABEL[p.method] ?? p.method}
                        {note && (
                          <span className="text-muted-foreground font-normal"> · {note}</span>
                        )}
                      </span>
                      <span className="tabular font-semibold">{formatVnd(p.amount.amount)}</span>
                    </div>
                    <div className="text-muted-foreground flex flex-wrap justify-between gap-x-3 text-xs">
                      <span>{formatDateTime(p.receivedAt)}</span>
                      {p.method === "cash" && p.tenderedAmount != null && (
                        <span>
                          Khách đưa {formatVnd(p.tenderedAmount)} / Trả lại{" "}
                          {formatVnd(Math.max(0, p.tenderedAmount - p.amount.amount))}
                        </span>
                      )}
                    </div>
                    {p.refundedAmount.amount > 0 && (
                      <p className="text-destructive text-xs">
                        Đã hoàn {formatVnd(p.refundedAmount.amount)}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {showRemaining && !payments.isLoading && (
            <div
              className={cn(
                "flex items-center justify-between rounded-xl px-3 py-2.5 text-base font-semibold",
                remaining > 0
                  ? "bg-warning-soft dark:text-warning text-[oklch(0.45_0.12_60)]"
                  : "bg-success-soft text-success",
              )}
            >
              <span>{remaining > 0 ? "Còn phải thu" : "Đã thu đủ"}</span>
              <AnimatedNumber value={remaining} format="vnd" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
