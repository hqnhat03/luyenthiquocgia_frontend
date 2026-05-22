"use client"

import * as React from "react"
import { usePermission } from "@/hooks/use-permission"

interface CanProps {
  /** screen_code (ví dụ: "A_02_02") hoặc permissionKey (ví dụ: "admin:view") */
  permission: string | string[]
  children: React.ReactNode
  fallback?: React.ReactNode
  /** Ẩn hoàn toàn khi đang loading (tránh flash) */
  hideWhileLoading?: boolean
}

/**
 * Can — Conditional render dựa trên quyền
 *
 * ```tsx
 * <Can permission="A_02_02">
 *   <AddAdminButton />
 * </Can>
 *
 * // Hoặc dùng permissionKey
 * <Can permission="admin:view">
 *   <AdminsPage />
 * </Can>
 * ```
 */
export const Can = ({
  permission,
  children,
  fallback = null,
  hideWhileLoading = false,
}: CanProps) => {
  const { hasPermission, isLoading, isInitialized } = usePermission()

  if (hideWhileLoading && (!isInitialized || isLoading)) {
    return null
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
