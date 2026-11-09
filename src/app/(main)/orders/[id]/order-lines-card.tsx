"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUpdateOrderLine } from "@/hooks/api/use-orders";
import { KITCHEN_STATUS_CLASS, KITCHEN_STATUS_LABEL, formatTime, formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order, OrderLine } from "@/types/api";
import { RemoveLineDialog } from "./remove-line-dialog";
import { errorMessage } from "./utils";

function LineStatusBadge({ line }: { line: OrderLine }) {
  if (line.kitchenStatus !== "cancelled" && !line.sentToKitchenAt) {
    return (
      <Badge
        variant="outline"
        className="border-dashed border-slate-400 text-slate-700 dark:text-slate-300"
      >
        Chưa gửi bếp
      </Badge>
    );
  }
  return (
    <Badge className={cn("border-transparent", KITCHEN_STATUS_CLASS[line.kitchenStatus])}>
      {KITCHEN_STATUS_LABEL[line.kitchenStatus]}
    </Badge>
  );
}

interface Props {
  order: Order;
  isOpen: boolean;
}

export function OrderLinesCard({ order, isOpen }: Props) {
  const update = useUpdateOrderLine();
  const [removing, setRemoving] = useState<OrderLine | null>(null);

  const changeQty = async (line: OrderLine, quantity: number) => {
    if (quantity < 1) return;
    try {
      await update.mutateAsync({ orderId: order.id, lineId: line.id, quantity });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const activeCount = order.lines.filter((l) => l.kitchenStatus !== "cancelled").length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Danh sách món</CardTitle>
        <CardDescription>{activeCount} món trong đơn</CardDescription>
      </CardHeader>
      <CardContent>
        {order.lines.length === 0 ? (
          <div className="text-muted-foreground py-6 text-center text-sm">
            Đơn hàng này chưa có món nào.
          </div>
        ) : (
          <ul className="divide-y">
            {order.lines.map((line) => {
              const cancelled = line.kitchenStatus === "cancelled";
              const unsent = !line.sentToKitchenAt;
              const canEdit = isOpen && unsent && !cancelled;
              const canRemove = isOpen && !cancelled && line.kitchenStatus !== "served";
              const options = [
                line.variantSnapshot?.name,
                ...line.modifiers.map((m) => m.optionName),
              ].filter(Boolean);
              return (
                <li
                  key={line.id}
                  className={cn(
                    "flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start",
                    cancelled && "opacity-60",
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <UtensilsCrossed className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0 space-y-0.5">
                      <p className={cn("text-sm font-medium", cancelled && "line-through")}>
                        {line.quantity}× {line.productSnapshot.name}
                      </p>
                      {options.length > 0 && (
                        <p className="text-muted-foreground text-xs">{options.join(", ")}</p>
                      )}
                      {line.note && (
                        <p className="text-xs text-amber-700 italic dark:text-amber-400">
                          Ghi chú: {line.note}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <LineStatusBadge line={line} />
                        {line.sentToKitchenAt && (
                          <span className="text-muted-foreground text-xs">
                            Gửi {formatTime(line.sentToKitchenAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end">
                    <span className={cn("text-sm font-semibold", cancelled && "line-through")}>
                      {formatVnd(line.lineTotal.amount)}
                    </span>
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            aria-label="Giảm số lượng"
                            disabled={line.quantity <= 1 || update.isPending}
                            onClick={() => changeQty(line, line.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            aria-label="Tăng số lượng"
                            disabled={update.isPending}
                            onClick={() => changeQty(line, line.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      {canRemove && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          aria-label={unsent ? "Xoá món" : "Huỷ món"}
                          title={unsent ? "Xoá món" : "Huỷ món (cần quyền quản lý)"}
                          onClick={() => setRemoving(line)}
                        >
                          <Trash2 className="text-destructive h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      <RemoveLineDialog orderId={order.id} line={removing} onClose={() => setRemoving(null)} />
    </Card>
  );
}
