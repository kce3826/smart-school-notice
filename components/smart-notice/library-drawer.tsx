"use client"

import React, { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Star, Bus, Heart, ShieldAlert, HardHat, UserCheck, Target, Plus, Trash2, Edit2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface LibraryDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsertPhrase: (phrase: string) => void
  favorites: string[]
  setFavorites: React.Dispatch<React.SetStateAction<string[]>>
  onToggleFavorite: (phrase: string) => void
}

interface CategoryData {
  icon: React.ReactNode
  label: string
  phrases: string[]
}

const iconMap: Record<string, React.ReactNode> = {
  bus: <Bus className="h-4 w-4" />,
  heart: <Heart className="h-4 w-4" />,
  shield: <ShieldAlert className="h-4 w-4" />,
  hat: <HardHat className="h-4 w-4" />,
  user: <UserCheck className="h-4 w-4" />,
  target: <Target className="h-4 w-4" />,
}

const defaultCategoryPhrases: Record<string, CategoryData> = {
  traffic: {
    icon: <Bus className="h-4 w-4" />,
    label: "교통안전",
    phrases: [
      "등하교 시 횡단보도에서 좌우를 잘 살핀 후 건너갑니다.",
      "스쿨존에서는 뛰지 않고 천천히 걸어갑니다.",
      "자전거를 탈 때는 반드시 안전모를 착용합니다.",
      "통학 버스에서는 안전벨트를 반드시 착용합니다.",
      "비가 오는 날에는 우산으로 시야가 가려지지 않도록 주의합니다.",
    ],
  },
  life: {
    icon: <Heart className="h-4 w-4" />,
    label: "생활안전",
    phrases: [
      "준비물을 미리 확인하고 꼼꼼하게 챙깁니다.",
      "아침 식사를 꼭 하고 등교합니다.",
      "친구에게 고운 말을 사용합니다.",
      "수업 시간에 바른 자세로 앉아 경청합니다.",
      "정리정돈을 잘 하고 교실을 깨끗이 합니다.",
    ],
  },
  health: {
    icon: <Heart className="h-4 w-4" />,
    label: "건강관리",
    phrases: [
      "손을 자주 씻어 개인위생을 철저히 합니다.",
      "충분한 수면을 취하고 규칙적인 생활을 합니다.",
      "실내외 활동 시 적절한 옷차림을 합니다.",
      "물을 자주 마시며 건강을 챙깁니다.",
      "몸이 아프면 보건실을 방문하거나 선생님께 알립니다.",
    ],
  },
  friendship: {
    icon: <UserCheck className="h-4 w-4" />,
    label: "교우관계",
    phrases: [
      "친구의 이야기를 끝까지 경청합니다.",
      "친구와 다툴 때는 서로 이야기하며 해결합니다.",
      "친구의 좋은 점을 찾아 칭찬합니다.",
      "친구와 함께하는 활동에 적극적으로 참여합니다.",
      "새로운 친구에게 먼저 다가가 인사합니다.",
    ],
  },
  bullying: {
    icon: <ShieldAlert className="h-4 w-4" />,
    label: "학교폭력",
    phrases: [
      "친구를 때리거나 괴롭히는 행동은 절대 하지 않습니다.",
      "친구가 힘들어하면 선생님께 바로 알립니다.",
      "온라인에서도 친구에게 상처 주는 말을 하지 않습니다.",
      "따돌림 없이 모든 친구와 함께 놀이합니다.",
      "학교폭력 신고전화 117을 기억합니다.",
    ],
  },
  safety: {
    icon: <HardHat className="h-4 w-4" />,
    label: "자기관리",
    phrases: [
      "숙제와 과제를 스스로 챙겨서 합니다.",
      "시간을 잘 지키며 약속을 지킵니다.",
      "자신의 물건을 소중히 다루고 관리합니다.",
      "감정이 상할 때는 깊게 숨을 쉬며 진정합니다.",
      "잘못했을 때는 솔직하게 인정하고 사과합니다.",
    ],
  },
}

export function LibraryDrawer({ open, onOpenChange, onInsertPhrase, favorites, setFavorites, onToggleFavorite }: LibraryDrawerProps) {
  const [categories, setCategories] = useState<Record<string, CategoryData>>({})
  const [editingPhraseKey, setEditingPhraseKey] = useState<string | null>(null)
  const [editingPhraseIndex, setEditingPhraseIndex] = useState<number | null>(null)
  const [editingPhraseText, setEditingPhraseText] = useState("")
  const [editingCategoryKey, setEditingCategoryKey] = useState<string | null>(null)
  const [editingCategoryLabel, setEditingCategoryLabel] = useState("")
  const [newPhraseKey, setNewPhraseKey] = useState<string | null>(null)
  const [newPhraseText, setNewPhraseText] = useState("")
  // Favorites editing state
  const [editingFavIndex, setEditingFavIndex] = useState<number | null>(null)
  const [editingFavText, setEditingFavText] = useState("")
  const [addingFavorite, setAddingFavorite] = useState(false)
  const [newFavText, setNewFavText] = useState("")

  // Load categories from localStorage or use defaults
  useEffect(() => {
    const savedCategories = localStorage.getItem("smartnotice_library_categories")
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories))
    } else {
      setCategories(defaultCategoryPhrases)
    }
  }, [])

  // Save categories to localStorage
  useEffect(() => {
    if (Object.keys(categories).length > 0) {
      localStorage.setItem("smartnotice_library_categories", JSON.stringify(categories))
    }
  }, [categories])

  const handleEditPhrase = (categoryKey: string, phraseIndex: number) => {
    setEditingPhraseKey(categoryKey)
    setEditingPhraseIndex(phraseIndex)
    setEditingPhraseText(categories[categoryKey].phrases[phraseIndex])
  }

  const handleSavePhrase = () => {
    if (editingPhraseKey !== null && editingPhraseIndex !== null) {
      setCategories((prev) => ({
        ...prev,
        [editingPhraseKey]: {
          ...prev[editingPhraseKey],
          phrases: prev[editingPhraseKey].phrases.map((p, i) =>
            i === editingPhraseIndex ? editingPhraseText : p
          ),
        },
      }))
      setEditingPhraseKey(null)
      setEditingPhraseIndex(null)
      setEditingPhraseText("")
    }
  }

  const handleDeletePhrase = (categoryKey: string, phraseIndex: number) => {
    setCategories((prev) => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        phrases: prev[categoryKey].phrases.filter((_, i) => i !== phraseIndex),
      },
    }))
  }

  const handleAddPhrase = (categoryKey: string) => {
    if (newPhraseText.trim()) {
      setCategories((prev) => ({
        ...prev,
        [categoryKey]: {
          ...prev[categoryKey],
          phrases: [...prev[categoryKey].phrases, newPhraseText.trim()],
        },
      }))
      setNewPhraseKey(null)
      setNewPhraseText("")
    }
  }

  const handleEditCategory = (categoryKey: string) => {
    setEditingCategoryKey(categoryKey)
    setEditingCategoryLabel(categories[categoryKey].label)
  }

  const handleSaveCategory = () => {
    if (editingCategoryKey !== null && editingCategoryLabel.trim()) {
      setCategories((prev) => ({
        ...prev,
        [editingCategoryKey]: {
          ...prev[editingCategoryKey],
          label: editingCategoryLabel.trim(),
        },
      }))
      setEditingCategoryKey(null)
      setEditingCategoryLabel("")
    }
  }

  const handleDeleteCategory = (categoryKey: string) => {
    setCategories((prev) => {
      const newCategories = { ...prev }
      delete newCategories[categoryKey]
      return newCategories
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent side="right" className="w-[400px] sm:w-[440px]" hideOverlay>
        <SheetHeader>
          <SheetTitle className="text-lg font-bold text-foreground">자동 멘트 입력</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            자주 사용하는 문구를 클릭해서 삽입하세요
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
          <Accordion type="single" collapsible defaultValue="favorites" className="w-full">
            {/* Favorites Section */}
            <AccordionItem value="favorites" className="border-b border-border">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-warning fill-warning" />
                  <span className="text-sm font-semibold text-foreground">즐겨찾기</span>
                  <span className="text-xs text-muted-foreground">({favorites.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-2 pt-2">
                  {favorites.length > 0 ? (
                    favorites.map((phrase, i) => (
                      <div key={i}>
                        {editingFavIndex === i ? (
                          <div className="flex items-start gap-2 rounded-lg border border-warning bg-warning/5 p-2">
                            <Input
                              value={editingFavText}
                              onChange={(e) => setEditingFavText(e.target.value)}
                              className="text-xs flex-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && editingFavText.trim()) {
                                  setFavorites((prev) => prev.map((p, idx) => idx === i ? editingFavText.trim() : p))
                                  setEditingFavIndex(null)
                                  setEditingFavText("")
                                }
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => {
                                if (editingFavText.trim()) {
                                  setFavorites((prev) => prev.map((p, idx) => idx === i ? editingFavText.trim() : p))
                                  setEditingFavIndex(null)
                                  setEditingFavText("")
                                }
                              }}
                            >
                              <Check className="h-3 w-3 text-success" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => {
                                setEditingFavIndex(null)
                                setEditingFavText("")
                              }}
                            >
                              <X className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        ) : (
                          <div className="group flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 transition-all hover:border-warning hover:bg-warning/10 hover:shadow-sm">
                            <button
                              onClick={() => onInsertPhrase(phrase)}
                              className="flex items-start gap-2 flex-1 text-left"
                            >
                              <Star className="h-3.5 w-3.5 mt-0.5 shrink-0 text-warning fill-warning" />
                              <span className="text-xs text-foreground leading-relaxed flex-1">
                                {phrase}
                              </span>
                            </button>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  setEditingFavIndex(i)
                                  setEditingFavText(phrase)
                                }}
                              >
                                <Edit2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => onToggleFavorite(phrase)}
                              >
                                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      {"즐겨찾기가 비어있습니다. 아래에서 추가하거나 항목 편집기에서 별표를 클릭하세요."}
                    </p>
                  )}

                  {/* Add new favorite */}
                  {addingFavorite ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        value={newFavText}
                        onChange={(e) => setNewFavText(e.target.value)}
                        placeholder="새 즐겨찾기 문구를 입력하세요..."
                        className="text-xs flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newFavText.trim()) {
                            setFavorites((prev) => [...prev, newFavText.trim()])
                            setNewFavText("")
                            setAddingFavorite(false)
                          }
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          if (newFavText.trim()) {
                            setFavorites((prev) => [...prev, newFavText.trim()])
                            setNewFavText("")
                            setAddingFavorite(false)
                          }
                        }}
                      >
                        <Check className="h-3 w-3 text-success" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setAddingFavorite(false)
                          setNewFavText("")
                        }}
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 text-xs border-warning/30 text-warning hover:bg-warning/10 hover:border-warning"
                      onClick={() => setAddingFavorite(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {"즐겨찾기 추가"}
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Category Sections */}
            {Object.entries(categories).map(([key, { icon, label, phrases }]) => (
              <AccordionItem key={key} value={key} className="border-b border-border">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="group flex w-full items-center gap-2 text-left">
                    {icon}
                    {editingCategoryKey === key ? (
                      <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={editingCategoryLabel}
                          onChange={(e) => setEditingCategoryLabel(e.target.value)}
                          className="h-7 text-sm flex-1"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={handleSaveCategory}
                        >
                          <Check className="h-3 w-3 text-success" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            setEditingCategoryKey(null)
                            setEditingCategoryLabel("")
                          }}
                        >
                          <X className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm font-semibold text-foreground truncate">{label}</span>
                        <span className="text-xs text-muted-foreground shrink-0">({phrases.length})</span>
                        <div className="flex gap-1 ml-auto shrink-0" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={() => handleEditCategory(key)}
                          >
                            <Edit2 className="h-3 w-3 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={() => handleDeleteCategory(key)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-2 pt-2">
                    {phrases.map((phrase, i) => (
                      <div key={i}>
                        {editingPhraseKey === key && editingPhraseIndex === i ? (
                          <div className="flex items-start gap-2 rounded-lg border border-primary bg-primary/5 p-2">
                            <Input
                              value={editingPhraseText}
                              onChange={(e) => setEditingPhraseText(e.target.value)}
                              className="text-xs flex-1"
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={handleSavePhrase}
                            >
                              <Check className="h-3 w-3 text-success" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => {
                                setEditingPhraseKey(null)
                                setEditingPhraseIndex(null)
                                setEditingPhraseText("")
                              }}
                            >
                              <X className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        ) : (
                          <div className="group flex items-start gap-2 rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm">
                            <button
                              onClick={() => onInsertPhrase(phrase)}
                              className="flex items-start gap-2 flex-1 text-left"
                            >
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground">
                                {i + 1}
                              </span>
                              <span className="text-xs text-foreground leading-relaxed flex-1">
                                {phrase}
                              </span>
                            </button>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleEditPhrase(key, i)}
                              >
                                <Edit2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleDeletePhrase(key, i)}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add new phrase */}
                    {newPhraseKey === key ? (
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          value={newPhraseText}
                          onChange={(e) => setNewPhraseText(e.target.value)}
                          placeholder="새 멘트를 입력하세요..."
                          className="text-xs flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleAddPhrase(key)
                            }
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleAddPhrase(key)}
                        >
                          <Check className="h-3 w-3 text-success" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setNewPhraseKey(null)
                            setNewPhraseText("")
                          }}
                        >
                          <X className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 text-xs"
                        onClick={() => setNewPhraseKey(key)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        멘트 추가
                      </Button>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
