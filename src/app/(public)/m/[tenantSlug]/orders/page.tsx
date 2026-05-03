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
import { usePublicMe, usePublicSession, usePublicSessionOrders } from "@/hooks/api/use-public";
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
  { key: "queued", label: "Đã gửi bếp", icon: Clock, color: "text-amber-600" },
  { key: "preparing", label: "Đang chuẩn bị", icon: ChefHat, color: "text-blue-600" },
  { key: "ready", label: "Sẵn sàng", icon: Soup, color: "text-emerald-600" },
  { key: "served", label: "Đã giao", icon: CheckCircle2, color: "text-emerald-700" },
] as const;

function LineProgress({ line }: { line: OrderLine }) {
  const stageIdx = STAGES.findIndex((s) => s.key === line.kitchenStatus);
  const currentIdx = stageIdx === -1 ? 0 : stageIdx;

  return (
    <div className="bg-card space-y-2 rounded-lg border p-3">
      <div className="flex justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="leading-tight font-semibold">
            <span className="mr-2 tabular-nums">{line.quantity}×</span>
            {line.productSnapshot.name}
          </div>
          {line.modifiers.length > 0 && (
            <div className="text-muted-foreground text-xs">
              + {line.modifiers.map((m) => m.optionName).join(", ")}
            </div>
          )}
          {line.note && (
            <div className="mt-1 text-xs text-amber-700 dark:text-amber-400">⚠ {line.note}</div>
          )}
        </div>
        <div className="shrink-0 text-sm font-semibold tabular-nums">
          {fmt(line.lineTotal.amount)}
        </div>
      </div>

      {line.kitchenStatus !== "cancelled" && (
        <div className="flex items-center gap-1">
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            const reached = i <= currentIdx;
            const active = i === currentIdx;
            return (
              <div key={stage.key} className="flex flex-1 items-center last:flex-none">
                <div
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                    reached
                      ? active
                        ? "bg-primary text-primary-foreground"
                        : "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground"
                  } ${active ? "ring-primary/30 animate-pulse ring-2" : ""}`}
                >
                  <Icon className="size-3.5" />
                </div>
                {i < STAGES.length - 1 && (
                  <div className={`h-0.5 flex-1 ${reached ? "bg-emerald-500" : "bg-muted"}`} />
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
    <article className="bg-background overflow-hidden rounded-xl border-2">
      <header className="bg-muted flex items-center justify-between p-3">
        <div>
          <div className="font-bold">{order.orderNumber}</div>
          <div className="text-muted-foreground text-xs">{elapsed(order.createdAt)}</div>
        </div>
        <div className="text-right">
          <div className="font-bold tabular-nums">{fmt(order.pricing.total.amount)}</div>
          <div className="text-muted-foreground text-xs">{order.lines.length} món</div>
        </div>
      </header>
      <div className="space-y-2 p-3">
        {order.lines.map((line) => (
          <LineProgress key={line.id} line={line} />
        ))}
      </div>
    </article>
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
    <div className="min-h-svh">
      <header className="bg-background sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-3">
        <Link
          href={`/m/${tenantSlug}/menu`}
          className="hover:bg-muted -ml-2 flex size-10 items-center justify-center rounded-lg"
          aria-label="Quay lại menu"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-semibold">Đơn của tôi</h1>
          {tableName && <p className="text-muted-foreground text-xs">Bàn {tableName}</p>}
        </div>
        <Link
          href={`/m/${tenantSlug}/menu`}
          className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-medium"
        >
          <Utensils className="mr-1 inline size-4" />
          Đặt thêm
        </Link>
      </header>

      <main className="space-y-3 p-4">
        {orders.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
          </div>
        ) : orders.data?.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center">
            <div className="mb-3 text-5xl">📋</div>
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
          <div className="bg-primary/5 border-primary/20 mt-6 space-y-3 rounded-xl border-2 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-muted-foreground text-sm">Tổng hoá đơn</div>
                <div className="text-primary text-2xl font-bold tabular-nums">
                  {fmt(session.data.totalAmount.amount)}
                </div>
              </div>
              {firstUnpaidOrder && (
                <Link
                  href={`/m/${tenantSlug}/pay/${firstUnpaidOrder.id}`}
                  className="bg-primary text-primary-foreground flex items-center gap-2 rounded-full px-5 py-3 font-semibold transition-transform active:scale-95"
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
            className="flex w-full items-center gap-3 rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 text-left transition-transform active:scale-[0.98] dark:border-amber-900 dark:from-amber-950/30 dark:to-orange-950/30"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
              <Gift className="size-6 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold">Lưu hồ sơ — nhận voucher</div>
              <div className="text-muted-foreground text-xs">Nhập SĐT để tích điểm cho lần sau</div>
            </div>
          </button>
        )}

        {/* Verified — show stats */}
        {me.data && isVerified && (
          <div className="flex items-center gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
            <Sparkles className="size-6 shrink-0 text-emerald-700 dark:text-emerald-400" />
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
