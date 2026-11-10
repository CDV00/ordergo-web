"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MenuToggle } from "@/components/menu-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Highlight, HighlightItem } from "@/components/animate-ui/primitives/effects/highlight";
import {
  BellRing,
  CheckCheck,
  ChefHat,
  Clock,
  Flame,
  PackageCheck,
  ShoppingBag,
  StickyNote,
  Volume2,
  VolumeX,
} from "lucide-react";
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

/** Một phiếu bếp = các món của cùng 1 đơn đang nằm trong cùng 1 cột. */
interface KdsTicket {
  orderId: string;
  orderNumber: string;
  tableName: string | null;
  orderType: Order["orderType"];
  /** Món gửi bếp sớm nhất trong phiếu — dùng tính thời gian chờ */
  oldestAt: string;
  items: KdsItem[];
}

type Tone = "warning" | "info" | "success";

const COLUMNS: Array<{
  key: KitchenStatus;
  title: string;
  next: KitchenStatus | null;
  nextLabel: string | null;
  tone: Tone;
}> = [
  { key: "queued", title: "Mới", next: "preparing", nextLabel: "Bắt đầu làm", tone: "warning" },
  { key: "preparing", title: "Đang làm", next: "ready", nextLabel: "Sẵn sàng", tone: "info" },
  { key: "ready", title: "Sẵn sàng", next: "served", nextLabel: "Đã giao", tone: "success" },
];

/** Màu theo cột — chỉ là điểm nhấn nhỏ (chấm + số đếm), dùng token ngữ nghĩa. */
const TONE: Record<Tone, { dot: string; count: string }> = {
  warning: {
    dot: "bg-warning",
    count: "bg-warning-soft text-[oklch(0.5_0.12_70)] dark:text-warning",
  },
  info: { dot: "bg-info", count: "bg-info-soft text-info" },
  success: { dot: "bg-success", count: "bg-success-soft text-success" },
};

/** Nút chuyển trạng thái: nền nhạt, không tô đặc để màn bếp không bị "loá" màu. */
const ACTION: Record<KitchenStatus, { className: string; icon: typeof Flame }> = {
  queued: { className: "bg-primary/10 text-primary hover:bg-primary/15", icon: Flame },
  preparing: { className: "bg-success-soft text-success hover:bg-success/15", icon: BellRing },
  ready: { className: "border bg-card hover:bg-accent", icon: PackageCheck },
  served: { className: "border bg-card hover:bg-accent", icon: CheckCheck },
  cancelled: { className: "border bg-card hover:bg-accent", icon: CheckCheck },
};

const WARN_MIN = 10;
const LATE_MIN = 15;

const SPRING = { type: "spring", stiffness: 420, damping: 34 } as const;

function elapsed(from: string, now: number): string {
  const ms = now - new Date(from).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "<1ph";
  if (m < 60) return `${m}ph`;
  const h = Math.floor(m / 60);
  return `${h}g${m % 60}ph`;
}

function ticketLabel(t: Pick<KdsTicket, "tableName" | "orderType">) {
  return t.tableName ?? (t.orderType === "takeaway" ? "Mang về" : t.orderType);
}

function KdsLine({
  item,
  ticketOldestAt,
  now,
  nextLabel,
  isPending,
  onAdvance,
}: {
  item: KdsItem;
  ticketOldestAt: string;
  now: number;
  nextLabel: string | null;
  isPending: boolean;
  onAdvance: (it: KdsItem) => void;
}) {
  const action = ACTION[item.line.kitchenStatus];
  const ActionIcon = action.icon;
  // Món gọi thêm sau → ghi rõ thời gian riêng để bếp không nhầm với món gọi đầu
  const addedLater =
    new Date(item.createdAt).getTime() - new Date(ticketOldestAt).getTime() >= 60_000;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 16, transition: { duration: 0.15 } }}
      transition={SPRING}
      className="flex items-start gap-2.5 px-3 py-2.5"
    >
      {/* Số đơn + bàn cho trình đọc màn hình (phần đầu phiếu đã hiển thị bằng mắt) */}
      <span className="sr-only">
        {item.orderNumber} · {ticketLabel(item)}
      </span>
      <span className="bg-muted tabular flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md px-1 text-sm font-bold">
        {item.line.quantity}
      </span>
      <div className="min-w-0 flex-1 space-y-1 pt-0.5">
        <div className="text-[15px] leading-snug font-medium break-words">
          {item.line.productSnapshot.name}
          {addedLater && (
            <span className="text-muted-foreground ml-1.5 text-xs font-normal">
              · gọi thêm {elapsed(item.createdAt, now)}
            </span>
          )}
        </div>
        {item.line.modifiers.length > 0 && (
          <div className="text-muted-foreground text-sm leading-snug">
            + {item.line.modifiers.map((m) => m.optionName).join(", ")}
          </div>
        )}
        {item.line.note && (
          <div className="dark:text-warning flex items-start gap-1 text-sm font-medium text-[oklch(0.5_0.12_60)]">
            <StickyNote className="mt-0.5 size-3.5 shrink-0" />
            <span className="break-words">{item.line.note}</span>
          </div>
        )}
      </div>

      {nextLabel && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onAdvance(item)}
          disabled={isPending}
          className={cn("h-10 shrink-0 gap-1.5 px-3 font-semibold", action.className)}
        >
          <ActionIcon className="size-4" />
          {nextLabel}
        </Button>
      )}
    </motion.article>
  );
}

function KdsTicketCard({
  ticket,
  now,
  urgent,
  nextLabel,
  pendingIds,
  onAdvance,
}: {
  ticket: KdsTicket;
  now: number;
  /** Cột "Sẵn sàng" không tính chậm của bếp */
  urgent: boolean;
  nextLabel: string | null;
  pendingIds: Set<string>;
  onAdvance: (it: KdsItem) => void;
}) {
  const ageMin = (now - new Date(ticket.oldestAt).getTime()) / 60_000;
  const late = urgent && ageMin > LATE_MIN;
  const warn = urgent && !late && ageMin > WARN_MIN;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
      transition={SPRING}
      className="bg-card relative overflow-hidden rounded-xl border shadow-xs"
    >
      {/* Mức độ chờ: chỉ một vạch mảnh phía trên + chip thời gian */}
      {(warn || late) && (
        <span
          aria-hidden
          className={cn("absolute inset-x-0 top-0 h-[3px]", late ? "bg-destructive" : "bg-warning")}
        />
      )}
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex min-w-0 items-baseline gap-2">
          {ticket.orderType === "takeaway" && !ticket.tableName && (
            <ShoppingBag className="text-muted-foreground size-4 shrink-0 self-center" />
          )}
          <span className="truncate text-lg leading-tight font-semibold">
            {ticketLabel(ticket)}
          </span>
          <span className="text-muted-foreground tabular shrink-0 text-xs">
            {ticket.orderNumber}
          </span>
        </div>
        <div
          className={cn(
            "tabular flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
            late
              ? "bg-destructive/10 text-destructive"
              : warn
                ? "bg-warning-soft dark:text-warning text-[oklch(0.5_0.12_70)]"
                : "text-muted-foreground",
          )}
        >
          <Clock className="size-3.5" />
          {elapsed(ticket.oldestAt, now)}
        </div>
      </div>

      <div className="relative divide-y">
        <AnimatePresence initial={false} mode="popLayout">
          {ticket.items.map((it) => {
            const lineKey = `${it.orderId}:${it.line.id}`;
            return (
              <KdsLine
                key={lineKey}
                item={it}
                ticketOldestAt={ticket.oldestAt}
                now={now}
                nextLabel={nextLabel}
                isPending={pendingIds.has(lineKey)}
                onAdvance={onAdvance}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

const MemoKdsTicket = memo(KdsTicketCard);

/** Gom các món cùng đơn (theo thứ tự món gửi bếp sớm nhất) thành phiếu. */
function toTickets(items: KdsItem[]): KdsTicket[] {
  const map = new Map<string, KdsTicket>();
  for (const it of items) {
    const t = map.get(it.orderId);
    if (t) t.items.push(it);
    else
      map.set(it.orderId, {
        orderId: it.orderId,
        orderNumber: it.orderNumber,
        tableName: it.tableName,
        orderType: it.orderType,
        oldestAt: it.createdAt,
        items: [it],
      });
  }
  // `items` đã sắp xếp theo thời gian gửi bếp → phiếu đầu tiên là phiếu chờ lâu nhất
  return [...map.values()];
}

function Column({
  title,
  tone,
  items,
  now,
  urgent,
  nextLabel,
  onAdvance,
  pendingIds,
  className,
}: {
  title: string;
  tone: Tone;
  items: KdsItem[];
  now: number;
  urgent: boolean;
  nextLabel: string | null;
  onAdvance: (it: KdsItem) => void;
  pendingIds: Set<string>;
  className?: string;
}) {
  const tickets = useMemo(() => toTickets(items), [items]);
  const t = TONE[tone];

  return (
    <div
      className={cn(
        "bg-muted/40 flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-2 px-3 py-2.5">
        {/* e2e tìm cột theo `header > h2` — giữ h2 là con trực tiếp của header */}
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <span className={cn("size-2 rounded-full", t.dot)} aria-hidden />
          {title}
        </h2>
        <span
          className={cn(
            "tabular min-w-7 rounded-full px-2 py-0.5 text-center text-xs font-semibold",
            t.count,
          )}
        >
          {items.length}
        </span>
      </header>
      <div className="relative flex-1 space-y-2 overflow-y-auto px-2 pb-2">
        <AnimatePresence initial={false} mode="popLayout">
          {tickets.map((ticket) => (
            <MemoKdsTicket
              key={ticket.orderId}
              ticket={ticket}
              now={now}
              urgent={urgent}
              nextLabel={nextLabel}
              pendingIds={pendingIds}
              onAdvance={onAdvance}
            />
          ))}
        </AnimatePresence>
        {tickets.length === 0 && (
          <div className="text-muted-foreground/70 flex flex-col items-center gap-2 py-10 text-center text-sm">
            <CheckCheck className="size-6 opacity-50" />
            Trống
          </div>
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
  // Màn nhỏ (điện thoại) chỉ hiện 1 cột mỗi lần; từ tablet trở lên hiện cả 3
  const [mobileCol, setMobileCol] = useState<KitchenStatus>("queued");
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
    <div className="bg-background flex h-[calc(100dvh-4rem)] flex-col overflow-hidden md:h-svh">
      <header className="bg-card flex h-14 shrink-0 items-center gap-2.5 border-b px-3 md:px-4">
        <MenuToggle />
        <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
          <ChefHat className="size-4" />
        </div>
        <h1 className="truncate text-base font-semibold md:text-lg">Màn hình Bếp (KDS)</h1>
        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <span
            className={cn(
              "flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium",
              connected ? "bg-success-soft text-success" : "bg-muted text-muted-foreground",
            )}
          >
            <span className="relative flex size-2">
              {connected && (
                <span className="bg-success absolute inline-flex size-full animate-ping rounded-full opacity-60" />
              )}
              <span
                className={cn(
                  "relative inline-flex size-2 rounded-full",
                  connected ? "bg-success" : "bg-muted-foreground",
                )}
              />
            </span>
            {connected ? "Trực tiếp" : "Đang kết nối lại…"}
          </span>
          <Button
            variant={soundOn ? "ghost" : "outline"}
            size="sm"
            className="h-10"
            onClick={async () => {
              const ok = await unlockSound();
              setSoundOn(ok);
              if (ok) playChime();
            }}
          >
            {soundOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            {soundOn ? "Âm báo bật" : "Bật âm báo"}
          </Button>
        </div>
      </header>

      {/* Chọn cột trên điện thoại */}
      <div className="shrink-0 px-3 pt-3 md:hidden">
        <Highlight
          value={mobileCol}
          controlledItems
          className="bg-card inset-0 rounded-lg shadow-xs"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        >
          <div className="bg-muted grid grid-cols-3 gap-1 rounded-xl p-1" role="tablist">
            {COLUMNS.map((c) => (
              <HighlightItem key={c.key} value={c.key}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mobileCol === c.key}
                  onClick={() => setMobileCol(c.key)}
                  className={cn(
                    "relative z-[1] flex h-11 w-full items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-colors",
                    mobileCol === c.key ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {c.title}
                  <span className={cn("tabular rounded-full px-1.5 text-xs", TONE[c.tone].count)}>
                    {byStatus[c.key].length}
                  </span>
                </button>
              </HighlightItem>
            ))}
          </div>
        </Highlight>
      </div>

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden p-3 md:grid-cols-3">
        {orders.isLoading
          ? COLUMNS.map((c) => (
              <div
                key={c.key}
                className={cn("flex flex-col gap-3", c.key !== mobileCol && "hidden md:flex")}
              >
                <Skeleton className="h-10 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
              </div>
            ))
          : COLUMNS.map((col) => (
              <Column
                key={col.key}
                title={col.title}
                tone={col.tone}
                items={byStatus[col.key]}
                now={now}
                urgent={col.key !== "ready"}
                nextLabel={col.nextLabel}
                onAdvance={handleAdvance}
                pendingIds={pendingIds}
                className={cn(col.key !== mobileCol && "hidden md:flex")}
              />
            ))}
      </main>
    </div>
  );
}
