"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import type { RestaurantTable, TableStatus } from "@/types/api";

export function useTables(venueId?: string | null) {
  const { isAuthenticated, activeVenueId } = useAuth();
  const v = venueId ?? activeVenueId;
  return useQuery({
    queryKey: ["tables", v],
    enabled: isAuthenticated && !!v,
    queryFn: () => apiGet<RestaurantTable[]>(`/tables?venueId=${v}`),
  });
}

export function useCreateTable() {
  const qc = useQueryClient();
  const { activeVenueId } = useAuth();
  return useMutation({
    mutationFn: (body: { section?: string; name: string; capacity?: number; venueId?: string }) =>
      apiPost<RestaurantTable>("/tables", {
        venueId: body.venueId ?? activeVenueId ?? "",
        ...body,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  });
}

export function useUpdateTable(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<{ section: string; name: string; capacity: number }>) =>
      apiPatch<RestaurantTable>(`/tables/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  });
}

export function useChangeTableStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TableStatus }) =>
      apiPatch<RestaurantTable>(`/tables/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  });
}

export function useDeleteTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/tables/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  });
}
