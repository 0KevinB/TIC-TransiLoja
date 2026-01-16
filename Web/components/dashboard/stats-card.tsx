import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  borderColorClass?: string
  iconColorClass?: string
}

export function StatsCard({ title, value, icon: Icon, borderColorClass, iconColorClass }: StatsCardProps) {
  return (
    <Card className={cn(
      "border-l-4 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 cursor-pointer group",
      borderColorClass
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-gray-900 transition-colors">
          {title}
        </CardTitle>
        <div className={cn(
          "p-2 rounded-lg transition-all duration-300 group-hover:scale-110",
          iconColorClass?.replace("text-", "bg-")?.replace(/\d+/, "100")
        )}>
          <Icon className={cn("h-5 w-5 transition-transform duration-300", iconColorClass)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
          {typeof value === 'number' ? value.toLocaleString('es-ES') : value}
        </div>
      </CardContent>
    </Card>
  )
}
