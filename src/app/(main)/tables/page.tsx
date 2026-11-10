"use client";

import { useMemo } from "react";
import { MotionConfig } from "motion/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MenuToggle } from "@/components/menu-toggle";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/empty-state";
import { Stagger, StaggerItem } from "@/components/motion";
import { Armchair, ChevronRight, Printer, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useChangeTableStatus, useDeleteTable, useTables } from "@/hooks/api/use-tables";
import { ApiException } from "@/lib/api-client";
import { TABLE_STATUS_ACCENT, TABLE_STATUS_CLASS, TABLE_STATUS_DOT } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RestaurantTable, TableStatus } from "@/types/api";
import AddTableModal from "@/app/(main)/tables/modals/add-table-modal";

const STATUS_LABELS: Record<TableStatus, string> = {
  available: "Trống",
  occupied: "Đang phục vụ",
  reserved: "Đã đặt",
  cleaning: "Cần dọn",
  out_of_order: "Hỏng",
};

const STATUS_ORDER = Object.keys(STATUS_LABELS) as TableStatus[];

const GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

export default function TablesPage() {
  const tables = useTables();
  const changeStatus = useChangeTableStatus();
  const remove = useDeleteTable();

  const onChangeStatus = async (id: string, status: TableStatus) => {
    try {
      await changeStatus.mutateAsync({ id, status });
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Lỗi");
    }
  };

  const onDelete = async (id: string, name: string) => {
    if (!confirm(`Xoá bàn "${name}"?`)) return;
    try {
      await remove.mutateAsync(id);
      toast.success("Đã xoá");
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Lỗi");
    }
  };

  const grouped = (tables.data ?? []).reduce<Record<string, RestaurantTable[]>>((acc, t) => {
    (acc[t.section] ??= []).push(t);
    return acc;
  }, {});

  /** Số bàn theo trạng thái (chú thích đầu trang) */
  const counts = useMemo(() => {
    const c = {} as Record<TableStatus, number>;
    for (const t of tables.data ?? []) c[t.status] = (c[t.status] ?? 0) + 1;
    return c;
  }, [tables.data]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col">
        <header className="bg-background/85 sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
          <MenuToggle />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="bg-primary/10 text-primary hidden size-8 items-center justify-center rounded-lg sm:flex">
            <Armchair className="size-4" />
          </span>
          <h1 className="text-lg font-bold tracking-tight">Bàn ăn</h1>
          <div className="ml-auto flex gap-2">
            <Button asChild variant="outline">
              <Link href="/tables/qr">
                <Printer className="size-4" /> In QR
              </Link>
            </Button>
            <AddTableModal />
          </div>
        </header>

        <main className="flex-1 space-y-6 p-4 md:p-6">
          {tables.isLoading ? (
            <div className={GRID}>
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-2xl" />
              ))}
            </div>
          ) : tables.data?.length === 0 ? (
            <EmptyState
              icon={Armchair}
              title="Chưa có bàn nào"
              description='Bấm "Thêm bàn" để bắt đầu.'
            />
          ) : (
            <>
              {/* Chú thích trạng thái + số lượng */}
              <ul className="flex flex-wrap gap-2">
                {STATUS_ORDER.filter((s) => counts[s]).map((s) => (
                  <li
                    key={s}
                    className="bg-card flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-xs"
                  >
                    <span aria-hidden className={cn("size-2 rounded-full", TABLE_STATUS_DOT[s])} />
                    {STATUS_LABELS[s]}
                    <span className="text-muted-foreground tabular-nums">{counts[s]}</span>
                  </li>
                ))}
              </ul>

              {Object.entries(grouped).map(([section, list]) => (
                <section key={section} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold">{section}</h2>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {list.length} bàn
                    </span>
                    <div className="bg-border h-px flex-1" />
                  </div>
                  <Stagger className={GRID} stagger={0.025}>
                    {list.map((t) => (
                      <StaggerItem
                        key={t.id}
                        className={cn(
                          "bg-card flex flex-col rounded-2xl border border-l-4 p-3.5 shadow-xs transition-shadow hover:shadow-md",
                          TABLE_STATUS_ACCENT[t.status],
                          t.status === "out_of_order" && "opacity-70",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/tables/${t.id}`}
                            className="group flex min-w-0 items-center gap-1 hover:underline"
                          >
                            <span className="truncate text-xl leading-tight font-bold tracking-tight">
                              {t.name}
                            </span>
                            <ChevronRight className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                          </Link>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive -mt-1 -mr-1.5 size-9 shrink-0"
                            aria-label={`Xoá bàn ${t.name}`}
                            onClick={() => onDelete(t.id, t.name)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                          <Users className="size-3.5" /> {t.capacity} chỗ
                        </div>
                        <div className="mt-auto pt-3">
                          <Select
                            value={t.status}
                            onValueChange={(v) => onChangeStatus(t.id, v as TableStatus)}
                          >
                            <SelectTrigger
                              className={cn(
                                "h-10 rounded-full border-transparent text-xs font-semibold shadow-none",
                                TABLE_STATUS_CLASS[t.status],
                              )}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_ORDER.map((s) => (
                                <SelectItem key={s} value={s}>
                                  <span className="flex items-center gap-2">
                                    <span
                                      aria-hidden
                                      className={cn("size-2 rounded-full", TABLE_STATUS_DOT[s])}
                                    />
                                    {STATUS_LABELS[s]}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </StaggerItem>
                    ))}
                  </Stagger>
                </section>
              ))}
            </>
          )}
        </main>
      </div>
    </MotionConfig>
  );
}
