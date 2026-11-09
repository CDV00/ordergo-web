"use client";

import { useFieldArray, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FieldError } from "./field-error";
import type { ItemForm } from "./item-schema";

/** Size / biến thể: tên + giá cộng thêm, đúng 1 size mặc định. */
export function VariantsCard({ form }: { form: ItemForm }) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "variants" });
  const variants = useWatch({ control, name: "variants" }) ?? [];

  const setDefault = (index: number) => {
    variants.forEach((_, i) =>
      setValue(`variants.${i}.isDefault`, i === index, { shouldDirty: true }),
    );
  };

  const removeAt = (index: number) => {
    const wasDefault = variants[index]?.isDefault;
    remove(index);
    // Giữ 1 size mặc định sau khi xoá
    if (wasDefault && variants.length > 1) {
      setValue(`variants.0.isDefault`, true, { shouldDirty: true });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">Size / biến thể</CardTitle>
          <CardDescription>Giá cộng thêm vào giá bán. Chọn 1 size mặc định.</CardDescription>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => append({ name: "", priceModifier: 0, isDefault: fields.length === 0 })}
          disabled={fields.length >= 20}
        >
          <Plus className="mr-1 size-4" /> Thêm size
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.length === 0 && (
          <p className="text-muted-foreground text-sm">Món này chỉ có 1 size.</p>
        )}
        {fields.map((f, i) => {
          const err = errors.variants?.[i];
          return (
            <div key={f.id} className="flex flex-wrap items-start gap-2">
              <div className="min-w-32 flex-1 space-y-1">
                <Input placeholder="Tên (vd: Size L)" {...register(`variants.${i}.name`)} />
                <FieldError message={err?.name?.message} />
              </div>
              <div className="w-32 space-y-1">
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="+ giá"
                  {...register(`variants.${i}.priceModifier`, { valueAsNumber: true })}
                />
                <FieldError message={err?.priceModifier?.message} />
              </div>
              <label className="flex h-10 items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  name="default-variant"
                  checked={!!variants[i]?.isDefault}
                  onChange={() => setDefault(i)}
                />
                Mặc định
              </label>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => removeAt(i)}
                aria-label="Xoá size"
              >
                <Trash2 className="text-destructive size-4" />
              </Button>
            </div>
          );
        })}
        <FieldError message={errors.variants?.message ?? errors.variants?.root?.message} />
      </CardContent>
    </Card>
  );
}
