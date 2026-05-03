"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Banknote, QrCode, Smartphone } from "lucide-react";
import { toast } from "sonner";
import {
  useCreatePayment,
  usePaymentsForOrder,
  type PaymentMethod,
} from "@/hooks/api/use-payments";
import { ApiException } from "@/lib/api-client";
import type { Order } from "@/types/api";

interface Props {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onPaid?: () => void;
}

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000];

const METHOD_OPTIONS: Array<{
  value: PaymentMethod;
  label: string;
  icon: typeof Banknote;
}> = [
  { value: "cash", label: "Tiền mặt", icon: Banknote },
  { value: "vietqr", label: "Chuyển khoản (QR)", icon: QrCode },
  { value: "momo", label: "Momo", icon: Smartphone },
];

export function PaymentDialog({ order, open, onClose, onPaid }: Props) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [tendered, setTendered] = useState<number>(0);
  const payments = usePaymentsForOrder(order?.id ?? null);
  const createPayment = useCreatePayment();

  const totalDue = order?.pricing.total.amount ?? 0;
  const paidBefore = useMemo(() => {
    if (!payments.data) return 0;
    return payments.data
      .filter((p) => p.status === "succeeded" || p.status === "partially_refunded")
      .reduce((acc, p) => acc + (p.amount.amount - p.refundedAmount.amount), 0);
  }, [payments.data]);
  const remaining = Math.max(0, totalDue - paidBefore);

  useEffect(() => {
    if (open && remaining > 0) setTendered(remaining);
  }, [open, remaining]);

  if (!order) return null;

  const change = method === "cash" ? Math.max(0, tendered - remaining) : 0;
  const willPay = method === "cash" ? Math.min(tendered, remaining) : remaining;

  const handlePay = async () => {
    if (willPay <= 0) {
      toast.error("Số tiền không hợp lệ");
      return;
    }
    try {
      await createPayment.mutateAsync({
        orderId: order.id,
        method,
        amount: willPay,
      });
      toast.success(change > 0 ? `Đã thu, trả lại khách ${formatVnd(change)}` : "Đã thu tiền");
      onPaid?.();
      onClose();
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Thanh toán thất bại");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thanh toán — {order.orderNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tổng tiền */}
          <div className="bg-muted space-y-1.5 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tổng đơn</span>
              <span className="tabular-nums">{formatVnd(totalDue)}</span>
            </div>
            {paidBefore > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Đã thu</span>
                <span className="text-emerald-600 tabular-nums">−{formatVnd(paidBefore)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-1.5 text-lg font-bold">
              <span>Còn lại</span>
              <span className="tabular-nums">{formatVnd(remaining)}</span>
            </div>
          </div>

          {/* Method */}
          <div className="space-y-2">
            <Label>Phương thức</Label>
            <div className="grid grid-cols-3 gap-2">
              {METHOD_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMethod(opt.value)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-colors ${method === opt.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                  >
                    <Icon className="size-5" />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash flow */}
          {method === "cash" && (
            <div className="space-y-2">
              <Label>Tiền nhận</Label>
              <Input
                type="number"
                min="0"
                value={tendered}
                onChange={(e) => setTendered(parseInt(e.target.value) || 0)}
                className="text-lg font-bold tabular-nums"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTendered(remaining)}
                  className="bg-muted hover:bg-muted/70 rounded-full px-3 py-1.5 text-xs"
                >
                  Đủ ({formatVnd(remaining)})
                </button>
                {QUICK_AMOUNTS.filter((a) => a > remaining).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setTendered(a)}
                    className="bg-muted hover:bg-muted/70 rounded-full px-3 py-1.5 text-xs"
                  >
                    {formatVnd(a)}
                  </button>
                ))}
              </div>
              {change > 0 && (
                <div className="flex justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/40">
                  <span className="font-medium">Trả lại khách</span>
                  <span className="text-lg font-bold text-emerald-700 tabular-nums dark:text-emerald-400">
                    {formatVnd(change)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* QR / Momo */}
          {(method === "vietqr" || method === "momo") && (
            <div className="bg-muted space-y-2 rounded-lg p-6 text-center">
              <div className="mx-auto flex size-32 items-center justify-center rounded-lg border-2 bg-white">
                <QrCode className="text-muted-foreground size-20" />
              </div>
              <div className="text-muted-foreground text-sm">
                Khách scan QR để chuyển <strong>{formatVnd(remaining)}</strong>
              </div>
              <div className="text-muted-foreground text-xs">
                (MVP: chưa tích hợp cổng thật — bấm xác nhận khi thấy tiền vào)
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={handlePay} disabled={createPayment.isPending || willPay <= 0}>
            {createPayment.isPending ? "Đang xử lý..." : `Xác nhận ${formatVnd(willPay)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
