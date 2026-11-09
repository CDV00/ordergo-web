import { io, type Socket } from "socket.io-client";
import { API_ORIGIN } from "@/lib/media";

/** Sự kiện server → client (khớp `RealtimeEvent` ở API). Payload chỉ có id + trạng thái. */
export const RT = {
  OrderChanged: "order.changed",
  TableChanged: "table.changed",
  PaymentChanged: "payment.changed",
  Ready: "realtime.ready",
  Error: "realtime.error",
} as const;

export interface OrderChangedEvent {
  op: "insert" | "update" | "replace" | "delete";
  id: string;
  venueId: string;
  tableId: string | null;
  tableName: string | null;
  orderNumber: string;
  status: string;
  source: string;
  kitchen: { queued: number; preparing: number; ready: number };
}

export interface TableChangedEvent {
  id: string;
  venueId: string;
  status: string;
}

export interface PaymentChangedEvent {
  id: string;
  venueId: string;
  orderId: string;
  amount: number;
  method: string;
}

/**
 * Socket tới namespace /realtime. `auth` là hàm → mỗi lần (re)connect lấy token/venue mới nhất.
 * Server tự ngắt khi xác thực lỗi (`realtime.error`); caller quyết định có kết nối lại hay không.
 */
export function createRealtimeSocket(auth: () => Record<string, string | null | undefined>) {
  return io(`${API_ORIGIN}/realtime`, {
    autoConnect: false,
    transports: ["websocket", "polling"],
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 10_000,
    auth: (cb) => {
      const raw = auth();
      cb(Object.fromEntries(Object.entries(raw).filter(([, v]) => !!v)) as Record<string, string>);
    },
  }) as Socket;
}
