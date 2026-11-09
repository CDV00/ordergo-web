"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { useLiveInterval } from "@/providers/realtime-provider";
import type { KitchenStatus, Order, OrderStatus } from "@/types/api";

export type { KitchenStatus };

/** `status: "open"` = mọi đơn chưa thu/chưa huỷ. */
export function useOrders(filter?: {
  venueId?: string | null;
  status?: OrderStatus | "open";
  tableId?: string | null;
}) {
  const { isAuthenticated, activeVenueId } = useAuth();
  const interval = useLiveInterval(5_000);
  const v = filter?.venueId ?? activeVenueId;
  const params = new URLSearchParams();
  if (v) params.set("venueId", v);
  if (filter?.status) params.set("status", filter.status);
  if (filter?.tableId) params.set("tableId", filter.tableId);
  const qs = params.toString();
  return useQuery({
    queryKey: ["orders", v, filter?.status, filter?.tableId],
    enabled: isAuthenticated,
    queryFn: () => apiGet<Order[]>(`/orders${qs ? `?${qs}` : ""}`),
    refetchInterval: interval,
  });
}

export function useOrder(id: string) {
  const { isAuthenticated } = useAuth();
  const interval = useLiveInterval(5_000);
  return useQuery({
    queryKey: ["orders", id],
    enabled: isAuthenticated && !!id,
    queryFn: () => apiGet<Order>(`/orders/${id}`),
    // Realtime invalidate khi có thay đổi; poll dày chỉ khi mất kết nối
    refetchInterval: interval,
  });
}

/** Header `Idempotency-Key` (API lưu 48h) — gửi lại cùng key không tạo trùng. */
const idem = (key?: string) => (key ? { headers: { "Idempotency-Key": key } } : undefined);

export interface CreateOrderInput {
  /** Không gửi trong body — đi qua header. POS offline dùng lib/offline/outbox thay hook này. */
  idempotencyKey?: string;
  orderType: "dine_in" | "takeaway" | "delivery" | "online" | "room_service";
  tableId?: string;
  customerId?: string;
  lines: Array<{
    menuItemId: string;
    variantId?: string;
    toppingOptionIds?: string[];
    quantity: number;
    note?: string;
  }>;
}

export function useCreateOrder() {
  const qc = useQueryClient();
  const { activeVenueId } = useAuth();
  return useMutation({
    mutationFn: ({ idempotencyKey, ...body }: CreateOrderInput) =>
      apiPost<Order>("/orders", { venueId: activeVenueId, ...body }, idem(idempotencyKey)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

export function useSendOrderToKitchen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arg: string | { id: string; idempotencyKey?: string }) => {
      const { id, idempotencyKey } = typeof arg === "string" ? { id: arg } : arg;
      return apiPost<Order>(`/orders/${id}/send-to-kitchen`, undefined, idem(idempotencyKey));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export type OrderLineInput = CreateOrderInput["lines"][number];

/** Gọi thêm món vào đơn đang mở (món mới chưa gửi bếp — gọi useSendOrderToKitchen sau). */
export function useAddOrderLines() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      lines,
      idempotencyKey,
    }: {
      orderId: string;
      lines: OrderLineInput[];
      idempotencyKey?: string;
    }) => apiPost<Order>(`/orders/${orderId}/lines`, { lines }, idem(idempotencyKey)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

/** Đổi số lượng / ghi chú — chỉ món chưa gửi bếp. */
export function useUpdateOrderLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      lineId,
      ...body
    }: {
      orderId: string;
      lineId: string;
      quantity?: number;
      note?: string;
    }) => apiPatch<Order>(`/orders/${orderId}/lines/${lineId}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

/** Bỏ món: chưa gửi bếp → xoá; đã gửi → huỷ (API đòi quyền order.cancel). */
export function useRemoveOrderLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      lineId,
      reason,
    }: {
      orderId: string;
      lineId: string;
      reason?: string;
    }) => {
      await apiDelete(`/orders/${orderId}/lines/${lineId}`, { data: { reason } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

/** value = 0 → bỏ giảm giá. */
export function useApplyDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      ...body
    }: {
      orderId: string;
      type: "percent" | "amount";
      value: number;
      reason?: string;
    }) => apiPost<Order>(`/orders/${orderId}/discount`, body),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["payment-qr", vars.orderId] });
    },
  });
}

export function useMoveOrderTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, tableId }: { orderId: string; tableId: string }) =>
      apiPost<Order>(`/orders/${orderId}/move-table`, { tableId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiPost<Order>(`/orders/${id}/cancel`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

export function useSetLineKitchenStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      lineId,
      status,
    }: {
      orderId: string;
      lineId: string;
      status: KitchenStatus;
    }) => apiPatch<Order>(`/orders/${orderId}/lines/${lineId}/kitchen-status`, { status }),
    // Optimistic — KDS cần feel snappy
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["orders"] });
      // Cache "orders" chứa cả danh sách (Order[]) lẫn 1 đơn (["orders", id] → Order)
      const prev = qc.getQueriesData<Order[] | Order>({ queryKey: ["orders"] });
      const patch = (o: Order): Order =>
        o.id === vars.orderId
          ? {
              ...o,
              lines: o.lines.map((l) =>
                l.id === vars.lineId ? { ...l, kitchenStatus: vars.status } : l,
              ),
            }
          : o;
      qc.setQueriesData<Order[] | Order>({ queryKey: ["orders"] }, (old) => {
        if (!old) return old;
        return Array.isArray(old) ? old.map(patch) : patch(old);
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      for (const [key, data] of ctx?.prev ?? []) qc.setQueryData(key, data);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

/** Orders cho KDS — chỉ status đang ở bếp */
export function useKdsOrders() {
  const { isAuthenticated, activeVenueId } = useAuth();
  const interval = useLiveInterval(2_000);
  return useQuery({
    queryKey: ["orders", "kds", activeVenueId],
    enabled: isAuthenticated && !!activeVenueId,
    queryFn: async () => {
      const sent = await apiGet<Order[]>(`/orders?venueId=${activeVenueId}&status=sent`);
      const inProgress = await apiGet<Order[]>(
        `/orders?venueId=${activeVenueId}&status=in_progress`,
      );
      const ready = await apiGet<Order[]>(`/orders?venueId=${activeVenueId}&status=ready`);
      return [...sent, ...inProgress, ...ready].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    },
    refetchInterval: interval,
    staleTime: 0,
  });
}
