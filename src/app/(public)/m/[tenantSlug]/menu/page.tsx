"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ImageOff, ListOrdered, Search, ShoppingCart, Store, Loader2 } from "lucide-react";
import { usePublicMenu, usePublicSession } from "@/hooks/api/use-public";
import {
  selectPubCartCount,
  selectPubCartSubtotal,
  usePublicCartStore,
} from "@/lib/public-cart-store";
import type { MenuItem } from "@/types/api";
import { VariantPickerSheet } from "../_components/variant-picker-sheet";

function fmt(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function MenuItemCard({ item, onClick }: { item: MenuItem; onClick: (item: MenuItem) => void }) {
  const disabled = !item.isAvailable;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(item)}
      className={`bg-card flex gap-3 rounded-xl border p-3 text-left transition-transform active:scale-[0.98] ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
    >
      <div className="bg-muted flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageOff className="text-muted-foreground size-6" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 leading-tight font-semibold">{item.name}</div>
        {item.description && (
          <div className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
            {item.description}
          </div>
        )}
        <div className="text-primary mt-1.5 text-base font-bold">{fmt(item.basePrice.amount)}</div>
        {disabled && (
          <span className="mt-1 inline-block rounded bg-rose-100 px-2 py-0.5 text-xs text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            Hết món
          </span>
        )}
      </div>
    </button>
  );
}

const MemoMenuItemCard = memo(MenuItemCard);

export default function PublicMenuPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tableName, setTableName] = useState<string>("");
  const [picking, setPicking] = useState<MenuItem | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  // Hydrate sessionId từ sessionStorage (set ở entry page)
  useEffect(() => {
    const sid = sessionStorage.getItem("ordergo.session.id");
    const tn = sessionStorage.getItem("ordergo.session.tableName");
    if (!sid) {
      // Chưa có session → quay về home (hoặc QR scan landing)
      router.replace("/");
      return;
    }
    setSessionId(sid);
    setTableName(tn ?? "");
  }, [router]);

  const session = usePublicSession(sessionId);
  const menu = usePublicMenu(sessionId);

  const cartCount = usePublicCartStore(selectPubCartCount(sessionId));
  const cartSubtotal = usePublicCartStore(selectPubCartSubtotal(sessionId));

  const filteredItems = useMemo(() => {
    if (!menu.data) return [];
    let items = menu.data.items;
    if (activeCategoryId) items = items.filter((i) => i.categoryId === activeCategoryId);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.tags ?? []).some((t) => t.toLowerCase().includes(q)),
      );
    }
    return items;
  }, [menu.data, activeCategoryId, search]);

  if (!sessionId || menu.isLoading) {
    return (
      <div className="flex h-svh flex-col items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  if (menu.error || !menu.data) {
    return (
      <div className="text-destructive p-6 text-center">Không tải được menu. Thử quét lại QR.</div>
    );
  }

  return (
    <div className="min-h-svh pb-24">
      {/* Header sticky */}
      <header className="bg-background/95 sticky top-0 z-20 border-b backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
            <Store className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{menu.data.venue.name}</div>
            <div className="text-muted-foreground text-xs">
              Bàn <strong>{tableName || session.data?.tableName}</strong>
              {session.data && session.data.orderCount > 0 && (
                <> · {session.data.orderCount} đơn đang chạy</>
              )}
            </div>
          </div>
          <Link
            href={`/m/${tenantSlug}/orders`}
            className="bg-muted flex size-10 items-center justify-center rounded-lg"
            aria-label="Đơn của tôi"
          >
            <ListOrdered className="size-5" />
          </Link>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm món..."
              className="bg-muted focus:ring-primary h-11 w-full rounded-full pr-4 pl-10 text-sm focus:ring-2 focus:outline-none"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 pb-3">
          <button
            onClick={() => setActiveCategoryId(null)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap ${
              activeCategoryId === null ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            Tất cả
          </button>
          {menu.data.categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategoryId(c.id)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap ${
                activeCategoryId === c.id ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </header>

      {/* Items list */}
      <main className="space-y-3 p-4">
        {filteredItems.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center">Không tìm thấy món.</div>
        ) : (
          filteredItems.map((item) => (
            <MemoMenuItemCard key={item.id} item={item} onClick={(it) => setPicking(it)} />
          ))
        )}
      </main>

      {/* Floating cart button */}
      {cartCount > 0 && (
        <button
          onClick={() => router.push(`/m/${tenantSlug}/cart`)}
          className="bg-primary text-primary-foreground fixed right-4 bottom-4 left-4 z-30 mx-auto flex max-w-md items-center gap-3 rounded-full px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg transition-transform active:scale-95"
        >
          <ShoppingCart className="size-5" />
          <span className="font-semibold tabular-nums">{cartCount} món</span>
          <span className="ml-auto font-bold tabular-nums">{fmt(cartSubtotal)}</span>
          <span className="text-sm">Xem giỏ →</span>
        </button>
      )}

      <VariantPickerSheet
        item={picking}
        sessionId={sessionId}
        open={!!picking}
        onClose={() => setPicking(null)}
      />
    </div>
  );
}
