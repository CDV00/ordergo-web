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
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { authStorage } from "@/lib/auth-storage";
import { loadOutbox, subscribeOtherTabs, syncOutbox, useOutboxStore } from "@/lib/offline/outbox";
import { OUTBOX_TICK_MS } from "@/lib/offline/outbox-core";
import { cacheBuster, persistQueryCache, restoreQueryCache } from "@/lib/offline/query-persist";
import { OutboxSheet } from "./outbox-sheet";

interface OfflineContextValue {
  /** Gửi hàng đợi ngay (sau khi xếp hàng lúc vẫn có mạng, hoặc bấm "Gửi ngay"). */
  syncNow: () => void;
  openOutbox: () => void;
}

const OfflineContext = createContext<OfflineContextValue>({
  syncNow: () => {},
  openOutbox: () => {},
});

export const useOffline = () => useContext(OfflineContext);

/** Thời gian tối đa chờ nạp cache trước khi vẫn hiện giao diện. */
const RESTORE_TIMEOUT_MS = 1_500;

/** Chỉ đăng ký service worker ở bản build production (dev server của Next không cần/không hợp). */
function registerServiceWorker() {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.NEXT_PUBLIC_SW_DISABLED === "1") return;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => undefined);
}

/**
 * POS chạy được khi rớt mạng ngắn:
 *  - nạp/lưu cache query POS (IndexedDB) → mở POS được khi offline
 *  - hàng đợi đơn chờ gửi: gửi lại khi có mạng, lúc mở app và mỗi 15s nếu còn
 *  - toast khi gửi xong / khi có bước lỗi, sheet danh sách hàng đợi
 */
export function OfflineProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, activeTenantId } = useAuth();
  const qc = useQueryClient();
  const [restored, setRestored] = useState(false);
  const [outboxOpen, setOutboxOpen] = useState(false);
  const tenantRef = useRef(activeTenantId);
  tenantRef.current = activeTenantId;

  // ─── Cache query ────────────────────────────────────────
  useEffect(() => {
    const buster = cacheBuster(authStorage.getAccess(), activeTenantId);
    if (!isAuthenticated || !buster) {
      setRestored(true);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(() => setRestored(true), RESTORE_TIMEOUT_MS);
    void restoreQueryCache(qc, buster)
      .catch(() => false)
      .finally(() => {
        if (cancelled) return;
        clearTimeout(timeout);
        setRestored(true);
      });
    const stop = persistQueryCache(qc, buster);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      stop();
    };
  }, [isAuthenticated, activeTenantId, qc]);

  useEffect(registerServiceWorker, []);

  // ─── Hàng đợi ───────────────────────────────────────────
  const syncNow = useCallback(() => {
    const tenantId = tenantRef.current;
    if (!tenantId) return;
    void syncOutbox(tenantId).then((r) => {
      if (r.sentGroups > 0) {
        toast.success(`Đã gửi ${r.sentGroups} đơn chờ`);
        void qc.invalidateQueries({ queryKey: ["orders"] });
        void qc.invalidateQueries({ queryKey: ["tables"] });
      }
      if (r.newlyFailed > 0) {
        toast.error(`${r.newlyFailed} thao tác chờ gửi bị lỗi`, {
          description: "Mở danh sách chờ gửi để thử lại hoặc bỏ.",
          action: { label: "Xem", onClick: () => setOutboxOpen(true) },
          duration: 10_000,
        });
      }
    });
  }, [qc]);

  useEffect(() => {
    if (!isAuthenticated || !activeTenantId) return;
    void loadOutbox().then(syncNow);
    const unsubscribeTabs = subscribeOtherTabs(() => {});
    window.addEventListener("online", syncNow);
    const tick = setInterval(() => {
      if (useOutboxStore.getState().items.length > 0) syncNow();
    }, OUTBOX_TICK_MS);
    return () => {
      unsubscribeTabs();
      window.removeEventListener("online", syncNow);
      clearInterval(tick);
    };
  }, [isAuthenticated, activeTenantId, syncNow]);

  const value = useMemo(() => ({ syncNow, openOutbox: () => setOutboxOpen(true) }), [syncNow]);

  if (!restored) {
    return (
      <div className="text-muted-foreground flex h-svh items-center justify-center">
        Đang tải...
      </div>
    );
  }

  return (
    <OfflineContext.Provider value={value}>
      {children}
      <OutboxSheet
        open={outboxOpen}
        onOpenChange={setOutboxOpen}
        tenantId={activeTenantId}
        onSyncNow={syncNow}
      />
    </OfflineContext.Provider>
  );
}
