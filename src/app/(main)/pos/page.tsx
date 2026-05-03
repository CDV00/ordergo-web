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
import {
  selectCartCount,
  selectCartLines,
  selectCartSubtotal,
  useCartStore,
  type CartKey,
} from "@/lib/cart-store";
import { useCreateOrder, useOrders } from "@/hooks/api/use-orders";
import { ApiException } from "@/lib/api-client";
import type { MenuItem, Order } from "@/types/api";

export default function POSPage() {
  // ─── Cart context ─────────────────────────────────────
  const activeKey = useCartStore((s) => s.activeKey);
  const setActiveKey = useCartStore((s) => s.setActive);
  const clearCart = useCartStore((s) => s.clearCart);
  const addLine = useCartStore((s) => s.addLine);

  const lines = useCartStore(selectCartLines(activeKey));
  const subtotal = useCartStore(selectCartSubtotal(activeKey));
  const count = useCartStore(selectCartCount(activeKey));

  const [contextLabel, setContextLabel] = useState<string>("");

  // Variant picker
  const [variantPicking, setVariantPicking] = useState<MenuItem | null>(null);

  // Mobile cart drawer
  const [cartOpen, setCartOpen] = useState(false);

  // Payment
  const [payOrder, setPayOrder] = useState<Order | null>(null);

  // ─── Mutations ────────────────────────────────────────
  const createOrder = useCreateOrder();

  // ─── Queries ──────────────────────────────────────────
  // Open orders cho table đang chọn (để biết có đơn pending để pay)
  const orders = useOrders();
  const tableOpenOrder = useMemo(() => {
    if (!activeKey || !orders.data) return null;
    if (activeKey === "takeaway") return null;
    return (
      orders.data.find(
        (o) =>
          o.tableId === activeKey && ["sent", "in_progress", "ready", "served"].includes(o.status),
      ) ?? null
    );
  }, [activeKey, orders.data]);

  // Restore label từ persisted activeKey
  useEffect(() => {
    if (!activeKey) {
      setContextLabel("");
      return;
    }
    if (activeKey === "takeaway") {
      setContextLabel("Mang về");
    } else if (!contextLabel && tableOpenOrder?.tableName) {
      setContextLabel(tableOpenOrder.tableName);
    }
    // table label cập nhật khi onPickTable
  }, [activeKey, tableOpenOrder, contextLabel]);

  // ─── Handlers ─────────────────────────────────────────
  const handlePickTable = useCallback(
    (tableId: string, tableName: string) => {
      setActiveKey(tableId as CartKey);
      setContextLabel(tableName);
    },
    [setActiveKey],
  );

  const handlePickTakeaway = useCallback(() => {
    setActiveKey("takeaway" as CartKey);
    setContextLabel("Mang về");
  }, [setActiveKey]);

  const handleBack = useCallback(() => {
    setActiveKey(null);
    setContextLabel("");
  }, [setActiveKey]);

  const handlePickItem = useCallback(
    (item: MenuItem) => {
      if (!item.isAvailable) return;
      // Nếu có variants/toppings → mở dialog. Nếu không → add direct.
      const hasOptions = item.variants.length > 0 || item.toppingGroups.length > 0;
      if (hasOptions) {
        setVariantPicking(item);
        return;
      }
      if (!useCartStore.getState().activeKey) return;
      const key = useCartStore.getState().activeKey!;
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

  const handleSendToKitchen = useCallback(async () => {
    if (!activeKey || lines.length === 0) return;
    const isTakeaway = activeKey === "takeaway";
    try {
      const order = await createOrder.mutateAsync({
        orderType: isTakeaway ? "takeaway" : "dine_in",
        tableId: isTakeaway ? undefined : activeKey,
        lines: lines.map((l) => ({
          menuItemId: l.menuItemId,
          variantId: l.variantId ?? undefined,
          toppingOptionIds: l.toppingOptionIds,
          quantity: l.quantity,
          note: l.note ?? undefined,
        })),
      });
      // Auto send-to-kitchen — for MVP gộp 2 step (send-to-kitchen mutation cần riêng)
      // Tạm: order đang draft, gọi send tách thành 1 mutation khác:
      // (BE đã có /orders/:id/send-to-kitchen)
      const { apiPost } = await import("@/lib/api-client");
      await apiPost<Order>(`/orders/${order.id}/send-to-kitchen`);

      toast.success(`Đã gửi bếp ${order.orderNumber}`);
      clearCart(activeKey);
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Gửi bếp thất bại");
    }
  }, [activeKey, lines, createOrder, clearCart]);

  const handleOpenPayment = useCallback(() => {
    if (tableOpenOrder) {
      setPayOrder(tableOpenOrder);
    } else {
      toast.info("Chưa có đơn nào đã gửi bếp cho bàn này");
    }
  }, [tableOpenOrder]);

  // Header — mobile dùng bottom nav nên không cần SidebarTrigger
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
      <h1 className="truncate text-base font-semibold md:text-lg">POS — Gọi món</h1>
    </header>
  );

  // ─── Render ────────────────────────────────────────────
  // Dùng dvh (dynamic viewport) cho mobile để trừ URL bar iOS
  // Trừ 64px (h-16) cho bottom nav trên mobile, nguyên 100dvh trên md+
  const containerClass = "flex flex-col h-[calc(100dvh-4rem)] md:h-svh overflow-hidden";

  if (!activeKey) {
    return (
      <div className={containerClass}>
        {header}
        <div className="flex-1 overflow-y-auto">
          <TablePicker onPickTable={handlePickTable} onPickTakeaway={handlePickTakeaway} />
        </div>
      </div>
    );
  }

  const cartPanel = (
    <CartPanel
      cartKey={activeKey}
      contextLabel={contextLabel || (activeKey === "takeaway" ? "Mang về" : "Bàn")}
      lines={lines}
      subtotal={subtotal}
      count={count}
      isSending={createOrder.isPending}
      isPaying={false}
      hasOpenOrder={!!tableOpenOrder}
      onSendToKitchen={() => {
        handleSendToKitchen();
        setCartOpen(false);
      }}
      onPay={() => {
        handleOpenPayment();
        setCartOpen(false);
      }}
      onCancel={() => {
        handleBack();
        setCartOpen(false);
      }}
    />
  );

  return (
    <div className={containerClass}>
      {header}
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_440px]">
        {/* Menu — luôn hiện. Trên lg+ có cart bên cạnh */}
        <div className="overflow-hidden">
          <MenuGrid onPickItem={handlePickItem} />
        </div>

        {/* Desktop/large tablet landscape: cart panel sticky right */}
        <div className="hidden flex-col overflow-hidden lg:flex">{cartPanel}</div>

        {/* Mobile + tablet portrait: cart trong drawer */}
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

      {/* Floating "View cart" button — chỉ hiện <lg khi có món */}
      {count > 0 && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="bg-primary text-primary-foreground fixed bottom-20 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full px-5 py-3 shadow-lg transition-transform active:scale-95 lg:hidden"
        >
          <ShoppingCart className="size-5" />
          <span className="font-semibold tabular-nums">{count} món</span>
          <span className="font-bold tabular-nums">
            {new Intl.NumberFormat("vi-VN").format(subtotal)}đ
          </span>
        </button>
      )}

      <VariantPickerDialog
        item={variantPicking}
        open={!!variantPicking}
        onClose={() => setVariantPicking(null)}
        onConfirm={handleConfirmVariant}
      />

      <PaymentDialog
        order={payOrder}
        open={!!payOrder}
        onClose={() => setPayOrder(null)}
        onPaid={() => setPayOrder(null)}
      />
    </div>
  );
}
