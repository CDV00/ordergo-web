"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePayment } from "@/hooks/api/use-payments";
import { PaymentInfoCard } from "../_components/payment-info-card";
import {
  errorMessage,
  isForbidden,
  isNotFound,
  refundableAmount,
} from "../_components/payment-status";
import { PaymentsShell, StateMessage } from "../_components/payments-shell";
import { RefundDialog } from "../_components/refund-dialog";
import { RelatedOrderCard } from "../_components/related-order-card";

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const payment = usePayment(id);
  const [refundOpen, setRefundOpen] = useState(false);
  const p = payment.data;

  if (payment.isLoading) {
    return (
      <PaymentsShell title="Đang tải...">
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </PaymentsShell>
    );
  }

  if (payment.error || !p) {
    const err = payment.error;
    const [title, description] = isForbidden(err)
      ? ["Bạn không có quyền xem thanh toán", undefined]
      : isNotFound(err) || !err
        ? ["Không tìm thấy giao dịch", `Giao dịch "${id}" không tồn tại hoặc đã bị xoá.`]
        : ["Không tải được giao dịch", errorMessage(err)];
    return (
      <PaymentsShell title="Không tìm thấy">
        <StateMessage title={title} description={description} backLink />
      </PaymentsShell>
    );
  }

  const canRefund = refundableAmount(p) > 0;

  return (
    <PaymentsShell title={p.orderNumber}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Giao dịch {p.orderNumber}</h2>
          <p className="text-muted-foreground font-mono text-xs break-all">{p.id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="min-h-[44px]" asChild>
            <Link href="/payments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Link>
          </Button>
          <Button variant="outline" className="min-h-[44px]" asChild>
            <Link href={`/print/receipt/${p.orderId}`} target="_blank" rel="noopener noreferrer">
              <Printer className="mr-2 h-4 w-4" />
              In hoá đơn
            </Link>
          </Button>
          {canRefund && (
            <Button
              variant="destructive"
              className="min-h-[44px]"
              onClick={() => setRefundOpen(true)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Hoàn tiền
            </Button>
          )}
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <PaymentInfoCard payment={p} />
        <RelatedOrderCard orderId={p.orderId} />
      </div>

      {canRefund && <RefundDialog payment={p} open={refundOpen} onOpenChange={setRefundOpen} />}
    </PaymentsShell>
  );
}
