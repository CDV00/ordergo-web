"use client";

import { useEffect, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { Socket } from "socket.io-client";
import { createRealtimeSocket, RT } from "@/lib/realtime";

/**
 * Realtime cho trang khách QR: 1 socket / phiên (dùng chung giữa các hook trên trang, đếm ref).
 * Đơn của bàn đổi trạng thái → làm mới danh sách đơn của phiên.
 */
const shared = new Map<string, { socket: Socket; refs: number; connected: boolean }>();
const subscribers = new Map<string, Set<(connected: boolean) => void>>();

function acquire(sessionId: string, qc: QueryClient) {
  let entry = shared.get(sessionId);
  if (!entry) {
    const socket = createRealtimeSocket(() => ({ sessionId }));
    entry = { socket, refs: 0, connected: false };
    const e = entry;
    const notify = (c: boolean) => {
      e.connected = c;
      subscribers.get(sessionId)?.forEach((fn) => fn(c));
    };
    socket.on(RT.Ready, () => notify(true));
    socket.on("disconnect", () => notify(false));
    socket.on(RT.OrderChanged, () => {
      qc.invalidateQueries({ queryKey: ["public-orders", sessionId] });
      qc.invalidateQueries({ queryKey: ["public-session", sessionId] });
    });
    socket.connect();
    shared.set(sessionId, entry);
  }
  entry.refs++;
  return entry;
}

function release(sessionId: string) {
  const entry = shared.get(sessionId);
  if (!entry) return;
  entry.refs--;
  if (entry.refs <= 0) {
    entry.socket.removeAllListeners();
    entry.socket.disconnect();
    shared.delete(sessionId);
  }
}

/** Trả về `true` khi đang nhận cập nhật trực tiếp (để giãn polling). */
export function usePublicRealtime(sessionId: string | null): boolean {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    const entry = acquire(sessionId, qc);
    setConnected(entry.connected);
    const subs = subscribers.get(sessionId) ?? new Set();
    subs.add(setConnected);
    subscribers.set(sessionId, subs);
    return () => {
      subs.delete(setConnected);
      release(sessionId);
    };
  }, [sessionId, qc]);

  return connected;
}
