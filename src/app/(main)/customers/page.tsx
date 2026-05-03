"use client";

import { useState, useMemo } from "react";
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
import { Users, Plus, BellRing, DollarSign, ArrowUp, ClipboardList } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { orders, staff, tables } from "@/app/data";

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

export default function CustomerPage() {
  // Giả định đây là ID bàn của khách hàng hiện tại, trong thực tế sẽ lấy từ phiên đăng nhập
  const customerTableId = "T001"; // Ví dụ: Khách hàng này luôn ở Bàn 1
  const [selectedTableId, setSelectedTableId] = useState<string | null>(customerTableId);

  const selectedTable = useMemo(() => {
    return tables.find((t) => t.id === selectedTableId);
  }, [selectedTableId]);

  const assignedStaff = useMemo(() => {
    if (!selectedTable?.assignedStaffId) return null;
    return staff.find((s) => s.id === selectedTable.assignedStaffId);
  }, [selectedTable]);

  const currentOrder = useMemo(() => {
    if (!selectedTableId) return null;
    return orders.find((o) => o.table === selectedTable?.name && o.overallStatus !== "Đã hủy");
  }, [selectedTableId, selectedTable]);

  const handleAddMoreItems = () => {
    if (selectedTableId) {
      alert(`Yêu cầu thêm món cho ${selectedTable?.name}. (Mở modal chọn món)`);
      console.log(`Yêu cầu thêm món cho ${selectedTable?.name}.`);
    }
  };

  const handlePrioritizeItem = (itemName: string) => {
    if (selectedTableId) {
      alert(`Yêu cầu ưu tiên món "${itemName}" cho ${selectedTable?.name}.`);
      console.log(`Yêu cầu ưu tiên món "${itemName}" cho ${selectedTable?.name}.`);
    }
  };

  const handleCallService = () => {
    if (selectedTableId) {
      alert(`Yêu cầu gọi phục vụ cho ${selectedTable?.name}.`);
      console.log(`Yêu cầu gọi phục vụ cho ${selectedTable?.name}.`);
    }
  };

  const handleRequestBill = () => {
    if (selectedTableId) {
      alert(`Yêu cầu thanh toán cho ${selectedTable?.name}.`);
      console.log(`Yêu cầu thanh toán cho ${selectedTable?.name}.`);
    }
  };

  const handleSendFeedback = () => {
    if (selectedTableId) {
      alert(`Yêu cầu gửi nhận xét cho ${selectedTable?.name}. (Mở modal nhận xét)`);
      console.log(`Yêu cầu gửi nhận xét cho ${selectedTable?.name}.`);
    }
  };

  return (
    <SidebarInset>
      <MobileHeader />
      <header className="fixed top-0 right-0 left-0 z-50 hidden h-16 shrink-0 items-center gap-2 border-b px-4 sm:px-6 lg:ml-40 lg:flex lg:px-8">
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Khách hàng</BreadcrumbPage>
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
            <h1 className="text-xl font-bold sm:text-2xl">Trải nghiệm khách hàng</h1>
            <p className="text-muted-foreground text-sm">Mô phỏng giao diện khách hàng tại bàn</p>
          </div>
          {/* Removed table selection dropdown */}
        </div>

        {!selectedTableId || !selectedTable ? (
          <Card className="text-muted-foreground flex flex-1 items-center justify-center p-8 text-center">
            <p>Không tìm thấy thông tin bàn cho khách hàng này.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Thông tin bàn</CardTitle>
                <CardDescription>Tổng quan về bàn ăn {selectedTable?.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Thêm hình ảnh bàn ở đây */}
                <div className="mb-4 flex justify-center">
                  <Image
                    src={`/placeholder-b2r2f.png?height=150&width=250&text=${selectedTable?.name}`}
                    alt={`Hình ảnh ${selectedTable?.name}`}
                    width={250}
                    height={150}
                    className="rounded-md object-cover"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Trạng thái:</span>
                  <Badge className={getTableStatusColor(selectedTable?.status || "Trống")}>
                    {selectedTable?.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Sức chứa:</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Users className="h-4 w-4" /> {selectedTable?.capacity} người
                  </span>
                </div>
                {selectedTable?.customers !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Số khách hiện tại:</span>
                    <span className="font-medium">{selectedTable?.customers}</span>
                  </div>
                )}
                {selectedTable?.orderTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Thời gian gọi món:</span>
                    <span className="font-medium">{selectedTable?.orderTime}</span>
                  </div>
                )}
                {selectedTable?.waitTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Thời gian chờ:</span>
                    <span className="font-medium">{selectedTable?.waitTime}</span>
                  </div>
                )}
                {selectedTable?.total && (
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-muted-foreground text-sm">Tổng tiền tạm tính:</span>
                    <span>{selectedTable?.total}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Nhân viên phụ trách</CardTitle>
                <CardDescription>Thông tin nhân viên được phân công</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {assignedStaff ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">Tên:</span>
                      <span className="font-medium">{assignedStaff.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">Chức vụ:</span>
                      <span className="font-medium">{assignedStaff.role}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">Điện thoại:</span>
                      <span className="font-medium">{assignedStaff.phone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">Email:</span>
                      <span className="font-medium">{assignedStaff.email}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full bg-transparent"
                      asChild
                    >
                      <Link href={`/staff/${assignedStaff.id}`}>Xem hồ sơ nhân viên</Link>
                    </Button>
                  </>
                ) : (
                  <div className="text-muted-foreground py-4 text-center">
                    <p>Chưa có nhân viên được phân công.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Món ăn đã gọi</CardTitle>
                <CardDescription>Danh sách các món ăn hiện tại của bàn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {currentOrder && currentOrder.items.length > 0 ? (
                  <ul className="space-y-3">
                    {currentOrder.items.map((item, index) => (
                      <li key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <ClipboardList className="text-muted-foreground h-4 w-4" />
                          <span className="text-sm font-medium">
                            {item.name} (x{item.quantity})
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getOrderItemStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                          {item.status !== "Đã phục vụ" && item.status !== "Đã hủy" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePrioritizeItem(item.name)}
                              title="Ưu tiên món này"
                            >
                              <ArrowUp className="h-4 w-4" />
                              <span className="sr-only">Ưu tiên món này</span>
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-muted-foreground py-4 text-center">
                    Chưa có món ăn nào được gọi.
                  </div>
                )}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddMoreItems}
                    className="min-h-[44px] min-w-[44px]"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Gọi thêm món
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCallService}
                    className="min-h-[44px] min-w-[44px] bg-transparent"
                  >
                    <BellRing className="mr-2 h-4 w-4" />
                    Gọi phục vụ
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRequestBill}
                    className="col-span-2 min-h-[44px] min-w-[44px] bg-transparent"
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Yêu cầu thanh toán
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSendFeedback}
                    className="col-span-2 min-h-[44px] min-w-[44px] bg-transparent"
                  >
                    Gửi nhận xét
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </SidebarInset>
  );
}
