"use client";

import { useState } from "react";
import { Clock, LogOut, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import { canUseShift, useCurrentShift, type Shift } from "@/hooks/api/use-shifts";
import { formatTime, formatVnd } from "@/lib/format";
import { ShiftCloseDialog } from "./shift-close-dialog";
import { ShiftOpenDialog } from "./shift-open-dialog";

/**
 * Chỉ báo ca trên header POS: "Ca mở từ 08:02 · tiền đầu ca 500.000đ" + nút đóng ca,
 * hoặc nút "Mở ca" (nhắc thu ngân mở ca trước khi thu tiền). Ẩn với người không có quyền ca.
 */
export function ShiftIndicator() {
  const { permissions } = usePermissions();
  const canOpen = canUseShift(permissions, "open");
  const canClose = canUseShift(permissions, "close");
  const current = useCurrentShift(canOpen || canClose);
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  // Ảnh chụp ca lúc bấm "Đóng ca": sau khi đóng, query ca hiện tại về null nhưng hộp thoại
  // vẫn cần dữ liệu để hiển thị màn hình tổng kết.
  const [closing, setClosing] = useState<Shift | null>(null);

  if ((!canOpen && !canClose) || current.isLoading || current.isError) return null;
  const shift = current.data ?? null;
  const dialogShift = shift ?? closing;

  return (
    <div className="ml-auto flex shrink-0 items-center gap-2">
      {shift ? (
        <>
          <span className="text-muted-foreground hidden items-center gap-1 text-xs lg:flex">
            <Clock className="h-3.5 w-3.5" />
            Ca mở từ {formatTime(shift.openedAt)} · tiền đầu ca {formatVnd(shift.openingCash)}
          </span>
          <span className="text-muted-foreground flex items-center gap-1 text-xs lg:hidden">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(shift.openedAt)}
          </span>
          {canClose && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-[36px]"
              onClick={() => {
                setClosing(shift);
                setCloseDialog(true);
                void current.refetch();
              }}
            >
              <LogOut className="size-4 sm:mr-1" />
              <span className="hidden sm:inline">Đóng ca</span>
            </Button>
          )}
        </>
      ) : (
        canOpen && (
          <Button
            size="sm"
            variant="outline"
            className="min-h-[36px] border-amber-400 text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950"
            onClick={() => setOpenDialog(true)}
            title="Chưa mở ca — tiền thu sẽ không được tính vào ca nào"
          >
            <PlayCircle className="mr-1 size-4" />
            Mở ca
          </Button>
        )
      )}

      <ShiftOpenDialog open={openDialog} onOpenChange={setOpenDialog} />
      {dialogShift && (
        <ShiftCloseDialog
          shift={dialogShift}
          open={closeDialog}
          onOpenChange={(o) => {
            setCloseDialog(o);
            if (!o) setClosing(null);
          }}
        />
      )}
    </div>
  );
}
