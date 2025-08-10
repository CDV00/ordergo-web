"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SearchBar } from "@/components/search-bar";
import { Notifications } from "@/components/notifications";
import { MobileHeader } from "@/components/mobile-header";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Edit,
  Trash2,
  Plus,
  Upload,
  Download,
  Utensils,
  Soup,
  Coffee,
  Cake,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const menuItems = [
  {
    id: "M001",
    name: "Phở Bò Tái",
    category: "Món chính",
    price: "₫65,000",
    status: "Còn hàng",
    image: "/pho-bo.png",
    description: "Phở bò truyền thống với thịt bò tái mềm và nước dùng đậm đà.",
  },
  {
    id: "M002",
    name: "Bún Chả Hà Nội",
    category: "Món chính",
    price: "₫70,000",
    status: "Còn hàng",
    image: "/bun-cha.png",
    description:
      "Bún chả Hà Nội chuẩn vị với chả nướng thơm lừng và nước chấm chua ngọt.",
  },
  {
    id: "M003",
    name: "Gỏi Cuốn",
    category: "Món khai vị",
    price: "₫45,000",
    status: "Còn hàng",
    image: "/goi-cuon.png",
    description:
      "Gỏi cuốn tươi ngon với tôm, thịt và rau sống, chấm nước mắm pha.",
  },
  {
    id: "M004",
    name: "Cà Phê Sữa Đá",
    category: "Đồ uống",
    price: "₫30,000",
    status: "Còn hàng",
    image: "/vietnamese-coffee.png",
    description: "Cà phê sữa đá Việt Nam đậm đà, thơm ngon.",
  },
  {
    id: "M005",
    name: "Chè Ba Màu",
    category: "Tráng miệng",
    price: "₫35,000",
    status: "Hết hàng",
    image: "/che-ba-mau.png",
    description: "Chè ba màu mát lạnh với đậu xanh, đậu đỏ và thạch.",
  },
  {
    id: "M006",
    name: "Bánh Mì Pate",
    category: "Món chính",
    price: "₫40,000",
    status: "Còn hàng",
    image: "/banh-mi-pate.png",
    description: "Bánh mì giòn rụm với pate, chả lụa và rau thơm.",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Còn hàng":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "Hết hàng":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

export default function MenuPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const totalDishes = menuItems.length;
  const availableDishes = menuItems.filter(
    (item) => item.status === "Còn hàng",
  ).length;
  const outOfStockDishes = menuItems.filter(
    (item) => item.status === "Hết hàng",
  ).length;

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
              </BreadcrumbItem>
              <BreadcrumbSeparator /> */}
            <BreadcrumbItem>
              <BreadcrumbPage>Menu & Món ăn</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center space-x-4">
          <SearchBar />
          <Notifications />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 sm:px-6 lg:px-8 py-4  lg:ml-40 mt-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Quản lý Menu & Món ăn
            </h1>
            <p className="text-sm text-muted-foreground">
              Quản lý danh sách món ăn và đồ uống của nhà hàng
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="min-h-[44px] min-w-[44px] bg-transparent"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button
              variant="outline"
              className="min-h-[44px] min-w-[44px] bg-transparent"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button className="min-h-[44px] min-w-[44px]">
              <Plus className="mr-2 h-4 w-4" />
              Thêm món mới
            </Button>
          </div>
        </div>

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card className="min-h-[80px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Tổng số món</CardTitle>
              <Utensils className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-lg sm:text-2xl font-bold">{totalDishes}</div>
            </CardContent>
          </Card>
          <Card className="min-h-[80px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Đang bán</CardTitle>
              <Soup className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-lg sm:text-2xl font-bold">
                {availableDishes}
              </div>
            </CardContent>
          </Card>
          <Card className="min-h-[80px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Hết hàng</CardTitle>
              <Coffee className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-lg sm:text-2xl font-bold">
                {outOfStockDishes}
              </div>
            </CardContent>
          </Card>
          <Card className="min-h-[80px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                Món phổ biến
              </CardTitle>
              <Cake className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-lg sm:text-2xl font-bold">Phở Bò Tái</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl">
              Danh sách món ăn
            </CardTitle>
            <CardDescription className="text-sm">
              Tổng cộng {filteredMenuItems.length} món ăn và đồ uống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
              <Input
                placeholder="Tìm kiếm món ăn theo tên, mã, mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 min-h-[44px] min-w-[44px]"
              />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px] min-h-[44px] min-w-[44px]">
                  <SelectValue placeholder="Lọc theo danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  <SelectItem value="Món chính">Món chính</SelectItem>
                  <SelectItem value="Món khai vị">Món khai vị</SelectItem>
                  <SelectItem value="Đồ uống">Đồ uống</SelectItem>
                  <SelectItem value="Tráng miệng">Tráng miệng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMenuItems.map((item) => (
                <Card key={item.id} className="flex flex-col">
                  <CardContent className="p-4 flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="rounded-md object-cover aspect-square"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg leading-tight">
                          {item.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {item.category}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-lg">{item.price}</span>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 min-h-[40px] bg-transparent"
                        asChild
                      >
                        <Link href={`/menu/${item.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Sửa
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 min-h-[40px]"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredMenuItems.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-8">
                  Không tìm thấy món ăn nào phù phù hợp.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
