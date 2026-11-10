"use client";

import { useEffect } from "react";
import type * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Coffee, Store } from "lucide-react";
import { FadeIn } from "@/components/motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useSetupWizard } from "@/hooks/api/use-tenant";
import { ApiException } from "@/lib/api-client";
import type { BusinessType } from "@/types/api";

interface SetupForm {
  tenantName: string;
  taxCode: string;
  venueName: string;
  venueCode: string;
  businessType: BusinessType;
  address: string;
  city: string;
}

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
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

const STEPS = [
  { label: "Tạo tài khoản", hint: "Đã xong" },
  { label: "Doanh nghiệp & cơ sở", hint: "Đang điền" },
  { label: "Bắt đầu bán", hint: "Menu, bàn, POS" },
];
/** Bước hiện tại của trang này (0-based) — tài khoản đã tạo xong trước khi vào đây. */
const CURRENT_STEP = 1;

/** Thanh bước của trình thiết lập. */
function StepIndicator() {
  return (
    <ol className="flex items-start" aria-label="Các bước thiết lập">
      {STEPS.map((step, i) => {
        const done = i < CURRENT_STEP;
        const current = i === CURRENT_STEP;
        return (
          <li
            key={step.label}
            className="relative flex flex-1 flex-col items-center gap-2 text-center"
            aria-current={current ? "step" : undefined}
          >
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-4 right-1/2 h-0.5 w-full",
                  i <= CURRENT_STEP ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-[1] flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                done && "bg-primary text-primary-foreground",
                current && "bg-primary text-primary-foreground ring-primary/20 ring-4",
                !done && !current && "bg-muted text-muted-foreground border",
              )}
            >
              {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
            </span>
            <span className="space-y-0.5">
              <span
                className={cn(
                  "block text-xs font-semibold sm:text-sm",
                  !done && !current && "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
              <span className="text-muted-foreground hidden text-xs sm:block">{step.hint}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Tiêu đề nhóm trường trong form: số thứ tự + tên. */
function SectionTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold">
      <span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-lg text-xs font-bold">
        {n}
      </span>
      {children}
    </h3>
  );
}

export default function SetupPage() {
  const router = useRouter();
  const { isReady, isAuthenticated, activeTenantId } = useAuth();
  const setup = useSetupWizard();

  const form = useForm<SetupForm>({
    defaultValues: {
      tenantName: "",
      taxCode: "",
      venueName: "",
      venueCode: "CN1",
      businessType: "cafe",
      address: "",
      city: "",
    },
  });

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (activeTenantId) {
      router.replace("/");
    }
  }, [isReady, isAuthenticated, activeTenantId, router]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await setup.mutateAsync({
        tenantName: values.tenantName.trim(),
        taxCode: values.taxCode.trim() || undefined,
        venueName: values.venueName.trim(),
        venueCode: values.venueCode.trim().toUpperCase(),
        businessType: values.businessType,
        address: values.address.trim() || undefined,
        city: values.city.trim() || undefined,
      });
      toast.success("Thiết lập doanh nghiệp thành công!");
      router.replace("/");
    } catch (err) {
      const e = err as ApiException;
      toast.error(e.error?.message ?? "Thiết lập thất bại");
    }
  });

  if (!isReady || !isAuthenticated) return null;

  return (
    <div className="bg-muted/40 relative flex min-h-svh items-start justify-center overflow-hidden p-4 py-8 sm:items-center sm:p-8">
      <div className="bg-primary/10 pointer-events-none absolute -top-40 -left-32 size-96 rounded-full blur-3xl" />
      <div className="bg-chart-4/15 pointer-events-none absolute -right-32 -bottom-40 size-96 rounded-full blur-3xl" />
      <FadeIn className="relative w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-center gap-2.5">
          <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl shadow-md">
            <Coffee className="size-5" strokeWidth={2.4} />
          </div>
          <span className="text-xl font-bold tracking-tight">OrderGo</span>
        </div>
        <StepIndicator />
        <Card className="w-full shadow-lg shadow-black/5">
          <CardHeader className="space-y-1.5 text-center">
            <div className="bg-primary/10 text-primary mx-auto mb-1 flex size-12 items-center justify-center rounded-2xl">
              <Store className="size-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Thiết lập doanh nghiệp
            </CardTitle>
            <CardDescription>
              Hãy cho chúng tôi biết về doanh nghiệp của bạn để bắt đầu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              <section className="space-y-4">
                <SectionTitle n={1}>Thông tin doanh nghiệp</SectionTitle>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="tenantName">Tên doanh nghiệp *</Label>
                    <Input
                      id="tenantName"
                      placeholder="Cà phê ABC"
                      {...form.register("tenantName", { required: true, minLength: 2 })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="taxCode">Mã số thuế (tuỳ chọn)</Label>
                    <Input id="taxCode" placeholder="0123456789" {...form.register("taxCode")} />
                  </div>
                </div>
              </section>

              <section className="space-y-4 border-t pt-6">
                <SectionTitle n={2}>Cơ sở đầu tiên</SectionTitle>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="venueName">Tên cơ sở *</Label>
                    <Input
                      id="venueName"
                      placeholder="Chi nhánh Quận 1"
                      {...form.register("venueName", { required: true, minLength: 2 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="venueCode">Mã chi nhánh *</Label>
                    <Input
                      id="venueCode"
                      placeholder="CN1"
                      {...form.register("venueCode", { required: true })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="businessType">Loại hình *</Label>
                    <Select
                      value={form.watch("businessType")}
                      onValueChange={(v) => form.setValue("businessType", v as BusinessType)}
                    >
                      <SelectTrigger id="businessType">
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
                  <div className="space-y-2">
                    <Label htmlFor="address">Địa chỉ</Label>
                    <Input
                      id="address"
                      placeholder="123 Nguyễn Huệ"
                      {...form.register("address")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Thành phố</Label>
                    <Input id="city" placeholder="TP. Hồ Chí Minh" {...form.register("city")} />
                  </div>
                </div>
              </section>

              <Button type="submit" className="w-full" disabled={setup.isPending} size="lg">
                {setup.isPending ? "Đang tạo..." : "Hoàn tất thiết lập"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
