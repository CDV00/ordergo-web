"use client";

import { useEffect } from "react";
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
import { Store } from "lucide-react";
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-2 flex items-center justify-center space-x-2">
            <div className="bg-primary text-primary-foreground flex aspect-square size-10 items-center justify-center rounded-lg">
              <Store className="size-5" />
            </div>
          </div>
          <CardTitle className="text-2xl">Thiết lập doanh nghiệp</CardTitle>
          <CardDescription>
            Hãy cho chúng tôi biết về doanh nghiệp của bạn để bắt đầu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-muted-foreground text-sm font-semibold uppercase">
                Thông tin doanh nghiệp
              </h3>
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

            <section className="space-y-4">
              <h3 className="text-muted-foreground text-sm font-semibold uppercase">
                Cơ sở đầu tiên
              </h3>
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
                  <Input id="address" placeholder="123 Nguyễn Huệ" {...form.register("address")} />
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
    </div>
  );
}
