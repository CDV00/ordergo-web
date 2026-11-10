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
import { Banknote, CheckCircle2, CreditCard, HandCoins, Printer, QrCode } from "lucide-react";
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
import { AnimatePresence, motion } from "motion/react";
import { AnimatedNumber } from "@/components/animated-number";
import { Highlight, HighlightItem } from "@/components/animate-ui/primitives/effects/highlight";
import { DiscountSection } from "./discount-section";
import { VietQrPanel } from "./vietqr-panel";

interface Props {
  orderId: string | null;
  open: boolean;
  onClose: () => void;
}

const QUICK_AMOUNTS = [50_000, 100_000, 200_000, 500_000];

const QUICK_CHIP =
  "bg-card hover:bg-muted h-11 rounded-full border px-4 text-sm font-semibold tabular-nums shadow-xs transition-[background-color,transform] active:scale-95";

const ALERT_CLASS =
  "bg-warning-soft border-warning/50 dark:text-warning rounded-xl border p-3 text-sm text-[oklch(0.45_0.11_70)]";

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
          <div className="space-y-5 py-2 text-center">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              className="bg-success-soft text-success mx-auto flex size-20 items-center justify-center rounded-full"
            >
              <CheckCircle2 className="size-11" />
            </motion.div>
            <div className="text-lg font-semibold">{o?.orderNumber}</div>
            {done.change > 0 && (
              <div className="bg-success-soft border-success/30 rounded-2xl border p-5">
                <div className="text-muted-foreground text-sm font-medium">Trả lại khách</div>
                <div className="text-success text-4xl font-bold tracking-tight tabular-nums">
                  {formatVnd(done.change)}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="lg"
                className="h-14 rounded-xl"
                onClick={() => openReceipt(orderId)}
              >
                <Printer className="size-4" /> In hoá đơn
              </Button>
              <Button size="lg" className="h-14 rounded-xl" onClick={onClose}>
                Xong
              </Button>
            </div>
          </div>
        ) : !o ? (
          online ? (
            <div className="text-muted-foreground py-10 text-center text-sm">Đang tải đơn...</div>
          ) : (
            <p role="alert" className={ALERT_CLASS}>
              Mất kết nối — chưa thể thanh toán. Thanh toán cần có mạng; vui lòng đợi kết nối lại.
            </p>
          )
        ) : (
          <>
            <div className="space-y-4">
              {/* Số cần thu — to, rõ */}
              <div className="bg-primary/[0.06] border-primary/15 rounded-2xl border p-4">
                <div className="flex items-end justify-between gap-3">
                  <span className="text-muted-foreground pb-1 text-sm font-medium">Cần thu</span>
                  <AnimatedNumber
                    value={remaining}
                    format="vnd"
                    className="text-primary text-4xl font-bold tracking-tight"
                  />
                </div>
                <div className="border-primary/15 mt-3 space-y-1 border-t border-dashed pt-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span className="tabular-nums">{formatVnd(o.pricing.subtotal.amount)}</span>
                  </div>
                  {o.pricing.discount.amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Giảm giá</span>
                      <span className="text-success tabular-nums">
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
                      <span className="text-success tabular-nums">−{formatVnd(paidBefore)}</span>
                    </div>
                  )}
                </div>
              </div>

              {paidBefore === 0 && <DiscountSection order={o} />}

              {/* Phương thức — nền trượt theo lựa chọn */}
              <div className="space-y-2">
                <Label>Phương thức</Label>
                <div className="bg-muted grid grid-cols-3 gap-1 rounded-2xl p-1">
                  <Highlight
                    controlledItems
                    click={false}
                    value={method}
                    className="bg-card inset-0 rounded-xl shadow-sm"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  >
                    {METHOD_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const active = method === opt.value;
                      return (
                        <HighlightItem key={opt.value} value={opt.value} className="rounded-xl">
                          <button
                            type="button"
                            onClick={() => setMethod(opt.value)}
                            aria-pressed={active}
                            className={cn(
                              "flex min-h-16 w-full flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 transition-colors",
                              active
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            <Icon className="size-5" />
                            <span className="text-xs font-semibold">{opt.label}</span>
                          </button>
                        </HighlightItem>
                      );
                    })}
                  </Highlight>
                </div>
              </div>

              {isCash && (
                <div className="space-y-2.5">
                  <Label htmlFor="tendered">Khách đưa</Label>
                  <div className="relative">
                    <HandCoins className="text-muted-foreground absolute top-1/2 left-3.5 size-5 -translate-y-1/2" />
                    <Input
                      id="tendered"
                      type="number"
                      min="0"
                      value={tendered || ""}
                      onChange={(e) => setTendered(parseInt(e.target.value) || 0)}
                      className="h-14 rounded-xl pl-11 text-xl font-bold tabular-nums"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setTendered(remaining)}
                      className={cn(
                        QUICK_CHIP,
                        tendered === remaining && "border-primary bg-primary/10 text-primary",
                      )}
                    >
                      Đủ ({formatVnd(remaining)})
                    </button>
                    {QUICK_AMOUNTS.filter((a) => a > remaining).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setTendered(a)}
                        className={cn(
                          QUICK_CHIP,
                          tendered === a && "border-primary bg-primary/10 text-primary",
                        )}
                      >
                        {formatVnd(a)}
                      </button>
                    ))}
                  </div>
                  <AnimatePresence initial={false}>
                    {change > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-success-soft border-success/30 flex items-center justify-between rounded-2xl border p-4">
                          <span className="font-semibold">Trả lại khách</span>
                          <AnimatedNumber
                            value={change}
                            format="vnd"
                            className="text-success text-3xl font-bold tracking-tight"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {tendered > 0 && tendered < remaining && (
                    <p className="dark:text-warning text-xs text-[oklch(0.5_0.12_70)]">
                      Thu trước {formatVnd(tendered)}, còn lại {formatVnd(remaining - tendered)} thu
                      bằng phương thức khác.
                    </p>
                  )}
                </div>
              )}

              {method === "vietqr" && <VietQrPanel orderId={orderId} />}

              {method === "card" && (
                <p className="bg-muted text-muted-foreground rounded-2xl p-4 text-center text-sm">
                  Quẹt thẻ trên máy POS ngân hàng, xác nhận khi giao dịch thành công.
                </p>
              )}
            </div>

            {!online && (
              <p role="alert" className={ALERT_CLASS}>
                Mất kết nối — chưa thể thanh toán. Thanh toán cần có mạng; vui lòng đợi kết nối lại
                rồi xác nhận.
              </p>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="lg"
                className="h-12 rounded-xl"
                onClick={() => openReceipt(orderId, false)}
              >
                <Printer className="size-4" /> Tạm tính
              </Button>
              <Button
                size="lg"
                variant="success"
                className="h-12 rounded-xl px-6 text-base font-semibold sm:min-w-48"
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
