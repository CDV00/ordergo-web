"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, Send, CreditCard, Receipt, X } from "lucide-react";
import { useCartStore, type CartLine, type CartKey } from "@/lib/cart-store";
import { formatVnd, KITCHEN_STATUS_CLASS, KITCHEN_STATUS_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order, OrderLine } from "@/types/api";

interface Props {
  cartKey: CartKey;
  contextLabel: string;
  lines: CartLine[];
  subtotal: number;
  count: number;
  /** Đơn đang mở của bàn (đã gửi bếp ít nhất 1 lần) — null nếu bàn chưa gọi món */
  openOrder: Order | null;
  isSending: boolean;
  onSendToKitchen: () => void;
  onPay: () => void;
  onRemoveOrderLine: (line: OrderLine) => void;
  onCancel: () => void;
}

const CartLineRow = ({ cartKey, line }: { cartKey: CartKey; line: CartLine }) => {
  const inc = useCartStore((s) => s.incrementLine);
  const dec = useCartStore((s) => s.decrementLine);
  const remove = useCartStore((s) => s.removeLine);
  const setNote = useCartStore((s) => s.setNote);

  return (
    <div className="border-b py-3 last:border-b-0">
      <div className="flex justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm leading-tight font-medium">{line.name}</div>
          {line.variantName && (
            <div className="text-muted-foreground text-xs">{line.variantName}</div>
          )}
          {line.toppingNames.length > 0 && (
            <div className="text-muted-foreground text-xs">+ {line.toppingNames.join(", ")}</div>
          )}
        </div>
        <button
          onClick={() => remove(cartKey, line.clientLineId)}
          className="text-muted-foreground hover:text-destructive shrink-0"
          aria-label="Xoá"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <input
        defaultValue={line.note ?? ""}
        placeholder="Ghi chú..."
        onBlur={(e) => setNote(cartKey, line.clientLineId, e.target.value)}
        className="border-border focus:border-primary mt-1.5 w-full border-b border-dashed bg-transparent py-1 text-xs focus:outline-none"
      />

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={() => dec(cartKey, line.clientLineId)}
          >
            <Minus className="size-3" />
          </Button>
          <span className="w-7 text-center text-sm font-semibold tabular-nums">
            {line.quantity}
          </span>
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={() => inc(cartKey, line.clientLineId)}
          >
            <Plus className="size-3" />
          </Button>
        </div>
        <div className="text-sm font-semibold tabular-nums">
          {formatVnd(line.unitPrice * line.quantity)}
        </div>
      </div>
    </div>
  );
};

const MemoCartLineRow = memo(CartLineRow);

/** Món đã nằm trong đơn (đã gửi bếp hoặc gọi thêm chưa gửi) */
function OrderLineRow({ line, onRemove }: { line: OrderLine; onRemove: () => void }) {
  const cancelled = line.kitchenStatus === "cancelled";
  const removable = !cancelled && line.kitchenStatus !== "served";
  const extras = [line.variantSnapshot?.name, ...line.modifiers.map((m) => m.optionName)].filter(
    Boolean,
  );
  return (
    <div className={cn("flex items-start gap-2 py-2 text-sm", cancelled && "opacity-50")}>
      <span className="w-6 shrink-0 font-semibold tabular-nums">{line.quantity}×</span>
      <div className="min-w-0 flex-1">
        <div className={cn("leading-tight", cancelled && "line-through")}>
          {line.productSnapshot.name}
        </div>
        {extras.length > 0 && (
          <div className="text-muted-foreground text-xs">{extras.join(", ")}</div>
        )}
        {line.note && <div className="text-muted-foreground text-xs italic">“{line.note}”</div>}
        <span
          className={cn(
            "mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium",
            line.sentToKitchenAt
              ? KITCHEN_STATUS_CLASS[line.kitchenStatus]
              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
          )}
        >
          {line.sentToKitchenAt ? KITCHEN_STATUS_LABEL[line.kitchenStatus] : "Chưa gửi bếp"}
        </span>
      </div>
      <span className="shrink-0 tabular-nums">
        {cancelled ? "—" : formatVnd(line.lineTotal.amount)}
      </span>
      {removable && (
        <button
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive shrink-0 pt-0.5"
          aria-label={`Bỏ ${line.productSnapshot.name}`}
          title={line.sentToKitchenAt ? "Huỷ món (cần quản lý)" : "Bỏ món"}
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

const CartPanelInner = ({
  cartKey,
  contextLabel,
  lines,
  subtotal,
  count,
  openOrder,
  isSending,
  onSendToKitchen,
  onPay,
  onRemoveOrderLine,
  onCancel,
}: Props) => {
  const isEmpty = lines.length === 0;
  const orderTotal = openOrder?.pricing.total.amount ?? 0;
  const hasUnsentInOrder =
    openOrder?.lines.some((l) => !l.sentToKitchenAt && l.kitchenStatus !== "cancelled") ?? false;
  const canSend = !isEmpty || hasUnsentInOrder;

  return (
    <aside className="bg-card flex h-full flex-col border-l">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b p-4">
        <div>
          <div className="text-muted-foreground text-xs">
            {openOrder ? `Đơn ${openOrder.orderNumber}` : "Đang phục vụ"}
          </div>
          <div className="text-base font-semibold">{contextLabel}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Đổi bàn
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {/* Món đã gọi */}
        {openOrder && (
          <section className="border-b py-2">
            <div className="text-muted-foreground flex items-center justify-between pt-1 text-xs font-medium tracking-wide uppercase">
              <span>Đã gọi</span>
              <span className="tabular-nums">{formatVnd(orderTotal)}</span>
            </div>
            <div className="divide-y">
              {openOrder.lines.map((l) => (
                <OrderLineRow key={l.id} line={l} onRemove={() => onRemoveOrderLine(l)} />
              ))}
            </div>
            {openOrder.pricing.discount.amount > 0 && (
              <div className="text-muted-foreground flex justify-between py-1 text-xs">
                <span>Giảm giá</span>
                <span className="tabular-nums">
                  −{formatVnd(openOrder.pricing.discount.amount)}
                </span>
              </div>
            )}
          </section>
        )}

        {/* Giỏ gọi thêm */}
        {isEmpty ? (
          !openOrder && (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 py-12 text-center">
              <Receipt className="size-12 opacity-40" />
              <div className="text-sm">Chưa có món nào</div>
              <div className="text-xs">Chạm vào món để thêm</div>
            </div>
          )
        ) : (
          <section>
            {openOrder && (
              <div className="text-primary pt-3 text-xs font-medium tracking-wide uppercase">
                Gọi thêm
              </div>
            )}
            {lines.map((l) => (
              <MemoCartLineRow key={l.clientLineId} cartKey={cartKey} line={l} />
            ))}
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 space-y-3 border-t p-4">
        {!isEmpty && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{count} món chưa gửi</span>
            <span className="font-semibold tabular-nums">+{formatVnd(subtotal)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">Tổng cộng</div>
          <div className="text-2xl font-bold tabular-nums">{formatVnd(orderTotal + subtotal)}</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            size="lg"
            disabled={!canSend || isSending}
            onClick={onSendToKitchen}
            className="font-semibold"
          >
            <Send className="mr-1.5 size-4" />
            {isSending ? "Đang gửi..." : openOrder ? "Gửi thêm" : "Gửi bếp"}
          </Button>
          <Button
            size="lg"
            variant={openOrder ? "default" : "outline"}
            disabled={!openOrder || !isEmpty}
            onClick={onPay}
            className="font-semibold"
            title={!isEmpty ? "Gửi bếp các món đang chọn trước khi thanh toán" : undefined}
          >
            <CreditCard className="mr-1.5 size-4" />
            Thanh toán
          </Button>
        </div>
      </div>
    </aside>
  );
};

export const CartPanel = memo(CartPanelInner);
