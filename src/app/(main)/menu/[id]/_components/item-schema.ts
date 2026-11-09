import { z } from "zod";
import type { UseFormReturn } from "react-hook-form";
import type { MenuItemInput } from "@/hooks/api/use-menu";
import type { MenuItem } from "@/types/api";

const money = z
  .number({ error: "Nhập số hợp lệ" })
  .int("Giá phải là số nguyên")
  .min(0, "Giá không được âm");

const name50 = z.string().trim().min(1, "Nhập tên").max(50, "Tối đa 50 ký tự");

/** `refId` = id phía server (không dùng `id` vì useFieldArray chiếm key `id`). */
const variantSchema = z.object({
  refId: z.string().optional(),
  name: name50,
  priceModifier: money,
  isDefault: z.boolean(),
});

const optionSchema = z.object({
  refId: z.string().optional(),
  name: name50,
  priceModifier: money,
  isAvailable: z.boolean(),
});

const toppingGroupSchema = z
  .object({
    refId: z.string().optional(),
    name: name50,
    minSelect: z.number({ error: "Nhập số" }).int().min(0, "Tối thiểu 0"),
    maxSelect: z.number({ error: "Nhập số" }).int().min(1, "Tối thiểu 1"),
    options: z.array(optionSchema).min(1, "Thêm ít nhất 1 lựa chọn"),
  })
  .superRefine((g, ctx) => {
    if (g.maxSelect < g.minSelect) {
      ctx.addIssue({
        code: "custom",
        path: ["maxSelect"],
        message: "Tối đa phải ≥ tối thiểu",
      });
    }
    if (g.minSelect > g.options.length) {
      ctx.addIssue({
        code: "custom",
        path: ["minSelect"],
        message: "Tối thiểu vượt quá số lựa chọn",
      });
    }
  });

export const itemSchema = z.object({
  imageUrl: z.string().nullable(),
  name: z.string().trim().min(1, "Nhập tên món").max(120, "Tối đa 120 ký tự"),
  categoryId: z.string().min(1, "Chọn nhóm món"),
  basePrice: money,
  description: z.string().max(500, "Tối đa 500 ký tự"),
  sku: z.string().trim().max(50, "Tối đa 50 ký tự"),
  /** Nhập cách nhau bằng dấu phẩy */
  tags: z.string(),
  displayOrder: z.number({ error: "Nhập số" }).int().min(0, "Không được âm"),
  variants: z.array(variantSchema).max(20, "Tối đa 20 size/biến thể"),
  toppingGroups: z.array(toppingGroupSchema).max(10, "Tối đa 10 nhóm topping"),
});

export type ItemFormInput = z.input<typeof itemSchema>;
export type ItemFormOutput = z.output<typeof itemSchema>;
export type ItemForm = UseFormReturn<ItemFormInput, unknown, ItemFormOutput>;

export const EMPTY_ITEM_FORM: ItemFormInput = {
  imageUrl: null,
  name: "",
  categoryId: "",
  basePrice: 0,
  description: "",
  sku: "",
  tags: "",
  displayOrder: 0,
  variants: [],
  toppingGroups: [],
};

export function toFormValues(item: MenuItem): ItemFormInput {
  return {
    imageUrl: item.imageUrl || null,
    name: item.name,
    categoryId: item.categoryId,
    basePrice: item.basePrice.amount,
    description: item.description ?? "",
    sku: item.sku ?? "",
    tags: item.tags.join(", "),
    displayOrder: item.displayOrder ?? 0,
    variants: item.variants.map((v) => ({
      refId: v.id,
      name: v.name,
      priceModifier: v.priceModifier.amount,
      isDefault: v.isDefault,
    })),
    toppingGroups: item.toppingGroups.map((g) => ({
      refId: g.id,
      name: g.name,
      minSelect: g.minSelect,
      maxSelect: g.maxSelect,
      options: g.options.map((o) => ({
        refId: o.id,
        name: o.name,
        priceModifier: o.priceModifier.amount,
        isAvailable: o.isAvailable,
      })),
    })),
  };
}

const vnd = (amount: number) => ({ amount, currency: "VND" });

export function toUpdateInput(v: ItemFormOutput): Partial<MenuItemInput> {
  // Luôn đúng 1 size mặc định khi có size
  const hasDefault = v.variants.some((x) => x.isDefault);
  let defaultTaken = false;
  const variants = v.variants.map((x, i) => {
    const isDefault = hasDefault ? x.isDefault && !defaultTaken : i === 0;
    if (isDefault) defaultTaken = true;
    return { id: x.refId, name: x.name, priceModifier: vnd(x.priceModifier), isDefault };
  });

  return {
    name: v.name,
    categoryId: v.categoryId,
    basePrice: vnd(v.basePrice),
    description: v.description,
    sku: v.sku,
    // API: chuỗi rỗng = xoá ảnh
    imageUrl: v.imageUrl ?? "",
    displayOrder: v.displayOrder,
    tags: Array.from(
      new Set(
        v.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      ),
    ),
    variants,
    toppingGroups: v.toppingGroups.map((g) => ({
      id: g.refId,
      name: g.name,
      minSelect: g.minSelect,
      maxSelect: g.maxSelect,
      options: g.options.map((o) => ({
        id: o.refId,
        name: o.name,
        priceModifier: vnd(o.priceModifier),
        isAvailable: o.isAvailable,
      })),
    })),
  };
}
