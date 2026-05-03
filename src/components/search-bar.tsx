"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBar() {
  return (
    <div className="relative max-w-sm flex-1">
      <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />

      <Input type="search" placeholder="Tìm kiếm bàn, món ăn, khách hàng..." className="pl-8" />
    </div>
  );
}
