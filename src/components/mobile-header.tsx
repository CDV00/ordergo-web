"use client";

import { Menu, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MobileHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden fixed top-0 right-0 left-0 z-50">
      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="min-h-[44px] min-w-[44px] touch-friendly"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-xs font-bold">O</span>
          </div>
          <span className="font-semibold text-lg">OrderGo</span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* Mobile Search */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px] min-w-[44px] touch-friendly"
            >
              <Search className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-2">
              <Input placeholder="Tìm kiếm bàn, món ăn..." className="w-full" />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mobile Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="relative min-h-[44px] min-w-[44px] touch-friendly"
            >
              <Bell className="h-5 w-5" />
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
                <p className="text-sm font-medium">
                  ✅ Món ăn sẵn sàng - Bàn 3
                </p>
                <p className="text-xs text-muted-foreground">
                  Phở bò tái, Cơm gà nướng đã xong
                </p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
