"use client";

import {
  dehydrate,
  hydrate,
  type DehydratedState,
  type Query,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { idb } from "./idb";

/**
 * Lưu cache TanStack Query của các màn POS vào IndexedDB để mở lại POS khi mất mạng
 * (cùng ý tưởng `@tanstack/query-persist-client-core`, viết tay để không thêm dependency).
 *
 * CHỈ lưu dữ liệu vận hành không chứa thông tin cá nhân — danh sách cho phép, không phải chặn:
 * menu, bàn, đơn đang mở (đã bỏ `customerSnapshot`), cơ sở. Không bao giờ lưu khách hàng,
 * nhân viên, thanh toán, /me, báo cáo.
 */

const STORAGE_KEY = "query-cache:v1";
const MAX_AGE_MS = 24 * 60 * 60_000;
const SAVE_THROTTLE_MS = 1_000;

/** Gốc query key được lưu. Dùng chung để đặt `networkMode`/`gcTime` trong query-client. */
export const PERSISTED_QUERY_ROOTS = [
  "menu-categories",
  "menu-items",
  "tables",
  "orders",
  "venue",
  "venues",
] as const;

export function isPersistableQueryKey(key: QueryKey): boolean {
  const [root, second, third] = key as unknown[];
  if (typeof root !== "string") return false;
  if (!(PERSISTED_QUERY_ROOTS as readonly string[]).includes(root)) return false;
  if (root === "orders") {
    // ["orders", venueId, "open", tableId?] (POS) hoặc ["orders", "kds", venueId] (màn bếp)
    return second === "kds" || third === "open";
  }
  if (root === "menu-items") {
    // ["menu-items", id] là chi tiết 1 món (trang quản trị) — không cần
    return key.length >= 3;
  }
  return true;
}

/** Bỏ thông tin khách khỏi đơn trước khi ghi xuống máy. */
function scrubOrders(data: unknown): unknown {
  if (!Array.isArray(data)) return data;
  return data.map((o: unknown) => {
    if (!o || typeof o !== "object") return o;
    const { customerSnapshot: _drop, ...rest } = o as Record<string, unknown>;
    return rest;
  });
}

interface PersistedCache {
  buster: string;
  savedAt: number;
  state: DehydratedState;
}

function shouldPersist(q: Query): boolean {
  return q.state.status === "success" && isPersistableQueryKey(q.queryKey);
}

function snapshot(qc: QueryClient): DehydratedState {
  const state = dehydrate(qc, { shouldDehydrateQuery: shouldPersist });
  return {
    ...state,
    mutations: [],
    queries: state.queries.map((q) =>
      q.queryKey[0] === "orders"
        ? { ...q, state: { ...q.state, data: scrubOrders(q.state.data) } }
        : q,
    ),
  };
}

/**
 * Nạp cache đã lưu (nếu cùng `buster` = người dùng + tenant và chưa quá 24h).
 * `hydrate` chỉ ghi đè query khi dữ liệu lưu mới hơn — gọi muộn cũng không làm mất dữ liệu mới.
 */
export async function restoreQueryCache(qc: QueryClient, buster: string): Promise<boolean> {
  const saved = await idb.get<PersistedCache>(STORAGE_KEY);
  if (!saved) return false;
  if (saved.buster !== buster || Date.now() - saved.savedAt > MAX_AGE_MS) {
    await idb.del(STORAGE_KEY);
    return false;
  }
  hydrate(qc, saved.state);
  return true;
}

/** Ghi cache xuống IndexedDB mỗi khi query POS thay đổi (gộp trong 1s). Trả về hàm huỷ. */
export function persistQueryCache(qc: QueryClient, buster: string): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const save = () => {
    timer = null;
    void idb.set(STORAGE_KEY, {
      buster,
      savedAt: Date.now(),
      state: snapshot(qc),
    } satisfies PersistedCache);
  };
  const unsubscribe = qc.getQueryCache().subscribe((event) => {
    if (event.type !== "updated" && event.type !== "removed") return;
    if (!isPersistableQueryKey(event.query.queryKey)) return;
    timer ??= setTimeout(save, SAVE_THROTTLE_MS);
  });
  return () => {
    unsubscribe();
    if (timer) {
      clearTimeout(timer);
      save();
    }
  };
}

export function clearPersistedQueryCache(): Promise<void> {
  return idb.del(STORAGE_KEY);
}

/** Khoá phân biệt cache theo người dùng + tenant (sub trong JWT, không giải mã chữ ký). */
export function cacheBuster(accessToken: string | null, tenantId: string | null): string | null {
  if (!accessToken || !tenantId) return null;
  try {
    const payload = accessToken.split(".")[1] ?? "";
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as {
      sub?: string;
    };
    return json.sub ? `v1:${json.sub}:${tenantId}` : null;
  } catch {
    return null;
  }
}
