"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "motion/react";
import { ArrowLeft, CheckCircle2, Copy, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  useGeneratePaymentQr,
  usePublicSessionOrders,
  type PaymentQrResponse,
} from "@/hooks/api/use-public";
import { PublicApiException } from "@/lib/public-api-client";

function fmt(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

export default function PayOrderPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const orderId = params.orderId as string;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qr, setQr] = useState<PaymentQrResponse | null>(null);

  useEffect(() => {
    const sid = sessionStorage.getItem("ordergo.session.id");
    if (!sid) {
      router.replace("/");
      return;
    }
    setSessionId(sid);
  }, [router]);

  const generate = useGeneratePaymentQr(sessionId);
  const orders = usePublicSessionOrders(sessionId);

  // Auto-gen khi vào page
  useEffect(() => {
    if (!sessionId || !orderId || qr) return;
    generate
      .mutateAsync({ orderId })
      .then((r) => setQr(r))
      .catch((err) => {
        const e = err as PublicApiException;
        toast.error(e.error?.message ?? "Không tạo được QR");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, orderId]);

  // Detect order paid → show success
  const order = orders.data?.find((o) => o.id === orderId);
  const paid = order?.status === "paid";

  const copyMemo = () => {
    if (!qr) return;
    navigator.clipboard.writeText(qr.memo);
    toast.success("Đã copy nội dung CK");
  };

  const copyAccount = () => {
    if (!qr) return;
    navigator.clipboard.writeText(qr.bank.accountNumber);
    toast.success("Đã copy số tài khoản");
  };

  if (paid) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 18 }}
          className="bg-success-soft mb-4 flex size-20 items-center justify-center rounded-full"
        >
          <CheckCircle2 className="text-success size-12" />
        </motion.div>
        <h1 className="mb-2 text-2xl font-bold">Đã thanh toán ✓</h1>
        <p className="text-muted-foreground mb-6">Đơn {order?.orderNumber} đã được xác nhận.</p>
        <Link
          href={`/m/${tenantSlug}/orders`}
          className="bg-primary text-primary-foreground inline-flex h-12 items-center rounded-full px-6 font-semibold shadow-sm"
        >
          Về trang đơn hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-svh">
      <header className="bg-background/90 sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-3 backdrop-blur-md">
        <Link
          href={`/m/${tenantSlug}/orders`}
          className="hover:bg-muted -ml-2 flex size-11 items-center justify-center rounded-xl"
          aria-label="Quay lại"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-base font-bold">Thanh toán</h1>
      </header>

      <main className="mx-auto max-w-md space-y-4 p-4">
        {generate.isPending && !qr && (
          <div className="flex justify-center py-12">
            <Loader2 className="text-muted-foreground size-8 animate-spin" />
          </div>
        )}

        {qr && (
          <>
            {/* Amount card */}
            <div className="bg-primary text-primary-foreground shadow-primary/25 rounded-2xl p-5 text-center shadow-lg">
              <div className="text-sm opacity-90">Số tiền cần chuyển</div>
              <div className="my-1 text-4xl font-bold tabular-nums">{fmt(qr.amount)}</div>
              <div className="text-xs opacity-75">Đơn {qr.orderNumber}</div>
            </div>

            {/* QR */}
            {/* Nền QR luôn trắng để app ngân hàng quét được cả ở chế độ tối */}
            <div className="flex justify-center rounded-2xl border bg-white p-6 shadow-xs">
              <QRCodeSVG value={qr.qrPayload} size={240} level="M" includeMargin={false} />
            </div>

            {/* Bank info */}
            <div className="bg-card divide-y rounded-2xl border shadow-xs">
              <div className="flex items-center justify-between p-3.5">
                <div>
                  <div className="text-muted-foreground text-xs">Ngân hàng</div>
                  <div className="font-semibold">{qr.bank.name || qr.bank.bin}</div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <div className="min-w-0 flex-1">
                  <div className="text-muted-foreground text-xs">Số tài khoản</div>
                  <div className="truncate font-semibold tabular-nums">{qr.bank.accountNumber}</div>
                </div>
                <button
                  onClick={copyAccount}
                  className="bg-muted hover:bg-accent ml-2 flex size-11 items-center justify-center rounded-xl active:scale-95"
                  aria-label="Copy"
                >
                  <Copy className="size-4" />
                </button>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <div>
                  <div className="text-muted-foreground text-xs">Chủ tài khoản</div>
                  <div className="font-semibold">{qr.bank.accountName}</div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <div className="min-w-0 flex-1">
                  <div className="text-muted-foreground text-xs">Nội dung CK</div>
                  <div className="truncate font-semibold tabular-nums">{qr.memo}</div>
                </div>
                <button
                  onClick={copyMemo}
                  className="bg-muted hover:bg-accent ml-2 flex size-11 items-center justify-center rounded-xl active:scale-95"
                  aria-label="Copy"
                >
                  <Copy className="size-4" />
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="border-warning/40 bg-warning-soft space-y-1.5 rounded-2xl border p-4 text-sm">
              <div className="font-semibold">📱 Hướng dẫn</div>
              <ol className="text-muted-foreground list-decimal space-y-1 pl-5 text-xs leading-relaxed">
                <li>Mở app ngân hàng → quét QR trên</li>
                <li>Số tiền + nội dung đã điền sẵn — kiểm tra lại</li>
                <li>Bấm chuyển khoản</li>
                <li>
                  Nhân viên sẽ kiểm tra và xác nhận. Đơn sẽ tự cập nhật{" "}
                  <strong>&quot;Đã thanh toán&quot;</strong> khi tiền vào.
                </li>
              </ol>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => orders.refetch()}
                disabled={orders.isFetching}
                className="bg-muted flex h-12 flex-1 items-center justify-center gap-2 rounded-full font-medium active:scale-95"
              >
                <RefreshCw className={`size-4 ${orders.isFetching ? "animate-spin" : ""}`} />
                Đã chuyển — Kiểm tra
              </button>
            </div>

            <p className="text-muted-foreground text-center text-xs">
              Hoặc gọi nhân viên xác nhận đã thanh toán giúp.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
