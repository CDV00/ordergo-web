"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/animate-ui/components/radix/switch";
import { Highlight, HighlightItem } from "@/components/animate-ui/primitives/effects/highlight";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/image-upload";
import { MenuToggle } from "@/components/menu-toggle";
import { FolderPlus, ImageOff, Pencil, Plus, Store, Trash2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import {
  useCreateMenuCategory,
  useCreateMenuItem,
  useDeleteMenuCategory,
  useDeleteMenuItem,
  useMenuCategories,
  useMenuItems,
  useToggleMenuItemAvailability,
  useUpdateMenuCategory,
  useUpdateMenuItem,
} from "@/hooks/api/use-menu";
import { ApiException } from "@/lib/api-client";
import { mediaUrl } from "@/lib/media";
import type { MenuCategory, MenuItem } from "@/types/api";

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

/** Giá trị chip "Tất cả" (không trùng id nhóm). */
const ALL_KEY = "__all__";

interface CategoryForm {
  name: string;
  description: string;
}

interface ItemForm {
  categoryId: string;
  name: string;
  description: string;
  basePrice: number;
  sku: string;
  imageUrl: string | null;
}

export default function MenuPage() {
  const cats = useMenuCategories();
  const items = useMenuItems();
  const createCat = useCreateMenuCategory();
  const updateCat = useUpdateMenuCategory();
  const deleteCat = useDeleteMenuCategory();
  const createItem = useCreateMenuItem();
  const deleteItem = useDeleteMenuItem();
  const toggleAvail = useToggleMenuItemAvailability();

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [catEditing, setCatEditing] = useState<MenuCategory | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);

  const catForm = useForm<CategoryForm>({ defaultValues: { name: "", description: "" } });
  const itemForm = useForm<ItemForm>({
    defaultValues: {
      categoryId: "",
      name: "",
      description: "",
      basePrice: 0,
      sku: "",
      imageUrl: null,
    },
  });

  const filteredItems = useMemo(() => {
    if (!items.data) return [];
    if (!activeCategoryId) return items.data;
    return items.data.filter((i) => i.categoryId === activeCategoryId);
  }, [items.data, activeCategoryId]);

  const openCatDialog = (cat?: MenuCategory) => {
    if (cat) {
      setCatEditing(cat);
      catForm.reset({ name: cat.name, description: cat.description ?? "" });
    } else {
      setCatEditing(null);
      catForm.reset({ name: "", description: "" });
    }
    setCatDialogOpen(true);
  };

  const onSubmitCategory = catForm.handleSubmit(async (values) => {
    try {
      if (catEditing) {
        await updateCat.mutateAsync({
          id: catEditing.id,
          name: values.name,
          description: values.description,
        });
      } else {
        await createCat.mutateAsync({
          name: values.name,
          description: values.description || undefined,
        });
      }
      toast.success(catEditing ? "Đã cập nhật nhóm món" : "Đã tạo nhóm món");
      setCatDialogOpen(false);
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Có lỗi xảy ra");
    }
  });

  const openItemDialog = (preselectCategory?: string) => {
    itemForm.reset({
      categoryId: preselectCategory ?? activeCategoryId ?? cats.data?.[0]?.id ?? "",
      name: "",
      description: "",
      basePrice: 0,
      sku: "",
      imageUrl: null,
    });
    setItemDialogOpen(true);
  };

  const onSubmitItem = itemForm.handleSubmit(async (values) => {
    try {
      await createItem.mutateAsync({
        categoryId: values.categoryId,
        name: values.name,
        description: values.description || undefined,
        sku: values.sku || undefined,
        basePrice: { amount: values.basePrice, currency: "VND" },
        imageUrl: values.imageUrl ?? undefined,
      });
      toast.success("Đã thêm món");
      setItemDialogOpen(false);
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Có lỗi xảy ra");
    }
  });

  const handleDeleteItem = async (item: MenuItem) => {
    if (!confirm(`Xoá món "${item.name}"?`)) return;
    try {
      await deleteItem.mutateAsync(item.id);
      toast.success("Đã xoá");
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Lỗi");
    }
  };

  const handleDeleteCategory = async (cat: MenuCategory) => {
    if (!confirm(`Xoá nhóm "${cat.name}"? Các món trong nhóm vẫn giữ nguyên.`)) return;
    try {
      await deleteCat.mutateAsync(cat.id);
      toast.success("Đã xoá nhóm");
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Lỗi");
    }
  };

  const handleToggle = async (item: MenuItem) => {
    try {
      await toggleAvail.mutateAsync({ id: item.id, isAvailable: !item.isAvailable });
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Lỗi");
    }
  };

  const activeCategory = cats.data?.find((c) => c.id === activeCategoryId) ?? null;
  const chips = [
    { id: ALL_KEY, name: "Tất cả", count: items.data?.length ?? 0 },
    ...(cats.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      count: items.data?.filter((i) => i.categoryId === c.id).length ?? 0,
    })),
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <FadeIn className="flex items-start gap-2">
        <MenuToggle className="mt-1" />
        <PageHeader
          className="min-w-0 flex-1"
          icon={Store}
          title="Menu & Món ăn"
          description={
            items.data
              ? `${items.data.length} món · ${cats.data?.length ?? 0} nhóm món`
              : "Quản lý nhóm món, giá và trạng thái bán"
          }
          actions={
            <>
              <Button variant="outline" onClick={() => openCatDialog()}>
                <FolderPlus className="size-4" /> Nhóm món
              </Button>
              <Button onClick={() => openItemDialog()} disabled={!cats.data?.length}>
                <Plus className="size-4" /> Thêm món
              </Button>
            </>
          }
        />
      </FadeIn>

      {/* Nhóm món: chip có nền trượt (Highlight) */}
      <FadeIn delay={0.04} className="space-y-3">
        <div className="-mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          <Highlight
            value={activeCategoryId ?? ALL_KEY}
            click={false}
            controlledItems
            className="bg-primary inset-0 rounded-full shadow-xs"
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            <div
              role="group"
              aria-label="Lọc theo nhóm món"
              className="flex w-max gap-1.5 md:w-auto md:flex-wrap"
            >
              {chips.map((c) => {
                const active = (activeCategoryId ?? ALL_KEY) === c.id;
                return (
                  <HighlightItem key={c.id} value={c.id}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => setActiveCategoryId(c.id === ALL_KEY ? null : c.id)}
                      className={cn(
                        "flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors",
                        active
                          ? "text-primary-foreground border-transparent"
                          : "bg-card text-muted-foreground hover:text-foreground hover:border-primary/40",
                      )}
                    >
                      {c.name}
                      <span
                        className={cn(
                          "tabular rounded-full px-1.5 text-xs",
                          active ? "bg-primary-foreground/20" : "bg-muted",
                        )}
                      >
                        {c.count}
                      </span>
                    </button>
                  </HighlightItem>
                );
              })}
            </div>
          </Highlight>
        </div>

        {activeCategory && (
          <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2">
            <div className="min-w-0 text-sm">
              <span className="text-muted-foreground">Nhóm: </span>
              <span className="font-semibold">{activeCategory.name}</span>
              {activeCategory.description && (
                <span className="text-muted-foreground"> · {activeCategory.description}</span>
              )}
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => openCatDialog(activeCategory)}>
                <Pencil className="size-3.5" /> Sửa nhóm
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDeleteCategory(activeCategory)}
              >
                <Trash2 className="size-3.5" /> Xoá nhóm
              </Button>
            </div>
          </div>
        )}
      </FadeIn>

      {/* Lưới món */}
      {items.isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title={cats.data?.length === 0 ? "Chưa có nhóm món nào" : "Chưa có món nào"}
          description={
            cats.data?.length === 0
              ? "Tạo nhóm trước để bắt đầu."
              : "Chưa có món nào trong nhóm này."
          }
          className="bg-muted/30"
          action={
            cats.data?.length === 0 ? (
              <Button onClick={() => openCatDialog()}>
                <FolderPlus className="size-4" /> Tạo nhóm món
              </Button>
            ) : (
              <Button onClick={() => openItemDialog()}>
                <Plus className="size-4" /> Thêm món
              </Button>
            )
          }
        />
      ) : (
        <Stagger
          key={activeCategoryId ?? ALL_KEY}
          stagger={0.025}
          className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4"
        >
          {filteredItems.map((it) => {
            const img = mediaUrl(it.imageUrl);
            return (
              <StaggerItem key={it.id}>
                <Card className="group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
                  <Link
                    href={`/menu/${it.id}`}
                    className="bg-muted relative block aspect-[4/3] overflow-hidden"
                    tabIndex={-1}
                    aria-hidden
                  >
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt=""
                        className={cn(
                          "h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]",
                          !it.isAvailable && "grayscale",
                        )}
                      />
                    ) : (
                      <div className="text-muted-foreground/60 flex h-full items-center justify-center">
                        <ImageOff className="size-8" />
                      </div>
                    )}
                    {!it.isAvailable && (
                      <Badge variant="warning" className="absolute top-2 left-2 shadow-xs">
                        Tạm hết
                      </Badge>
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold sm:text-base">
                        <Link
                          href={`/menu/${it.id}`}
                          className="hover:text-primary transition-colors"
                        >
                          {it.name}
                        </Link>
                      </h3>
                      <p className="text-primary tabular mt-0.5 text-sm font-bold">
                        {formatVnd(it.basePrice.amount)}
                      </p>
                      {it.sku && (
                        <p className="text-muted-foreground mt-0.5 truncate text-xs">
                          SKU: {it.sku}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t pt-3">
                      <label className="flex min-w-0 cursor-pointer items-center gap-2">
                        <Switch
                          checked={it.isAvailable}
                          onCheckedChange={() => handleToggle(it)}
                          disabled={toggleAvail.isPending && toggleAvail.variables?.id === it.id}
                          aria-label={it.isAvailable ? `Tạm hết ${it.name}` : `Mở bán ${it.name}`}
                        />
                        <span
                          className={cn(
                            "truncate text-xs font-medium",
                            it.isAvailable ? "text-success" : "text-muted-foreground",
                          )}
                        >
                          {it.isAvailable ? "Đang bán" : "Tạm hết"}
                        </span>
                      </label>
                      <div className="flex shrink-0">
                        <Button
                          asChild
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          aria-label="Sửa món"
                        >
                          <Link href={`/menu/${it.id}`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive size-8"
                          aria-label="Xoá món"
                          onClick={() => handleDeleteItem(it)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{catEditing ? "Sửa nhóm món" : "Thêm nhóm món"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmitCategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Tên nhóm *</Label>
              <Input
                id="cat-name"
                {...catForm.register("name", { required: true, minLength: 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Mô tả</Label>
              <Input id="cat-desc" {...catForm.register("description")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCatDialogOpen(false)}>
                Huỷ
              </Button>
              <Button type="submit" disabled={createCat.isPending || updateCat.isPending}>
                {catEditing ? "Cập nhật" : "Tạo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm món</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmitItem} className="space-y-4">
            <div className="space-y-2">
              <Label>Ảnh món</Label>
              <ImageUpload
                value={itemForm.watch("imageUrl")}
                onChange={(url) => itemForm.setValue("imageUrl", url)}
                aspect="square"
                label="Tải ảnh món"
              />
            </div>
            <div className="space-y-2">
              <Label>Nhóm món *</Label>
              <Select
                value={itemForm.watch("categoryId")}
                onValueChange={(v) => itemForm.setValue("categoryId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhóm" />
                </SelectTrigger>
                <SelectContent>
                  {cats.data?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-name">Tên món *</Label>
              <Input
                id="item-name"
                {...itemForm.register("name", { required: true, minLength: 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-price">Giá (VND) *</Label>
              <Input
                id="item-price"
                type="number"
                min="0"
                {...itemForm.register("basePrice", { required: true, valueAsNumber: true, min: 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-sku">SKU</Label>
              <Input id="item-sku" {...itemForm.register("sku")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-desc">Mô tả</Label>
              <Input id="item-desc" {...itemForm.register("description")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setItemDialogOpen(false)}>
                Huỷ
              </Button>
              <Button type="submit" disabled={createItem.isPending}>
                Thêm món
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
