"use client"

import { AnalysisHeader } from "@/components/dashboard/analysis-header"
import { Card } from "@/components/ui/card"
import { StockTable } from "@/components/dashboard/stock-table"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const stocks = [
  { name: "삼성바이오로직스", code: "207940", price: "825,000", change: "+18,000", changePercent: "+2.23%", isPositive: true, volume: "0.2M", marketCap: "58.7조" },
  { name: "현대차", code: "005380", price: "192,500", change: "+3,500", changePercent: "+1.85%", isPositive: true, volume: "0.8M", marketCap: "40.7조" },
  { name: "기아", code: "000270", price: "93,800", change: "+1,800", changePercent: "+1.96%", isPositive: true, volume: "1.2M", marketCap: "38.0조" },
]

export default function UptrendPage() {
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
      <AnalysisHeader title="장기상승 전략" description="6개월 이상 상승 추세를 유지하는 종목을 탐지합니다" />
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">장기 상승</div>
            <div className="text-2xl font-bold text-green-500">22</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">평균 상승률</div>
            <div className="text-2xl font-bold text-primary">+45.8%</div>
          </Card>
          <Card className="p-4">
            <div className="mb-1 text-sm text-muted-foreground">추세 유지 기간</div>
            <div className="text-2xl font-bold">8.2개월</div>
          </Card>
        </div>
        <div>
          <h2 className="mb-4 text-xl font-semibold">장기 상승 추세 종목</h2>
          <StockTable stocks={stocks} />
        </div>
      </div>
    </div>
  )
}
