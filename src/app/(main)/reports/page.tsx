"use client";

import { useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import { FadeIn } from "@/components/motion";
import { ALL_VENUES, useSalesReport, type ReportRangeParams } from "@/hooks/api/use-reports";
import { useAccessibleVenues } from "@/hooks/api/use-tenant";
import { useAuth } from "@/contexts/auth-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiException } from "@/lib/api-client";
import { todayYmd } from "@/lib/format";
import { KpiTiles } from "./_components/kpi-tiles";
import { PaymentMethodsCard } from "./_components/payment-methods-card";
import {
  addDays,
  daysBetween,
  fullDate,
  MAX_RANGE_DAYS,
  presetRange,
  type RangePreset,
} from "./_components/range";
import { ExportCsvButton, ReportToolbar } from "./_components/report-toolbar";
import { StaffTable, TopItemsTable } from "./_components/report-tables";
import { ReportsShell, StateMessage } from "./_components/reports-shell";
import { DailyRevenueCard, HourlyCard } from "./_components/sales-charts";
import { VenueBreakdownCard } from "./_components/venue-breakdown-card";

/** Kiểm tra khoảng tuỳ chọn ở client (server vẫn kiểm lại). */
function validateCustom(r: ReportRangeParams): string | null {
  if (!r.from || !r.to) return "Chọn đủ ngày bắt đầu và kết thúc.";
  if (r.from > r.to) return "Ngày bắt đầu phải trước ngày kết thúc.";
  if (daysBetween(r.from, r.to) > MAX_RANGE_DAYS)
    return `Chỉ xem được tối đa ${MAX_RANGE_DAYS} ngày mỗi lần.`;
  return null;
}

export default function ReportsPage() {
  const [preset, setPreset] = useState<RangePreset>("7d");
  const [custom, setCustom] = useState<ReportRangeParams>(() => {
    const today = todayYmd();
    return { from: addDays(today, -6), to: today };
  });

  const customError = preset === "custom" ? validateCustom(custom) : null;
  const range = useMemo<ReportRangeParams | null>(() => {
    if (preset !== "custom") return presetRange(preset);
    return customError ? null : custom;
  }, [preset, custom, customError]);

  // Người toàn chuỗi chọn được cơ sở khác hoặc "Tất cả cơ sở"; null = theo cơ sở đang chọn.
  const { activeVenueId } = useAuth();
  const { venues, tenantWide } = useAccessibleVenues();
  const [venueSel, setVenueSel] = useState<string | null>(null);
  const viewVenueId = tenantWide ? (venueSel ?? activeVenueId) : activeVenueId;
  const isAll = viewVenueId === ALL_VENUES;
  const venueLabel = isAll
    ? "Tất cả cơ sở"
    : (venues.find((v) => v.id === viewVenueId)?.name ?? null);

  const report = useSalesReport(range ?? { from: "", to: "" }, viewVenueId);
  const loading = !!range && report.isLoading;
  const err = report.error;
  const forbidden = err instanceof ApiException && err.status === 403;

  const onPreset = (p: RangePreset) => {
    // Chuyển sang tuỳ chọn → bắt đầu từ khoảng đang xem
    if (p === "custom" && range) setCustom(range);
    setPreset(p);
  };

  const rangeLabel = range
    ? range.from === range.to
      ? `Ngày ${fullDate(range.from)}`
      : `Từ ${fullDate(range.from)} đến ${fullDate(range.to)}`
    : "Chọn khoảng thời gian";

  return (
    <ReportsShell
      description={
        tenantWide && venueLabel
          ? `${venueLabel} · doanh thu, món bán chạy và nhân viên`
          : "Doanh thu, món bán chạy và nhân viên theo khoảng thời gian"
      }
      actions={
        <>
          {tenantWide && venues.length > 0 && (
            <Select value={viewVenueId ?? ""} onValueChange={(v) => v && setVenueSel(v)}>
              <SelectTrigger className="bg-card min-h-[44px] w-[200px]" aria-label="Cơ sở">
                <Building2 className="text-muted-foreground size-4 shrink-0" aria-hidden />
                <SelectValue placeholder="Chọn cơ sở" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VENUES}>Tất cả cơ sở</SelectItem>
                {venues.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <ExportCsvButton range={range} venueId={viewVenueId} />
        </>
      }
    >
      <FadeIn delay={0.04}>
        <ReportToolbar
          preset={preset}
          onPreset={onPreset}
          custom={custom}
          onCustom={setCustom}
          rangeLabel={rangeLabel}
          rangeError={customError}
        />
      </FadeIn>

      {forbidden ? (
        <StateMessage
          title="Bạn không có quyền xem báo cáo"
          description="Chỉ quản lý, kế toán hoặc chủ quán mới xem được báo cáo bán hàng."
        />
      ) : err ? (
        <StateMessage
          title="Không tải được báo cáo"
          description={err instanceof ApiException ? err.error?.message : undefined}
          onRetry={() => void report.refetch()}
        />
      ) : (
        <>
          <KpiTiles report={report.data} loading={loading} />
          <FadeIn delay={0.08} className="space-y-6">
            {isAll && <VenueBreakdownCard report={report.data} loading={loading} />}
            <div className="grid gap-6 xl:grid-cols-3">
              <DailyRevenueCard report={report.data} loading={loading} className="xl:col-span-2" />
              <PaymentMethodsCard report={report.data} loading={loading} />
            </div>
            <HourlyCard report={report.data} loading={loading} />
            <div className="grid gap-6 lg:grid-cols-2">
              <TopItemsTable report={report.data} loading={loading} />
              <StaffTable report={report.data} loading={loading} />
            </div>
          </FadeIn>
        </>
      )}
    </ReportsShell>
  );
}
