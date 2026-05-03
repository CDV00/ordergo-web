"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import type { MenuCategory, MenuItem, ToppingGroup, Variant, Money } from "@/types/api";

export function useMenuCategories(venueId?: string | null) {
  const { isAuthenticated, activeVenueId } = useAuth();
  const v = venueId ?? activeVenueId;
  return useQuery({
    queryKey: ["menu-categories", v],
    enabled: isAuthenticated,
    queryFn: () => apiGet<MenuCategory[]>(`/menu-categories${v ? `?venueId=${v}` : ""}`),
  });
}

export function useCreateMenuCategory() {
  const qc = useQueryClient();
  const { activeVenueId } = useAuth();
  return useMutation({
    mutationFn: (body: {
      name: string;
      description?: string;
      imageUrl?: string;
      displayOrder?: number;
      venueId?: string;
    }) =>
      apiPost<MenuCategory>("/menu-categories", {
        venueId: body.venueId ?? activeVenueId ?? undefined,
        ...body,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-categories"] }),
  });
}

export function useUpdateMenuCategory(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      body: Partial<{
        name: string;
        description: string;
        imageUrl: string;
        displayOrder: number;
        isActive: boolean;
      }>,
    ) => apiPatch<MenuCategory>(`/menu-categories/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-categories"] }),
  });
}

export function useDeleteMenuCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/menu-categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu-categories"] });
      qc.invalidateQueries({ queryKey: ["menu-items"] });
    },
  });
}

export function useMenuItems(filter?: { venueId?: string | null; categoryId?: string }) {
  const { isAuthenticated, activeVenueId } = useAuth();
  const v = filter?.venueId ?? activeVenueId;
  const c = filter?.categoryId;
  const params = new URLSearchParams();
  if (v) params.set("venueId", v);
  if (c) params.set("categoryId", c);
  const qs = params.toString();
  return useQuery({
    queryKey: ["menu-items", v, c],
    enabled: isAuthenticated,
    queryFn: () => apiGet<MenuItem[]>(`/menu-items${qs ? `?${qs}` : ""}`),
  });
}

export function useMenuItem(id: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["menu-items", id],
    enabled: isAuthenticated && !!id,
    queryFn: () => apiGet<MenuItem>(`/menu-items/${id}`),
  });
}

export interface MenuItemInput {
  categoryId: string;
  name: string;
  description?: string;
  sku?: string;
  basePrice: Money;
  imageUrl?: string;
  displayOrder?: number;
  variants?: Array<Omit<Variant, "id"> & { id?: string }>;
  toppingGroups?: Array<
    Omit<ToppingGroup, "id" | "options"> & {
      id?: string;
      options: Array<Omit<ToppingGroup["options"][number], "id"> & { id?: string }>;
    }
  >;
  tags?: string[];
}

export function useCreateMenuItem() {
  const qc = useQueryClient();
  const { activeVenueId } = useAuth();
  return useMutation({
    mutationFn: (body: MenuItemInput) =>
      apiPost<MenuItem>("/menu-items", { venueId: activeVenueId ?? undefined, ...body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
  });
}

export function useUpdateMenuItem(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<MenuItemInput> & { isAvailable?: boolean }) =>
      apiPatch<MenuItem>(`/menu-items/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
  });
}

export function useToggleMenuItemAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      isAvailable,
      reason,
    }: {
      id: string;
      isAvailable: boolean;
      reason?: string;
    }) =>
      apiPatch<MenuItem>(`/menu-items/${id}/availability`, {
        isAvailable,
        unavailableReason: reason,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
  });
}

export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/menu-items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
  });
}
