import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProviders } from "@/providers/app-providers";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "OrderGo - Quản lý đơn hàng thông minh",
  description: "Hệ thống quản lý vận hành nhà hàng, khách sạn, dịch vụ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      {/* suppressHydrationWarning trên body: extension trình duyệt (vd: Bitdefender
          Anti-tracker, Grammarly) hay inject attribute (`bis_register`, `__processed_*`,
          `data-gr-ext-*`) vào body sau SSR, gây hydration mismatch giả. */}
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AppProviders>{children}</AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
