"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MenuToggle } from "@/components/menu-toggle";
import { Separator } from "@/components/ui/separator";
import { useOrders, useCancelOrder, useSendOrderToKitchen } from "@/hooks/api/use-orders";
import { ApiException } from "@/lib/api-client";
import { toast } from "sonner";
import type { OrderStatus } from "@/types/api";

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

const STATUS_LABELS: Record<
  OrderStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Nháp", variant: "outline" },
  sent: { label: "Đã gửi bếp", variant: "secondary" },
  in_progress: { label: "Đang làm", variant: "default" },
  ready: { label: "Sẵn sàng", variant: "default" },
  served: { label: "Đã giao", variant: "secondary" },
  paid: { label: "Đã thanh toán", variant: "default" },
  refunded: { label: "Hoàn tiền", variant: "destructive" },
  cancelled: { label: "Đã huỷ", variant: "destructive" },
};

export default function OrdersPage() {
  const orders = useOrders();
  const send = useSendOrderToKitchen();
  const cancel = useCancelOrder();

  const onSend = async (id: string) => {
    try {
      await send.mutateAsync(id);
      toast.success("Đã gửi xuống bếp");
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Lỗi");
    }
  };

  const onCancel = async (id: string) => {
    const reason = prompt("Lý do huỷ?");
    if (reason === null) return;
    try {
      await cancel.mutateAsync({ id, reason });
      toast.success("Đã huỷ đơn");
    } catch (err) {
      toast.error((err as ApiException).error?.message ?? "Lỗi");
    }
  };

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <MenuToggle />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Đơn hàng</h1>
      </header>

      <main className="flex-1 space-y-4 p-4 md:p-6">
        {orders.isLoading ? (
          <p className="text-muted-foreground">Đang tải...</p>
        ) : orders.data?.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-12 text-center">
              Chưa có đơn hàng nào.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {orders.data?.map((o) => (
              <Card key={o.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{o.orderNumber}</span>
                    <Badge variant={STATUS_LABELS[o.status].variant}>
                      {STATUS_LABELS[o.status].label}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {o.tableName ?? (o.orderType === "takeaway" ? "Mang về" : "—")} ·{" "}
                    {new Date(o.createdAt).toLocaleString("vi-VN")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-1 text-sm">
                    {o.lines.map((l) => (
                      <li key={l.id} className="flex justify-between">
                        <span>
                          {l.quantity}× {l.productSnapshot.name}
                          {l.note ? <em className="text-muted-foreground"> ({l.note})</em> : null}
                        </span>
                        <span className="text-muted-foreground">
                          {formatVnd(l.lineTotal.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Tổng</span>
                    <span>{formatVnd(o.pricing.total.amount)}</span>
                  </div>
                  {o.status === "draft" && (
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => onSend(o.id)}>
                        Gửi bếp
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onCancel(o.id)}>
                        Huỷ
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
