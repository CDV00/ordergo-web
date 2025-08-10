"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";

interface OrderItem {
  name: string;
  quantity: number;
  status: string;
}

interface Order {
  id: string;
  table: string;
  customer: string;
  phone: string;
  overallStatus: string; // Changed from 'status' to 'overallStatus'
  items: OrderItem[]; // Changed to array of objects
  total: string;
  orderTime: string;
  waitTime: string;
  server: string;
}

interface ResponsiveTableProps {
  orders: Order[];
  getStatusColor: (status: string) => string;
}

export function ResponsiveTable({
  orders,
  getStatusColor,
}: ResponsiveTableProps) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden lg:block table-responsive">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đơn</TableHead>
              <TableHead>Bàn</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Món ăn</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thời gian chờ</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Nhân viên</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell className="font-semibold">{order.table}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.customer}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.phone}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px]">
                    <p className="text-sm truncate">
                      {order.items
                        .map((item) => `${item.name} (x${item.quantity})`)
                        .join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.items.length} món
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(order.overallStatus)}>
                    {order.overallStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="text-sm">{order.waitTime}</div>
                    <div className="text-xs text-muted-foreground">
                      {order.orderTime}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{order.total}</TableCell>
                <TableCell>{order.server}</TableCell>
                <TableCell>
                  <Link href={`/orders/${order.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile/Tablet Cards */}
      <div className="lg:hidden space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="w-full">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="font-bold text-lg">{order.table}</div>
                  <div>
                    <div className="font-medium text-sm">{order.customer}</div>
                    <div className="text-xs text-muted-foreground">
                      {order.phone}
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(order.overallStatus)}>
                  {order.overallStatus}
                </Badge>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mã đơn:</span>
                  <span className="font-medium">{order.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Món ăn:</span>
                  <span className="font-medium text-right max-w-[60%] truncate">
                    {order.items
                      .map((item) => `${item.name} (x${item.quantity})`)
                      .join(", ")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Thời gian chờ:</span>
                  <span className="font-medium">{order.waitTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nhân viên:</span>
                  <span className="font-medium">{order.server}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="font-bold text-lg">{order.total}</div>
                <Button size="sm" className="touch-friendly">
                  <Link href={`/orders/${order.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                  </Link>
                  Chi tiết
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
