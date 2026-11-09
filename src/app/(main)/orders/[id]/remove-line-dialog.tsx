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
import { useRemoveOrderLine } from "@/hooks/api/use-orders";
import type { OrderLine } from "@/types/api";
import { TEXTAREA_CLASS, errorMessage } from "./utils";

interface Props {
  orderId: string;
  /** null = đóng dialog */
  line: OrderLine | null;
  onClose: () => void;
}

/** Xác nhận bỏ món. Món chưa gửi bếp → xoá hẳn; đã gửi → huỷ (cần quyền quản lý). */
export function RemoveLineDialog({ orderId, line, onClose }: Props) {
  const remove = useRemoveOrderLine();
  const [reason, setReason] = useState("");
  const sent = !!line?.sentToKitchenAt;

  const close = () => {
    setReason("");
    onClose();
  };

  const onConfirm = async () => {
    if (!line) return;
    try {
      await remove.mutateAsync({
        orderId,
        lineId: line.id,
        reason: sent ? reason.trim() || undefined : undefined,
      });
      toast.success(sent ? "Đã huỷ món" : "Đã xoá món");
      close();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Dialog open={!!line} onOpenChange={(open) => !open && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{sent ? "Huỷ món đã gửi bếp" : "Xoá món"}</DialogTitle>
          <DialogDescription>
            {line && (
              <>
                {line.quantity}× {line.productSnapshot.name}
                {line.variantSnapshot ? ` (${line.variantSnapshot.name})` : ""}
              </>
            )}
            {sent
              ? " — món đã gửi bếp sẽ được đánh dấu huỷ. Thao tác này cần quyền quản lý."
              : " — món chưa gửi bếp sẽ bị xoá khỏi đơn."}
          </DialogDescription>
        </DialogHeader>
        {sent && (
          <div className="space-y-2">
            <Label htmlFor="remove-line-reason">Lý do (không bắt buộc)</Label>
            <textarea
              id="remove-line-reason"
              className={TEXTAREA_CLASS}
              placeholder="VD: Khách đổi ý, bếp hết nguyên liệu…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={close} disabled={remove.isPending}>
            Đóng
          </Button>
          <Button
            className="bg-destructive hover:bg-destructive/90 text-white"
            onClick={onConfirm}
            disabled={remove.isPending}
          >
            {remove.isPending ? "Đang xử lý…" : sent ? "Huỷ món" : "Xoá món"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
