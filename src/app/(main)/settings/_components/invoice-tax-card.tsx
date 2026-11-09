"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateVenue, type UpdateVenueInput } from "@/hooks/api/use-tenant";
import type { Venue } from "@/types/api";
import { apiErrorMessage, FieldError, textareaClass } from "./shared";

const VAT_OPTIONS = [
  { value: "0", label: "0% (không chịu thuế)" },
  { value: "0.05", label: "5%" },
  { value: "0.08", label: "8%" },
  { value: "0.1", label: "10%" },
] as const;

const schema = z.object({
  vatRate: z.enum(["0", "0.05", "0.08", "0.1"], { error: "Chọn mức VAT" }),
  serviceChargePct: z
    .number({ error: "Nhập số từ 0 đến 20" })
    .min(0, "Không được âm")
    .max(20, "Tối đa 20%"),
  receiptFooter: z.string().max(200, "Tối đa 200 ký tự"),
});
type FormValues = z.infer<typeof schema>;

const toVatOption = (rate: number): FormValues["vatRate"] =>
  VAT_OPTIONS.find((o) => Number(o.value) === rate)?.value ?? "0.08";

const fromVenue = (v: Venue): FormValues => ({
  vatRate: toVatOption(v.settings?.vatRate ?? 0.08),
  serviceChargePct: Number(((v.settings?.serviceChargeRate ?? 0) * 100).toFixed(2)),
  receiptFooter: v.settings?.receiptFooter ?? "",
});

/** VAT, phí phục vụ, lời chào cuối hoá đơn. */
export function InvoiceTaxCard({ venue }: { venue: Venue }) {
  const update = useUpdateVenue(venue.id);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: fromVenue(venue),
  });
  const {
    register,
    control,
    watch,
    formState: { errors, isDirty },
  } = form;
  const footerLength = watch("receiptFooter")?.length ?? 0;

  useEffect(() => {
    if (!form.formState.isDirty) form.reset(fromVenue(venue));
  }, [venue, form]);

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      const saved = await update.mutateAsync({
        vatRate: Number(v.vatRate) as UpdateVenueInput["vatRate"],
        // 5 (%) → 0.05
        serviceChargeRate: Number((v.serviceChargePct / 100).toFixed(4)),
        receiptFooter: v.receiptFooter.trim(),
      });
      form.reset(fromVenue(saved));
      toast.success("Đã lưu cài đặt hoá đơn & thuế");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Hoá đơn &amp; thuế</CardTitle>
        <CardDescription>Áp dụng cho các đơn tạo mới tại cơ sở này.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Thuế VAT</Label>
            <Controller
              control={control}
              name="vatRate"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn mức VAT" />
                  </SelectTrigger>
                  <SelectContent>
                    {VAT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-muted-foreground text-xs">Giá menu đã bao gồm VAT.</p>
            <FieldError message={errors.vatRate?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-charge">Phí phục vụ (%)</Label>
            <Input
              id="service-charge"
              type="number"
              min={0}
              max={20}
              step={0.5}
              {...register("serviceChargePct", { valueAsNumber: true })}
            />
            <p className="text-muted-foreground text-xs">Từ 0 đến 20%. Nhập 0 nếu không thu.</p>
            <FieldError message={errors.serviceChargePct?.message} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="receipt-footer">Lời chào cuối hoá đơn</Label>
              <span className="text-muted-foreground text-xs">{footerLength}/200</span>
            </div>
            <textarea
              id="receipt-footer"
              rows={3}
              maxLength={200}
              placeholder="vd: Cảm ơn quý khách, hẹn gặp lại!"
              className={textareaClass}
              {...register("receiptFooter")}
            />
            <FieldError message={errors.receiptFooter?.message} />
          </div>

          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={update.isPending || !isDirty}>
              {update.isPending ? "Đang lưu..." : "Lưu hoá đơn & thuế"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
