"use client";

import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Clock, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useChangeTableStatus } from "@/hooks/api/use-tables";
import { ApiException } from "@/lib/api-client";
import { TABLE_STATUS_LABEL, formatTime, minutesSince } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RestaurantTable, TableStatus } from "@/types/api";

export const TABLE_STATUS_CLASS: Record<TableStatus, string> = {
  available: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
  occupied: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  reserved: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  cleaning: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  out_of_order: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300",
};

/** "occupied" do đơn hàng tự đặt — không cho đổi tay. */
const MANUAL_STATUSES: TableStatus[] = ["available", "reserved", "cleaning", "out_of_order"];
/** Không cho về các trạng thái này khi bàn còn đơn mở. */
const BLOCKED_WHEN_OPEN: TableStatus[] = ["available", "cleaning"];

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} giờ ${m} phút` : `${h} giờ`;
}

/** Re-render định kỳ để thời gian ngồi tự cập nhật. */
function useTick(ms: number) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-right text-sm font-medium">{children}</span>
    </div>
  );
}

interface Props {
  table: RestaurantTable;
  hasOpenOrders: boolean;
  /** Chưa biết bàn có đơn mở không (đang tải / lỗi) — tạm khoá trạng thái "Trống"/"Cần dọn". */
  ordersUnknown: boolean;
}

export function TableInfoCard({ table, hasOpenOrders, ordersUnknown }: Props) {
  useTick(30_000);
  const changeStatus = useChangeTableStatus();

  const onChange = async (status: TableStatus) => {
    try {
      await changeStatus.mutateAsync({ id: table.id, status });
      toast.success(`Đã chuyển sang "${TABLE_STATUS_LABEL[status]}"`);
    } catch (err) {
      toast.error(err instanceof ApiException ? err.error.message : "Có lỗi xảy ra");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Thông tin bàn</CardTitle>
        <CardDescription>Khu vực, sức chứa và trạng thái</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row label="Khu vực">{table.section || "—"}</Row>
        <Row label="Sức chứa">
          <span className="inline-flex items-center gap-1">
            <Users className="h-4 w-4" /> {table.capacity} chỗ
          </span>
        </Row>
        <Row label="Trạng thái">
          <Badge className={cn("border-transparent", TABLE_STATUS_CLASS[table.status])}>
            {TABLE_STATUS_LABEL[table.status]}
          </Badge>
        </Row>
        {table.occupiedSince && (
          <Row label="Khách ngồi">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDuration(minutesSince(table.occupiedSince))} (từ{" "}
              {formatTime(table.occupiedSince)})
            </span>
          </Row>
        )}

        <div className="space-y-2 border-t pt-3">
          <p className="text-sm font-medium">Đổi trạng thái</p>
          <div className="grid grid-cols-2 gap-2">
            {MANUAL_STATUSES.map((s) => {
              const blocked = (hasOpenOrders || ordersUnknown) && BLOCKED_WHEN_OPEN.includes(s);
              const current = table.status === s;
              return (
                <Button
                  key={s}
                  size="sm"
                  variant={current ? "default" : "outline"}
                  className="min-h-[40px]"
                  disabled={current || blocked || changeStatus.isPending}
                  title={blocked ? "Bàn còn đơn chưa thanh toán" : undefined}
                  onClick={() => onChange(s)}
                >
                  {TABLE_STATUS_LABEL[s]}
                </Button>
              );
            })}
          </div>
          {table.status === "occupied" && (
            <p className="text-muted-foreground text-xs">
              &quot;{TABLE_STATUS_LABEL.occupied}&quot; được đặt tự động khi bàn có đơn.
            </p>
          )}
          {hasOpenOrders && (
            <p className="text-muted-foreground text-xs">
              Bàn còn đơn chưa thanh toán nên chưa thể chuyển về &quot;
              {TABLE_STATUS_LABEL.available}&quot; hoặc &quot;{TABLE_STATUS_LABEL.cleaning}&quot;.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
