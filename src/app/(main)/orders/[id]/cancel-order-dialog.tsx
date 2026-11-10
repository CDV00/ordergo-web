"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCancelOrder } from "@/hooks/api/use-orders";
import type { Order } from "@/types/api";
import { TEXTAREA_CLASS, errorMessage } from "./utils";

interface Props {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelOrderDialog({ order, open, onOpenChange }: Props) {
  const cancel = useCancelOrder();
  const [reason, setReason] = useState("");

  const close = (next: boolean) => {
    if (!next) setReason("");
    onOpenChange(next);
  };

  const onConfirm = async () => {
    try {
      await cancel.mutateAsync({ id: order.id, reason: reason.trim() || undefined });
      toast.success("Đã huỷ đơn");
      close(false);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Huỷ đơn {order.orderNumber}?</DialogTitle>
          <DialogDescription>
            Đơn sẽ chuyển sang trạng thái &quot;Đã huỷ&quot; và không thể mở lại.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cancel-order-reason">Lý do huỷ</Label>
          <textarea
            id="cancel-order-reason"
            className={TEXTAREA_CLASS}
            placeholder="VD: Khách về, nhập nhầm đơn…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => close(false)} disabled={cancel.isPending}>
            Đóng
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={cancel.isPending}>
            {cancel.isPending ? "Đang huỷ…" : "Huỷ đơn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
