"use client"

import { format, startOfWeek, addDays, isSameDay } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarDays, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface WeeklyEventsBarProps {
  monthlyEvents: Record<string, string[]>
  collapsed: boolean
  onToggleCollapse: () => void
  today: Date
}

function getWeekDays(base: Date): Date[] {
  const start = startOfWeek(base, { weekStartsOn: 1 })
  return Array.from({ length: 5 }, (_, i) => addDays(start, i))
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// 2026년 법정 공휴일 및 국가기념일
const publicHolidays: Record<string, string> = {
  "2026-01-01": "신정",
  "2026-02-16": "설날 연휴",
  "2026-02-17": "설날",
  "2026-02-18": "설날 연휴",
  "2026-03-01": "삼일절",
  "2026-05-05": "어린이날",
  "2026-05-23": "부처님오신날",
  "2026-06-06": "현충일",
  "2026-08-15": "광복절",
  "2026-09-06": "추석 연휴",
  "2026-09-07": "추석",
  "2026-09-08": "추석 연휴",
  "2026-10-03": "개천절",
  "2026-10-09": "한글날",
  "2026-12-25": "크리스마스",
}

export function WeeklyEventsBar({ monthlyEvents, collapsed, onToggleCollapse, today }: WeeklyEventsBarProps) {
  const weekDays = getWeekDays(today)

  const weekEvents = weekDays.map((d) => {
    const key = dateKey(d)
    const holiday = publicHolidays[key]
    const customEvents = monthlyEvents[key] || []
    const allEvents = holiday ? [holiday, ...customEvents] : customEvents
    
    return {
      date: d,
      events: allEvents,
      hasHoliday: !!holiday,
    }
  })

  const todayEvents = weekEvents.find((we) => isSameDay(we.date, today))

  return (
    <div className="no-print border-b bg-card/50 transition-all duration-300">
      {collapsed ? (
        <div className="flex items-center justify-between px-5 py-1.5">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">{"이번 주 행사"}</span>
            {todayEvents && todayEvents.events.length > 0 && (
              <span className="text-xs text-primary font-semibold">
                {`| 오늘: ${todayEvents.events.join(", ")}`}
              </span>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
            aria-label="주간 행사 펼치기"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            {"펼치기"}
          </button>
        </div>
      ) : (
        <div className="px-5 py-3">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-foreground">{"이번 주 행사"}</span>
            </div>
            <button
              onClick={onToggleCollapse}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
              aria-label="주간 행사 접기"
            >
              <ChevronUp className="h-3.5 w-3.5" />
              {"접기"}
            </button>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {weekEvents.map((we) => {
              const isTodayCard = isSameDay(we.date, today)
              return (
                <div
                  key={dateKey(we.date)}
                  className={cn(
                    "flex flex-col rounded-xl border px-3.5 py-2.5 transition-all shrink-0 shadow-sm",
                    isTodayCard
                      ? "flex-[2] border-primary/50 bg-primary/8 shadow-md ring-1 ring-primary/20"
                      : "flex-1 border-border bg-card hover:shadow-md"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        "text-xs font-bold",
                        isTodayCard ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {format(we.date, "EEE", { locale: ko })}
                    </span>
                    <span
                      className={cn(
                        "text-xs",
                        isTodayCard ? "text-primary/70" : "text-muted-foreground/70"
                      )}
                    >
                      {format(we.date, "M/d")}
                    </span>
                    {isTodayCard && (
                      <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm">
                        {"TODAY"}
                      </span>
                    )}
                  </div>
                  {we.events.length > 0 ? (
                    <div className="flex flex-col gap-0.5">
                      {we.events.map((ev, i) => {
                        const isHoliday = i === 0 && we.hasHoliday
                        return (
                          <span
                            key={i}
                            className={cn(
                              "text-sm leading-snug",
                              isHoliday && "text-destructive font-bold",
                              !isHoliday && (isTodayCard ? "font-semibold text-foreground" : "text-muted-foreground")
                            )}
                          >
                            {ev}
                          </span>
                        )
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/40 italic">
                      {"행사 없음"}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
