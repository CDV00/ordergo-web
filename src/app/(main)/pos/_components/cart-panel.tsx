"use client";

import { memo } from "react";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/animated-number";
import {
  Minus,
  Plus,
  Trash2,
  Send,
  CreditCard,
  Receipt,
  X,
  CloudOff,
  ArrowLeftRight,
} from "lucide-react";
import { useCartStore, type CartLine, type CartKey } from "@/lib/cart-store";
import { formatVnd, KITCHEN_STATUS_CLASS, KITCHEN_STATUS_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OutboxDisplayLine } from "@/lib/offline/outbox-core";
import type { Order, OrderLine } from "@/types/api";

interface Props {
  cartKey: CartKey;
  contextLabel: string;
  lines: CartLine[];
  subtotal: number;
  count: number;
  /** Đơn đang mở của bàn (đã gửi bếp ít nhất 1 lần) — null nếu bàn chưa gọi món */
  openOrder: Order | null;
  /** Món đã lưu vào hàng đợi offline của bàn này — chưa tới server */
  pendingLines: OutboxDisplayLine[];
  isSending: boolean;
  onSendToKitchen: () => void;
  onPay: () => void;
  onRemoveOrderLine: (line: OrderLine) => void;
  onCancel: () => void;
}

/** Dòng giỏ vào/ra nhanh (≤ 250ms) để không làm chậm thu ngân. */
const lineSpring: Transition = { type: "spring", stiffness: 500, damping: 38 };
const lineMotion = {
  layout: "position" as const,
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: 24, transition: { duration: 0.15 } },
  transition: lineSpring,
};

function SectionTitle({
  children,
  amount,
  className,
}: {
  children: React.ReactNode;
  amount?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between pt-3 pb-1 text-xs font-semibold tracking-wide uppercase",
        className,
      )}
    >
      {children}
      {amount !== undefined && <AnimatedNumber value={amount} format="vnd" />}
    </div>
  );
}

const CartLineRow = ({ cartKey, line }: { cartKey: CartKey; line: CartLine }) => {
  const inc = useCartStore((s) => s.incrementLine);
  const dec = useCartStore((s) => s.decrementLine);
  const remove = useCartStore((s) => s.removeLine);
  const setNote = useCartStore((s) => s.setNote);

  return (
    <div className="bg-card rounded-xl border p-3 shadow-xs">
      <div className="flex justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm leading-tight font-semibold">{line.name}</div>
          {line.variantName && (
            <div className="text-muted-foreground mt-0.5 text-xs">{line.variantName}</div>
          )}
          {line.toppingNames.length > 0 && (
            <div className="text-muted-foreground text-xs">+ {line.toppingNames.join(", ")}</div>
          )}
        </div>
        <button
          onClick={() => remove(cartKey, line.clientLineId)}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -m-1.5 flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors"
          aria-label="Xoá"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <input
        defaultValue={line.note ?? ""}
        placeholder="Ghi chú..."
        onBlur={(e) => setNote(cartKey, line.clientLineId, e.target.value)}
        className="border-border focus:border-primary placeholder:text-muted-foreground/70 mt-1.5 w-full border-b border-dashed bg-transparent py-1 text-xs focus:outline-none"
      />

      <div className="mt-2.5 flex items-center justify-between">
        <div className="bg-muted flex items-center gap-0.5 rounded-full p-0.5">
          <Button
            size="icon"
            variant="ghost"
            className="bg-card size-9 rounded-full shadow-xs"
            aria-label="Giảm"
            onClick={() => dec(cartKey, line.clientLineId)}
          >
            <Minus className="size-4" />
          </Button>
          <span className="w-8 text-center text-sm font-bold tabular-nums">{line.quantity}</span>
          <Button
            size="icon"
            variant="ghost"
            className="bg-card size-9 rounded-full shadow-xs"
            aria-label="Tăng"
            onClick={() => inc(cartKey, line.clientLineId)}
          >
            <Plus className="size-4" />
          </Button>
        </div>
        <AnimatedNumber
          value={line.unitPrice * line.quantity}
          format="vnd"
          className="text-sm font-bold"
        />
      </div>
    </div>
  );
};

const MemoCartLineRow = memo(CartLineRow);

/** Món đã xếp hàng offline — chỉ xem, sẽ tự gửi bếp khi có mạng (sửa/bỏ ở "Đơn chờ gửi"). */
function PendingLineRow({ line }: { line: OutboxDisplayLine }) {
  const extras = [line.variantName, ...line.toppingNames].filter(Boolean);
  return (
    <div className="flex items-start gap-2 py-2.5 text-sm" data-testid="pending-line">
      <span className="bg-warning-soft dark:text-warning flex h-6 min-w-7 shrink-0 items-center justify-center rounded-md px-1 text-xs font-bold text-[oklch(0.5_0.12_70)] tabular-nums">
        {line.quantity}×
      </span>
      <div className="min-w-0 flex-1">
        <div className="leading-tight font-medium">{line.name}</div>
        {extras.length > 0 && (
          <div className="text-muted-foreground text-xs">{extras.join(", ")}</div>
        )}
        {line.note && <div className="text-muted-foreground text-xs italic">“{line.note}”</div>}
      </div>
      <span className="shrink-0 tabular-nums">{formatVnd(line.unitPrice * line.quantity)}</span>
    </div>
  );
}

/** Món đã nằm trong đơn (đã gửi bếp hoặc gọi thêm chưa gửi) */
function OrderLineRow({ line, onRemove }: { line: OrderLine; onRemove: () => void }) {
  const cancelled = line.kitchenStatus === "cancelled";
  const removable = !cancelled && line.kitchenStatus !== "served";
  const extras = [line.variantSnapshot?.name, ...line.modifiers.map((m) => m.optionName)].filter(
    Boolean,
  );
  return (
    <div className={cn("flex items-start gap-2 py-2.5 text-sm", cancelled && "opacity-50")}>
      <span className="bg-muted flex h-6 min-w-7 shrink-0 items-center justify-center rounded-md px-1 text-xs font-bold tabular-nums">
        {line.quantity}×
      </span>
      <div className="min-w-0 flex-1">
        <div className={cn("leading-tight font-medium", cancelled && "line-through")}>
          {line.productSnapshot.name}
        </div>
        {extras.length > 0 && (
          <div className="text-muted-foreground text-xs">{extras.join(", ")}</div>
        )}
        {line.note && <div className="text-muted-foreground text-xs italic">“{line.note}”</div>}
        <span
          className={cn(
            "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
            line.sentToKitchenAt
              ? KITCHEN_STATUS_CLASS[line.kitchenStatus]
              : "bg-muted text-muted-foreground border border-dashed",
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
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -my-1 flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors"
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
  pendingLines,
  isSending,
  onSendToKitchen,
  onPay,
  onRemoveOrderLine,
  onCancel,
}: Props) => {
  const isEmpty = lines.length === 0;
  const pendingTotal = pendingLines.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0);
  const hasPending = pendingLines.length > 0;
  const orderTotal = openOrder?.pricing.total.amount ?? 0;
  const hasUnsentInOrder =
    openOrder?.lines.some((l) => !l.sentToKitchenAt && l.kitchenStatus !== "cancelled") ?? false;
  const canSend = !isEmpty || hasUnsentInOrder;
  const canPay = !!openOrder && isEmpty && !hasPending;

  return (
    <aside className="bg-muted/40 flex h-full flex-col border-l">
      {/* Header */}
      <div className="bg-card flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <div className="text-muted-foreground text-xs font-medium">
            {openOrder ? `Đơn ${openOrder.orderNumber}` : "Đang phục vụ"}
          </div>
          <div className="truncate text-lg font-bold tracking-tight">{contextLabel}</div>
        </div>
        <Button variant="outline" size="sm" onClick={onCancel} className="shrink-0 rounded-full">
          <ArrowLeftRight className="size-3.5" />
          Đổi bàn
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-3">
        {/* Món đã gọi */}
        {openOrder && (
          <section className="border-b pb-2">
            <SectionTitle amount={orderTotal} className="text-muted-foreground">
              <span>Đã gọi</span>
            </SectionTitle>
            <div className="divide-y">
              <AnimatePresence initial={false}>
                {openOrder.lines.map((l) => (
                  <motion.div key={l.id} {...lineMotion}>
                    <OrderLineRow line={l} onRemove={() => onRemoveOrderLine(l)} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {openOrder.pricing.discount.amount > 0 && (
              <div className="text-success flex justify-between py-1 text-xs font-medium">
                <span>Giảm giá</span>
                <span className="tabular-nums">
                  −{formatVnd(openOrder.pricing.discount.amount)}
                </span>
              </div>
            )}
          </section>
        )}

        {/* Đã lưu lúc mất mạng, chưa tới server */}
        {hasPending && (
          <section
            className="border-warning/40 bg-warning-soft/40 mt-3 rounded-xl border border-dashed px-3 pb-1"
            data-testid="pending-section"
          >
            <SectionTitle
              amount={pendingTotal}
              className="dark:text-warning pt-2.5 text-[oklch(0.5_0.12_70)]"
            >
              <span className="flex items-center gap-1">
                <CloudOff className="size-3.5" /> Chờ gửi (offline)
              </span>
            </SectionTitle>
            <div className="divide-warning/20 divide-y">
              {pendingLines.map((l, i) => (
                <PendingLineRow key={i} line={l} />
              ))}
            </div>
          </section>
        )}

        {/* Giỏ gọi thêm */}
        {isEmpty ? (
          !openOrder &&
          !hasPending && (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 py-12 text-center">
              <div className="bg-muted mb-1 flex size-16 items-center justify-center rounded-full">
                <Receipt className="size-7 opacity-60" />
              </div>
              <div className="text-foreground text-sm font-semibold">Chưa có món nào</div>
              <div className="text-xs">Chạm vào món để thêm</div>
            </div>
          )
        ) : (
          <section>
            {(openOrder || hasPending) && (
              <SectionTitle className="text-primary">
                <span>Gọi thêm</span>
              </SectionTitle>
            )}
            <div className="space-y-2 pt-2">
              <AnimatePresence initial={false} mode="popLayout">
                {lines.map((l) => (
                  <motion.div key={l.clientLineId} {...lineMotion}>
                    <MemoCartLineRow cartKey={cartKey} line={l} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="bg-card shrink-0 space-y-3 border-t p-4 shadow-[0_-4px_12px_-8px_rgb(0_0_0/0.12)]">
        {!isEmpty && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{count} món chưa gửi</span>
            <span className="text-primary flex items-baseline font-semibold">
              +<AnimatedNumber value={subtotal} format="vnd" />
            </span>
          </div>
        )}
        <div className="flex items-end justify-between">
          <div className="text-muted-foreground pb-1 text-sm font-medium">Tổng cộng</div>
          <AnimatedNumber
            value={orderTotal + pendingTotal + subtotal}
            format="vnd"
            className="text-3xl font-bold tracking-tight"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            size="lg"
            variant={canSend || !canPay ? "default" : "outline"}
            disabled={!canSend || isSending}
            onClick={onSendToKitchen}
            className="h-14 rounded-xl font-semibold"
          >
            <Send className="size-4" />
            {isSending ? "Đang gửi..." : openOrder || hasPending ? "Gửi thêm" : "Gửi bếp"}
          </Button>
          <Button
            size="lg"
            variant={canPay ? "success" : "outline"}
            disabled={!openOrder || !isEmpty || hasPending}
            onClick={onPay}
            className="h-14 rounded-xl font-semibold"
            title={
              hasPending
                ? "Còn món chờ gửi (offline) — thanh toán sau khi đã gửi được"
                : !isEmpty
                  ? "Gửi bếp các món đang chọn trước khi thanh toán"
                  : undefined
            }
          >
            <CreditCard className="size-4" />
            Thanh toán
          </Button>
        </div>
      </div>
    </aside>
  );
};

export const CartPanel = memo(CartPanelInner);
