"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import type { Order, OrderStatus } from "@/types/api";

export type KitchenStatus = "queued" | "preparing" | "ready" | "served" | "cancelled";

export function useOrders(filter?: { venueId?: string | null; status?: OrderStatus }) {
  const { isAuthenticated, activeVenueId } = useAuth();
  const v = filter?.venueId ?? activeVenueId;
  const params = new URLSearchParams();
  if (v) params.set("venueId", v);
  if (filter?.status) params.set("status", filter.status);
  const qs = params.toString();
  return useQuery({
    queryKey: ["orders", v, filter?.status],
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useSendOrderToKitchen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost<Order>(`/orders/${id}/send-to-kitchen`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiPost<Order>(`/orders/${id}/cancel`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
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
    }) =>
      apiPatch<Order>(`/orders/${orderId}/lines/${lineId}/kitchen-status`, { status }),
    // Optimistic — KDS cần feel snappy
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["orders"] });
      const prev = qc.getQueryData<Order[]>(["orders"]);
      qc.setQueriesData<Order[]>({ queryKey: ["orders"] }, (old) =>
        old?.map((o) =>
          o.id === vars.orderId
            ? {
                ...o,
                lines: o.lines.map((l) =>
                  l.id === vars.lineId ? { ...l, kitchenStatus: vars.status } : l,
                ),
              }
            : o,
        ),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["orders"], ctx.prev);
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
