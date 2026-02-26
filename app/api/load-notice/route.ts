import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const SERVICE_ACCOUNT_PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

async function getSheetsClient() {
  if (!SPREADSHEET_ID || !SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_PRIVATE_KEY) {
    throw new Error(
      "Google Sheets 연동 환경변수(GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)가 설정되어 있지 않습니다."
    )
  }

  const auth = new google.auth.JWT(
    SERVICE_ACCOUNT_EMAIL,
    undefined,
    SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/spreadsheets"]
  )

  return google.sheets({ version: "v4", auth })
}

type Row = [string, string, string, string, string]

export async function POST(req: NextRequest) {
  try {
    const { userName, dateKey } = (await req.json()) as {
      userName?: string
      dateKey?: string
    }

    if (!userName || !dateKey) {
      return NextResponse.json(
        { error: "userName과 dateKey는 필수입니다." },
        { status: 400 }
      )
    }

    const sheets = await getSheetsClient()

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID!,
      range: "Sheet1!A:E",
    })

    const values = (res.data.values ?? []) as string[][]

    // 뒤에서부터(최신) 찾아서 같은 닉네임+날짜의 마지막 저장본을 반환
    for (let i = values.length - 1; i >= 0; i--) {
      const row = values[i] as unknown as Row
      if (!row || row.length < 2) continue
      if (row[0] !== userName) continue
      if (row[1] !== dateKey) continue

      let items: unknown = []
      let timetable: unknown = []

      try {
        items = row[2] ? JSON.parse(row[2]) : []
      } catch {}
      try {
        timetable = row[3] ? JSON.parse(row[3]) : []
      } catch {}

      return NextResponse.json({
        ok: true,
        items,
        timetable,
        savedAt: row[4] ?? null,
      })
    }

    return NextResponse.json({ ok: false, notFound: true })
  } catch (error) {
    console.error("[load-notice] Google Sheets 불러오기 오류:", error)
    return NextResponse.json(
      { error: "구글 시트에서 알림장을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

