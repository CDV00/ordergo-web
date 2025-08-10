"use client";

import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Edit, Trash2, Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import unusedImports from "eslint-plugin-unused-imports";
import { menuItems } from "@/app/data";

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

export default function MenuItemDetailPage() {
  const params = useParams();
  const itemId = params.id as string;
  const item = menuItems.find((i) => i.id === itemId);

  if (!item) {
    return (
      <>
        <MobileHeader />
        <header className="hidden lg:flex h-16 shrink-0 items-center gap-2 border-b px-4 sm:px-6 lg:px-8 lg:ml-40">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Tổng quan</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/menu">Menu & Món ăn</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Không tìm thấy</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center p-4 lg:ml-40">
          <h1 className="text-2xl font-bold text-red-500">
            Lỗi: Không tìm thấy món ăn
          </h1>
          <p className="text-muted-foreground">
            Món ăn với mã "{itemId}" không tồn tại.
          </p>
          <Button asChild className="mt-4">
            <Link href="/menu">Quay lại danh sách món ăn</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <MobileHeader />
      <header className="hidden lg:flex h-16 shrink-0 items-center gap-2 border-b px-4 sm:px-6 lg:px-8 lg:ml-40 fixed top-0 right-0 left-0 z-50">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Tổng quan</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/menu">Menu & Món ăn</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{item.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center space-x-4">
          {/* SearchBar and Notifications can be added here if needed */}
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 px-4 sm:px-6 lg:px-8 py-4 lg:ml-40 mt-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Chi tiết món ăn: {item.name}
            </h1>
            <p className="text-sm text-muted-foreground">Mã món: {item.id}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="min-h-[44px] min-w-[44px] bg-transparent"
            >
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </Button>
            <Button variant="destructive" className="min-h-[44px] min-w-[44px]">
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa món
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-1">
            <CardContent className="p-4 flex flex-col items-center">
              <Image
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                width={200}
                height={200}
                className="rounded-md object-cover aspect-square mb-4"
              />
              <h3 className="font-bold text-2xl mb-2">{item.name}</h3>
              <p className="text-muted-foreground text-lg mb-3">{item.price}</p>
              <Badge className={getStatusColor(item.status)}>
                {item.status}
              </Badge>
            </CardContent>
          </Card>

          <Card className="md:col-span-1 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Thông tin chi tiết</CardTitle>
              <CardDescription>Mô tả và danh mục của món ăn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Mô tả:</p>
                <p className="text-base">{item.description}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Danh mục:</span>
                <span className="font-medium">{item.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mã món:</span>
                <span className="font-medium">{item.id}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Thành phần & Dị ứng</CardTitle>
              <CardDescription>
                Thông tin về nguyên liệu và các chất gây dị ứng
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Thành phần chính:
                </p>
                {item.ingredients && item.ingredients.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {item.ingredients.map((ingredient, index) => (
                      <li key={index} className="text-sm">
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Không có thông tin thành phần.
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Chất gây dị ứng:
                </p>
                {item.allergens && item.allergens.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {item.allergens.map((allergen, index) => (
                      <li key={index} className="text-sm text-red-500">
                        <Info className="inline-block h-4 w-4 mr-1" />
                        {allergen}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Không có chất gây dị ứng được liệt kê.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
