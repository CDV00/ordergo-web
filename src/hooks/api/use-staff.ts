"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";

export type StaffRole = "venue_manager" | "cashier" | "server" | "kitchen";

export const ROLE_LABEL: Record<string, string> = {
  owner: "Chủ quán",
  tenant_admin: "Quản trị",
  venue_manager: "Quản lý",
  cashier: "Thu ngân",
  server: "Phục vụ",
  kitchen: "Bếp",
  accountant: "Kế toán",
};

export const ASSIGNABLE_ROLES: StaffRole[] = ["venue_manager", "cashier", "server", "kitchen"];

export interface StaffMember {
  membershipId: string;
  userId: string;
  displayName: string;
  /** Đã che từ API, vd 090****567 */
  phone: string | null;
  roleCode: string;
  venueId: string | null;
  status: "pending" | "active" | "revoked";
  lastLoginAt: string | null;
  isSelf: boolean;
  canManage: boolean;
}

export function useStaff() {
  const { isAuthenticated, activeTenantId } = useAuth();
  return useQuery({
    queryKey: ["staff", activeTenantId],
    enabled: isAuthenticated && !!activeTenantId,
    queryFn: () => apiGet<StaffMember[]>("/staff"),
  });
}

export function useInviteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      phone: string;
      displayName: string;
      roleCode: StaffRole;
      venueId: string;
    }) => apiPost<{ staff: StaffMember; tempPassword: string | null }>("/staff/invite", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; roleCode?: StaffRole; venueId?: string }) =>
      apiPatch<StaffMember>(`/staff/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

export function useSetStaffStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      apiPost<StaffMember>(`/staff/${id}/${active ? "restore" : "revoke"}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      apiPost<{ success: true }>("/auth/change-password", body),
  });
}
