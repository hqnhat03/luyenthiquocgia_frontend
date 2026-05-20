import { create } from 'zustand'

export interface Lesson {
  id: number
  class_id: number
  lesson_name: string
  description?: string
  duration_value: number
  duration_unit: 'minute' | 'hour'
  sort: number
  document_url?: string
  video_url?: string
  status: number // 1: published/active, 0: draft/inactive
}

interface LessonStore {
  editingLesson: Lesson | null
  setEditingLesson: (lesson: Lesson | null) => void
}

export const useLessonStore = create<LessonStore>((set) => ({
  editingLesson: null,
  setEditingLesson: (lesson) => set({ editingLesson: lesson }),
}))
