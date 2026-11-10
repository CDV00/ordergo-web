import type React from "react";
import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProviders } from "@/providers/app-providers";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
});

export const metadata: Metadata = {
  title: "OrderGo - Quản lý đơn hàng thông minh",
  description: "Hệ thống quản lý vận hành nhà hàng, khách sạn, dịch vụ",
  // PWA: cài lên tablet/điện thoại, mở toàn màn hình (manifest ở app/manifest.ts)
  appleWebApp: { capable: true, title: "OrderGo", statusBarStyle: "default" },
  icons: { apple: "/pwa-icon/192" },
};

export const viewport: Viewport = {
  themeColor: "#2b211b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      {/* suppressHydrationWarning trên body: extension trình duyệt (vd: Bitdefender
          Anti-tracker, Grammarly) hay inject attribute (`bis_register`, `__processed_*`,
          `data-gr-ext-*`) vào body sau SSR, gây hydration mismatch giả. */}
      <body className={`${beVietnam.variable} font-sans`} suppressHydrationWarning>
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
