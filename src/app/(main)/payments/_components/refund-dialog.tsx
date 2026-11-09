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
import { useRefundPayment, type Payment } from "@/hooks/api/use-payments";
import { formatVnd } from "@/lib/format";
import { errorMessage, refundableAmount } from "./payment-status";

interface Props {
  payment: Payment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Hộp thoại hoàn tiền (cần quyền order.refund — quản lý / chủ quán). */
export function RefundDialog({ payment, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Form nằm trong DialogContent nên bị unmount khi đóng → state tự reset */}
        <RefundForm payment={payment} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function RefundForm({ payment, onDone }: { payment: Payment; onDone: () => void }) {
  const remaining = refundableAmount(payment);
  const [amount, setAmount] = useState(String(remaining));
  const [reason, setReason] = useState("");
  const refund = useRefundPayment();

  const value = Number(amount);
  const invalid = !Number.isInteger(value) || value < 1 || value > remaining;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (invalid) return;
    try {
      await refund.mutateAsync({
        id: payment.id,
        amount: value,
        reason: reason.trim() || undefined,
      });
      toast.success(`Đã hoàn ${formatVnd(value)}`);
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Hoàn tiền</DialogTitle>
        <DialogDescription>
          Đơn {payment.orderNumber} · có thể hoàn tối đa {formatVnd(remaining)}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="refund-amount">Số tiền hoàn (đ)</Label>
        <div className="flex gap-2">
          <Input
            id="refund-amount"
            type="number"
            inputMode="numeric"
            min={1}
            max={remaining}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="min-h-[44px]"
            autoFocus
          />
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px] shrink-0"
            onClick={() => setAmount(String(remaining))}
          >
            Toàn bộ
          </Button>
        </div>
        {amount !== "" && invalid && (
          <p className="text-destructive text-xs">
            Số tiền phải là số nguyên từ 1 đến {formatVnd(remaining)}.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="refund-reason">Lý do</Label>
        <Input
          id="refund-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="VD: Khách trả món, thu nhầm..."
          maxLength={200}
          className="min-h-[44px]"
        />
      </div>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" className="min-h-[44px]" onClick={onDone}>
          Huỷ
        </Button>
        <Button
          type="submit"
          variant="destructive"
          className="min-h-[44px]"
          disabled={invalid || refund.isPending}
        >
          {refund.isPending ? "Đang hoàn..." : `Hoàn ${invalid ? "" : formatVnd(value)}`}
        </Button>
      </DialogFooter>
    </form>
  );
}
