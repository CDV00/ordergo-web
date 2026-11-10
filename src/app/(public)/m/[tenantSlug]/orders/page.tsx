"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChefHat,
  CheckCircle2,
  Clock,
  Gift,
  Loader2,
  QrCode,
  Soup,
  Sparkles,
  Utensils,
} from "lucide-react";
import { motion } from "motion/react";
import { usePublicMe, usePublicSession, usePublicSessionOrders } from "@/hooks/api/use-public";
import { AnimatedNumber } from "@/components/animated-number";
import { cn } from "@/lib/utils";
import { ClaimSheet } from "../_components/claim-sheet";
import type { Order, OrderLine } from "@/types/api";

function fmt(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function elapsed(from: string): string {
  const ms = Date.now() - new Date(from).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  return `${h}g${m % 60} phút trước`;
}

const STAGES = [
  { key: "queued", label: "Đã gửi bếp", icon: Clock },
  { key: "preparing", label: "Đang chuẩn bị", icon: ChefHat },
  { key: "ready", label: "Sẵn sàng", icon: Soup },
  { key: "served", label: "Đã giao", icon: CheckCircle2 },
] as const;

function LineProgress({ line }: { line: OrderLine }) {
  const stageIdx = STAGES.findIndex((s) => s.key === line.kitchenStatus);
  const currentIdx = stageIdx === -1 ? 0 : stageIdx;

  return (
    <div className="space-y-2.5 py-3 first:pt-0 last:pb-0">
      <div className="flex justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="leading-tight font-semibold">
            <span className="text-primary mr-1.5 tabular-nums">{line.quantity}×</span>
            {line.productSnapshot.name}
          </div>
          {line.modifiers.length > 0 && (
            <div className="text-muted-foreground text-xs">
              + {line.modifiers.map((m) => m.optionName).join(", ")}
            </div>
          )}
          {line.note && (
            <div className="bg-warning-soft dark:text-warning mt-1 inline-block rounded-md px-2 py-0.5 text-xs text-[oklch(0.45_0.12_60)]">
              {line.note}
            </div>
          )}
        </div>
        <div className="shrink-0 text-sm font-semibold tabular-nums">
          {fmt(line.lineTotal.amount)}
        </div>
      </div>

      {line.kitchenStatus !== "cancelled" && (
        <div className="text-muted-foreground -mb-1 text-xs font-medium">
          {STAGES[currentIdx]?.label}
        </div>
      )}
      {line.kitchenStatus !== "cancelled" && (
        <div className="flex items-center gap-1" aria-label={STAGES[currentIdx]?.label}>
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            const reached = i <= currentIdx;
            const active = i === currentIdx;
            return (
              <div key={stage.key} className="flex flex-1 items-center last:flex-none">
                <div
                  title={stage.label}
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors",
                    reached
                      ? active
                        ? "bg-primary text-primary-foreground ring-primary/25 ring-4"
                        : "bg-success text-white"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                </div>
                {i < STAGES.length - 1 && (
                  <div className="bg-muted mx-0.5 h-1 flex-1 overflow-hidden rounded-full">
                    <motion.div
                      className="bg-success h-full origin-left"
                      initial={false}
                      animate={{ scaleX: i < currentIdx ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {line.kitchenStatus === "cancelled" && <div className="text-destructive text-sm">Đã huỷ</div>}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="bg-card overflow-hidden rounded-2xl border shadow-xs"
    >
      <header className="bg-muted/50 flex items-center justify-between border-b px-4 py-3">
        <div>
          <div className="font-bold">{order.orderNumber}</div>
          <div className="text-muted-foreground text-xs">{elapsed(order.createdAt)}</div>
        </div>
        <div className="text-right">
          <div className="font-bold tabular-nums">{fmt(order.pricing.total.amount)}</div>
          <div className="text-muted-foreground text-xs">{order.lines.length} món</div>
        </div>
      </header>
      <div className="divide-y px-4 py-3">
        {order.lines.map((line) => (
          <LineProgress key={line.id} line={line} />
        ))}
      </div>
    </motion.article>
  );
}

export default function PublicOrdersPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tableName, setTableName] = useState<string>("");

  useEffect(() => {
    const sid = sessionStorage.getItem("ordergo.session.id");
    const tn = sessionStorage.getItem("ordergo.session.tableName");
    if (!sid) {
      router.replace("/");
      return;
    }
    setSessionId(sid);
    setTableName(tn ?? "");
  }, [router]);

  const session = usePublicSession(sessionId);
  const orders = usePublicSessionOrders(sessionId);
  const me = usePublicMe(sessionId);
  const [claimOpen, setClaimOpen] = useState(false);

  const isVerified = me.data?.status === "verified" || me.data?.status === "full";
  const hasUnpaidOrder = orders.data?.some(
    (o) => o.status === "served" || o.status === "ready" || o.status === "in_progress",
  );
  const firstUnpaidOrder = orders.data?.find(
    (o) => o.status !== "paid" && o.status !== "cancelled",
  );

  if (!sessionId) {
    return (
      <div className="flex h-svh items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-svh max-w-2xl">
      <header className="bg-background/90 sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-3 backdrop-blur-md">
        <Link
          href={`/m/${tenantSlug}/menu`}
          className="hover:bg-muted -ml-2 flex size-11 items-center justify-center rounded-xl"
          aria-label="Quay lại menu"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-base font-bold">Đơn của tôi</h1>
          {tableName && <p className="text-muted-foreground text-xs">Bàn {tableName}</p>}
        </div>
        <Link
          href={`/m/${tenantSlug}/menu`}
          className="bg-primary text-primary-foreground inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold shadow-sm"
        >
          <Utensils className="size-4" />
          Đặt thêm
        </Link>
      </header>

      <main className="space-y-4 p-4">
        {orders.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
          </div>
        ) : orders.data?.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center py-16 text-center">
            <div className="bg-primary/10 text-primary mb-4 flex size-16 items-center justify-center rounded-full">
              <Utensils className="size-7" />
            </div>
            <p>Chưa có đơn nào.</p>
            <Link
              href={`/m/${tenantSlug}/menu`}
              className="text-primary mt-4 inline-block font-medium"
            >
              Đặt món đầu tiên →
            </Link>
          </div>
        ) : (
          orders.data?.map((o) => <OrderCard key={o.id} order={o} />)
        )}

        {orders.data && orders.data.length > 0 && session.data && (
          <div className="bg-primary/5 border-primary/20 mt-2 space-y-3 rounded-2xl border p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-muted-foreground text-sm">Tổng hoá đơn</div>
                <AnimatedNumber
                  value={session.data.totalAmount.amount}
                  format="vnd"
                  className="text-primary text-2xl font-bold"
                />
              </div>
              {firstUnpaidOrder && (
                <Link
                  href={`/m/${tenantSlug}/pay/${firstUnpaidOrder.id}`}
                  className="bg-primary text-primary-foreground flex h-12 items-center gap-2 rounded-full px-5 font-semibold shadow-sm transition-transform active:scale-95"
                >
                  <QrCode className="size-4" />
                  Tự thanh toán
                </Link>
              )}
            </div>
            <p className="text-muted-foreground text-xs">Hoặc gọi nhân viên ra thanh toán giúp.</p>
          </div>
        )}

        {/* Loyalty CTA — chỉ hiện cho anonymous + đã có ≥ 1 order */}
        {orders.data && orders.data.length > 0 && me.data && !isVerified && (
          <button
            onClick={() => setClaimOpen(true)}
            className="border-warning/40 bg-warning-soft flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-transform active:scale-[0.98]"
          >
            <div className="bg-warning/20 dark:text-warning flex size-12 shrink-0 items-center justify-center rounded-full text-[oklch(0.5_0.12_70)]">
              <Gift className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold">Lưu hồ sơ — nhận voucher</div>
              <div className="text-muted-foreground text-xs">Nhập SĐT để tích điểm cho lần sau</div>
            </div>
          </button>
        )}

        {/* Verified — show stats */}
        {me.data && isVerified && (
          <div className="border-success/30 bg-success-soft flex items-center gap-3 rounded-2xl border p-4">
            <Sparkles className="text-success size-6 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold">Chào {me.data.name ?? "bạn"} 👋</div>
              <div className="text-muted-foreground text-xs">
                Đã đặt {me.data.stats.orderCount} đơn · {fmt(me.data.stats.totalSpent.amount)}
              </div>
            </div>
          </div>
        )}
      </main>

      <ClaimSheet
        open={claimOpen}
        sessionId={sessionId}
        onClose={() => setClaimOpen(false)}
        onClaimed={() => me.refetch()}
      />
    </div>
  );
}
