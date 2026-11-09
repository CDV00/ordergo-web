"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
      {refunded > 0 && (
        <div className="text-xs text-rose-600 dark:text-rose-400">−{formatVnd(refunded)}</div>
      )}
    </div>
  );
}

export function PaymentListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

/** Bảng giao dịch (desktop) / danh sách thẻ (mobile). Mỗi dòng mở trang chi tiết. */
export function PaymentList({ payments }: { payments: Payment[] }) {
  const router = useRouter();

  if (payments.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">
        Không có giao dịch nào trong ngày này.
      </div>
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
                className="cursor-pointer"
                onClick={() => router.push(`/payments/${p.id}`)}
              >
                <TableCell className="tabular-nums">{formatTime(p.receivedAt)}</TableCell>
                <TableCell className="font-medium">
                  <Link
                    href={`/payments/${p.id}`}
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {p.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>{PAYMENT_METHOD_LABEL[p.method] ?? p.method}</TableCell>
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
      <div className="space-y-2 md:hidden">
        {payments.map((p) => (
          <Link key={p.id} href={`/payments/${p.id}`} className="block">
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex min-h-[44px] items-center gap-3 p-3">
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
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
