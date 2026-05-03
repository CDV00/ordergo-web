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
          <DialogTitle>{item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
                    className={`rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors ${variantId === v.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}
                  >
                    <div className="font-medium">{v.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {v.priceModifier.amount > 0
                        ? `+${formatVnd(v.priceModifier.amount)}`
                        : "Mặc định"}
                    </div>
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
                      className={`rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors ${selected ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"} ${!o.isAvailable ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      <div className="font-medium">{o.name}</div>
                      <div className="text-muted-foreground text-xs">
                        +{formatVnd(o.priceModifier.amount)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quantity */}
          <div className="space-y-2">
            <Label>Số lượng</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </Button>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => setQuantity((q) => q + 1)}
              >
                +
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
            />
          </div>
        </div>

        <DialogFooter className="!justify-between">
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={handleConfirm} className="font-semibold">
            Thêm — {formatVnd(unitPrice * quantity)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
