"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
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

interface Course {
  id: number
  name: string
}

interface CourseSelectProps {
  value?: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function CourseSelect({ value, onChange, disabled }: CourseSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [courses, setCourses] = React.useState<Course[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true)
      try {
        const res = await api.get("/admin/courses")
        const data = res.data?.data || res.data || []
        setCourses(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Failed to fetch courses:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCourses()
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className="w-full justify-between bg-muted/30 focus-visible:ring-primary/20"
        >
          {isLoading ? (
            <span className="flex items-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải...
            </span>
          ) : value ? (
            courses.find((course) => course.id === value)?.name || `Khóa học ID: ${value}`
          ) : (
            <span className="text-muted-foreground">Chọn khóa học...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      }>

      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Tìm kiếm khóa học..." />
          <CommandList>
            <CommandEmpty>Không tìm thấy khóa học.</CommandEmpty>
            <CommandGroup>
              {courses.map((course) => (
                <CommandItem
                  key={course.id}
                  value={course.name}
                  onSelect={() => {
                    onChange(course.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === course.id ? "opacity-100 text-primary" : "opacity-0"
                    )}
                  />
                  {course.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
