"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import {
  Ban,
  ChefHat,
  CircleDollarSign,
  ClipboardList,
  HandPlatter,
  QrCode,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_CLASS, ORDER_STATUS_LABEL, formatDateTime, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order } from "@/types/api";
import { ORDER_SOURCE_LABEL, ORDER_TYPE_LABEL } from "./utils";

interface Step {
  label: string;
  icon: LucideIcon;
  done: boolean;
  at: string | null;
  danger?: boolean;
}

/** Các mốc của đơn: tạo → gửi bếp → phục vụ → thanh toán (hoặc huỷ). */
function buildSteps(o: Order): Step[] {
  const served = o.status === "served" || o.status === "paid" || o.status === "refunded";
  const lastServedAt =
    o.lines
      .map((l) => l.servedAt)
      .filter((x): x is string => !!x)
      .sort()
      .at(-1) ?? null;
  const steps: Step[] = [
    { label: "Tạo đơn", icon: ClipboardList, done: true, at: o.createdAt },
    { label: "Gửi bếp", icon: ChefHat, done: !!o.sentAt, at: o.sentAt },
  ];
  if (o.status === "cancelled") {
    steps.push({ label: "Đã huỷ", icon: Ban, done: true, at: o.cancelledAt, danger: true });
    return steps;
  }
  steps.push(
    { label: "Phục vụ", icon: HandPlatter, done: served, at: served ? lastServedAt : null },
    { label: "Thanh toán", icon: CircleDollarSign, done: !!o.paidAt, at: o.paidAt },
  );
  return steps;
}

/** Đầu trang chi tiết đơn: mã đơn + trạng thái, mốc thời gian dạng timeline, hành động. */
export function OrderHeader({ order: o, children }: { order: Order; children?: ReactNode }) {
  const steps = buildSteps(o);
  const PlaceIcon =
    o.source === "qr_menu" ? QrCode : o.orderType === "takeaway" ? ShoppingBag : null;

  return (
    <section className="bg-card overflow-hidden rounded-2xl border shadow-xs">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-6">
        <div className="bg-primary/10 text-primary flex size-16 shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold">
          {o.tableName ? (
            <span className="truncate px-1">{o.tableName}</span>
          ) : PlaceIcon ? (
            <PlaceIcon className="size-7" />
          ) : (
            <ClipboardList className="size-7" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Đơn {o.orderNumber}</h1>
            <Badge className={cn("border-transparent", ORDER_STATUS_CLASS[o.status])}>
              {ORDER_STATUS_LABEL[o.status]}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {ORDER_TYPE_LABEL[o.orderType]}
            {o.tableName ? ` · ${o.tableName}` : ""} · {ORDER_SOURCE_LABEL[o.source]} · Tạo lúc{" "}
            {formatDateTime(o.createdAt)}
            {o.paidAt ? ` · Thanh toán lúc ${formatDateTime(o.paidAt)}` : ""}
          </p>
        </div>
      </div>

      {/* Timeline các mốc */}
      <ol className="bg-muted/40 grid grid-cols-2 gap-y-4 border-t px-4 py-4 sm:flex sm:items-start sm:px-6">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const nextDone = steps[i + 1]?.done;
          return (
            <li
              key={s.label}
              className="relative flex flex-1 items-center gap-3 sm:flex-col sm:text-center"
            >
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className="bg-border absolute top-5 left-[calc(50%+1.5rem)] hidden h-0.5 w-[calc(100%-3rem)] overflow-hidden rounded-full sm:block"
                >
                  <motion.span
                    className={cn(
                      "block h-full",
                      steps[i + 1]?.danger ? "bg-destructive" : "bg-success",
                    )}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: nextDone ? 1 : 0 }}
                    style={{ originX: 0 }}
                    transition={{ duration: 0.3, delay: 0.08 * i }}
                  />
                </span>
              )}
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 30, delay: 0.05 * i }}
                className={cn(
                  "relative z-[1] flex size-10 shrink-0 items-center justify-center rounded-full border-2",
                  s.danger
                    ? "border-destructive bg-destructive text-white"
                    : s.done
                      ? "border-success bg-success text-white"
                      : "bg-card text-muted-foreground border-dashed",
                )}
              >
                <Icon className="size-[18px]" />
              </motion.span>
              <div className="min-w-0">
                <div
                  className={cn(
                    "text-sm font-semibold",
                    !s.done && "text-muted-foreground",
                    s.danger && "text-destructive",
                  )}
                >
                  {s.label}
                </div>
                <div className="text-muted-foreground tabular text-xs">
                  {s.at ? formatTime(s.at) : s.done ? "✓" : "—"}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {children && <div className="border-t p-4 sm:px-6">{children}</div>}
    </section>
  );
}
