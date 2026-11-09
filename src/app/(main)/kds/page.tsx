"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { MenuToggle } from "@/components/menu-toggle";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, ChefHat, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { useKdsOrders, useSetLineKitchenStatus, type KitchenStatus } from "@/hooks/api/use-orders";
import { ApiException } from "@/lib/api-client";
import { playChime, soundUnlocked, unlockSound } from "@/lib/sound";
import { useRealtime } from "@/providers/realtime-provider";
import { cn } from "@/lib/utils";
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

const WARN_MIN = 10;
const LATE_MIN = 15;

function elapsed(from: string, now: number): string {
  const ms = now - new Date(from).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "<1ph";
  if (m < 60) return `${m}ph`;
  const h = Math.floor(m / 60);
  return `${h}g${m % 60}ph`;
}

function KdsCard({
  item,
  now,
  next,
  nextLabel,
  isPending,
  onAdvance,
}: {
  item: KdsItem;
  now: number;
  next: KitchenStatus | null;
  nextLabel: string | null;
  isPending: boolean;
  onAdvance: () => void;
}) {
  const ageMin = (now - new Date(item.createdAt).getTime()) / 60_000;
  // Món đã xong chờ mang ra thì không tính là "chậm" của bếp
  const waiting = item.line.kitchenStatus !== "ready";
  const late = waiting && ageMin > LATE_MIN;
  const warn = waiting && !late && ageMin > WARN_MIN;

  return (
    <article
      className={cn(
        "bg-card overflow-hidden rounded-lg border-2 shadow-sm",
        late && "border-rose-400 ring-2 ring-rose-400",
        warn && "border-amber-400",
      )}
    >
      <header className="flex items-center justify-between border-b px-3 py-2">
        <div>
          <div className="text-base font-bold">
            {item.tableName ?? (item.orderType === "takeaway" ? "Mang về" : item.orderType)}
          </div>
          <div className="text-muted-foreground text-xs">{item.orderNumber}</div>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-semibold tabular-nums",
            late
              ? "bg-rose-600 text-white"
              : warn
                ? "bg-amber-400 text-amber-950"
                : "text-muted-foreground",
          )}
        >
          <Clock className="size-3.5" />
          {elapsed(item.createdAt, now)}
        </div>
      </header>

      <div className="space-y-1.5 px-3 py-2.5">
        <div className="flex justify-between gap-2">
          <div className="leading-tight font-semibold">
            <span className="mr-2 text-lg tabular-nums">{item.line.quantity}×</span>
            {item.line.productSnapshot.name}
          </div>
        </div>
        {item.line.modifiers.length > 0 && (
          <div className="text-muted-foreground text-xs">
            + {item.line.modifiers.map((m) => m.optionName).join(", ")}
          </div>
        )}
        {item.line.note && (
          <div className="rounded bg-amber-50 px-2 py-1 text-sm font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            ⚠ {item.line.note}
          </div>
        )}
      </div>

      {next && nextLabel && (
        <Button
          size="lg"
          onClick={onAdvance}
          disabled={isPending}
          className="h-12 w-full rounded-none text-base font-semibold"
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
  now,
  next,
  nextLabel,
  onAdvance,
  pendingIds,
}: {
  title: string;
  bg: string;
  border: string;
  items: KdsItem[];
  now: number;
  next: KitchenStatus | null;
  nextLabel: string | null;
  onAdvance: (it: KdsItem) => void;
  pendingIds: Set<string>;
}) {
  return (
    <div className={`flex h-full flex-col rounded-xl border-2 ${border} ${bg} overflow-hidden`}>
      <header className="sticky top-0 flex items-center justify-between border-b border-inherit px-4 py-3">
        <h2 className="text-lg font-bold">{title}</h2>
        <span className="bg-foreground/10 text-foreground rounded-full px-2.5 py-0.5 text-sm font-bold tabular-nums">
          {items.length}
        </span>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {items.length === 0 ? (
          <div className="text-muted-foreground/70 py-8 text-center text-sm">— Trống —</div>
        ) : (
          items.map((it) => {
            const lineKey = `${it.orderId}:${it.line.id}`;
            return (
              <MemoKdsCard
                key={lineKey}
                item={it}
                now={now}
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
  const lastNewCount = useRef<number>(0);
  const { connected } = useRealtime();
  const [soundOn, setSoundOn] = useState(false);
  // Đồng hồ chờ tự nhảy kể cả khi không có dữ liệu mới
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => setSoundOn(soundUnlocked()), []);

  // Flatten all lines from all orders
  const allItems = useMemo<KdsItem[]>(() => {
    if (!orders.data) return [];
    const items: KdsItem[] = [];
    for (const o of orders.data) {
      for (const l of o.lines) {
        if (l.kitchenStatus === "served" || l.kitchenStatus === "cancelled") continue;
        // Món vừa gọi thêm nhưng phục vụ chưa bấm "Gửi bếp" → chưa hiện ở bếp
        if (!l.sentToKitchenAt) continue;
        items.push({
          orderId: o.id,
          orderNumber: o.orderNumber,
          tableName: o.tableName,
          orderType: o.orderType,
          createdAt: l.sentToKitchenAt,
          line: l,
        });
      }
    }
    return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
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
    if (newCount > lastNewCount.current && lastNewCount.current > 0) playChime();
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
    <div className="bg-muted/30 flex h-[calc(100dvh-4rem)] flex-col overflow-hidden md:h-svh">
      <header className="bg-background flex h-14 shrink-0 items-center gap-2 border-b px-3 md:px-4">
        <MenuToggle />
        <Separator orientation="vertical" className="mr-2 hidden h-4 md:block" />
        <ChefHat className="size-5" />
        <h1 className="text-lg font-semibold">Màn hình Bếp (KDS)</h1>
        <div className="ml-auto flex items-center gap-3">
          <span
            className={cn(
              "flex items-center gap-1.5 text-sm",
              connected ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full",
                connected ? "animate-pulse bg-emerald-500" : "bg-muted-foreground",
              )}
            />
            {connected ? "Trực tiếp" : "Đang kết nối lại…"}
          </span>
          <Button
            variant={soundOn ? "outline" : "default"}
            size="sm"
            onClick={async () => {
              const ok = await unlockSound();
              setSoundOn(ok);
              if (ok) playChime();
            }}
          >
            {soundOn ? (
              <Volume2 className="mr-1.5 size-4" />
            ) : (
              <VolumeX className="mr-1.5 size-4" />
            )}
            {soundOn ? "Âm báo bật" : "Bật âm báo"}
          </Button>
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1 gap-3 overflow-hidden p-3 md:grid-cols-3">
        {orders.isLoading
          ? COLUMNS.map((c) => (
              <div key={c.key} className="flex flex-col gap-3">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
              </div>
            ))
          : COLUMNS.map((col) => (
              <Column
                key={col.key}
                title={col.title}
                bg={col.bg}
                border={col.border}
                items={byStatus[col.key]}
                now={now}
                next={col.next}
                nextLabel={col.nextLabel}
                onAdvance={handleAdvance}
                pendingIds={pendingIds}
              />
            ))}
      </main>
    </div>
  );
}
