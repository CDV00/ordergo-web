"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useTodaySummary } from "@/hooks/api/use-reports";

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string;
  hint?: string;
  icon: typeof DollarSign;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-32 mb-1" />
        ) : (
          <div className="text-2xl font-bold tabular-nums">{value}</div>
        )}
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
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
    <div className="flex items-end gap-1 h-48 w-full">
      {visible.map((d) => {
        const h = (d.revenue / max) * 100;
        return (
          <div
            key={d.hour}
            className="flex-1 flex flex-col items-center justify-end group relative"
          >
            <div className="w-full bg-primary/20 group-hover:bg-primary/40 rounded-t transition-colors relative" style={{ height: `${Math.max(2, h)}%` }}>
              {d.revenue > 0 && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-medium opacity-0 group-hover:opacity-100 whitespace-nowrap bg-foreground text-background px-1.5 py-0.5 rounded">
                  {formatVnd(d.revenue)}
                </div>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground tabular-nums mt-1">
              {d.hour}h
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useTodaySummary();

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Tổng quan hôm nay</h1>
        <div className="ml-auto flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/kds">
              Màn bếp
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/pos">
              Vào POS
              <ArrowUpRight className="size-4 ml-1" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-6">
        {error ? (
          <Card>
            <CardContent className="py-8 text-center space-y-2">
              <p className="text-destructive">Không tải được dữ liệu báo cáo.</p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Thử lại
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Doanh thu (đã thu)"
                value={data ? formatVnd(data.revenue.net) : "—"}
                hint={
                  data
                    ? `Gross: ${formatVnd(data.revenue.gross)}`
                    : undefined
                }
                icon={DollarSign}
                loading={isLoading}
              />
              <StatCard
                title="Đơn hôm nay"
                value={data ? data.orders.count.toString() : "—"}
                hint={
                  data?.orders.cancelledCount
                    ? `${data.orders.cancelledCount} đã huỷ`
                    : undefined
                }
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
                title="Còn nợ"
                value={data ? formatVnd(data.byPaymentStatus.pending) : "—"}
                icon={Clock}
                loading={isLoading}
              />
            </div>

            {/* Hourly + Top items */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
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
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Chưa có dữ liệu
                    </p>
                  ) : (
                    <ol className="space-y-2.5">
                      {data?.topItems.slice(0, 8).map((it, idx) => (
                        <li key={it.menuItemId} className="flex items-center gap-3">
                          <div className="size-7 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{it.name}</div>
                            <div className="text-xs text-muted-foreground tabular-nums">
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
