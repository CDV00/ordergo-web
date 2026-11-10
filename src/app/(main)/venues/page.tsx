"use client";

import { useMemo, useState } from "react";
import { Building2, Copy, MapPin, Pencil, Phone, Plus, Store, Users } from "lucide-react";
import { MenuToggle } from "@/components/menu-toggle";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { cn } from "@/lib/utils";
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

const STATUS: Record<
  Venue["status"],
  { label: string; variant: "success" | "warning" | "outline" }
> = {
  active: { label: "Đang hoạt động", variant: "success" },
  inactive: { label: "Tạm ngưng", variant: "warning" },
  archived: { label: "Đã lưu trữ", variant: "outline" },
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
    <Card
      className={cn(
        "flex h-full flex-col transition-shadow hover:shadow-md",
        active && "border-primary/60 ring-primary/15 ring-4",
      )}
    >
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
            )}
          >
            <Store className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base">{venue.name}</CardTitle>
            <div className="mt-1 flex flex-wrap gap-1">
              {active && <Badge variant="soft">Đang chọn</Badge>}
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
          </div>
        </div>
        <p className="text-muted-foreground pt-1 text-xs">
          Mã <span className="text-foreground font-medium">{venue.code}</span> ·{" "}
          {BUSINESS_TYPE_LABELS[venue.businessType] ?? venue.businessType}
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
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

        <div className="bg-muted/60 grid grid-cols-2 gap-2 rounded-xl p-3">
          <div>
            <div className="text-muted-foreground text-xs">Doanh thu hôm nay</div>
            {todayLoading ? (
              <Skeleton className="mt-1 h-5 w-24" />
            ) : (
              <div className="text-primary text-lg font-bold tabular-nums">
                {formatVnd(today?.revenue ?? 0)}
              </div>
            )}
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Đơn hôm nay</div>
            {todayLoading ? (
              <Skeleton className="mt-1 h-5 w-10" />
            ) : (
              <div className="text-lg font-bold tabular-nums">{today?.orders ?? 0}</div>
            )}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-2 border-t pt-3">
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
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <FadeIn className="flex items-start gap-2">
        <MenuToggle className="mt-1" />
        <PageHeader
          className="min-w-0 flex-1"
          icon={Building2}
          title="Chi nhánh"
          description={
            allowed && venues.data
              ? `${list.length} cơ sở · nhân viên gắn với từng cơ sở, chủ quán đổi cơ sở ở thanh bên`
              : "Quản lý các cơ sở trong chuỗi"
          }
          actions={
            allowed && (
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="size-4" /> Thêm chi nhánh
              </Button>
            )
          }
        />
      </FadeIn>

      {!allowed ? (
        <EmptyState
          icon={Building2}
          className="bg-muted/30"
          title="Không có quyền"
          description="Chỉ chủ quán hoặc quản trị toàn chuỗi mới quản lý được chi nhánh."
        />
      ) : venues.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-2xl" />
          ))}
        </div>
      ) : venues.error ? (
        <EmptyState
          icon={Building2}
          className="bg-muted/30"
          title="Không tải được danh sách chi nhánh."
        />
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((v) => (
            <StaggerItem key={v.id}>
              <VenueCard
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
            </StaggerItem>
          ))}
        </Stagger>
      )}

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
