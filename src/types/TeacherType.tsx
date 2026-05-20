export interface Teacher {
    id: number | string
    name: string
    first_name: string
    last_name: string
    email: string
    tel: string
    address?: string
    gender?: "male" | "female" | "other" | string
    nationality?: string
    expertise?: string
    experience?: string
    target_student?: "student" | "employee" | "all" | string
    status: "active" | "inactive"
    date_of_birth?: string
    avatar?: string | null
    bio?: string
    specialization?: number[]
}

/**
 * Splits a full name into first_name and last_name (Vietnamese standard).
 * e.g., "Nguyễn Văn A" -> { first_name: "Nguyễn Văn", last_name: "A" }
 */
export function splitFullName(fullName: string) {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length === 1) {
        return { first_name: parts[0], last_name: parts[0] }
    }
    const last_name = parts.pop() || ""
    const first_name = parts.join(" ")
    return { first_name, last_name }
}

/**
 * Maps a backend teacher record to frontend Teacher state.
 */
export function mapBackendTeacherToFrontend(item: any): Teacher {
    let ts = "all"
    if (item.target_student === 0) ts = "student"
    else if (item.target_student === 1) ts = "employee"

    const spec = Array.isArray(item.teaching_abilities)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? item.teaching_abilities.map((ta: any) => Number(ta.subject_id))
        : Array.isArray(item.teaching_abilities_for_update)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? item.teaching_abilities_for_update.map((ta: any) => Number(ta.subject_id))
            : Array.isArray(item.teaching_abilities)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ? item.teaching_abilities.map((ta: any) => Number(ta.subject_id))
                : Array.isArray(item.teachingAbilities)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ? item.teachingAbilities.map((ta: any) => Number(ta.subject_id))
                    : []

    return {
        id: item.id,
        name: item.first_name || item.last_name
            ? `${item.first_name || ""} ${item.last_name || ""}`.trim()
            : "",
        first_name: item.first_name || "",
        last_name: item.last_name || "",
        email: item.email || "",
        tel: item.tel || "",
        address: item.address || "",
        gender: item.gender === 0 ? "female" : "male",
        nationality: item.nantionality || "",
        expertise: item.subject_names || "",
        experience: item.experience_years?.toString() || "",
        target_student: ts,
        status: item.status === 1 ? "active" : "inactive",
        date_of_birth: item.birth_date || "",
        avatar: item.avatar_url || null,
        bio: item.introduction || "",
        specialization: spec
    }
}
