"use client";

import type * as React from "react";
import { AnimatedNumber } from "@/components/animated-number";
import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "warning" | "info" | "neutral";

const TONE: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
  neutral: "bg-muted text-muted-foreground",
};

interface Props {
  label: string;
  value: number;
  format?: "vnd" | "count";
  icon?: React.ComponentType<{ className?: string }>;
  tone?: Tone;
  /** Dòng phụ dưới số (so sánh, ghi chú) */
  hint?: React.ReactNode;
  className?: string;
}

/** Thẻ số liệu: nhãn + số chạy (SlidingNumber) + icon màu theo ý nghĩa. */
export function StatCard({
  label,
  value,
  format = "count",
  icon: Icon,
  tone = "primary",
  hint,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground rounded-2xl border p-4 shadow-xs sm:p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        {Icon && (
          <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", TONE[tone])}>
            <Icon className="size-[18px]" />
          </div>
        )}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight sm:text-[28px]">
        <AnimatedNumber value={value} format={format} />
      </div>
      {hint && <div className="text-muted-foreground mt-1 text-xs">{hint}</div>}
    </div>
  );
}
