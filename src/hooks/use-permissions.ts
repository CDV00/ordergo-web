"use client";

import { useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { MOBILE_NAV, NAV_FOOTER, NAV_GROUPS, type NavGroup, type NavItem } from "@/lib/nav-config";
import { hasPermission } from "@/lib/permissions";

/**
 * Quyền hiệu lực ở tenant/venue đang chọn = membership toàn tenant (nếu có) ∪ membership của venue.
 * Lấy từ /me (cập nhật khi đổi vai trò) thay vì chỉ quyền lúc đăng nhập.
 */
export function usePermissions() {
  const { memberships, permissions, activeTenantId, activeVenueId } = useAuth();
  const effective = useMemo(() => {
    const mine = memberships.filter(
      (m) =>
        m.tenantId === activeTenantId &&
        m.status === "active" &&
        (m.venueId === null || m.venueId === activeVenueId),
    );
    return mine.length > 0 ? [...new Set(mine.flatMap((m) => m.permissions))] : permissions;
  }, [memberships, permissions, activeTenantId, activeVenueId]);

  return useMemo(
    () => ({ permissions: effective, can: (p?: string | null) => hasPermission(effective, p) }),
    [effective],
  );
}

/** Menu đã lọc theo quyền (nhóm rỗng bị bỏ). */
export function useVisibleNav(): { groups: NavGroup[]; footer: NavItem[]; mobile: NavItem[] } {
  const { can } = usePermissions();
  return useMemo(() => {
    const allow = (i: NavItem) => can(i.permission);
    return {
      groups: NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter(allow) })).filter(
        (g) => g.items.length > 0,
      ),
      footer: NAV_FOOTER.filter(allow),
      mobile: MOBILE_NAV.filter(allow),
    };
  }, [can]);
}
