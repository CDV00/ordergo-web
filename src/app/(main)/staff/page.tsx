"use client";

import { useMemo, useState } from "react";
import { Lock, LockOpen, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { MenuToggle } from "@/components/menu-toggle";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccessibleVenues, useVenues } from "@/hooks/api/use-tenant";
import {
  ASSIGNABLE_ROLES,
  ROLE_LABEL,
  useSetStaffStatus,
  useStaff,
  useUpdateStaff,
  type StaffMember,
  type StaffRole,
} from "@/hooks/api/use-staff";
import { usePermissions } from "@/hooks/use-permissions";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ApiException } from "@/lib/api-client";
import { InviteStaffDialog } from "./_components/invite-staff-dialog";

function StaffRow({ m, venueName }: { m: StaffMember; venueName: string }) {
  const { can } = usePermissions();
  const update = useUpdateStaff();
  const setStatus = useSetStaffStatus();
  const revoked = m.status === "revoked";
  const roles = can("*") ? ASSIGNABLE_ROLES : ASSIGNABLE_ROLES.filter((r) => r !== "venue_manager");

  const onError = (err: unknown) =>
    toast.error((err as ApiException).error?.message ?? "Không cập nhật được");

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b px-4 py-3 last:border-b-0 sm:flex-row sm:items-center",
        revoked && "opacity-60",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 font-medium">
          <span className="truncate">{m.displayName}</span>
          {m.isSelf && <Badge variant="secondary">Bạn</Badge>}
          {revoked && <Badge variant="outline">Đã khoá</Badge>}
        </div>
        <div className="text-muted-foreground text-xs">
          <span className="tabular-nums">{m.phone ?? "—"}</span> · {venueName} · Đăng nhập gần nhất:{" "}
          {formatDateTime(m.lastLoginAt)}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {m.canManage && !revoked ? (
          <Select
            value={m.roleCode}
            onValueChange={(v) =>
              v &&
              v !== m.roleCode &&
              update.mutate(
                { id: m.membershipId, roleCode: v as StaffRole },
                { onSuccess: () => toast.success(`Đã đổi vai trò ${m.displayName}`), onError },
              )
            }
          >
            <SelectTrigger className="w-36">
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
        ) : (
          <Badge variant="secondary" className="w-36 justify-center">
            {ROLE_LABEL[m.roleCode] ?? m.roleCode}
          </Badge>
        )}
        {m.canManage && (
          <Button
            variant={revoked ? "outline" : "ghost"}
            size="sm"
            disabled={setStatus.isPending}
            onClick={() => {
              if (
                !revoked &&
                !window.confirm(`Khoá ${m.displayName}? Nhân viên sẽ không đăng nhập được nữa.`)
              )
                return;
              setStatus.mutate(
                { id: m.membershipId, active: revoked },
                {
                  onSuccess: () => toast.success(revoked ? "Đã mở khoá" : "Đã khoá tài khoản"),
                  onError,
                },
              );
            }}
          >
            {revoked ? <LockOpen className="mr-1 size-4" /> : <Lock className="mr-1 size-4" />}
            {revoked ? "Mở khoá" : "Khoá"}
          </Button>
        )}
      </div>
    </div>
  );
}

/** Lọc danh sách: tất cả / chỉ người toàn chuỗi / 1 cơ sở. */
const FILTER_ALL = "__all__";
const FILTER_TENANT = "__tenant__";

export default function StaffPage() {
  const staff = useStaff();
  const venues = useVenues();
  const { tenantWide } = useAccessibleVenues();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [venueFilter, setVenueFilter] = useState(FILTER_ALL);
  const showFilter = tenantWide && (venues.data?.length ?? 0) > 1;
  const rows = useMemo(() => {
    const all = staff.data ?? [];
    if (!showFilter || venueFilter === FILTER_ALL) return all;
    if (venueFilter === FILTER_TENANT) return all.filter((m) => m.venueId === null);
    return all.filter((m) => m.venueId === venueFilter);
  }, [staff.data, showFilter, venueFilter]);
  const venueName = useMemo(() => {
    const map = new Map((venues.data ?? []).map((v) => [v.id, v.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "Cơ sở khác") : "Toàn bộ cơ sở");
  }, [venues.data]);
  const activeCount = staff.data?.filter((m) => m.status === "active").length ?? 0;

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <MenuToggle />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Nhân viên</h1>
        <Button size="sm" className="ml-auto" onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-1.5 size-4" /> Mời nhân viên
        </Button>
      </header>

      <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            {staff.data ? `${activeCount} người đang hoạt động. ` : ""}
            Khoá tài khoản có hiệu lực ngay; đổi vai trò áp dụng từ thao tác tiếp theo của nhân
            viên.
          </p>
          {showFilter && (
            <Select value={venueFilter} onValueChange={(v) => v && setVenueFilter(v)}>
              <SelectTrigger className="w-full shrink-0 sm:w-56" aria-label="Lọc theo cơ sở">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL}>Tất cả cơ sở</SelectItem>
                <SelectItem value={FILTER_TENANT}>Toàn chuỗi (chủ / quản trị)</SelectItem>
                {(venues.data ?? []).map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Card>
          <CardContent className="p-0">
            {staff.isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : staff.error ? (
              <div className="text-muted-foreground p-8 text-center text-sm">
                {(staff.error as unknown as ApiException).status === 403
                  ? "Bạn không có quyền quản lý nhân viên."
                  : ((staff.error as unknown as ApiException).error?.message ??
                    "Không tải được danh sách.")}
              </div>
            ) : rows.length === 0 ? (
              <div className="text-muted-foreground flex flex-col items-center gap-2 p-10 text-sm">
                <Users className="size-8 opacity-50" />{" "}
                {staff.data?.length ? "Không có nhân viên ở cơ sở này." : "Chưa có nhân viên nào."}
              </div>
            ) : (
              rows.map((m) => (
                <StaffRow key={m.membershipId} m={m} venueName={venueName(m.venueId)} />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <InviteStaffDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
