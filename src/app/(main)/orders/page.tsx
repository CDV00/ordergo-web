"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ChefHat, ClipboardList, Clock, ShoppingBag, UtensilsCrossed, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MenuToggle } from "@/components/menu-toggle";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Highlight, HighlightItem } from "@/components/animate-ui/primitives/effects/highlight";
import { useOrders, useCancelOrder, useSendOrderToKitchen } from "@/hooks/api/use-orders";
import { ApiException } from "@/lib/api-client";
import { ORDER_STATUS_CLASS, ORDER_STATUS_LABEL, formatTime, formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { OPEN_ORDER_STATUSES, type Order } from "@/types/api";

type FilterKey = "all" | "open" | "paid" | "closed";

const FILTERS: Array<{ key: FilterKey; label: string; match: (o: Order) => boolean }> = [
  { key: "all", label: "Tất cả", match: () => true },
  { key: "open", label: "Đang mở", match: (o) => OPEN_ORDER_STATUSES.includes(o.status) },
  { key: "paid", label: "Đã thanh toán", match: (o) => o.status === "paid" },
  {
    key: "closed",
    label: "Huỷ / hoàn",
    match: (o) => o.status === "cancelled" || o.status === "refunded",
  },
];

function placeLabel(o: Order) {
  return o.tableName ?? (o.orderType === "takeaway" ? "Mang về" : "—");
}

function OrderRow({
  o,
  onSend,
  onCancel,
}: {
  o: Order;
  onSend: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const lines = o.lines.filter((l) => l.kitchenStatus !== "cancelled");
  const summary = lines.map((l) => `${l.quantity}× ${l.productSnapshot.name}`).join(", ");
  const takeaway = !o.tableName && o.orderType === "takeaway";

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      className="bg-card hover:border-primary/30 rounded-2xl border shadow-xs transition-colors"
    >
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <Link
          href={`/orders/${o.id}`}
          className="focus-visible:ring-ring/40 flex min-w-0 flex-1 items-center gap-3 rounded-xl outline-none focus-visible:ring-[3px]"
        >
          <div
            className={cn(
              "flex size-12 shrink-0 flex-col items-center justify-center rounded-xl text-sm font-bold",
              takeaway ? "bg-info-soft text-info" : "bg-primary/10 text-primary",
            )}
          >
            {takeaway ? (
              <ShoppingBag className="size-5" />
            ) : (
              <span className="truncate px-1">{placeLabel(o)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="tabular font-semibold">{o.orderNumber}</span>
              <Badge className={cn("border-transparent", ORDER_STATUS_CLASS[o.status])}>
                {ORDER_STATUS_LABEL[o.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground truncate text-sm">
              {summary || "Chưa có món"}
              {o.lines.some((l) => l.note) && (
                <em className="ml-1">
                  (
                  {o.lines
                    .filter((l) => l.note)
                    .map((l) => l.note)
                    .join("; ")}
                  )
                </em>
              )}
            </p>
            <p className="text-muted-foreground flex items-center gap-1 text-xs">
              <Clock className="size-3" />
              {placeLabel(o)} · {formatTime(o.createdAt)} ·{" "}
              {new Date(o.createdAt).toLocaleDateString("vi-VN")}
            </p>
          </div>
        </Link>

        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
          <span className="tabular text-lg font-bold">{formatVnd(o.pricing.total.amount)}</span>
          {o.status === "draft" && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onSend(o.id)} className="h-10">
                <ChefHat className="size-4" />
                Gửi bếp
              </Button>
              <Button size="sm" variant="outline" onClick={() => onCancel(o.id)} className="h-10">
                <X className="size-4" />
                Huỷ
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.li>
  );
}

export default function OrdersPage() {
  const orders = useOrders();
  const send = useSendOrderToKitchen();
  const cancel = useCancelOrder();
  const [filter, setFilter] = useState<FilterKey>("all");

  const counts = useMemo(() => {
    const list = orders.data ?? [];
    return Object.fromEntries(FILTERS.map((f) => [f.key, list.filter(f.match).length])) as Record<
      FilterKey,
      number
    >;
  }, [orders.data]);

  const visible = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter)!;
    return (orders.data ?? []).filter(f.match);
  }, [orders.data, filter]);

  const onSend = async (id: string) => {
    try {
      await send.mutateAsync(id);
      toast.success("Đã gửi xuống bếp");
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Lỗi");
    }
  };

  const onCancel = async (id: string) => {
    const reason = prompt("Lý do huỷ?");
    if (reason === null) return;
    try {
      await cancel.mutateAsync({ id, reason });
      toast.success("Đã huỷ đơn");
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Lỗi");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 md:p-6">
      <div className="flex items-start gap-2">
        <MenuToggle className="mt-0.5" />
        <PageHeader
          className="flex-1"
          icon={ClipboardList}
          title="Đơn hàng"
          description={orders.data ? `${orders.data.length} đơn gần đây` : "Theo dõi đơn tại quán"}
        />
      </div>

      {/* Bộ lọc trạng thái — nền trượt theo chip đang chọn */}
      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <Highlight
          value={filter}
          controlledItems
          className="bg-card inset-0 rounded-full border shadow-xs"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        >
          <div
            role="tablist"
            aria-label="Lọc theo trạng thái"
            className="bg-muted inline-flex gap-1 rounded-full p-1"
          >
            {FILTERS.map((f) => (
              <HighlightItem key={f.key} value={f.key}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors",
                    filter === f.key
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "tabular rounded-full px-1.5 text-xs",
                      filter === f.key ? "bg-primary/10 text-primary" : "bg-background/60",
                    )}
                  >
                    {counts[f.key] ?? 0}
                  </span>
                </button>
              </HighlightItem>
            ))}
          </div>
        </Highlight>
      </div>

      {orders.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : orders.data?.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="Chưa có đơn hàng nào."
          description="Đơn tạo từ POS hoặc khách quét QR sẽ hiện ở đây."
        />
      ) : visible.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Không có đơn nào ở mục này." />
      ) : (
        <ul className="relative space-y-3">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((o) => (
              <OrderRow key={o.id} o={o} onSend={onSend} onCancel={onCancel} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
