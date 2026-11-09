"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MenuToggle } from "@/components/menu-toggle";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { TablePicker } from "./_components/table-picker";
import { MenuGrid } from "./_components/menu-grid";
import { CartPanel } from "./_components/cart-panel";
import { VariantPickerDialog } from "./_components/variant-picker-dialog";
import { PaymentDialog } from "./_components/payment-dialog";
import { RemoveLineDialog } from "./_components/remove-line-dialog";
import { ShiftIndicator } from "./_components/shift-indicator";
import {
  selectCartCount,
  selectCartLines,
  selectCartSubtotal,
  useCartStore,
  type CartKey,
  type CartLine,
} from "@/lib/cart-store";
import { useQueryClient } from "@tanstack/react-query";
import { useOrders, type OrderLineInput } from "@/hooks/api/use-orders";
import { useTables } from "@/hooks/api/use-tables";
import { useAuth } from "@/contexts/auth-context";
import { ApiException } from "@/lib/api-client";
import { newUuid } from "@/lib/offline/idb";
import { useOutboxStore } from "@/lib/offline/outbox";
import { planSubmission, type OutboxDisplayLine } from "@/lib/offline/outbox-core";
import { submitSteps } from "@/lib/offline/submit";
import { usePendingLines } from "@/lib/offline/use-online";
import { useOffline } from "@/providers/offline/offline-provider";
import { formatVnd } from "@/lib/format";
import { OPEN_ORDER_STATUSES, type MenuItem, type OrderLine } from "@/types/api";

const toLineInput = (l: CartLine): OrderLineInput => ({
  menuItemId: l.menuItemId,
  variantId: l.variantId ?? undefined,
  toppingOptionIds: l.toppingOptionIds,
  quantity: l.quantity,
  note: l.note ?? undefined,
});

const toDisplayLine = (l: CartLine): OutboxDisplayLine => ({
  name: l.name,
  quantity: l.quantity,
  unitPrice: l.unitPrice,
  variantName: l.variantName,
  toppingNames: l.toppingNames,
  note: l.note,
});

export default function POSPage() {
  // ─── Cart context ─────────────────────────────────────
  const activeKey = useCartStore((s) => s.activeKey);
  const setActiveKey = useCartStore((s) => s.setActive);
  const clearCart = useCartStore((s) => s.clearCart);
  const addLine = useCartStore((s) => s.addLine);

  const lines = useCartStore(selectCartLines(activeKey));
  const subtotal = useCartStore(selectCartSubtotal(activeKey));
  const count = useCartStore(selectCartCount(activeKey));

  const [variantPicking, setVariantPicking] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [payOrderId, setPayOrderId] = useState<string | null>(null);
  const [removingLine, setRemovingLine] = useState<OrderLine | null>(null);
  /** Đơn mang về vừa gửi bếp — giữ để thu tiền / gọi thêm */
  const [takeawayOrderId, setTakeawayOrderId] = useState<string | null>(null);

  // ─── Data ─────────────────────────────────────────────
  const qc = useQueryClient();
  const { activeTenantId, activeVenueId } = useAuth();
  const { syncNow } = useOffline();
  const [isSending, setIsSending] = useState(false);
  const orders = useOrders({ status: "open" });
  const tables = useTables();

  const isTakeaway = activeKey === "takeaway";
  /** Món đã xếp hàng offline cho bàn này (mang về: mỗi lần là 1 đơn riêng → không hiện ở giỏ). */
  const pendingLines = usePendingLines(activeTenantId, isTakeaway ? null : activeKey);

  /** Đơn đang mở của bàn/mang về đang chọn — gọi thêm món sẽ nối vào đơn này */
  const openOrder = useMemo(() => {
    if (!activeKey || !orders.data) return null;
    const open = orders.data.filter((o) => OPEN_ORDER_STATUSES.includes(o.status));
    if (isTakeaway) return open.find((o) => o.id === takeawayOrderId) ?? null;
    return open.find((o) => o.tableId === activeKey) ?? null;
  }, [activeKey, isTakeaway, orders.data, takeawayOrderId]);

  const contextLabel = useMemo(() => {
    if (!activeKey) return "";
    if (isTakeaway) return "Mang về";
    const t = tables.data?.find((x) => x.id === activeKey);
    return t ? `Bàn ${t.name}` : (openOrder?.tableName ?? "Bàn");
  }, [activeKey, isTakeaway, tables.data, openOrder]);

  // Đơn mang về đã thu xong → quay về màn mới
  useEffect(() => {
    if (isTakeaway && takeawayOrderId && orders.data && !openOrder && !payOrderId) {
      setTakeawayOrderId(null);
    }
  }, [isTakeaway, takeawayOrderId, orders.data, openOrder, payOrderId]);

  // ─── Handlers ─────────────────────────────────────────
  const handlePickTable = useCallback(
    (tableId: string) => setActiveKey(tableId as CartKey),
    [setActiveKey],
  );
  const handlePickTakeaway = useCallback(() => {
    setTakeawayOrderId(null);
    setActiveKey("takeaway" as CartKey);
  }, [setActiveKey]);
  const handleBack = useCallback(() => setActiveKey(null), [setActiveKey]);

  const handlePickItem = useCallback(
    (item: MenuItem) => {
      if (!item.isAvailable) return;
      if (item.variants.length > 0 || item.toppingGroups.length > 0) {
        setVariantPicking(item);
        return;
      }
      const key = useCartStore.getState().activeKey;
      if (!key) return;
      addLine(key, {
        menuItemId: item.id,
        variantId: null,
        toppingOptionIds: [],
        quantity: 1,
        note: null,
        name: item.name,
        imageUrl: item.imageUrl,
        unitPrice: item.basePrice.amount,
        basePrice: item.basePrice.amount,
        variantName: null,
        toppingNames: [],
      });
    },
    [addLine],
  );

  const handleConfirmVariant: React.ComponentProps<typeof VariantPickerDialog>["onConfirm"] =
    useCallback(
      (line) => {
        const key = useCartStore.getState().activeKey;
        if (!key) return;
        addLine(key, line);
        setVariantPicking(null);
      },
      [addLine],
    );

  /**
   * Gửi bếp:
   *  - bàn/mang về chưa có đơn → tạo đơn + gửi bếp
   *  - đã có đơn → nối món vào đơn + gửi bếp phần mới (và cả món chưa gửi còn sót)
   * Mỗi bước mang Idempotency-Key riêng. Mất mạng (offline hoặc lỗi mạng) → lưu vào hàng đợi
   * offline, giỏ được xoá và món hiện ở mục "Chờ gửi (offline)" của bàn.
   */
  const handleSendToKitchen = useCallback(async () => {
    if (!activeKey || !activeTenantId) return;
    if (!openOrder && lines.length === 0) return;
    const { steps, joinsQueue } = planSubmission({
      newId: newUuid,
      now: Date.now(),
      tenantId: activeTenantId,
      venueId: activeVenueId,
      cartKey: activeKey,
      label: contextLabel,
      isTakeaway,
      openOrderId: openOrder?.id ?? null,
      lines: lines.map(toLineInput),
      display: lines.map(toDisplayLine),
      queue: useOutboxStore.getState().items,
    });
    setIsSending(true);
    try {
      const outcome = await submitSteps(steps, joinsQueue);
      clearCart(activeKey);
      if (outcome.kind === "queued") {
        if (navigator.onLine) {
          toast.info(`Đã xếp ${count} món sau các món đang chờ gửi — ${contextLabel}`);
          syncNow();
        } else {
          toast.warning(`Mất kết nối — đã lưu ${count} món chờ gửi (${contextLabel})`, {
            description: "Sẽ tự gửi bếp khi có mạng lại.",
          });
        }
        return;
      }
      void qc.invalidateQueries({ queryKey: ["orders"] });
      void qc.invalidateQueries({ queryKey: ["tables"] });
      const { order } = outcome;
      toast.success(
        openOrder
          ? `Đã gửi thêm ${count} món — ${contextLabel}`
          : `Đã gửi bếp ${order.orderNumber} — ${contextLabel}`,
      );
      if (isTakeaway) {
        // Mang về: thường thu tiền ngay
        setTakeawayOrderId(order.id);
        setPayOrderId(order.id);
      }
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Gửi bếp thất bại");
    } finally {
      setIsSending(false);
    }
  }, [
    activeKey,
    activeTenantId,
    activeVenueId,
    openOrder,
    lines,
    isTakeaway,
    count,
    contextLabel,
    clearCart,
    qc,
    syncNow,
  ]);

  const header = (
    <header className="bg-background flex h-14 shrink-0 items-center gap-2 border-b px-3 md:px-4">
      <MenuToggle />
      <Separator orientation="vertical" className="mr-2 hidden h-4 md:block" />
      {activeKey && (
        <Button variant="ghost" size="sm" onClick={handleBack} className="px-2">
          <ArrowLeft className="size-4 md:mr-1" />
          <span className="hidden sm:inline">Đổi bàn</span>
        </Button>
      )}
      <h1 className="truncate text-base font-semibold md:text-lg">
        {activeKey ? contextLabel : "POS — Gọi món"}
      </h1>
      <ShiftIndicator />
    </header>
  );

  // flex-1 trong <main> (flex-col) thay vì h-svh: chừa chỗ cho thanh "Mất kết nối" khi có.
  const containerClass = "flex min-h-0 flex-1 flex-col overflow-hidden";

  const dialogs = (
    <>
      <VariantPickerDialog
        item={variantPicking}
        open={!!variantPicking}
        onClose={() => setVariantPicking(null)}
        onConfirm={handleConfirmVariant}
      />
      <PaymentDialog orderId={payOrderId} open={!!payOrderId} onClose={() => setPayOrderId(null)} />
      <RemoveLineDialog
        orderId={openOrder?.id ?? null}
        line={removingLine}
        onClose={() => setRemovingLine(null)}
      />
    </>
  );

  if (!activeKey) {
    return (
      <div className={containerClass}>
        {header}
        <div className="flex-1 overflow-y-auto">
          <TablePicker onPickTable={handlePickTable} onPickTakeaway={handlePickTakeaway} />
        </div>
        {dialogs}
      </div>
    );
  }

  const cartPanel = (
    <CartPanel
      cartKey={activeKey}
      contextLabel={contextLabel}
      lines={lines}
      subtotal={subtotal}
      count={count}
      openOrder={openOrder}
      pendingLines={pendingLines}
      isSending={isSending}
      onSendToKitchen={() => {
        void handleSendToKitchen();
        setCartOpen(false);
      }}
      onPay={() => {
        if (openOrder) setPayOrderId(openOrder.id);
        setCartOpen(false);
      }}
      onRemoveOrderLine={setRemovingLine}
      onCancel={() => {
        handleBack();
        setCartOpen(false);
      }}
    />
  );

  const pendingTotal = pendingLines.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0);
  const floatingTotal = (openOrder?.pricing.total.amount ?? 0) + pendingTotal + subtotal;

  return (
    <div className={containerClass}>
      {header}
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_440px]">
        <div className="overflow-hidden">
          <MenuGrid onPickItem={handlePickItem} />
        </div>
        <div className="hidden flex-col overflow-hidden lg:flex">{cartPanel}</div>
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetContent
            side="right"
            className="flex w-full flex-col gap-0 p-0 sm:max-w-md lg:hidden"
          >
            <SheetTitle className="sr-only">Giỏ hàng</SheetTitle>
            {cartPanel}
          </SheetContent>
        </Sheet>
      </div>

      {/* Nút xem giỏ — chỉ < lg, khi có món mới hoặc đơn đang mở */}
      {(count > 0 || openOrder || pendingLines.length > 0) && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="bg-primary text-primary-foreground fixed bottom-20 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full px-5 py-3 shadow-lg transition-transform active:scale-95 lg:hidden"
        >
          <ShoppingCart className="size-5" />
          <span className="font-semibold tabular-nums">
            {count > 0 ? `${count} món mới` : "Xem đơn"}
          </span>
          <span className="font-bold tabular-nums">{formatVnd(floatingTotal)}</span>
        </button>
      )}

      {dialogs}
    </div>
  );
}
