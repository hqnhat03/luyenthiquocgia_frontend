import { GraduationCap, User } from 'lucide-react'
import Link from 'next/link'
import { TabsList, TabsTrigger } from '../ui/tabs'

function SwitchLoginTab(){
  return (
    <TabsList className="grid w-full grid-cols-2 mb-8 h-12 p-1">
              <TabsTrigger value="student">
                <Link
                  href={`https://${process.env.NEXT_PUBLIC_DOMAIN}/login`}
                  className="flex items-center gap-2 cursor-pointer h-full rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm"
                >
                  <User className="size-4" />
                  Học sinh
                </Link>
              </TabsTrigger>
              <TabsTrigger value="teacher">
                <Link
                  href={`https://giaovien.${process.env.NEXT_PUBLIC_DOMAIN}/login`}
                  className="flex items-center gap-2 cursor-pointer h-full rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm"
                >
                  <GraduationCap className="size-4" />
                  Giáo viên
                </Link>
              </TabsTrigger>
            </TabsList>
  )
}

export default SwitchLoginTab