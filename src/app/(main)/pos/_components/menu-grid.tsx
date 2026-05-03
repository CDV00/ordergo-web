"use client";

import { memo, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMenuCategories, useMenuItems } from "@/hooks/api/use-menu";
import type { MenuItem } from "@/types/api";

interface Props {
  onPickItem: (item: MenuItem) => void;
}

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function MenuItemCard({ item, onClick }: { item: MenuItem; onClick: (item: MenuItem) => void }) {
  const disabled = !item.isAvailable;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(item)}
      className={`group bg-card relative flex flex-col overflow-hidden rounded-xl border-2 text-left transition-all ${disabled ? "cursor-not-allowed opacity-50" : "hover:border-primary hover:shadow-md active:scale-[0.98]"} focus:ring-primary focus:ring-2 focus:outline-none`}
    >
      <div className="bg-muted flex aspect-[4/3] items-center justify-center overflow-hidden">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <ImageOff className="text-muted-foreground size-8" />
        )}
        {disabled && (
          <span className="absolute top-2 right-2 rounded bg-rose-600 px-2 py-1 text-xs font-bold text-white">
            HẾT
          </span>
        )}
      </div>
      <div className="space-y-1 p-3">
        <div className="line-clamp-2 min-h-[2.5rem] text-sm leading-tight font-medium">
          {item.name}
        </div>
        <div className="text-primary text-base font-bold">{formatVnd(item.basePrice.amount)}</div>
      </div>
    </button>
  );
}

const MemoMenuItemCard = memo(MenuItemCard);

function MenuGridInner({ onPickItem }: Props) {
  const cats = useMenuCategories();
  const items = useMenuItems();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    if (!items.data) return [];
    let list = items.data;
    if (activeCategoryId) list = list.filter((i) => i.categoryId === activeCategoryId);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.tags ?? []).some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [items.data, activeCategoryId, search]);

  if (cats.isLoading || items.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  if (cats.data?.length === 0 || items.data?.length === 0) {
    return (
      <div className="text-muted-foreground p-12 text-center">
        Chưa có món nào. Vào <strong>Menu &amp; Món ăn</strong> để thêm.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Search */}
      <div className="shrink-0 border-b p-3">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Tìm món..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
      </div>

      {/* Categories tab */}
      <div className="flex shrink-0 gap-2 overflow-x-auto border-b p-3">
        <button
          onClick={() => setActiveCategoryId(null)}
          className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${activeCategoryId === null ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
        >
          Tất cả ({items.data?.length ?? 0})
        </button>
        {cats.data?.map((c) => {
          const count = items.data?.filter((i) => i.categoryId === c.id).length ?? 0;
          return (
            <button
              key={c.id}
              onClick={() => setActiveCategoryId(c.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${activeCategoryId === c.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
            >
              {c.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Items grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredItems.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center">Không tìm thấy món.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredItems.map((it) => (
              <MemoMenuItemCard key={it.id} item={it} onClick={onPickItem} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const MenuGrid = memo(MenuGridInner);
