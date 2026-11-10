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
import { Coffee, Eye, EyeOff } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { FadeIn } from "@/components/motion";
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

/** Hơi nước bốc lên từ ly — tắt khi người dùng bật "giảm chuyển động". */
function Steam({ delay, x }: { delay: number; x: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      aria-hidden
      className="bg-sidebar-foreground/35 absolute bottom-full h-14 w-2 rounded-full blur-[3px]"
      style={{ left: `${x}%` }}
      initial={{ opacity: 0, y: 8, scaleY: 0.6 }}
      animate={
        reduce
          ? { opacity: 0.35, y: -6, scaleY: 1 }
          : { opacity: [0, 0.55, 0], y: [8, -26, -48], scaleY: [0.6, 1, 1.2] }
      }
      transition={
        reduce ? { duration: 0 } : { duration: 3.2, repeat: Infinity, delay, ease: "easeOut" }
      }
    />
  );
}

/** Minh hoạ ly cà phê dựng bằng khối CSS (không dùng ảnh). */
function CoffeeIllustration() {
  return (
    <div className="relative mx-auto h-64 w-72" aria-hidden>
      {/* Quầng sáng ấm phía sau */}
      <div className="bg-sidebar-primary/25 absolute inset-x-6 top-6 bottom-4 rounded-full blur-3xl" />
      {/* Đĩa lót */}
      <div className="bg-sidebar-accent absolute bottom-6 left-1/2 h-8 w-64 -translate-x-1/2 rounded-[50%] shadow-lg shadow-black/30" />
      <div className="bg-sidebar-border absolute bottom-8 left-1/2 h-5 w-44 -translate-x-1/2 rounded-[50%]" />
      {/* Quai ly */}
      <div className="border-sidebar-primary absolute right-[52px] bottom-[64px] size-14 rounded-full border-[10px]" />
      {/* Thân ly */}
      <div className="bg-sidebar-primary absolute bottom-10 left-1/2 h-32 w-40 -translate-x-1/2 overflow-hidden rounded-t-md rounded-b-[46%] shadow-xl shadow-black/30">
        <div className="bg-sidebar-foreground/15 absolute inset-y-0 left-4 w-5 rounded-full blur-[2px]" />
      </div>
      {/* Miệng ly + mặt cà phê */}
      <div className="bg-sidebar-primary absolute bottom-[164px] left-1/2 h-7 w-40 -translate-x-1/2 rounded-[50%]">
        <div className="bg-sidebar absolute inset-x-2 inset-y-1.5 rounded-[50%]">
          <div className="bg-sidebar-primary/40 absolute inset-x-8 inset-y-1 rounded-[50%]" />
        </div>
        <div className="absolute inset-x-0 bottom-full h-0">
          <Steam delay={0} x={30} />
          <Steam delay={1.1} x={48} />
          <Steam delay={2.1} x={64} />
        </div>
      </div>
      {/* Hạt cà phê */}
      <div className="bg-sidebar-accent absolute bottom-3 left-6 h-5 w-3.5 rotate-[-30deg] rounded-[50%] shadow-md shadow-black/30" />
      <div className="bg-sidebar-accent absolute right-8 bottom-2 h-5 w-3.5 rotate-[25deg] rounded-[50%] shadow-md shadow-black/30" />
    </div>
  );
}

/** Nửa trái (màn rộng): nền espresso, minh hoạ + khẩu hiệu. */
function BrandPanel() {
  return (
    <aside className="sidebar-scope bg-sidebar text-sidebar-foreground relative hidden overflow-hidden lg:flex lg:w-[46%] lg:flex-col lg:justify-between lg:p-10 xl:p-14">
      {/* Hoạ tiết nền: vài vòng tròn ấm, mờ */}
      <div className="bg-sidebar-primary/15 absolute -top-24 -left-24 size-80 rounded-full blur-3xl" />
      <div className="bg-sidebar-primary/10 absolute -right-20 -bottom-28 size-96 rounded-full blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative flex items-center gap-3">
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-10 items-center justify-center rounded-xl shadow-md shadow-black/30">
          <Coffee className="size-5" strokeWidth={2.4} />
        </div>
        <div className="leading-tight">
          <div className="text-lg font-bold tracking-tight">OrderGo</div>
          <div className="text-sidebar-foreground/60 text-xs">Vận hành quán</div>
        </div>
      </div>

      <FadeIn className="relative">
        <CoffeeIllustration />
      </FadeIn>

      <FadeIn delay={0.1} className="relative max-w-md space-y-4">
        <h2 className="text-3xl leading-tight font-bold tracking-tight xl:text-4xl">
          Gọi món nhanh, bếp nhận ngay, <span className="text-sidebar-primary">thu tiền gọn.</span>
        </h2>
        <p className="text-sidebar-foreground/70 text-sm leading-relaxed">
          POS, màn bếp, gọi món qua QR và báo cáo doanh thu — tất cả trong một ứng dụng cho quán cà
          phê và nhà hàng.
        </p>
        <ul className="text-sidebar-foreground/80 flex flex-wrap gap-2 pt-1 text-xs">
          {["Gọi món tại bàn", "Màn hình bếp", "VietQR", "Nhiều chi nhánh"].map((t) => (
            <li key={t} className="bg-sidebar-accent rounded-full px-3 py-1">
              {t}
            </li>
          ))}
        </ul>
      </FadeIn>
    </aside>
  );
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
    <div className="bg-background flex min-h-svh">
      <BrandPanel />

      <main className="bg-muted/40 relative flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-8">
        {/* Màn hẹp: quầng màu ấm thay cho nửa minh hoạ */}
        <div className="bg-primary/10 pointer-events-none absolute -top-32 -right-24 size-80 rounded-full blur-3xl lg:hidden" />
        <FadeIn className="relative w-full max-w-md">
          <div className="mb-6 flex items-center justify-center gap-2.5 lg:hidden">
            <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl shadow-md">
              <Coffee className="size-5" strokeWidth={2.4} />
            </div>
            <span className="text-xl font-bold tracking-tight">OrderGo</span>
          </div>
          <Card className="w-full shadow-lg shadow-black/5">
            <CardHeader className="space-y-1.5 pb-4">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Chào mừng đến OrderGo
              </CardTitle>
              <CardDescription>Đăng nhập hoặc tạo tài khoản mới</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full gap-5">
                <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl">
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
                          className="text-muted-foreground hover:text-foreground absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                          aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                          onClick={() => setShowPassword((s) => !s)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" size="lg" className="w-full" disabled={login.isPending}>
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
                          pattern: {
                            value: /^\+?[0-9]{9,15}$/,
                            message: "Số điện thoại không hợp lệ",
                          },
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
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={register.isPending}
                    >
                      {register.isPending ? "Đang đăng ký..." : "Tạo tài khoản"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          <p className="text-muted-foreground mt-6 text-center text-xs">
            © {new Date().getFullYear()} OrderGo · Phần mềm quản lý quán
          </p>
        </FadeIn>
      </main>
    </div>
  );
}
