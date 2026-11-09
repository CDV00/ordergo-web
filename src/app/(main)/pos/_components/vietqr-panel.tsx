"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, Settings } from "lucide-react";
import { usePaymentQr } from "@/hooks/api/use-payments";
import { formatVnd } from "@/lib/format";
import type { ApiException } from "@/lib/api-client";

/** VietQR động cho phần còn phải thu — số tiền + nội dung đã điền sẵn trong mã. */
export function VietQrPanel({ orderId }: { orderId: string }) {
  const qr = usePaymentQr(orderId);

  if (qr.isLoading) {
    return (
      <div className="bg-muted flex h-64 items-center justify-center rounded-lg">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  if (qr.error) {
    const err = qr.error as unknown as ApiException;
    const noBank = err.error?.code === "NO_BANK_ACCOUNT";
    return (
      <div className="bg-muted space-y-3 rounded-lg p-5 text-center text-sm">
        <p>{err.error?.message ?? "Không tạo được mã QR."}</p>
        {noBank && (
          <Link
            href="/settings"
            className="text-primary inline-flex items-center gap-1.5 font-medium hover:underline"
          >
            <Settings className="size-4" /> Cài đặt tài khoản nhận tiền
          </Link>
        )}
      </div>
    );
  }

  if (!qr.data) return null;
  const d = qr.data;
  return (
    <div className="bg-muted space-y-3 rounded-lg p-4 text-center">
      <div className="mx-auto w-fit rounded-lg bg-white p-3">
        <QRCodeSVG value={d.qrPayload} size={200} level="M" includeMargin={false} />
      </div>
      <div className="text-2xl font-bold tabular-nums">{formatVnd(d.amount)}</div>
      <div className="space-y-0.5 text-sm">
        <div className="font-medium">{d.bank.name || `Ngân hàng ${d.bank.bin}`}</div>
        <div className="tabular-nums">{d.bank.accountNumber}</div>
        <div className="text-muted-foreground">{d.bank.accountName}</div>
        <div className="text-muted-foreground text-xs">
          Nội dung: <span className="font-mono">{d.memo}</span>
        </div>
      </div>
      <p className="text-muted-foreground text-xs">
        Khách quét bằng app ngân hàng. Bấm xác nhận khi đã thấy tiền vào tài khoản.
      </p>
    </div>
  );
}
