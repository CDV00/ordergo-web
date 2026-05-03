"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { CheckCircle2, Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useClaimWithOtp, useRequestOtp } from "@/hooks/api/use-public";
import { PublicApiException } from "@/lib/public-api-client";

interface Props {
  open: boolean;
  sessionId: string | null;
  onClose: () => void;
  onClaimed?: () => void;
}

type Step = "phone" | "otp" | "success";

export function ClaimSheet({ open, sessionId, onClose, onClaimed }: Props) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(0);

  const requestOtp = useRequestOtp();
  const claim = useClaimWithOtp(sessionId);

  useEffect(() => {
    if (!open) {
      // Reset on close
      setTimeout(() => {
        setStep("phone");
        setPhone("");
        setName("");
        setCode("");
      }, 300);
    }
  }, [open]);

  // Countdown resend
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleRequestOtp = async () => {
    const cleanPhone = phone.trim();
    if (!/^\+?[0-9]{9,15}$/.test(cleanPhone)) {
      toast.error("Số điện thoại không hợp lệ");
      return;
    }
    try {
      await requestOtp.mutateAsync({ phone: cleanPhone });
      toast.success("Đã gửi mã. Kiểm tra tin nhắn.");
      setStep("otp");
      setResendIn(30);
    } catch (err) {
      const e = err as PublicApiException;
      toast.error(e.error?.message ?? "Gửi mã thất bại");
    }
  };

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(code)) {
      toast.error("Mã OTP gồm 6 chữ số");
      return;
    }
    try {
      await claim.mutateAsync({
        phone: phone.trim(),
        code,
        name: name.trim() || undefined,
      });
      setStep("success");
      onClaimed?.();
    } catch (err) {
      const e = err as PublicApiException;
      toast.error(e.error?.message ?? "Mã không đúng");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] rounded-t-2xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <SheetTitle className="sr-only">Lưu hồ sơ khách hàng</SheetTitle>

        {step === "phone" && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="bg-primary/10 mx-auto mb-3 flex size-14 items-center justify-center rounded-full">
                <Gift className="text-primary size-7" />
              </div>
              <h2 className="text-xl font-bold">Lưu hồ sơ — nhận voucher</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Tích điểm cho lần sau, nhận quà sinh nhật.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Họ tên <span className="text-muted-foreground text-xs">(tùy chọn)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="bg-background focus:ring-primary h-11 w-full rounded-lg border px-3 focus:ring-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Số điện thoại *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901234567"
                  className="bg-background focus:ring-primary h-11 w-full rounded-lg border px-3 focus:ring-2 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleRequestOtp}
              disabled={requestOtp.isPending || !phone}
              className="bg-primary text-primary-foreground h-12 w-full rounded-full font-bold active:scale-95 disabled:opacity-50"
            >
              {requestOtp.isPending ? (
                <>
                  <Loader2 className="mr-2 inline size-4 animate-spin" />
                  Đang gửi mã...
                </>
              ) : (
                "Gửi mã xác thực"
              )}
            </button>

            <p className="text-muted-foreground text-center text-xs">
              Bằng cách tiếp tục, bạn đồng ý với{" "}
              <a href="#" className="underline">
                Điều khoản
              </a>{" "}
              &{" "}
              <a href="#" className="underline">
                Bảo mật
              </a>
              .
            </p>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold">Nhập mã 6 chữ số</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Đã gửi đến <strong>{phone}</strong>
              </p>
            </div>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="······"
              className="bg-background focus:ring-primary h-16 w-full rounded-lg border px-3 text-center text-2xl font-bold tracking-[0.5em] tabular-nums focus:ring-2 focus:outline-none"
              autoFocus
            />

            <button
              onClick={handleVerify}
              disabled={claim.isPending || code.length !== 6}
              className="bg-primary text-primary-foreground h-12 w-full rounded-full font-bold active:scale-95 disabled:opacity-50"
            >
              {claim.isPending ? (
                <>
                  <Loader2 className="mr-2 inline size-4 animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                "Xác thực"
              )}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                onClick={() => setStep("phone")}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Đổi SĐT
              </button>
              <button
                onClick={handleRequestOtp}
                disabled={resendIn > 0 || requestOtp.isPending}
                className="text-primary disabled:text-muted-foreground"
              >
                {resendIn > 0 ? `Gửi lại sau ${resendIn}s` : "Gửi lại mã"}
              </button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-4 py-6 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <CheckCircle2 className="size-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold">Cảm ơn bạn đã đăng ký!</h2>
            <p className="text-muted-foreground text-sm">
              Hồ sơ đã được lưu. Lần sau scan QR ở quán này sẽ tự nhận diện.
            </p>
            <button
              onClick={onClose}
              className="bg-primary text-primary-foreground h-12 w-full rounded-full font-bold active:scale-95"
            >
              Tiếp tục
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
