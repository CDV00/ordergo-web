"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  return (
    <ShiftsShell>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Lịch sử ca làm</h2>
          <p className="text-muted-foreground text-sm">Đối soát tiền mặt đầu ca / cuối ca</p>
        </div>
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
      </div>

      {isForbidden(shifts.error) ? (
        <StateMessage
          title="Bạn không có quyền xem ca làm"
          description="Chỉ thu ngân, quản lý hoặc chủ quán mới xem được lịch sử ca."
        />
      ) : (
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
      )}
    </ShiftsShell>
  );
}
