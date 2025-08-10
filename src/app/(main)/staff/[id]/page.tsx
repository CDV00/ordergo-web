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
import { Edit, Phone, Mail, Briefcase, Table } from "lucide-react";
import Link from "next/link";
import { staff } from "../page";
import { tables } from "../../tables/page";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Đang làm việc":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "Nghỉ phép":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "Nghỉ việc":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

export default function StaffDetailPage() {
  const params = useParams();
  const staffId = params.id as string;
  const staffMember = staff.find((s) => s.id === staffId);

  if (!staffMember) {
    return (
      <SidebarInset>
        <MobileHeader />
        <header className="hidden lg:flex h-16 shrink-0 items-center gap-2 border-b px-4 sm:px-6 lg:px-8 lg:ml-40">
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Tổng quan</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/staff">Nhân viên</BreadcrumbLink>
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
            Lỗi: Không tìm thấy nhân viên
          </h1>
          <p className="text-muted-foreground">
            Nhân viên với mã "{staffId}" không tồn tại.
          </p>
          <Button asChild className="mt-4">
            <Link href="/staff">Quay lại danh sách nhân viên</Link>
          </Button>
        </div>
      </SidebarInset>
    );
  }

  const assignedTablesDetails = staffMember.assignedTables
    .map((tableId) => tables.find((t) => t.id === tableId))
    .filter(Boolean); // Remove any undefined tables if not found

  return (
    <SidebarInset>
      <MobileHeader />
      <header className="hidden lg:flex h-16 shrink-0 items-center gap-2 border-b px-4 sm:px-6 lg:px-8 lg:ml-40 fixed top-0 right-0 left-0 z-50">
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/staff">Nhân viên</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{staffMember.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center space-x-4">
          {/* SearchBar and Notifications can be added here if needed */}
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 px-4 sm:px-6 lg:px-8 py-4  lg:ml-40 mt-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Hồ sơ nhân viên: {staffMember.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Mã nhân viên: {staffMember.id}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="min-h-[44px] min-w-[44px] bg-transparent"
            >
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </Button>
            <Button asChild className="min-h-[44px] min-w-[44px]">
              <Link href="/staff">Quay lại</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
              <CardDescription>Chi tiết về nhân viên</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tên:</span>
                <span className="font-medium">{staffMember.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Chức vụ:</span>
                <span className="font-medium flex items-center gap-1">
                  <Briefcase className="h-4 w-4" /> {staffMember.role}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Trạng thái:
                </span>
                <Badge className={getStatusColor(staffMember.status)}>
                  {staffMember.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Điện thoại:
                </span>
                <span className="font-medium flex items-center gap-1">
                  <Phone className="h-4 w-4" /> {staffMember.phone}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="font-medium flex items-center gap-1">
                  <Mail className="h-4 w-4" /> {staffMember.email}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Bàn được phân công</CardTitle>
              <CardDescription>
                Danh sách các bàn nhân viên này đang phụ trách
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {assignedTablesDetails.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {assignedTablesDetails.map((table) => (
                    <li key={table?.id} className="text-sm">
                      <Link
                        href={`/tables/${table?.id}`}
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <Table className="h-4 w-4" />
                        {table?.name} ({table?.status})
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <p>Nhân viên này hiện chưa được phân công bàn nào.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
  );
}
