"use client";

import { useFieldArray } from "react-hook-form";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "./field-error";
import type { ItemForm } from "./item-schema";

const NEW_OPTION = { name: "", priceModifier: 0, isAvailable: true };

/** Nhóm topping: số lượng chọn tối thiểu/tối đa + danh sách lựa chọn. */
export function ToppingGroupsCard({ form }: { form: ItemForm }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "toppingGroups",
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">Topping / tuỳ chọn</CardTitle>
          <CardDescription>vd: Đường, Đá, Thêm topping…</CardDescription>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            append({ name: "", minSelect: 0, maxSelect: 1, options: [{ ...NEW_OPTION }] })
          }
          disabled={fields.length >= 10}
        >
          <Plus className="mr-1 size-4" /> Thêm nhóm
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 && (
          <p className="text-muted-foreground text-sm">Chưa có nhóm topping.</p>
        )}
        {fields.map((f, i) => (
          <ToppingGroupRow key={f.id} form={form} index={i} onRemove={() => remove(i)} />
        ))}
      </CardContent>
    </Card>
  );
}

function ToppingGroupRow({
  form,
  index,
  onRemove,
}: {
  form: ItemForm;
  index: number;
  onRemove: () => void;
}) {
  const {
    control,
    register,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: `toppingGroups.${index}.options`,
  });
  const err = errors.toppingGroups?.[index];
  const base = `toppingGroups.${index}` as const;

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-40 flex-1 space-y-1">
          <Label className="text-xs">Tên nhóm</Label>
          <Input placeholder="vd: Mức đường" {...register(`${base}.name`)} />
          <FieldError message={err?.name?.message} />
        </div>
        <div className="w-24 space-y-1">
          <Label className="text-xs">Chọn tối thiểu</Label>
          <Input
            type="number"
            min={0}
            {...register(`${base}.minSelect`, { valueAsNumber: true })}
          />
          <FieldError message={err?.minSelect?.message} />
        </div>
        <div className="w-24 space-y-1">
          <Label className="text-xs">Chọn tối đa</Label>
          <Input
            type="number"
            min={1}
            {...register(`${base}.maxSelect`, { valueAsNumber: true })}
          />
          <FieldError message={err?.maxSelect?.message} />
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="mt-5"
          onClick={onRemove}
          aria-label="Xoá nhóm"
        >
          <Trash2 className="text-destructive size-4" />
        </Button>
      </div>

      <div className="space-y-2 pl-2">
        {fields.map((o, j) => {
          const oErr = err?.options?.[j];
          return (
            <div key={o.id} className="flex flex-wrap items-start gap-2">
              <div className="min-w-32 flex-1 space-y-1">
                <Input placeholder="Lựa chọn" {...register(`${base}.options.${j}.name`)} />
                <FieldError message={oErr?.name?.message} />
              </div>
              <div className="w-28 space-y-1">
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="+ giá"
                  {...register(`${base}.options.${j}.priceModifier`, { valueAsNumber: true })}
                />
                <FieldError message={oErr?.priceModifier?.message} />
              </div>
              <label className="flex h-10 items-center gap-1.5 text-sm">
                <input type="checkbox" {...register(`${base}.options.${j}.isAvailable`)} />
                Còn
              </label>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => remove(j)}
                aria-label="Xoá lựa chọn"
              >
                <X className="size-4" />
              </Button>
            </div>
          );
        })}
        <FieldError message={err?.options?.message ?? err?.options?.root?.message} />
        <Button type="button" size="sm" variant="ghost" onClick={() => append({ ...NEW_OPTION })}>
          <Plus className="mr-1 size-4" /> Thêm lựa chọn
        </Button>
      </div>
    </div>
  );
}
