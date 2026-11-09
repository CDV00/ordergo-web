"use client";

import type { ReactNode } from "react";
import { BadgePercent, Receipt, ShoppingBag, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SalesReport } from "@/hooks/api/use-reports";
import { formatVnd } from "@/lib/format";

function Tile({
  title,
  icon,
  value,
  note,
  loading,
}: {
  title: string;
  icon: ReactNode;
  value: string;
  note: string;
  loading: boolean;
}) {
  return (
    <Card className="min-h-[96px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-xs font-medium">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <>
            <div className="text-lg font-bold tabular-nums sm:text-2xl">{value}</div>
            <p className="text-muted-foreground text-xs">{note}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/** 4 chỉ số chính: doanh thu thuần, số đơn, giá trị TB/đơn, giảm giá. */
export function KpiTiles({
  report,
  loading,
}: {
  report: SalesReport | undefined;
  loading: boolean;
}) {
  const t = report?.totals;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile
        title="Doanh thu thuần"
        icon={<Wallet className="h-4 w-4" />}
        loading={loading}
        value={formatVnd(t?.netRevenue ?? 0)}
        note={t && t.refunds > 0 ? `Đã trừ hoàn ${formatVnd(t.refunds)}` : "Đã thu − đã hoàn"}
      />
      <Tile
        title="Số đơn"
        icon={<ShoppingBag className="h-4 w-4" />}
        loading={loading}
        value={String(t?.orders ?? 0)}
        note={t?.cancelledOrders ? `${t.cancelledOrders} đơn huỷ` : "Không tính đơn huỷ"}
      />
      <Tile
        title="Giá trị TB/đơn"
        icon={<Receipt className="h-4 w-4" />}
        loading={loading}
        value={formatVnd(t?.averageTicket ?? 0)}
        note={`Tổng giá trị đơn ${formatVnd(t?.grossOrderValue ?? 0)}`}
      />
      <Tile
        title="Giảm giá"
        icon={<BadgePercent className="h-4 w-4" />}
        loading={loading}
        value={formatVnd(t?.discountTotal ?? 0)}
        note={
          t?.serviceChargeTotal
            ? `Phí dịch vụ ${formatVnd(t.serviceChargeTotal)}`
            : "Tổng giảm giá trên đơn"
        }
      />
    </div>
  );
}
