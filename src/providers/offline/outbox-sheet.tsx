"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { discardOutboxItem, retryOutboxItem, useOutboxStore } from "@/lib/offline/outbox";
import { isBlocked, type OutboxItem } from "@/lib/offline/outbox-core";
import { useOnline } from "@/lib/offline/use-online";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<OutboxItem["kind"], string> = {
  create_order: "Tạo đơn",
  add_lines: "Gọi thêm món",
  send_to_kitchen: "Gửi bếp",
};

function StepRow({
  item,
  blocked,
  onRetry,
  onDiscard,
}: {
  item: OutboxItem;
  blocked: boolean;
  onRetry: () => void;
  onDiscard: () => void;
}) {
  const failed = item.status === "failed";
  const display = item.kind === "send_to_kitchen" ? [] : item.payload.display;
  return (
    <li className="py-2" data-testid="outbox-step">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-medium">{KIND_LABEL[item.kind]}</span>
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[11px] font-medium",
            failed
              ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
              : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
          )}
        >
          {failed ? "Lỗi" : blocked ? "Chờ bước trước" : "Chờ gửi"}
        </span>
      </div>
      {display.length > 0 && (
        <ul className="text-muted-foreground mt-1 space-y-0.5 text-xs">
          {display.map((l, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span className="truncate">
                {l.quantity}× {l.name}
                {l.variantName ? ` (${l.variantName})` : ""}
              </span>
              <span className="tabular-nums">{formatVnd(l.unitPrice * l.quantity)}</span>
            </li>
          ))}
        </ul>
      )}
      {item.lastError && (
        <div className={cn("mt-1 text-xs", failed ? "text-destructive" : "text-muted-foreground")}>
          {item.lastError}
          {item.attempts > 1 && ` (đã thử ${item.attempts} lần)`}
        </div>
      )}
      {failed && (
        <div className="mt-2 flex gap-2">
          <Button size="sm" variant="outline" onClick={onRetry}>
            Thử lại
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={onDiscard}>
            Bỏ
          </Button>
        </div>
      )}
    </li>
  );
}

/** Danh sách đơn chờ gửi (offline) của tenant hiện tại, theo chuỗi. */
export function OutboxSheet({
  open,
  onOpenChange,
  tenantId,
  onSyncNow,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tenantId: string | null;
  onSyncNow: () => void;
}) {
  const items = useOutboxStore((s) => s.items);
  const syncing = useOutboxStore((s) => s.syncing);
  const online = useOnline();

  const groups = useMemo(() => {
    const mine = items.filter((i) => i.tenantId === tenantId);
    const map = new Map<string, OutboxItem[]>();
    for (const i of mine) map.set(i.groupId, [...(map.get(i.groupId) ?? []), i]);
    return [...map.values()];
  }, [items, tenantId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4">
          <SheetTitle>Đơn chờ gửi</SheetTitle>
          <SheetDescription>
            {online
              ? "Các thao tác lưu lúc mất mạng — tự gửi lại theo thứ tự."
              : "Đang mất kết nối — sẽ tự gửi khi có mạng lại."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4" data-testid="outbox-sheet">
          {groups.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center text-sm">
              Không có đơn nào chờ gửi.
            </div>
          ) : (
            groups.map((g) => (
              <section key={g[0].groupId} className="border-b py-3 last:border-b-0">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold">{g[0].label}</h3>
                  <span className="text-muted-foreground text-xs">
                    {new Date(g[0].createdAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <ul className="divide-y">
                  {g.map((item) => (
                    <StepRow
                      key={item.id}
                      item={item}
                      blocked={isBlocked(items, item)}
                      onRetry={() => {
                        void retryOutboxItem(item.id).then(onSyncNow);
                      }}
                      onDiscard={() => {
                        if (
                          window.confirm(
                            "Bỏ thao tác này (và các bước sau nó của cùng đơn)? Món sẽ không được gửi bếp.",
                          )
                        ) {
                          void discardOutboxItem(item.id);
                        }
                      }}
                    />
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
        <div className="border-t p-4">
          <Button
            className="w-full"
            disabled={!online || syncing || groups.length === 0}
            onClick={onSyncNow}
          >
            {syncing ? "Đang gửi..." : "Gửi ngay"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
