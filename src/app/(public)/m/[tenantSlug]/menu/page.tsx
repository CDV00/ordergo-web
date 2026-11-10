"use client";

import { mediaUrl } from "@/lib/media";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronRight,
  ImageOff,
  ListOrdered,
  Loader2,
  Plus,
  Search,
  SearchX,
  ShoppingBag,
  Store,
} from "lucide-react";
import { usePublicMenu, usePublicSession } from "@/hooks/api/use-public";
import {
  selectPubCartCount,
  selectPubCartSubtotal,
  usePublicCartStore,
} from "@/lib/public-cart-store";
import { Highlight, HighlightItem } from "@/components/animate-ui/primitives/effects/highlight";
import { AnimatedNumber } from "@/components/animated-number";
import { cn } from "@/lib/utils";
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
      className={cn(
        "bg-card group flex w-full gap-3 rounded-2xl border p-2.5 text-left shadow-xs transition-[transform,box-shadow] active:scale-[0.98]",
        disabled ? "cursor-not-allowed opacity-55" : "hover:shadow-md",
      )}
    >
      {/* Nội dung đọc theo thứ tự: tên món đứng đầu (e2e tìm nút theo tên món) */}
      <div className="bg-muted relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(item.imageUrl) ?? undefined}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <ImageOff className="text-muted-foreground size-6" />
        )}
        {disabled && (
          <span className="bg-foreground/60 text-background absolute inset-0 flex items-center justify-center text-xs font-semibold">
            Hết món
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <div className="line-clamp-2 leading-snug font-semibold">{item.name}</div>
        {item.description && (
          <div className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed">
            {item.description}
          </div>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          <div className="text-primary tabular text-base font-bold">
            {fmt(item.basePrice.amount)}
          </div>
          {!disabled && (
            <span
              aria-hidden
              className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full shadow-sm transition-transform group-active:scale-90"
            >
              <Plus className="size-4" />
            </span>
          )}
        </div>
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
  const chipBarRef = useRef<HTMLDivElement>(null);

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

  // Chip đang chọn luôn nằm trong tầm nhìn khi thanh danh mục cuộn ngang
  useEffect(() => {
    const el = chipBarRef.current?.querySelector<HTMLElement>("[aria-selected='true']");
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeCategoryId]);

  if (!sessionId || menu.isLoading) {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-3">
        <Loader2 className="text-primary size-8 animate-spin" />
        <p className="text-muted-foreground text-sm">Đang mở thực đơn…</p>
      </div>
    );
  }

  if (menu.error || !menu.data) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="bg-destructive/10 text-destructive flex size-14 items-center justify-center rounded-full">
          <SearchX className="size-7" />
        </div>
        <p className="text-destructive font-medium">Không tải được menu. Thử quét lại QR.</p>
      </div>
    );
  }

  const categories = [{ id: "__all", name: "Tất cả" }, ...menu.data.categories];

  return (
    <div className="mx-auto min-h-svh max-w-2xl pb-28">
      {/* Header sticky */}
      <header className="bg-background/90 sticky top-0 z-20 border-b backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <div className="bg-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-xl shadow-sm">
            <Store className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-bold">{menu.data.venue.name}</div>
            <div className="text-muted-foreground text-xs">
              Bàn{" "}
              <strong className="text-foreground">{tableName || session.data?.tableName}</strong>
              {session.data && session.data.orderCount > 0 && (
                <> · {session.data.orderCount} đơn đang chạy</>
              )}
            </div>
          </div>
          <Link
            href={`/m/${tenantSlug}/orders`}
            className="bg-card relative flex size-11 items-center justify-center rounded-xl border shadow-xs"
            aria-label="Đơn của tôi"
          >
            <ListOrdered className="size-5" />
            {session.data && session.data.orderCount > 0 && (
              <span className="bg-primary text-primary-foreground tabular absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full text-[10px] font-bold">
                {session.data.orderCount}
              </span>
            )}
          </Link>
        </div>

        {/* Search */}
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm món..."
              className="bg-muted focus:bg-card focus:ring-primary/40 h-11 w-full rounded-full pr-4 pl-10 text-sm transition-colors focus:ring-2 focus:outline-none"
            />
          </div>
        </div>

        {/* Category chips — nền trượt theo danh mục đang chọn */}
        <Highlight
          value={activeCategoryId ?? "__all"}
          controlledItems
          className="bg-primary inset-0 rounded-full shadow-sm"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        >
          <div
            ref={chipBarRef}
            role="tablist"
            aria-label="Danh mục"
            className="scrollbar-hide flex gap-1.5 overflow-x-auto px-4 pb-3"
          >
            {categories.map((c) => {
              const value = c.id === "__all" ? null : c.id;
              const active = activeCategoryId === value;
              return (
                <HighlightItem key={c.id} value={c.id} className="shrink-0">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveCategoryId(value)}
                    className={cn(
                      "h-10 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors",
                      active
                        ? "text-primary-foreground"
                        : "bg-muted text-foreground/80 hover:text-foreground",
                    )}
                  >
                    {c.name}
                  </button>
                </HighlightItem>
              );
            })}
          </div>
        </Highlight>
      </header>

      {/* Items list */}
      <main className="p-4">
        {filteredItems.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-3 py-16 text-center">
            <div className="bg-muted flex size-14 items-center justify-center rounded-full">
              <SearchX className="size-6" />
            </div>
            Không tìm thấy món.
          </div>
        ) : (
          <motion.div
            key={`${activeCategoryId ?? "all"}|${search.trim()}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid gap-3 sm:grid-cols-2"
          >
            {filteredItems.map((item) => (
              <MemoMenuItemCard key={item.id} item={item} onClick={(it) => setPicking(it)} />
            ))}
          </motion.div>
        )}
      </main>

      {/* Floating cart bar */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 96, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <button
              onClick={() => router.push(`/m/${tenantSlug}/cart`)}
              className="bg-primary text-primary-foreground shadow-primary/30 mx-auto flex h-16 w-full max-w-md items-center gap-3 rounded-2xl pr-4 pl-3 shadow-lg transition-transform active:scale-[0.97]"
            >
              <span className="relative flex size-10 items-center justify-center rounded-xl bg-white/15">
                <ShoppingBag className="size-5" />
                <motion.span
                  key={cartCount}
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 18 }}
                  className="bg-background text-primary tabular absolute -top-1.5 -right-1.5 flex min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold"
                >
                  {cartCount}
                </motion.span>
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-xs opacity-80">{cartCount} món</span>
                <AnimatedNumber value={cartSubtotal} format="vnd" className="text-lg font-bold" />
              </span>
              <span className="ml-auto flex items-center gap-0.5 text-sm font-semibold">
                Xem giỏ
                <ChevronRight className="size-4" />
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <VariantPickerSheet
        item={picking}
        sessionId={sessionId}
        open={!!picking}
        onClose={() => setPicking(null)}
      />
    </div>
  );
}
