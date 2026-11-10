"use client";

import { BadgePercent, Receipt, ShoppingBag, Wallet } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion";
import { StatCard } from "@/components/stat-card";
import type { SalesReport } from "@/hooks/api/use-reports";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

/** 4 chỉ số chính: doanh thu thuần, số đơn, giá trị TB/đơn, giảm giá (số trượt khi đổi khoảng). */
export function KpiTiles({
  report,
  loading,
}: {
  report: SalesReport | undefined;
  loading: boolean;
}) {
  const t = report?.totals;
  const pulse = cn(loading && "animate-pulse");
  return (
    <Stagger className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StaggerItem>
        <StatCard
          label="Doanh thu thuần"
          value={t?.netRevenue ?? 0}
          format="vnd"
          icon={Wallet}
          tone="primary"
          className={pulse}
          hint={t && t.refunds > 0 ? `Đã trừ hoàn ${formatVnd(t.refunds)}` : "Đã thu − đã hoàn"}
        />
      </StaggerItem>
      <StaggerItem>
        <StatCard
          label="Số đơn"
          value={t?.orders ?? 0}
          icon={ShoppingBag}
          tone="info"
          className={pulse}
          hint={t?.cancelledOrders ? `${t.cancelledOrders} đơn huỷ` : "Không tính đơn huỷ"}
        />
      </StaggerItem>
      <StaggerItem>
        <StatCard
          label="Giá trị TB/đơn"
          value={t?.averageTicket ?? 0}
          format="vnd"
          icon={Receipt}
          tone="success"
          className={pulse}
          hint={`Tổng giá trị đơn ${formatVnd(t?.grossOrderValue ?? 0)}`}
        />
      </StaggerItem>
      <StaggerItem>
        <StatCard
          label="Giảm giá"
          value={t?.discountTotal ?? 0}
          format="vnd"
          icon={BadgePercent}
          tone="warning"
          className={pulse}
          hint={
            t?.serviceChargeTotal
              ? `Phí dịch vụ ${formatVnd(t.serviceChargeTotal)}`
              : "Tổng giảm giá trên đơn"
          }
        />
      </StaggerItem>
    </Stagger>
  );
}
