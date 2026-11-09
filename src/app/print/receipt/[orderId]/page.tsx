"use client";

import { useEffect, useMemo, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/contexts/auth-context";
import { useOrder } from "@/hooks/api/use-orders";
import { PAYMENT_METHOD_LABEL, usePaymentQr, usePaymentsForOrder } from "@/hooks/api/use-payments";
import { apiGet } from "@/lib/api-client";
import { formatDateTime, formatVnd } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import type { Venue } from "@/types/api";
import "./receipt.css";

/**
 * Hoá đơn khổ 80mm cho máy in nhiệt — in qua hộp thoại in của trình duyệt.
 * `?auto=1` → tự mở hộp thoại in khi dữ liệu sẵn sàng.
 * Đơn chưa thu đủ → "PHIẾU TẠM TÍNH" kèm VietQR phần còn lại (nếu quán có tài khoản).
 */
export default function ReceiptPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const autoPrint = useSearchParams().get("auto") === "1";
  const { isReady, isAuthenticated } = useAuth();

  const order = useOrder(orderId);
  const payments = usePaymentsForOrder(orderId);
  const venue = useQuery({
    queryKey: ["venue", order.data?.venueId],
    enabled: !!order.data?.venueId,
    queryFn: () => apiGet<Venue>(`/venues/${order.data!.venueId}`),
  });

  const o = order.data;
  const isPaid = o?.status === "paid";
  const hasBank = !!venue.data?.settings?.bankAccount?.accountNumber;
  const qr = usePaymentQr(orderId, !!o && !isPaid && o.status !== "cancelled" && hasBank);

  const paid = useMemo(
    () =>
      (payments.data ?? []).filter(
        (p) => p.status === "succeeded" || p.status === "partially_refunded",
      ),
    [payments.data],
  );
  const paidTotal = paid.reduce((s, p) => s + p.amount.amount - p.refundedAmount.amount, 0);
  const cash = paid.find((p) => p.method === "cash" && p.tenderedAmount);

  const ready = !!o && !!venue.data && payments.isSuccess && (isPaid || !hasBank || !qr.isLoading);

  const printed = useRef(false);
  useEffect(() => {
    if (!autoPrint || !ready || printed.current) return;
    printed.current = true;
    // Đợi ảnh logo/QR render xong
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [autoPrint, ready]);

  if (isReady && !isAuthenticated) {
    return <p className="receipt-message">Vui lòng đăng nhập để in hoá đơn.</p>;
  }
  if (order.error) {
    return <p className="receipt-message">Không tìm thấy đơn hàng.</p>;
  }
  if (!o || !venue.data) {
    return <p className="receipt-message">Đang tải hoá đơn...</p>;
  }

  const v = venue.data;
  const address = [v.address?.line1, v.address?.city].filter(Boolean).join(", ");
  const logo = mediaUrl(v.logoUrl);
  const lines = o.lines.filter((l) => l.kitchenStatus !== "cancelled");

  return (
    <>
      <div className="receipt-toolbar no-print">
        <button onClick={() => window.print()}>In hoá đơn</button>
        <button onClick={() => window.close()}>Đóng</button>
      </div>

      <article className="receipt">
        <header className="center">
          {/* eslint-disable-next-line @next/next/no-img-element -- in ra giấy, không cần tối ưu */}
          {logo && <img src={logo} alt="" className="logo" />}
          <div className="venue-name">{v.name}</div>
          {address && <div>{address}</div>}
          {v.contact?.phone && <div>ĐT: {v.contact.phone}</div>}
        </header>

        <div className="title">{isPaid ? "HOÁ ĐƠN THANH TOÁN" : "PHIẾU TẠM TÍNH"}</div>

        <div className="meta">
          <div>
            <span>Số:</span> <span>{o.orderNumber}</span>
          </div>
          <div>
            <span>{o.tableName ? `Bàn: ${o.tableName}` : "Mang về"}</span>
            <span>{formatDateTime(isPaid ? o.paidAt : new Date().toISOString())}</span>
          </div>
        </div>

        <table className="items">
          <thead>
            <tr>
              <th className="left">Món</th>
              <th>SL</th>
              <th className="right">T.Tiền</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => {
              const extras = [l.variantSnapshot?.name, ...l.modifiers.map((m) => m.optionName)]
                .filter(Boolean)
                .join(", ");
              return (
                <tr key={l.id}>
                  <td className="left">
                    {l.productSnapshot.name}
                    {extras && <div className="extra">{extras}</div>}
                    <div className="extra">@{formatVnd(l.unitPrice.amount)}</div>
                  </td>
                  <td className="qty">{l.quantity}</td>
                  <td className="right">{formatVnd(l.lineTotal.amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="totals">
          <Row label="Tạm tính" value={formatVnd(o.pricing.subtotal.amount)} />
          {o.pricing.discount.amount > 0 && (
            <Row
              label={`Giảm giá${o.discountInfo?.type === "percent" ? ` ${o.discountInfo.value}%` : ""}`}
              value={`-${formatVnd(o.pricing.discount.amount)}`}
            />
          )}
          {o.pricing.serviceCharge.amount > 0 && (
            <Row label="Phí phục vụ" value={formatVnd(o.pricing.serviceCharge.amount)} />
          )}
          <Row label="TỔNG CỘNG" value={formatVnd(o.pricing.total.amount)} strong />
          {paid.map((p) => (
            <Row
              key={p.id}
              label={PAYMENT_METHOD_LABEL[p.method]}
              value={formatVnd(p.amount.amount - p.refundedAmount.amount)}
            />
          ))}
          {cash && cash.tenderedAmount! > cash.amount.amount && (
            <>
              <Row label="Khách đưa" value={formatVnd(cash.tenderedAmount!)} />
              <Row label="Trả lại" value={formatVnd(cash.tenderedAmount! - cash.amount.amount)} />
            </>
          )}
          {!isPaid && paidTotal > 0 && (
            <Row label="Còn lại" value={formatVnd(o.pricing.total.amount - paidTotal)} strong />
          )}
        </div>

        {!isPaid && qr.data && (
          <div className="center qr">
            <div>Quét để chuyển khoản {formatVnd(qr.data.amount)}</div>
            <QRCodeSVG value={qr.data.qrPayload} size={150} level="M" includeMargin={false} />
            <div>
              {qr.data.bank.name} · {qr.data.bank.accountNumber}
            </div>
            <div>{qr.data.bank.accountName}</div>
          </div>
        )}

        <footer className="center">
          <div className="note">Giá đã bao gồm VAT</div>
          <div>{v.settings.receiptFooter || "Cảm ơn quý khách, hẹn gặp lại!"}</div>
        </footer>
      </article>
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "row strong" : "row"}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
