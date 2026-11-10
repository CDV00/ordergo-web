"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, Clock, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { useShifts } from "@/hooks/api/use-shifts";
import { todayYmd } from "@/lib/format";
import { ShiftList, ShiftListSkeleton } from "./_components/shift-list";
import { errorMessage, isForbidden, ShiftsShell, StateMessage } from "./_components/shifts-shell";

/** Lùi `days` ngày từ YYYY-MM-DD (lịch thuần). */
function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

export default function ShiftsPage() {
  const [to, setTo] = useState(todayYmd);
  const [from, setFrom] = useState(() => addDays(todayYmd(), -6));
  const shifts = useShifts({ from, to });

  // Tổng hợp nhanh trên danh sách ca đang xem
  const stats = useMemo(() => {
    const list = shifts.data ?? [];
    return {
      count: list.length,
      open: list.filter((s) => s.status === "open").length,
      counted: list.reduce((sum, s) => sum + (s.countedCash ?? 0), 0),
      mismatched: list.filter((s) => s.status !== "open" && (s.difference ?? 0) !== 0).length,
    };
  }, [shifts.data]);

  const filters = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="space-y-1">
        <Label htmlFor="shift-from" className="text-xs">
          Từ ngày
        </Label>
        <Input
          id="shift-from"
          type="date"
          value={from}
          max={to}
          onChange={(e) => setFrom(e.target.value || addDays(to, -6))}
          className="min-h-[44px] sm:w-[170px]"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="shift-to" className="text-xs">
          Đến ngày
        </Label>
        <Input
          id="shift-to"
          type="date"
          value={to}
          min={from}
          onChange={(e) => setTo(e.target.value || todayYmd())}
          className="min-h-[44px] sm:w-[170px]"
        />
      </div>
    </div>
  );

  return (
    <ShiftsShell
      header={
        <PageHeader
          icon={CalendarClock}
          title="Ca làm"
          description="Lịch sử ca · đối soát tiền mặt đầu ca / cuối ca"
          actions={filters}
        />
      }
    >
      {isForbidden(shifts.error) ? (
        <StateMessage
          title="Bạn không có quyền xem ca làm"
          description="Chỉ thu ngân, quản lý hoặc chủ quán mới xem được lịch sử ca."
        />
      ) : (
        <>
          {shifts.isLoading ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[124px] rounded-2xl" />
              ))}
            </div>
          ) : (
            !shifts.error && (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Số ca" value={stats.count} icon={CalendarClock} tone="primary" />
                <StatCard
                  label="Ca đang mở"
                  value={stats.open}
                  icon={Clock}
                  tone={stats.open > 0 ? "info" : "neutral"}
                />
                <StatCard
                  label="Tiền mặt đếm được"
                  value={stats.counted}
                  format="vnd"
                  icon={Wallet}
                  tone="success"
                  hint="Tổng các ca đã đóng"
                />
                <StatCard
                  label="Ca lệch tiền"
                  value={stats.mismatched}
                  icon={AlertTriangle}
                  tone={stats.mismatched > 0 ? "warning" : "neutral"}
                  hint={stats.mismatched > 0 ? "Cần xem ghi chú đối soát" : "Không có chênh lệch"}
                />
              </div>
            )
          )}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl">Danh sách ca</CardTitle>
              <CardDescription>
                {shifts.data
                  ? `${shifts.data.length} ca · mới nhất trước`
                  : "Chọn một ca để xem chi tiết"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {shifts.isLoading ? (
                <ShiftListSkeleton />
              ) : shifts.error ? (
                <StateMessage
                  title="Không tải được danh sách ca"
                  description={errorMessage(shifts.error)}
                  action={
                    <Button className="min-h-[44px]" onClick={() => void shifts.refetch()}>
                      Thử lại
                    </Button>
                  }
                />
              ) : (
                <ShiftList shifts={shifts.data ?? []} />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </ShiftsShell>
  );
}
