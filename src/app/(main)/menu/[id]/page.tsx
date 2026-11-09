"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save, SearchX } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/image-upload";
import { MenuToggle } from "@/components/menu-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useMenuCategories, useMenuItem, useUpdateMenuItem } from "@/hooks/api/use-menu";
import type { ApiException } from "@/lib/api-client";
import { ItemInfoCard } from "./_components/item-info-card";
import {
  EMPTY_ITEM_FORM,
  itemSchema,
  toFormValues,
  toUpdateInput,
  type ItemFormInput,
  type ItemFormOutput,
} from "./_components/item-schema";
import { ItemStatusCard } from "./_components/item-status-card";
import { ToppingGroupsCard } from "./_components/topping-groups-card";
import { VariantsCard } from "./_components/variants-card";

export default function MenuItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const item = useMenuItem(id);
  const cats = useMenuCategories();
  const update = useUpdateMenuItem(id);

  const form = useForm<ItemFormInput, unknown, ItemFormOutput>({
    resolver: zodResolver(itemSchema),
    defaultValues: EMPTY_ITEM_FORM,
  });
  const { isDirty } = form.formState;

  // Nạp dữ liệu từ server — không ghi đè khi người dùng đang sửa dở
  useEffect(() => {
    if (item.data && !isDirty) form.reset(toFormValues(item.data));
  }, [item.data, isDirty, form]);

  const onSubmit = form.handleSubmit(
    async (values) => {
      try {
        const saved = await update.mutateAsync(toUpdateInput(values));
        form.reset(toFormValues(saved));
        toast.success("Đã lưu món");
      } catch (err) {
        toast.error((err as ApiException).error?.message ?? "Có lỗi xảy ra");
      }
    },
    () => toast.error("Vui lòng kiểm tra lại các ô báo lỗi"),
  );

  const header = (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <MenuToggle />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Button asChild size="icon" variant="ghost" aria-label="Quay lại menu">
        <Link href="/menu">
          <ArrowLeft className="size-4" />
        </Link>
      </Button>
      <h1 className="truncate text-lg font-semibold">{item.data?.name ?? "Chi tiết món"}</h1>
      {item.data && (
        <div className="ml-auto flex items-center gap-2">
          {isDirty && (
            <span className="text-muted-foreground hidden text-sm sm:inline">Chưa lưu</span>
          )}
          <Button type="submit" form="menu-item-form" disabled={update.isPending || !isDirty}>
            {update.isPending ? (
              <Loader2 className="mr-1 size-4 animate-spin" />
            ) : (
              <Save className="mr-1 size-4" />
            )}
            Lưu
          </Button>
        </div>
      )}
    </header>
  );

  if (item.isLoading) {
    return (
      <div className="flex flex-col">
        {header}
        <main className="grid gap-6 p-4 md:p-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!item.data) {
    const status = (item.error as ApiException | null)?.status;
    return (
      <div className="flex flex-col">
        {header}
        <main className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <SearchX className="text-muted-foreground size-12" />
          <h2 className="text-xl font-semibold">
            {status && status !== 404 ? "Không tải được món" : "Không tìm thấy món"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {status && status !== 404
              ? ((item.error as ApiException).error?.message ?? "Có lỗi xảy ra")
              : "Món này không tồn tại hoặc đã bị xoá."}
          </p>
          <Button asChild>
            <Link href="/menu">Quay lại menu</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {header}
      <main className="grid gap-6 p-4 md:p-6 lg:grid-cols-3">
        <form
          id="menu-item-form"
          onSubmit={onSubmit}
          noValidate
          className="space-y-6 lg:col-span-2"
        >
          <ItemInfoCard form={form} categories={cats.data ?? []} />
          <VariantsCard form={form} />
          <ToppingGroupsCard form={form} />
        </form>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ảnh món</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={form.watch("imageUrl")}
                onChange={(url) => form.setValue("imageUrl", url, { shouldDirty: true })}
                aspect="square"
                label="Tải ảnh món"
              />
            </CardContent>
          </Card>
          <ItemStatusCard item={item.data} />
          <Button
            type="submit"
            form="menu-item-form"
            className="w-full"
            disabled={update.isPending || !isDirty}
          >
            {update.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </main>
    </div>
  );
}
