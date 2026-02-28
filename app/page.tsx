"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import {
  BookOpen,
  Settings,
  HelpCircle,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { WeeklyEventsBar } from "@/components/smart-notice/weekly-events-bar"
import { NoticePreview } from "@/components/smart-notice/notice-preview"
import { NoticeEditor } from "@/components/smart-notice/notice-editor"
import type { NoticeItem } from "@/components/smart-notice/notice-editor"
import { SettingsModal } from "@/components/smart-notice/settings-modal"
import { ExportModal } from "@/components/smart-notice/export-modal"
import { LibraryDrawer } from "@/components/smart-notice/library-drawer"
import { cn } from "@/lib/utils"

// --- 기본 설정값 ---
export type FontSizeSetting = "small" | "medium" | "large"
export type ThemeSetting = "peach" | "blue" | "pink" | "green" | "dark"
export type PanelRatioSetting = "balanced" | "preview-wide" | "editor-wide"

export interface SchoolInfo {
  schoolType: "elementary" | "middle" | "high"; schoolName: string; grade: string; classNumber: string;
}

export interface DisplaySettings {
  fontSize: FontSizeSetting; theme: ThemeSetting; panelRatio: PanelRatioSetting;
}

const DAYS_MAP: Record<number, string> = { 1: "월", 2: "화", 3: "수", 4: "목", 5: "금" }
const defaultTimetableByDay: Record<string, string[]> = {
  "월": ["국어", "수학", "사회", "영어", "과학", "창체"],
  "화": ["수학", "국어", "영어", "체육", "음악", "미술"],
  "수": ["과학", "사회", "국어", "수학", "영어", "창체"],
  "목": ["영어", "수학", "국어", "체육", "사회", "도덕"],
  "금": ["국어", "영어", "수학", "과학", "실과", "자율"],
}
const defaultItems: NoticeItem[] = [
  { id: "1", text: "", isImportant: false },
  { id: "2", text: "", isImportant: false },
  { id: "3", text: "", isImportant: false },
]

const panelRatioClasses: Record<PanelRatioSetting, { left: string; right: string }> = {
  balanced: { left: "flex-[1]", right: "flex-[1]" },
  "preview-wide": { left: "flex-[3]", right: "flex-[2]" },
  "editor-wide": { left: "flex-[2]", right: "flex-[3]" },
}

export default function SmartNoticePage() {
  const [mounted, setMounted] = useState(false)
  const [items, setItems] = useState<NoticeItem[]>(defaultItems)
  const [timetableByDay, setTimetableByDay] = useState(defaultTimetableByDay)
  const [monthlyEvents, setMonthlyEvents] = useState({})
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginDraft, setLoginDraft] = useState("")
  const [hasSavedNotice, setHasSavedNotice] = useState(false)
  const [viewingDate, setViewingDate] = useState<Date | undefined>(undefined)
  const [isEditMode, setIsEditMode] = useState(true)
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>({
    schoolType: "elementary", schoolName: "초등학교", grade: "1", classNumber: "1",
  })
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    fontSize: "medium", theme: "peach", panelRatio: "editor-wide",
  })

  useEffect(() => { setMounted(true) }, [])

  const handleInsertPhrase = useCallback((phrase: string) => {
    setItems((prev) => {
      const emptyIdx = prev.findIndex(item => item.text.trim() === "")
      if (emptyIdx !== -1) return prev.map((item, i) => i === emptyIdx ? { ...item, text: phrase } : item)
      return [...prev, { id: Math.random().toString(36).substr(2, 9), text: phrase, isImportant: false }]
    })
  }, [])

  if (!mounted) return null

  const displayDate = viewingDate || new Date()
  const dayKey = DAYS_MAP[displayDate.getDay()] || "월"
  const todayTimetable = timetableByDay[dayKey] || []

  return (
    <TooltipProvider>
      <div className={cn("flex h-screen flex-col overflow-hidden bg-background", `theme-${displaySettings.theme}`)}>
        <header className="flex items-center justify-between border-b bg-card px-5 py-2.5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><BookOpen size={20} /></div>
            <div>
              <h1 className="text-base font-bold">스마트 알림장</h1>
              <p className="text-xs text-muted-foreground">{format(displayDate, "yyyy년 M월 d일 (EEEE)", { locale: ko })}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Button variant="outline" size="sm" onClick={() => setIsLoggedIn(false)}><User className="h-4 w-4 mr-1" /> {userName}</Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setLoginOpen(true)}>로그인</Button>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSettingsOpen(true)}>
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>설정</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full bg-yellow-400" onClick={() => setHelpOpen(true)}>
                  <HelpCircle className="h-4 w-4 text-black" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>도움말</TooltipContent>
            </Tooltip>
          </div>
        </header>

        <WeeklyEventsBar monthlyEvents={monthlyEvents} collapsed={false} onToggleCollapse={() => {}} today={displayDate} />

        <main className="flex-1 flex gap-4 p-4 overflow-hidden">
          <div className={cn("min-w-0", panelRatioClasses[displaySettings.panelRatio].left)}>
            <NoticePreview
              items={items} setItems={setItems}
              timetable={todayTimetable}
              setTimetable={(newT) => setTimetableByDay(prev => ({ ...prev, [dayKey]: newT }))}
              selectedDate={displayDate} fontSize={displaySettings.fontSize} schoolInfo={schoolInfo}
              isEditMode={isEditMode} setIsEditMode={setIsEditMode}
              isViewingPastDate={!!viewingDate} // 👈 이 부분이 에러 해결 포인트입니다!
              userName={userName} hasSavedNotice={hasSavedNotice}
              onSaved={() => { setHasSavedNotice(true); setIsEditMode(false); }}
            />
          </div>
          <div className={cn("min-w-0", panelRatioClasses[displaySettings.panelRatio].right)}>
            <NoticeEditor
              items={items} setItems={setItems} onInsertPhrase={handleInsertPhrase}
              onOpenLibrary={() => setLibraryOpen(true)} favorites={[]}
              onToggleFavorite={() => {}} isLocked={hasSavedNotice && !isEditMode}
            />
          </div>
        </main>

        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} timetableByDay={timetableByDay} setTimetableByDay={setTimetableByDay} monthlyEvents={monthlyEvents} setMonthlyEvents={setMonthlyEvents} schoolInfo={schoolInfo} setSchoolInfo={setSchoolInfo} displaySettings={displaySettings} setDisplaySettings={setDisplaySettings} />
        <ExportModal open={exportOpen} onOpenChange={setExportOpen} userName={userName} />
        <LibraryDrawer open={libraryOpen} onOpenChange={setLibraryOpen} onInsertPhrase={handleInsertPhrase} favorites={[]} setFavorites={() => {}} onToggleFavorite={() => {}} />

        <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>로그인</DialogTitle></DialogHeader>
            <Input value={loginDraft} onChange={(e) => setLoginDraft(e.target.value)} placeholder="닉네임 입력" />
            <Button onClick={() => { setUserName(loginDraft); setIsLoggedIn(true); setLoginOpen(false); }}>입장</Button>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}