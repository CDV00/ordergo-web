"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMoveOrderTable } from "@/hooks/api/use-orders";
import { useTables } from "@/hooks/api/use-tables";
import { TABLE_STATUS_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order, RestaurantTable } from "@/types/api";
import { errorMessage } from "./utils";

interface Props {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoveTableDialog({ order, open, onOpenChange }: Props) {
  const tables = useTables();
  const move = useMoveOrderTable();
  const [selected, setSelected] = useState<string | null>(null);

  const candidates = (tables.data ?? []).filter((t) => t.id !== order.tableId);
  const grouped = candidates.reduce<Record<string, RestaurantTable[]>>((acc, t) => {
    (acc[t.section] ??= []).push(t);
    return acc;
  }, {});

  const close = (next: boolean) => {
    if (!next) setSelected(null);
    onOpenChange(next);
  };

  const onConfirm = async () => {
    if (!selected) return;
    try {
      await move.mutateAsync({ orderId: order.id, tableId: selected });
      const name = candidates.find((t) => t.id === selected)?.name;
      toast.success(name ? `Đã chuyển sang ${name}` : "Đã chuyển bàn");
      close(false);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chuyển bàn</DialogTitle>
          <DialogDescription>
            Đơn {order.orderNumber}
            {order.tableName ? ` đang ở ${order.tableName}` : ""}. Chọn bàn mới.
          </DialogDescription>
        </DialogHeader>

        {tables.isLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : tables.isError ? (
          <p className="text-destructive text-sm">Không tải được danh sách bàn.</p>
        ) : candidates.length === 0 ? (
          <p className="text-muted-foreground text-sm">Không có bàn nào khác.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([section, list]) => (
              <div key={section} className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium uppercase">{section}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {list.map((t) => {
                    const disabled = t.status === "out_of_order";
                    return (
                      <button
                        key={t.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSelected(t.id)}
                        className={cn(
                          "rounded-md border-2 p-2 text-left text-sm transition-colors",
                          "hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50",
                          selected === t.id ? "border-primary bg-primary/5" : "border-border",
                        )}
                      >
                        <span className="block font-medium">{t.name}</span>
                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                          <Users className="h-3 w-3" /> {t.capacity} ·{" "}
                          {TABLE_STATUS_LABEL[t.status]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => close(false)} disabled={move.isPending}>
            Đóng
          </Button>
          <Button onClick={onConfirm} disabled={!selected || move.isPending}>
            {move.isPending ? "Đang chuyển…" : "Chuyển bàn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
