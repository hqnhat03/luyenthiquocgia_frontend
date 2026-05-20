import { create } from "zustand"
import { persist } from "zustand/middleware"

interface ExamState {
  currentStudentName: string | null
  setCurrentStudentName: (name: string | null) => void
  clearExamState: () => void
}

export const useExamStore = create<ExamState>()(
  persist(
    (set) => ({
      currentStudentName: null,
      setCurrentStudentName: (name) => set({ currentStudentName: name }),
      clearExamState: () => set({ currentStudentName: null }),
    }),
    {
      name: "exam-storage",
    }
  )
)
