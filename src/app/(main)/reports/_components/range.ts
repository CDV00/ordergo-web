import { todayYmd } from "@/lib/format";

export type RangePreset = "today" | "7d" | "30d" | "month" | "custom";

export const RANGE_PRESETS: Array<{ value: RangePreset; label: string }> = [
  { value: "today", label: "Hôm nay" },
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "month", label: "Tháng này" },
  { value: "custom", label: "Tuỳ chọn" },
];

/** API giới hạn tối đa 92 ngày mỗi báo cáo. */
export const MAX_RANGE_DAYS = 92;

/** Phép tính lịch thuần trên YYYY-MM-DD (UTC) — không phụ thuộc giờ máy. */
export function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  const ms = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((ms(to) - ms(from)) / 86_400_000) + 1;
}

export function presetRange(preset: Exclude<RangePreset, "custom">): { from: string; to: string } {
  const today = todayYmd();
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "30d":
      return { from: addDays(today, -29), to: today };
    case "month":
      return { from: `${today.slice(0, 8)}01`, to: today };
  }
}

/** "2026-11-09" → "09/11" */
export function shortDate(ymd: string): string {
  return `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}`;
}

/** "2026-11-09" → "09/11/2026" */
export function fullDate(ymd: string): string {
  return `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}/${ymd.slice(0, 4)}`;
}

/** Số tiền gọn cho nhãn trục: 1.250.000 → "1,3tr", 45.000 → "45k". */
export function compactVnd(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(".", ",")}tỷ`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")}tr`;
  if (abs >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}
