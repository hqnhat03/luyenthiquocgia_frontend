import { type Role } from "@/types/RoleType"

export interface Profile {
    id: string | number
    name: string
    email: string
    phone: string | null
    address: string | null
    gender: "male" | "female" | "other"
    date_of_birth: string | null
    avatar: string | null
    status: "active" | "inactive"
    roles: Role[] | string[]
}
