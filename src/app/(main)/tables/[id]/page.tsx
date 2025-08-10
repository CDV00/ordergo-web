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
import { Users, Edit, Plus } from "lucide-react";
import Link from "next/link";
import { staff, tables } from "../page";

const getStatusColor = (status: string) => {
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

export default function TableDetailPage() {
  const params = useParams();
  const tableId = params.id as string;
  const table = tables.find((t) => t.id === tableId);

  if (!table) {
    return (
      <>
        <MobileHeader />
        <header className="hidden lg:flex h-16 shrink-0 items-center gap-2 border-b px-4 sm:px-6 lg:px-8 lg:ml-40">
          {/* <SidebarTrigger className="-ml-1" /> */}
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {/* <BreadcrumbItem>
                <BreadcrumbLink href="/">Tổng quan</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator /> */}
              <BreadcrumbItem>
                <BreadcrumbLink href="/tables">Bàn ăn</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Không tìm thấy</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center p-4 lg:ml-40">
          <h1 className="text-2xl font-bold text-red-500">
            Lỗi: Không tìm thấy bàn
          </h1>
          <p className="text-muted-foreground">
            Bàn với mã "{tableId}" không tồn tại.
          </p>
          <Button asChild className="mt-4">
            <Link href="/tables">Quay lại danh sách bàn</Link>
          </Button>
        </div>
      </>
    );
  }

  const assignedStaff = staff.find((s) => s.id === table.assignedStaffId);

  return (
    <>
      <MobileHeader />
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
              <BreadcrumbLink href="/tables">Bàn ăn</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{table.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center space-x-4">
          {/* SearchBar and Notifications can be added here if needed */}
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 px-4 sm:px-6 lg:px-8 py-4 lg:ml-40 mt-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Chi tiết {table.name}
            </h1>
            <p className="text-sm text-muted-foreground">Mã bàn: {table.id}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="min-h-[44px] min-w-[44px] bg-transparent"
            >
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </Button>
            <Button className="min-h-[44px] min-w-[44px]">
              <Plus className="mr-2 h-4 w-4" />
              Tạo đơn mới
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Thông tin chung</CardTitle>
              <CardDescription>Tổng quan về bàn ăn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Trạng thái:
                </span>
                <Badge className={getStatusColor(table.status)}>
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
              {table.total && (
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-sm text-muted-foreground">
                    Tổng tiền tạm tính:
                  </span>
                  <span>{table.total}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Nhân viên phụ trách</CardTitle>
              <CardDescription>
                Thông tin nhân viên được phân công
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {assignedStaff ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tên:</span>
                    <span className="font-medium">{assignedStaff.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Chức vụ:
                    </span>
                    <span className="font-medium">{assignedStaff.role}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Điện thoại:
                    </span>
                    <span className="font-medium">{assignedStaff.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Email:
                    </span>
                    <span className="font-medium">{assignedStaff.email}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 bg-transparent"
                  >
                    <Link href={`/staff/${assignedStaff.id}`}>
                      Xem hồ sơ nhân viên
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <p>Chưa có nhân viên được phân công.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 bg-transparent"
                  >
                    Phân công ngay
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-1 md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Món ăn đã gọi</CardTitle>
              <CardDescription>
                Danh sách các món ăn hiện tại của bàn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {table.dishes && table.dishes.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {table.dishes.map((dish, index) => (
                    <li key={index} className="text-sm">
                      {dish}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  Chưa có món ăn nào được gọi.
                </div>
              )}
              {table.status !== "Trống" && (
                <Button size="sm" className="w-full mt-4">
                  Thêm món
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
