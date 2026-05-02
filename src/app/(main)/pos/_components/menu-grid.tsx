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

function MenuItemCard({
  item,
  onClick,
}: {
  item: MenuItem;
  onClick: (item: MenuItem) => void;
}) {
  const disabled = !item.isAvailable;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(item)}
      className={`group relative flex flex-col rounded-xl border-2 bg-card text-left overflow-hidden transition-all
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:shadow-md active:scale-[0.98]"}
        focus:outline-none focus:ring-2 focus:ring-primary`}
    >
      <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            className="object-cover w-full h-full transition-transform group-hover:scale-105"
          />
        ) : (
          <ImageOff className="size-8 text-muted-foreground" />
        )}
        {disabled && (
          <span className="absolute top-2 right-2 bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded">
            HẾT
          </span>
        )}
      </div>
      <div className="p-3 space-y-1">
        <div className="font-medium text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
          {item.name}
        </div>
        <div className="text-base font-bold text-primary">
          {formatVnd(item.basePrice.amount)}
        </div>
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
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  if (cats.data?.length === 0 || items.data?.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        Chưa có món nào. Vào <strong>Menu &amp; Món ăn</strong> để thêm.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search */}
      <div className="p-3 border-b shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm món..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      </div>

      {/* Categories tab */}
      <div className="flex gap-2 p-3 border-b overflow-x-auto shrink-0">
        <button
          onClick={() => setActiveCategoryId(null)}
          className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${activeCategoryId === null ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
        >
          Tất cả ({items.data?.length ?? 0})
        </button>
        {cats.data?.map((c) => {
          const count = items.data?.filter((i) => i.categoryId === c.id).length ?? 0;
          return (
            <button
              key={c.id}
              onClick={() => setActiveCategoryId(c.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${activeCategoryId === c.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
            >
              {c.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Items grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredItems.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">Không tìm thấy món.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
