"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function Notifications() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative bg-transparent"
        >
          <Bell className="h-4 w-4" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
            5
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">🔥 Bàn 5 gọi thêm món</p>
            <p className="text-xs text-muted-foreground">
              Khách yêu cầu thêm 2 ly nước cam
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">✅ Món ăn sẵn sàng - Bàn 3</p>
            <p className="text-xs text-muted-foreground">
              Phở bò tái, Cơm gà nướng đã xong
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">⏰ Bàn 7 chờ thanh toán</p>
            <p className="text-xs text-muted-foreground">
              Khách đã dùng xong, yêu cầu hóa đơn
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">🍽️ Bàn 2 cần dọn dẹp</p>
            <p className="text-xs text-muted-foreground">
              Khách vừa rời đi, cần thu dọn bàn
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">📞 Đặt bàn mới</p>
            <p className="text-xs text-muted-foreground">
              Anh Minh đặt bàn 4 người lúc 19:30
            </p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
