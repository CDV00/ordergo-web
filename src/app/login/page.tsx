"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Package } from "lucide-react";
import { useLogin, useRegister } from "@/hooks/api/use-auth";
import { useAuth } from "@/contexts/auth-context";
import { ApiException } from "@/lib/api-client";

interface LoginForm {
  phone: string;
  password: string;
}

interface RegisterForm {
  displayName: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { isReady, isAuthenticated, activeTenantId } = useAuth();

  const login = useLogin();
  const register = useRegister();

  const loginForm = useForm<LoginForm>({
    defaultValues: { phone: "", password: "" },
  });
  const regForm = useForm<RegisterForm>({
    defaultValues: { displayName: "", phone: "", password: "", confirmPassword: "" },
  });

  // Auto-redirect khi đã login
  useEffect(() => {
    if (!isReady) return;
    if (isAuthenticated) {
      router.replace(activeTenantId ? "/" : "/setup");
    }
  }, [isReady, isAuthenticated, activeTenantId, router]);

  const onLogin = loginForm.handleSubmit(async (values) => {
    try {
      const res = await login.mutateAsync({
        phone: values.phone.trim(),
        password: values.password,
      });
      toast.success("Đăng nhập thành công");
      router.replace(res.needsSetup || !res.membership.tenantId ? "/setup" : "/");
    } catch (err) {
      const e = err as ApiException;
      toast.error(e.error?.message ?? "Đăng nhập thất bại");
    }
  });

  const onRegister = regForm.handleSubmit(async (values) => {
    if (values.password !== values.confirmPassword) {
      regForm.setError("confirmPassword", { message: "Mật khẩu không khớp" });
      return;
    }
    try {
      await register.mutateAsync({
        displayName: values.displayName.trim(),
        phone: values.phone.trim(),
        password: values.password,
      });
      toast.success("Đăng ký thành công, mời bạn thiết lập doanh nghiệp.");
      router.replace("/setup");
    } catch (err) {
      const e = err as ApiException;
      toast.error(e.error?.message ?? "Đăng ký thất bại");
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex items-center justify-center space-x-2">
            <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Package className="size-4" />
            </div>
            <span className="text-xl font-bold">OrderGo</span>
          </div>
          <CardTitle className="text-2xl">Chào mừng đến OrderGo</CardTitle>
          <CardDescription>Đăng nhập hoặc tạo tài khoản mới</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Đăng nhập</TabsTrigger>
              <TabsTrigger value="register">Đăng ký</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={onLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-phone">Số điện thoại</Label>
                  <Input
                    id="login-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="0901234567"
                    {...loginForm.register("phone", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Mật khẩu</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...loginForm.register("password", { required: true, minLength: 1 })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword((s) => !s)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={login.isPending}>
                  {login.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <form onSubmit={onRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Họ và tên</Label>
                  <Input
                    id="reg-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Nguyễn Văn A"
                    {...regForm.register("displayName", { required: true, minLength: 2 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-phone">Số điện thoại</Label>
                  <Input
                    id="reg-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="0901234567"
                    {...regForm.register("phone", {
                      required: true,
                      pattern: { value: /^\+?[0-9]{9,15}$/, message: "Số điện thoại không hợp lệ" },
                    })}
                  />
                  {regForm.formState.errors.phone && (
                    <p className="text-destructive text-sm">
                      {regForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Mật khẩu</Label>
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Tối thiểu 8 ký tự"
                    {...regForm.register("password", { required: true, minLength: 8 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm">Nhập lại mật khẩu</Label>
                  <Input
                    id="reg-confirm"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...regForm.register("confirmPassword", { required: true })}
                  />
                  {regForm.formState.errors.confirmPassword && (
                    <p className="text-destructive text-sm">
                      {regForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={register.isPending}>
                  {register.isPending ? "Đang đăng ký..." : "Tạo tài khoản"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
