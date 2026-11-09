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
import {
  selectCartCount,
  selectCartLines,
  selectCartSubtotal,
  useCartStore,
  type CartKey,
  type CartLine,
} from "@/lib/cart-store";
import {
  useAddOrderLines,
  useCreateOrder,
  useOrders,
  useSendOrderToKitchen,
  type OrderLineInput,
} from "@/hooks/api/use-orders";
import { useTables } from "@/hooks/api/use-tables";
import { ApiException } from "@/lib/api-client";
import { formatVnd } from "@/lib/format";
import { OPEN_ORDER_STATUSES, type MenuItem, type OrderLine } from "@/types/api";

const toLineInput = (l: CartLine): OrderLineInput => ({
  menuItemId: l.menuItemId,
  variantId: l.variantId ?? undefined,
  toppingOptionIds: l.toppingOptionIds,
  quantity: l.quantity,
  note: l.note ?? undefined,
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
  const createOrder = useCreateOrder();
  const addLines = useAddOrderLines();
  const sendToKitchen = useSendOrderToKitchen();
  const orders = useOrders({ status: "open" });
  const tables = useTables();

  const isTakeaway = activeKey === "takeaway";

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

  const isSending = createOrder.isPending || addLines.isPending || sendToKitchen.isPending;

  /**
   * Gửi bếp:
   *  - bàn/mang về chưa có đơn → tạo đơn + gửi bếp
   *  - đã có đơn → nối món vào đơn + gửi bếp phần mới (và cả món chưa gửi còn sót)
   */
  const handleSendToKitchen = useCallback(async () => {
    if (!activeKey) return;
    try {
      let orderId: string;
      let orderNumber: string;
      if (openOrder) {
        if (lines.length > 0) {
          await addLines.mutateAsync({ orderId: openOrder.id, lines: lines.map(toLineInput) });
        }
        orderId = openOrder.id;
        orderNumber = openOrder.orderNumber;
      } else {
        if (lines.length === 0) return;
        const created = await createOrder.mutateAsync({
          orderType: isTakeaway ? "takeaway" : "dine_in",
          tableId: isTakeaway ? undefined : activeKey,
          lines: lines.map(toLineInput),
        });
        orderId = created.id;
        orderNumber = created.orderNumber;
      }
      await sendToKitchen.mutateAsync(orderId);
      clearCart(activeKey);
      toast.success(
        openOrder
          ? `Đã gửi thêm ${count} món — ${contextLabel}`
          : `Đã gửi bếp ${orderNumber} — ${contextLabel}`,
      );
      if (isTakeaway) {
        // Mang về: thường thu tiền ngay
        setTakeawayOrderId(orderId);
        setPayOrderId(orderId);
      }
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Gửi bếp thất bại");
    }
  }, [
    activeKey,
    openOrder,
    lines,
    isTakeaway,
    count,
    contextLabel,
    addLines,
    createOrder,
    sendToKitchen,
    clearCart,
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
    </header>
  );

  const containerClass = "flex flex-col h-[calc(100dvh-4rem)] md:h-svh overflow-hidden";

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

  const floatingTotal = (openOrder?.pricing.total.amount ?? 0) + subtotal;

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
      {(count > 0 || openOrder) && (
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
