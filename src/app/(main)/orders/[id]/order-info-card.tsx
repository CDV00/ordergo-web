"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_CLASS, ORDER_STATUS_LABEL, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order } from "@/types/api";
import { ORDER_SOURCE_LABEL, ORDER_TYPE_LABEL } from "./utils";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground shrink-0 text-sm">{label}</span>
      <span className="text-right text-sm font-medium">{children}</span>
    </div>
  );
}

export function OrderInfoCard({ order }: { order: Order }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Thông tin chung</CardTitle>
        <CardDescription>Tổng quan về đơn hàng</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row label="Mã đơn">{order.orderNumber}</Row>
        <Row label="Trạng thái">
          <Badge className={cn("border-transparent", ORDER_STATUS_CLASS[order.status])}>
            {ORDER_STATUS_LABEL[order.status]}
          </Badge>
        </Row>
        <Row label="Loại đơn">{ORDER_TYPE_LABEL[order.orderType]}</Row>
        <Row label="Bàn">
          {order.tableId && order.tableName ? (
            <Link href={`/tables/${order.tableId}`} className="text-primary hover:underline">
              {order.tableName}
            </Link>
          ) : (
            (order.tableName ?? "—")
          )}
        </Row>
        <Row label="Nguồn">{ORDER_SOURCE_LABEL[order.source]}</Row>
        <Row label="Tạo lúc">{formatDateTime(order.createdAt)}</Row>
        {order.sentAt && <Row label="Gửi bếp lúc">{formatDateTime(order.sentAt)}</Row>}
        {order.paidAt && <Row label="Thanh toán lúc">{formatDateTime(order.paidAt)}</Row>}
        {order.cancelledAt && <Row label="Huỷ lúc">{formatDateTime(order.cancelledAt)}</Row>}
        {order.status === "cancelled" && (
          <Row label="Lý do huỷ">{order.cancelReason || "Không ghi lý do"}</Row>
        )}
      </CardContent>
    </Card>
  );
}
