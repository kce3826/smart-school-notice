"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Star,
  Trash2,
  Plus,
  GripVertical,
  Languages,
  MessageCircle,
  Library,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export interface NoticeItem {
  id: string
  text: string
  isImportant: boolean
}

type ToneMode = "haeyo" | "habnida" | "handa" | "hagi"

interface NoticeEditorProps {
  items: NoticeItem[]
  setItems: React.Dispatch<React.SetStateAction<NoticeItem[]>>
  onInsertPhrase: (phrase: string) => void
  onOpenLibrary: () => void
  favorites: string[]
  onToggleFavorite: (phrase: string) => void
  isLocked: boolean
}

const TOP5_LANGUAGES = [
  { code: "vi", label: "베트남어" },
  { code: "zh", label: "중국어" },
  { code: "fil", label: "필리핀어" },
  { code: "th", label: "태국어" },
  { code: "ja", label: "일본어" },
  { code: "en", label: "영어" },
]

export function NoticeEditor({ items, setItems, onInsertPhrase, onOpenLibrary, favorites, onToggleFavorite, isLocked }: NoticeEditorProps) {
  const [toneMode, setToneMode] = useState<ToneMode>("haeyo")
  const [selectedLangs, setSelectedLangs] = useState<string[]>([])
  const [isTranslating, setIsTranslating] = useState(false)
  const inputRefs = useCallback((el: HTMLInputElement | null, id: string) => {
    // Store ref for cursor position tracking
  }, [])

  const convertTone = useCallback((tone: ToneMode) => {
    // All known endings grouped by root meaning
    // Each group: [해요체, 합니다체, 한다체, 하기체]
    const endingGroups = [
      ["해요", "합니다", "한다", "하기"],
      ["이에요", "입니다", "이다", "이기"],
      ["돼요", "됩니다", "된다", "되기"],
      ["가요", "갑니다", "간다", "가기"],
      ["와요", "옵니다", "온다", "오기"],
      ["봐요", "봅니다", "본다", "보기"],
      ["줘요", "줍니다", "준다", "주기"],
      ["써요", "씁니다", "쓴다", "쓰기"],
      ["해 주세요", "해 주십시오", "해 준다", "해 주기"],
      ["세요", "십시오", "한다", "하기"],
      ["어요", "습니다", "는다", "기"],
      ["아요", "습니다", "는다", "기"],
      ["여요", "십니다", "인다", "이기"],
      ["겠어요", "겠습니다", "겠다", "겠기"],
      ["았어요", "았습니다", "았다", "았기"],
      ["었어요", "었습니다", "었다", "었기"],
      ["예요", "입니다", "이다", "이기"],
      ["네요", "네다", "네", "네"],
      ["나요", "납니다", "난다", "나기"],
      ["져요", "집니다", "진다", "지기"],
      ["려요", "립니다", "린다", "리기"],
      ["놔요", "놉니다", "논다", "놓기"],
      ["먹어요", "먹습니다", "먹는다", "먹기"],
      ["살펴요", "살핍니다", "살핀다", "살피기"],
      ["걸어요", "걸읍니다", "걷는다", "걷기"],
      ["챙겨요", "챙깁니다", "챙긴다", "챙기기"],
      ["지켜요", "지킵니다", "지킨다", "지키기"],
      ["마셔요", "마십니다", "마신다", "마시기"],
      ["알려요", "알립니다", "알린다", "알리기"],
      ["참여해요", "참여합니다", "참여한다", "참여하기"],
      ["착용해요", "착용합니다", "착용한다", "착용하기"],
      ["인정해요", "인정합니다", "인정한다", "인정하기"],
      ["기억해요", "기억합니다", "기억한다", "기억하기"],
    ]

    const toneIndex: Record<ToneMode, number> = {
      haeyo: 0,
      habnida: 1,
      handa: 2,
      hagi: 3,
    }

    const targetIdx = toneIndex[tone]

    setItems((prev) =>
      prev.map((item) => {
        if (!item.text.trim()) return item
        let converted = item.text.replace(/\.+$/, "") // Remove trailing dots

        let matched = false
        // Try longer endings first (sort groups by length of each ending, descending)
        const sortedGroups = [...endingGroups].sort((a, b) => {
          const maxA = Math.max(...a.map((e) => e.length))
          const maxB = Math.max(...b.map((e) => e.length))
          return maxB - maxA
        })

        for (const group of sortedGroups) {
          for (let srcIdx = 0; srcIdx < group.length; srcIdx++) {
            const ending = group[srcIdx]
            if (converted.endsWith(ending)) {
              converted = converted.slice(0, converted.length - ending.length) + group[targetIdx]
              matched = true
              break
            }
          }
          if (matched) break
        }

        return { ...item, text: converted + "." }
      })
    )
  }, [setItems])

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: "", isImportant: false },
    ])
  }, [setItems])

  const updateItemText = useCallback(
    (id: string, text: string) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, text } : item))
      )
    },
    [setItems]
  )

  const toggleImportant = useCallback(
    (id: string) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isImportant: !item.isImportant } : item
        )
      )
    },
    [setItems]
  )

  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((item) => item.id !== id))
    },
    [setItems]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addItem()
    }
  }

  const toggleLang = (code: string) => {
    setSelectedLangs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const handleTranslate = async (code: string) => {
    if (isTranslating) return
    const nonEmptyItems = items.filter((item) => item.text.trim() !== "")
    if (nonEmptyItems.length === 0) {
      toast.info("번역할 알림장 내용이 없습니다.")
      return
    }

    try {
      setIsTranslating(true)

      const texts = items.map((item) => item.text)
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: texts,
          to: code,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "번역 요청 중 오류가 발생했습니다.")
      }

      const translatedLines =
        typeof data.text === "string" ? data.text.split("\n") : []

      setItems((prev) =>
        prev.map((item, index) => {
          const translated = translatedLines[index]
          if (!translated || !translated.trim()) {
            return item
          }
          return {
            ...item,
            text: translated,
          }
        })
      )

      toast.success("알림장 내용이 선택한 언어로 번역되었습니다.")
    } catch (error) {
      console.error(error)
      toast.error("번역에 실패했습니다. 잠시 후 다시 시도해주세요.")
    } finally {
      setIsTranslating(false)
    }
  }

  return (
    <Card className="h-full flex flex-col border-border shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            {"항목 편집"}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="text-xs bg-primary/5 text-primary hover:bg-primary/10 border-primary/30 rounded-xl shadow-sm h-8 px-3"
            onClick={onOpenLibrary}
            disabled={isLocked}
          >
            <Library className="h-3.5 w-3.5 mr-1.5" />
            {"자동 멘트 입력"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden px-4 pb-4">
        {/* Items list */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 transition-all shadow-sm",
                item.isImportant
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-card hover:shadow-md"
              )}
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 cursor-grab" />
              <span className="text-xs font-semibold text-muted-foreground w-4 shrink-0 text-center">
                {index + 1}
              </span>
              <Input
                value={item.text}
                onChange={(e) => updateItemText(item.id, e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`${index + 1}번 항목 입력...`}
                className="flex-1 border-0 bg-transparent shadow-none px-0 text-sm h-8 focus-visible:ring-0 placeholder:text-muted-foreground/40"
                disabled={isLocked}
              />
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-6 w-6 shrink-0",
                  favorites.includes(item.text)
                    ? "text-warning hover:text-warning"
                    : item.isImportant
                      ? "text-primary hover:text-primary"
                      : "text-muted-foreground/30 hover:text-warning"
                )}
                onClick={() => {
                  if (item.text.trim()) {
                    onToggleFavorite(item.text)
                  }
                }}
                aria-label="즐겨찾기 추가/제거"
                disabled={isLocked}
              >
                <Star className="h-3.5 w-3.5" fill={favorites.includes(item.text) ? "currentColor" : "none"} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground/30 hover:text-destructive"
                onClick={() => removeItem(item.id)}
                aria-label="항��� 삭제"
                disabled={isLocked}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary bg-transparent rounded-xl"
            onClick={addItem}
            disabled={isLocked}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {"항목 추가"}
          </Button>
        </div>

        <Separator />

        {/* Tone selection - buttons */}
        <div className="flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold text-foreground">{"말투 변환"}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {([
              { value: "haeyo", label: "~해요" },
              { value: "habnida", label: "~합니다" },
              { value: "handa", label: "~한다" },
              { value: "hagi", label: "~하기" },
            ] as const).map((opt) => (
              <Button
                key={opt.value}
                variant={toneMode === opt.value ? "default" : "outline"}
                size="sm"
                className={cn(
                  "text-xs px-2 py-1 h-7 rounded-lg",
                  toneMode === opt.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-transparent text-foreground"
                )}
                onClick={() => {
                  setToneMode(opt.value)
                  convertTone(opt.value)
                }}
                disabled={isLocked}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Multilingual - TOP5 buttons */}
        <div className="flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Languages className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold text-foreground">{"다국어 번역"}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TOP5_LANGUAGES.map((lang) => (
              <Button
                key={lang.code}
                variant={selectedLangs.includes(lang.code) ? "default" : "outline"}
                size="sm"
                className={cn(
                  "text-xs px-2.5 py-1 h-7 rounded-lg",
                  selectedLangs.includes(lang.code)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-transparent text-foreground"
                )}
                onClick={async () => {
                  // 상단 주요 언어는 단일 선택으로 동작
                  setSelectedLangs([lang.code])
                  // 영어(en), 중국어(zh), 베트남어(vi), 필리핀어(fil), 일본어(ja), 태국어(th)는 즉시 번역 실행
                  if (["en", "zh", "vi", "fil", "ja", "th"].includes(lang.code)) {
                    await handleTranslate(lang.code)
                  } else {
                    toast.info("현재는 영어, 중국어, 베트남어, 필리핀어, 일본어, 태국어 번역만 지원합니다.")
                  }
                }}
                disabled={isLocked || isTranslating}
              >
                {lang.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
