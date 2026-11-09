"use client";

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
import { BarChart } from "./bar-chart";
import { ChartCard, EmptyNote } from "./chart-card";
import { compactVnd } from "./range";

/** Nhãn trục X ngắn: bỏ phần tên chuỗi trước dấu " - " (vd "Góc Phố - Quận 1" → "Quận 1"). */
function shortVenue(name: string): string {
  const parts = name.split(" - ");
  const s = parts[parts.length - 1] ?? name;
  return s.length > 14 ? `${s.slice(0, 13)}…` : s;
}

/** "Theo chi nhánh" — chỉ hiện khi xem toàn chuỗi. Doanh thu thuần (đã thu − hoàn), 1 chuỗi. */
export function VenueBreakdownCard({
  report,
  loading,
}: {
  report: SalesReport | undefined;
  loading: boolean;
}) {
  const rows = report?.byVenue ?? [];
  const hasData = rows.some((r) => r.revenue !== 0 || r.orders > 0);
  return (
    <ChartCard
      title="Theo chi nhánh"
      description="Doanh thu thuần của từng cơ sở trong khoảng"
      loading={loading}
      chart={
        hasData ? (
          <BarChart
            ariaLabel="Biểu đồ doanh thu theo chi nhánh"
            formatValue={formatVnd}
            formatAxis={compactVnd}
            maxLabels={12}
            data={rows.map((r) => ({
              key: r.venueId,
              label: shortVenue(r.venueName),
              title: r.venueName,
              value: r.revenue,
              detail: `${r.orders} đơn · TB ${formatVnd(r.averageTicket)}`,
            }))}
          />
        ) : (
          <EmptyNote>Chưa có dữ liệu trong khoảng này.</EmptyNote>
        )
      }
      table={
        <div className="max-h-80 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chi nhánh</TableHead>
                <TableHead className="text-right">Doanh thu</TableHead>
                <TableHead className="text-right">Đơn</TableHead>
                <TableHead className="text-right">TB/đơn</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.venueId}>
                  <TableCell className="font-medium">{r.venueName}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatVnd(r.revenue)}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.orders}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatVnd(r.averageTicket)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      }
    />
  );
}
