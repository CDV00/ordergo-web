import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PAYMENT_METHOD_LABEL, type Payment } from "@/hooks/api/use-payments";
import { formatDateTime, formatVnd } from "@/lib/format";
import { PaymentStatusBadge, refundableAmount, refundedOf } from "./payment-status";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

/** Thông tin giao dịch + lịch sử hoàn tiền. */
export function PaymentInfoCard({ payment: p }: { payment: Payment }) {
  const refunded = refundedOf(p);
  const remaining = refundableAmount(p);
  const isCash = p.method === "cash" && p.tenderedAmount != null;
  const change = isCash ? (p.tenderedAmount ?? 0) - p.amount.amount : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Thông tin giao dịch</CardTitle>
        <CardDescription>Mã đơn {p.orderNumber}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-3xl font-bold tabular-nums">{formatVnd(p.amount.amount)}</div>
        <Row label="Trạng thái">
          <PaymentStatusBadge status={p.status} />
        </Row>
        <Row label="Phương thức">{PAYMENT_METHOD_LABEL[p.method] ?? p.method}</Row>
        <Row label="Thời gian">{formatDateTime(p.receivedAt)}</Row>
        {isCash && (
          <>
            <Row label="Khách đưa">{formatVnd(p.tenderedAmount ?? 0)}</Row>
            <Row label="Tiền thừa">{formatVnd(Math.max(0, change))}</Row>
          </>
        )}
        {p.externalRef && (
          <Row label="Mã tham chiếu">
            <span className="font-mono text-xs break-all">{p.externalRef}</span>
          </Row>
        )}
        {refunded > 0 && (
          <>
            <Row label="Đã hoàn">
              <span className="text-rose-600 dark:text-rose-400">−{formatVnd(refunded)}</span>
            </Row>
            <Row label="Thực thu">{formatVnd(p.amount.amount - refunded)}</Row>
          </>
        )}
        {remaining > 0 && refunded > 0 && <Row label="Còn có thể hoàn">{formatVnd(remaining)}</Row>}

        <Separator />
        <div className="space-y-2">
          <p className="text-sm font-semibold">Lịch sử hoàn tiền</p>
          {p.refunds.length === 0 ? (
            <p className="text-muted-foreground text-sm">Chưa có lần hoàn tiền nào.</p>
          ) : (
            <ul className="space-y-2">
              {p.refunds.map((r, i) => (
                <li
                  key={`${r.refundedAt}-${i}`}
                  className="flex items-start justify-between gap-3 rounded-md border p-2 text-sm"
                >
                  <div className="min-w-0">
                    <div className="text-muted-foreground text-xs">
                      {formatDateTime(r.refundedAt)}
                    </div>
                    <div className="break-words">{r.reason || "Không ghi lý do"}</div>
                  </div>
                  <span className="shrink-0 font-semibold text-rose-600 tabular-nums dark:text-rose-400">
                    −{formatVnd(r.amount.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
