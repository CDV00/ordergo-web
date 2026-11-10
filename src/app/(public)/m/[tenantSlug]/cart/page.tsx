"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  Send,
  Loader2,
  ShoppingBag,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import {
  selectPubCartLines,
  selectPubCartSubtotal,
  usePublicCartStore,
} from "@/lib/public-cart-store";
import { useCreatePublicOrder } from "@/hooks/api/use-public";
import { PublicApiException } from "@/lib/public-api-client";
import { AnimatedNumber } from "@/components/animated-number";
import { mediaUrl } from "@/lib/media";

export default function PublicCartPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tableName, setTableName] = useState<string>("");

  useEffect(() => {
    const sid = sessionStorage.getItem("ordergo.session.id");
    const tn = sessionStorage.getItem("ordergo.session.tableName");
    if (!sid) {
      router.replace("/");
      return;
    }
    setSessionId(sid);
    setTableName(tn ?? "");
  }, [router]);

  const lines = usePublicCartStore(selectPubCartLines(sessionId));
  const subtotal = usePublicCartStore(selectPubCartSubtotal(sessionId));
  const inc = usePublicCartStore((s) => s.incrementLine);
  const dec = usePublicCartStore((s) => s.decrementLine);
  const remove = usePublicCartStore((s) => s.removeLine);
  const setNote = usePublicCartStore((s) => s.setNote);
  const clearCart = usePublicCartStore((s) => s.clearCart);

  const createOrder = useCreatePublicOrder(sessionId);

  const handleSubmit = async () => {
    if (!sessionId || lines.length === 0) return;
    try {
      const order = await createOrder.mutateAsync({
        lines: lines.map((l) => ({
          menuItemId: l.menuItemId,
          variantId: l.variantId ?? undefined,
          toppingOptionIds: l.toppingOptionIds,
          quantity: l.quantity,
          note: l.note ?? undefined,
        })),
      });
      toast.success(`Đã gửi đơn ${order.orderNumber} đến bếp 🍳`);
      clearCart(sessionId);
      router.replace(`/m/${tenantSlug}/orders`);
    } catch (err) {
      toast.error((err as PublicApiException).error?.message ?? "Gửi đơn thất bại");
    }
  };

  if (!sessionId) {
    return (
      <div className="flex h-svh items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col">
      <header className="bg-background/90 sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-3 backdrop-blur-md">
        <Link
          href={`/m/${tenantSlug}/menu`}
          className="hover:bg-muted -ml-2 flex size-11 items-center justify-center rounded-xl"
          aria-label="Quay lại menu"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-base font-bold">Giỏ hàng</h1>
          {tableName && <p className="text-muted-foreground text-xs">Bàn {tableName}</p>}
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-44">
        {lines.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-primary/10 text-primary mb-4 flex size-16 items-center justify-center rounded-full">
              <ShoppingBag className="size-7" />
            </div>
            <p className="mb-5">Giỏ trống. Hãy chọn món bạn thích.</p>
            <Link
              href={`/m/${tenantSlug}/menu`}
              className="bg-primary text-primary-foreground inline-flex h-11 items-center rounded-full px-6 font-semibold shadow-sm"
            >
              Xem menu
            </Link>
          </div>
        ) : (
          <ul className="relative space-y-3">
            <AnimatePresence initial={false} mode="popLayout">
              {lines.map((l) => (
                <motion.li
                  key={l.clientLineId}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -24, transition: { duration: 0.15 } }}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="bg-card space-y-3 rounded-2xl border p-3 shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-muted size-14 shrink-0 overflow-hidden rounded-xl">
                      {l.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mediaUrl(l.imageUrl) ?? undefined}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="leading-tight font-semibold">{l.name}</div>
                      {l.variantName && (
                        <div className="text-muted-foreground text-xs">{l.variantName}</div>
                      )}
                      {l.toppingNames.length > 0 && (
                        <div className="text-muted-foreground text-xs">
                          + {l.toppingNames.join(", ")}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => remove(sessionId, l.clientLineId)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -m-1 flex size-10 items-center justify-center rounded-xl transition-colors"
                      aria-label="Xoá"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <label className="bg-muted/60 focus-within:ring-primary/40 flex items-center gap-2 rounded-xl px-3 focus-within:ring-2">
                    <StickyNote className="text-muted-foreground size-4 shrink-0" />
                    <input
                      type="text"
                      defaultValue={l.note ?? ""}
                      placeholder="Ghi chú..."
                      onBlur={(e) => setNote(sessionId, l.clientLineId, e.target.value)}
                      className="h-10 w-full bg-transparent text-sm focus:outline-none"
                    />
                  </label>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-full border p-1">
                      <button
                        onClick={() => dec(sessionId, l.clientLineId)}
                        className="hover:bg-muted flex size-9 items-center justify-center rounded-full active:scale-95"
                        aria-label="Giảm"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-7 text-center font-semibold tabular-nums">
                        {l.quantity}
                      </span>
                      <button
                        onClick={() => inc(sessionId, l.clientLineId)}
                        className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-full active:scale-95"
                        aria-label="Tăng"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <AnimatedNumber
                      value={l.unitPrice * l.quantity}
                      format="vnd"
                      className="text-primary font-bold"
                    />
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </main>

      {lines.length > 0 && (
        <div className="bg-background/95 fixed inset-x-0 bottom-0 z-30 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.15)] backdrop-blur-md">
          <div className="mx-auto max-w-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {lines.reduce((s, l) => s + l.quantity, 0)} món
              </span>
              <AnimatedNumber value={subtotal} format="vnd" className="text-2xl font-bold" />
            </div>
            <button
              onClick={handleSubmit}
              disabled={createOrder.isPending}
              className="bg-primary text-primary-foreground shadow-primary/30 h-14 w-full rounded-2xl font-bold shadow-lg transition-transform active:scale-[0.97] disabled:opacity-50"
            >
              {createOrder.isPending ? (
                <>
                  <Loader2 className="mr-2 inline size-5 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="mr-2 inline size-4" />
                  Gửi đơn xuống bếp
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
