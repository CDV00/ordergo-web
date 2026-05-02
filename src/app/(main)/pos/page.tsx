"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
          o.tableId === activeKey &&
          ["sent", "in_progress", "ready", "served"].includes(o.status),
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

  const handlePickItem = useCallback((item: MenuItem) => {
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
  }, [addLine]);

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

  // Header
  const header = (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      {activeKey && (
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="size-4 mr-1" />
          Đổi bàn
        </Button>
      )}
      <h1 className="text-lg font-semibold">POS — Gọi món</h1>
    </header>
  );

  // ─── Render ────────────────────────────────────────────
  if (!activeKey) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        {header}
        <div className="flex-1 overflow-y-auto">
          <TablePicker onPickTable={handlePickTable} onPickTakeaway={handlePickTakeaway} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {header}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] overflow-hidden">
        <div className="overflow-hidden">
          <MenuGrid onPickItem={handlePickItem} />
        </div>
        <CartPanel
          cartKey={activeKey}
          contextLabel={contextLabel || (activeKey === "takeaway" ? "Mang về" : "Bàn")}
          lines={lines}
          subtotal={subtotal}
          count={count}
          isSending={createOrder.isPending}
          isPaying={false}
          hasOpenOrder={!!tableOpenOrder}
          onSendToKitchen={handleSendToKitchen}
          onPay={handleOpenPayment}
          onCancel={handleBack}
        />
      </div>

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
