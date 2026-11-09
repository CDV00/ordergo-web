"use client";

import { Controller } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MenuCategory } from "@/types/api";
import { FieldError, textareaClass } from "./field-error";
import type { ItemForm } from "./item-schema";

interface Props {
  form: ItemForm;
  categories: MenuCategory[];
}

/** Thông tin cơ bản của món: tên, nhóm, giá, mô tả, SKU, tag, thứ tự. */
export function ItemInfoCard({ form, categories }: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Thông tin món</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Tên món *</Label>
          <Input id="name" {...register("name")} />
          <FieldError message={errors.name?.message} />
        </div>

        <div className="space-y-2">
          <Label>Nhóm món *</Label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              // Radix Select gọi onValueChange("") khi value chưa có trong options (danh sách
              // nhóm chưa tải xong) → bỏ qua giá trị rỗng, remount khi danh sách đổi.
              <Select
                key={categories.length}
                value={field.value}
                onValueChange={(v) => v && field.onChange(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhóm" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError message={errors.categoryId?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="basePrice">Giá bán (VND) *</Label>
          <Input
            id="basePrice"
            type="number"
            min={0}
            step={1000}
            {...register("basePrice", { valueAsNumber: true })}
          />
          <FieldError message={errors.basePrice?.message} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Mô tả</Label>
          <textarea
            id="description"
            rows={3}
            className={textareaClass}
            {...register("description")}
          />
          <FieldError message={errors.description?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" {...register("sku")} />
          <FieldError message={errors.sku?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayOrder">Thứ tự hiển thị</Label>
          <Input
            id="displayOrder"
            type="number"
            min={0}
            {...register("displayOrder", { valueAsNumber: true })}
          />
          <FieldError message={errors.displayOrder?.message} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="tags">Tag</Label>
          <Input id="tags" placeholder="vd: bán chạy, mới, cay" {...register("tags")} />
          <p className="text-muted-foreground text-xs">Cách nhau bằng dấu phẩy.</p>
        </div>
      </CardContent>
    </Card>
  );
}
