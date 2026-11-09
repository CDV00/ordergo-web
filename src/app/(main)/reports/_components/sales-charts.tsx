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
import { compactVnd, fullDate, shortDate } from "./range";

/** Doanh thu thuần theo ngày (mọi ngày trong khoảng, kể cả ngày 0đ). */
export function DailyRevenueCard({
  report,
  loading,
  className,
}: {
  report: SalesReport | undefined;
  loading: boolean;
  className?: string;
}) {
  const daily = report?.daily ?? [];
  return (
    <ChartCard
      className={className}
      title="Doanh thu theo ngày"
      description="Đã thu − đã hoàn, theo giờ của cơ sở"
      loading={loading}
      chart={
        daily.length <= 1 ? (
          <EmptyNote>Chọn khoảng nhiều ngày để xem biểu đồ theo ngày.</EmptyNote>
        ) : (
          <BarChart
            ariaLabel="Biểu đồ doanh thu theo ngày"
            formatValue={formatVnd}
            formatAxis={compactVnd}
            data={daily.map((d) => ({
              key: d.date,
              label: shortDate(d.date),
              title: fullDate(d.date),
              value: d.revenue,
              detail: `${d.orders} đơn`,
            }))}
          />
        )
      }
      table={
        <div className="max-h-80 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày</TableHead>
                <TableHead className="text-right">Doanh thu</TableHead>
                <TableHead className="text-right">Số đơn</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daily.map((d) => (
                <TableRow key={d.date}>
                  <TableCell>{fullDate(d.date)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatVnd(d.revenue)}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.orders}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      }
    />
  );
}

/** Doanh thu theo giờ trong ngày (gộp cả khoảng). Số đơn nằm trong tooltip/bảng — không dùng trục kép. */
export function HourlyCard({
  report,
  loading,
}: {
  report: SalesReport | undefined;
  loading: boolean;
}) {
  const hours = report?.byHour ?? [];
  const hasData = hours.some((h) => h.orders > 0 || h.revenue !== 0);
  return (
    <ChartCard
      title="Doanh thu theo giờ"
      description="Gộp mọi ngày trong khoảng"
      loading={loading}
      chart={
        hasData ? (
          <BarChart
            ariaLabel="Biểu đồ doanh thu theo giờ trong ngày"
            formatValue={formatVnd}
            formatAxis={compactVnd}
            maxLabels={8}
            data={hours.map((h) => ({
              key: String(h.hour),
              label: `${h.hour}h`,
              title: `${String(h.hour).padStart(2, "0")}:00–${String(h.hour).padStart(2, "0")}:59`,
              value: h.revenue,
              detail: `${h.orders} đơn`,
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
                <TableHead>Giờ</TableHead>
                <TableHead className="text-right">Doanh thu</TableHead>
                <TableHead className="text-right">Số đơn</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hours.map((h) => (
                <TableRow key={h.hour}>
                  <TableCell>{`${String(h.hour).padStart(2, "0")}:00`}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatVnd(h.revenue)}</TableCell>
                  <TableCell className="text-right tabular-nums">{h.orders}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      }
    />
  );
}
