"use client";

import { memo, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Users } from "lucide-react";
import { useTables } from "@/hooks/api/use-tables";
import type { RestaurantTable, TableStatus } from "@/types/api";

const STATUS_LABELS: Record<TableStatus, string> = {
  available: "Trống",
  occupied: "Đang phục vụ",
  reserved: "Đã đặt",
  cleaning: "Cần dọn",
  out_of_order: "Hỏng",
};

const STATUS_BG: Record<TableStatus, string> = {
  available:
    "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 dark:border-emerald-800",
  occupied:
    "bg-blue-50 hover:bg-blue-100 border-blue-200 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 dark:border-blue-800",
  reserved:
    "bg-amber-50 hover:bg-amber-100 border-amber-200 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 dark:border-amber-800",
  cleaning: "bg-orange-50 hover:bg-orange-100 border-orange-200 dark:bg-orange-950/40",
  out_of_order: "bg-rose-50 border-rose-200 dark:bg-rose-950/40 cursor-not-allowed opacity-50",
};

interface Props {
  onPickTable: (tableId: string, tableName: string) => void;
  onPickTakeaway: () => void;
}

function TablePickerInner({ onPickTable, onPickTakeaway }: Props) {
  const { data, isLoading, error } = useTables();

  const grouped = useMemo(() => {
    if (!data) return {} as Record<string, RestaurantTable[]>;
    return data.reduce<Record<string, RestaurantTable[]>>((acc, t) => {
      (acc[t.section] ??= []).push(t);
      return acc;
    }, {});
  }, [data]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive p-4">Không tải được danh sách bàn.</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Chọn bàn để bắt đầu</h2>
        <Button size="lg" onClick={onPickTakeaway}>
          <Package className="mr-2 size-5" /> Mang về
        </Button>
      </div>

      {data?.length === 0 && (
        <Card className="text-muted-foreground p-12 text-center">
          Chưa có bàn nào. Vào trang <strong>Bàn ăn</strong> để tạo trước.
        </Card>
      )}

      {Object.entries(grouped).map(([section, list]) => (
        <section key={section} className="space-y-3">
          <h3 className="text-muted-foreground text-sm font-semibold uppercase">{section}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {list.map((t) => (
              <button
                key={t.id}
                disabled={t.status === "out_of_order"}
                onClick={() => onPickTable(t.id, t.name)}
                className={`${STATUS_BG[t.status]} focus:ring-primary rounded-xl border-2 p-4 text-left transition-colors focus:ring-2 focus:outline-none active:scale-[0.98]`}
              >
                <div className="text-base font-semibold">{t.name}</div>
                <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                  <Users className="size-3" /> {t.capacity}
                </div>
                <div className="mt-1.5 text-xs font-medium">{STATUS_LABELS[t.status]}</div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export const TablePicker = memo(TablePickerInner);
