"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, Send, CreditCard, Receipt } from "lucide-react";
import { useCartStore, type CartLine, type CartKey } from "@/lib/cart-store";

interface Props {
  cartKey: CartKey;
  contextLabel: string;
  lines: CartLine[];
  subtotal: number;
  count: number;
  isSending: boolean;
  isPaying: boolean;
  hasOpenOrder: boolean;
  onSendToKitchen: () => void;
  onPay: () => void;
  onCancel: () => void;
}

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function CartLineRow({ cartKey, line }: { cartKey: CartKey; line: CartLine }) {
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
}

const MemoCartLineRow = memo(CartLineRow);

function CartPanelInner({
  cartKey,
  contextLabel,
  lines,
  subtotal,
  count,
  isSending,
  isPaying,
  hasOpenOrder,
  onSendToKitchen,
  onPay,
  onCancel,
}: Props) {
  const isEmpty = lines.length === 0;

  return (
    <aside className="bg-card flex h-full flex-col border-l">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b p-4">
        <div>
          <div className="text-muted-foreground text-xs">Đang phục vụ</div>
          <div className="text-base font-semibold">{contextLabel}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Đổi bàn
        </Button>
      </div>

      {/* Lines */}
      <div className="flex-1 overflow-y-auto px-4">
        {isEmpty ? (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 py-12 text-center">
            <Receipt className="size-12 opacity-40" />
            <div className="text-sm">Chưa có món nào</div>
            <div className="text-xs">Tap vào món bên trái để thêm</div>
          </div>
        ) : (
          lines.map((l) => <MemoCartLineRow key={l.clientLineId} cartKey={cartKey} line={l} />)
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 space-y-3 border-t p-4">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">{count} món</div>
          <div className="text-2xl font-bold tabular-nums">{formatVnd(subtotal)}</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            size="lg"
            disabled={isEmpty || isSending}
            onClick={onSendToKitchen}
            className="font-semibold"
          >
            <Send className="mr-1.5 size-4" />
            {isSending ? "Đang gửi..." : "Gửi bếp"}
          </Button>
          <Button
            size="lg"
            variant={hasOpenOrder ? "default" : "outline"}
            disabled={!hasOpenOrder || isPaying}
            onClick={onPay}
            className="font-semibold"
          >
            <CreditCard className="mr-1.5 size-4" />
            Thanh toán
          </Button>
        </div>
      </div>
    </aside>
  );
}

export const CartPanel = memo(CartPanelInner);
