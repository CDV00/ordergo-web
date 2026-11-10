"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SalesReport } from "@/hooks/api/use-reports";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmptyNote } from "./chart-card";

function TableCard({
  title,
  description,
  loading,
  children,
}: {
  title: string;
  description: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="mt-0.5">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-48 w-full rounded-xl" /> : children}
      </CardContent>
    </Card>
  );
}

/** Top 20 món của các đơn đã thanh toán (bỏ món đã huỷ). */
export function TopItemsTable({
  report,
  loading,
}: {
  report: SalesReport | undefined;
  loading: boolean;
}) {
  const items = report?.topItems ?? [];
  return (
    <TableCard
      title="Món bán chạy"
      description="Top 20 · chỉ tính đơn đã thanh toán"
      loading={loading}
    >
      {items.length === 0 ? (
        <EmptyNote>Chưa có món nào được bán trong khoảng này.</EmptyNote>
      ) : (
        <div className="max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Món</TableHead>
                <TableHead className="text-right">SL</TableHead>
                <TableHead className="text-right">Doanh thu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i, idx) => (
                <TableRow key={i.menuItemId}>
                  <TableCell>
                    <span
                      className={cn(
                        "tabular flex size-6 items-center justify-center rounded-md text-xs font-bold",
                        idx === 0
                          ? "bg-primary text-primary-foreground"
                          : idx < 3
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {idx + 1}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate font-medium">{i.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{i.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatVnd(i.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </TableCard>
  );
}

/** Theo nhân viên: số lần thu tiền, tiền thu, số đơn tạo. */
export function StaffTable({
  report,
  loading,
}: {
  report: SalesReport | undefined;
  loading: boolean;
}) {
  const rows = report?.byStaff ?? [];
  return (
    <TableCard
      title="Theo nhân viên"
      description="Tiền thu theo người nhận thanh toán · đơn theo người tạo"
      loading={loading}
    >
      {rows.length === 0 ? (
        <EmptyNote>Chưa có dữ liệu nhân viên trong khoảng này.</EmptyNote>
      ) : (
        <div className="max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhân viên</TableHead>
                <TableHead className="text-right">Lần thu</TableHead>
                <TableHead className="text-right">Tiền thu</TableHead>
                <TableHead className="text-right">Đơn tạo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.userId ?? "other"}>
                  <TableCell className={s.userId ? "font-medium" : "text-muted-foreground italic"}>
                    {s.displayName}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{s.paymentsCount}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatVnd(s.paymentsAmount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{s.ordersCreated}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </TableCard>
  );
}
