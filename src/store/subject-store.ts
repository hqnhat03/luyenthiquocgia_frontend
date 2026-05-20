import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Subject {
    id: string
    name: string
    category: string
    education_level: string
    target_student: number
    status: "draft" | "published" | "archived"
}

interface SubjectState {
    editingSubject: Subject | null
    setEditingSubject: (subject: Subject | null) => void
    clearEditingSubject: () => void
}

export const useSubjectStore = create<SubjectState>()(
    persist(
        (set) => ({
            editingSubject: null,
            setEditingSubject: (subject) => set({ editingSubject: subject }),
            clearEditingSubject: () => set({ editingSubject: null }),
        }),
        {
            name: "subject-storage",
        }
    )
)
