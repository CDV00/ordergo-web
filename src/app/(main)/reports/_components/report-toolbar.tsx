"use client";

import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useExportSalesReport, type ReportRangeParams } from "@/hooks/api/use-reports";
import { ApiException } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { RANGE_PRESETS, type RangePreset } from "./range";

/** Chọn khoảng ngày (preset hoặc tuỳ chọn) + nút xuất CSV. */
export function ReportToolbar({
  preset,
  onPreset,
  custom,
  onCustom,
  range,
  rangeError,
}: {
  preset: RangePreset;
  onPreset: (p: RangePreset) => void;
  custom: ReportRangeParams;
  onCustom: (r: ReportRangeParams) => void;
  /** Khoảng đang áp dụng; null khi tuỳ chọn chưa hợp lệ. */
  range: ReportRangeParams | null;
  rangeError: string | null;
}) {
  const exportCsv = useExportSalesReport();

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
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="group"
          aria-label="Khoảng thời gian"
          className="bg-muted flex flex-wrap gap-0.5 rounded-md p-0.5"
        >
          {RANGE_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              aria-pressed={preset === p.value}
              onClick={() => onPreset(p.value)}
              className={cn(
                "text-muted-foreground min-h-[40px] rounded px-3 text-sm font-medium transition-colors",
                preset === p.value
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
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
      </div>

      {preset === "custom" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
    </div>
  );
}
