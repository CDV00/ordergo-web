"use client";

import { useEffect, useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
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
import { useAuth } from "@/contexts/auth-context";
import { useVenues } from "@/hooks/api/use-tenant";
import {
  ASSIGNABLE_ROLES,
  ROLE_LABEL,
  useInviteStaff,
  type StaffRole,
} from "@/hooks/api/use-staff";
import { usePermissions } from "@/hooks/use-permissions";
import type { ApiException } from "@/lib/api-client";

const PHONE_RE = /^\+?[0-9]{9,15}$/;

/**
 * Mời nhân viên bằng SĐT. Nếu SĐT chưa có tài khoản, API trả mật khẩu tạm MỘT LẦN —
 * hiện cho người mời đưa trực tiếp cho nhân viên, không lưu lại ở đâu trên máy.
 */
export function InviteStaffDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { activeVenueId } = useAuth();
  const { can } = usePermissions();
  const venues = useVenues();
  const invite = useInviteStaff();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<StaffRole>("server");
  const [venueId, setVenueId] = useState(activeVenueId ?? "");
  const [temp, setTemp] = useState<{ password: string; name: string; phone: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Quản lý (không có '*') chỉ mời được vai trò thấp hơn mình
  const roles = can("*") ? ASSIGNABLE_ROLES : ASSIGNABLE_ROLES.filter((r) => r !== "venue_manager");

  useEffect(() => {
    if (open) {
      setPhone("");
      setName("");
      setRole("server");
      setVenueId(activeVenueId ?? "");
      setTemp(null);
      setCopied(false);
    }
  }, [open, activeVenueId]);

  const phoneError =
    phone && !PHONE_RE.test(phone.replace(/\s/g, "")) ? "Số điện thoại không hợp lệ" : null;

  const submit = async () => {
    try {
      const res = await invite.mutateAsync({
        phone: phone.replace(/\s/g, ""),
        displayName: name.trim(),
        roleCode: role,
        venueId,
      });
      if (res.tempPassword) {
        setTemp({ password: res.tempPassword, name: name.trim(), phone: phone.trim() });
      } else {
        toast.success(
          `${name.trim()} đã có tài khoản — đã thêm vào cơ sở, đăng nhập bằng mật khẩu cũ.`,
        );
        onOpenChange(false);
      }
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Không mời được nhân viên");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {temp ? (
          <>
            <DialogHeader>
              <DialogTitle>Đã tạo tài khoản cho {temp.name}</DialogTitle>
              <DialogDescription>
                Đưa thông tin này cho nhân viên. Mật khẩu tạm chỉ hiện <strong>một lần</strong>;
                nhân viên đổi mật khẩu ngay sau khi đăng nhập (menu tài khoản → Đổi mật khẩu).
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted space-y-2 rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Số điện thoại</span>
                <span className="font-medium tabular-nums">{temp.phone}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-sm">Mật khẩu tạm</span>
                <span className="font-mono text-lg font-bold tracking-wider">{temp.password}</span>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(temp.password).catch(() => undefined);
                  setCopied(true);
                }}
              >
                {copied ? <Check className="mr-1.5 size-4" /> : <Copy className="mr-1.5 size-4" />}
                {copied ? "Đã sao chép" : "Sao chép mật khẩu"}
              </Button>
              <Button onClick={() => onOpenChange(false)}>Xong</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Mời nhân viên</DialogTitle>
              <DialogDescription>
                Nhân viên đăng nhập bằng số điện thoại. Nếu chưa có tài khoản, hệ thống tạo mật khẩu
                tạm.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="inv-phone">Số điện thoại</Label>
                <Input
                  id="inv-phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="0901234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {phoneError && <p className="text-destructive text-xs">{phoneError}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inv-name">Họ tên</Label>
                <Input
                  id="inv-name"
                  value={name}
                  maxLength={80}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Vai trò</Label>
                  <Select value={role} onValueChange={(v) => v && setRole(v as StaffRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Cơ sở</Label>
                  <Select
                    key={venues.data?.length ?? 0}
                    value={venueId}
                    onValueChange={(v) => v && setVenueId(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn cơ sở" />
                    </SelectTrigger>
                    <SelectContent>
                      {(venues.data ?? []).map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Huỷ
              </Button>
              <Button
                onClick={submit}
                disabled={
                  !phone || !!phoneError || name.trim().length < 2 || !venueId || invite.isPending
                }
              >
                <KeyRound className="mr-1.5 size-4" /> Mời
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
