"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { BellRing, Banknote, CreditCard, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PAYMENT_REQUEST_LABEL,
  useCreatePayment,
  usePendingPaymentRequests,
  type PendingPaymentRequest,
} from "@/hooks/api/use-payments";
import { usePermissions } from "@/hooks/use-permissions";
import { formatTime, formatVnd } from "@/lib/format";
import type { ApiException } from "@/lib/api-client";

const ICON = { vietqr: QrCode, cash: Banknote, card: CreditCard } as const;

/**
 * "Chờ xác nhận": đơn khách gọi qua QR đã báo thanh toán (đã chuyển khoản / muốn trả tại quầy).
 * Nhân viên kiểm tra tiền rồi bấm xác nhận → tạo payment như thu ở POS. Không có yêu cầu → ẩn.
 */
export function PendingRequestsCard() {
  const { can } = usePermissions();
  const pending = usePendingPaymentRequests();
  const [confirming, setConfirming] = useState<PendingPaymentRequest | null>(null);

  const items = pending.data ?? [];
  if (!can("order.pay") || items.length === 0) return null;

  return (
    <>
      <Card className="border-warning/50 bg-warning-soft/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="bg-warning-soft text-warning flex size-8 items-center justify-center rounded-lg">
              <BellRing className="size-4" />
            </span>
            Chờ xác nhận
            <Badge variant="warning">{items.length}</Badge>
          </CardTitle>
          <CardDescription>
            Khách gọi món qua QR đã báo thanh toán — kiểm tra tiền rồi xác nhận để ghi nhận khoản
            thu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {items.map((r) => {
                const Icon = ICON[r.method];
                return (
                  <motion.li
                    key={r.orderId}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    className="bg-card flex flex-col gap-3 rounded-xl border p-3 shadow-xs sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold">
                        {r.tableName ?? "—"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <Link
                            href={`/orders/${r.orderId}`}
                            className="truncate font-semibold hover:underline"
                          >
                            {r.orderNumber}
                          </Link>
                          <Badge variant={r.method === "vietqr" ? "info" : "soft"}>
                            <Icon /> {PAYMENT_REQUEST_LABEL[r.method]}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground mt-0.5 text-xs">
                          {r.tableName ? `Bàn ${r.tableName}` : "Mang về"} · báo lúc{" "}
                          {formatTime(r.requestedAt)}
                          {r.paidAmount > 0 && ` · đã thu ${formatVnd(r.paidAmount)}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className="tabular text-lg font-bold">{formatVnd(r.amountDue)}</div>
                      <Button variant="success" onClick={() => setConfirming(r)}>
                        Xác nhận đã thu
                      </Button>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </CardContent>
      </Card>

      <ConfirmDialog request={confirming} onClose={() => setConfirming(null)} />
    </>
  );
}

function ConfirmDialog({
  request,
  onClose,
}: {
  request: PendingPaymentRequest | null;
  onClose: () => void;
}) {
  const create = useCreatePayment();
  const r = request;

  const confirm = async () => {
    if (!r) return;
    try {
      await create.mutateAsync({
        orderId: r.orderId,
        method: r.method,
        amount: r.amountDue,
        tenderedAmount: r.method === "cash" ? r.amountDue : undefined,
      });
      toast.success(`Đã ghi nhận ${formatVnd(r.amountDue)} — ${r.orderNumber}`);
      onClose();
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Không ghi nhận được thanh toán");
    }
  };

  return (
    <Dialog open={!!r} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Xác nhận đã thu tiền?</DialogTitle>
          <DialogDescription>
            {r?.method === "vietqr"
              ? "Kiểm tra app ngân hàng: đã nhận đúng số tiền, đúng nội dung chuyển khoản của đơn này."
              : "Thu đủ tiền của khách trước khi xác nhận."}
          </DialogDescription>
        </DialogHeader>
        {r && (
          <div className="bg-muted/50 space-y-1 rounded-xl p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Đơn</span>
              <span className="font-medium">
                {r.orderNumber}
                {r.tableName && ` · Bàn ${r.tableName}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phương thức</span>
              <span className="font-medium">
                {r.method === "vietqr"
                  ? "Chuyển khoản QR"
                  : r.method === "cash"
                    ? "Tiền mặt"
                    : "Thẻ"}
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-muted-foreground">Số tiền</span>
              <span className="tabular text-xl font-bold">{formatVnd(r.amountDue)}</span>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Để sau
          </Button>
          <Button variant="success" onClick={confirm} disabled={create.isPending}>
            {create.isPending ? "Đang ghi nhận..." : "Đã nhận tiền"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
