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
import { Banknote, CheckCircle2, CreditCard, Printer, QrCode } from "lucide-react";
import { toast } from "sonner";
import {
  useCreatePayment,
  usePaymentQr,
  usePaymentsForOrder,
  type PaymentMethod,
} from "@/hooks/api/use-payments";
import { useOrder } from "@/hooks/api/use-orders";
import { useOnline } from "@/lib/offline/use-online";
import { ApiException } from "@/lib/api-client";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DiscountSection } from "./discount-section";
import { VietQrPanel } from "./vietqr-panel";

interface Props {
  orderId: string | null;
  open: boolean;
  onClose: () => void;
}

const QUICK_AMOUNTS = [50_000, 100_000, 200_000, 500_000];

const METHOD_OPTIONS: Array<{ value: PaymentMethod; label: string; icon: typeof Banknote }> = [
  { value: "cash", label: "Tiền mặt", icon: Banknote },
  { value: "vietqr", label: "Chuyển khoản QR", icon: QrCode },
  { value: "card", label: "Thẻ", icon: CreditCard },
];

export function openReceipt(orderId: string, autoPrint = true) {
  window.open(`/print/receipt/${orderId}${autoPrint ? "?auto=1" : ""}`, "_blank", "noopener");
}

export function PaymentDialog({ orderId, open, onClose }: Props) {
  const order = useOrder(orderId ?? "");
  const payments = usePaymentsForOrder(orderId);
  const createPayment = useCreatePayment();
  const [method, setMethod] = useState<PaymentMethod>("cash");
  // Cùng query với VietQrPanel (cache chung) — chặn xác nhận khi không tạo được QR
  const qr = usePaymentQr(orderId, open && method === "vietqr");
  const [tendered, setTendered] = useState(0);
  const [done, setDone] = useState<{ change: number } | null>(null);
  // Thanh toán chỉ online: không xếp hàng tiền — tránh thu 2 lần / lệch ca.
  const online = useOnline();

  const totalDue = order.data?.pricing.total.amount ?? 0;
  const paidBefore = useMemo(
    () =>
      (payments.data ?? [])
        .filter((p) => p.status === "succeeded" || p.status === "partially_refunded")
        .reduce((acc, p) => acc + (p.amount.amount - p.refundedAmount.amount), 0),
    [payments.data],
  );
  const remaining = Math.max(0, totalDue - paidBefore);

  // Mở dialog: reset về tiền mặt, tiền nhận = số còn lại
  useEffect(() => {
    if (open) {
      setMethod("cash");
      setDone(null);
    }
  }, [open, orderId]);
  useEffect(() => {
    if (open) setTendered(remaining);
  }, [open, remaining]);

  if (!orderId) return null;

  const isCash = method === "cash";
  const change = isCash ? Math.max(0, tendered - remaining) : 0;
  const willPay = isCash ? Math.min(tendered, remaining) : remaining;

  const handlePay = async () => {
    if (willPay <= 0) {
      toast.error("Số tiền không hợp lệ");
      return;
    }
    try {
      const res = await createPayment.mutateAsync({
        orderId,
        method,
        amount: willPay,
        tenderedAmount: isCash ? tendered : undefined,
      });
      if (res.order.status === "paid") {
        setDone({ change });
      } else {
        toast.success(
          `Đã thu ${formatVnd(willPay)} — còn ${formatVnd(res.totalDue - res.paidTotal)}`,
        );
      }
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Thanh toán thất bại");
    }
  };

  const o = order.data;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {done ? "Đã thanh toán" : `Thanh toán${o ? ` — ${o.tableName ?? "Mang về"}` : ""}`}
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="space-y-4 py-2 text-center">
            <CheckCircle2 className="mx-auto size-14 text-emerald-600" />
            <div className="text-lg font-semibold">{o?.orderNumber}</div>
            {done.change > 0 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
                <div className="text-muted-foreground text-sm">Trả lại khách</div>
                <div className="text-3xl font-bold text-emerald-700 tabular-nums dark:text-emerald-400">
                  {formatVnd(done.change)}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="lg" onClick={() => openReceipt(orderId)}>
                <Printer className="mr-1.5 size-4" /> In hoá đơn
              </Button>
              <Button size="lg" onClick={onClose}>
                Xong
              </Button>
            </div>
          </div>
        ) : !o ? (
          online ? (
            <div className="text-muted-foreground py-10 text-center text-sm">Đang tải đơn...</div>
          ) : (
            <p
              role="alert"
              className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
            >
              Mất kết nối — chưa thể thanh toán. Thanh toán cần có mạng; vui lòng đợi kết nối lại.
            </p>
          )
        ) : (
          <>
            <div className="space-y-4">
              {/* Tổng tiền */}
              <div className="bg-muted space-y-1.5 rounded-lg p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span className="tabular-nums">{formatVnd(o.pricing.subtotal.amount)}</span>
                </div>
                {o.pricing.discount.amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Giảm giá</span>
                    <span className="text-emerald-600 tabular-nums">
                      −{formatVnd(o.pricing.discount.amount)}
                    </span>
                  </div>
                )}
                {o.pricing.serviceCharge.amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phí phục vụ</span>
                    <span className="tabular-nums">
                      {formatVnd(o.pricing.serviceCharge.amount)}
                    </span>
                  </div>
                )}
                {paidBefore > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Đã thu</span>
                    <span className="text-emerald-600 tabular-nums">−{formatVnd(paidBefore)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-1.5 text-lg font-bold">
                  <span>Cần thu</span>
                  <span className="tabular-nums">{formatVnd(remaining)}</span>
                </div>
              </div>

              {paidBefore === 0 && <DiscountSection order={o} />}

              {/* Phương thức */}
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
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-colors",
                          method === opt.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50",
                        )}
                      >
                        <Icon className="size-5" />
                        <span className="text-xs font-medium">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {isCash && (
                <div className="space-y-2">
                  <Label htmlFor="tendered">Khách đưa</Label>
                  <Input
                    id="tendered"
                    type="number"
                    min="0"
                    value={tendered || ""}
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
                  {tendered > 0 && tendered < remaining && (
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Thu trước {formatVnd(tendered)}, còn lại {formatVnd(remaining - tendered)} thu
                      bằng phương thức khác.
                    </p>
                  )}
                </div>
              )}

              {method === "vietqr" && <VietQrPanel orderId={orderId} />}

              {method === "card" && (
                <p className="bg-muted text-muted-foreground rounded-lg p-4 text-center text-sm">
                  Quẹt thẻ trên máy POS ngân hàng, xác nhận khi giao dịch thành công.
                </p>
              )}
            </div>

            {!online && (
              <p
                role="alert"
                className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
              >
                Mất kết nối — chưa thể thanh toán. Thanh toán cần có mạng; vui lòng đợi kết nối lại
                rồi xác nhận.
              </p>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => openReceipt(orderId, false)}>
                <Printer className="mr-1.5 size-4" /> Tạm tính
              </Button>
              <Button
                onClick={handlePay}
                disabled={
                  !online ||
                  createPayment.isPending ||
                  willPay <= 0 ||
                  (method === "vietqr" && !qr.data)
                }
              >
                {createPayment.isPending ? "Đang xử lý..." : `Xác nhận ${formatVnd(willPay)}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
