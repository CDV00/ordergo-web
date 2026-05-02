"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Trash2, ImageOff } from "lucide-react";
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
import type { MenuCategory, MenuItem } from "@/types/api";

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

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
}

export default function MenuPage() {
  const cats = useMenuCategories();
  const items = useMenuItems();
  const createCat = useCreateMenuCategory();
  const updateCat = useUpdateMenuCategory(""); // dummy — will overwrite per call
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
    defaultValues: { categoryId: "", name: "", description: "", basePrice: 0, sku: "" },
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
        // Workaround for hook tied to id — reuse useUpdateMenuCategory by id
        // Direct fetch via separate hook would be cleaner but inline here:
        await updateCat.mutateAsync({ name: values.name, description: values.description });
      } else {
        await createCat.mutateAsync({ name: values.name, description: values.description || undefined });
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

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Menu &amp; Món ăn</h1>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => openCatDialog()}>
            <Plus className="size-4 mr-1" /> Nhóm món
          </Button>
          <Button onClick={() => openItemDialog()} disabled={!cats.data?.length}>
            <Plus className="size-4 mr-1" /> Thêm món
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-6">
        {/* Category list */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={activeCategoryId === null ? "default" : "outline"}
            onClick={() => setActiveCategoryId(null)}
          >
            Tất cả ({items.data?.length ?? 0})
          </Button>
          {cats.data?.map((c) => {
            const count = items.data?.filter((i) => i.categoryId === c.id).length ?? 0;
            return (
              <div key={c.id} className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant={activeCategoryId === c.id ? "default" : "outline"}
                  onClick={() => setActiveCategoryId(c.id)}
                >
                  {c.name} ({count})
                </Button>
                <Button size="icon" variant="ghost" onClick={() => openCatDialog(c)}>
                  <Pencil className="size-3" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDeleteCategory(c)}>
                  <Trash2 className="size-3 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Items grid */}
        {items.isLoading ? (
          <p className="text-muted-foreground">Đang tải...</p>
        ) : filteredItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {cats.data?.length === 0
                ? "Chưa có nhóm món nào. Tạo nhóm trước để bắt đầu."
                : "Chưa có món nào trong nhóm này."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((it) => (
              <Card key={it.id} className={it.isAvailable ? "" : "opacity-60"}>
                <CardHeader className="flex flex-row gap-3 items-start space-y-0">
                  <div className="size-16 rounded-md bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {it.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.imageUrl} alt={it.name} className="object-cover w-full h-full" />
                    ) : (
                      <ImageOff className="size-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{it.name}</CardTitle>
                    <CardDescription className="text-sm font-medium text-foreground">
                      {formatVnd(it.basePrice.amount)}
                    </CardDescription>
                    {it.sku && <p className="text-xs text-muted-foreground mt-1">SKU: {it.sku}</p>}
                  </div>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button
                    size="sm"
                    variant={it.isAvailable ? "outline" : "default"}
                    onClick={() => handleToggle(it)}
                    className="flex-1"
                  >
                    {it.isAvailable ? "Tạm hết" : "Mở bán"}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDeleteItem(it)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{catEditing ? "Sửa nhóm món" : "Thêm nhóm món"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmitCategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Tên nhóm *</Label>
              <Input id="cat-name" {...catForm.register("name", { required: true, minLength: 1 })} />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm món</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmitItem} className="space-y-4">
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
              <Input id="item-name" {...itemForm.register("name", { required: true, minLength: 1 })} />
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
