"use client"

import * as React from "react"
import { ShieldAlert } from "lucide-react"
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

interface ConfirmDeleteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title?: string
  description?: React.ReactNode
  loading?: boolean
  itemName?: string
}

export function ConfirmDeleteModal({
  open,
  onOpenChange,
  onConfirm,
  title = "Xác nhận xóa",
  description,
  loading = false,
  itemName,
}: ConfirmDeleteModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="glass-morphism border-rose-100 ring-4 ring-rose-50/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
            <ShieldAlert className="h-5 w-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base pt-2">
            {description || (
              <>
                Bạn có chắc chắn muốn xóa {itemName ? <strong>{itemName}</strong> : "mục này"}?
                <br />
                Hành động này sẽ xóa vĩnh viễn dữ liệu và không thể hoàn tác.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3 sm:gap-3">
          <AlertDialogCancel
            disabled={loading}
            className="bg-muted/50 border-none hover:bg-muted"
          >
            Hủy
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={loading}
            className="bg-destructive text-white hover:bg-destructive/90 shadow-lg shadow-rose-200 transition-all active:scale-95"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang xóa...
              </div>
            ) : (
              "Xác nhận xóa"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
