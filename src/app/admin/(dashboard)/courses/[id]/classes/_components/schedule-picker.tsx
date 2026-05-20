"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { v4 as uuidv4 } from 'uuid';

export interface ScheduleSlot {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
}

interface SchedulePickerProps {
  value?: ScheduleSlot[]
  onChange?: (value: ScheduleSlot[]) => void
}

const DAYS = [
  { label: "Thứ 2", value: 1 },
  { label: "Thứ 3", value: 2 },
  { label: "Thứ 4", value: 3 },
  { label: "Thứ 5", value: 4 },
  { label: "Thứ 6", value: 5 },
  { label: "Thứ 7", value: 6 },
  { label: "Chủ nhật", value: 0 },
]

const TIMES = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7
  const minute = i % 2 === 0 ? "00" : "30"
  const startStr = `${hour.toString().padStart(2, "0")}:${minute}`

  const endMinute = minute === "00" ? "30" : "00"
  const endHour = minute === "30" ? hour + 1 : hour
  const endStr = `${endHour.toString().padStart(2, "0")}:${endMinute}`

  return {
    label: minute === "00" ? `${hour}:00` : "",
    start: startStr,
    end: endStr,
    index: i,
  }
})

export function SchedulePicker({ value = [], onChange }: SchedulePickerProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragStart, setDragStart] = React.useState<{ day: number; index: number } | null>(null)
  const [dragCurrent, setDragCurrent] = React.useState<number | null>(null)

  const isSelected = (day: number, timeIndex: number) => {
    // Check if this slot is part of any saved range
    const inSaved = value.some((range) => {
      if (range.day_of_week !== day) return false
      const startIndex = TIMES.find((t) => t.start === range.start_time)?.index ?? -1
      const endIndex = TIMES.find((t) => t.end === range.end_time)?.index ?? -1
      return timeIndex >= startIndex && timeIndex <= endIndex
    })

    if (inSaved) return true

    // Check if this slot is part of the current drag
    if (isDragging && dragStart && dragStart.day === day && dragCurrent !== null) {
      const min = Math.min(dragStart.index, dragCurrent)
      const max = Math.max(dragStart.index, dragCurrent)
      return timeIndex >= min && timeIndex <= max
    }

    return false
  }

  const handleMouseDown = (day: number, index: number) => {
    // Check if clicking on an existing range to remove it
    const existingRangeIndex = value.findIndex((range) => {
      if (range.day_of_week !== day) return false
      const startIndex = TIMES.find((t) => t.start === range.start_time)?.index ?? -1
      const endIndex = TIMES.find((t) => t.end === range.end_time)?.index ?? -1
      return index >= startIndex && index <= endIndex
    })

    if (existingRangeIndex !== -1) {
      const newValue = [...value]
      newValue.splice(existingRangeIndex, 1)
      onChange?.(newValue)
      return
    }

    setIsDragging(true)
    setDragStart({ day, index })
    setDragCurrent(index)
  }

  const handleMouseEnter = (index: number) => {
    if (!isDragging) return
    setDragCurrent(index)
  }

  React.useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging && dragStart && dragCurrent !== null) {
        const minIndex = Math.min(dragStart.index, dragCurrent)
        const maxIndex = Math.max(dragStart.index, dragCurrent)

        const newRange: ScheduleSlot = {
          id: uuidv4(),
          day_of_week: dragStart.day,
          start_time: TIMES[minIndex].start,
          end_time: TIMES[maxIndex].end,
        }

        // Add to value but filter out any overlapping/internal ranges if needed? 
        // For simplicity, just add it.
        onChange?.([...value, newRange])
      }
      setIsDragging(false)
      setDragStart(null)
      setDragCurrent(null)
    }

    window.addEventListener("mouseup", handleMouseUp)
    return () => window.removeEventListener("mouseup", handleMouseUp)
  }, [isDragging, dragStart, dragCurrent, value, onChange])

  return (
    <div className="w-full overflow-x-auto border rounded-xl shadow-sm bg-background/50">
      <div className="min-w-[700px]">
        {/* Header */}
        <div className="grid grid-cols-[100px_repeat(7,1fr)] bg-muted/50 border-b">
          <div className="p-3 text-sm font-semibold text-center text-muted-foreground flex items-center justify-center">
            Khung giờ
          </div>
          {DAYS.map((day) => (
            <div key={day.value} className="p-3 text-sm font-semibold text-center">
              {day.label}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex flex-col select-none touch-none">
          {TIMES.map((time, rowIdx) => (
            <div key={time.start} className="grid grid-cols-[100px_repeat(7,1fr)] hover:bg-muted/10 transition-colors">
              <div className="p-2 text-xs font-medium text-center text-muted-foreground flex items-center justify-center bg-muted/20">
                {time.label}
              </div>
              {DAYS.map((day) => {
                const selected = isSelected(day.value, rowIdx)
                const isPrevSelected = rowIdx > 0 && isSelected(day.value, rowIdx - 1)
                const isNextSelected = rowIdx < TIMES.length - 1 && isSelected(day.value, rowIdx + 1)

                // Check if this slot is the START of a range
                const isStartOfAnyRange = value.some(r =>
                  r.day_of_week === day.value &&
                  TIMES.find(t => t.start === r.start_time)?.index === rowIdx
                ) || (isDragging && dragStart?.day === day.value && Math.min(dragStart.index, dragCurrent!) === rowIdx)

                return (
                  <div
                    key={`${day.value}-${time.start}`}
                    className={cn(
                      "relative cursor-cell transition-all duration-200 px-1 flex flex-col",
                      selected ? "bg-primary/10" : "hover:bg-muted/30",
                      selected && !isPrevSelected && "pt-1",
                      selected && !isNextSelected && "pb-1",
                      !selected && "p-1"
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleMouseDown(day.value, rowIdx)
                    }}
                    onMouseEnter={() => handleMouseEnter(rowIdx)}
                  >
                    {selected ? (
                      <div
                        className={cn(
                          "w-full h-full min-h-[36px] bg-primary text-primary-foreground shadow-sm transition-all duration-200 flex items-center justify-center",
                          !isPrevSelected && "rounded-t-md",
                          !isNextSelected && "rounded-b-md"
                        )}
                      >
                        {isStartOfAnyRange && (
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] leading-tight font-bold opacity-90 whitespace-nowrap">
                              {(() => {
                                const range = value.find(r =>
                                  r.day_of_week === day.value &&
                                  TIMES.find(t => t.start === r.start_time)?.index === rowIdx
                                ) || (isDragging && dragStart?.day === day.value && Math.min(dragStart.index, dragCurrent!) === rowIdx ? {
                                  start_time: TIMES[Math.min(dragStart.index, dragCurrent!)].start,
                                  end_time: TIMES[Math.max(dragStart.index, dragCurrent!)].end
                                } : null)

                                return range ? `${range.start_time}-${range.end_time}` : ""
                              })()}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full min-h-[30px] rounded-md border-2 border-transparent" />
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
