import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const SERVICE_ACCOUNT_PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

async function getSheetsClient() {
  if (!SPREADSHEET_ID || !SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_PRIVATE_KEY) {
    throw new Error("Google Sheets 연동 환경변수(GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)가 설정되어 있지 않습니다.")
  }

  const auth = new google.auth.JWT(
    SERVICE_ACCOUNT_EMAIL,
    undefined,
    SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/spreadsheets"]
  )

  const sheets = google.sheets({ version: "v4", auth })
  return sheets
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userName, dateKey, items, timetable } = body as {
      userName?: string
      dateKey?: string
      items?: unknown
      timetable?: unknown
    }

    if (!userName || !dateKey) {
      return NextResponse.json(
        { error: "userName과 dateKey는 필수입니다." },
        { status: 400 }
      )
    }

    const sheets = await getSheetsClient()

    const now = new Date().toISOString()

    const row = [
      userName,
      dateKey,
      JSON.stringify(items ?? []),
      JSON.stringify(timetable ?? []),
      now,
    ]

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID!,
      range: "Sheet1!A:E",
      valueInputOption: "RAW",
      requestBody: {
        values: [row],
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[save-notice] Google Sheets 저장 중 오류:", error)
    return NextResponse.json(
      { error: "알림장을 구글 시트에 저장하는 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

