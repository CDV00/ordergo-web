"use client";

import { SlidingNumber } from "@/components/animate-ui/primitives/texts/sliding-number";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  /** "vnd" → 125.000đ · "count" → 1.234 */
  format?: "vnd" | "count";
  className?: string;
}

/**
 * Số chạy (animate-ui SlidingNumber): từng chữ số trượt tới giá trị mới khi dữ liệu realtime đổi.
 * Dùng cho tổng tiền, doanh thu, số đơn — nơi người dùng cần thấy "số vừa nhảy".
 */
export function AnimatedNumber({ value, format = "count", className }: Props) {
  const n = Math.round(Number.isFinite(value) ? value : 0);
  return (
    <span className={cn("tabular inline-flex items-baseline", className)} data-animated-number={n}>
      {/* Giá trị thật cho trình đọc màn hình / tìm kiếm văn bản; phần số trượt chỉ để nhìn */}
      <span className="sr-only">{label(n, format)}</span>
      {n < 0 && <span aria-hidden>-</span>}
      <SlidingNumber aria-hidden number={Math.abs(n)} thousandSeparator="." decimalSeparator="," />
      {format === "vnd" && <span aria-hidden>đ</span>}
    </span>
  );
}

function label(n: number, format: "vnd" | "count") {
  const s = n.toLocaleString("vi-VN");
  return format === "vnd" ? `${s}đ` : s;
}
