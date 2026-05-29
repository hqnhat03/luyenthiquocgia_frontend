"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { studentAxios } from "@/api/student"
import { commonAxios } from "@/api/common"
import { RefreshCcw, Search } from "lucide-react"
import React, { useEffect, useState } from "react"

export interface FilterState {
  keyword: string
  level_id: string[]
  subject_id: string[]
  price: string[]    // '0' = free, '1' = paid
  duration: string[] // '1'=0-5h, '2'=5-10h, '3'=10-20h, '4'=20h+
}

interface FilterSidebarProps {
  filters: FilterState
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>
  onReset: () => void
  className?: string
}

export function FilterSidebar({
  filters,
  setFilters,
  onReset,
  className = ""
}: FilterSidebarProps) {
  const [levels, setLevels] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState(filters.keyword)

  useEffect(() => {
    setKeywordInput(filters.keyword)
  }, [filters.keyword])
  const [subjects, setSubjects] = useState<{ id: number, name: string, category: string }[]>([])

  const [isLoadingLevels, setIsLoadingLevels] = useState(false)
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingLevels(true)
        setIsLoadingSubjects(true)

        const [lvRes, subRes] = await Promise.all([
          studentAxios.get("/subjects/unique-level-names"),
          commonAxios.get("/common/subjects")
        ])

        if (lvRes.data.status === "success" || lvRes.data.success) {
          setLevels(lvRes.data.data)
        }
        if (subRes.data.status === "success" || subRes.data.success) {
          setSubjects(subRes.data.data)
        }

      } catch (error) {
        console.error("Failed to fetch filter data:", error)
      } finally {
        setIsLoadingLevels(false)
        setIsLoadingSubjects(false)
      }
    }
    fetchData()
  }, [])

  const handleToggleFilter = (key: keyof FilterState, value: string, checked: boolean | string) => {
    setFilters(prev => {
      const current = Array.isArray(prev[key]) ? [...(prev[key] as string[])] : []
      if (checked) {
        if (!current.includes(value)) current.push(value)
      } else {
        const index = current.indexOf(value)
        if (index > -1) current.splice(index, 1)
      }
      return { ...prev, [key]: current }
    })
  }



  return (
    <div className={`space-y-8 ${className}`}>
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
          <Search className="w-4 h-4" /> Tìm kiếm
        </h3>
        <Input
          placeholder="Tìm kiếm khóa học..."
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          className="w-full bg-background"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setFilters(prev => ({ ...prev, keyword: keywordInput }))
            }
          }}
          onBlur={() => {
            setFilters(prev => ({ ...prev, keyword: keywordInput }))
          }}
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 text-foreground">Môn học</h3>
        <div className="space-y-3">
          {isLoadingSubjects ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="subject-all"
                  checked={filters.subject_id.length === 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFilters(prev => ({ ...prev, subject_id: [] }))
                    }
                  }}
                />
                <Label
                  htmlFor="subject-all"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Tất cả
                </Label>
              </div>
              {subjects.map(subject => (
                <div key={subject.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`subject-${subject.id}`}
                    checked={filters.subject_id.includes(subject.id.toString())}
                    onCheckedChange={(checked) => handleToggleFilter('subject_id', subject.id.toString(), checked)}
                  />
                  <Label
                    htmlFor={`subject-${subject.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {subject.name}
                  </Label>
                </div>
              ))}
            </>
          )}
        </div>
      </div>



      <div>
        <h3 className="text-sm font-semibold mb-3 text-foreground">Cấp độ</h3>
        <div className="space-y-3">
          {isLoadingLevels ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="level-all"
                  checked={filters.level_id.length === 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFilters(prev => ({ ...prev, level_id: [] }))
                    }
                  }}
                />
                <Label
                  htmlFor="level-all"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Tất cả
                </Label>
              </div>
              {levels.map(levelName => (
                <div key={levelName} className="flex items-center space-x-3">
                  <Checkbox
                    id={`level-${levelName}`}
                    checked={filters.level_id.includes(levelName)}
                    onCheckedChange={(checked) => handleToggleFilter('level_id', levelName, checked)}
                  />
                  <Label
                    htmlFor={`level-${levelName}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {levelName}
                  </Label>
                </div>
              ))}
            </>
          )}
        </div>
      </div>


      {/* Price Filter */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-foreground">Học phí</h3>
        <div className="space-y-3">
          {[
            { value: '0', label: 'Miễn phí' },
            { value: '1', label: 'Có phí' },
          ].map(({ value, label }) => (
            <div key={value} className="flex items-center space-x-3">
              <Checkbox
                id={`price-${value}`}
                checked={filters.price.includes(value)}
                onCheckedChange={(checked) => handleToggleFilter('price', value, checked)}
              />
              <Label
                htmlFor={`price-${value}`}
                className="text-sm font-medium leading-none cursor-pointer"
              >
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Duration Filter */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-foreground">Thời lượng</h3>
        <div className="space-y-3">
          {[
            { value: '1', label: 'Dưới 5 giờ' },
            { value: '2', label: '5 - 10 giờ' },
            { value: '3', label: '10 - 20 giờ' },
            { value: '4', label: 'Trên 20 giờ' },
          ].map(({ value, label }) => (
            <div key={value} className="flex items-center space-x-3">
              <Checkbox
                id={`duration-${value}`}
                checked={filters.duration.includes(value)}
                onCheckedChange={(checked) => handleToggleFilter('duration', value, checked)}
              />
              <Label
                htmlFor={`duration-${value}`}
                className="text-sm font-medium leading-none cursor-pointer"
              >
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-6 flex flex-col gap-3 border-t">
        <Button onClick={onReset} variant="outline" className="w-full font-medium">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Đặt lại
        </Button>
      </div>
    </div>
  )
}
