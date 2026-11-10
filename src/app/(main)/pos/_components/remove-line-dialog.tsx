"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRemoveOrderLine } from "@/hooks/api/use-orders";
import type { ApiException } from "@/lib/api-client";
import type { OrderLine } from "@/types/api";

const REASONS = ["Khách đổi ý", "Bếp hết món", "Gọi nhầm", "Món ra quá lâu"];

/** Bỏ món khỏi đơn. Món đã gửi bếp → huỷ (API yêu cầu quyền quản lý), cần lý do. */
export function RemoveLineDialog({
  orderId,
  line,
  onClose,
}: {
  orderId: string | null;
  line: OrderLine | null;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const remove = useRemoveOrderLine();
  const sent = !!line?.sentToKitchenAt;

  useEffect(() => {
    if (line) setReason("");
  }, [line]);

  const confirm = async () => {
    if (!orderId || !line) return;
    try {
      await remove.mutateAsync({ orderId, lineId: line.id, reason: reason || undefined });
      toast.success(sent ? `Đã huỷ ${line.productSnapshot.name}` : "Đã bỏ món");
      onClose();
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Không bỏ được món");
    }
  };

  return (
    <Dialog open={!!line} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {sent ? "Huỷ món đã gửi bếp" : "Bỏ món"}: {line?.productSnapshot.name}
          </DialogTitle>
          <DialogDescription>
            {sent
              ? "Món đã gửi bếp — cần quyền quản lý. Món sẽ bị gạch trên màn bếp và không tính tiền."
              : "Món chưa gửi bếp sẽ được xoá khỏi đơn."}
          </DialogDescription>
        </DialogHeader>
        {sent && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`h-9 rounded-full border px-3 text-xs font-medium transition-colors ${reason === r ? "border-primary bg-primary/10 text-primary" : "bg-card hover:bg-muted"}`}
                >
                  {r}
                </button>
              ))}
            </div>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Lý do huỷ"
              maxLength={200}
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Giữ lại
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={remove.isPending}>
            {sent ? "Huỷ món" : "Bỏ món"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
