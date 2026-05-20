import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Archive, CheckCircle2, FileEdit } from "lucide-react"
import * as React from "react"

export type CommonStatus = 'draft' | 'published' | 'archived'

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: CommonStatus
  className?: string
  iconClassName?: string
  showIcon?: boolean
}

const statusConfig = {
  published: {
    label: 'Xuất bản',
    icon: CheckCircle2,
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20',
  },
  archived: {
    label: 'Lưu trữ',
    icon: Archive,
    className: 'bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20',
  },
  draft: {
    label: 'Nháp',
    icon: FileEdit,
    className: 'bg-slate-500/10 text-slate-600 border-slate-500/20 hover:bg-slate-500/20',
  },
}

export function StatusBadge({ status, className, iconClassName, showIcon = true, ...props }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft
  const Icon = config.icon

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-colors", 
        config.className,
        className
      )}
      {...props}
    >
      {showIcon && <Icon className={cn("size-3 mr-1.5", iconClassName)} />}
      <span>{config.label}</span>
    </Badge>
  )
}
