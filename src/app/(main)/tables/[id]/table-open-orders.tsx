"use client";

import Link from "next/link";
import { ChevronRight, ReceiptText } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ORDER_STATUS_CLASS,
  ORDER_STATUS_LABEL,
  formatTime,
  formatVnd,
  minutesSince,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order } from "@/types/api";

interface Props {
  orders: Order[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function OrderRow({ order }: { order: Order }) {
  const active = order.lines.filter((l) => l.kitchenStatus !== "cancelled");
  const unsent = active.filter((l) => !l.sentToKitchenAt).length;
  return (
    <li className="bg-card rounded-xl border p-3.5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/orders/${order.id}`} className="font-semibold hover:underline">
            {order.orderNumber}
          </Link>
          <Badge className={cn("border-transparent", ORDER_STATUS_CLASS[order.status])}>
            {ORDER_STATUS_LABEL[order.status]}
          </Badge>
          {unsent > 0 && (
            <Badge variant="outline" className="text-muted-foreground border-dashed">
              {unsent} món chưa gửi bếp
            </Badge>
          )}
        </div>
        <span className="text-muted-foreground text-xs">
          {formatTime(order.createdAt)} · {minutesSince(order.createdAt)} phút trước
        </span>
      </div>
      {active.length > 0 ? (
        <ul className="text-muted-foreground mt-2 space-y-0.5 text-sm">
          {active.map((l) => (
            <li key={l.id} className="flex justify-between gap-2">
              <span className="truncate">
                {l.quantity}× {l.productSnapshot.name}
                {l.variantSnapshot ? ` (${l.variantSnapshot.name})` : ""}
              </span>
              <span className="shrink-0">{formatVnd(l.lineTotal.amount)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground mt-2 text-sm">Chưa có món.</p>
      )}
      <div className="mt-2 flex items-center justify-between border-t pt-2">
        <span className="font-semibold tabular-nums">
          Tổng: {formatVnd(order.pricing.total.amount)}
        </span>
        <Button asChild size="sm" variant="ghost">
          <Link href={`/orders/${order.id}`}>
            Chi tiết <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </li>
  );
}

export function TableOpenOrders({ orders, isLoading, isError, onRetry }: Props) {
  const list = orders ?? [];
  const sum = list.reduce((s, o) => s + o.pricing.total.amount, 0);

  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Đơn đang mở</CardTitle>
        <CardDescription>
          {list.length > 0
            ? `${list.length} đơn · Tạm tính ${formatVnd(sum)}`
            : "Các đơn chưa thanh toán của bàn"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-destructive text-sm">Không tải được đơn của bàn.</p>
            <Button size="sm" variant="outline" onClick={onRetry}>
              Thử lại
            </Button>
          </div>
        ) : list.length === 0 ? (
          <EmptyState icon={ReceiptText} title="Bàn chưa có đơn nào đang mở." className="py-8" />
        ) : (
          <ul className="space-y-3">
            {list.map((o) => (
              <OrderRow key={o.id} order={o} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
