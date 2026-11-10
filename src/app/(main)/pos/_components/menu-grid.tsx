"use client";

import { mediaUrl } from "@/lib/media";
import { memo, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Coffee, Search, SearchX, UtensilsCrossed } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { Pressable, Stagger, StaggerItem } from "@/components/motion";
import { Highlight, HighlightItem } from "@/components/animate-ui/primitives/effects/highlight";
import { useMenuCategories, useMenuItems } from "@/hooks/api/use-menu";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/types/api";

interface Props {
  onPickItem: (item: MenuItem) => void;
}

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

const ALL = "__all__";

function MenuItemCard({ item, onClick }: { item: MenuItem; onClick: (item: MenuItem) => void }) {
  const disabled = !item.isAvailable;
  return (
    <Pressable
      disabled={disabled}
      onClick={() => onClick(item)}
      {...(disabled ? { whileHover: undefined, whileTap: undefined } : {})}
      className={cn(
        "group bg-card relative flex h-full w-full flex-col overflow-hidden rounded-2xl border text-left shadow-xs transition-[box-shadow,border-color]",
        "focus-visible:ring-ring/40 focus-visible:ring-[3px] focus-visible:outline-none",
        disabled ? "cursor-not-allowed" : "hover:border-primary/40 hover:shadow-md",
      )}
    >
      {/* Ảnh đứng đầu (alt = tên món) — tên nút bắt đầu bằng tên món */}
      <div className="bg-muted relative flex aspect-[4/3] items-center justify-center overflow-hidden">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(item.imageUrl) ?? undefined}
            alt={item.name}
            loading="lazy"
            className={cn(
              "h-full w-full object-cover transition-transform duration-300",
              disabled ? "grayscale" : "group-hover:scale-105",
            )}
          />
        ) : (
          <Coffee className="text-muted-foreground/50 size-8" />
        )}
        {disabled && (
          <div className="bg-background/55 absolute inset-0 flex items-center justify-center backdrop-blur-[1px]">
            <span className="bg-foreground/85 text-background rounded-full px-3 py-1 text-xs font-bold tracking-wide">
              HẾT
            </span>
          </div>
        )}
      </div>
      <div className={cn("flex flex-1 flex-col gap-1 p-3", disabled && "opacity-60")}>
        <div className="line-clamp-2 min-h-[2.5rem] text-sm leading-tight font-semibold">
          {item.name}
        </div>
        <div
          className={cn(
            "mt-auto text-base font-bold tabular-nums",
            disabled ? "text-muted-foreground line-through" : "text-primary",
          )}
        >
          {formatVnd(item.basePrice.amount)}
        </div>
      </div>
    </Pressable>
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
      <div className="space-y-3 p-4">
        <Skeleton className="h-11 w-full rounded-xl" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (cats.data?.length === 0 || items.data?.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={UtensilsCrossed}
          title="Chưa có món nào"
          description={
            <>
              Vào <strong>Menu &amp; Món ăn</strong> để thêm.
            </>
          }
        />
      </div>
    );
  }

  const chips = [
    { id: ALL, name: "Tất cả", count: items.data?.length ?? 0 },
    ...(cats.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      count: items.data?.filter((i) => i.categoryId === c.id).length ?? 0,
    })),
  ];
  const activeChip = activeCategoryId ?? ALL;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Tìm món + danh mục */}
      <div className="bg-muted/40 shrink-0 space-y-3 border-b px-3 pt-3 pb-2 md:px-4">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
          <Input
            placeholder="Tìm món..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-card h-11 rounded-xl pl-10"
          />
        </div>

        {/* Danh mục: nền "viên thuốc" trượt theo mục đang chọn */}
        <div className="-mx-3 overflow-x-auto px-3 pb-1 md:-mx-4 md:px-4 [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-1.5">
            <Highlight
              controlledItems
              click={false}
              value={activeChip}
              className="bg-primary inset-0 rounded-full shadow-sm"
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
            >
              {chips.map((c) => {
                const active = c.id === activeChip;
                return (
                  <HighlightItem key={c.id} value={c.id} className="rounded-full">
                    <button
                      type="button"
                      onClick={() => setActiveCategoryId(c.id === ALL ? null : c.id)}
                      aria-pressed={active}
                      className={cn(
                        "flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors",
                        active
                          ? "text-primary-foreground border-transparent"
                          : "bg-card text-foreground/80 hover:bg-muted shadow-xs",
                      )}
                    >
                      {c.name}
                      <span
                        className={cn(
                          "text-xs tabular-nums",
                          active ? "text-primary-foreground/80" : "text-muted-foreground",
                        )}
                      >
                        ({c.count})
                      </span>
                    </button>
                  </HighlightItem>
                );
              })}
            </Highlight>
          </div>
        </div>
      </div>

      {/* Lưới món */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4">
        {filteredItems.length === 0 ? (
          <EmptyState icon={SearchX} title="Không tìm thấy món." className="mt-4" />
        ) : (
          <Stagger
            key={activeCategoryId ?? ALL}
            stagger={0.015}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            {filteredItems.map((it) => (
              <StaggerItem key={it.id}>
                <MemoMenuItemCard item={it} onClick={onPickItem} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </div>
  );
}

export const MenuGrid = memo(MenuGridInner);
