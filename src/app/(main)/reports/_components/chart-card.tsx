"use client";

import { useState, type ReactNode } from "react";
import { BarChart3, Table2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="min-w-0">
          <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div
          role="group"
          aria-label="Cách hiển thị"
          className="bg-muted flex shrink-0 rounded-md p-0.5"
        >
          <ViewButton active={view === "chart"} onClick={() => setView("chart")} label="Biểu đồ">
            <BarChart3 className="h-4 w-4" />
          </ViewButton>
          <ViewButton active={view === "table"} onClick={() => setView("table")} label="Bảng">
            <Table2 className="h-4 w-4" />
          </ViewButton>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-48 w-full" /> : view === "chart" ? chart : table}
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
        "text-muted-foreground flex h-8 min-w-9 items-center justify-center rounded px-2 transition-colors",
        active ? "bg-background text-foreground shadow-sm" : "hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** Thông báo rỗng dùng chung trong các thẻ. */
export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground py-8 text-center text-sm">{children}</p>;
}
