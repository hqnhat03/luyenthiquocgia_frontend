"use client"

import { Can } from "@/components/auth/can"
import { usePermission } from "@/hooks/use-permission"
import api from "@/lib/axios"
import { type Role } from "@/types/RoleType"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Edit,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useLayoutStore } from "@/store/layout-store"


const roleSchema = z.object({
  name: z.string().min(1, "Tên vai trò không được để trống"),
})

type FormValues = z.infer<typeof roleSchema>

export default function RolesPage() {
  const router = useRouter()
  const { hasPermission } = usePermission()
  const setHeaderContent = useLayoutStore((state) => state.setHeaderContent)

  // Kiểm tra quyền truy cập trang danh sách
  React.useEffect(() => {
    if (!hasPermission("role_list")) {
      toast.error("Bạn không có quyền truy cập trang này")
      router.push("/admin")
    }
  }, [hasPermission, router])

  const [search, setSearch] = React.useState("")
  const [items, setItems] = React.useState<Role[]>([])
  const [isLoading, setIsLoading] = React.useState(true)


  // Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingRole, setEditingRole] = React.useState<Role | null>(null)

  // Delete Alert State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [roleToDelete, setRoleToDelete] = React.useState<Role | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
    },
  })

  const fetchRoles = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await api.get("/admin/roles")
      const result = response.data
      if (response.status === 200) {
        setItems(result.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error)
      toast.error("Không thể tải danh sách vai trò")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const onOpenModal = (role?: Role) => {
    if (role) {
      setEditingRole(role)
      form.reset({ name: role.name })
    } else {
      setEditingRole(null)
      form.reset({ name: "" })
    }
    setIsModalOpen(true)
  }

  const pageHeader = React.useMemo(() => (
    <div className="flex flex-1 items-center justify-between gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
      <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
        Quản lý vai trò
      </h2>
      <Can permission="role_create">
        <Button
          className="h-10 px-6 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-all active:scale-95 whitespace-nowrap"
          onClick={() => onOpenModal()}
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="text-sm font-bold">Thêm vai trò</span>
        </Button>
      </Can>
    </div>
  ), [onOpenModal]);

  React.useEffect(() => {
    setHeaderContent(pageHeader)
    return () => setHeaderContent(null)
  }, [setHeaderContent, pageHeader])

  const onSubmit = async (data: FormValues) => {
    try {
      const response = editingRole
        ? await api.put(`/admin/roles/update?id=${editingRole.id}`, data)
        : await api.post(`/admin/roles/create`, data)

      const result = response.data
      if (response.status === 200 || response.status === 201) {
        toast.success(editingRole ? "Cập nhật vai trò thành công" : "Tạo vai trò thành công")
        setIsModalOpen(false)
        fetchRoles()
      } else {
        toast.error(result.message || "Thao tác thất bại")
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra")
      console.error(error)
    }
  }

  const handleDelete = async () => {
    if (!roleToDelete) return

    if (roleToDelete.name === "super_admin") {
      toast.error("Không thể xóa vai trò quản trị viên tối cao")
      setIsDeleteDialogOpen(false)
      return
    }

    setIsDeleting(true)
    try {
      const response = await api.delete(`/admin/roles/delete?id=${roleToDelete.id}`)
      const result = response.data
      if (response.status === 200) {
        toast.success("Xóa vai trò thành công")
        fetchRoles()
      } else {
        toast.error(result.message || "Xóa thất bại")
      }
    } catch (error) {
      toast.error("Đã có lỗi xảy ra khi xóa")
      console.error("Delete error:", error)
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setRoleToDelete(null)
    }
  }

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  if (!hasPermission("role_list")) return null

  return (
    <div className="flex flex-col gap-6 p-1 animate-in fade-in duration-500">
      {/* Filter Section */}
      <Card className="border-none shadow-sm bg-muted/30 backdrop-blur-md">
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm tên vai trò..."
              className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <div className="rounded-xl border bg-background/50 backdrop-blur-sm shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold py-4 pl-6">Vai trò</TableHead>
                <TableHead className="text-center font-semibold py-4">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="py-4 pl-6">
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex justify-center">
                        <Skeleton className="h-8 w-20 rounded-md" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Shield className="h-8 w-8 opacity-20" />
                      <p>Không tìm thấy vai trò nào.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-primary/[0.02] transition-colors">
                    <TableCell className="font-medium text-foreground/90 py-4 pl-6">
                      {item.name}
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.name !== "super_admin" && (
                          <div className="flex justify-center gap-1">
                            <Can permission="role_edit">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors rounded-xl"
                                title="Chỉnh sửa"
                                onClick={() => onOpenModal(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Can>
                            <Can permission="role_delete">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors rounded-xl"
                                title="Xóa"
                                onClick={() => {
                                  setRoleToDelete(item)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </Can>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-none shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">{editingRole ? "Chỉnh sửa vai trò" : "Thêm vai trò mới"}</DialogTitle>
            <DialogDescription className="text-base">
              Nhập tên vai trò. Nhấn lưu để hoàn tất.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <Field>
              <FieldLabel className="font-bold text-sm text-foreground/80">Tên vai trò <span className="text-destructive">*</span></FieldLabel>
              <FieldContent>
                <Input
                  placeholder="VD: admin, teacher, support..."
                  {...form.register("name")}
                  className="rounded-xl border-muted-foreground/20 focus-visible:ring-primary/20 transition-all h-11"
                />
              </FieldContent>
              <FieldError errors={[{ message: form.formState.errors.name?.message }]} />
            </Field>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl">
                Hủy
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md shadow-primary/20 px-8 transition-all active:scale-95">
                {form.formState.isSubmitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa vai trò</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa vai trò <strong>{roleToDelete?.name}</strong>?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-xl">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              className="bg-destructive text-white hover:bg-destructive/90 rounded-xl"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xác nhận xóa"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
