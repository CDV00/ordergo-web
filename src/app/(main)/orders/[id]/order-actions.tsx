"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRightLeft, ChefHat, CreditCard, Printer, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSendOrderToKitchen } from "@/hooks/api/use-orders";
import type { Order } from "@/types/api";
import { CancelOrderDialog } from "./cancel-order-dialog";
import { MoveTableDialog } from "./move-table-dialog";
import { errorMessage } from "./utils";

interface Props {
  order: Order;
  isOpen: boolean;
}

export function OrderActions({ order, isOpen }: Props) {
  const send = useSendOrderToKitchen();
  const [moveOpen, setMoveOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const unsentCount = order.lines.filter(
    (l) => !l.sentToKitchenAt && l.kitchenStatus !== "cancelled",
  ).length;
  const canPrint = order.status !== "cancelled";

  const onSend = async () => {
    try {
      await send.mutateAsync(order.id);
      toast.success("Đã gửi xuống bếp");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const printButton = canPrint && (
    <Button asChild variant="outline" className="min-h-[44px]">
      <Link href={`/print/receipt/${order.id}`} target="_blank" rel="noopener noreferrer">
        <Printer className="mr-2 h-4 w-4" /> In hoá đơn
      </Link>
    </Button>
  );

  if (!isOpen) return <div className="flex flex-wrap gap-2">{printButton}</div>;

  return (
    <div className="flex flex-wrap gap-2">
      {unsentCount > 0 && (
        <Button className="min-h-[44px]" onClick={onSend} disabled={send.isPending}>
          <ChefHat className="mr-2 h-4 w-4" />
          {send.isPending ? "Đang gửi…" : `Gửi bếp (${unsentCount})`}
        </Button>
      )}
      <Button asChild variant="secondary" className="min-h-[44px]">
        <Link href="/pos">
          <CreditCard className="mr-2 h-4 w-4" /> Thu tiền tại POS
        </Link>
      </Button>
      {order.orderType === "dine_in" && (
        <Button variant="outline" className="min-h-[44px]" onClick={() => setMoveOpen(true)}>
          <ArrowRightLeft className="mr-2 h-4 w-4" /> Chuyển bàn
        </Button>
      )}
      {printButton}
      <Button
        variant="outline"
        className="text-destructive hover:text-destructive min-h-[44px]"
        onClick={() => setCancelOpen(true)}
      >
        <XCircle className="mr-2 h-4 w-4" /> Huỷ đơn
      </Button>

      <MoveTableDialog order={order} open={moveOpen} onOpenChange={setMoveOpen} />
      <CancelOrderDialog order={order} open={cancelOpen} onOpenChange={setCancelOpen} />
    </div>
  );
}
