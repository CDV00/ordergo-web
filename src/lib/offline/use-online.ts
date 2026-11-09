"use client";

import { useSyncExternalStore } from "react";
import { useOutboxStore } from "./outbox";
import { pendingLinesFor, summarize, type OutboxDisplayLine } from "./outbox-core";
import { useMemo } from "react";

function subscribe(cb: () => void): () => void {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

/** `navigator.onLine` dạng hook. Server render coi như online. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}

/** Số đơn (chuỗi) chờ gửi / có lỗi của tenant. */
export function useOutboxSummary(tenantId: string | null) {
  const items = useOutboxStore((s) => s.items);
  return useMemo(() => summarize(items, tenantId ?? undefined), [items, tenantId]);
}

/** Món đã xếp hàng offline cho 1 bàn — hiện "Chờ gửi (offline)" trong giỏ. */
export function usePendingLines(
  tenantId: string | null,
  cartKey: string | null,
): OutboxDisplayLine[] {
  const items = useOutboxStore((s) => s.items);
  return useMemo(
    () => (tenantId && cartKey ? pendingLinesFor(items, tenantId, cartKey) : []),
    [items, tenantId, cartKey],
  );
}
