import { NextRequest, NextResponse } from "next/server"
import { translate } from "google-translate-api-browser"

export async function POST(req: NextRequest) {
  try {
    const { text, to } = await req.json()

    if (!text || !to) {
      return NextResponse.json(
        { error: "text와 to(목표 언어 코드)는 필수입니다." },
        { status: 400 }
      )
    }

    // 문자열 배열이 온 경우 하나의 문자열로 합치기
    const joined =
      Array.isArray(text) && text.length > 0 ? text.join("\n") : String(text)

    // 중국어/필리핀어 등은 Google 번역 코드에 맞게 매핑
    const targetLang =
      to === "zh"
        ? "zh-CN"
        : to === "fil"
          ? "tl"
          : to

    const result = await translate(joined, { to: targetLang })

    return NextResponse.json(
      {
        text: result.text,
        detectedSourceLang: result.from?.language?.iso ?? null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[translate-api] 번역 중 오류:", error)
    return NextResponse.json(
      { error: "번역에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    )
  }
}

