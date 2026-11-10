"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, ChevronRight, CreditCard, QrCode, ReceiptText, Wallet } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PAYMENT_METHOD_LABEL, type Payment } from "@/hooks/api/use-payments";
import { formatTime, formatVnd } from "@/lib/format";
import { PaymentStatusBadge, refundedOf } from "./payment-status";

function Amount({ p }: { p: Payment }) {
  const refunded = refundedOf(p);
  return (
    <div className="text-right tabular-nums">
      <div className="font-semibold">{formatVnd(p.amount.amount)}</div>
      {refunded > 0 && <div className="text-destructive text-xs">−{formatVnd(refunded)}</div>}
    </div>
  );
}

const METHOD_ICON: Record<string, typeof Banknote> = {
  cash: Banknote,
  vietqr: QrCode,
  card: CreditCard,
};

function MethodIcon({ method }: { method: Payment["method"] }) {
  const Icon = METHOD_ICON[method] ?? Wallet;
  return (
    <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-xl">
      <Icon className="size-4" />
    </span>
  );
}

function MethodLabel({ method }: { method: Payment["method"] }) {
  const Icon = METHOD_ICON[method] ?? Wallet;
  return (
    <span className="flex items-center gap-2">
      <Icon className="text-muted-foreground size-4" />
      {PAYMENT_METHOD_LABEL[method] ?? method}
    </span>
  );
}

export function PaymentListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

/** Bảng giao dịch (desktop) / danh sách thẻ (mobile). Mỗi dòng mở trang chi tiết. */
export function PaymentList({ payments }: { payments: Payment[] }) {
  const router = useRouter();

  if (payments.length === 0) {
    return (
      <EmptyState
        icon={ReceiptText}
        title="Không có giao dịch nào trong ngày này."
        description="Chọn ngày khác hoặc đổi bộ lọc phương thức."
        className="border-0"
      />
    );
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Giờ</TableHead>
              <TableHead>Mã đơn</TableHead>
              <TableHead>Phương thức</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow
                key={p.id}
                className="hover:bg-muted/50 h-14 cursor-pointer"
                onClick={() => router.push(`/payments/${p.id}`)}
              >
                <TableCell className="text-muted-foreground tabular">
                  {formatTime(p.receivedAt)}
                </TableCell>
                <TableCell className="font-medium">
                  <Link
                    href={`/payments/${p.id}`}
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {p.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <MethodLabel method={p.method} />
                </TableCell>
                <TableCell>
                  <Amount p={p} />
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={p.status} />
                </TableCell>
                <TableCell>
                  <ChevronRight className="text-muted-foreground h-4 w-4" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <div className="-mx-2 divide-y md:hidden">
        {payments.map((p) => (
          <Link
            key={p.id}
            href={`/payments/${p.id}`}
            className="hover:bg-muted/50 block rounded-xl px-2 transition-colors"
          >
            <div className="flex min-h-14 items-center gap-3 py-2.5">
              <MethodIcon method={p.method} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{p.orderNumber}</span>
                  <PaymentStatusBadge status={p.status} />
                </div>
                <div className="text-muted-foreground text-xs">
                  {formatTime(p.receivedAt)} · {PAYMENT_METHOD_LABEL[p.method] ?? p.method}
                </div>
              </div>
              <Amount p={p} />
              <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
