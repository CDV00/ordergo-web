"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
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
import { useOpenShift } from "@/hooks/api/use-shifts";
import type { ApiException } from "@/lib/api-client";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

const QUICK_AMOUNTS = [0, 200_000, 500_000, 1_000_000, 2_000_000];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Mở ca: nhập tiền mặt đầu ca trong két. */
export function ShiftOpenDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Form nằm trong DialogContent nên bị unmount khi đóng → state tự reset */}
        <OpenShiftForm onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function OpenShiftForm({ onDone }: { onDone: () => void }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const openShift = useOpenShift();

  const value = amount === "" ? NaN : Number(amount);
  const invalid = !Number.isInteger(value) || value < 0;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (invalid) return;
    try {
      await openShift.mutateAsync({ openingCash: value, note: note.trim() || undefined });
      toast.success(`Đã mở ca · tiền đầu ca ${formatVnd(value)}`);
      onDone();
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Không mở được ca.");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Mở ca</DialogTitle>
        <DialogDescription>Đếm tiền mặt trong két và nhập số tiền đầu ca.</DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="opening-cash">Tiền đầu ca (đ)</Label>
        <Input
          id="opening-cash"
          type="number"
          inputMode="numeric"
          min={0}
          step={1000}
          autoFocus
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="min-h-[44px] text-lg tabular-nums"
        />
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((a) => (
            <Button
              key={a}
              type="button"
              variant="outline"
              size="sm"
              className={cn("min-h-[40px]", value === a && "border-primary bg-primary/10")}
              onClick={() => setAmount(String(a))}
            >
              {formatVnd(a)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="opening-note">Ghi chú (không bắt buộc)</Label>
        <Input
          id="opening-note"
          maxLength={500}
          placeholder="VD: Ca sáng"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-[44px]"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" className="min-h-[44px]" onClick={onDone}>
          Huỷ
        </Button>
        <Button type="submit" className="min-h-[44px]" disabled={invalid || openShift.isPending}>
          {openShift.isPending ? "Đang mở ca..." : "Mở ca"}
        </Button>
      </DialogFooter>
    </form>
  );
}
