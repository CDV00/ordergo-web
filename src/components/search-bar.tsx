"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBar() {
  return (
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />

      <Input
        type="search"
        placeholder="Tìm kiếm bàn, món ăn, khách hàng..."
        className="pl-8"
      />
    </div>
  );
}
