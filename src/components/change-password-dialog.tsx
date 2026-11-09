"use client";

import { useState } from "react";
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
import { useChangePassword } from "@/hooks/api/use-staff";
import type { ApiException } from "@/lib/api-client";

/** Đổi mật khẩu — nhân viên được mời đăng nhập bằng mật khẩu tạm nên cần đổi ngay. */
export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const change = useChangePassword();
  const error =
    next && next.length < 8
      ? "Mật khẩu mới tối thiểu 8 ký tự"
      : confirm && confirm !== next
        ? "Nhập lại không khớp"
        : null;

  const submit = async () => {
    try {
      await change.mutateAsync({ currentPassword: current, newPassword: next });
      toast.success("Đã đổi mật khẩu. Các thiết bị khác sẽ phải đăng nhập lại.");
      setCurrent("");
      setNext("");
      setConfirm("");
      onOpenChange(false);
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Không đổi được mật khẩu");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Đổi mật khẩu</DialogTitle>
          <DialogDescription>Nếu bạn vừa được mời, hãy thay mật khẩu tạm ngay.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="pw-current">Mật khẩu hiện tại</Label>
            <Input
              id="pw-current"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw-next">Mật khẩu mới</Label>
            <Input
              id="pw-next"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw-confirm">Nhập lại mật khẩu mới</Label>
            <Input
              id="pw-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button
            onClick={submit}
            disabled={!current || !next || next !== confirm || !!error || change.isPending}
          >
            Đổi mật khẩu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
