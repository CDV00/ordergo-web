import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"; // Import SidebarProvider
import { AppSidebar } from "@/components/app-sidebar"; // Import AppSidebar
import { MobileHeader } from "@/components/mobile-header";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SearchBar } from "@/components/search-bar";
import { Notifications } from "@/components/notifications";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "OrderGo - Quản lý đơn hàng thông minh",
  description: "Hệ thống quản lý đơn hàng, sản phẩm và vận chuyển",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            {" "}
            {/* SidebarProvider bao bọc toàn bộ ứng dụng */}
            <AppSidebar /> {/* Sidebar được đặt ở đây */}
            <SidebarInset>
              {" "}
              {/* Giữ SidebarInset */}
              {children}
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
