"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateVenue, useUpdateVenue } from "@/hooks/api/use-tenant";
import type { ApiException } from "@/lib/api-client";
import type { BusinessType, Venue } from "@/types/api";

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  restaurant: "Nhà hàng",
  cafe: "Quán cà phê",
  bar: "Bar / Pub",
  hotel: "Khách sạn",
  homestay: "Homestay",
  spa: "Spa & Salon",
  gym: "Phòng gym",
  education: "Trung tâm dạy học",
  coworking: "Co-working",
};

const CODE_RE = /^[A-Za-z0-9_-]{1,20}$/;
const PHONE_RE = /^\+?[0-9 ]{9,15}$/;

interface FormState {
  name: string;
  code: string;
  businessType: BusinessType;
  addressLine1: string;
  city: string;
  phone: string;
}

const EMPTY: FormState = {
  name: "",
  code: "",
  businessType: "cafe",
  addressLine1: "",
  city: "",
  phone: "",
};

/**
 * Tạo chi nhánh mới (`venue` = null) hoặc sửa thông tin cơ bản của chi nhánh.
 * Mã chi nhánh duy nhất trong doanh nghiệp, không đổi được sau khi tạo.
 */
export function VenueFormDialog({
  open,
  onOpenChange,
  venue,
  defaultBusinessType,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  venue: Venue | null;
  defaultBusinessType?: BusinessType;
  onCreated?: (v: Venue) => void;
}) {
  const create = useCreateVenue();
  const update = useUpdateVenue(venue?.id ?? "");
  const [form, setForm] = useState<FormState>(EMPTY);
  const editing = !!venue;
  const pending = create.isPending || update.isPending;

  useEffect(() => {
    if (!open) return;
    setForm(
      venue
        ? {
            name: venue.name,
            code: venue.code,
            businessType: venue.businessType,
            addressLine1: venue.address?.line1 ?? "",
            city: venue.address?.city ?? "",
            phone: venue.contact?.phone ?? "",
          }
        : { ...EMPTY, businessType: defaultBusinessType ?? "cafe" },
    );
  }, [open, venue, defaultBusinessType]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const nameError = form.name && form.name.trim().length < 2 ? "Tên tối thiểu 2 ký tự" : null;
  const codeError =
    !editing && form.code && !CODE_RE.test(form.code)
      ? "Chỉ gồm chữ, số, - hoặc _ (tối đa 20 ký tự)"
      : null;
  const phoneError = form.phone && !PHONE_RE.test(form.phone) ? "Số điện thoại không hợp lệ" : null;
  const invalid =
    form.name.trim().length < 2 || (!editing && !CODE_RE.test(form.code)) || !!phoneError;

  const submit = async () => {
    const phone = form.phone.replace(/\s/g, "");
    try {
      if (venue) {
        await update.mutateAsync({
          name: form.name.trim(),
          addressLine1: form.addressLine1.trim(),
          city: form.city.trim(),
          phone,
        });
        toast.success("Đã lưu thông tin chi nhánh");
      } else {
        const created = await create.mutateAsync({
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          businessType: form.businessType,
          addressLine1: form.addressLine1.trim() || undefined,
          city: form.city.trim() || undefined,
          phone: phone || undefined,
        });
        toast.success(`Đã tạo chi nhánh ${created.name}`);
        onCreated?.(created);
      }
      onOpenChange(false);
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Không lưu được chi nhánh");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? `Sửa ${venue.name}` : "Thêm chi nhánh"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Thông tin hiển thị trên hoá đơn và trang gọi món của khách."
              : "Chi nhánh mới chưa có menu, bàn và nhân viên — có thể sao chép menu từ cơ sở khác."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!invalid && !pending) void submit();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="venue-name">Tên chi nhánh *</Label>
            <Input
              id="venue-name"
              value={form.name}
              maxLength={100}
              placeholder="Góc Phố - Quận 1"
              onChange={(e) => set("name", e.target.value)}
            />
            {nameError && <p className="text-destructive text-xs">{nameError}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="venue-code">Mã *</Label>
              <Input
                id="venue-code"
                value={form.code}
                maxLength={20}
                disabled={editing}
                placeholder="Q1"
                className="uppercase"
                onChange={(e) => set("code", e.target.value)}
              />
              {codeError && <p className="text-destructive text-xs">{codeError}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="venue-type">Loại hình</Label>
              <Select
                value={form.businessType}
                disabled={editing}
                onValueChange={(v) => v && set("businessType", v as BusinessType)}
              >
                <SelectTrigger id="venue-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(BUSINESS_TYPE_LABELS) as BusinessType[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {BUSINESS_TYPE_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="venue-address">Địa chỉ</Label>
            <Input
              id="venue-address"
              value={form.addressLine1}
              maxLength={255}
              placeholder="Số nhà, đường, phường"
              onChange={(e) => set("addressLine1", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="venue-city">Tỉnh / Thành phố</Label>
              <Input
                id="venue-city"
                value={form.city}
                maxLength={100}
                onChange={(e) => set("city", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="venue-phone">Điện thoại</Label>
              <Input
                id="venue-phone"
                type="tel"
                inputMode="tel"
                value={form.phone}
                maxLength={20}
                onChange={(e) => set("phone", e.target.value)}
              />
              {phoneError && <p className="text-destructive text-xs">{phoneError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={invalid || pending}>
              {pending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              {editing ? "Lưu" : "Tạo chi nhánh"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
