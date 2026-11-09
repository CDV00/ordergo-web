"use client";

import { create } from "zustand";
import { ApiException, apiPost } from "@/lib/api-client";
import type { Order } from "@/types/api";
import { idb } from "./idb";
import {
  applyFailure,
  applySuccess,
  classifyError,
  discardItem,
  isGroupDone,
  nextRunnable,
  retryItem,
  targetOrderId,
  type OutboxItem,
} from "./outbox-core";

const STORAGE_KEY = "outbox:v1";
const CHANNEL = "ordergo-outbox";

interface OutboxState {
  items: OutboxItem[];
  /** Đã đọc hàng đợi từ IndexedDB chưa (trước đó không lập chuỗi mới để tránh ghi đè). */
  loaded: boolean;
  syncing: boolean;
}

/**
 * Hàng đợi offline của POS. Nguồn sự thật là IndexedDB (sống qua reload);
 * store này là bản sao trong bộ nhớ để React render. Mọi thay đổi đi qua {@link mutate}.
 */
export const useOutboxStore = create<OutboxState>(() => ({
  items: [],
  loaded: false,
  syncing: false,
}));

let channel: BroadcastChannel | null = null;
function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  channel ??= new BroadcastChannel(CHANNEL);
  return channel;
}

/** Đọc lại từ IndexedDB (khởi động / tab khác vừa đổi hàng đợi). */
export async function loadOutbox(): Promise<void> {
  const items = (await idb.get<OutboxItem[]>(STORAGE_KEY)) ?? [];
  useOutboxStore.setState({ items: Array.isArray(items) ? items : [], loaded: true });
}

/** Nghe tab khác đổi hàng đợi. Trả về hàm huỷ. */
export function subscribeOtherTabs(onChange: () => void): () => void {
  const ch = getChannel();
  if (!ch) return () => {};
  const handler = () => {
    void loadOutbox().then(onChange);
  };
  ch.addEventListener("message", handler);
  return () => ch.removeEventListener("message", handler);
}

// Ghi tuần tự để không bao giờ ghi đè bản mới bằng bản cũ.
let writeChain: Promise<void> = Promise.resolve();

function mutate(fn: (items: OutboxItem[]) => OutboxItem[]): Promise<void> {
  const next = fn(useOutboxStore.getState().items);
  useOutboxStore.setState({ items: next });
  writeChain = writeChain
    .then(() => idb.set(STORAGE_KEY, next))
    .then(() => getChannel()?.postMessage("changed"))
    .catch(() => undefined);
  return writeChain;
}

export function enqueue(steps: OutboxItem[]): Promise<void> {
  return mutate((items) => [...items, ...steps]);
}
export function retryOutboxItem(id: string): Promise<void> {
  return mutate((items) => retryItem(items, id));
}
export function discardOutboxItem(id: string): Promise<void> {
  return mutate((items) => discardItem(items, id));
}

// ─── Gửi 1 bước ─────────────────────────────────────────────────────────────

function headersFor(item: OutboxItem): Record<string, string> {
  const h: Record<string, string> = { "Idempotency-Key": item.id, "X-Tenant-Id": item.tenantId };
  if (item.venueId) h["X-Venue-Id"] = item.venueId;
  return h;
}

/** Gửi 1 bước lên API với Idempotency-Key của nó. Ném ApiException như api-client. */
export async function executeStep(item: OutboxItem): Promise<Order> {
  const config = { headers: headersFor(item) };
  if (item.kind === "create_order") {
    return apiPost<Order>("/orders", item.payload.body, config);
  }
  const orderId = targetOrderId(item);
  if (!orderId) throw new Error("Bước phụ thuộc đơn chưa tạo xong");
  if (item.kind === "add_lines") {
    return apiPost<Order>(`/orders/${orderId}/lines`, { lines: item.payload.lines }, config);
  }
  return apiPost<Order>(`/orders/${orderId}/send-to-kitchen`, undefined, config);
}

function errorOf(err: unknown): { status: number; code?: string; message: string } {
  if (err instanceof ApiException) {
    return { status: err.status, code: err.error.code, message: err.error.message };
  }
  return { status: 0, message: (err as Error)?.message ?? "Lỗi không xác định" };
}

// ─── Gửi lại hàng đợi ───────────────────────────────────────────────────────

export interface SyncResult {
  /** Số đơn (chuỗi) đã gửi xong trong lượt này. */
  sentGroups: number;
  /** Số bước vừa chuyển sang lỗi 4xx. */
  newlyFailed: number;
}

let running: Promise<SyncResult> | null = null;

/**
 * Gửi lần lượt các bước chạy được của tenant hiện tại. Mất mạng → dừng lượt.
 * Nhiều tab cùng mở: `navigator.locks` (nếu có) cho 1 tab chạy; tab khác bỏ lượt.
 * Kể cả hai tab cùng chạy cũng không tạo trùng — mỗi bước có Idempotency-Key cố định.
 */
export function syncOutbox(tenantId: string | null): Promise<SyncResult> {
  if (running) return running;
  const empty: SyncResult = { sentGroups: 0, newlyFailed: 0 };
  if (!tenantId) return Promise.resolve(empty);

  const work = async (): Promise<SyncResult> => {
    useOutboxStore.setState({ syncing: true });
    const result = { ...empty };
    // Bước lỗi tạm thời trong lượt này → không chạy lại ngay trong cùng lượt.
    const skip = new Set<string>();
    try {
      for (;;) {
        if (typeof navigator !== "undefined" && navigator.onLine === false) break;
        const item = nextRunnable(useOutboxStore.getState().items, Date.now(), tenantId, skip);
        if (!item) break;
        try {
          const order = await executeStep(item);
          await mutate((items) =>
            applySuccess(items, item.id, item.kind === "create_order" ? order.id : null),
          );
          if (isGroupDone(useOutboxStore.getState().items, item.groupId)) result.sentGroups++;
        } catch (err) {
          const e = errorOf(err);
          const cls = classifyError(e, item.kind);
          if (cls === "done") {
            await mutate((items) => applySuccess(items, item.id, null));
            if (isGroupDone(useOutboxStore.getState().items, item.groupId)) result.sentGroups++;
            continue;
          }
          await mutate((items) => applyFailure(items, item.id, cls, e.message, Date.now()));
          if (cls === "offline") break;
          if (cls === "fatal") result.newlyFailed++;
          skip.add(item.id);
        }
      }
    } finally {
      useOutboxStore.setState({ syncing: false });
    }
    return result;
  };

  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  const p: Promise<SyncResult> = locks
    ? (locks.request(CHANNEL, { ifAvailable: true }, (lock) =>
        lock ? work() : empty,
      ) as Promise<SyncResult>)
    : work();
  running = p.finally(() => {
    running = null;
  });
  return running;
}
