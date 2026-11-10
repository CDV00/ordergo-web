"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/types/api";
import type { CartLine } from "@/lib/cart-store";

interface Props {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (line: Omit<CartLine, "clientLineId">) => void;
}

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

/** Ô lựa chọn (size / topping): viền + nền nhạt khi chọn, dấu tick góc phải. */
const optionClass = (selected: boolean, disabled = false) =>
  cn(
    "relative flex min-h-14 flex-col justify-center rounded-xl border px-3 py-2 text-left text-sm shadow-xs transition-[background-color,border-color,transform] active:scale-[0.98]",
    selected
      ? "border-primary bg-primary/10 text-primary ring-primary/20 ring-2"
      : "bg-card hover:border-primary/40",
    disabled && "cursor-not-allowed opacity-50",
  );

function SelectedTick({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="bg-primary text-primary-foreground absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full">
      <Check className="size-3" strokeWidth={3} />
    </span>
  );
}

export function VariantPickerDialog({ item, open, onClose, onConfirm }: Props) {
  const [variantId, setVariantId] = useState<string | null>(null);
  const [toppingIds, setToppingIds] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!item) return;
    const def = item.variants.find((v) => v.isDefault) ?? item.variants[0];
    setVariantId(def?.id ?? null);
    setToppingIds(new Set());
    setQuantity(1);
    setNote("");
  }, [item]);

  if (!item) return null;

  const variant = item.variants.find((v) => v.id === variantId);
  const variantPrice = variant?.priceModifier.amount ?? 0;
  const toppingsList = item.toppingGroups.flatMap((g) =>
    g.options.filter((o) => toppingIds.has(o.id)).map((o) => ({ groupId: g.id, ...o })),
  );
  const toppingsTotal = toppingsList.reduce((s, o) => s + o.priceModifier.amount, 0);
  const unitPrice = item.basePrice.amount + variantPrice + toppingsTotal;

  const toggleTopping = (id: string, group: { minSelect: number; maxSelect: number }) => {
    setToppingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        // Enforce maxSelect per group
        const groupOptionIds = item.toppingGroups
          .find((g) => g.options.some((o) => o.id === id))!
          .options.map((o) => o.id);
        const inGroup = [...next].filter((x) => groupOptionIds.includes(x)).length;
        if (inGroup >= group.maxSelect) {
          // remove oldest from group
          const toRemove = [...next].find((x) => groupOptionIds.includes(x));
          if (toRemove) next.delete(toRemove);
        }
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm({
      menuItemId: item.id,
      variantId: variant?.id ?? null,
      toppingOptionIds: [...toppingIds],
      quantity,
      note: note.trim() || null,
      name: item.name,
      imageUrl: item.imageUrl,
      unitPrice,
      basePrice: item.basePrice.amount,
      variantName: variant?.name ?? null,
      toppingNames: toppingsList.map((o) => o.name),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{item.name}</DialogTitle>
          <p className="text-muted-foreground text-sm tabular-nums">
            Giá gốc {formatVnd(item.basePrice.amount)}
          </p>
        </DialogHeader>

        <div className="space-y-5">
          {/* Variants */}
          {item.variants.length > 0 && (
            <div className="space-y-2">
              <Label>Tuỳ chọn</Label>
              <div className="grid grid-cols-2 gap-2">
                {item.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVariantId(v.id)}
                    aria-pressed={variantId === v.id}
                    className={optionClass(variantId === v.id)}
                  >
                    <div className="font-semibold">{v.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {v.priceModifier.amount > 0
                        ? `+${formatVnd(v.priceModifier.amount)}`
                        : "Mặc định"}
                    </div>
                    <SelectedTick show={variantId === v.id} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Toppings */}
          {item.toppingGroups.map((g) => (
            <div key={g.id} className="space-y-2">
              <Label>
                {g.name}
                <span className="text-muted-foreground ml-2 text-xs">
                  (chọn tối đa {g.maxSelect})
                </span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {g.options.map((o) => {
                  const selected = toppingIds.has(o.id);
                  return (
                    <button
                      key={o.id}
                      type="button"
                      disabled={!o.isAvailable}
                      onClick={() => toggleTopping(o.id, g)}
                      aria-pressed={selected}
                      className={optionClass(selected, !o.isAvailable)}
                    >
                      <div className="font-semibold">{o.name}</div>
                      <div className="text-muted-foreground text-xs">
                        +{formatVnd(o.priceModifier.amount)}
                      </div>
                      <SelectedTick show={selected} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quantity */}
          <div className="space-y-2">
            <Label>Số lượng</Label>
            <div className="bg-muted flex w-fit items-center gap-1 rounded-full p-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Giảm"
                className="bg-card size-11 rounded-full shadow-xs"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="size-4" />
              </Button>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-11 w-16 border-0 bg-transparent text-center text-lg font-bold tabular-nums shadow-none focus-visible:ring-0"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Tăng"
                className="bg-card size-11 rounded-full shadow-xs"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Input
              placeholder="Vd: ít đường, không đá..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:!justify-between">
          <Button variant="outline" size="lg" className="h-12 rounded-xl" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            onClick={handleConfirm}
            size="lg"
            className="h-12 rounded-xl text-base font-semibold sm:min-w-44"
          >
            Thêm — {formatVnd(unitPrice * quantity)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
