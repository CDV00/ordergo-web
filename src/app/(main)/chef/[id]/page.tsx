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
import {
  Phone,
  Mail,
  Briefcase,
  UtensilsCrossed,
  CheckCircle,
} from "lucide-react";
import { getOrderItemStatusColor } from "@/utils/getStatusColor";
import Link from "next/link";
import { orders, staff } from "@/app/data";

const getStaffStatusColor = (status: string) => {
  switch (status) {
    case "Đang làm việc":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "Nghỉ phép":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "Nghỉ việc":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

export default function ChefDetailPage() {
  const params = useParams();
  const chefId = params.id as string;
  const chef = staff.find((s) => s.id === chefId && s.role === "Đầu bếp");

  // Filter items that are "Đang nấu" from all orders
  const cookingItems = orders.flatMap((order) =>
    order.items
      .filter((item) => item.status === "Đang nấu")
      .map((item) => ({
        ...item,
        orderId: order.id,
        table: order.table,
        orderTime: order.orderTime,
        customer: order.customer,
      })),
  );

  const handleMarkItemAsReady = (orderId: string, itemName: string) => {
    alert(
      `Đầu bếp ${chef?.name} đã hoàn thành món "${itemName}" của đơn hàng ${orderId}.`,
    );
    // In a real application, you would update the item status in your backend
    // and potentially trigger a notification for the serving staff.
  };

  if (!chef) {
    return (
      <SidebarInset>
        <MobileHeader />
        <header className="hidden lg:flex h-16 shrink-0 items-center gap-2 border-b px-4 sm:px-6 lg:px-8 lg:ml-40">
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Tổng quan</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/chef">Bếp</BreadcrumbLink>
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
            Lỗi: Không tìm thấy đầu bếp
          </h1>
          <p className="text-muted-foreground">
            Đầu bếp với mã "{chefId}" không tồn tại hoặc không phải là đầu bếp.
          </p>
          <Button asChild className="mt-4">
            <Link href="/chef">Quay lại màn hình Bếp</Link>
          </Button>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset>
      <MobileHeader />
      <header className="hidden lg:flex h-16 shrink-0 items-center gap-2 border-b px-4 sm:px-6 lg:px-8 lg:ml-40 fixed top-0 right-0 left-0 z-50">
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/chef">Đầu bếp</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{chef.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex flex-1 flex-col gap-4 px-4 sm:px-6 lg:px-8 py-4 lg:pl-50 mt-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Bảng điều khiển của Đầu bếp: {chef.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Mã đầu bếp: {chef.id}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="min-h-[44px] min-w-[44px] bg-transparent"
              asChild
            >
              <Link href="/chef">Quay lại màn hình Bếp</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
              <CardDescription>Chi tiết về đầu bếp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tên:</span>
                <span className="font-medium">{chef.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Chức vụ:</span>
                <span className="font-medium flex items-center gap-1">
                  <Briefcase className="h-4 w-4" /> {chef.role}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Trạng thái:
                </span>
                <Badge className={getStaffStatusColor(chef.status)}>
                  {chef.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Điện thoại:
                </span>
                <span className="font-medium flex items-center gap-1">
                  <Phone className="h-4 w-4" /> {chef.phone}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="font-medium flex items-center gap-1">
                  <Mail className="h-4 w-4" /> {chef.email}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Các món cần nấu</CardTitle>
              <CardDescription>
                Danh sách các món ăn đang chờ được chế biến
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {cookingItems.length > 0 ? (
                <ul className="space-y-3">
                  {cookingItems.map((item, index) => (
                    <li
                      key={`${item.orderId}-${item.name}-${index}`}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-2 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                        <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {item.name} (x{item.quantity}) - Bàn {item.table}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getOrderItemStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleMarkItemAsReady(item.orderId, item.name)
                          }
                          className="min-h-[36px] min-w-[36px] bg-transparent"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Hoàn thành
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <p>Không có món ăn nào đang chờ nấu.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
  );
}
