"use client";

import { useMemo, useState } from "react";
import { Info, Lock, LockOpen, ShieldAlert, UserCog, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { MenuToggle } from "@/components/menu-toggle";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
        "hover:bg-muted/40 flex flex-col gap-3 border-b px-4 py-3.5 transition-colors last:border-b-0 sm:flex-row sm:items-center sm:px-5",
        revoked && "opacity-60",
      )}
    >
      <div
        className={cn(
          "hidden size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold sm:flex",
          revoked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
        )}
        aria-hidden
      >
        {m.displayName.trim().split(/\s+/).pop()?.[0]?.toUpperCase() ?? "?"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 font-medium">
          <span className="truncate">{m.displayName}</span>
          {m.isSelf && <Badge variant="soft">Bạn</Badge>}
          {revoked && <Badge variant="warning">Đã khoá</Badge>}
        </div>
        <div className="text-muted-foreground mt-0.5 text-xs">
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
            <SelectTrigger className="bg-card w-36">
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
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6 lg:p-8">
      <FadeIn className="flex items-start gap-2">
        <MenuToggle className="mt-1" />
        <PageHeader
          className="min-w-0 flex-1"
          icon={UserCog}
          title="Nhân viên"
          description={
            staff.data ? `${activeCount} người đang hoạt động` : "Quản lý tài khoản và vai trò"
          }
          actions={
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="size-4" /> Mời nhân viên
            </Button>
          }
        />
      </FadeIn>

      <FadeIn delay={0.05} className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground flex items-start gap-2 text-sm">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Khoá tài khoản có hiệu lực ngay; đổi vai trò áp dụng từ thao tác tiếp theo của nhân
              viên.
            </span>
          </p>
          {showFilter && (
            <Select value={venueFilter} onValueChange={(v) => v && setVenueFilter(v)}>
              <SelectTrigger
                className="bg-card w-full shrink-0 sm:w-56"
                aria-label="Lọc theo cơ sở"
              >
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
        {staff.isLoading ? (
          <Card className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </Card>
        ) : staff.error ? (
          <EmptyState
            icon={ShieldAlert}
            className="bg-muted/30"
            title={
              (staff.error as unknown as ApiException).status === 403
                ? "Bạn không có quyền quản lý nhân viên."
                : ((staff.error as unknown as ApiException).error?.message ??
                  "Không tải được danh sách.")
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Users}
            className="bg-muted/30"
            title={
              staff.data?.length ? "Không có nhân viên ở cơ sở này." : "Chưa có nhân viên nào."
            }
            action={
              <Button variant="outline" onClick={() => setInviteOpen(true)}>
                <UserPlus className="size-4" /> Mời nhân viên
              </Button>
            }
          />
        ) : (
          <Card className="overflow-hidden">
            {rows.map((m) => (
              <StaffRow key={m.membershipId} m={m} venueName={venueName(m.venueId)} />
            ))}
          </Card>
        )}
      </FadeIn>

      <InviteStaffDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
