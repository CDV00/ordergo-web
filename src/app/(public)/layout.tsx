"use client";

import { ReactNode, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
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
      <div className="bg-background text-foreground min-h-svh">{children}</div>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
