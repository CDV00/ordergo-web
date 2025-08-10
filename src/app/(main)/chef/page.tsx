"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { UtensilsCrossed, CheckCircle, ListChecks } from "lucide-react";
import {
  getStatusColor,
  getOrderItemStatusColor,
} from "@/utils/getStatusColor"; // Import status color utility
import Link from "next/link";
import { orders } from "@/app/data";

export default function ChefPage() {
  const [filterStatus, setFilterStatus] = useState<
    "all" | "Đang nấu" | "Sẵn sàng"
  >("all");

  const cookingOrders = useMemo(() => {
    return orders.filter((order) => order.overallStatus === "Đang nấu");
  }, []);

  const readyOrders = useMemo(() => {
    return orders.filter((order) => order.overallStatus === "Sẵn sàng");
  }, []);

  const displayedOrders = useMemo(() => {
    if (filterStatus === "Đang nấu") {
      return cookingOrders;
    }
    if (filterStatus === "Sẵn sàng") {
      return readyOrders;
    }
    return [...cookingOrders, ...readyOrders].sort((a, b) => {
      // Sort by order time, newest first
      const timeA = new Date(`2000/01/01 ${a.orderTime}`).getTime();
      const timeB = new Date(`2000/01/01 ${b.orderTime}`).getTime();
      return timeB - timeA;
    });
  }, [filterStatus, cookingOrders, readyOrders]);

  const handleMarkAsReady = (orderId: string, itemName: string) => {
    alert(
      `Đánh dấu món "${itemName}" của đơn hàng ${orderId} là Sẵn sàng. (Logic cập nhật trạng thái)`,
    );
    // In a real app, you'd update the state/database here
  };

  const handleMarkOrderReady = (orderId: string) => {
    alert(
      `Đánh dấu toàn bộ đơn hàng ${orderId} là Sẵn sàng. (Logic cập nhật trạng thái)`,
    );
    // In a real app, you'd update the state/database here
  };

  return (
    <SidebarInset>
      <MobileHeader />
      <header className="hidden lg:flex h-16 shrink-0 items-center gap-2 border-b px-4 sm:px-6 lg:px-8 lg:ml-40 fixed top-0 right-0 left-0 z-50">
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Bếp</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center space-x-4">
          {/* SearchBar and Notifications can be added here if needed */}
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 px-4 sm:px-6 lg:px-8 py-4 lg:pl-50 mt-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Màn hình Bếp</h1>
            <p className="text-sm text-muted-foreground">
              Quản lý các đơn hàng đang chờ và đã sẵn sàng
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              onClick={() => setFilterStatus("all")}
              className="min-h-[44px] min-w-[44px]"
            >
              Tất cả ({cookingOrders.length + readyOrders.length})
            </Button>
            <Button
              variant={filterStatus === "Đang nấu" ? "default" : "outline"}
              onClick={() => setFilterStatus("Đang nấu")}
              className="min-h-[44px] min-w-[44px]"
            >
              Đang nấu ({cookingOrders.length})
            </Button>
            <Button
              variant={filterStatus === "Sẵn sàng" ? "default" : "outline"}
              onClick={() => setFilterStatus("Sẵn sàng")}
              className="min-h-[44px] min-w-[44px]"
            >
              Sẵn sàng ({readyOrders.length})
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayedOrders.length === 0 ? (
            <Card className="col-span-full flex items-center justify-center p-8 text-center text-muted-foreground">
              <p>Không có đơn hàng nào trong trạng thái này.</p>
            </Card>
          ) : (
            displayedOrders.map((order) => (
              <Card key={order.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Đơn hàng {order.id} - Bàn {order.table}
                    </CardTitle>
                    <Badge className={getStatusColor(order.overallStatus)}>
                      {order.overallStatus}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    Khách hàng: {order.customer} - Thời gian: {order.orderTime}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Các món ăn:
                  </p>
                  <ul className="space-y-2">
                    {order.items.map((item, itemIndex) => (
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
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={getOrderItemStatusColor(item.status)}
                          >
                            {item.status}
                          </Badge>
                          {item.status === "Đang nấu" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleMarkAsReady(order.id, item.name)
                              }
                              title="Đánh dấu sẵn sàng"
                            >
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="sr-only">Đánh dấu sẵn sàng</span>
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-sm text-muted-foreground">
                      Tổng tiền:
                    </span>
                    <span>{order.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Thời gian chờ:
                    </span>
                    <span className="font-medium">{order.waitTime}</span>
                  </div>
                  {order.overallStatus === "Đang nấu" && (
                    <Button
                      className="w-full mt-4 min-h-[44px] min-w-[44px]"
                      onClick={() => handleMarkOrderReady(order.id)}
                    >
                      <ListChecks className="mr-2 h-4 w-4" />
                      Đánh dấu toàn bộ đơn hàng sẵn sàng
                    </Button>
                  )}
                  <Button
                    asChild
                    variant="outline"
                    className="w-full mt-2 bg-transparent min-h-[44px] min-w-[44px]"
                  >
                    <Link href={`/orders/${order.id}`}>
                      Xem chi tiết đơn hàng
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </SidebarInset>
  );
}
