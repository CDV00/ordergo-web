"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { SearchBar } from "@/components/search-bar";
import { Notifications } from "@/components/notifications";
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
import { Badge } from "@/components/ui/badge";
import { Users, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react";
import Link from "next/link";

export const staff = [
  {
    id: "STF001",
    name: "Thu Hà",
    role: "Nhân viên phục vụ",
    phone: "0912345678",
    email: "thuha@ordergo.com",
    status: "Đang làm việc",
    assignedTables: ["T001", "T005"],
  },
  {
    id: "STF002",
    name: "Minh Anh",
    role: "Nhân viên phục vụ",
    phone: "0918765432",
    email: "minhanh@ordergo.com",
    status: "Đang làm việc",
    assignedTables: ["T003", "T007"],
  },
  {
    id: "STF003",
    name: "Quang Huy",
    role: "Đầu bếp",
    phone: "0987654321",
    email: "quanghuy@ordergo.com",
    status: "Đang làm việc",
    assignedTables: [],
  },
  {
    id: "STF004",
    name: "Thanh Mai",
    role: "Quản lý",
    phone: "0909112233",
    email: "thanhmai@ordergo.com",
    status: "Đang làm việc",
    assignedTables: [],
  },
  {
    id: "STF005",
    name: "Văn Nam",
    role: "Nhân viên phục vụ",
    phone: "0908765432",
    email: "vannam@ordergo.com",
    status: "Nghỉ phép",
    assignedTables: [],
  },
];

export const tables = [
  {
    id: "T001",
    name: "Bàn 1",
    capacity: 4,
    status: "Đang phục vụ",
    customers: 4,
    assignedStaffId: "STF001", // Thu Hà
    orderTime: "18:30",
    waitTime: "25 phút",
    total: "₫320,000",
    dishes: ["Phở bò", "Cơm gà", "Nước cam"],
  },
  {
    id: "T002",
    name: "Bàn 2",
    capacity: 2,
    status: "Trống",
    customers: 0,
    assignedStaffId: null,
    orderTime: null,
    waitTime: null,
    total: null,
    dishes: [],
  },
  {
    id: "T003",
    name: "Bàn 3",
    capacity: 6,
    status: "Chờ món",
    customers: 2,
    assignedStaffId: "STF002", // Minh Anh
    orderTime: "19:15",
    waitTime: "12 phút",
    total: "₫180,000",
    dishes: ["Bún bò Huế", "Chả cá"],
  },
  {
    id: "T004",
    name: "Bàn 4",
    capacity: 4,
    status: "Trống",
    customers: 0,
    assignedStaffId: null,
    orderTime: null,
    waitTime: null,
    total: null,
    dishes: [],
  },
  {
    id: "T005",
    name: "Bàn 5",
    capacity: 8,
    status: "Vừa gọi món",
    customers: 6,
    assignedStaffId: "STF001", // Thu Hà
    orderTime: "19:45",
    waitTime: "2 phút",
    total: "₫450,000",
    dishes: ["Lẩu thái", "Cơm chiên"],
  },
  {
    id: "T006",
    name: "Bàn 6",
    capacity: 2,
    status: "Trống",
    customers: 0,
    assignedStaffId: null,
    orderTime: null,
    waitTime: null,
    total: null,
    dishes: [],
  },
  {
    id: "T007",
    name: "Bàn 7",
    capacity: 4,
    status: "Chờ thanh toán",
    customers: 3,
    assignedStaffId: "STF002", // Minh Anh
    orderTime: "18:00",
    waitTime: "45 phút",
    total: "₫150,000",
    dishes: ["Cơm tấm", "Bánh mì", "Cà phê"],
  },
  {
    id: "T008",
    name: "Bàn 8",
    capacity: 6,
    status: "Trống",
    customers: 0,
    assignedStaffId: null,
    orderTime: null,
    waitTime: null,
    total: null,
    dishes: [],
  },
];

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

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Trống":
      return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />;
    case "Đang phục vụ":
      return <Users className="h-3 w-3 sm:h-4 sm:w-4" />;
    case "Chờ món":
      return <Clock className="h-3 w-3 sm:h-4 sm:w-4" />;
    case "Vừa gọi món":
      return <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />;
    case "Chờ thanh toán":
      return <Clock className="h-3 w-3 sm:h-4 sm:w-4" />;
    default:
      return null;
  }
};

export default function TablesPage() {
  const occupiedTables = tables.filter(
    (table) => table.status !== "Trống",
  ).length;
  const totalTables = tables.length;

  return (
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
              </BreadcrumbItem> */}
            {/* <BreadcrumbSeparator /> */}
            <BreadcrumbItem>
              <BreadcrumbPage>Bàn ăn</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center space-x-4">
          <SearchBar />
          <Notifications />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 sm:px-6 lg:px-8 py-4  lg:ml-40 mt-16">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Quản lý bàn ăn</h1>
            <p className="text-sm text-muted-foreground">
              Theo dõi tình trạng bàn ăn - {occupiedTables}/{totalTables} bàn
              đang sử dụng
            </p>
          </div>
          <Button className="min-h-[44px] min-w-[44px]">
            <Plus className="mr-2 h-4 w-4" />
            Đặt bàn mới
          </Button>
        </div>

        {/* Table Status Overview - Mobile Optimized */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <Card className="min-h-[80px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Bàn trống</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-lg sm:text-2xl font-bold">
                {tables.filter((t) => t.status === "Trống").length}
              </div>
            </CardContent>
          </Card>
          <Card className="min-h-[80px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                Đang phục vụ
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-lg sm:text-2xl font-bold">
                {tables.filter((t) => t.status === "Đang phục vụ").length}
              </div>
            </CardContent>
          </Card>
          <Card className="min-h-[80px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Chờ món</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-lg sm:text-2xl font-bold">
                {tables.filter((t) => t.status === "Chờ món").length}
              </div>
            </CardContent>
          </Card>
          <Card className="min-h-[80px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                Chờ thanh toán
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-lg sm:text-2xl font-bold">
                {tables.filter((t) => t.status === "Chờ thanh toán").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables Grid - Responsive */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => {
            const assignedStaff = staff.find(
              (s) => s.id === table.assignedStaffId,
            );
            return (
              <Card
                key={table.id}
                className={`cursor-pointer transition-all hover:shadow-md min-h-[44px] ${
                  table.status === "Trống"
                    ? "border-green-200"
                    : "border-blue-200"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base sm:text-lg">
                      {table.name}
                    </CardTitle>
                    <Badge className={getStatusColor(table.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(table.status)}
                        <span className="text-xs">{table.status}</span>
                      </div>
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    Sức chứa: {table.capacity} người
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {table.status !== "Trống" ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Khách:</span>
                        <span className="font-medium">
                          {table.customers} người
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Nhân viên:</span>
                        <span className="font-medium truncate max-w-[100px]">
                          {assignedStaff
                            ? assignedStaff.name
                            : "Chưa phân công"}
                        </span>
                      </div>
                      {table.orderTime && (
                        <div className="flex items-center justify-between text-sm">
                          <span>Gọi món:</span>
                          <span className="font-medium">{table.orderTime}</span>
                        </div>
                      )}
                      {table.waitTime && (
                        <div className="flex items-center justify-between text-sm">
                          <span>Thời gian:</span>
                          <span className="font-medium">{table.waitTime}</span>
                        </div>
                      )}
                      {table.total && (
                        <div className="flex items-center justify-between text-sm font-semibold">
                          <span>Tổng tiền:</span>
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
                      <div className="flex flex-col sm:flex-row gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-transparent min-h-[44px] min-w-[44px]"
                          asChild
                        >
                          <Link href={`/tables/${table.id}`}>Chi tiết</Link>
                        </Button>
                        {table.status === "Chờ thanh toán" && (
                          <Button
                            size="sm"
                            className="flex-1 min-h-[44px] min-w-[44px]"
                          >
                            Thanh toán
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        Bàn đang trống
                      </p>
                      <Button
                        size="sm"
                        className="w-full min-h-[44px] min-w-[44px]"
                      >
                        Đặt bàn
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
