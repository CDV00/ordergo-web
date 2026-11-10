"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCloseShift, type Shift } from "@/hooks/api/use-shifts";
import type { ApiException } from "@/lib/api-client";
import { formatDateTime, formatTime, formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { differenceClass, formatDifference, ShiftSummaryView } from "./shift-summary";

interface Props {
  /** Ca đang mở (số liệu tạm tính mới nhất). */
  shift: Shift;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Đóng ca: nhập tiền mặt đếm được, xem chênh lệch, ghi chú khi lệch → màn hình tổng kết. */
export function ShiftCloseDialog({ shift, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <CloseShiftFlow shift={shift} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CloseShiftFlow({ shift, onDone }: { shift: Shift; onDone: () => void }) {
  // Giữ ca đã đóng ở state riêng: sau khi đóng, query "ca hiện tại" trả null.
  const [closed, setClosed] = useState<Shift | null>(null);
  if (closed) return <ClosedSummary shift={closed} onDone={onDone} />;
  return <CloseShiftForm shift={shift} onClosed={setClosed} onCancel={onDone} />;
}

function CloseShiftForm({
  shift,
  onClosed,
  onCancel,
}: {
  shift: Shift;
  onClosed: (s: Shift) => void;
  onCancel: () => void;
}) {
  const [counted, setCounted] = useState("");
  const [note, setNote] = useState("");
  const closeShift = useCloseShift();

  const expected = shift.expectedCash ?? shift.openingCash;
  const value = counted === "" ? NaN : Number(counted);
  const validAmount = Number.isInteger(value) && value >= 0;
  const diff = validAmount ? value - expected : 0;
  const noteRequired = validAmount && diff !== 0;
  const invalid = !validAmount || (noteRequired && !note.trim());

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (invalid) return;
    try {
      const res = await closeShift.mutateAsync({
        id: shift.id,
        countedCash: value,
        note: note.trim() || undefined,
      });
      toast.success("Đã đóng ca");
      onClosed(res);
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Không đóng được ca.");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Đóng ca</DialogTitle>
        <DialogDescription>
          Ca mở lúc {formatTime(shift.openedAt)}
          {shift.openedByName ? ` · ${shift.openedByName}` : ""}. Đếm tiền mặt trong két và nhập số
          tiền thực tế.
        </DialogDescription>
      </DialogHeader>

      <div className="bg-muted/50 space-y-1 rounded-xl border p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tiền đầu ca</span>
          <span className="tabular-nums">{formatVnd(shift.openingCash)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tiền mặt thu trong ca</span>
          <span className="tabular-nums">+{formatVnd(shift.summary?.cashReceived ?? 0)}</span>
        </div>
        {(shift.summary?.cashRefunds ?? 0) > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tiền mặt hoàn khách</span>
            <span className="tabular-nums">−{formatVnd(shift.summary?.cashRefunds ?? 0)}</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-1 font-semibold">
          <span>Tiền mặt dự kiến</span>
          <span className="tabular-nums">{formatVnd(expected)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="counted-cash">Tiền mặt đếm được (đ)</Label>
        <div className="flex gap-2">
          <Input
            id="counted-cash"
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            autoFocus
            placeholder={String(expected)}
            value={counted}
            onChange={(e) => setCounted(e.target.value)}
            className="h-12 rounded-xl text-lg font-bold tabular-nums"
          />
          <Button
            type="button"
            variant="outline"
            className="h-12 shrink-0 rounded-xl"
            onClick={() => setCounted(String(expected))}
          >
            Đúng bằng dự kiến
          </Button>
        </div>
        {validAmount && (
          <p
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-semibold",
              diff === 0 ? "bg-success-soft" : "bg-warning-soft",
              differenceClass(diff),
            )}
          >
            Chênh lệch: {formatDifference(diff)}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="close-note">
          Ghi chú {noteRequired ? <span className="text-destructive">*</span> : "(không bắt buộc)"}
        </Label>
        <Input
          id="close-note"
          maxLength={500}
          placeholder={noteRequired ? "Lý do chênh lệch (bắt buộc)" : "Ghi chú cuối ca"}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-invalid={noteRequired && !note.trim()}
          className="min-h-[44px]"
        />
        {noteRequired && !note.trim() && (
          <p className="text-muted-foreground text-xs">
            Tiền đếm lệch với dự kiến — cần ghi lý do để đóng ca.
          </p>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" className="min-h-[44px]" onClick={onCancel}>
          Huỷ
        </Button>
        <Button type="submit" className="min-h-[44px]" disabled={invalid || closeShift.isPending}>
          {closeShift.isPending ? "Đang đóng ca..." : "Đóng ca"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ClosedSummary({ shift, onDone }: { shift: Shift; onDone: () => void }) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CheckCircle2 className="text-success h-5 w-5" />
          Tổng kết ca
        </DialogTitle>
        <DialogDescription>
          {formatDateTime(shift.openedAt)} → {formatDateTime(shift.closedAt)}
        </DialogDescription>
      </DialogHeader>
      <ShiftSummaryView shift={shift} />
      {shift.note && (
        <p className="text-muted-foreground border-t pt-3 text-sm">Ghi chú: {shift.note}</p>
      )}
      <DialogFooter>
        <Button variant="outline" className="min-h-[44px]" asChild>
          <Link href={`/shifts/${shift.id}`}>Xem chi tiết</Link>
        </Button>
        <Button className="min-h-[44px]" onClick={onDone}>
          Xong
        </Button>
      </DialogFooter>
    </div>
  );
}
