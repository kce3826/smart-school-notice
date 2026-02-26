"use client"

import React, { useState, useRef } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ClipboardCopy,
  FileDown,
  Printer,
  Check,
  Star,
  Save,
  Monitor,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { NoticeItem } from "./notice-editor"
import type { FontSizeSetting, SchoolInfo } from "@/app/page"

interface NoticePreviewProps {
  items: NoticeItem[]
  setItems: React.Dispatch<React.SetStateAction<NoticeItem[]>>
  timetable: string[]
  setTimetable: (timetable: string[]) => void
  selectedDate: Date
  fontSize: FontSizeSetting
  schoolInfo: SchoolInfo
  isEditMode: boolean
  setIsEditMode: (mode: boolean) => void
  isViewingPastDate: boolean
  userName: string | null
  hasSavedNotice: boolean
  onSaved: () => void
}

const fontSizeMap: Record<FontSizeSetting, { body: string; heading: string; badge: string }> = {
  small: { body: "text-xs", heading: "text-base", badge: "text-[10px]" },
  medium: { body: "text-sm", heading: "text-xl", badge: "text-xs" },
  large: { body: "text-base", heading: "text-2xl", badge: "text-sm" },
}

function formatNoticeText(items: NoticeItem[], timetable: string[], date: Date): string {
  const dateStr = format(date, "yyyy년 M월 d일 (EEEE)", { locale: ko })
  const schedule = `시) ${timetable.join("-")}`
  const lines = items
    .filter((item) => item.text.trim() !== "")
    .map((item, i) => `${i + 1}. ${item.isImportant ? "[중요] " : ""}${item.text}`)
    .join("\n")
  return `${dateStr}\n${schedule}\n\n${lines}`
}

export function NoticePreview({ items, setItems, timetable, setTimetable, selectedDate, fontSize, schoolInfo, isEditMode, setIsEditMode, isViewingPastDate, userName, hasSavedNotice, onSaved }: NoticePreviewProps) {
  const [copied, setCopied] = useState(false)
  const [editingSubjectIndex, setEditingSubjectIndex] = useState<number | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const sizes = fontSizeMap[fontSize]
  const isLocked = hasSavedNotice && !isEditMode

  const handleSaveNotice = async () => {
    const dateKey = format(selectedDate, "yyyy-MM-dd")
    const dataToSave = {
      items,
      timetable,
      savedAt: new Date().toISOString(),
    }
    const storageKey = userName ? `smartnotice_${userName}_${dateKey}` : `smartnotice_${dateKey}`
    localStorage.setItem(storageKey, JSON.stringify(dataToSave))
    toast.success("오늘의 알림장이 안전하게 저장되었습니다")

    if (!userName) {
      toast.info("로그인하면 같은 이름으로 접속했을 때 구글 시트에서도 알림장을 확인할 수 있습니다.", { duration: 2500 })
      return
    }

    try {
      await fetch("/api/save-notice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName,
          dateKey,
          items,
          timetable,
        }),
      })
    } catch (error) {
      console.error("[NoticePreview] 구글 시트 저장 실패:", error)
      toast.error("구글 시트에 저장하는 중 오류가 발생했습니다.", { duration: 2500 })
    }
  }

  const handleChalkboard = () => {
    const dateStr = format(selectedDate, "yyyy년 M월 d일 (EEEE)", { locale: ko })
    const scheduleStr = timetable.join(" - ")
    const visibleItems = items.filter((it) => it.text.trim() !== "")
    const itemsHtml = visibleItems
      .map(
        (it, i) =>
          `<div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:18px;">
            <span style="flex-shrink:0;color:${it.isImportant ? "#fbbf24" : "rgba(255,255,255,0.5)"};font-weight:bold;font-size:40px;min-width:40px;">${i + 1}.</span>
            <span style="font-size:44px;line-height:1.45;${it.isImportant ? "color:#fbbf24;font-weight:bold;" : ""}">${it.text}</span>
          </div>`
      )
      .join("")

    const timetableInline = timetable.filter((s) => s.trim()).join("  ")

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>칠판 모드</title></head>
<body style="margin:0;padding:0;background:#1a3a32;border:15px solid #5d4037;min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,'Malgun Gothic',sans-serif;color:#fff;padding:28px 40px;box-sizing:border-box;">
  <div style="text-align:center;margin-bottom:20px;">
    <div style="font-size:40px;font-weight:bold;">${dateStr}</div>
  </div>
  <div style="font-size:34px;margin-bottom:22px;padding-bottom:18px;border-bottom:2px solid rgba(255,255,255,0.15);">
    <span style="color:#fbbf24;font-weight:bold;">시간표 : </span>${timetableInline}
  </div>
  ${itemsHtml}
</body></html>`

    const win = window.open("about:blank", "_blank", "width=1200,height=800,menubar=no,toolbar=no")
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

  const handleCopy = async () => {
    const text = formatNoticeText(items, timetable, selectedDate)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubjectEdit = (index: number, value: string) => {
    const newTimetable = [...timetable]
    newTimetable[index] = value
    setTimetable(newTimetable)
  }

  const handleDownload = () => {
    const text = formatNoticeText(items, timetable, selectedDate)
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `알림장_${format(selectedDate, "yyyy-MM-dd")}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    const printContent = previewRef.current
    if (!printContent) return
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>알림장</title>
      <style>
        body { font-family: 'Noto Sans KR', sans-serif; padding: 40px; color: #333; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .schedule { font-size: 14px; color: #666; margin-bottom: 20px; }
        ol { padding-left: 20px; }
        li { margin-bottom: 8px; font-size: 15px; line-height: 1.6; }
        .important { font-weight: bold; }
      </style></head><body>
      <h1>${format(selectedDate, "yyyy년 M월 d일 (EEEE)", { locale: ko })}</h1>
      <div class="schedule">시) ${timetable.join("-")}</div>
      <ol>
      ${items
        .filter((it) => it.text.trim() !== "")
        .map(
          (it) =>
            `<li class="${it.isImportant ? "important" : ""}">&#9733; ${it.text}</li>`
        )
        .join("")}
      </ol></body></html>
    `)
    win.document.close()
    win.print()
  }

  const updateItemText = (id: string, text: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, text } : item)))
  }

  return (
    <div className="flex h-full flex-col">
      <Card className="flex-1 border-border shadow-lg rounded-2xl overflow-hidden relative">
        {/* Save/Edit Button - positioned absolutely in top right */}
        <Button
          onClick={async () => {
            if (isLocked) {
              setIsEditMode(true)
              return
            }
            await handleSaveNotice()
            onSaved()
          }}
          size="sm"
          className="absolute top-4 right-4 z-10 no-print bg-primary text-primary-foreground shadow-md hover:shadow-lg"
        >
          <Save className="h-4 w-4 mr-1.5" />
          {isLocked ? "수정" : "저장"}
        </Button>

        {/* Chalkboard Mode Button */}
        <Button
          onClick={handleChalkboard}
          size="sm"
          variant="outline"
          className="absolute top-14 right-4 z-10 no-print bg-[#2d5a27] text-white border-[#2d5a27] shadow-md hover:bg-[#3a7033] hover:text-white"
        >
          <Monitor className="h-4 w-4 mr-1.5" />
          {"칠판 모드"}
        </Button>

        <CardContent className="p-0 h-full flex flex-col" ref={previewRef}>
          {/* Notice Header */}
          <div className="bg-primary/5 border-b border-primary/10 px-6 py-5">
            <h2 className={cn("font-bold text-foreground text-balance", sizes.heading)}>
              {format(selectedDate, "yyyy년 M월 d일 (EEEE)", { locale: ko })}
            </h2>
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              <span className={cn("font-medium text-muted-foreground", sizes.badge)}>{"시)"}</span>
              <div className="flex gap-1 flex-wrap">
                {timetable.map((subject, i) => (
                  <div key={i} className="relative group">
                    {editingSubjectIndex === i ? (
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => handleSubjectEdit(i, e.target.value)}
                        onBlur={() => setEditingSubjectIndex(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setEditingSubjectIndex(null)
                        }}
                        autoFocus
                        className={cn(
                          "w-12 px-2 py-0.5 font-medium bg-card text-foreground border border-primary rounded-lg shadow-sm text-center",
                          sizes.badge
                        )}
                      />
                    ) : (
                      <Badge
                        variant="outline"
                        onClick={() => setEditingSubjectIndex(i)}
                        className={cn(
                          "px-2 py-0.5 font-medium bg-card text-foreground border-border rounded-lg shadow-sm cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors",
                          sizes.badge
                        )}
                      >
                        {subject}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notice Items - Editable */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="flex flex-col gap-1">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={cn(
                    "group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all -mx-3",
                    "hover:bg-muted/50",
                    item.isImportant && "bg-primary/5 hover:bg-primary/8"
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shadow-sm",
                      item.isImportant
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </span>
                  {item.isImportant && (
                    <Star className="h-4 w-4 mt-1 shrink-0 text-warning fill-warning" />
                  )}
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => updateItemText(item.id, e.target.value)}
                    placeholder={`${index + 1}번 항목을 입력하세요...`}
                    disabled={isLocked}
                    className={cn(
                      "flex-1 bg-transparent border-0 outline-none leading-relaxed",
                      "placeholder:text-muted-foreground/40",
                      "focus:ring-0",
                      sizes.body,
                      item.isImportant ? "font-semibold text-foreground" : "text-foreground",
                      isLocked && "cursor-not-allowed opacity-70"
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons below the preview */}
      <div className="no-print flex items-center gap-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs bg-card text-foreground hover:bg-muted rounded-xl shadow-sm"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-4 w-4 mr-1.5 text-success" />
          ) : (
            <ClipboardCopy className="h-4 w-4 mr-1.5" />
          )}
          {copied ? "복사 완료!" : "복사하기"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs bg-card text-foreground hover:bg-muted rounded-xl shadow-sm"
          onClick={handleDownload}
        >
          <FileDown className="h-4 w-4 mr-1.5" />
          {"파일 저장"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs bg-card text-foreground hover:bg-muted rounded-xl shadow-sm"
          onClick={handlePrint}
        >
          <Printer className="h-4 w-4 mr-1.5" />
          {"인쇄"}
        </Button>
      </div>
    </div>
  )
}
