"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MobileHeader } from "@/components/mobile-header";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
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
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Clock, UtensilsCrossed, User, Phone } from "lucide-react";
import Link from "next/link";
import { getStatusColor } from "@/utils/getStatusColor";
import { orders } from "@/app/data";

const getOrderItemStatusColor = (status: string) => {
  switch (status) {
    case "Đang nấu":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "Sẵn sàng":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "Đã phục vụ":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "Đã hủy":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <SidebarInset>
        <MobileHeader />
        <header className="hidden h-16 shrink-0 items-center gap-2 border-b px-4 sm:px-6 lg:ml-40 lg:flex lg:px-8">
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/orders">Đơn hàng</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Không tìm thấy</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center p-4 lg:ml-40">
          <h1 className="text-2xl font-bold text-red-500">Lỗi: Không tìm thấy đơn hàng</h1>
          <p className="text-muted-foreground">Đơn hàng với mã "{orderId}" không tồn tại.</p>
          <Button asChild className="mt-4">
            <Link href="/orders">Quay lại danh sách đơn hàng</Link>
          </Button>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset>
      <MobileHeader />
      <header className="fixed top-0 right-0 left-0 z-50 hidden h-16 shrink-0 items-center gap-2 border-b px-4 sm:px-6 lg:ml-40 lg:flex lg:px-8">
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/orders">Đơn hàng</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{order.id}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center space-x-4">
          {/* SearchBar and Notifications can be added here if needed */}
        </div>
      </header>
      <div className="mt-16 flex flex-1 flex-col gap-4 px-4 py-4 sm:px-6 lg:ml-40 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Chi tiết đơn hàng: {order.id}</h1>
            <p className="text-muted-foreground text-sm">
              Bàn: {order.table} - Khách hàng: {order.customer}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="min-h-[44px] min-w-[44px] bg-transparent">
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </Button>
            <Button variant="destructive" className="min-h-[44px] min-w-[44px]">
              <Trash2 className="mr-2 h-4 w-4" />
              Hủy đơn
            </Button>
          </div>
        </div>

        <div className="grid flex-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Thông tin chung</CardTitle>
              <CardDescription>Tổng quan về đơn hàng</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Mã đơn:</span>
                <span className="font-medium">{order.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Bàn:</span>
                <span className="font-medium">{order.table}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Khách hàng:</span>
                <span className="flex items-center gap-1 font-medium">
                  <User className="h-4 w-4" /> {order.customer}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Điện thoại:</span>
                <span className="flex items-center gap-1 font-medium">
                  <Phone className="h-4 w-4" /> {order.phone}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Trạng thái:</span>
                <Badge className={getStatusColor(order.overallStatus)}>{order.overallStatus}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Thời gian đặt:</span>
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="h-4 w-4" /> {order.orderTime}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Thời gian chờ:</span>
                <span className="font-medium">{order.waitTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Nhân viên phục vụ:</span>
                <span className="font-medium">{order.server}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t pt-2 text-lg font-semibold">
                <span className="text-muted-foreground text-sm">Tổng tiền:</span>
                <span>{order.total}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Danh sách món ăn</CardTitle>
              <CardDescription>Các món ăn trong đơn hàng này</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.length > 0 ? (
                <ul className="space-y-3">
                  {order.items.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-center space-x-2">
                        <UtensilsCrossed className="text-muted-foreground h-4 w-4" />
                        <span className="text-sm font-medium">
                          {item.name} (x{item.quantity})
                        </span>
                      </div>
                      <Badge className={getOrderItemStatusColor(item.status)}>{item.status}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-muted-foreground py-4 text-center">
                  Đơn hàng này chưa có món ăn nào.
                </div>
              )}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button size="sm" className="min-h-[44px] min-w-[44px] flex-1">
                  Thêm món
                </Button>
                {order.overallStatus === "Chờ thanh toán" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-[44px] min-w-[44px] flex-1 bg-transparent"
                  >
                    Thanh toán
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
  );
}
