"use client"

import * as React from "react"
import { usePermission } from "@/hooks/use-permission"

interface CanProps {
  permission: string | string[]
  action?: 'view' | 'add' | 'edit' | 'delete'
  children: React.ReactNode
  fallback?: React.ReactNode
  hideWhileLoading?: boolean
}

export const Can = ({ 
  permission, 
  action = 'view', 
  children, 
  fallback = null,
  hideWhileLoading = false
}: CanProps) => {
  const { hasPermission, isLoading, isInitialized } = usePermission()

  if (hideWhileLoading && (!isInitialized || isLoading)) {
    return null
  }

  if (!hasPermission(permission, action)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
