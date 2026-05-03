"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ImageOff, Minus, Plus } from "lucide-react";
import { usePublicCartStore } from "@/lib/public-cart-store";
import type { MenuItem } from "@/types/api";

function fmt(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

interface Props {
  item: MenuItem | null;
  sessionId: string | null;
  open: boolean;
  onClose: () => void;
}

export function VariantPickerSheet({ item, sessionId, open, onClose }: Props) {
  const addLine = usePublicCartStore((s) => s.addLine);
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
        const groupOptionIds = item.toppingGroups
          .find((g) => g.options.some((o) => o.id === id))!
          .options.map((o) => o.id);
        const inGroup = [...next].filter((x) => groupOptionIds.includes(x)).length;
        if (inGroup >= group.maxSelect) {
          const toRemove = [...next].find((x) => groupOptionIds.includes(x));
          if (toRemove) next.delete(toRemove);
        }
        next.add(id);
      }
      return next;
    });
  };

  const handleAdd = () => {
    if (!sessionId) return;
    addLine(sessionId, {
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
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="flex max-h-[90vh] flex-col gap-0 overflow-y-auto rounded-t-2xl p-0"
      >
        <SheetTitle className="sr-only">{item.name}</SheetTitle>

        {/* Hero image */}
        <div className="bg-muted flex aspect-[16/10] shrink-0 items-center justify-center">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            <ImageOff className="text-muted-foreground size-12" />
          )}
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div>
            <h2 className="text-xl font-bold">{item.name}</h2>
            {item.description && (
              <p className="text-muted-foreground mt-1 text-sm">{item.description}</p>
            )}
            <div className="text-primary mt-2 text-2xl font-bold">{fmt(item.basePrice.amount)}</div>
          </div>

          {/* Variants */}
          {item.variants.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold">Tuỳ chọn</h3>
              <div className="grid grid-cols-2 gap-2">
                {item.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariantId(v.id)}
                    className={`rounded-lg border-2 p-3 text-left ${
                      variantId === v.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border"
                    }`}
                  >
                    <div className="text-sm font-medium">{v.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {v.priceModifier.amount > 0 ? `+${fmt(v.priceModifier.amount)}` : "Mặc định"}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Toppings */}
          {item.toppingGroups.map((g) => (
            <section key={g.id}>
              <h3 className="mb-2 text-sm font-semibold">
                {g.name}
                <span className="text-muted-foreground ml-2 text-xs font-normal">
                  (tối đa {g.maxSelect})
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {g.options.map((o) => {
                  const selected = toppingIds.has(o.id);
                  return (
                    <button
                      key={o.id}
                      disabled={!o.isAvailable}
                      onClick={() => toggleTopping(o.id, g)}
                      className={`rounded-lg border-2 p-3 text-left ${
                        selected ? "border-primary bg-primary/10 text-primary" : "border-border"
                      } ${!o.isAvailable ? "opacity-50" : ""}`}
                    >
                      <div className="text-sm font-medium">{o.name}</div>
                      <div className="text-muted-foreground text-xs">
                        +{fmt(o.priceModifier.amount)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          {/* Note */}
          <section>
            <h3 className="mb-2 text-sm font-semibold">Ghi chú</h3>
            <input
              type="text"
              placeholder="Vd: ít đường, không đá"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-background focus:ring-primary w-full rounded-lg border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
            />
          </section>
        </div>

        {/* Bottom action bar */}
        <div className="flex shrink-0 items-center gap-3 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="bg-muted flex size-10 items-center justify-center rounded-full active:scale-95"
              aria-label="Giảm"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center font-bold tabular-nums">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="bg-muted flex size-10 items-center justify-center rounded-full active:scale-95"
              aria-label="Tăng"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <button
            onClick={handleAdd}
            className="bg-primary text-primary-foreground flex-1 rounded-full py-3 font-bold transition-transform active:scale-95"
          >
            Thêm — {fmt(unitPrice * quantity)}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
