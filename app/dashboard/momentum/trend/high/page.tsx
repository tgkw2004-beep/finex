"use client"

import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { StockTable } from "@/components/dashboard/stock-table"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const stocks = [
  { name: "HD현대일렉트릭", code: "267260", price: "128,500", change: "+6,500", changePercent: "+5.33%", isPositive: true, volume: "1.5M", marketCap: "7.3조" },
  { name: "LS ELECTRIC", code: "010120", price: "168,500", change: "+7,500", changePercent: "+4.66%", isPositive: true, volume: "0.4M", marketCap: "5.1조" },
  { name: "효성중공업", code: "298040", price: "285,000", change: "+12,000", changePercent: "+4.40%", isPositive: true, volume: "0.3M", marketCap: "3.0조" },
]

export default function HighPage() {
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
      <AnalysisHeader title="신고가 전략" description="52주 신고가를 돌파한 강한 모멘텀 종목을 탐지합니다" />
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">신고가 종목</div>
            <div className="text-2xl font-bold text-green-500">18</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">평균 돌파율</div>
            <div className="text-2xl font-bold text-primary">+3.8%</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">추가 상승 확률</div>
            <div className="text-2xl font-bold">74%</div>
          </Card>
        </div>
        <div>
          <h2 className="mb-4 text-xl font-semibold">52주 신고가 종목</h2>
          <StockTable stocks={stocks} />
        </div>
      </div>
    </div>
  )
}
