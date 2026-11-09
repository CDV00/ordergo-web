"use client";

import { CloudOff, AlertTriangle, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useOutboxStore } from "@/lib/offline/outbox";
import { useOnline, useOutboxSummary } from "@/lib/offline/use-online";
import { cn } from "@/lib/utils";
import { useOffline } from "./offline-provider";

/**
 * Thanh trạng thái trên cùng vùng nội dung (layout `(main)`):
 *  - mất mạng → "Mất kết nối — đơn mới sẽ được gửi khi có mạng lại (N đơn chờ)"
 *  - có mạng nhưng còn đơn lỗi / đang gửi → nhắc + nút xem hàng đợi
 */
export function OfflineBanner() {
  const { activeTenantId } = useAuth();
  const online = useOnline();
  const syncing = useOutboxStore((s) => s.syncing);
  const { groups, failedGroups } = useOutboxSummary(activeTenantId);
  const { openOutbox } = useOffline();

  if (online && groups === 0) return null;

  let tone: "offline" | "error" | "pending";
  let text: string;
  if (!online) {
    tone = "offline";
    text = `Mất kết nối — đơn mới sẽ được gửi khi có mạng lại (${groups} đơn chờ)`;
  } else if (failedGroups > 0) {
    tone = "error";
    text = `${failedGroups} đơn chờ gửi bị lỗi — cần xử lý`;
  } else {
    tone = "pending";
    text = syncing ? `Đang gửi ${groups} đơn chờ...` : `${groups} đơn chờ gửi`;
  }

  const Icon = tone === "offline" ? CloudOff : tone === "error" ? AlertTriangle : RefreshCw;

  return (
    <div
      role="status"
      data-testid="offline-banner"
      className={cn(
        "flex shrink-0 items-center gap-2 px-3 py-1.5 text-sm font-medium md:px-4",
        tone === "offline" && "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
        tone === "error" && "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
        tone === "pending" && "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
      )}
    >
      <Icon className={cn("size-4 shrink-0", tone === "pending" && syncing && "animate-spin")} />
      <span className="min-w-0 flex-1 truncate">{text}</span>
      {groups > 0 && (
        <button
          type="button"
          onClick={openOutbox}
          className="shrink-0 rounded px-2 py-0.5 underline underline-offset-2 hover:bg-black/5"
        >
          Xem
        </button>
      )}
    </div>
  );
}
