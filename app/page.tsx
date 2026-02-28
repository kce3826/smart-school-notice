"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import {
  BookOpen,
  Settings,
  FileArchive,
  HelpCircle,
  Calendar as CalendarIcon,
  LogIn,
  User,
  LogOut,
  Home as HomeIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WeeklyEventsBar } from "@/components/smart-notice/weekly-events-bar"
import { NoticePreview } from "@/components/smart-notice/notice-preview"
import { NoticeEditor } from "@/components/smart-notice/notice-editor"
import type { NoticeItem } from "@/components/smart-notice/notice-editor"
import { SettingsModal } from "@/components/smart-notice/settings-modal"
import { ExportModal } from "@/components/smart-notice/export-modal"
import { LibraryDrawer } from "@/components/smart-notice/library-drawer"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// --- 타입 및 설정값 (선생님 원본 유지) ---
export type FontSizeSetting = "small" | "medium" | "large"
export type ThemeSetting = "peach" | "blue" | "pink" | "green" | "dark"
export type PanelRatioSetting = "balanced" | "preview-wide" | "editor-wide"

export interface SchoolInfo {
  schoolType: "elementary" | "middle" | "high"
  schoolName: string
  grade: string
  classNumber: string
}

export interface DisplaySettings {
  fontSize: FontSizeSetting
  theme: ThemeSetting
  panelRatio: PanelRatioSetting
}

const DAYS_MAP: Record<number, string> = { 1: "월", 2: "화", 3: "수", 4: "목", 5: "금" }
const defaultTimetableByDay: Record<string, string[]> = {
  "월": ["국", "수", "사", "영", "과", "창"],
  "화": ["수", "국", "영", "체", "음", "미"],
  "수": ["과", "사", "국", "수", "영", "창"],
  "목": ["영", "수", "국", "체", "사", "도"],
  "금": ["국", "영", "수", "과", "실", "자"],
}
const defaultMonthlyEvents: Record<string, string[]> = {
  "2026-02-09": ["전교 조회"], "2026-02-10": ["수학 경시대회"], "2026-02-11": ["현장체험학습"]
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
  const [monthlyEvents, setMonthlyEvents] = useState(defaultMonthlyEvents)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [eventsBarCollapsed, setEventsBarCollapsed] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginDraft, setLoginDraft] = useState("")
  const [hasSavedNotice, setHasSavedNotice] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [viewingDate, setViewingDate] = useState<Date | undefined>(undefined)
  const [favorites, setFavorites] = useState<string[]>([])
  const [isEditMode, setIsEditMode] = useState(true)
  const [displayDate, setDisplayDate] = useState<Date | null>(null)
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>({
    schoolType: "elementary", schoolName: "서울초등학교", grade: "3", classNumber: "2",
  })
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    fontSize: "medium", theme: "peach", panelRatio: "editor-wide",
  })

  // --- 초기 로딩 및 로직 (선생님 원본 보존) ---
  useEffect(() => { setMounted(true) }, [])

  const getNoticeStorageKey = useCallback((name: string | null, dateKey: string) => 
    name ? `smartnotice_${name}_${dateKey}` : `smartnotice_${dateKey}`
  , [])

  const getUserSettingsKey = useCallback((name: string) => `smartnotice_${name}_settings`, [])

  const loadUserSettings = useCallback((name: string) => {
    const raw = localStorage.getItem(getUserSettingsKey(name))
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      if (parsed?.schoolInfo) setSchoolInfo(parsed.schoolInfo)
      if (parsed?.timetableByDay) setTimetableByDay(parsed.timetableByDay)
      if (parsed?.monthlyEvents) setMonthlyEvents(parsed.monthlyEvents)
      if (parsed?.favorites) setFavorites(parsed.favorites)
      if (parsed?.displaySettings) setDisplaySettings(parsed.displaySettings)
    } catch (e) { console.error(e) }
  }, [getUserSettingsKey])

  const loadNoticeForDate = useCallback(async (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd")
    const primaryKey = getNoticeStorageKey(userName, dateKey)
    const savedData = localStorage.getItem(primaryKey)
    if (savedData) {
      const parsed = JSON.parse(savedData)
      setItems(parsed.items || defaultItems)
      setHasSavedNotice(true); setIsEditMode(false)
    } else {
      setItems(defaultItems); setHasSavedNotice(false); setIsEditMode(true)
    }
  }, [getNoticeStorageKey, userName])

  useEffect(() => {
    const d = viewingDate || new Date()
    setDisplayDate(d)
    void loadNoticeForDate(d)
  }, [viewingDate, loadNoticeForDate])

  // 자동 저장 타이머 로직
  const saveSettingsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!userName) return
    if (saveSettingsTimer.current) clearTimeout(saveSettingsTimer.current)
    saveSettingsTimer.current = setTimeout(() => {
      localStorage.setItem(getUserSettingsKey(userName), JSON.stringify({
        schoolInfo, timetableByDay, monthlyEvents, favorites, displaySettings
      }))
    }, 800)
  }, [userName, schoolInfo, timetableByDay, monthlyEvents, favorites, displaySettings, getUserSettingsKey])

  const handleInsertPhrase = useCallback((phrase: string) => {
    setItems((prev) => {
      const emptyIdx = prev.findIndex(item => item.text.trim() === "")
      if (emptyIdx !== -1) return prev.map((item, i) => i === emptyIdx ? { ...item, text: phrase } : item)
      return [...prev, { id: Math.random().toString(36).substr(2, 9), text: phrase, isImportant: false }]
    })
  }, [])

  if (!mounted) return null

  return (
    <TooltipProvider>
      <div className={cn("flex h-screen flex-col overflow-hidden bg-background", `theme-${displaySettings.theme}`)}>
        <header className="flex items-center justify-between border-b bg-card px-5 py-2.5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><BookOpen size={20} /></div>
            <div>
              <h1 className="text-base font-bold">스마트 알림장</h1>
              <p className="text-xs text-muted-foreground">{displayDate ? format(displayDate, "yyyy년 M월 d일 (EEEE)", { locale: ko }) : ""}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Button variant="outline" size="sm" onClick={() => { setIsLoggedIn(false); setUserName(null); }}><User className="h-4 w-4 mr-1" /> {userName}</Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setLoginOpen(true)}>로그인</Button>
            )}

            {/* 에러 방지 처리된 Tooltip들 */}
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
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>도움말</TooltipContent>
            </Tooltip>
          </div>
        </header>

        {displayDate && (
          <WeeklyEventsBar 
            monthlyEvents={monthlyEvents} 
            collapsed={eventsBarCollapsed} 
            onToggleCollapse={() => setEventsBarCollapsed(!eventsBarCollapsed)} 
            today={displayDate} 
          />
        )}

        <main className="flex-1 flex gap-4 p-4 overflow-hidden">
          <div className={cn("min-w-0", panelRatioClasses[displaySettings.panelRatio].left)}>
            <NoticePreview
              items={items} setItems={setItems}
              timetable={timetableByDay[displayDate ? (DAYS_MAP[displayDate.getDay()] || "월") : "월"]}
              setTimetable={() => {}} 
              selectedDate={displayDate || new Date()} fontSize={displaySettings.fontSize} schoolInfo={schoolInfo}
              isEditMode={isEditMode} setIsEditMode={setIsEditMode} userName={userName} hasSavedNotice={hasSavedNotice}
              onSaved={() => { setHasSavedNotice(true); setIsEditMode(false); }}
            />
          </div>
          <div className={cn("min-w-0", panelRatioClasses[displaySettings.panelRatio].right)}>
            {/* 자동 멘트 기능이 있는 NoticeEditor */}
            <NoticeEditor
              items={items} setItems={setItems} onInsertPhrase={handleInsertPhrase}
              onOpenLibrary={() => setLibraryOpen(true)} favorites={favorites}
              onToggleFavorite={(p) => setFavorites(prev => prev.includes(p) ? prev.filter(f => f !== p) : [...prev, p])} 
              isLocked={hasSavedNotice && !isEditMode}
            />
          </div>
        </main>

        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} timetableByDay={timetableByDay} setTimetableByDay={setTimetableByDay} monthlyEvents={monthlyEvents} setMonthlyEvents={setMonthlyEvents} schoolInfo={schoolInfo} setSchoolInfo={setSchoolInfo} displaySettings={displaySettings} setDisplaySettings={setDisplaySettings} />
        <ExportModal open={exportOpen} onOpenChange={setExportOpen} userName={userName} />
        <LibraryDrawer open={libraryOpen} onOpenChange={setLibraryOpen} onInsertPhrase={handleInsertPhrase} favorites={favorites} setFavorites={setFavorites} onToggleFavorite={() => {}} />

        <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>로그인</DialogTitle></DialogHeader>
            <Input value={loginDraft} onChange={(e) => setLoginDraft(e.target.value)} placeholder="닉네임 입력" />
            <Button onClick={() => { setUserName(loginDraft); setIsLoggedIn(true); setLoginOpen(false); loadUserSettings(loginDraft); }}>입장</Button>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
