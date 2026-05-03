"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, Trash2, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  selectPubCartLines,
  selectPubCartSubtotal,
  usePublicCartStore,
} from "@/lib/public-cart-store";
import { useCreatePublicOrder } from "@/hooks/api/use-public";
import { PublicApiException } from "@/lib/public-api-client";

function fmt(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

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
    <div className="flex min-h-svh flex-col">
      <header className="bg-background sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-3">
        <Link
          href={`/m/${tenantSlug}/menu`}
          className="hover:bg-muted -ml-2 flex size-10 items-center justify-center rounded-lg"
          aria-label="Quay lại menu"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-semibold">Giỏ hàng</h1>
          {tableName && <p className="text-muted-foreground text-xs">Bàn {tableName}</p>}
        </div>
      </header>

      <main className="flex-1 px-4 py-3 pb-32">
        {lines.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 text-6xl">🛒</div>
            <p className="mb-4">Giỏ trống. Hãy chọn món bạn thích.</p>
            <Link
              href={`/m/${tenantSlug}/menu`}
              className="bg-primary text-primary-foreground rounded-full px-5 py-2.5 font-medium"
            >
              Xem menu
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {lines.map((l) => (
              <li key={l.clientLineId} className="bg-card space-y-2 rounded-xl border p-3">
                <div className="flex items-start gap-3">
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
                    className="text-muted-foreground p-1"
                    aria-label="Xoá"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <input
                  type="text"
                  defaultValue={l.note ?? ""}
                  placeholder="Ghi chú..."
                  onBlur={(e) => setNote(sessionId, l.clientLineId, e.target.value)}
                  className="focus:border-primary w-full border-b border-dashed bg-transparent py-1 text-sm focus:outline-none"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => dec(sessionId, l.clientLineId)}
                      className="bg-muted flex size-8 items-center justify-center rounded-full active:scale-95"
                      aria-label="Giảm"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-6 text-center font-semibold tabular-nums">{l.quantity}</span>
                    <button
                      onClick={() => inc(sessionId, l.clientLineId)}
                      className="bg-muted flex size-8 items-center justify-center rounded-full active:scale-95"
                      aria-label="Tăng"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <div className="font-bold tabular-nums">{fmt(l.unitPrice * l.quantity)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {lines.length > 0 && (
        <div className="bg-background fixed inset-x-0 bottom-0 z-30 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {lines.reduce((s, l) => s + l.quantity, 0)} món
              </span>
              <span className="text-2xl font-bold tabular-nums">{fmt(subtotal)}</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={createOrder.isPending}
              className="bg-primary text-primary-foreground w-full rounded-full py-4 font-bold transition-transform active:scale-95 disabled:opacity-50"
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
