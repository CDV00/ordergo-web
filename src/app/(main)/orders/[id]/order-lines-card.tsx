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
        className="border-muted-foreground/40 text-muted-foreground border-dashed"
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
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-lg">Danh sách món</CardTitle>
          <CardDescription>{activeCount} món trong đơn</CardDescription>
        </div>
        <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
          <UtensilsCrossed className="size-5" />
        </div>
      </CardHeader>
      <CardContent>
        {order.lines.length === 0 ? (
          <div className="text-muted-foreground rounded-xl border border-dashed py-8 text-center text-sm">
            Đơn hàng này chưa có món nào.
          </div>
        ) : (
          <ul className="-mx-2 space-y-1">
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
                    "hover:bg-muted/50 flex flex-col gap-2 rounded-xl px-2 py-3 transition-colors sm:flex-row sm:items-start",
                    cancelled && "opacity-60",
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="bg-muted tabular flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg px-1.5 text-sm font-bold">
                      {line.quantity}
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <p className={cn("font-medium", cancelled && "line-through")}>
                        <span className="sr-only">{line.quantity}× </span>
                        {line.productSnapshot.name}
                      </p>
                      {options.length > 0 && (
                        <p className="text-muted-foreground text-xs">{options.join(", ")}</p>
                      )}
                      {line.note && (
                        <p className="bg-warning-soft dark:text-warning inline-block rounded-md px-2 py-0.5 text-xs font-medium text-[oklch(0.45_0.12_60)]">
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
                    <span className={cn("tabular font-semibold", cancelled && "line-through")}>
                      {formatVnd(line.lineTotal.amount)}
                    </span>
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <>
                          <Button
                            size="icon"
                            variant="outline"
                            className="size-10"
                            aria-label="Giảm số lượng"
                            disabled={line.quantity <= 1 || update.isPending}
                            onClick={() => changeQty(line, line.quantity - 1)}
                          >
                            <Minus className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="size-10"
                            aria-label="Tăng số lượng"
                            disabled={update.isPending}
                            onClick={() => changeQty(line, line.quantity + 1)}
                          >
                            <Plus className="size-4" />
                          </Button>
                        </>
                      )}
                      {canRemove && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-10"
                          aria-label={unsent ? "Xoá món" : "Huỷ món"}
                          title={unsent ? "Xoá món" : "Huỷ món (cần quyền quản lý)"}
                          onClick={() => setRemoving(line)}
                        >
                          <Trash2 className="text-destructive size-4" />
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
