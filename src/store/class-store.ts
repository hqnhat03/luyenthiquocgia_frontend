import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface ClassData {
  id: number
  class_code: string
  start_day: string
  end_day: string
  max_student: number
  meeting_url: string
  status: "draft" | "published" | "archived"
  teachers: Array<{
    id: number | string
    name: string
    avatar: string
    email?: string
  }>
  class_teaches: Array<{
    id: string | number
    teacher_id: number
  }>
  students: Array<{
    id: string | number
    name: string
    email: string
    avatar: string
  }>
  class_schedules: Array<{
    id: string | number
    day_of_week: number
    start_time: string
    end_time: string
  }>
  course?: {
    id: number
    name: string
  }
}

interface ClassState {
  classDetail: ClassData | null
  setClassDetail: (data: ClassData | null) => void
  clearClassDetail: () => void
}

export const useClassStore = create<ClassState>()(
  persist(
    (set) => ({
      classDetail: null,
      setClassDetail: (data) => set({ classDetail: data }),
      clearClassDetail: () => set({ classDetail: null }),
    }),
    {
      name: "class-storage",
    }
  )
)
