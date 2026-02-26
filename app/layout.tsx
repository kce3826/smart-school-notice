import React from "react"
import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR, Noto_Sans } from 'next/font/google'
import { Toaster } from "@/components/ui/sonner"

import './globals.css'

const notoSansKR = Noto_Sans_KR({ subsets: ['latin'], variable: '--font-sans' })
const notoSans = Noto_Sans({ subsets: ['latin'], variable: '--font-body' })

export const metadata: Metadata = {
  title: '스마트 알림장 - 초등 교사 협업 플랫폼',
  description: '초등 교사를 위한 스마트 알림장 협업 플랫폼. 알림장 작성, 다국어 번역, 예시 멘트 등 다양한 기능을 제공합니다.',
}

export const viewport: Viewport = {
  themeColor: '#e8845a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKR.variable} ${notoSans.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
