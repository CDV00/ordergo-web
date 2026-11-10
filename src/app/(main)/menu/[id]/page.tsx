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
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { FadeIn } from "@/components/motion";
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
    <FadeIn className="flex items-start gap-2">
      <MenuToggle className="mt-1" />
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            asChild
            size="icon"
            variant="outline"
            className="bg-card shrink-0 rounded-xl"
            aria-label="Quay lại menu"
          >
            <Link href="/menu">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-medium">Menu &amp; Món ăn</p>
            <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
              {item.data?.name ?? "Chi tiết món"}
            </h1>
          </div>
        </div>
        {item.data && (
          <div className="flex items-center gap-2">
            {isDirty && (
              <Badge variant="warning" className="hidden sm:inline-flex">
                Chưa lưu
              </Badge>
            )}
            <Button type="submit" form="menu-item-form" disabled={update.isPending || !isDirty}>
              {update.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Lưu
            </Button>
          </div>
        )}
      </div>
    </FadeIn>
  );

  if (item.isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
        {header}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-80 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!item.data) {
    const status = (item.error as ApiException | null)?.status;
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
        {header}
        <EmptyState
          icon={SearchX}
          className="bg-muted/30"
          title={status && status !== 404 ? "Không tải được món" : "Không tìm thấy món"}
          description={
            status && status !== 404
              ? ((item.error as ApiException).error?.message ?? "Có lỗi xảy ra")
              : "Món này không tồn tại hoặc đã bị xoá."
          }
          action={
            <Button asChild>
              <Link href="/menu">Quay lại menu</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      {header}
      <div className="grid gap-6 lg:grid-cols-3">
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
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
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
      </div>
    </div>
  );
}
