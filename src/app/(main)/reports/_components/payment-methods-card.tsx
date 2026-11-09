"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from "@/hooks/api/use-payments";
import type { SalesReport } from "@/hooks/api/use-reports";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChartCard, EmptyNote } from "./chart-card";

const methodLabel = (m: string) => PAYMENT_METHOD_LABEL[m as PaymentMethod] ?? m;

/**
 * Cơ cấu theo phương thức thanh toán: cột ngang 1 chuỗi (màu `primary`), nhãn + số tiền ghi trực tiếp
 * bằng màu chữ trung tính, tooltip khi rê chuột/focus.
 */
export function PaymentMethodsCard({
  report,
  loading,
}: {
  report: SalesReport | undefined;
  loading: boolean;
}) {
  const rows = report?.byPaymentMethod ?? [];
  const total = rows.reduce((s, r) => s + Math.max(0, r.amount), 0);
  const max = Math.max(1, ...rows.map((r) => r.amount));
  const [active, setActive] = useState<string | null>(null);

  return (
    <ChartCard
      title="Theo phương thức thanh toán"
      description="Số tiền thực thu (đã trừ hoàn)"
      loading={loading}
      chart={
        rows.length === 0 ? (
          <EmptyNote>Chưa có giao dịch trong khoảng này.</EmptyNote>
        ) : (
          <ul className="space-y-3" aria-label="Biểu đồ theo phương thức thanh toán">
            {rows.map((r) => {
              const share = total > 0 ? Math.round((Math.max(0, r.amount) / total) * 100) : 0;
              return (
                <li
                  key={r.method}
                  tabIndex={0}
                  onMouseEnter={() => setActive(r.method)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(r.method)}
                  onBlur={() => setActive(null)}
                  className="focus-visible:ring-ring relative rounded-sm outline-none focus-visible:ring-2"
                >
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate">{methodLabel(r.method)}</span>
                    <span className="text-muted-foreground shrink-0 tabular-nums">
                      <span className="text-foreground font-medium">{formatVnd(r.amount)}</span> ·{" "}
                      {share}%
                    </span>
                  </div>
                  <div className="h-3">
                    <div
                      className={cn(
                        "bg-primary h-full rounded-r-[4px] transition-opacity",
                        active !== null && active !== r.method && "opacity-40",
                      )}
                      style={{ width: `${(Math.max(0, r.amount) / max) * 100}%` }}
                    />
                  </div>
                  {active === r.method && (
                    <div
                      role="status"
                      className="bg-popover text-popover-foreground pointer-events-none absolute top-full right-0 z-10 mt-1 rounded-md border px-2.5 py-1.5 text-xs whitespace-nowrap shadow-md"
                    >
                      <div className="text-muted-foreground">{methodLabel(r.method)}</div>
                      <div className="font-semibold tabular-nums">{formatVnd(r.amount)}</div>
                      <div className="text-muted-foreground">
                        {r.count} giao dịch
                        {r.refunded > 0 && ` · đã hoàn ${formatVnd(r.refunded)}`}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )
      }
      table={
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phương thức</TableHead>
              <TableHead className="text-right">Thực thu</TableHead>
              <TableHead className="text-right">Đã hoàn</TableHead>
              <TableHead className="text-right">Giao dịch</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.method}>
                <TableCell>{methodLabel(r.method)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatVnd(r.amount)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatVnd(r.refunded)}</TableCell>
                <TableCell className="text-right tabular-nums">{r.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }
    />
  );
}
