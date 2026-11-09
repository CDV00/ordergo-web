"use client";

import { Badge } from "@/components/ui/badge";
import { PAYMENT_METHOD_LABEL } from "@/hooks/api/use-payments";
import type { Shift } from "@/hooks/api/use-shifts";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Màu chênh lệch tiền: khớp = xanh, lệch = vàng cam. */
export function differenceClass(diff: number): string {
  return diff === 0
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-amber-600 dark:text-amber-400";
}

export function formatDifference(diff: number): string {
  if (diff === 0) return "Khớp";
  return `${diff > 0 ? "Thừa" : "Thiếu"} ${formatVnd(Math.abs(diff))}`;
}

/** Badge chênh lệch (ca đã đóng) hoặc "Đang mở". */
export function DifferenceBadge({ shift }: { shift: Shift }) {
  if (shift.status === "open") {
    return (
      <Badge className="border-transparent bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300">
        Đang mở
      </Badge>
    );
  }
  const diff = shift.difference ?? 0;
  return (
    <Badge
      className={cn(
        "border-transparent",
        diff === 0
          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-300"
          : "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/50 dark:text-amber-300",
      )}
    >
      {formatDifference(diff)}
    </Badge>
  );
}

function Row({
  label,
  value,
  className,
  strong,
}: {
  label: string;
  value: string;
  className?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("tabular-nums", strong && "font-semibold", className)}>{value}</span>
    </div>
  );
}

/** Tổng hợp ca: đối soát tiền mặt + doanh thu theo phương thức. */
export function ShiftSummaryView({ shift }: { shift: Shift }) {
  const s = shift.summary;
  const closed = shift.status === "closed";
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <p className="text-sm font-semibold">Đối soát tiền mặt</p>
        <Row label="Tiền đầu ca" value={formatVnd(shift.openingCash)} />
        <Row label="Tiền mặt thu trong ca" value={`+${formatVnd(s?.cashReceived ?? 0)}`} />
        {(s?.cashRefunds ?? 0) > 0 && (
          <Row label="Tiền mặt hoàn khách" value={`−${formatVnd(s?.cashRefunds ?? 0)}`} />
        )}
        <Row
          label={closed ? "Tiền mặt dự kiến" : "Tiền mặt dự kiến (tạm tính)"}
          value={formatVnd(shift.expectedCash ?? 0)}
          strong
        />
        {closed && shift.countedCash != null && (
          <>
            <Row label="Tiền mặt đếm được" value={formatVnd(shift.countedCash)} strong />
            <Row
              label="Chênh lệch"
              value={formatDifference(shift.difference ?? 0)}
              className={differenceClass(shift.difference ?? 0)}
              strong
            />
          </>
        )}
      </div>

      <div className="space-y-1.5 border-t pt-3">
        <p className="text-sm font-semibold">Theo phương thức</p>
        {s && s.byMethod.length > 0 ? (
          s.byMethod.map((m) => (
            <Row
              key={m.method}
              label={`${PAYMENT_METHOD_LABEL[m.method] ?? m.method} (${m.count})`}
              value={formatVnd(m.amount)}
            />
          ))
        ) : (
          <p className="text-muted-foreground text-sm">Chưa có khoản thu nào.</p>
        )}
        <Row label="Tổng đã thu" value={formatVnd(s?.totalReceived ?? 0)} strong />
        {(s?.refundTotal ?? 0) > 0 && (
          <Row
            label={`Đã hoàn tiền (${s?.refundCount ?? 0})`}
            value={`−${formatVnd(s?.refundTotal ?? 0)}`}
            className="text-rose-600 dark:text-rose-400"
          />
        )}
        <Row
          label="Số giao dịch · số đơn"
          value={`${s?.paymentCount ?? 0} · ${s?.paidOrderCount ?? 0}`}
        />
      </div>
    </div>
  );
}
