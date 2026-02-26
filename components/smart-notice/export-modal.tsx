"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileDown, CalendarRange } from "lucide-react"
import { format, eachDayOfInterval, parseISO } from "date-fns"
import { ko } from "date-fns/locale"
import type { NoticeItem } from "@/components/smart-notice/notice-editor"

interface ExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userName: string | null
}

function formatNoticeBlock(date: Date, timetable: string[], items: NoticeItem[]) {
  const dateStr = format(date, "yyyy년 M월 d일 (EEEE)", { locale: ko })
  const schedule = `시) ${timetable.join("-")}`
  const lines = items
    .filter((item) => item.text.trim() !== "")
    .map((item, i) => `${i + 1}. ${item.isImportant ? "[중요] " : ""}${item.text}`)
    .join("\n")
  return `${"=".repeat(40)}\n${dateStr}\n${"=".repeat(40)}\n${schedule}\n\n${lines ? lines + "\n" : ""}\n`
}

function formatTemplateBlock(date: Date) {
  const dateStr = format(date, "yyyy년 M월 d일 (EEEE)", { locale: ko })
  return (
    `${"=".repeat(40)}\n` +
    `${dateStr}\n` +
    `${"=".repeat(40)}\n` +
    `시) (시간표를 입력해주세요)\n\n` +
    `1. \n2. \n3. \n\n\n`
  )
}

export function ExportModal({ open, onOpenChange, userName }: ExportModalProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const handleExport = () => {
    if (!startDate || !endDate) return

    const days = eachDayOfInterval({
      start: parseISO(startDate),
      end: parseISO(endDate),
    })

    let content = ""
    for (const day of days) {
      const weekday = day.getDay()
      if (weekday === 0 || weekday === 6) continue

      const dateKey = format(day, "yyyy-MM-dd")
      const primaryKey = userName ? `smartnotice_${userName}_${dateKey}` : `smartnotice_${dateKey}`
      const legacyKey = `smartnotice_${dateKey}`

      const raw = localStorage.getItem(primaryKey) || localStorage.getItem(legacyKey)
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as { items?: NoticeItem[]; timetable?: string[] }
          const items = Array.isArray(parsed.items) ? parsed.items : []
          const timetable = Array.isArray(parsed.timetable) ? parsed.timetable : []
          content += formatNoticeBlock(day, timetable, items)
          continue
        } catch {
          // fall through to template
        }
      }

      content += formatTemplateBlock(day)
    }

    const bom = "\uFEFF"
    const blob = new Blob([bom + content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `알림장_${startDate}_${endDate}.txt`
    a.click()
    URL.revokeObjectURL(url)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card text-foreground rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <CalendarRange className="h-5 w-5 text-primary" />
            {"기간 설정 내보내기"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {"시작/종료 날짜를 선택하여 알림장을 일괄 내보냅니다."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            {"시작 날짜와 종료 날짜를 선택하면 해당 기간의 알림장을 하나의 파일로 묶어 저장합니다."}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">{"시작 날짜"}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-card text-foreground"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">{"종료 날짜"}</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-card text-foreground"
              />
            </div>
          </div>
          {startDate && endDate && (
            <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
              {`${startDate} ~ ${endDate} 기간의 알림장 템플릿이 생성됩니다.`}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent text-foreground">
            {"취소"}
          </Button>
          <Button
            onClick={handleExport}
            disabled={!startDate || !endDate}
            className="bg-primary text-primary-foreground"
          >
            <FileDown className="h-4 w-4 mr-1.5" />
            {"내보내기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
