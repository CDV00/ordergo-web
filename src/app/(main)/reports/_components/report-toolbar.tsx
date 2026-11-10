"use client";

import { CalendarRange, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Highlight, HighlightItem } from "@/components/animate-ui/primitives/effects/highlight";
import { AutoHeight } from "@/components/animate-ui/primitives/effects/auto-height";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useExportSalesReport, type ReportRangeParams } from "@/hooks/api/use-reports";
import { ApiException } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { RANGE_PRESETS, type RangePreset } from "./range";

/** Nút xuất CSV của khoảng đang xem. */
export function ExportCsvButton({
  range,
  venueId,
}: {
  /** Khoảng đang áp dụng; null khi tuỳ chọn chưa hợp lệ. */
  range: ReportRangeParams | null;
  /** Cơ sở đang xem ("all" = toàn chuỗi); bỏ trống = cơ sở đang chọn. */
  venueId?: string | null;
}) {
  const exportCsv = useExportSalesReport(venueId);

  const onExport = () => {
    if (!range) return;
    exportCsv.mutate(range, {
      onSuccess: (name) => toast.success(`Đã tải ${name}`),
      onError: (err) => {
        if (err instanceof ApiException && err.status === 403) {
          toast.error("Bạn không có quyền xuất báo cáo");
        } else if (err instanceof ApiException) {
          toast.error(err.error?.message ?? "Không xuất được báo cáo.");
        } else {
          toast.error("Không xuất được báo cáo.");
        }
      },
    });
  };

  return (
    <Button
      variant="outline"
      className="min-h-[44px]"
      onClick={onExport}
      disabled={!range || exportCsv.isPending}
    >
      {exportCsv.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Xuất CSV
    </Button>
  );
}

/** Chọn khoảng ngày: nút preset (nền trượt Highlight) + ô ngày khi chọn "Tuỳ chọn". */
export function ReportToolbar({
  preset,
  onPreset,
  custom,
  onCustom,
  rangeLabel,
  rangeError,
}: {
  preset: RangePreset;
  onPreset: (p: RangePreset) => void;
  custom: ReportRangeParams;
  onCustom: (r: ReportRangeParams) => void;
  /** Mô tả khoảng đang xem (vd "Từ 01/11/2026 đến 07/11/2026"). */
  rangeLabel: string;
  rangeError: string | null;
}) {
  return (
    <div className="bg-muted/40 rounded-2xl border p-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Highlight
          value={preset}
          click={false}
          controlledItems
          className="bg-primary inset-0 rounded-lg shadow-xs"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        >
          <div
            role="group"
            aria-label="Khoảng thời gian"
            className="bg-card flex flex-wrap gap-0.5 rounded-xl border p-1 shadow-xs"
          >
            {RANGE_PRESETS.map((p) => {
              const active = preset === p.value;
              return (
                <HighlightItem key={p.value} value={p.value}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => onPreset(p.value)}
                    className={cn(
                      "min-h-[40px] rounded-lg px-3.5 text-sm font-medium transition-colors",
                      active
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {p.label}
                  </button>
                </HighlightItem>
              );
            })}
          </div>
        </Highlight>
        <p className="text-muted-foreground flex items-center gap-2 px-2 text-sm">
          <CalendarRange className="size-4 shrink-0" aria-hidden />
          <span className="tabular">{rangeLabel}</span>
        </p>
      </div>

      <AutoHeight>
        {preset === "custom" && (
          <div className="flex flex-col gap-3 px-2 pt-3 pb-1 sm:flex-row sm:items-end">
            <div className="space-y-1">
              <Label htmlFor="report-from" className="text-xs">
                Từ ngày
              </Label>
              <Input
                id="report-from"
                type="date"
                value={custom.from}
                max={custom.to || undefined}
                onChange={(e) => onCustom({ ...custom, from: e.target.value })}
                className="min-h-[44px] sm:w-[170px]"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="report-to" className="text-xs">
                Đến ngày
              </Label>
              <Input
                id="report-to"
                type="date"
                value={custom.to}
                min={custom.from || undefined}
                onChange={(e) => onCustom({ ...custom, to: e.target.value })}
                className="min-h-[44px] sm:w-[170px]"
              />
            </div>
            {rangeError && <p className="text-destructive text-sm sm:pb-3">{rangeError}</p>}
          </div>
        )}
      </AutoHeight>
    </div>
  );
}
