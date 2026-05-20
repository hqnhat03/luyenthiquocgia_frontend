"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import api from "@/lib/axios"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react"
import * as React from "react"
import { v4 as uuidv4 } from "uuid"

interface Teacher {
  id: number
  name: string
  email?: string
  expertise?: string
}

interface ClassTeacherItem {
  id: string
  teacher_id: number
}

interface TeacherSelectProps {
  value: ClassTeacherItem[]
  onChange: (value: ClassTeacherItem[]) => void
  disabled?: boolean
}

export function TeacherSelect({ value = [], onChange, disabled }: TeacherSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [teachers, setTeachers] = React.useState<Teacher[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const teacherDict = React.useRef<Map<number, string>>(new Map())

  React.useEffect(() => {
    const fetchTeachers = async () => {
      setIsLoading(true)
      try {
        const res = await api.get("/admin/teachers")
        // Handle variations in API response format
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data?.teachers)
              ? res.data.teachers
              : []

        type TeacherType = {
          id: number
          name: string
          email?: string
          expertise?: string
        }

        const formattedTeachers = data.map((t: TeacherType) => {
          const name = t.name
          teacherDict.current.set(t.id, name)
          return {
            id: t.id,
            name,
            email: t.email,
            expertise: t.expertise
          }
        })
        setTeachers(formattedTeachers)
      } catch (error) {
        console.error("Failed to fetch teachers:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // Only fetch when dropdown opens the first time, or just fetch right away
    fetchTeachers()
  }, [])

  const handleSelect = (teacherId: number) => {
    const isSelected = value.some(item => item.teacher_id === teacherId)
    if (isSelected) {
      onChange(value.filter(item => item.teacher_id !== teacherId))
    } else {
      onChange([...value, { id: uuidv4(), teacher_id: teacherId }])
    }
  }

  const handleRemove = (teacherId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter(item => item.teacher_id !== teacherId))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className="w-full justify-between bg-muted/30 min-h-11 h-auto py-2 focus-visible:ring-primary/20"
        >
          <div className="flex flex-wrap gap-1.5 flex-1 justify-start">
            {isLoading && value.length === 0 ? (
              <span className="flex items-center text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải...
              </span>
            ) : value.length > 0 ? (
              value.map((item) => {
                const name = teacherDict.current.get(item.teacher_id) || `ID: ${item.teacher_id}`
                return (
                  <Badge
                    key={item.id}
                    variant="secondary"
                    className="mr-1 py-1 pr-1 font-normal bg-background border"
                  >
                    <span className="text-xs mr-1">{name}</span>
                    <div
                      role="button"
                      className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-muted-foreground/20 cursor-pointer"
                      onClick={(e) => handleRemove(item.teacher_id, e)}
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </Badge>
                )
              })
            ) : (
              <span className="text-muted-foreground font-normal">
                Chọn giáo viên phụ trách...
              </span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      }>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[300px] p-0 shadow-xl" align="start">
        <Command>
          <CommandInput placeholder="Tìm kiếm giáo viên..." className="border-none" />
          <CommandList>
            <CommandEmpty>Không tìm thấy giáo viên nào.</CommandEmpty>
            <CommandGroup>
              {teachers.map((teacher) => {
                const isSelected = value.some(item => item.teacher_id === teacher.id)
                return (
                  <CommandItem
                    key={teacher.id}
                    value={teacher.name}
                    onSelect={() => handleSelect(teacher.id)}
                    className="cursor-pointer"
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary text-primary transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground border-transparent"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </div>
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className="font-medium text-sm">{teacher.name}</span>
                        {teacher.expertise && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium border border-primary/20">
                            {teacher.expertise}
                          </span>
                        )}
                      </div>
                      {teacher.email && (
                        <span className="text-xs text-muted-foreground">
                          {teacher.email}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
