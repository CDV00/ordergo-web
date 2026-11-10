"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateVenue } from "@/hooks/api/use-tenant";
import type { Venue } from "@/types/api";
import { apiErrorMessage, FieldError, SettingsCardHeader } from "./shared";

const schema = z.object({
  logoUrl: z.string().nullable(),
  name: z.string().trim().min(2, "Tên quán tối thiểu 2 ký tự").max(100, "Tối đa 100 ký tự"),
  addressLine1: z.string().trim().max(255, "Tối đa 255 ký tự"),
  city: z.string().trim().max(100, "Tối đa 100 ký tự"),
  phone: z
    .string()
    .trim()
    .max(20, "Tối đa 20 ký tự")
    .refine((v) => v === "" || /^[0-9+\s.()-]{8,20}$/.test(v), "Số điện thoại không hợp lệ"),
});
type FormValues = z.infer<typeof schema>;

const fromVenue = (v: Venue): FormValues => ({
  logoUrl: v.logoUrl || null,
  name: v.name,
  addressLine1: v.address?.line1 ?? "",
  city: v.address?.city ?? "",
  phone: v.contact?.phone ?? "",
});

/** Thông tin quán: logo, tên, địa chỉ, SĐT (in trên hoá đơn + trang gọi món). */
export function VenueInfoCard({ venue }: { venue: Venue }) {
  const update = useUpdateVenue(venue.id);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: fromVenue(venue),
  });
  const {
    register,
    formState: { errors, isDirty },
  } = form;

  useEffect(() => {
    if (!form.formState.isDirty) form.reset(fromVenue(venue));
  }, [venue, form]);

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      const saved = await update.mutateAsync({
        name: v.name,
        addressLine1: v.addressLine1,
        city: v.city,
        phone: v.phone,
        // Chuỗi rỗng = xoá logo
        logoUrl: v.logoUrl ?? "",
      });
      form.reset(fromVenue(saved));
      toast.success("Đã lưu thông tin quán");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  });

  return (
    <Card>
      <SettingsCardHeader
        icon={Store}
        title="Thông tin quán"
        description="Hiển thị trên hoá đơn và trang gọi món của khách."
      />
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="grid gap-6 md:grid-cols-[auto_1fr]">
          <ImageUpload
            value={form.watch("logoUrl")}
            onChange={(url) => form.setValue("logoUrl", url, { shouldDirty: true })}
            aspect="square"
            label="Tải logo"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="venue-name">Tên quán *</Label>
              <Input id="venue-name" {...register("name")} />
              <FieldError message={errors.name?.message} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="venue-address">Địa chỉ</Label>
              <Input
                id="venue-address"
                placeholder="Số nhà, đường, phường"
                {...register("addressLine1")}
              />
              <FieldError message={errors.addressLine1?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue-city">Thành phố</Label>
              <Input id="venue-city" {...register("city")} />
              <FieldError message={errors.city?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue-phone">Số điện thoại</Label>
              <Input id="venue-phone" type="tel" inputMode="tel" {...register("phone")} />
              <FieldError message={errors.phone?.message} />
            </div>
            <div className="flex justify-end sm:col-span-2">
              <Button type="submit" disabled={update.isPending || !isDirty}>
                {update.isPending ? "Đang lưu..." : "Lưu thông tin"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
