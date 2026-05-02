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

interface CartState {
  carts: Record<CartKey, CartLine[]>;
  activeKey: CartKey | null;

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
      version: 1,
      partialize: (s) => ({ carts: s.carts, activeKey: s.activeKey }),
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
