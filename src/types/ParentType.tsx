import { type Student } from "@/types/StudentType"

export interface Parent {
    id: number | string
    name: string
    email: string
    phone: string
    address?: string
    status: "1" | "0"
    date_of_birth?: string
    avatar?: string | null
    students?: Pick<Student, "id" | "name" | "email">[]
}

/**
 * Splits a full name into first_name and last_name (Vietnamese standard).
 * e.g., "Nguyễn Văn A" -> { first_name: "Nguyễn Văn", last_name: "A" }
 */
export function splitFullName(fullName: string) {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length === 1) {
        return { first_name: "", last_name: parts[0] }
    }
    const last_name = parts.pop() || ""
    const first_name = parts.join(" ")
    return { first_name, last_name }
}

/**
 * Maps a backend parent record to frontend Parent state.
 */
export function mapBackendParentToFrontend(item: any): Parent {
    return {
        id: item.id,
        name: item.first_name || item.last_name
            ? `${item.first_name || ""} ${item.last_name || ""}`.trim()
            : "",
        email: item.email || "",
        phone: item.tel || "",
        address: item.address || "",
        status: item.status,
        date_of_birth: item.birth_date || undefined,
        avatar: item.avatar_url || null,
        students: Array.isArray(item.students)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? item.students.map((s: any) => ({
                id: s.id,
                name: s.first_name || s.last_name
                    ? `${s.first_name || ""} ${s.last_name || ""}`.trim()
                    : "",
                email: s.email || ""
            }))
            : []
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapFrontendParentToBackend(data: any) {
    return {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        tel: data.phone,
        address: data.address,
        status: Number(data.status),
        birth_date: data.date_of_birth,
        avatar_url: data.avatar || null,
        student_ids: data.student_ids || []
    }
}
