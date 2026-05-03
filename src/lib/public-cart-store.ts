"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PublicCartLine {
  clientLineId: string;
  menuItemId: string;
  variantId: string | null;
  toppingOptionIds: string[];
  quantity: number;
  note: string | null;

  // Snapshot
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  basePrice: number;
  variantName: string | null;
  toppingNames: string[];
}

interface PublicCartState {
  /** key = sessionId — separate cart per session */
  carts: Record<string, PublicCartLine[]>;

  addLine: (sessionId: string, line: Omit<PublicCartLine, "clientLineId">) => void;
  incrementLine: (sessionId: string, clientLineId: string) => void;
  decrementLine: (sessionId: string, clientLineId: string) => void;
  setQuantity: (sessionId: string, clientLineId: string, qty: number) => void;
  setNote: (sessionId: string, clientLineId: string, note: string) => void;
  removeLine: (sessionId: string, clientLineId: string) => void;
  clearCart: (sessionId: string) => void;
}

const genId = () => `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);

const findMatch = (lines: PublicCartLine[], c: Omit<PublicCartLine, "clientLineId">) =>
  lines.find(
    (l) =>
      l.menuItemId === c.menuItemId &&
      l.variantId === c.variantId &&
      l.note === c.note &&
      sameSet(l.toppingOptionIds, c.toppingOptionIds),
  );

export const usePublicCartStore = create<PublicCartState>()(
  persist(
    (set) => ({
      carts: {},

      addLine: (sessionId, candidate) =>
        set((s) => {
          const lines = s.carts[sessionId] ?? [];
          const match = findMatch(lines, candidate);
          if (match) {
            return {
              carts: {
                ...s.carts,
                [sessionId]: lines.map((l) =>
                  l.clientLineId === match.clientLineId
                    ? { ...l, quantity: l.quantity + candidate.quantity }
                    : l,
                ),
              },
            };
          }
          return {
            carts: {
              ...s.carts,
              [sessionId]: [...lines, { clientLineId: genId(), ...candidate }],
            },
          };
        }),

      incrementLine: (sessionId, id) =>
        set((s) => ({
          carts: {
            ...s.carts,
            [sessionId]: (s.carts[sessionId] ?? []).map((l) =>
              l.clientLineId === id ? { ...l, quantity: l.quantity + 1 } : l,
            ),
          },
        })),

      decrementLine: (sessionId, id) =>
        set((s) => ({
          carts: {
            ...s.carts,
            [sessionId]: (s.carts[sessionId] ?? [])
              .map((l) =>
                l.clientLineId === id ? { ...l, quantity: Math.max(0, l.quantity - 1) } : l,
              )
              .filter((l) => l.quantity > 0),
          },
        })),

      setQuantity: (sessionId, id, qty) =>
        set((s) => ({
          carts: {
            ...s.carts,
            [sessionId]:
              qty <= 0
                ? (s.carts[sessionId] ?? []).filter((l) => l.clientLineId !== id)
                : (s.carts[sessionId] ?? []).map((l) =>
                    l.clientLineId === id ? { ...l, quantity: qty } : l,
                  ),
          },
        })),

      setNote: (sessionId, id, note) =>
        set((s) => ({
          carts: {
            ...s.carts,
            [sessionId]: (s.carts[sessionId] ?? []).map((l) =>
              l.clientLineId === id ? { ...l, note: note || null } : l,
            ),
          },
        })),

      removeLine: (sessionId, id) =>
        set((s) => ({
          carts: {
            ...s.carts,
            [sessionId]: (s.carts[sessionId] ?? []).filter((l) => l.clientLineId !== id),
          },
        })),

      clearCart: (sessionId) =>
        set((s) => {
          const next = { ...s.carts };
          delete next[sessionId];
          return { carts: next };
        }),
    }),
    {
      name: "ordergo.public.cart",
      version: 1,
    },
  ),
);

// Selectors — stable references (xem lessons từ cart-store cũ)
const EMPTY: PublicCartLine[] = [];

export const selectPubCartLines =
  (sessionId: string | null) =>
  (s: PublicCartState): PublicCartLine[] => {
    if (!sessionId) return EMPTY;
    return s.carts[sessionId] ?? EMPTY;
  };

export const selectPubCartCount =
  (sessionId: string | null) =>
  (s: PublicCartState): number => {
    if (!sessionId) return 0;
    const lines = s.carts[sessionId];
    if (!lines || lines.length === 0) return 0;
    let total = 0;
    for (const l of lines) total += l.quantity;
    return total;
  };

export const selectPubCartSubtotal =
  (sessionId: string | null) =>
  (s: PublicCartState): number => {
    if (!sessionId) return 0;
    const lines = s.carts[sessionId];
    if (!lines || lines.length === 0) return 0;
    let total = 0;
    for (const l of lines) total += l.unitPrice * l.quantity;
    return total;
  };
