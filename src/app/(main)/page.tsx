"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MenuToggle } from "@/components/menu-toggle";
import { Separator } from "@/components/ui/separator";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useDailySummary, useTodaySummary, type DailySalesSummary } from "@/hooks/api/use-reports";

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function yesterdayYmd(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Tổng doanh thu / số đơn từ 0h tới hết giờ hiện tại — để so cùng mốc với hôm qua. */
function upToHour(s: DailySalesSummary | undefined, hour: number) {
  const rows = (s?.byHour ?? []).filter((h) => h.hour <= hour);
  return {
    revenue: rows.reduce((a, h) => a + h.revenue, 0),
    orders: rows.reduce((a, h) => a + h.orderCount, 0),
  };
}

/** % thay đổi so với hôm qua; null khi hôm qua = 0 (không có mốc so sánh). */
function pctChange(today: number, yesterday: number): number | null {
  if (yesterday <= 0) return null;
  return Math.round(((today - yesterday) / yesterday) * 100);
}

function Delta({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
      <Icon
        className={`size-3.5 ${up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
        aria-hidden
      />
      <span>
        {up ? "Tăng" : "Giảm"} {Math.abs(pct)}% so với cùng giờ hôm qua
      </span>
    </p>
  );
}

function StatCard({
  title,
  value,
  hint,
  delta,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string;
  hint?: string;
  delta?: number | null;
  icon: typeof DollarSign;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="mb-1 h-8 w-32" />
        ) : (
          <div className="text-2xl font-bold tabular-nums">{value}</div>
        )}
        {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
        {delta !== undefined && !loading && <Delta pct={delta} />}
      </CardContent>
    </Card>
  );
}

function HourlyChart({
  data,
  loading,
}: {
  data: Array<{ hour: number; revenue: number; orderCount: number }>;
  loading: boolean;
}) {
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.revenue)), [data]);

  if (loading) return <Skeleton className="h-48 w-full rounded-lg" />;

  // Chỉ hiển thị 6h–24h (giờ kinh doanh)
  const visible = data.filter((d) => d.hour >= 6 && d.hour <= 23);

  return (
    <div className="flex h-48 w-full items-end gap-1">
      {visible.map((d) => {
        const h = (d.revenue / max) * 100;
        return (
          <div
            key={d.hour}
            className="group relative flex flex-1 flex-col items-center justify-end"
          >
            <div
              className="bg-primary/20 group-hover:bg-primary/40 relative w-full rounded-t transition-colors"
              style={{ height: `${Math.max(2, h)}%` }}
            >
              {d.revenue > 0 && (
                <div className="bg-foreground text-background absolute -top-6 left-1/2 -translate-x-1/2 rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100">
                  {formatVnd(d.revenue)}
                </div>
              )}
            </div>
            <div className="text-muted-foreground mt-1 text-[10px] tabular-nums">{d.hour}h</div>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useTodaySummary();
  const yesterday = useDailySummary(yesterdayYmd());
  const nowHour = new Date().getHours();
  const todayCum = upToHour(data, nowHour);
  const yCum = upToHour(yesterday.data, nowHour);

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-3 md:px-4">
        <MenuToggle />
        <Separator orientation="vertical" className="mr-2 hidden h-4 md:block" />
        <h1 className="text-base font-semibold md:text-lg">Tổng quan hôm nay</h1>
        <div className="ml-auto flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/kds">Màn bếp</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/pos">
              Vào POS
              <ArrowUpRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-4 md:p-6">
        {error ? (
          <Card>
            <CardContent className="space-y-2 py-8 text-center">
              <p className="text-destructive">Không tải được dữ liệu báo cáo.</p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Thử lại
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Doanh thu (đã thu)"
                value={data ? formatVnd(data.revenue.net) : "—"}
                hint={data ? `Tổng giá trị đơn: ${formatVnd(data.revenue.gross)}` : undefined}
                delta={yesterday.data ? pctChange(todayCum.revenue, yCum.revenue) : undefined}
                icon={DollarSign}
                loading={isLoading}
              />
              <StatCard
                title="Đơn hôm nay"
                value={data ? data.orders.count.toString() : "—"}
                hint={
                  data?.orders.cancelledCount ? `${data.orders.cancelledCount} đã huỷ` : undefined
                }
                delta={yesterday.data ? pctChange(todayCum.orders, yCum.orders) : undefined}
                icon={UtensilsCrossed}
                loading={isLoading}
              />
              <StatCard
                title="Đã thanh toán"
                value={data ? formatVnd(data.byPaymentStatus.paid) : "—"}
                icon={CheckCircle2}
                loading={isLoading}
              />
              <StatCard
                title="Chưa thu"
                value={data ? formatVnd(data.byPaymentStatus.pending) : "—"}
                icon={Clock}
                loading={isLoading}
              />
            </div>

            {/* Hourly + Top items */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="size-4" /> Doanh thu theo giờ
                  </CardTitle>
                  <CardDescription>Giờ kinh doanh 6h–23h</CardDescription>
                </CardHeader>
                <CardContent>
                  <HourlyChart data={data?.byHour ?? []} loading={isLoading} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top món bán chạy</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : data?.topItems.length === 0 ? (
                    <p className="text-muted-foreground py-4 text-center text-sm">
                      Chưa có dữ liệu
                    </p>
                  ) : (
                    <ol className="space-y-2.5">
                      {data?.topItems.slice(0, 8).map((it, idx) => (
                        <li key={it.menuItemId} className="flex items-center gap-3">
                          <div className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                            {idx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{it.name}</div>
                            <div className="text-muted-foreground text-xs tabular-nums">
                              {it.quantity} bán · {formatVnd(it.revenue)}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
