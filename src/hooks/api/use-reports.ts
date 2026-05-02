"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";

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
  const v = venueId ?? activeVenueId;
  return useQuery({
    queryKey: ["reports", "today", v],
    enabled: isAuthenticated,
    queryFn: () =>
      apiGet<DailySalesSummary>(`/reports/today${v ? `?venueId=${v}` : ""}`),
    refetchInterval: 30_000,
  });
}
