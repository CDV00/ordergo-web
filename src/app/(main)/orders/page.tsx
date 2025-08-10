"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SearchBar } from "@/components/search-bar";
import { Notifications } from "@/components/notifications";
import { MobileHeader } from "@/components/mobile-header";
import { ResponsiveTable } from "@/components/responsive-table";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Clock, CheckCircle, AlertCircle, Filter } from "lucide-react";
import { orders } from "@/app/data";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Đang nấu":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "Sẵn sàng":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "Đã phục vụ":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "Chờ thanh toán":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "Đã hủy":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" || order.overallStatus === statusFilter;
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.table.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    // <SidebarProvider>
    //   <AppSidebar />
    //   <SidebarInset>

    <>
      {/* Mobile Header */}
      <MobileHeader />
      {/* Desktop Header */}
      <header className="hidden lg:flex h-16 shrink-0 items-center gap-2 border-b px-4 sm:px-6 lg:px-8 lg:ml-40 fixed top-0 right-0 left-0 z-50">
        {/* <SidebarTrigger className="-ml-1" /> */}
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {/* <BreadcrumbItem>
                <BreadcrumbLink href="/">Tổng quan</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator /> */}
            <BreadcrumbItem>
              <BreadcrumbPage>Đơn hàng</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center space-x-4">
          <SearchBar />
          <Notifications />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 sm:px-6 lg:px-8 py-4 lg:ml-40 mt-16">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Quản lý đơn hàng</h1>
            <p className="text-sm text-muted-foreground">
              Theo dõi và xử lý đơn hàng trong nhà hàng
            </p>
          </div>
          <Button className="min-h-[44px] min-w-[44px]">
            <Plus className="mr-2 h-4 w-4" />
            Tạo đơn mới
          </Button>
        </div>

        {/* Quick Stats - Mobile Optimized */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <Card className="min-h-[80px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Đang nấu</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-lg sm:text-2xl font-bold">
                {orders.filter((o) => o.overallStatus === "Đang nấu").length}
              </div>
            </CardContent>
          </Card>
          <Card className="min-h-[80px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Sẵn sàng</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-lg sm:text-2xl font-bold">
                {orders.filter((o) => o.overallStatus === "Sẵn sàng").length}
              </div>
            </CardContent>
          </Card>
          <Card className="min-h-[80px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Đã phục vụ</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-lg sm:text-2xl font-bold">
                {orders.filter((o) => o.overallStatus === "Đã phục vụ").length}
              </div>
            </CardContent>
          </Card>
          <Card className="min-h-[80px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                Chờ thanh toán
              </CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-lg sm:text-2xl font-bold">
                {
                  orders.filter((o) => o.overallStatus === "Chờ thanh toán")
                    .length
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl">
              Danh sách đơn hàng
            </CardTitle>
            <CardDescription className="text-sm">
              Tổng cộng {filteredOrders.length} đơn hàng hôm nay
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters - Mobile Responsive */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
              <Input
                placeholder="Tìm kiếm theo mã đơn, bàn, khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 min-h-[44px] min-w-[44px]"
              />
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] min-h-[44px] min-w-[44px]">
                    <SelectValue placeholder="Lọc theo trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="Đang nấu">Đang nấu</SelectItem>
                    <SelectItem value="Sẵn sàng">Sẵn sàng</SelectItem>
                    <SelectItem value="Đã phục vụ">Đã phục vụ</SelectItem>
                    <SelectItem value="Chờ thanh toán">
                      Chờ thanh toán
                    </SelectItem>
                    <SelectItem value="Đã hủy">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="min-h-[44px] min-w-[44px] lg:hidden bg-transparent"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Responsive Table */}
            <ResponsiveTable
              orders={filteredOrders}
              getStatusColor={getStatusColor}
            />
          </CardContent>
        </Card>
      </div>
    </>
    //   </SidebarInset>
    // </SidebarProvider>
  );
}
