"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, CheckCircle2, QrCode, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBanks, useUpdateVenue } from "@/hooks/api/use-tenant";
import type { Venue } from "@/types/api";
import { apiErrorMessage, FieldError, SettingsCardHeader, toBankAccountName } from "./shared";

const schema = z.object({
  bankBin: z.string().regex(/^\d{6}$/, "Chọn ngân hàng"),
  accountNumber: z
    .string()
    .transform((v) => v.replace(/\s+/g, ""))
    .pipe(z.string().regex(/^[0-9A-Za-z]{4,19}$/, "Số tài khoản gồm 4–19 chữ số hoặc chữ cái")),
  accountName: z
    .string()
    .trim()
    .min(2, "Tên chủ tài khoản tối thiểu 2 ký tự")
    .max(50, "Tối đa 50 ký tự"),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

const fromVenue = (v: Venue): FormInput => ({
  bankBin: v.settings?.bankAccount?.bankBin ?? "",
  accountNumber: v.settings?.bankAccount?.accountNumber ?? "",
  accountName: v.settings?.bankAccount?.accountName ?? "",
});

/** Tài khoản nhận tiền VietQR của cơ sở. */
export function BankAccountCard({ venue }: { venue: Venue }) {
  const update = useUpdateVenue(venue.id);
  const banks = useBanks();
  const current = venue.settings?.bankAccount ?? null;
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: fromVenue(venue),
  });
  const {
    register,
    control,
    setValue,
    formState: { errors, isDirty },
  } = form;

  useEffect(() => {
    if (!form.formState.isDirty) form.reset(fromVenue(venue));
  }, [venue, form]);

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      const saved = await update.mutateAsync({
        bankAccount: {
          bankBin: v.bankBin,
          bankName: banks.data?.find((b) => b.bin === v.bankBin)?.name,
          accountNumber: v.accountNumber,
          accountName: toBankAccountName(v.accountName),
        },
      });
      form.reset(fromVenue(saved));
      toast.success("Đã lưu tài khoản nhận tiền");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  });

  const handleClear = async () => {
    if (!confirm("Xoá tài khoản nhận tiền? Khách sẽ phải thanh toán tại quầy.")) return;
    try {
      const saved = await update.mutateAsync({ bankAccount: null });
      form.reset(fromVenue(saved));
      toast.success("Đã xoá tài khoản nhận tiền");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Card>
      <SettingsCardHeader
        icon={QrCode}
        title="Thanh toán VietQR"
        description="Mã VietQR trên màn hình POS và trang gọi món của khách sẽ chuyển tiền vào tài khoản này."
      />
      <CardContent className="space-y-4">
        {current ? (
          <div className="bg-success-soft text-success border-success/25 flex items-start gap-2 rounded-xl border p-3 text-sm">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <span>
              Đang nhận tiền vào: <b>{current.bankName ?? current.bankBin}</b> ·{" "}
              {current.accountNumber} · {current.accountName}
            </span>
          </div>
        ) : (
          <div className="bg-warning-soft text-foreground border-warning/30 [&>svg]:text-warning flex items-start gap-2 rounded-xl border p-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              Chưa cài đặt tài khoản nhận tiền — không tạo được mã VietQR, khách phải thanh toán tại
              quầy.
            </span>
          </div>
        )}

        <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Ngân hàng *</Label>
            <Controller
              control={control}
              name="bankBin"
              render={({ field }) => (
                // Radix Select xoá value khi options chưa tải → bỏ qua "", remount khi có danh sách
                <Select
                  key={banks.data?.length ?? 0}
                  value={field.value}
                  onValueChange={(v) => v && field.onChange(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={banks.isLoading ? "Đang tải..." : "Chọn ngân hàng"} />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.data?.map((b) => (
                      <SelectItem key={b.bin} value={b.bin}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.bankBin?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-number">Số tài khoản *</Label>
            <Input id="account-number" autoComplete="off" {...register("accountNumber")} />
            <FieldError message={errors.accountNumber?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-name">Tên chủ tài khoản *</Label>
            <Input
              id="account-name"
              placeholder="NGUYEN VAN A"
              autoComplete="off"
              {...register("accountName", {
                onBlur: (e) =>
                  setValue("accountName", toBankAccountName(e.target.value), {
                    shouldDirty: true,
                  }),
              })}
            />
            <p className="text-muted-foreground text-xs">
              Viết hoa, không dấu, đúng như tên in trên tài khoản ngân hàng.
            </p>
            <FieldError message={errors.accountName?.message} />
          </div>
          <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
            {current && (
              <Button
                type="button"
                variant="outline"
                className="text-destructive"
                onClick={handleClear}
                disabled={update.isPending}
              >
                <Trash2 className="mr-1 size-4" /> Xoá tài khoản
              </Button>
            )}
            <Button type="submit" disabled={update.isPending || !isDirty}>
              {update.isPending ? "Đang lưu..." : "Lưu tài khoản"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
