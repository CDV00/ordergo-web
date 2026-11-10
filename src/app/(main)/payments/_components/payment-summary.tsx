"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { Banknote, PieChart, QrCode, Receipt, RotateCcw, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import { cn } from "@/lib/utils";
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

/** Thẻ "Theo phương thức": thanh tỉ lệ + từng dòng. */
function MethodCard({ s }: { s: Summary }) {
  const rows = [
    { key: "cash", label: "Tiền mặt", value: s.cash, icon: Banknote, bar: "bg-success" },
    { key: "qr", label: "QR", value: s.qr, icon: QrCode, bar: "bg-info" },
    { key: "other", label: "Khác", value: s.other, icon: Wallet, bar: "bg-primary" },
  ];
  const sum = s.cash + s.qr + s.other;
  return (
    <div className="bg-card text-card-foreground rounded-2xl border p-4 shadow-xs sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted-foreground text-sm font-medium">Theo phương thức</p>
        <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
          <PieChart className="size-[18px]" />
        </div>
      </div>
      <div className="bg-muted mt-3 flex h-2 overflow-hidden rounded-full" aria-hidden>
        {sum > 0 &&
          rows.map((r) => (
            <motion.span
              key={r.key}
              className={cn("h-full", r.bar)}
              initial={{ width: 0 }}
              animate={{ width: `${(r.value / sum) * 100}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 30 }}
            />
          ))}
      </div>
      <div className="mt-3 space-y-1.5">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", r.bar)} />
              <r.icon className="size-3.5" />
              {r.label}
            </span>
            <span className="tabular font-medium">{formatVnd(r.value)}</span>
          </div>
        ))}
      </div>
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

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[124px] rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Tổng thực thu"
        value={s.total}
        format="vnd"
        icon={Wallet}
        tone="success"
        hint="Đã trừ tiền hoàn"
      />
      <StatCard
        label="Số giao dịch"
        value={s.count}
        icon={Receipt}
        tone="info"
        hint={
          s.failedOrPending > 0
            ? `${s.failedOrPending} thất bại / đang chờ`
            : "Giao dịch thành công"
        }
      />
      <MethodCard s={s} />
      <StatCard
        label="Đã hoàn tiền"
        value={s.refunded}
        format="vnd"
        icon={RotateCcw}
        tone={s.refunded > 0 ? "warning" : "neutral"}
        hint={`${s.refundCount} giao dịch có hoàn tiền`}
      />
    </div>
  );
}
