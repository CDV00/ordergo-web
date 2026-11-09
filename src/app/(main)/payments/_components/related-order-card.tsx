"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrder } from "@/hooks/api/use-orders";
import { formatVnd, ORDER_STATUS_CLASS, ORDER_STATUS_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order } from "@/types/api";
import { errorMessage } from "./payment-status";

function TotalRow({
  label,
  value,
  className,
}: {
  label: ReactNode;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("flex justify-between text-sm", className)}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function tableLabel(o: Order): string {
  if (o.tableName) return o.tableName;
  return o.orderType === "takeaway" ? "Mang về" : "—";
}

/** Đơn hàng liên quan tới giao dịch: món, giảm giá, tổng. */
export function RelatedOrderCard({ orderId }: { orderId: string }) {
  const order = useOrder(orderId);
  const o = order.data;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-lg">
          <span>Đơn hàng</span>
          {o && (
            <Badge className={cn("border-transparent", ORDER_STATUS_CLASS[o.status])}>
              {ORDER_STATUS_LABEL[o.status]}
            </Badge>
          )}
        </CardTitle>
        {o && (
          <CardDescription>
            <Link href={`/orders/${o.id}`} className="text-primary font-medium hover:underline">
              {o.orderNumber}
            </Link>{" "}
            · {tableLabel(o)}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {order.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : order.error || !o ? (
          <p className="text-muted-foreground text-sm">
            Không tải được đơn hàng
            {order.error ? `: ${errorMessage(order.error)}` : "."}
          </p>
        ) : (
          <OrderBody order={o} />
        )}
      </CardContent>
    </Card>
  );
}

function OrderBody({ order: o }: { order: Order }) {
  const lines = o.lines.filter((l) => l.kitchenStatus !== "cancelled");
  const { subtotal, discount, serviceCharge, tax, total } = o.pricing;

  return (
    <div className="space-y-3">
      {lines.length === 0 ? (
        <p className="text-muted-foreground text-sm">Đơn không có món.</p>
      ) : (
        <ul className="space-y-2">
          {lines.map((l) => {
            const extras = [
              l.variantSnapshot?.name,
              ...l.modifiers.map((m) => m.optionName),
            ].filter(Boolean);
            return (
              <li key={l.id} className="flex justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div>
                    {l.productSnapshot.name}{" "}
                    <span className="text-muted-foreground">×{l.quantity}</span>
                  </div>
                  {extras.length > 0 && (
                    <div className="text-muted-foreground text-xs">{extras.join(", ")}</div>
                  )}
                  {l.note && <div className="text-muted-foreground text-xs italic">{l.note}</div>}
                </div>
                <span className="shrink-0 tabular-nums">{formatVnd(l.lineTotal.amount)}</span>
              </li>
            );
          })}
        </ul>
      )}

      <Separator />
      <div className="space-y-1">
        <TotalRow label="Tạm tính" value={formatVnd(subtotal.amount)} />
        {discount.amount > 0 && (
          <TotalRow
            label={
              <>
                Giảm giá
                {o.discountInfo?.type === "percent" && ` (${o.discountInfo.value}%)`}
                {o.discountInfo?.reason && (
                  <span className="text-muted-foreground"> · {o.discountInfo.reason}</span>
                )}
              </>
            }
            value={`−${formatVnd(discount.amount)}`}
            className="text-emerald-700 dark:text-emerald-400"
          />
        )}
        {serviceCharge.amount > 0 && (
          <TotalRow label="Phí dịch vụ" value={formatVnd(serviceCharge.amount)} />
        )}
        {tax.amount > 0 && <TotalRow label="Thuế" value={formatVnd(tax.amount)} />}
        <TotalRow
          label="Tổng cộng"
          value={formatVnd(total.amount)}
          className="border-t pt-2 text-base font-semibold"
        />
      </div>
    </div>
  );
}
