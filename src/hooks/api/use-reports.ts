"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { useLiveInterval } from "@/providers/realtime-provider";

export interface DailySalesSummary {
  date: string;
  venueId: string | null;
  orders: { count: number; cancelledCount: number };
  revenue: { gross: number; net: number; currency: "VND" };
  byPaymentStatus: { paid: number; pending: number };
  byHour: Array<{ hour: number; orderCount: number; revenue: number }>;
  topItems: Array<{ menuItemId: string; name: string; quantity: number; revenue: number }>;
}

export function useTodaySummary(venueId?: string | null) {
  const { isAuthenticated, activeVenueId } = useAuth();
  const interval = useLiveInterval(30_000);
  const v = venueId ?? activeVenueId;
  return useQuery({
    queryKey: ["reports", "today", v],
    enabled: isAuthenticated,
    queryFn: () => apiGet<DailySalesSummary>(`/reports/today${v ? `?venueId=${v}` : ""}`),
    refetchInterval: interval,
  });
}

/** `date` = YYYY-MM-DD theo giờ của cơ sở. */
export function useDailySummary(date: string) {
  const { isAuthenticated, activeVenueId } = useAuth();
  return useQuery({
    queryKey: ["reports", "daily", activeVenueId, date],
    enabled: isAuthenticated && !!activeVenueId,
    queryFn: () =>
      apiGet<DailySalesSummary>(`/reports/daily?venueId=${activeVenueId}&date=${date}`),
  });
}
