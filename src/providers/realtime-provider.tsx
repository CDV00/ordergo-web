"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { apiGet } from "@/lib/api-client";
import { authStorage } from "@/lib/auth-storage";
import {
  createRealtimeSocket,
  RT,
  type OrderChangedEvent,
  type PaymentChangedEvent,
  type TableChangedEvent,
} from "@/lib/realtime";

type Listener = (e: OrderChangedEvent) => void;

interface RealtimeContextValue {
  /** Đang nhận sự kiện trực tiếp → các hook có thể giãn polling */
  connected: boolean;
  /** Đăng ký nghe thay đổi đơn (KDS dùng để kêu "ting"). Trả về hàm huỷ. */
  onOrderChanged: (fn: Listener) => () => void;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  connected: false,
  onOrderChanged: () => () => {},
});

export const useRealtime = () => useContext(RealtimeContext);

/** Khoảng poll dự phòng: có realtime thì 60s (phòng lỡ sự kiện), mất kết nối thì `fallbackMs`. */
export function useLiveInterval(fallbackMs: number): number {
  return useContext(RealtimeContext).connected ? 60_000 : fallbackMs;
}

/**
 * Kết nối realtime cho khu nhân viên. Nhận sự kiện → invalidate đúng query của TanStack,
 * kèm thông báo: khách gọi món qua QR, bếp làm xong món của 1 bàn.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, activeTenantId, activeVenueId } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const listeners = useRef(new Set<Listener>());
  /** Trạng thái đơn đã biết — để chỉ báo "món đã xong" khi vừa chuyển sang ready */
  const lastStatus = useRef(new Map<string, string>());

  const onOrderChanged = useCallback((fn: Listener) => {
    listeners.current.add(fn);
    return () => {
      listeners.current.delete(fn);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !activeTenantId) return;
    const socket = createRealtimeSocket(() => ({
      token: authStorage.getAccess(),
      tenantId: activeTenantId,
      venueId: activeVenueId,
    }));
    let retries = 0;

    socket.on(RT.Ready, () => {
      retries = 0;
      setConnected(true);
      // Có thể đã lỡ thay đổi trong lúc mất kết nối
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["tables"] });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on(RT.Error, async ({ code }: { code: string }) => {
      setConnected(false);
      if (code === "INVALID_TOKEN" && retries < 3) {
        retries++;
        // Gọi 1 API bất kỳ để interceptor refresh access token, rồi kết nối lại
        await apiGet("/me").catch(() => undefined);
        setTimeout(() => socket.connect(), 500);
      }
    });

    socket.on(RT.OrderChanged, (e: OrderChangedEvent) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      if (e.tableId) qc.invalidateQueries({ queryKey: ["tables"] });
      listeners.current.forEach((fn) => fn(e));

      const prev = lastStatus.current.get(e.id);
      lastStatus.current.set(e.id, e.status);
      const where = e.tableName ? `Bàn ${e.tableName}` : "Đơn mang về";
      if (e.op === "insert" && e.source === "qr_menu") {
        toast.info(`${where} vừa gọi món qua QR`, {
          description: e.orderNumber,
          action: { label: "Xem", onClick: () => router.push(`/orders/${e.id}`) },
          duration: 8_000,
        });
      } else if (e.status === "ready" && prev && prev !== "ready") {
        toast.success(`${where}: món đã xong, mời mang ra`, { duration: 6_000 });
      }
    });
    socket.on(RT.TableChanged, (_e: TableChangedEvent) => {
      qc.invalidateQueries({ queryKey: ["tables"] });
    });
    socket.on(RT.PaymentChanged, (e: PaymentChangedEvent) => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["payment-qr", e.orderId] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    });

    socket.connect();
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      setConnected(false);
    };
  }, [isAuthenticated, activeTenantId, activeVenueId, qc, router]);

  const value = useMemo(() => ({ connected, onOrderChanged }), [connected, onOrderChanged]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
