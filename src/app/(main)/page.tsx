"use client";

import { useEffect, type ComponentType, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChefHat,
  Clock,
  MapPin,
  Trophy,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MenuToggle } from "@/components/menu-toggle";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { useAuth } from "@/contexts/auth-context";
import {
  ALL_VENUES,
  useDailySummary,
  useTodaySummary,
  type DailySalesSummary,
} from "@/hooks/api/use-reports";
import { useAccessibleVenues } from "@/hooks/api/use-tenant";
import { cn } from "@/lib/utils";
import { BarChart } from "./reports/_components/bar-chart";
import { compactVnd } from "./reports/_components/range";

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function yesterdayYmd(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Lời chào theo buổi trong ngày. */
function greeting(hour: number): string {
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

/** "Thứ Ba, 10 tháng 11, 2026" */
function longDate(d: Date): string {
  const s = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
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

/** Dòng phụ dưới số KPI: so với cùng giờ hôm qua (+ ghi chú). */
function KpiHint({ pct, note }: { pct?: number | null; note?: string }) {
  const hasPct = pct !== undefined && pct !== null;
  if (!hasPct && !note) return null;
  const up = (pct ?? 0) >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="flex flex-col gap-0.5">
      {hasPct && (
        <span className="flex items-center gap-1">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-px font-semibold",
              up ? "bg-success-soft text-success" : "bg-destructive/10 text-destructive",
            )}
          >
            <Icon className="size-3" aria-hidden />
            {Math.abs(pct!)}%
          </span>
          <span>{up ? "Tăng" : "Giảm"} so với cùng giờ hôm qua</span>
        </span>
      )}
      {note && <span className="truncate">{note}</span>}
    </span>
  );
}

/** Thẻ khung dùng chung cho các khối trên trang tổng quan. */
function SectionCard({
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
            <Icon className="size-[18px]" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            {description && <CardDescription className="truncate">{description}</CardDescription>}
          </div>
        </div>
        {action}
      </CardHeader>
      <CardContent className="flex-1">{children}</CardContent>
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
  if (loading) return <Skeleton className="h-[220px] w-full rounded-xl" />;

  // Chỉ hiển thị 6h–24h (giờ kinh doanh)
  const visible = data.filter((d) => d.hour >= 6 && d.hour <= 23);
  if (!visible.some((d) => d.revenue > 0)) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Chưa có doanh thu hôm nay"
        description="Biểu đồ sẽ hiện khi có đơn được thanh toán."
        className="py-10"
      />
    );
  }

  return (
    <BarChart
      ariaLabel="Biểu đồ doanh thu theo giờ hôm nay"
      formatValue={formatVnd}
      formatAxis={compactVnd}
      height={200}
      maxLabels={9}
      barMaxWidth={18}
      data={visible.map((d) => ({
        key: String(d.hour),
        label: `${d.hour}h`,
        title: `${String(d.hour).padStart(2, "0")}:00–${String(d.hour).padStart(2, "0")}:59`,
        value: d.revenue,
        detail: `${d.orderCount} đơn`,
      }))}
    />
  );
}

/** Chip thứ hạng: top 3 nổi bật bằng màu chính, còn lại trung tính. */
function RankChip({ rank }: { rank: number }) {
  return (
    <div
      className={cn(
        "tabular flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
        rank === 1
          ? "bg-primary text-primary-foreground shadow-xs"
          : rank <= 3
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground",
      )}
    >
      {rank}
    </div>
  );
}

function TopItemsCard({
  items,
  loading,
}: {
  items: DailySalesSummary["topItems"] | undefined;
  loading: boolean;
}) {
  const top = (items ?? []).slice(0, 8);
  const max = Math.max(1, ...top.map((it) => it.revenue));
  return (
    <SectionCard icon={Trophy} title="Top món bán chạy" description="Theo doanh thu hôm nay">
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : top.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="Chưa có dữ liệu"
          description="Món bán chạy sẽ hiện khi có đơn hôm nay."
          className="py-8"
        />
      ) : (
        <Stagger className="space-y-3" stagger={0.03}>
          {top.map((it, idx) => (
            <StaggerItem key={it.menuItemId}>
              <div className="flex items-center gap-3">
                <RankChip rank={idx + 1} />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">{it.name}</span>
                    <span className="tabular shrink-0 text-sm font-semibold">
                      {formatVnd(it.revenue)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-muted h-1 flex-1 overflow-hidden rounded-full" aria-hidden>
                      <div
                        className="bg-chart-1/70 h-full rounded-full"
                        style={{ width: `${(Math.max(0, it.revenue) / max) * 100}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground tabular shrink-0 text-xs">
                      {it.quantity} bán
                    </span>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </SectionCard>
  );
}

/** "Chi nhánh hôm nay": doanh thu đã thu + số đơn của từng cơ sở (người toàn chuỗi, ≥2 cơ sở). */
function VenuesTodayCard({ activeVenueId }: { activeVenueId: string | null }) {
  const { data, isLoading, error } = useTodaySummary(ALL_VENUES);
  const rows = data?.byVenue ?? [];
  const max = Math.max(1, ...rows.map((r) => r.revenue));
  return (
    <SectionCard
      icon={Building2}
      title="Chi nhánh hôm nay"
      description={
        data
          ? `Toàn chuỗi: ${formatVnd(data.revenue.net)} · ${data.orders.count} đơn`
          : "Doanh thu đã thu theo từng cơ sở"
      }
      action={
        <Button asChild size="sm" variant="ghost" className="shrink-0">
          <Link href="/reports">Báo cáo</Link>
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : error ? (
        <p className="text-muted-foreground py-2 text-sm">Không tải được số liệu chi nhánh.</p>
      ) : (
        <ul className="grid gap-x-8 gap-y-4 md:grid-cols-2">
          {rows.map((r) => {
            const current = r.venueId === activeVenueId;
            return (
              <li key={r.venueId} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-1.5 font-medium">
                    <span className="truncate">{r.venueName}</span>
                    {current && (
                      <span className="bg-primary/10 text-primary shrink-0 rounded-full px-1.5 py-px text-[11px] font-medium">
                        (đang chọn)
                      </span>
                    )}
                  </span>
                  <span className="tabular shrink-0">
                    <span className="font-semibold">{formatVnd(r.revenue)}</span>
                    <span className="text-muted-foreground"> · {r.orders} đơn</span>
                  </span>
                </div>
                <div className="bg-muted h-1.5 overflow-hidden rounded-full" aria-hidden>
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-500 ease-out",
                      current ? "bg-chart-1" : "bg-chart-1/55",
                    )}
                    style={{ width: `${(Math.max(0, r.revenue) / max) * 100}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const canView = can("report.view");
  // Phục vụ / bếp không xem được doanh thu → đưa thẳng tới màn làm việc của họ
  useEffect(() => {
    if (canView) return;
    router.replace(
      can("order.create") ? "/pos" : can("order.update_kitchen_status") ? "/kds" : "/orders",
    );
  }, [canView, can, router]);
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useTodaySummary();
  const { venues, tenantWide, activeVenue } = useAccessibleVenues();
  const showChain = canView && tenantWide && venues.length >= 2;
  const yesterday = useDailySummary(yesterdayYmd());
  const now = new Date();
  const nowHour = now.getHours();
  const todayCum = upToHour(data, nowHour);
  const yCum = upToHour(yesterday.data, nowHour);
  const firstName = user?.displayName?.trim().split(/\s+/).pop();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      {/* Lời chào + ngày + cơ sở */}
      <FadeIn className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-2">
          <MenuToggle className="mt-1" />
          <div className="min-w-0">
            <p className="text-primary text-xs font-semibold tracking-wider uppercase">
              Tổng quan hôm nay
            </p>
            <h1 className="mt-1 truncate text-2xl font-bold tracking-tight sm:text-[28px]">
              {greeting(nowHour)}
              {firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span>{longDate(now)}</span>
              {activeVenue && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden />
                  {activeVenue.name}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild variant="outline">
            <Link href="/kds">
              <ChefHat className="size-4" />
              Màn bếp
            </Link>
          </Button>
          <Button asChild>
            <Link href="/pos">
              Vào POS
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </FadeIn>

      {error ? (
        <Card>
          <CardContent className="space-y-3 py-10 text-center">
            <p className="text-destructive font-medium">Không tải được dữ liệu báo cáo.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Thử lại
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI */}
          <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StaggerItem>
              <StatCard
                label="Doanh thu (đã thu)"
                value={data?.revenue.net ?? 0}
                format="vnd"
                icon={Wallet}
                tone="primary"
                className={cn(isLoading && "animate-pulse")}
                hint={
                  <KpiHint
                    pct={yesterday.data ? pctChange(todayCum.revenue, yCum.revenue) : undefined}
                    note={data ? `Tổng giá trị đơn: ${formatVnd(data.revenue.gross)}` : undefined}
                  />
                }
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Đơn hôm nay"
                value={data?.orders.count ?? 0}
                icon={UtensilsCrossed}
                tone="info"
                className={cn(isLoading && "animate-pulse")}
                hint={
                  <KpiHint
                    pct={yesterday.data ? pctChange(todayCum.orders, yCum.orders) : undefined}
                    note={
                      data?.orders.cancelledCount
                        ? `${data.orders.cancelledCount} đã huỷ`
                        : undefined
                    }
                  />
                }
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Đã thanh toán"
                value={data?.byPaymentStatus.paid ?? 0}
                format="vnd"
                icon={CheckCircle2}
                tone="success"
                className={cn(isLoading && "animate-pulse")}
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Chưa thu"
                value={data?.byPaymentStatus.pending ?? 0}
                format="vnd"
                icon={Clock}
                tone="warning"
                className={cn(isLoading && "animate-pulse")}
              />
            </StaggerItem>
          </Stagger>

          {showChain && (
            <FadeIn delay={0.05}>
              <VenuesTodayCard activeVenueId={activeVenue?.id ?? null} />
            </FadeIn>
          )}

          {/* Doanh thu theo giờ + món bán chạy */}
          <FadeIn delay={0.08} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SectionCard
              icon={TrendingUp}
              title="Doanh thu theo giờ"
              description="Giờ kinh doanh 6h–23h"
              className="lg:col-span-2"
            >
              <HourlyChart data={data?.byHour ?? []} loading={isLoading} />
            </SectionCard>
            <TopItemsCard items={data?.topItems} loading={isLoading} />
          </FadeIn>
        </>
      )}
    </div>
  );
}
