import { type Role } from "@/types/RoleType"

export interface Admin {
    id: string | number
    first_name: string
    last_name: string
    name?: string // Computed or optional
    email: string
    avatar_url: string | null
    avatar?: string // For compatibility
    status: "active" | "inactive" | number
    role_id: number
    role?: Role
    roles: Role[] | string[]
}
