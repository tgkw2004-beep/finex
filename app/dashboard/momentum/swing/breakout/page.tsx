"use client"

import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { StockTable } from "@/components/dashboard/stock-table"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const stocks = [
  { name: "CJ제일제당", code: "097950", price: "328,500", change: "+15,500", changePercent: "+4.95%", isPositive: true, volume: "0.3M", marketCap: "6.3조" },
  { name: "아모레퍼시픽", code: "090430", price: "128,500", change: "+5,500", changePercent: "+4.47%", isPositive: true, volume: "0.4M", marketCap: "7.5조" },
  { name: "롯데케미칼", code: "011170", price: "98,200", change: "+4,200", changePercent: "+4.47%", isPositive: true, volume: "0.5M", marketCap: "3.4조" },
]

export default function BreakoutPage() {
  return (
    <div>
      <div className="mb-4">
        <Link href="/dashboard/momentum">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            모멘텀 전략으로 돌아가기
          </Button>
        </Link>
      </div>
      <AnalysisHeader title="박스권돌파 전략" description="횡보 구간을 상단 돌파한 종목을 탐지합니다" />
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">돌파 종목</div>
            <div className="text-2xl font-bold text-green-500">11</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">평균 돌파율</div>
            <div className="text-2xl font-bold text-primary">+4.6%</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">거래량 증가</div>
            <div className="text-2xl font-bold">+180%</div>
          </Card>
        </div>
        <div>
          <h2 className="mb-4 text-xl font-semibold">박스권 돌파 종목</h2>
          <StockTable stocks={stocks} />
        </div>
      </div>
    </div>
  )
}
