"use client";

import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MobileHeader } from "@/components/mobile-header";
import { SidebarInset } from "@/components/ui/sidebar";
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
import { DollarSign, UtensilsCrossed, User, Phone } from "lucide-react";
import {
  getStatusColor,
  getOrderItemStatusColor,
} from "@/utils/getStatusColor";
import Link from "next/link";
import { Users } from "lucide-react"; // Import Users component
import { tables } from "../../tables/page";
import { orders } from "../../orders/page";
import { staff } from "../../staff/page";

const getTableStatusColor = (status: string) => {
  switch (status) {
    case "Trống":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    case "Đang phục vụ":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "Chờ món":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "Vừa gọi món":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "Chờ thanh toán":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "Cần dọn dẹp":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

export default function TablePaymentPage() {
  const params = useParams();
  const tableId = params.id as string;
  const table = tables.find((t) => t.id === tableId);

  const currentOrder =
    orders.find(
      (o) =>
        o.table === table?.name &&
        o.overallStatus !== "Đã hủy" &&
        o.overallStatus !== "Chờ thanh toán",
    ) ||
    orders.find(
      (o) => o.table === table?.name && o.overallStatus === "Chờ thanh toán",
    ); // Prioritize "Chờ thanh toán" if exists

  const assignedStaff = staff.find((s) => s.name === currentOrder?.server);

  if (!table) {
    return (
      <SidebarInset>
        <MobileHeader />
        <header className="hidden lg:flex h-16 shrink-0 items-center gap-2 border-b px-4 sm:px-6 lg:px-8 lg:ml-40 fixed top-0 right-0 left-0 z-50">
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/payments">Thanh toán</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Không tìm thấy</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center p-4 lg:pl-50">
          <h1 className="text-2xl font-bold text-red-500">
            Lỗi: Không tìm thấy bàn
          </h1>
          <p className="text-muted-foreground">
            Bàn với mã "{tableId}" không tồn tại.
          </p>
          <Button asChild className="mt-4">
            <Link href="/payments">Quay lại danh sách thanh toán</Link>
          </Button>
        </div>
      </SidebarInset>
    );
  }

  const handleProcessPayment = () => {
    if (currentOrder) {
      alert(
        `Đã xử lý thanh toán cho đơn hàng ${currentOrder.id} của bàn ${table.name}. Tổng tiền: ${currentOrder.total}`,
      );
      // In a real application, you would update the order status in your backend
      // and potentially create a new payment record.
    } else {
      alert(
        `Không có đơn hàng nào đang hoạt động để thanh toán cho bàn ${table.name}.`,
      );
    }
  };

  return (
    <SidebarInset>
      <MobileHeader />
      <header className="hidden lg:flex h-16 shrink-0 items-center gap-2 border-b px-4 sm:px-6 lg:px-8 lg:ml-40 fixed top-0 right-0 left-0 z-50">
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/payments">Thanh toán</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{table.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex flex-1 flex-col gap-4 px-4 sm:px-6 lg:px-8 py-4 lg:pl-50 mt-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Thanh toán cho {table.name}
            </h1>
            <p className="text-sm text-muted-foreground">Mã bàn: {table.id}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="min-h-[44px] min-w-[44px] bg-transparent"
              asChild
            >
              <Link href="/payments">Quay lại</Link>
            </Button>
            <Button
              className="min-h-[44px] min-w-[44px]"
              onClick={handleProcessPayment}
              disabled={!currentOrder}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Thanh toán
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Thông tin bàn</CardTitle>
              <CardDescription>Tổng quan về bàn ăn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Trạng thái:
                </span>
                <Badge className={getTableStatusColor(table.status)}>
                  {table.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sức chứa:</span>
                <span className="font-medium flex items-center gap-1">
                  <Users className="h-4 w-4" /> {table.capacity} người
                </span>
              </div>
              {table.customers !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Số khách hiện tại:
                  </span>
                  <span className="font-medium">{table.customers}</span>
                </div>
              )}
              {table.orderTime && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Thời gian gọi món:
                  </span>
                  <span className="font-medium">{table.orderTime}</span>
                </div>
              )}
              {table.waitTime && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Thời gian chờ:
                  </span>
                  <span className="font-medium">{table.waitTime}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-1 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Đơn hàng hiện tại</CardTitle>
              <CardDescription>
                Chi tiết đơn hàng cần thanh toán
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentOrder ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Mã đơn:
                    </span>
                    <span className="font-medium">{currentOrder.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Khách hàng:
                    </span>
                    <span className="font-medium flex items-center gap-1">
                      <User className="h-4 w-4" /> {currentOrder.customer}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Điện thoại:
                    </span>
                    <span className="font-medium flex items-center gap-1">
                      <Phone className="h-4 w-4" /> {currentOrder.phone}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Trạng thái đơn:
                    </span>
                    <Badge
                      className={getStatusColor(currentOrder.overallStatus)}
                    >
                      {currentOrder.overallStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Nhân viên phục vụ:
                    </span>
                    <span className="font-medium">
                      {assignedStaff?.name || currentOrder.server}
                    </span>
                  </div>
                  <Separator className="my-3" />
                  <p className="text-sm font-semibold text-muted-foreground mb-2">
                    Các món ăn:
                  </p>
                  <ul className="space-y-2">
                    {currentOrder.items.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {item.name} (x{item.quantity})
                          </span>
                        </div>
                        <Badge className={getOrderItemStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between font-semibold text-lg">
                    <span className="text-sm text-muted-foreground">
                      Tổng tiền:
                    </span>
                    <span>{currentOrder.total}</span>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <p>Bàn này hiện không có đơn hàng đang hoạt động.</p>
                  <Button size="sm" className="mt-2">
                    Tạo đơn mới
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
  );
}
