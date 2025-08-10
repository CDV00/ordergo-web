"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SearchBar } from "@/components/search-bar";
import { Notifications } from "@/components/notifications";
import { MobileHeader } from "@/components/mobile-header";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"; // Xóa SidebarProvider
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  UtensilsCrossed,
  Users,
  Clock,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ChefHat,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const stats = [
  {
    title: "Đơn hàng hôm nay",
    value: "47",
    change: "+12%",
    trend: "up",
    icon: UtensilsCrossed,
    color: "text-blue-600",
  },
  {
    title: "Bàn đang phục vụ",
    value: "12/20",
    change: "+3 bàn",
    trend: "up",
    icon: Users,
    color: "text-green-600",
  },
  {
    title: "Thời gian chờ TB",
    value: "8 phút",
    change: "-2 phút",
    trend: "down",
    icon: Clock,
    color: "text-purple-600",
  },
  {
    title: "Doanh thu hôm nay",
    value: "₫8,450,000",
    change: "+15%",
    trend: "up",
    icon: DollarSign,
    color: "text-orange-600",
  },
];

const activeTables = [
  {
    id: "T001",
    table: "Bàn 1",
    customers: 4,
    status: "Đang ăn",
    orderTime: "18:30",
    dishes: ["Phở bò", "Cơm gà", "Nước cam"],
    total: "₫320,000",
    waitTime: "25 phút",
  },
  {
    id: "T003",
    table: "Bàn 3",
    customers: 2,
    status: "Chờ món",
    orderTime: "19:15",
    dishes: ["Bún bò Huế", "Chả cá"],
    total: "₫180,000",
    waitTime: "12 phút",
  },
  {
    id: "T005",
    table: "Bàn 5",
    customers: 6,
    status: "Vừa gọi món",
    orderTime: "19:45",
    dishes: ["Lẩu thái", "Cơm chiên"],
    total: "₫450,000",
    waitTime: "2 phút",
  },
  {
    id: "T007",
    table: "Bàn 7",
    customers: 3,
    status: "Chờ thanh toán",
    orderTime: "18:00",
    dishes: ["Cơm tấm", "Bánh mì", "Cà phê"],
    total: "₫150,000",
    waitTime: "45 phút",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Đang ăn":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "Chờ món":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "Vừa gọi món":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "Chờ thanh toán":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

const quickActions = [
  {
    title: "Thêm đơn mới",
    icon: UtensilsCrossed,
    color: "bg-blue-500",
    url: "orders",
  },
  { title: "Xem menu", icon: ChefHat, color: "bg-green-500", url: "menu" },
  { title: "Đặt bàn", icon: Users, color: "bg-purple-500", url: "tables" },
  {
    title: "Thanh toán",
    icon: DollarSign,
    color: "bg-orange-500",
    url: "payments",
  },
];

export default function Dashboard() {
  return (
    <>
      {/* Mobile Header */}
      <MobileHeader />
      {/* Desktop Header */}
      <header
        className="hidden lg:flex h-16 shrink-0 items-center gap-2 border-b mobile-padding lg:ml-40 
             fixed top-0 right-0 left-0 z-50 bg-white"
      >
        {/* <SidebarTrigger className="-ml-1" /> */}
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Tổng quan</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center space-x-4">
          <SearchBar />
          <Notifications />
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 px-4 sm:px-6 lg:px-8 py-4 lg:pl-50 mt-16">
        {/* Stats Cards - Responsive Grid */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="min-h-[100px] sm:min-h-[120px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium leading-tight">
                  {stat.title}
                </CardTitle>
                <stat.icon
                  className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color} flex-shrink-0`}
                />
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-lg sm:text-2xl font-bold">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1 flex-shrink-0" />
                  )}
                  <span className="truncate">{stat.change} so với hôm qua</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions - Mobile Optimized */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl">Thao tác nhanh</CardTitle>
            <CardDescription className="text-sm">
              Các chức năng thường dùng trong ca làm việc
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {quickActions.map((action) => (
                <Button
                  asChild
                  key={action.title}
                  variant="outline"
                  className="h-16 sm:h-20 flex-col space-y-2 bg-transparent min-h-[44px] min-w-[44px]"
                >
                  <Link href={`/${action.url}`}>
                    <div
                      className={`p-2 rounded-lg ${action.color} text-white`}
                    >
                      <action.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <span className="text-xs sm:text-sm text-center leading-tight">
                      {action.title}
                    </span>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Tables - Responsive Layout */}
        <div className="grid gap-4 lg:grid-cols-7">
          {/* Active Tables */}
          <Card className="lg:col-span-5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl">
                Bàn đang hoạt động
              </CardTitle>
              <CardDescription className="text-sm">
                Theo dõi tình trạng các bàn ăn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {activeTables.map((table) => (
                  <div
                    key={table.table}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0"
                  >
                    <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1">
                      <div className="font-semibold text-base sm:text-lg flex-shrink-0">
                        {table.table}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                          <div>
                            <p className="text-sm font-medium">
                              {table.customers} khách
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Gọi món: {table.orderTime}
                            </p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">
                              {table.dishes.join(", ")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Chờ: {table.waitTime}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end sm:space-x-4">
                      <Badge className={getStatusColor(table.status)}>
                        {table.status}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm font-medium">{table.total}</p>
                        <Link href={`/tables/${table.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-1 touch-friendly bg-transparent"
                          >
                            Chi tiết
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Today Summary */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl">
                Tóm tắt ca làm
              </CardTitle>
              <CardDescription className="text-sm">
                Thông tin tổng quan ca hôm nay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tổng đơn hàng</span>
                  <span className="text-sm font-medium">47</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Món bán chạy</span>
                  <span className="text-sm font-medium">Phở bò</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Khách hàng mới</span>
                  <span className="text-sm font-medium">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Đánh giá TB</span>
                  <span className="text-sm font-medium">4.8/5 ⭐</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Bàn trống</span>
                  <span className="text-sm font-medium">8/20</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-medium">
                  <span className="text-sm">Doanh thu ca</span>
                  <span className="text-sm">₫8,450,000</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
