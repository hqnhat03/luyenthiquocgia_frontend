export interface Student {
    id: number | string
    name: string
    first_name?: string
    last_name?: string
    email: string
    phone: string
    address?: string
    gender?: "male" | "female" | "other"
    status: "active" | "inactive"
    date_of_birth?: string
    avatar?: string | null
    student_type: "student" | "employee"
    school?: string
    grade?: string
    work?: string
    position?: string
}

export interface ClassRoom {
    id: number
    course_id: number
    class_code: string
    is_complete_study: boolean
}

export interface StudentCourse {
    id: number
    name: string
    class_rooms: ClassRoom[]
}

export interface StudentDetail extends Student {
    parent_id?: number | null
    department?: string | null
    courses?: StudentCourse[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapBackendStudentToFrontend(item: any): Student {
    return {
        id: item.id,
        name: `${item.first_name || ""} ${item.last_name || ""}`.trim(),
        first_name: item.first_name || "",
        last_name: item.last_name || "",
        email: item.email || "",
        phone: item.tel || "",
        address: item.address || "",
        gender: item.gender === 1 ? "male" : (item.gender === 0 ? "female" : "other"),
        status: item.status === 1 ? "active" : "inactive",
        date_of_birth: item.birth_date || "",
        avatar: item.avatar_url || null,
        student_type: item.type === 2 ? "employee" : "student",
        school: item.school_name || "",
        grade: item.grade_level ? item.grade_level.toString() : "",
        work: item.company_name || "",
        position: item.position || "",
    }
}
