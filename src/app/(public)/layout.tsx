"use client";

import { ReactNode, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/query-client";

/**
 * Public route group — customer PWA, không cần đăng nhập.
 * Hoàn toàn tách biệt với (main) staff app:
 *   - Không sidebar
 *   - Không AuthProvider staff
 *   - QueryClient riêng (cookie-based, không Bearer token)
 *
 * Layout chỉ wrap providers tối thiểu. Theme inherit từ root layout.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {/* Toaster dùng chung ở root (AppProviders) — thêm 1 cái nữa ở đây sẽ hiện mỗi thông báo 2 lần */}
      <div className="bg-background text-foreground min-h-svh">{children}</div>
    </QueryClientProvider>
  );
}
