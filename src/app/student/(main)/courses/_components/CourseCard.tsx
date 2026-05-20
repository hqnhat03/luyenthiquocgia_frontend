import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { BookOpen, Clock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export interface Course {
  id: string | number
  name: string
  slug?: string
  image_url: string
  price: number
  level_id: string | number
  subject_id: string | number
  is_published: boolean
  teachers?: {
    id: number | string
    name: string
    avatar: string | null
  }[]
  lesson_count?: number
  completion_time?: string // e.g. "12h 30m"
}

export function CourseCard({ course }: { course: Course }) {
  const isFree = Number(course.price) === 0

  const href = course.slug ? `/courses/${course.slug}` : undefined

  const content = (
    <Card className="p-0 flex flex-col sm:flex-row overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group bg-card border-border">
      {/* image header */}
      <div className="relative w-full sm:w-[180px] shrink-0 aspect-[3/4] overflow-hidden bg-muted border-r border-border/50">
        <Image
          src={course.image_url || 'https://placehold.co/300x400.png?text=No+Image'}
          alt={course.name}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          fill
          sizes="(max-width: 640px) 100vw, 180px"
          priority
        />
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          {course.is_published && <Badge variant="secondary" className="bg-white/90 text-[10px] h-5 px-1.5 text-black hover:bg-white shadow-sm">Đã xuất bản</Badge>}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-grow p-4 sm:p-5">
        <div className="flex-grow pr-0 sm:pr-4">
          <h3 className="font-semibold text-xl leading-tight line-clamp-2 mb-3 group-hover:text-primary transition-colors">{course.name}</h3>

          {course.teachers && course.teachers.length > 0 ? (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex -space-x-2">
                {course.teachers.map(teacher => (
                  <Avatar key={teacher.id} className="h-7 w-7 border-2 border-card">
                    <AvatarImage src={teacher.avatar || undefined} />
                    <AvatarFallback className="text-[10px] bg-muted">{teacher.name?.[0] || 'T'}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-sm text-muted-foreground truncate font-medium">
                {course.teachers.map(t => t.name).join(', ')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Avatar className="h-7 w-7 border-2 border-card">
                <AvatarFallback className="text-[10px] bg-muted">A</AvatarFallback>
              </Avatar>
              <span className="truncate font-medium">Admin</span>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {course.lesson_count !== undefined && (
              <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md">
                <BookOpen className="h-4 w-4" />
                <span>{course.lesson_count} bài</span>
              </div>
            )}
            {course.completion_time && (
              <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md">
                <Clock className="h-4 w-4" />
                <span>{course.completion_time} giờ</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-end mt-4 sm:mt-0 shrink-0">

          <div className="font-bold text-2xl text-primary tracking-tight">
            {isFree ? "Miễn phí" : (
              <>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price)}
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )

  if (href) {
    return <Link href={href} className="block">{content}</Link>
  }
  return content
}
