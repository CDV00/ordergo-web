"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface BarDatum {
  key: string;
  /** Nhãn trục X (ngắn). */
  label: string;
  /** Tiêu đề trong tooltip (đầy đủ). */
  title: string;
  value: number;
  /** Dòng phụ trong tooltip (vd "3 đơn"). */
  detail?: string;
}

/** Giá trị tròn đẹp ≥ max cho đỉnh trục Y. */
function niceMax(max: number): number {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * pow >= max) ?? 10;
  return step * pow;
}

/**
 * Biểu đồ cột dọc 1 chuỗi (HTML thuần, không thư viện): cột mảnh màu `chart-1`, bo tròn phía trên,
 * neo ở đường gốc, cách nhau 2px; lưới/trục mờ; tooltip khi rê chuột/focus trên MỌI cột.
 * Một chuỗi nên không có chú giải — tiêu đề thẻ gọi tên số liệu.
 */
export function BarChart({
  data,
  formatValue,
  formatAxis,
  ariaLabel,
  height = 200,
  maxLabels = 8,
  barMaxWidth = 24,
}: {
  data: BarDatum[];
  formatValue: (v: number) => string;
  formatAxis: (v: number) => string;
  ariaLabel: string;
  height?: number;
  maxLabels?: number;
  /** Độ rộng tối đa của 1 cột (px) — cột mảnh dễ đọc hơn. */
  barMaxWidth?: number;
}) {
  const [active, setActive] = useState<number | null>(null);
  const top = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const ticks = [top, top / 2, 0];
  const labelEvery = Math.max(1, Math.ceil(data.length / maxLabels));
  const hovered = active !== null ? data[active] : null;

  return (
    <div className="flex gap-2" role="img" aria-label={ariaLabel}>
      {/* Trục Y: chỉ nhãn, chữ màu trung tính */}
      <div
        className="text-muted-foreground relative w-10 shrink-0 text-right text-[11px] tabular-nums"
        style={{ height }}
        aria-hidden
      >
        {ticks.map((t, i) => (
          <span
            key={t}
            className="absolute right-0 -translate-y-1/2"
            style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
          >
            {formatAxis(t)}
          </span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div className="relative" style={{ height }}>
          {/* Lưới ngang mờ; đường gốc đậm hơn một chút */}
          {ticks.map((t, i) => (
            <div
              key={t}
              aria-hidden
              className={cn(
                "absolute inset-x-0 border-t",
                t === 0 ? "border-border" : "border-border/40 border-dashed",
              )}
              style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
            />
          ))}

          <div className="absolute inset-0 flex items-end gap-[2px]">
            {data.map((d, i) => {
              const pct = Math.max(0, d.value) / top;
              return (
                <div
                  key={d.key}
                  tabIndex={0}
                  aria-label={`${d.title}: ${formatValue(d.value)}${d.detail ? `, ${d.detail}` : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  // Vùng bắt chuột = cả cột chiều cao, rộng hơn thanh
                  className="group flex h-full min-w-0 flex-1 cursor-default items-end justify-center outline-none"
                >
                  <div
                    className={cn(
                      "bg-chart-1 w-full rounded-t-md transition-[opacity,height] duration-300 ease-out",
                      active !== null && active !== i && "opacity-35",
                      "group-focus-visible:ring-ring group-focus-visible:ring-2 group-focus-visible:ring-offset-2",
                    )}
                    style={{
                      height: `${pct * 100}%`,
                      minHeight: d.value > 0 ? 3 : 0,
                      maxWidth: barMaxWidth,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {hovered && active !== null && (
            <div
              role="status"
              className="bg-popover text-popover-foreground pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border px-3 py-2 text-xs whitespace-nowrap shadow-lg"
              style={{
                left: `clamp(56px, ${((active + 0.5) / data.length) * 100}%, calc(100% - 56px))`,
              }}
            >
              <div className="text-muted-foreground">{hovered.title}</div>
              <div className="font-semibold tabular-nums">{formatValue(hovered.value)}</div>
              {hovered.detail && <div className="text-muted-foreground">{hovered.detail}</div>}
            </div>
          )}
        </div>

        {/* Trục X: thưa nhãn để không chồng chữ */}
        <div className="mt-1 flex gap-[2px]" aria-hidden>
          {data.map((d, i) => (
            <div
              key={d.key}
              className="text-muted-foreground min-w-0 flex-1 overflow-visible text-center text-[11px] whitespace-nowrap tabular-nums"
            >
              {i % labelEvery === 0 ? d.label : ""}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
