"use client";

import { useState, type ReactNode } from "react";
import { BarChart3, Table2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Highlight, HighlightItem } from "@/components/animate-ui/primitives/effects/highlight";
import { cn } from "@/lib/utils";

type View = "chart" | "table";

/** Thẻ biểu đồ: tiêu đề gọi tên chuỗi số liệu + nút chuyển Biểu đồ / Bảng (bản truy cập được). */
export function ChartCard({
  title,
  description,
  loading,
  chart,
  table,
  className,
}: {
  title: string;
  description?: string;
  loading?: boolean;
  chart: ReactNode;
  table: ReactNode;
  className?: string;
}) {
  const [view, setView] = useState<View>("chart");
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-4">
        <div className="min-w-0">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription className="mt-0.5">{description}</CardDescription>}
        </div>
        <Highlight
          value={view}
          click={false}
          controlledItems
          className="bg-card inset-0 rounded-md shadow-xs"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        >
          <div
            role="group"
            aria-label="Cách hiển thị"
            className="bg-muted flex shrink-0 rounded-lg p-0.5"
          >
            <HighlightItem value="chart">
              <ViewButton
                active={view === "chart"}
                onClick={() => setView("chart")}
                label="Biểu đồ"
              >
                <BarChart3 className="h-4 w-4" />
              </ViewButton>
            </HighlightItem>
            <HighlightItem value="table">
              <ViewButton active={view === "table"} onClick={() => setView("table")} label="Bảng">
                <Table2 className="h-4 w-4" />
              </ViewButton>
            </HighlightItem>
          </div>
        </Highlight>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : view === "chart" ? (
          chart
        ) : (
          table
        )}
      </CardContent>
    </Card>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-8 min-w-9 items-center justify-center rounded-md px-2 transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** Thông báo rỗng dùng chung trong các thẻ. */
export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="text-muted-foreground bg-muted/40 rounded-xl border border-dashed px-4 py-10 text-center text-sm">
      {children}
    </p>
  );
}
