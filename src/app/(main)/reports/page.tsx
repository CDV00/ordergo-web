"use client";

import { useMemo, useState } from "react";
import { useSalesReport, type ReportRangeParams } from "@/hooks/api/use-reports";
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
import { ReportToolbar } from "./_components/report-toolbar";
import { StaffTable, TopItemsTable } from "./_components/report-tables";
import { ReportsShell, StateMessage } from "./_components/reports-shell";
import { DailyRevenueCard, HourlyCard } from "./_components/sales-charts";

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

  const report = useSalesReport(range ?? { from: "", to: "" });
  const loading = !!range && report.isLoading;
  const err = report.error;
  const forbidden = err instanceof ApiException && err.status === 403;

  const onPreset = (p: RangePreset) => {
    // Chuyển sang tuỳ chọn → bắt đầu từ khoảng đang xem
    if (p === "custom" && range) setCustom(range);
    setPreset(p);
  };

  return (
    <ReportsShell>
      <div>
        <h2 className="text-xl font-bold sm:text-2xl">Báo cáo bán hàng</h2>
        <p className="text-muted-foreground text-sm">
          {range
            ? range.from === range.to
              ? `Ngày ${fullDate(range.from)}`
              : `Từ ${fullDate(range.from)} đến ${fullDate(range.to)}`
            : "Chọn khoảng thời gian"}
        </p>
      </div>

      <ReportToolbar
        preset={preset}
        onPreset={onPreset}
        custom={custom}
        onCustom={setCustom}
        range={range}
        rangeError={customError}
      />

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
          <div className="grid gap-4 xl:grid-cols-3">
            <DailyRevenueCard report={report.data} loading={loading} className="xl:col-span-2" />
            <PaymentMethodsCard report={report.data} loading={loading} />
          </div>
          <HourlyCard report={report.data} loading={loading} />
          <div className="grid gap-4 lg:grid-cols-2">
            <TopItemsTable report={report.data} loading={loading} />
            <StaffTable report={report.data} loading={loading} />
          </div>
        </>
      )}
    </ReportsShell>
  );
}
