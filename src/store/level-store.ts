import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Level {
    id: number
    level: string
    subject_id: number
    subject_name?: string
    status: number
}

interface LevelState {
    editingLevel: Level | null
    setEditingLevel: (level: Level | null) => void
    clearEditingLevel: () => void
}

export const useLevelStore = create<LevelState>()(
    persist(
        (set) => ({
            editingLevel: null,
            setEditingLevel: (level) => set({ editingLevel: level }),
            clearEditingLevel: () => set({ editingLevel: null }),
        }),
        {
            name: "level-storage",
        }
    )
)
