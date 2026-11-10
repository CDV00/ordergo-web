"use client";

import { useState } from "react";
import { Percent, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApplyDiscount } from "@/hooks/api/use-orders";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ApiException } from "@/lib/api-client";
import type { Order } from "@/types/api";

const QUICK_PERCENT = [5, 10, 15, 20];

/** Giảm giá cho đơn — % hoặc số tiền, kèm lý do. Đặt 0 / "Bỏ giảm giá" để huỷ. */
export function DiscountSection({ order }: { order: Order }) {
  const current = order.discountInfo;
  const [open, setOpen] = useState(!!current);
  const [type, setType] = useState<"percent" | "amount">(current?.type ?? "percent");
  const [value, setValue] = useState<number>(current?.value ?? 0);
  const [reason, setReason] = useState(current?.reason ?? "");
  const apply = useApplyDiscount();

  const submit = async (v: number, t = type) => {
    try {
      await apply.mutateAsync({
        orderId: order.id,
        type: t,
        value: v,
        reason: reason || undefined,
      });
      toast.success(v > 0 ? "Đã áp dụng giảm giá" : "Đã bỏ giảm giá");
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Không áp dụng được giảm giá");
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-primary flex items-center gap-1.5 text-sm font-medium hover:underline"
      >
        <Tag className="size-4" /> Thêm giảm giá
      </button>
    );
  }

  return (
    <div className="bg-card space-y-2.5 rounded-2xl border p-3 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Giảm giá</span>
        <div className="bg-muted flex rounded-full p-0.5 text-xs">
          {(["percent", "amount"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "rounded-full px-3 py-1 font-medium transition-colors",
                type === t && "bg-card shadow-sm",
              )}
            >
              {t === "percent" ? "%" : "Số tiền"}
            </button>
          ))}
        </div>
      </div>

      {type === "percent" && (
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PERCENT.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setValue(p);
                void submit(p, "percent");
              }}
              className={cn(
                "h-9 rounded-full border px-3.5 text-xs font-semibold transition-colors",
                current?.type === "percent" && current.value === p
                  ? "border-primary bg-primary/10"
                  : "hover:border-primary/50",
              )}
            >
              {p}%
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="number"
            min={0}
            max={type === "percent" ? 100 : undefined}
            value={value || ""}
            onChange={(e) => setValue(parseInt(e.target.value) || 0)}
            placeholder={type === "percent" ? "Phần trăm" : "Số tiền (đ)"}
            className="pr-8 tabular-nums"
          />
          <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-xs">
            {type === "percent" ? <Percent className="size-3.5" /> : "đ"}
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-9"
          disabled={apply.isPending}
          onClick={() => submit(value)}
        >
          Áp dụng
        </Button>
      </div>
      <Input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Lý do (khách quen, khuyến mãi...)"
        maxLength={200}
        className="text-sm"
      />
      {current && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-success font-medium">
            Đang giảm {formatVnd(order.pricing.discount.amount)}
            {current.type === "percent" ? ` (${current.value}%)` : ""}
          </span>
          <button
            type="button"
            onClick={() => {
              setValue(0);
              void submit(0);
            }}
            className="text-destructive hover:underline"
          >
            Bỏ giảm giá
          </button>
        </div>
      )}
    </div>
  );
}
