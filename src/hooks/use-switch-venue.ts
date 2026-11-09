"use client";

import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useCartStore } from "@/lib/cart-store";

/** Query gắn với cơ sở đang chọn — xoá khi đổi cơ sở để không hiện nhầm dữ liệu cơ sở cũ. */
const VENUE_SCOPED_KEYS = new Set([
  "orders",
  "tables",
  "menu-items",
  "menu-categories",
  "payments",
  "payment-qr",
  "reports",
  "venue",
]);

/**
 * Đổi cơ sở đang làm việc: cất/khôi phục giỏ POS theo cơ sở, xoá cache TanStack của cơ sở cũ,
 * rồi đổi `activeVenueId` (api-client gửi `X-Venue-Id` mới; realtime tự kết nối lại).
 */
export function useSwitchVenue() {
  const qc = useQueryClient();
  const { activeVenueId, switchVenue } = useAuth();
  return useCallback(
    (venueId: string) => {
      if (venueId === activeVenueId) return;
      useCartStore.getState().syncVenue(venueId);
      qc.removeQueries({
        predicate: (q) => VENUE_SCOPED_KEYS.has(String(q.queryKey[0])),
      });
      switchVenue(venueId);
      // Danh sách nhân viên / cơ sở là toàn tenant nhưng quyền xem phụ thuộc cơ sở → tải lại
      void qc.invalidateQueries({ queryKey: ["staff"] });
      void qc.invalidateQueries({ queryKey: ["venues"] });
    },
    [qc, activeVenueId, switchVenue],
  );
}

/** Gắn giỏ POS với cơ sở đang chọn (kể cả khi cơ sở đổi do đăng nhập / tự chọn cơ sở đầu). */
export function useCartVenueSync() {
  const { activeVenueId } = useAuth();
  useEffect(() => {
    useCartStore.getState().syncVenue(activeVenueId);
  }, [activeVenueId]);
}
