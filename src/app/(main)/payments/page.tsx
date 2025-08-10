"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, CheckCircle, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import Link from "next/link";
import { tables } from "../tables/page";
import { orders } from "../orders/page";

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
      return "bg-purple-110 text-purple-800 dark:bg-purple-900 dark:text-purple-300"; // Slightly different purple for payment focus
    case "Cần dọn dẹp":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const activeTables = useMemo(() => {
    return tables.filter((table) => table.status !== "Trống");
  }, [tables]);

  const filteredTables = activeTables.filter((table) => {
    const matchesSearch =
      table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (table.dishes &&
        table.dishes.some((dish) =>
          dish.toLowerCase().includes(searchTerm.toLowerCase()),
        ));
    const matchesStatus =
      statusFilter === "all" || table.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalActiveTables = activeTables.length;
  const tablesWaitingForPayment = activeTables.filter(
    (t) => t.status === "Chờ thanh toán",
  ).length;

  return (
    <SidebarInset>
      <MobileHeader />
      <header className="hidden lg:flex h-16 shrink-0 items-center gap-2 border-b px-4 sm:px-6 lg:px-8 lg:ml-40 fixed top-0 right-0 left-0 z-50">
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Thanh toán</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center space-x-4">
          <Input
            placeholder="Tìm kiếm bàn, món ăn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-h-[44px] min-w-[44px]"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] min-h-[44px] min-w-[44px]">
              <SelectValue placeholder="Lọc theo trạng thái bàn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="Đang phục vụ">Đang phục vụ</SelectItem>
              <SelectItem value="Chờ món">Chờ món</SelectItem>
              <SelectItem value="Vừa gọi món">Vừa gọi món</SelectItem>
              <SelectItem value="Chờ thanh toán">Chờ thanh toán</SelectItem>
              <SelectItem value="Cần dọn dẹp">Cần dọn dẹp</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 px-4 sm:px-6 lg:px-8 py-4 lg:pl-50 mt-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Quản lý thanh toán
            </h1>
            <p className="text-sm text-muted-foreground">
              Chọn bàn để tiến hành thanh toán
            </p>
          </div>
          <Button className="min-h-[44px] min-w-[44px]">
            <Plus className="mr-2 h-4 w-4" />
            Tạo đơn mới
          </Button>
        </div>

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card className="min-h-[80px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                Tổng số bàn đang hoạt động
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-lg sm:text-2xl font-bold">
                {totalActiveTables}
              </div>
            </CardContent>
          </Card>
          <Card className="min-h-[80px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                Bàn chờ thanh toán
              </CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-lg sm:text-2xl font-bold">
                {tablesWaitingForPayment}
              </div>
            </CardContent>
          </Card>
          <Card className="min-h-[80px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                Đơn hàng đang nấu
              </CardTitle>
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
              <CardTitle className="text-xs font-medium">
                Đơn hàng sẵn sàng
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-lg sm:text-2xl font-bold">
                {orders.filter((o) => o.overallStatus === "Sẵn sàng").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl">
              Danh sách bàn đang hoạt động
            </CardTitle>
            <CardDescription className="text-sm">
              Chọn một bàn để xem chi tiết và thanh toán
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTables.length === 0 ? (
                <div className="col-span-full text-center text-muted-foreground py-8">
                  Không tìm thấy bàn nào đang hoạt động hoặc phù hợp với tìm
                  kiếm.
                </div>
              ) : (
                filteredTables.map((table) => (
                  <Link href={`/payments/${table.id}`} key={table.id}>
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md min-h-[160px] `}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base sm:text-lg">
                            {table.name}
                          </CardTitle>
                          <Badge className={getTableStatusColor(table.status)}>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs">{table.status}</span>
                            </div>
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          Sức chứa: {table.capacity} người
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Khách:</span>
                            <span className="font-medium">
                              {table.customers} người
                            </span>
                          </div>
                          {table.total && (
                            <div className="flex items-center justify-between text-sm font-semibold">
                              <span>Tổng tiền tạm tính:</span>
                              <span>{table.total}</span>
                            </div>
                          )}
                          {table.dishes.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground">
                                Món ăn:
                              </p>
                              <p className="text-sm truncate">
                                {table.dishes.join(", ")}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
