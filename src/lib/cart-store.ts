"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  /** Client-side ID — không gửi server, dùng identify line trong UI */
  clientLineId: string;
  menuItemId: string;
  variantId: string | null;
  toppingOptionIds: string[];
  quantity: number;
  note: string | null;

  // Snapshot cho display + tính giá local (server vẫn tính lại)
  name: string;
  imageUrl: string | null;
  unitPrice: number; // base + variant + toppings (VND)
  basePrice: number;
  variantName: string | null;
  toppingNames: string[];
}

export type CartKey = string; // tableId | 'takeaway'

interface VenueCarts {
  carts: Record<CartKey, CartLine[]>;
  activeKey: CartKey | null;
}

interface CartState {
  carts: Record<CartKey, CartLine[]>;
  activeKey: CartKey | null;
  /** Cơ sở sở hữu `carts`/`activeKey` hiện tại (null = chưa gắn, dữ liệu cũ trước khi có đa cơ sở). */
  venueId: string | null;
  /** Giỏ đang dở của các cơ sở khác — khôi phục khi chuyển về (key 'takeaway' trùng giữa các cơ sở). */
  stash: Record<string, VenueCarts>;

  /** Đổi cơ sở: cất giỏ của cơ sở cũ, lấy giỏ của cơ sở mới (gọi lại nhiều lần không sao). */
  syncVenue: (venueId: string | null) => void;

  setActive: (key: CartKey | null) => void;
  addLine: (key: CartKey, line: Omit<CartLine, "clientLineId">) => void;
  incrementLine: (key: CartKey, clientLineId: string) => void;
  decrementLine: (key: CartKey, clientLineId: string) => void;
  setQuantity: (key: CartKey, clientLineId: string, qty: number) => void;
  setNote: (key: CartKey, clientLineId: string, note: string) => void;
  removeLine: (key: CartKey, clientLineId: string) => void;
  clearCart: (key: CartKey) => void;
}

const genId = () => `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);

const findMatch = (lines: CartLine[], c: Omit<CartLine, "clientLineId">) =>
  lines.find(
    (l) =>
      l.menuItemId === c.menuItemId &&
      l.variantId === c.variantId &&
      l.note === c.note &&
      sameSet(l.toppingOptionIds, c.toppingOptionIds),
  );

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      carts: {},
      activeKey: null,
      venueId: null,
      stash: {},

      syncVenue: (venueId) =>
        set((s) => {
          if (!venueId || s.venueId === venueId) return s;
          // Giỏ chưa gắn cơ sở (lần đầu) → coi như của cơ sở đang chọn
          if (s.venueId === null) return { venueId };
          const stash = { ...s.stash };
          const hasLines = Object.values(s.carts).some((l) => l.length > 0);
          if (hasLines) stash[s.venueId] = { carts: s.carts, activeKey: s.activeKey };
          else delete stash[s.venueId];
          const next = stash[venueId] ?? { carts: {}, activeKey: null };
          delete stash[venueId];
          return { venueId, stash, carts: next.carts, activeKey: next.activeKey };
        }),

      setActive: (key) => set({ activeKey: key }),

      addLine: (key, candidate) =>
        set((s) => {
          const lines = s.carts[key] ?? [];
          const match = findMatch(lines, candidate);
          if (match) {
            return {
              carts: {
                ...s.carts,
                [key]: lines.map((l) =>
                  l.clientLineId === match.clientLineId
                    ? { ...l, quantity: l.quantity + candidate.quantity }
                    : l,
                ),
              },
            };
          }
          return {
            carts: { ...s.carts, [key]: [...lines, { clientLineId: genId(), ...candidate }] },
          };
        }),

      incrementLine: (key, id) =>
        set((s) => ({
          carts: {
            ...s.carts,
            [key]: (s.carts[key] ?? []).map((l) =>
              l.clientLineId === id ? { ...l, quantity: l.quantity + 1 } : l,
            ),
          },
        })),

      decrementLine: (key, id) =>
        set((s) => ({
          carts: {
            ...s.carts,
            [key]: (s.carts[key] ?? [])
              .map((l) =>
                l.clientLineId === id ? { ...l, quantity: Math.max(0, l.quantity - 1) } : l,
              )
              .filter((l) => l.quantity > 0),
          },
        })),

      setQuantity: (key, id, qty) =>
        set((s) => ({
          carts: {
            ...s.carts,
            [key]:
              qty <= 0
                ? (s.carts[key] ?? []).filter((l) => l.clientLineId !== id)
                : (s.carts[key] ?? []).map((l) =>
                    l.clientLineId === id ? { ...l, quantity: qty } : l,
                  ),
          },
        })),

      setNote: (key, id, note) =>
        set((s) => ({
          carts: {
            ...s.carts,
            [key]: (s.carts[key] ?? []).map((l) =>
              l.clientLineId === id ? { ...l, note: note || null } : l,
            ),
          },
        })),

      removeLine: (key, id) =>
        set((s) => ({
          carts: {
            ...s.carts,
            [key]: (s.carts[key] ?? []).filter((l) => l.clientLineId !== id),
          },
        })),

      clearCart: (key) =>
        set((s) => {
          const next = { ...s.carts };
          delete next[key];
          return { carts: next };
        }),
    }),
    {
      name: "ordergo.cart",
      version: 2,
      partialize: (s) => ({
        carts: s.carts,
        activeKey: s.activeKey,
        venueId: s.venueId,
        stash: s.stash,
      }),
      // v1 chưa có cơ sở → giữ giỏ, gắn cơ sở ở lần syncVenue đầu tiên
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Partial<CartState>;
        return {
          carts: p.carts ?? {},
          activeKey: p.activeKey ?? null,
          venueId: p.venueId ?? null,
          stash: p.stash ?? {},
        };
      },
    },
  ),
);

// ─── Selectors ───────────────────────────────────────────────────────────
//
// QUAN TRỌNG: snapshot phải reference-stable.
// Trước đây `s.carts[key] ?? []` tạo `[]` literal MỚI mỗi lần selector chạy
// → React `useSyncExternalStore` thấy snapshot khác → re-render vô tận →
// "Maximum update depth exceeded" + "getSnapshot should be cached".
// Dùng EMPTY_LINES module-level constant cho mọi case không có cart.

const EMPTY_LINES: CartLine[] = [];

export const selectCartLines =
  (key: CartKey | null) =>
  (s: CartState): CartLine[] => {
    if (!key) return EMPTY_LINES;
    return s.carts[key] ?? EMPTY_LINES;
  };

// Số nguyên — primitive, reference-stability không cần lo
export const selectCartCount =
  (key: CartKey | null) =>
  (s: CartState): number => {
    if (!key) return 0;
    const lines = s.carts[key];
    if (!lines || lines.length === 0) return 0;
    let total = 0;
    for (const l of lines) total += l.quantity;
    return total;
  };

export const selectCartSubtotal =
  (key: CartKey | null) =>
  (s: CartState): number => {
    if (!key) return 0;
    const lines = s.carts[key];
    if (!lines || lines.length === 0) return 0;
    let total = 0;
    for (const l of lines) total += l.unitPrice * l.quantity;
    return total;
  };
