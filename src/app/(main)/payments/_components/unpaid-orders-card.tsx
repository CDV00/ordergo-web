"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { QrCode, ShoppingBag, Wallet } from "lucide-react";
import { AnimatedNumber } from "@/components/animated-number";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/hooks/api/use-orders";
import { usePermissions } from "@/hooks/use-permissions";
import {
  formatTime,
  formatVnd,
  minutesSince,
  ORDER_STATUS_CLASS,
  ORDER_STATUS_LABEL,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { PaymentDialog } from "../../pos/_components/payment-dialog";

/**
 * "Chưa thu": mọi đơn đang mở của cơ sở (chưa thanh toán, chưa huỷ), đơn chờ lâu nhất lên đầu.
 * Thu tiền ngay tại đây bằng hộp thoại thanh toán của POS (giảm giá, tiền mặt/QR/thẻ, tiền thối).
 * Đơn khách đã báo thanh toán nằm ở thẻ "Chờ xác nhận" phía trên nên không lặp lại ở đây.
 */
export function UnpaidOrdersCard() {
  const { can } = usePermissions();
  const open = useOrders({ status: "open" });
  const [payingId, setPayingId] = useState<string | null>(null);

  if (!can("order.pay")) return null;

  const orders = (open.data ?? [])
    .filter((o) => !o.paymentRequest && o.lines.length > 0)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const total = orders.reduce((s, o) => s + o.pricing.total.amount, 0);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                  <Wallet className="size-4" />
                </span>
                Chưa thu
                {orders.length > 0 && <Badge variant="soft">{orders.length}</Badge>}
              </CardTitle>
              <CardDescription className="mt-1">
                Đơn đang phục vụ chưa thanh toán · chờ lâu nhất lên đầu
              </CardDescription>
            </div>
            {orders.length > 0 && (
              <div className="text-right">
                <div className="text-muted-foreground text-xs">Tổng chưa thu</div>
                <div className="text-xl font-bold">
                  <AnimatedNumber value={total} format="vnd" />
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {open.isLoading ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <p className="text-muted-foreground bg-muted/40 rounded-xl px-4 py-6 text-center text-sm">
              Không còn đơn nào chưa thu 🎉
            </p>
          ) : (
            <ul className="space-y-2" aria-label="Đơn chưa thu">
              <AnimatePresence initial={false}>
                {orders.map((o) => {
                  const mins = minutesSince(o.createdAt);
                  return (
                    <motion.li
                      key={o.id}
                      layout
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 24 }}
                      className="bg-card flex flex-col gap-3 rounded-xl border p-3 shadow-xs sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold">
                          {o.tableName ?? <ShoppingBag className="text-muted-foreground size-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <Link
                              href={`/orders/${o.id}`}
                              className="truncate font-semibold hover:underline"
                            >
                              {o.orderNumber}
                            </Link>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-medium",
                                ORDER_STATUS_CLASS[o.status],
                              )}
                            >
                              {ORDER_STATUS_LABEL[o.status]}
                            </span>
                            {o.source === "qr_menu" && (
                              <Badge variant="info">
                                <QrCode /> Khách gọi QR
                              </Badge>
                            )}
                          </div>
                          <div className="text-muted-foreground mt-0.5 text-xs">
                            {o.tableName ? `Bàn ${o.tableName}` : "Mang về"} · từ{" "}
                            {formatTime(o.createdAt)}
                            <span className={cn(mins >= 60 && "text-destructive font-medium")}>
                              {" "}
                              (
                              {mins >= 60 ? `${Math.floor(mins / 60)}g${mins % 60}ph` : `${mins}ph`}
                              )
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <div className="tabular text-lg font-bold">
                          {formatVnd(o.pricing.total.amount)}
                        </div>
                        <Button onClick={() => setPayingId(o.id)}>Thu tiền</Button>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </CardContent>
      </Card>

      <PaymentDialog orderId={payingId} open={!!payingId} onClose={() => setPayingId(null)} />
    </>
  );
}
