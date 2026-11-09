"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PAYMENT_METHOD_LABEL } from "@/hooks/api/use-payments";
import { useShift } from "@/hooks/api/use-shifts";
import { formatDateTime, formatTime, formatVnd } from "@/lib/format";
import { DifferenceBadge, ShiftSummaryView } from "../../pos/_components/shift-summary";
import {
  errorMessage,
  isForbidden,
  isNotFound,
  ShiftsShell,
  StateMessage,
} from "../_components/shifts-shell";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export default function ShiftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const shift = useShift(id);
  const s = shift.data;

  if (shift.isLoading) {
    return (
      <ShiftsShell title="Đang tải...">
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </ShiftsShell>
    );
  }

  if (shift.error || !s) {
    const err = shift.error;
    const [title, description] = isForbidden(err)
      ? ["Bạn không có quyền xem ca làm", undefined]
      : isNotFound(err) || !err
        ? ["Không tìm thấy ca", "Ca không tồn tại hoặc bạn không có quyền xem."]
        : ["Không tải được ca", errorMessage(err)];
    return (
      <ShiftsShell title="Không tìm thấy">
        <StateMessage title={title} description={description} backLink />
      </ShiftsShell>
    );
  }

  const title = `Ca ${formatDateTime(s.openedAt)}`;

  return (
    <ShiftsShell title={title}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
          <DifferenceBadge shift={s} />
        </div>
        <Button variant="outline" className="min-h-[44px]" asChild>
          <Link href="/shifts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Link>
        </Button>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Thông tin ca</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <InfoRow label="Mở ca" value={formatDateTime(s.openedAt)} />
            <InfoRow label="Người mở ca" value={s.openedByName ?? "—"} />
            <InfoRow label="Đóng ca" value={s.closedAt ? formatDateTime(s.closedAt) : "Đang mở"} />
            {s.closedAt && <InfoRow label="Người đóng ca" value={s.closedByName ?? "—"} />}
            {s.note && <InfoRow label="Ghi chú" value={s.note} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tổng hợp</CardTitle>
          </CardHeader>
          <CardContent>
            <ShiftSummaryView shift={s} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Khoản thu trong ca ({s.payments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {s.payments.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center text-sm">
              Chưa có khoản thu nào trong ca này.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Giờ</TableHead>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Phương thức</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {s.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="tabular-nums">{formatTime(p.receivedAt)}</TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/payments/${p.id}`} className="hover:underline">
                        {p.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{PAYMENT_METHOD_LABEL[p.method] ?? p.method}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <div className="font-semibold">{formatVnd(p.amount.amount)}</div>
                      {p.refundedAmount.amount > 0 && (
                        <div className="text-xs text-rose-600 dark:text-rose-400">
                          −{formatVnd(p.refundedAmount.amount)}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </ShiftsShell>
  );
}
