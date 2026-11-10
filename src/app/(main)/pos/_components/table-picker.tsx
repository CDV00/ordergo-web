"use client";

import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { AnimatedNumber } from "@/components/animated-number";
import { Pressable, Stagger, StaggerItem } from "@/components/motion";
import { Armchair, Clock, CloudOff, Package, Users } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useOutboxStore } from "@/lib/offline/outbox";
import { pendingCartKeys } from "@/lib/offline/outbox-core";
import { useTables } from "@/hooks/api/use-tables";
import { useOrders } from "@/hooks/api/use-orders";
import {
  minutesSince,
  TABLE_STATUS_ACCENT,
  TABLE_STATUS_CLASS,
  TABLE_STATUS_DOT,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RestaurantTable, TableStatus } from "@/types/api";

const STATUS_LABELS: Record<TableStatus, string> = {
  available: "Trống",
  occupied: "Đang phục vụ",
  reserved: "Đã đặt",
  cleaning: "Cần dọn",
  out_of_order: "Tạm ngưng",
};

const STATUS_ORDER: TableStatus[] = [
  "available",
  "occupied",
  "reserved",
  "cleaning",
  "out_of_order",
];

const GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

interface Props {
  onPickTable: (tableId: string, tableName: string) => void;
  onPickTakeaway: () => void;
}

interface TableCardProps {
  table: RestaurantTable;
  pending: boolean;
  open: { total: number; since: string } | undefined;
  onPick: (tableId: string, tableName: string) => void;
}

/** Thẻ bàn: chấm màu + viền nhấn theo trạng thái, tên lớn, số chỗ, tiền đơn đang mở + số phút. */
const TableCard = memo(function TableCard({ table: t, pending, open, onPick }: TableCardProps) {
  const disabled = t.status === "out_of_order";
  return (
    <Pressable
      disabled={disabled}
      onClick={() => onPick(t.id, t.name)}
      {...(disabled ? { whileHover: undefined, whileTap: undefined } : {})}
      className={cn(
        "bg-card group flex min-h-28 w-full flex-col rounded-2xl border border-l-4 p-3.5 text-left shadow-xs transition-shadow",
        "focus-visible:ring-ring/40 focus-visible:ring-[3px] focus-visible:outline-none",
        TABLE_STATUS_ACCENT[t.status],
        disabled ? "cursor-not-allowed opacity-55" : "hover:shadow-md",
        t.status === "occupied" && "bg-primary/[0.03]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="truncate text-xl leading-tight font-bold tracking-tight">{t.name}</div>
        <span
          aria-hidden
          className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", TABLE_STATUS_DOT[t.status])}
        />
      </div>
      <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
        <Users className="size-3.5" /> {t.capacity}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
            TABLE_STATUS_CLASS[t.status],
          )}
        >
          {STATUS_LABELS[t.status]}
        </span>
        {pending && (
          <span className="bg-warning-soft dark:text-warning flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-[oklch(0.5_0.12_70)]">
            <CloudOff className="size-3" /> Chờ gửi
          </span>
        )}
      </div>
      {open && (
        <div className="mt-2 flex items-baseline justify-between gap-1 border-t border-dashed pt-2 text-xs">
          <AnimatedNumber value={open.total} format="vnd" className="text-sm font-bold" />
          <span className="text-muted-foreground flex items-center gap-0.5 tabular-nums">
            <Clock className="size-3" />
            {minutesSince(open.since)}′
          </span>
        </div>
      )}
    </Pressable>
  );
});

function TablePickerInner({ onPickTable, onPickTakeaway }: Props) {
  const { data, isLoading, error } = useTables();
  const openOrders = useOrders({ status: "open" });
  const { activeTenantId } = useAuth();
  const outbox = useOutboxStore((s) => s.items);
  const pendingTables = useMemo(
    () => (activeTenantId ? pendingCartKeys(outbox, activeTenantId) : new Set<string>()),
    [outbox, activeTenantId],
  );

  /** Tổng tiền + thời điểm vào của các đơn đang mở theo bàn */
  const openByTable = useMemo(() => {
    const m = new Map<string, { total: number; since: string }>();
    for (const o of openOrders.data ?? []) {
      if (!o.tableId) continue;
      const cur = m.get(o.tableId);
      m.set(o.tableId, {
        total: (cur?.total ?? 0) + o.pricing.total.amount,
        since: cur && cur.since < o.createdAt ? cur.since : o.createdAt,
      });
    }
    return m;
  }, [openOrders.data]);

  const grouped = useMemo(() => {
    if (!data) return {} as Record<string, RestaurantTable[]>;
    return data.reduce<Record<string, RestaurantTable[]>>((acc, t) => {
      (acc[t.section] ??= []).push(t);
      return acc;
    }, {});
  }, [data]);

  /** Đếm bàn theo trạng thái cho chú thích */
  const counts = useMemo(() => {
    const c = {} as Record<TableStatus, number>;
    for (const t of data ?? []) c[t.status] = (c[t.status] ?? 0) + 1;
    return c;
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-12 w-36 rounded-xl" />
        </div>
        <div className={GRID}>
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Mất mạng mà vẫn có cache → vẫn hiện sơ đồ bàn
  if (error && !data) {
    return <div className="text-destructive p-4">Không tải được danh sách bàn.</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">Chọn bàn để bắt đầu</h2>
          {/* Chú thích trạng thái */}
          <ul className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {STATUS_ORDER.filter((s) => counts[s]).map((s) => (
              <li key={s} className="flex items-center gap-1.5">
                <span aria-hidden className={cn("size-2 rounded-full", TABLE_STATUS_DOT[s])} />
                {STATUS_LABELS[s]}
                <span className="text-foreground font-semibold tabular-nums">{counts[s]}</span>
              </li>
            ))}
          </ul>
        </div>
        <Button size="lg" onClick={onPickTakeaway} className="h-14 rounded-xl px-6 text-base">
          <Package className="size-5" /> Mang về
        </Button>
      </div>

      {data?.length === 0 && (
        <EmptyState
          icon={Armchair}
          title="Chưa có bàn nào"
          description={
            <>
              Vào trang <strong>Bàn ăn</strong> để tạo trước.
            </>
          }
        />
      )}

      {Object.entries(grouped).map(([section, list]) => (
        <section key={section} className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold">{section}</h3>
            <span className="text-muted-foreground text-xs tabular-nums">{list.length} bàn</span>
            <div className="bg-border h-px flex-1" />
          </div>
          <Stagger className={GRID} stagger={0.025}>
            {list.map((t) => (
              <StaggerItem key={t.id} className="flex">
                <TableCard
                  table={t}
                  pending={pendingTables.has(t.id)}
                  open={openByTable.get(t.id)}
                  onPick={onPickTable}
                />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      ))}
    </div>
  );
}

export const TablePicker = memo(TablePickerInner);
