"use client"

import { useState, useMemo } from "react"
import { format, startOfWeek, endOfWeek, addDays, startOfMonth, endOfMonth } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarDays } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface EventsSidebarProps {
  monthlyEvents: Record<string, string[]>
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function EventsSidebar({ monthlyEvents }: EventsSidebarProps) {
  const [viewMode, setViewMode] = useState<"weekly" | "monthly">("weekly")
  const today = new Date()

  const filteredEvents = useMemo(() => {
    let start: Date
    let end: Date

    if (viewMode === "weekly") {
      start = startOfWeek(today, { weekStartsOn: 1 })
      end = endOfWeek(today, { weekStartsOn: 1 })
    } else {
      start = startOfMonth(today)
      end = endOfMonth(today)
    }

    const result: { date: string; events: string[] }[] = []
    const current = new Date(start)

    while (current <= end) {
      const key = dateKey(current)
      if (monthlyEvents[key] && monthlyEvents[key].length > 0) {
        result.push({ date: key, events: monthlyEvents[key] })
      }
      current.setDate(current.getDate() + 1)
    }

    return result
  }, [viewMode, monthlyEvents, today])

  return (
    <div className="h-full flex flex-col py-3 px-3">
      <div className="flex items-center gap-2 mb-3 px-1">
        <CalendarDays className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold text-foreground">{"행사"}</span>
      </div>

      {/* Toggle switch */}
      <div className="flex bg-muted rounded-lg p-0.5 mb-3">
        <button
          onClick={() => setViewMode("weekly")}
          className={cn(
            "flex-1 text-[11px] font-medium py-1.5 rounded-md transition-all",
            viewMode === "weekly"
              ? "bg-card text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {"주간"}
        </button>
        <button
          onClick={() => setViewMode("monthly")}
          className={cn(
            "flex-1 text-[11px] font-medium py-1.5 rounded-md transition-all",
            viewMode === "monthly"
              ? "bg-card text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {"월간"}
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 pr-1">
          {filteredEvents.length > 0 ? (
            filteredEvents.map(({ date, events }) => {
              const d = new Date(date + "T00:00:00")
              const isToday = dateKey(today) === date
              return events.map((ev, i) => (
                <div
                  key={`${date}-${i}`}
                  className={cn(
                    "rounded-lg px-2.5 py-2 transition-all",
                    isToday
                      ? "bg-primary/8 border border-primary/20"
                      : "hover:bg-muted/60"
                  )}
                >
                  <span className={cn(
                    "text-[11px] font-medium block",
                    isToday ? "text-primary" : "text-muted-foreground"
                  )}>
                    {format(d, "M/d(EEE)", { locale: ko })}
                  </span>
                  <span className={cn(
                    "text-xs leading-snug block mt-0.5",
                    isToday ? "text-foreground font-semibold" : "text-foreground"
                  )}>
                    {ev}
                  </span>
                </div>
              ))
            })
          ) : (
            <p className="text-xs text-muted-foreground/60 text-center py-6 italic">
              {"등록된 행사가 없습니다"}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
