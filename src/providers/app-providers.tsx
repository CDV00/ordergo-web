"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode, useState } from "react";
import { Toaster } from "sonner";
import { MotionConfig } from "motion/react";
import { createQueryClient } from "@/lib/query-client";
import { AuthProvider } from "@/contexts/auth-context";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Hiệu ứng (motion / animate-ui) tự tắt khi người dùng bật "giảm chuyển động" trong hệ điều hành */}
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
        <Toaster position="top-right" richColors />
      </AuthProvider>
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
}
