"use client";

import { useMemo, type ReactNode } from "react";
import { Banknote, QrCode, Receipt, RotateCcw, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Payment } from "@/hooks/api/use-payments";
import { formatVnd } from "@/lib/format";
import { isCollected, netCollected, refundedOf } from "./payment-status";

interface Summary {
  total: number;
  count: number;
  failedOrPending: number;
  cash: number;
  qr: number;
  other: number;
  refunded: number;
  refundCount: number;
}

function summarize(payments: Payment[]): Summary {
  const s: Summary = {
    total: 0,
    count: 0,
    failedOrPending: 0,
    cash: 0,
    qr: 0,
    other: 0,
    refunded: 0,
    refundCount: 0,
  };
  for (const p of payments) {
    const refunded = refundedOf(p);
    if (refunded > 0) {
      s.refunded += refunded;
      s.refundCount += 1;
    }
    if (p.status === "failed" || p.status === "pending") s.failedOrPending += 1;
    if (!isCollected(p)) continue;
    const net = netCollected(p);
    s.total += net;
    s.count += 1;
    if (p.method === "cash") s.cash += net;
    else if (p.method === "vietqr") s.qr += net;
    else s.other += net;
  }
  return s;
}

function StatCard({
  title,
  icon,
  loading,
  children,
}: {
  title: string;
  icon: ReactNode;
  loading: boolean;
  children: ReactNode;
}) {
  return (
    <Card className="min-h-[80px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>{loading ? <Skeleton className="h-8 w-28" /> : children}</CardContent>
    </Card>
  );
}

function MethodRow({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className="font-medium tabular-nums">{formatVnd(value)}</span>
    </div>
  );
}

/** Tổng hợp tiền thu trong ngày đã chọn (mọi phương thức). */
export function PaymentSummary({
  payments,
  loading,
}: {
  payments: Payment[] | undefined;
  loading: boolean;
}) {
  const s = useMemo(() => summarize(payments ?? []), [payments]);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        title="Tổng thực thu"
        icon={<Wallet className="h-4 w-4 text-emerald-600" />}
        loading={loading}
      >
        <div className="text-lg font-bold tabular-nums sm:text-2xl">{formatVnd(s.total)}</div>
        <p className="text-muted-foreground text-xs">Đã trừ tiền hoàn</p>
      </StatCard>

      <StatCard
        title="Số giao dịch"
        icon={<Receipt className="h-4 w-4 text-blue-600" />}
        loading={loading}
      >
        <div className="text-lg font-bold sm:text-2xl">{s.count}</div>
        <p className="text-muted-foreground text-xs">
          {s.failedOrPending > 0
            ? `${s.failedOrPending} thất bại / đang chờ`
            : "Giao dịch thành công"}
        </p>
      </StatCard>

      <StatCard
        title="Theo phương thức"
        icon={<Banknote className="h-4 w-4 text-violet-600" />}
        loading={loading}
      >
        <div className="space-y-1">
          <MethodRow icon={<Banknote className="h-3.5 w-3.5" />} label="Tiền mặt" value={s.cash} />
          <MethodRow icon={<QrCode className="h-3.5 w-3.5" />} label="QR" value={s.qr} />
          <MethodRow icon={<Wallet className="h-3.5 w-3.5" />} label="Khác" value={s.other} />
        </div>
      </StatCard>

      <StatCard
        title="Đã hoàn tiền"
        icon={<RotateCcw className="h-4 w-4 text-rose-600" />}
        loading={loading}
      >
        <div className="text-lg font-bold tabular-nums sm:text-2xl">{formatVnd(s.refunded)}</div>
        <p className="text-muted-foreground text-xs">{s.refundCount} giao dịch có hoàn tiền</p>
      </StatCard>
    </div>
  );
}
