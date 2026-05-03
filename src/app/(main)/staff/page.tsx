"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, User, Phone, Mail, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import Link from "next/link";
import { staff } from "@/app/data";

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

export default function StaffPage() {
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStaff = staff.filter((member) => {
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    const matchesStatus = statusFilter === "all" || member.status === statusFilter;
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesRole && matchesStatus && matchesSearch;
  });

  return (
    <>
      <header className="fixed top-0 right-0 left-0 z-50 hidden h-16 shrink-0 items-center gap-2 border-b px-4 sm:px-6 lg:ml-40 lg:flex lg:px-8">
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Nhân viên</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center space-x-4">
          <Input
            placeholder="Tìm kiếm nhân viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="min-h-[44px] min-w-[44px] flex-1"
          />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="min-h-[44px] w-full min-w-[44px] sm:w-[180px]">
              <SelectValue placeholder="Lọc theo chức vụ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả chức vụ</SelectItem>
              <SelectItem value="Nhân viên phục vụ">Nhân viên phục vụ</SelectItem>
              <SelectItem value="Đầu bếp">Đầu bếp</SelectItem>
              <SelectItem value="Quản lý">Quản lý</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="min-h-[44px] w-full min-w-[44px] sm:w-[180px]">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="Đang làm việc">Đang làm việc</SelectItem>
              <SelectItem value="Nghỉ phép">Nghỉ phép</SelectItem>
              <SelectItem value="Nghỉ việc">Nghỉ việc</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>
      <div className="mt-16 flex flex-1 flex-col gap-4 px-4 py-4 sm:px-6 lg:ml-40 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Quản lý nhân viên</h1>
            <p className="text-muted-foreground text-sm">
              Tổng cộng {filteredStaff.length} nhân viên
            </p>
          </div>
          <Button className="min-h-[44px] min-w-[44px]">
            <Plus className="mr-2 h-4 w-4" />
            Thêm nhân viên
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl">Danh sách nhân viên</CardTitle>
            <CardDescription className="text-sm">
              Thông tin chi tiết về đội ngũ nhân viên
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Chức vụ</TableHead>
                    <TableHead>Liên hệ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Bàn được phân công</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <User className="text-muted-foreground h-8 w-8" />
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-muted-foreground text-sm">{member.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Briefcase className="text-muted-foreground h-4 w-4" />
                          <span>{member.role}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <Phone className="text-muted-foreground h-4 w-4" />
                            <span>{member.phone}</span>
                          </div>
                          <div className="text-muted-foreground flex items-center space-x-2 text-sm">
                            <Mail className="h-4 w-4" />
                            <span>{member.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(member.status)}>{member.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {member.assignedTables.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {member.assignedTables.map((tableId) => (
                              <Badge key={tableId} variant="secondary">
                                {tableId}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Chưa phân công</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Link href={`/staff/${member.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredStaff.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                        Không tìm thấy nhân viên nào phù hợp.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
