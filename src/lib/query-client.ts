import { QueryClient } from "@tanstack/react-query";
import { PERSISTED_QUERY_ROOTS } from "@/lib/offline/query-persist";

export function createQueryClient() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, err: unknown) => {
          const status = (err as { status?: number })?.status;
          if (status && status >= 400 && status < 500) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  // Query POS (menu, bàn, đơn đang mở, cơ sở) được lưu xuống máy (lib/offline/query-persist):
  //  - offlineFirst: vẫn thử gọi 1 lần (service worker / mạng chập chờn), lỗi mạng thì tạm dừng
  //    thay vì báo lỗi → POS hiển thị dữ liệu cache khi mất mạng
  //  - gcTime 24h: không bị dọn khỏi bộ nhớ khi tạm thời không có màn hình nào dùng
  for (const root of PERSISTED_QUERY_ROOTS) {
    qc.setQueryDefaults([root], { networkMode: "offlineFirst", gcTime: 24 * 60 * 60_000 });
  }
  return qc;
}
