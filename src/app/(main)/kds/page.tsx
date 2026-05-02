"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, ChefHat } from "lucide-react";
import { toast } from "sonner";
import {
  useKdsOrders,
  useSetLineKitchenStatus,
  type KitchenStatus,
} from "@/hooks/api/use-orders";
import { ApiException } from "@/lib/api-client";
import type { Order, OrderLine } from "@/types/api";

interface KdsItem {
  orderId: string;
  orderNumber: string;
  tableName: string | null;
  orderType: Order["orderType"];
  createdAt: string;
  line: OrderLine;
}

const COLUMNS: Array<{
  key: KitchenStatus;
  title: string;
  next: KitchenStatus | null;
  nextLabel: string | null;
  bg: string;
  border: string;
}> = [
  {
    key: "queued",
    title: "Mới",
    next: "preparing",
    nextLabel: "Bắt đầu làm",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
  },
  {
    key: "preparing",
    title: "Đang làm",
    next: "ready",
    nextLabel: "Sẵn sàng",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
  },
  {
    key: "ready",
    title: "Sẵn sàng",
    next: "served",
    nextLabel: "Đã giao",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
  },
];

function elapsed(from: string): string {
  const ms = Date.now() - new Date(from).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "<1ph";
  if (m < 60) return `${m}ph`;
  const h = Math.floor(m / 60);
  return `${h}g${m % 60}ph`;
}

function KdsCard({
  item,
  next,
  nextLabel,
  isPending,
  onAdvance,
}: {
  item: KdsItem;
  next: KitchenStatus | null;
  nextLabel: string | null;
  isPending: boolean;
  onAdvance: () => void;
}) {
  const ageMin = (Date.now() - new Date(item.createdAt).getTime()) / 60_000;
  const stale = ageMin > 15;

  return (
    <article
      className={`rounded-lg border-2 bg-card shadow-sm overflow-hidden ${stale ? "ring-2 ring-rose-400" : ""}`}
    >
      <header className="px-3 py-2 border-b flex items-center justify-between">
        <div>
          <div className="font-bold text-base">
            {item.tableName ?? (item.orderType === "takeaway" ? "Mang về" : item.orderType)}
          </div>
          <div className="text-xs text-muted-foreground">{item.orderNumber}</div>
        </div>
        <div
          className={`flex items-center gap-1 text-sm font-semibold tabular-nums ${
            stale ? "text-rose-600" : "text-muted-foreground"
          }`}
        >
          <Clock className="size-3.5" />
          {elapsed(item.createdAt)}
        </div>
      </header>

      <div className="px-3 py-2.5 space-y-1.5">
        <div className="flex justify-between gap-2">
          <div className="font-semibold leading-tight">
            <span className="text-lg tabular-nums mr-2">{item.line.quantity}×</span>
            {item.line.productSnapshot.name}
          </div>
        </div>
        {item.line.modifiers.length > 0 && (
          <div className="text-xs text-muted-foreground">
            + {item.line.modifiers.map((m) => m.optionName).join(", ")}
          </div>
        )}
        {item.line.note && (
          <div className="text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded">
            ⚠ {item.line.note}
          </div>
        )}
      </div>

      {next && nextLabel && (
        <Button
          size="lg"
          onClick={onAdvance}
          disabled={isPending}
          className="w-full rounded-none font-semibold text-base h-12"
        >
          {nextLabel}
        </Button>
      )}
    </article>
  );
}

const MemoKdsCard = memo(KdsCard);

function Column({
  title,
  bg,
  border,
  items,
  next,
  nextLabel,
  onAdvance,
  pendingIds,
}: {
  title: string;
  bg: string;
  border: string;
  items: KdsItem[];
  next: KitchenStatus | null;
  nextLabel: string | null;
  onAdvance: (it: KdsItem) => void;
  pendingIds: Set<string>;
}) {
  return (
    <div className={`flex flex-col h-full rounded-xl border-2 ${border} ${bg} overflow-hidden`}>
      <header className="px-4 py-3 border-b border-inherit flex items-center justify-between sticky top-0">
        <h2 className="font-bold text-lg">{title}</h2>
        <span className="bg-foreground/10 text-foreground rounded-full px-2.5 py-0.5 text-sm font-bold tabular-nums">
          {items.length}
        </span>
      </header>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground/70 py-8 text-sm">— Trống —</div>
        ) : (
          items.map((it) => {
            const lineKey = `${it.orderId}:${it.line.id}`;
            return (
              <MemoKdsCard
                key={lineKey}
                item={it}
                next={next}
                nextLabel={nextLabel}
                isPending={pendingIds.has(lineKey)}
                onAdvance={() => onAdvance(it)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default function KdsPage() {
  const orders = useKdsOrders();
  const setStatus = useSetLineKitchenStatus();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastNewCount = useRef<number>(0);

  // Flatten all lines from all orders
  const allItems = useMemo<KdsItem[]>(() => {
    if (!orders.data) return [];
    const items: KdsItem[] = [];
    for (const o of orders.data) {
      for (const l of o.lines) {
        if (l.kitchenStatus === "served" || l.kitchenStatus === "cancelled") continue;
        items.push({
          orderId: o.id,
          orderNumber: o.orderNumber,
          tableName: o.tableName,
          orderType: o.orderType,
          createdAt: o.createdAt,
          line: l,
        });
      }
    }
    return items.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [orders.data]);

  const byStatus = useMemo(() => {
    const m: Record<KitchenStatus, KdsItem[]> = {
      queued: [],
      preparing: [],
      ready: [],
      served: [],
      cancelled: [],
    };
    for (const it of allItems) m[it.line.kitchenStatus].push(it);
    return m;
  }, [allItems]);

  // Beep khi có order mới (queued tăng)
  useEffect(() => {
    const newCount = byStatus.queued.length;
    if (newCount > lastNewCount.current && lastNewCount.current > 0) {
      audioRef.current?.play().catch(() => {});
    }
    lastNewCount.current = newCount;
  }, [byStatus.queued.length]);

  const [pendingIds] = useMemo(() => [new Set<string>()], []);

  const handleAdvance = (it: KdsItem) => {
    const col = COLUMNS.find((c) => c.key === it.line.kitchenStatus);
    if (!col?.next) return;
    setStatus.mutate(
      { orderId: it.orderId, lineId: it.line.id, status: col.next },
      {
        onError: (err) => {
          toast.error((err as ApiException).error?.message ?? "Lỗi cập nhật");
        },
      },
    );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-muted/30">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <ChefHat className="size-5" />
        <h1 className="text-lg font-semibold">Màn hình Bếp (KDS)</h1>
        <div className="ml-auto text-sm text-muted-foreground">
          Tự động làm mới mỗi 2 giây
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 p-3 overflow-hidden">
        {orders.isLoading ? (
          COLUMNS.map((c) => (
            <div key={c.key} className="flex flex-col gap-3">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          ))
        ) : (
          COLUMNS.map((col) => (
            <Column
              key={col.key}
              title={col.title}
              bg={col.bg}
              border={col.border}
              items={byStatus[col.key]}
              next={col.next}
              nextLabel={col.nextLabel}
              onAdvance={handleAdvance}
              pendingIds={pendingIds}
            />
          ))
        )}
      </main>

      {/* Beep cho order mới — silent placeholder, dùng tone tự gen nếu cần */}
      <audio ref={audioRef} preload="auto">
        <source
          src="data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ"
          type="audio/wav"
        />
      </audio>
    </div>
  );
}
