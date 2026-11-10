"use client";

import { Bell, Coffee, Menu, Search } from "lucide-react";
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
    <div className="bg-card/90 supports-[backdrop-filter]:bg-card/75 fixed top-0 right-0 left-0 z-50 flex h-14 items-center justify-between border-b px-2 shadow-xs backdrop-blur-lg lg:hidden">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          aria-label="Mở menu"
          className="touch-friendly min-h-[44px] min-w-[44px]"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-xl shadow-xs">
            <Coffee className="size-4" strokeWidth={2.4} />
          </div>
          <span className="text-base font-bold tracking-tight">OrderGo</span>
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        {/* Mobile Search */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="touch-friendly min-h-[44px] min-w-[44px]"
              aria-label="Tìm kiếm"
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
              className="touch-friendly relative min-h-[44px] min-w-[44px]"
            >
              <Bell className="h-5 w-5" />
              <Badge className="ring-card absolute top-1 right-1 flex size-4 items-center justify-center p-0 text-[10px] ring-2">
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
                <p className="text-muted-foreground text-xs">Khách yêu cầu thêm 2 ly nước cam</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">✅ Món ăn sẵn sàng - Bàn 3</p>
                <p className="text-muted-foreground text-xs">Phở bò tái, Cơm gà nướng đã xong</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
