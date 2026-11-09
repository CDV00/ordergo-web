"use client";

import { useMemo, useState } from "react";
import { Building2, Copy, MapPin, Pencil, Phone, Plus, Users } from "lucide-react";
import { MenuToggle } from "@/components/menu-toggle";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { useVenues } from "@/hooks/api/use-tenant";
import { useStaff } from "@/hooks/api/use-staff";
import { ALL_VENUES, useTodaySummary, type VenueBreakdownRow } from "@/hooks/api/use-reports";
import { usePermissions } from "@/hooks/use-permissions";
import { useSwitchVenue } from "@/hooks/use-switch-venue";
import { formatVnd } from "@/lib/format";
import type { Venue } from "@/types/api";
import { BUSINESS_TYPE_LABELS, VenueFormDialog } from "./_components/venue-form-dialog";
import { CopyMenuDialog } from "./_components/copy-menu-dialog";

const STATUS: Record<Venue["status"], { label: string; className: string }> = {
  active: {
    label: "Đang hoạt động",
    className:
      "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  inactive: {
    label: "Tạm ngưng",
    className:
      "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  archived: { label: "Đã lưu trữ", className: "text-muted-foreground" },
};

function VenueCard({
  venue,
  active,
  staffCount,
  today,
  todayLoading,
  onEdit,
  onCopyMenu,
  onSwitch,
}: {
  venue: Venue;
  active: boolean;
  staffCount: number | null;
  today: VenueBreakdownRow | undefined;
  todayLoading: boolean;
  onEdit: () => void;
  onCopyMenu: () => void;
  onSwitch: () => void;
}) {
  const status = STATUS[venue.status] ?? STATUS.active;
  const address = [venue.address?.line1, venue.address?.city].filter(Boolean).join(", ");
  return (
    <Card className={active ? "border-primary" : undefined}>
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="min-w-0 text-base">
            <span className="truncate">{venue.name}</span>
          </CardTitle>
          <div className="flex shrink-0 gap-1">
            {active && <Badge variant="secondary">Đang chọn</Badge>}
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          Mã <span className="text-foreground font-medium">{venue.code}</span> ·{" "}
          {BUSINESS_TYPE_LABELS[venue.businessType] ?? venue.businessType}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-muted-foreground space-y-1 text-sm">
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            <span>{address || "Chưa có địa chỉ"}</span>
          </p>
          {venue.contact?.phone && (
            <p className="flex items-center gap-2">
              <Phone className="size-4 shrink-0" />
              <span className="tabular-nums">{venue.contact.phone}</span>
            </p>
          )}
          <p className="flex items-center gap-2">
            <Users className="size-4 shrink-0" />
            <span>{staffCount === null ? "—" : `${staffCount} nhân viên`}</span>
          </p>
        </div>

        <div className="bg-muted/60 grid grid-cols-2 gap-2 rounded-lg p-3">
          <div>
            <div className="text-muted-foreground text-xs">Doanh thu hôm nay</div>
            {todayLoading ? (
              <Skeleton className="mt-1 h-5 w-24" />
            ) : (
              <div className="font-semibold tabular-nums">{formatVnd(today?.revenue ?? 0)}</div>
            )}
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Đơn hôm nay</div>
            {todayLoading ? (
              <Skeleton className="mt-1 h-5 w-10" />
            ) : (
              <div className="font-semibold tabular-nums">{today?.orders ?? 0}</div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="mr-1.5 size-4" /> Sửa
          </Button>
          <Button size="sm" variant="outline" onClick={onCopyMenu}>
            <Copy className="mr-1.5 size-4" /> Sao chép menu từ cơ sở…
          </Button>
          {!active && venue.status !== "archived" && (
            <Button size="sm" variant="ghost" onClick={onSwitch}>
              Làm việc tại đây
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function VenuesPage() {
  const { activeVenueId } = useAuth();
  const { can, tenantWide } = usePermissions();
  const allowed = tenantWide && can("venue.manage");
  const venues = useVenues();
  const staff = useStaff();
  const today = useTodaySummary(ALL_VENUES, { enabled: allowed && can("report.view") });
  const switchTo = useSwitchVenue();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Venue | null>(null);
  const [copyTarget, setCopyTarget] = useState<Venue | null>(null);

  const staffCount = useMemo(() => {
    if (!staff.data) return () => null;
    const counts = new Map<string, number>();
    for (const m of staff.data) {
      if (m.status !== "active" || !m.venueId) continue;
      counts.set(m.venueId, (counts.get(m.venueId) ?? 0) + 1);
    }
    return (id: string) => counts.get(id) ?? 0;
  }, [staff.data]);
  const todayByVenue = useMemo(
    () => new Map((today.data?.byVenue ?? []).map((r) => [r.venueId, r])),
    [today.data],
  );
  const list = venues.data ?? [];

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <MenuToggle />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Chi nhánh</h1>
        {allowed && (
          <Button
            size="sm"
            className="ml-auto"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-1.5 size-4" /> Thêm chi nhánh
          </Button>
        )}
      </header>

      <div className="mx-auto w-full max-w-6xl space-y-4 p-4 md:p-6">
        {!allowed ? (
          <Card>
            <CardContent className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-center text-sm">
              <Building2 className="size-8 opacity-50" />
              Chỉ chủ quán hoặc quản trị toàn chuỗi mới quản lý được chi nhánh.
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">
              {venues.data ? `${list.length} cơ sở. ` : ""}
              Nhân viên gắn với từng cơ sở; chủ quán làm việc ở mọi cơ sở và đổi cơ sở ở thanh bên.
            </p>
            {venues.isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full rounded-xl" />
                ))}
              </div>
            ) : venues.error ? (
              <Card>
                <CardContent className="text-muted-foreground py-10 text-center text-sm">
                  Không tải được danh sách chi nhánh.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {list.map((v) => (
                  <VenueCard
                    key={v.id}
                    venue={v}
                    active={v.id === activeVenueId}
                    staffCount={staffCount(v.id)}
                    today={todayByVenue.get(v.id)}
                    todayLoading={today.isLoading}
                    onEdit={() => {
                      setEditing(v);
                      setFormOpen(true);
                    }}
                    onCopyMenu={() => setCopyTarget(v)}
                    onSwitch={() => switchTo(v.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <VenueFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        venue={editing}
        defaultBusinessType={list[0]?.businessType}
        onCreated={(v) => setCopyTarget(v)}
      />
      <CopyMenuDialog
        target={copyTarget}
        venues={list}
        onOpenChange={(open) => !open && setCopyTarget(null)}
      />
    </div>
  );
}
