"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import {
  BookOpen,
  Settings,
  FileArchive,
  HelpCircle,
  Library,
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
  "2026-02-09": ["전교 조회"],
  "2026-02-10": ["수학 경시대회"],
  "2026-02-11": ["현장체험학습"],
  "2026-02-12": ["학부모 상담주간"],
  "2026-02-13": ["방과후 수업"],
  "2026-02-16": ["개교기념일"],
  "2026-02-18": ["중간고사"],
  "2026-02-20": ["체육대회"],
  "2026-02-25": ["과학의 날"],
  "2026-03-02": ["입학식"],
  "2026-03-05": ["학급 임원 선거"],
}

const defaultItems: NoticeItem[] = [
  { id: crypto.randomUUID(), text: "", isImportant: false },
  { id: crypto.randomUUID(), text: "", isImportant: false },
  { id: crypto.randomUUID(), text: "", isImportant: false },
]

const panelRatioClasses: Record<PanelRatioSetting, { left: string; right: string }> = {
  balanced: { left: "flex-[1]", right: "flex-[1]" },
  "preview-wide": { left: "flex-[3]", right: "flex-[2]" },
  "editor-wide": { left: "flex-[2]", right: "flex-[3]" },
}

export default function SmartNoticePage() {
  // Component state declarations (v2)
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
    schoolType: "elementary",
    schoolName: "서울초등학교",
    grade: "3",
    classNumber: "2",
  })

  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    fontSize: "medium",
    theme: "peach",
    panelRatio: "editor-wide",
  })

  const themeClass = `theme-${displaySettings.theme}`

  const getNoticeStorageKey = useCallback((name: string | null, dateKey: string) => {
    return name ? `smartnotice_${name}_${dateKey}` : `smartnotice_${dateKey}`
  }, [])

  const getUserSettingsKey = useCallback((name: string) => {
    return `smartnotice_${name}_settings`
  }, [])

  const loadUserSettings = useCallback(
    (name: string) => {
      const raw = localStorage.getItem(getUserSettingsKey(name))
      if (!raw) return
      try {
        const parsed = JSON.parse(raw)
        if (parsed?.schoolInfo) setSchoolInfo(parsed.schoolInfo)
        if (parsed?.timetableByDay) setTimetableByDay(parsed.timetableByDay)
        if (parsed?.monthlyEvents) setMonthlyEvents(parsed.monthlyEvents)
        if (parsed?.favorites) setFavorites(parsed.favorites)
        if (parsed?.displaySettings) setDisplaySettings(parsed.displaySettings)
      } catch (e) {
        console.error("[login] 설정 불러오기 실패:", e)
      }
    },
    [getUserSettingsKey]
  )

  const loadUserSettingsFromSheet = useCallback(async (name: string) => {
    try {
      const res = await fetch("/api/load-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: name }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) return

      const s = data.settings
      if (s?.schoolInfo) setSchoolInfo(s.schoolInfo)
      if (s?.timetableByDay) setTimetableByDay(s.timetableByDay)
      if (s?.monthlyEvents) setMonthlyEvents(s.monthlyEvents)
      if (s?.favorites) setFavorites(s.favorites)
      if (s?.displaySettings) setDisplaySettings(s.displaySettings)
    } catch (e) {
      console.error("[login] 시트 설정 불러오기 실패:", e)
    }
  }, [])

  const loadNoticeForDate = useCallback(
    async (date: Date, opts?: { showToast?: boolean }) => {
      const dateKey = format(date, "yyyy-MM-dd")
      const primaryKey = getNoticeStorageKey(userName, dateKey)
      let savedData = localStorage.getItem(primaryKey)

      // 이전(닉네임 미적용) 저장 방식과의 호환: 로그인 사용자의 데이터가 없으면 기존 키도 확인
      if (!savedData && userName) {
        const legacy = localStorage.getItem(`smartnotice_${dateKey}`)
        if (legacy) savedData = legacy
      }

      if (savedData) {
        const parsed = JSON.parse(savedData)
        setItems(parsed.items || defaultItems)
        if (Array.isArray(parsed.timetable)) {
          const dow = date.getDay()
          const dk = DAYS_MAP[dow] || "월"
          setTimetableByDay((prev) => ({ ...prev, [dk]: parsed.timetable }))
        }
        setHasSavedNotice(true)
        setIsEditMode(false) // 저장된 데이터가 있으면 기본은 잠금
        if (opts?.showToast) {
          toast.info(`${format(date, "M월 d일")} 알림장을 불러왔습니다`, { duration: 2000 })
        }
        return
      } else {
        // 로컬에 없고 로그인 상태면, 구글 시트에서 불러오기 시도(다른 기기 로그인 지원)
        if (userName) {
          try {
            const res = await fetch("/api/load-notice", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userName, dateKey }),
            })
            const data = await res.json()
            if (res.ok && data?.ok) {
              setItems(data.items || defaultItems)
              if (Array.isArray(data.timetable)) {
                const dow = date.getDay()
                const dk = DAYS_MAP[dow] || "월"
                setTimetableByDay((prev) => ({ ...prev, [dk]: data.timetable }))
              }
              // 로컬 캐시(다음부터 빠르게)
              localStorage.setItem(
                getNoticeStorageKey(userName, dateKey),
                JSON.stringify({ items: data.items || [], timetable: data.timetable || [], savedAt: data.savedAt || null })
              )
              setHasSavedNotice(true)
              setIsEditMode(false)
              if (opts?.showToast) {
                toast.info(`${format(date, "M월 d일")} 알림장을 불러왔습니다`, { duration: 2000 })
              }
              return
            }
          } catch (e) {
            console.error("[loadNoticeForDate] 시트 불러오기 실패:", e)
          }
        }

        setItems(defaultItems)
        setHasSavedNotice(false)
        setIsEditMode(true) // 저장된 데이터가 없으면 바로 편집 가능
        if (opts?.showToast) {
          toast.info(`${format(date, "M월 d일")}의 저장된 알림장이 없습니다`, { duration: 2000 })
        }
      }
    },
    [getNoticeStorageKey, userName]
  )

  // Initialize display date on mount to prevent hydration mismatch
  useEffect(() => {
    const d = viewingDate || new Date()
    setDisplayDate(d)
    void loadNoticeForDate(d)
  }, [viewingDate, loadNoticeForDate])

  // Calculate day values from displayDate
  const dayOfWeek = displayDate ? displayDate.getDay() : 0
  const dayKey = displayDate ? (DAYS_MAP[dayOfWeek] || "월") : "월"
  const todayTimetable = timetableByDay[dayKey] || ["국", "수", "사", "영", "과", "창"]

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.className = themeClass
  }, [themeClass])

  // Auto login if userName exists
  useEffect(() => {
    const savedUserName = localStorage.getItem("smartnotice_userName")
    if (savedUserName) {
      setUserName(savedUserName)
      setIsLoggedIn(true)
    }
  }, [])

  // Load user-scoped settings on login
  useEffect(() => {
    if (!userName) return
    loadUserSettings(userName)
    void loadUserSettingsFromSheet(userName)
  }, [userName, loadUserSettings])

  // Persist user-scoped settings whenever they change
  const saveSettingsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!userName) return
    try {
      localStorage.setItem(
        getUserSettingsKey(userName),
        JSON.stringify({
          schoolInfo,
          timetableByDay,
          monthlyEvents,
          favorites,
          displaySettings,
        })
      )
    } catch (e) {
      console.error("[settings] 저장 실패:", e)
    }

    if (saveSettingsTimer.current) clearTimeout(saveSettingsTimer.current)
    saveSettingsTimer.current = setTimeout(() => {
      fetch("/api/save-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName,
          settings: { schoolInfo, timetableByDay, monthlyEvents, favorites, displaySettings },
        }),
      }).catch(() => {})
    }, 800)
  }, [userName, schoolInfo, timetableByDay, monthlyEvents, favorites, displaySettings, getUserSettingsKey])

  const handleToggleFavorite = useCallback((phrase: string) => {
    const isRemoving = favorites.includes(phrase)
    
    if (isRemoving) {
      setFavorites((prev) => prev.filter((p) => p !== phrase))
      toast.success("즐겨찾기에서 제거되었습니다", { duration: 2000 })
    } else {
      setFavorites((prev) => [...prev, phrase])
      toast.success("즐겨찾기에 추가되었습니다", { duration: 2000 })
    }
  }, [favorites])

  const handleInsertPhrase = useCallback(
    (phrase: string) => {
      setItems((prev) => {
        const emptyIndex = prev.findIndex((item) => item.text.trim() === "")
        if (emptyIndex !== -1) {
          return prev.map((item, i) =>
            i === emptyIndex ? { ...item, text: phrase } : item
          )
        }
        return [
          ...prev,
          { id: crypto.randomUUID(), text: phrase, isImportant: false },
        ]
      })
    },
    []
  )

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setViewingDate(date)
      setSelectedDate(date)
      void loadNoticeForDate(date, { showToast: true })
    }
  }

  const handleBackToToday = () => {
    setViewingDate(undefined)
    setSelectedDate(undefined)
    const today = new Date()
    void loadNoticeForDate(today, { showToast: true })
    toast.info("오늘 날짜로 돌아왔습니다", { duration: 2000 })
  }

  const submitLogin = () => {
    const trimmed = loginDraft.trim()
    if (!trimmed) {
      toast.info("공백이 아닌 이름 또는 닉네임을 입력해주세요.", { duration: 2000 })
      return
    }
    setUserName(trimmed)
    setIsLoggedIn(true)
    localStorage.setItem("smartnotice_userName", trimmed)
    loadUserSettings(trimmed)
    void loadUserSettingsFromSheet(trimmed)
    if (displayDate) {
      void loadNoticeForDate(displayDate)
    }
    setLoginOpen(false)
    toast.success(`"${trimmed}" 이름으로 입장했습니다.`, { duration: 2000 })
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserName(null)
    localStorage.removeItem("smartnotice_userName")
    setFavorites([])
    setTimetableByDay(defaultTimetableByDay)
    setMonthlyEvents(defaultMonthlyEvents)
    setSchoolInfo({
      schoolType: "elementary",
      schoolName: "서울초등학교",
      grade: "3",
      classNumber: "2",
    })
    setDisplaySettings({
      fontSize: "medium",
      theme: "peach",
      panelRatio: "editor-wide",
    })
    toast.info("로그아웃되었습니다", { duration: 2000 })
  }

  // Help overlay
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && helpOpen) setHelpOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [helpOpen])

  const schoolLabel =
    schoolInfo.schoolType === "elementary"
      ? "초"
      : schoolInfo.schoolType === "middle"
        ? "중"
        : "고"

  return (
    <TooltipProvider>
      <div className={cn("flex h-screen flex-col overflow-hidden bg-background transition-colors duration-300", themeClass)} style={{ marginRight: libraryOpen ? '400px' : '0', transition: 'margin-right 500ms ease-in-out' }}>
        {/* Top Header Bar */}
        <header className="no-print flex items-center justify-between border-b bg-card px-5 py-2.5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-foreground leading-tight">
                  {"스마트 알림장"}
                </h1>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {`${schoolInfo.schoolName} ${schoolInfo.grade}학년 ${schoolInfo.classNumber}반`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {displayDate ? format(displayDate, "yyyy년 M월 d일 (EEEE)", { locale: ko }) : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Back to Today Button (shown only when viewing past date) */}
            {viewingDate && (
              <Button
                variant="default"
                size="sm"
                className="text-xs bg-primary text-primary-foreground shadow-sm"
                onClick={handleBackToToday}
              >
                <HomeIcon className="h-4 w-4 mr-1.5" />
                {"오늘로 돌아가기"}
              </Button>
            )}

            {/* Google Login / Profile */}
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent text-foreground shadow-sm gap-1.5"
                  >
                    <User className="h-4 w-4" />
                    {userName || "사용자"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {"로그아웃"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-xs bg-transparent text-foreground shadow-sm"
                onClick={() => {
                  setLoginDraft("")
                  setLoginOpen(true)
                }}
              >
                <LogIn className="h-4 w-4 mr-1.5" />
                {"로그인"}
              </Button>
            )}

            {/* Calendar Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs bg-transparent text-foreground shadow-sm"
                >
                  <CalendarIcon className="h-4 w-4 mr-1.5" />
                  {"지난 알림장 보기"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  locale={ko}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Export Button */}
            <Button
              variant="outline"
              size="sm"
              className="text-xs bg-transparent text-foreground shadow-sm"
              onClick={() => setExportOpen(true)}
            >
              <FileArchive className="h-4 w-4 mr-1.5" />
              {"일괄 내보내기"}
            </Button>

            {/* Settings Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-transparent text-foreground shadow-sm"
                  onClick={() => setSettingsOpen(true)}
                  aria-label="설정"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{"설정"}</p></TooltipContent>
            </Tooltip>

            {/* Help Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setHelpOpen(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-warning text-warning-foreground shadow-md transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="사용법"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent><p>{"사용법 안내"}</p></TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Login Dialog */}
        <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{"로그인"}</DialogTitle>
              <DialogDescription>
                {"성함 또는 닉네임만 입력하면 입장할 수 있어요."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="login-name">{"성함/닉네임"}</Label>
              <Input
                id="login-name"
                value={loginDraft}
                onChange={(e) => setLoginDraft(e.target.value)}
                placeholder="예) 김선생님, 3-2담임"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    submitLogin()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {"로그인 기능 베타버전으로, 간단한 닉네임만 넣어도 데이터가 저장되도록 구현하였습니다. 같은 닉네임으로 재로그인하면 저장된 데이터를 불러옵니다."}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLoginOpen(false)}>
                {"취소"}
              </Button>
              <Button onClick={submitLogin}>
                {"입장"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Weekly Events Bar (Collapsible) */}
        {displayDate && (
          <WeeklyEventsBar
            monthlyEvents={monthlyEvents}
            collapsed={eventsBarCollapsed}
            onToggleCollapse={() => setEventsBarCollapsed((v) => !v)}
            today={displayDate}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Main panels */}
          <div className="flex-1 flex gap-4 p-4 overflow-hidden">
            {/* Left: Final Preview */}
            <div className={cn("min-w-0", panelRatioClasses[displaySettings.panelRatio].left)}>
              <NoticePreview
                items={items}
                setItems={setItems}
                timetable={todayTimetable}
                setTimetable={(newTimetable) => {
                  setTimetableByDay((prev) => ({ ...prev, [dayKey]: newTimetable }))
                }}
                selectedDate={displayDate || new Date()}
                fontSize={displaySettings.fontSize}
                schoolInfo={schoolInfo}
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
                isViewingPastDate={!!viewingDate}
                userName={userName}
                hasSavedNotice={hasSavedNotice}
                onSaved={() => {
                  setHasSavedNotice(true)
                  setIsEditMode(false)
                }}
              />
            </div>

            {/* Right: Editor Panel */}
            <div className={cn("min-w-0", panelRatioClasses[displaySettings.panelRatio].right)}>
              <NoticeEditor
                items={items}
                setItems={setItems}
                onInsertPhrase={handleInsertPhrase}
                onOpenLibrary={() => setLibraryOpen(true)}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                isLocked={hasSavedNotice && !isEditMode}
              />
            </div>
          </div>
        </main>

        {/* Settings Modal */}
        <SettingsModal
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          timetableByDay={timetableByDay}
          setTimetableByDay={setTimetableByDay}
          monthlyEvents={monthlyEvents}
          setMonthlyEvents={setMonthlyEvents}
          schoolInfo={schoolInfo}
          setSchoolInfo={setSchoolInfo}
          displaySettings={displaySettings}
          setDisplaySettings={setDisplaySettings}
        />

        {/* Export Modal */}
        <ExportModal open={exportOpen} onOpenChange={setExportOpen} userName={userName} />

        {/* Library Drawer */}
        <LibraryDrawer
          open={libraryOpen}
          onOpenChange={setLibraryOpen}
          onInsertPhrase={handleInsertPhrase}
          favorites={favorites}
          setFavorites={setFavorites}
          onToggleFavorite={handleToggleFavorite}
        />

        {/* Help Overlay */}
        {helpOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
            onClick={() => setHelpOpen(false)}
            onKeyDown={(e) => { if (e.key === "Escape") setHelpOpen(false) }}
            role="dialog"
            aria-modal="true"
            aria-label="사용법 안내"
          >
            <div
              className="mx-4 max-w-lg w-full rounded-2xl bg-card p-6 shadow-2xl animate-slide-in"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={() => {}}
              role="document"
            >
              <h2 className="text-lg font-bold text-foreground mb-4">{"도움말"}</h2>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground leading-relaxed">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-foreground whitespace-nowrap">{"반갑습니다, 선생님! 학급 알림장 작성을 도와드립니다."}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="font-semibold text-foreground mb-1">{"1. [항목 편집]"}</p>
                  <p>{"내용을 쓰고 [별표]를 눌러 자주 쓰는 문구로 등록할 수 있습니다."}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="font-semibold text-foreground mb-1">{"2. [말투 변환]"}</p>
                  <p>{"버튼으로 원하는 어미를 선택할 수 있습니다."}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="font-semibold text-foreground mb-1">{"3. [다국어 번역]"}</p>
                  <p>{"다문화 가정에도 소식을 쉽게 전달할 수 있습니다."}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="font-semibold text-foreground mb-1">{"4. [로그인]과 [저장]"}</p>
                  <p>{"작성한 알림장을 날짜별로 보관할 수 있습니다."}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="font-semibold text-foreground mb-1">{"5. [설정]"}</p>
                  <p>{"[시간표]를 입력하여 알림장에 자동 입력할 수 있습니다."}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="font-semibold text-foreground mb-1">{"6. [자동 멘트 입력]"}</p>
                  <p>{"생활 지도 멘트를 쉽게 넣을 수 있습니다."}</p>
                </div>
              </div>
              <Button className="mt-5 w-full bg-primary text-primary-foreground shadow-md" onClick={() => setHelpOpen(false)}>
                {"확인"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
