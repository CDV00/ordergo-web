"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import type { KitchenStatus, Order, OrderStatus } from "@/types/api";

export type { KitchenStatus };

/** `status: "open"` = mọi đơn chưa thu/chưa huỷ. */
export function useOrders(filter?: {
  venueId?: string | null;
  status?: OrderStatus | "open";
  tableId?: string | null;
}) {
  const { isAuthenticated, activeVenueId } = useAuth();
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
    refetchInterval: 5_000,
  });
}

export function useOrder(id: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["orders", id],
    enabled: isAuthenticated && !!id,
    queryFn: () => apiGet<Order>(`/orders/${id}`),
    // Trạng thái bếp đổi liên tục — tới khi có realtime (Phase 2) thì poll
    refetchInterval: 5_000,
  });
}

export interface CreateOrderInput {
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
    mutationFn: (body: CreateOrderInput) =>
      apiPost<Order>("/orders", { venueId: activeVenueId, ...body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

export function useSendOrderToKitchen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost<Order>(`/orders/${id}/send-to-kitchen`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export type OrderLineInput = CreateOrderInput["lines"][number];

/** Gọi thêm món vào đơn đang mở (món mới chưa gửi bếp — gọi useSendOrderToKitchen sau). */
export function useAddOrderLines() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, lines }: { orderId: string; lines: OrderLineInput[] }) =>
      apiPost<Order>(`/orders/${orderId}/lines`, { lines }),
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
    refetchInterval: 2_000,
    staleTime: 0,
  });
}
