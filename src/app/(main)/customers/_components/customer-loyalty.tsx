"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LOYALTY_TX_LABEL, type CustomerDetail } from "@/hooks/api/use-customers";
import { formatDateTime, formatVnd, ORDER_STATUS_CLASS, ORDER_STATUS_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/api";
import { TierBadge } from "./customer-utils";

const points = (n: number) => n.toLocaleString("vi-VN");

export function LoyaltyCard({ customer }: { customer: CustomerDetail }) {
  const card = customer.loyalty;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg sm:text-xl">Thẻ thành viên</CardTitle>
          {card && <TierBadge tier={card.tier} />}
        </div>
        {!card && (
          <CardDescription>
            Chưa có thẻ — khách được cấp thẻ khi xác thực số điện thoại và thanh toán đơn đầu tiên.
          </CardDescription>
        )}
      </CardHeader>
      {card && (
        <CardContent className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-muted rounded-md p-3">
            <div className="text-xl font-bold tabular-nums">{points(card.points)}</div>
            <div className="text-muted-foreground text-xs">Điểm hiện có</div>
          </div>
          <div className="bg-muted rounded-md p-3">
            <div className="text-xl font-bold tabular-nums">{points(card.pointsLifetime)}</div>
            <div className="text-muted-foreground text-xs">Điểm tích luỹ</div>
          </div>
          <div className="bg-muted rounded-md p-3">
            <div className="text-xl font-bold tabular-nums">{formatVnd(card.spentLifetime)}</div>
            <div className="text-muted-foreground text-xs">Tổng chi tích điểm</div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function LoyaltyTransactionsCard({ customer }: { customer: CustomerDetail }) {
  const txs = customer.transactions;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg sm:text-xl">Lịch sử điểm</CardTitle>
        <CardDescription>20 giao dịch gần nhất</CardDescription>
      </CardHeader>
      <CardContent>
        {txs.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">Chưa có giao dịch điểm.</p>
        ) : (
          <ul className="divide-y">
            {txs.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{LOYALTY_TX_LABEL[t.type] ?? t.type}</div>
                  <div className="text-muted-foreground text-xs">{formatDateTime(t.createdAt)}</div>
                </div>
                <div className="text-right tabular-nums">
                  <div
                    className={cn(
                      "text-sm font-semibold",
                      t.points >= 0
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {t.points >= 0 ? "+" : "−"}
                    {points(Math.abs(t.points))}
                  </div>
                  <div className="text-muted-foreground text-xs">Còn {points(t.balanceAfter)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function RecentOrdersCard({ customer }: { customer: CustomerDetail }) {
  const orders = customer.recentOrders;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg sm:text-xl">Đơn gần đây</CardTitle>
        <CardDescription>10 đơn mới nhất</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">Chưa có đơn nào.</p>
        ) : (
          <ul className="divide-y">
            {orders.map((o) => {
              const status = o.status as OrderStatus;
              return (
                <li key={o.id}>
                  <Link
                    href={`/orders/${o.id}`}
                    className="hover:bg-muted/50 flex min-h-[44px] items-center gap-3 rounded-md px-1 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{o.orderNumber}</span>
                        <Badge
                          className={cn("border-transparent", ORDER_STATUS_CLASS[status] ?? "")}
                        >
                          {ORDER_STATUS_LABEL[status] ?? o.status}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {formatDateTime(o.createdAt)}
                      </div>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatVnd(o.total.amount)}
                    </span>
                    <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
