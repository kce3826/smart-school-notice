"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Calendar, Clock, School, Monitor, Type, Columns } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SchoolInfo, DisplaySettings, FontSizeSetting, ThemeSetting, PanelRatioSetting } from "@/app/page"

const DAYS = ["월", "화", "수", "목", "금"]

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  timetableByDay: Record<string, string[]>
  setTimetableByDay: (data: Record<string, string[]>) => void
  monthlyEvents: Record<string, string[]>
  setMonthlyEvents: (data: Record<string, string[]>) => void
  schoolInfo: SchoolInfo
  setSchoolInfo: (info: SchoolInfo) => void
  displaySettings: DisplaySettings
  setDisplaySettings: (settings: DisplaySettings) => void
}

export function SettingsModal({
  open,
  onOpenChange,
  timetableByDay,
  setTimetableByDay,
  monthlyEvents,
  setMonthlyEvents,
  schoolInfo,
  setSchoolInfo,
  displaySettings,
  setDisplaySettings,
}: SettingsModalProps) {
  const [localTimetable, setLocalTimetable] = useState<Record<string, string[]>>({ ...timetableByDay })
  const [localEvents, setLocalEvents] = useState<Record<string, string[]>>({ ...monthlyEvents })
  const [localSchool, setLocalSchool] = useState<SchoolInfo>({ ...schoolInfo })
  const [localDisplay, setLocalDisplay] = useState<DisplaySettings>({ ...displaySettings })
  const [newEventDate, setNewEventDate] = useState("")
  const [newEventName, setNewEventName] = useState("")
  const [newEventTime, setNewEventTime] = useState("")

  useEffect(() => {
    if (open) {
      setLocalTimetable({ ...timetableByDay })
      setLocalEvents({ ...monthlyEvents })
      setLocalSchool({ ...schoolInfo })
      setLocalDisplay({ ...displaySettings })
    }
  }, [open, timetableByDay, monthlyEvents, schoolInfo, displaySettings])

  const handleSubjectChange = (day: string, index: number, value: string) => {
    setLocalTimetable((prev) => {
      const updated = { ...prev }
      updated[day] = [...(updated[day] || [])]
      updated[day][index] = value
      return updated
    })
  }

  const addSubject = (day: string) => {
    setLocalTimetable((prev) => {
      const updated = { ...prev }
      updated[day] = [...(updated[day] || []), ""]
      return updated
    })
  }

  const removeSubject = (day: string, index: number) => {
    setLocalTimetable((prev) => {
      const updated = { ...prev }
      updated[day] = (updated[day] || []).filter((_, i) => i !== index)
      return updated
    })
  }

  const addEvent = () => {
    if (!newEventDate || !newEventName.trim()) return
    setLocalEvents((prev) => {
      const updated = { ...prev }
      const eventLabel = newEventTime ? `[${newEventTime}] ${newEventName.trim()}` : newEventName.trim()
      if (!updated[newEventDate]) {
        updated[newEventDate] = []
      }
      updated[newEventDate] = [...updated[newEventDate], eventLabel]
      return updated
    })
    setNewEventName("")
    setNewEventTime("")
  }

  const removeEvent = (dateKey: string, index: number) => {
    setLocalEvents((prev) => {
      const updated = { ...prev }
      updated[dateKey] = (updated[dateKey] || []).filter((_, i) => i !== index)
      if (updated[dateKey].length === 0) {
        delete updated[dateKey]
      }
      return updated
    })
  }

  const handleSave = () => {
    setTimetableByDay(localTimetable)
    setMonthlyEvents(localEvents)
    setSchoolInfo(localSchool)
    setDisplaySettings(localDisplay)
    
    // Apply theme immediately by updating the root class
    document.documentElement.className = `theme-${localDisplay.theme}`
    
    onOpenChange(false)
  }

  const handleCancel = () => {
    // Restore original theme on cancel
    document.documentElement.className = `theme-${displaySettings.theme}`
    onOpenChange(false)
  }

  const themeOptions: { value: ThemeSetting; label: string; color: string }[] = [
    { value: "peach", label: "피치", color: "bg-orange-300" },
    { value: "blue", label: "블루", color: "bg-blue-300" },
    { value: "pink", label: "핑크", color: "bg-pink-300" },
    { value: "green", label: "그린", color: "bg-green-300" },
    { value: "dark", label: "다크", color: "bg-gray-700" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] bg-card text-foreground rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">{"설정"}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {"학교 정보, 시간표, 행사, 화면 설정을 관리합니다."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="school" className="mt-2">
          <TabsList className="grid grid-cols-4 bg-muted rounded-xl h-auto p-0.5">
            <TabsTrigger value="school" className="text-xs py-2 rounded-lg data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <School className="h-3.5 w-3.5 mr-1" />
              {"학교"}
            </TabsTrigger>
            <TabsTrigger value="timetable" className="text-xs py-2 rounded-lg data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <Clock className="h-3.5 w-3.5 mr-1" />
              {"시간표"}
            </TabsTrigger>
            <TabsTrigger value="events" className="text-xs py-2 rounded-lg data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              {"행사"}
            </TabsTrigger>
            <TabsTrigger value="display" className="text-xs py-2 rounded-lg data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <Monitor className="h-3.5 w-3.5 mr-1" />
              {"화면"}
            </TabsTrigger>
          </TabsList>

          {/* School Info Tab */}
          <TabsContent value="school" className="mt-4">
            <div className="flex flex-col gap-4">
              <div>
                <Label className="text-xs font-semibold text-foreground mb-2 block">{"학교 구분"}</Label>
                <RadioGroup
                  value={localSchool.schoolType}
                  onValueChange={(v) => setLocalSchool({ ...localSchool, schoolType: v as SchoolInfo["schoolType"] })}
                  className="flex gap-4"
                >
                  {([
                    { value: "elementary", label: "초등학교" },
                    { value: "middle", label: "중학교" },
                    { value: "high", label: "고등학교" },
                  ] as const).map((opt) => (
                    <div key={opt.value} className="flex items-center gap-2">
                      <RadioGroupItem value={opt.value} id={`school-${opt.value}`} />
                      <Label htmlFor={`school-${opt.value}`} className="text-sm text-foreground cursor-pointer">
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label className="text-xs font-semibold text-foreground mb-1.5 block">{"학교명"}</Label>
                <Input
                  value={localSchool.schoolName}
                  onChange={(e) => setLocalSchool({ ...localSchool, schoolName: e.target.value })}
                  placeholder="학교명을 입력하세요"
                  className="bg-card text-foreground rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-foreground mb-1.5 block">{"학년"}</Label>
                  <Input
                    value={localSchool.grade}
                    onChange={(e) => setLocalSchool({ ...localSchool, grade: e.target.value })}
                    placeholder="학년"
                    className="bg-card text-foreground rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-foreground mb-1.5 block">{"반"}</Label>
                  <Input
                    value={localSchool.classNumber}
                    onChange={(e) => setLocalSchool({ ...localSchool, classNumber: e.target.value })}
                    placeholder="반"
                    className="bg-card text-foreground rounded-xl"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Timetable Tab */}
          <TabsContent value="timetable" className="mt-4">
            <ScrollArea className="h-[380px] pr-2">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-primary/10">
                      <th className="border border-border px-3 py-2 text-sm font-bold text-primary">교시</th>
                      {DAYS.map((day) => (
                        <th key={day} className="border border-border px-3 py-2 text-sm font-bold text-primary">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Math.max(...DAYS.map(d => (localTimetable[d] || []).length), 6) }, (_, i) => (
                      <tr key={i} className="bg-card hover:bg-muted/30">
                        <td className="border border-border px-3 py-2 text-center text-sm font-semibold text-foreground">
                          {i + 1}
                        </td>
                        {DAYS.map((day) => (
                          <td key={`${day}-${i}`} className="border border-border px-2 py-1">
                            <Input
                              value={(localTimetable[day] || [])[i] || ""}
                              onChange={(e) => {
                                if (!localTimetable[day]) {
                                  setLocalTimetable(prev => ({ ...prev, [day]: [] }))
                                }
                                handleSubjectChange(day, i, e.target.value)
                              }}
                              className="h-8 w-full text-center text-sm bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                              placeholder="-"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setLocalTimetable(prev => {
                        const updated = { ...prev }
                        DAYS.forEach(day => {
                          updated[day] = [...(updated[day] || []), ""]
                        })
                        return updated
                      })
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {"교시 추가"}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="mt-4">
            <div className="flex items-end gap-2 mb-4">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">{"날짜"}</Label>
                <Input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="h-9 text-sm bg-card text-foreground rounded-lg"
                />
              </div>
              <div className="w-28">
                <Label className="text-xs text-muted-foreground mb-1 block">{"시간"}</Label>
                <Input
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  className="h-9 text-sm bg-card text-foreground rounded-lg"
                  placeholder="ex) 2교시"
                />
              </div>
              <div className="flex-[2]">
                <Label className="text-xs text-muted-foreground mb-1 block">{"행사명"}</Label>
                <Input
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="h-9 text-sm bg-card text-foreground rounded-lg"
                  placeholder="행사명 입력"
                  onKeyDown={(e) => { if (e.key === "Enter") addEvent() }}
                />
              </div>
              <Button size="sm" className="h-9 bg-primary text-primary-foreground rounded-lg shadow-sm" onClick={addEvent}>
                <Plus className="h-4 w-4 mr-1" />
                {"추가"}
              </Button>
            </div>

            <Separator className="mb-3" />

            <ScrollArea className="h-[300px] pr-2">
              <div className="flex flex-col gap-1.5">
                {Object.entries(localEvents)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([dk, events]) =>
                    events.map((ev, i) => (
                      <div
                        key={`${dk}-${i}`}
                        className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-muted-foreground">{dk}</span>
                          <span className="text-sm text-foreground">{ev}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeEvent(dk, i)}
                          aria-label="행사 삭제"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                {Object.keys(localEvents).length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    {"등록된 행사가 없습니다."}
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Display Settings Tab */}
          <TabsContent value="display" className="mt-4">
            <div className="flex flex-col gap-6">
              {/* Font Size */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Type className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">{"글꼴 크기"}</Label>
                </div>
                <div className="flex gap-2">
                  {([
                    { value: "small", label: "작게", desc: "13px" },
                    { value: "medium", label: "보통", desc: "15px" },
                    { value: "large", label: "크게", desc: "17px" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setLocalDisplay({ ...localDisplay, fontSize: opt.value })}
                      className={cn(
                        "flex-1 rounded-xl border-2 px-4 py-3 text-center transition-all",
                        localDisplay.fontSize === opt.value
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border bg-card hover:border-primary/30"
                      )}
                    >
                      <span className={cn(
                        "block font-semibold",
                        localDisplay.fontSize === opt.value ? "text-primary" : "text-foreground"
                      )}>
                        {opt.label}
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Panel Ratio */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Columns className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">{"창 비율"}</Label>
                </div>
                <div className="flex gap-2">
                  {([
                    { value: "editor-wide", label: "편집 넓게", icon: "2 : 3" },
                    { value: "balanced", label: "균등", icon: "1 : 1" },
                    { value: "preview-wide", label: "결과 넓게", icon: "3 : 2" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setLocalDisplay({ ...localDisplay, panelRatio: opt.value })}
                      className={cn(
                        "flex-1 rounded-xl border-2 px-3 py-3 text-center transition-all",
                        localDisplay.panelRatio === opt.value
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border bg-card hover:border-primary/30"
                      )}
                    >
                      <span className={cn(
                        "block text-xs font-bold font-mono",
                        localDisplay.panelRatio === opt.value ? "text-primary" : "text-muted-foreground"
                      )}>
                        {opt.icon}
                      </span>
                      <span className={cn(
                        "block text-xs mt-1",
                        localDisplay.panelRatio === opt.value ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleCancel} className="bg-transparent text-foreground rounded-xl">
            {"취소"}
          </Button>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground rounded-xl shadow-md">
            {"저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
